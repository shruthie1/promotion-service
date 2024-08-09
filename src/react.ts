import { Api } from "telegram";
import { getEntity } from "telegram/client/users";
import { NewMessageEvent } from "telegram/events";
import { sleep } from "telegram/Helpers";
import { fetchWithTimeout } from "./fetchWithTimeout";
import { parseError } from "./parseError";
import { ReactQueue } from "./ReactQueue";
import { contains, ppplbot, startNewUserProcess } from "./utils";
import TelegramManager from "./TelegramManager";

export function getReactSleepTime() {
    return reactSleepTime;
}

export function getLastReactTime() {
    return lastReactedtime;
}

export function getAverageReactionDelay() {
    return Math.floor(averageReactionDelay);
}

export function getTotalReactions() {
    return Math.floor(successfulReactions);
}

export function getTotalFloodcount() {
    return floodCount;
}

export function getMinWaitTime() {
    return minWaitTime;
}

export function getTargetReactionDelay() {
    return targetReactionDelay;
}

export async function getMe() {
    return (await TelegramManager.client.getMe()).username;
}

const standardEmoticons = ['👍', '❤', '🔥', '👏', '🥰', '😁']
const emoticons = [
    '❤', '🔥', '👏', '🥰', '😁', '🤔',
    '🤯', '😱', '🤬', '😢', '🎉', '🤩',
    '🤮', '💩', '🙏', '👌', '🕊', '🤡',
    '🥱', '🥴', '😍', '🐳', '❤‍🔥', '💯',
    '🤣', '💔', '🏆', '😭', '😴', '👍',
    '🌚', '⚡', '🍌', '😐', '💋', '👻',
    '👀', '🙈', '🤝', '🤗', '🆒',
    '🗿', '🙉', '🙊', '🤷', '👎'
]
const standardReactions = standardEmoticons.map(emoticon => new Api.ReactionEmoji({ emoticon }));
let defaultReactions = emoticons.map(emoticon => new Api.ReactionEmoji({ emoticon }));

const reactRestrictedIds = ['1798767939',
    process.env.updatesChannel,
    process.env.notifChannel,
    "1703065531", "1972065816", "1949920904",
    "2184447313", "2189566730", "1870673087",
    "1261993766", "1202668523", "1738391281", "1906584870",
    "1399025405", "1868271399", "1843478697", "2113315849", "1937606045",
    "1782145954", "1623008940", "1738135934", "1798503017", "1889233160", "1472089976",
    "1156516733", "1514843822", "2029851294", "2097005513", "1897072643", "1903237199",
    "1807801643", "1956951800", "1970106364", "2028322484", "2135964892", "2045602167",
    "1486096882", "1336087349", "1878652859", "1711250382", "1959564784", "1345564184",
    "1663368151", "1476492615", "1524427911", "1400204596", "1812110874", "1654557420",
    "1765654210", "1860635416", "1675260943", "1730253703", "2030437007", "1213518210",
    "1235057378", "1586912179", "1672828024", "2069091557", "1860671752", "2125364202",
    "1959951200", "1607289097", "1929774605", "1780733848", "1685018515", "2057393918",
    "1887746719", "1916123414", "1970767061", "2057158588"
]


let flag = true;
let flag2 = true;
let waitReactTime = Date.now();
const chatReactionsCache = new Map();
let lastReactedtime = Date.now();
let lastNotifiedTime = Date.now();
let reactionsRestarted = Date.now();
let totalReactionDelay = 0;
let successfulReactions = 0;
let averageReactionDelay = 0;
let minWaitTime = 15000;
const maxWaitTime = 19000;
let reactSleepTime = 17000;
let floodTriggeredTime = 0;
let floodCount = 0;
let targetReactionDelay = 17000;

export async function react(event: NewMessageEvent) {
    const chatId = event.message.chatId.toString();
    const reactQueue = ReactQueue.getInstance();

    try {
        await event.client.connect();
        if (!chatReactionsCache.has(chatId) && flag2) {
            flag2 = false;
            try {
                const result = await event.client.invoke(new Api.channels.GetFullChannel({ channel: event.chatId }));
                const reactionsJson: any = result?.fullChat?.availableReactions?.toJSON();
                const availableReactions: Api.ReactionEmoji[] = reactionsJson?.reactions;

                if (availableReactions && (availableReactions.length > 3 || availableReactions.length > defaultReactions.length)) {
                    defaultReactions = availableReactions;
                }

                if ((!availableReactions || availableReactions.length < 1) && defaultReactions.length > 1) {
                    chatReactionsCache.set(chatId, defaultReactions);
                } else {
                    chatReactionsCache.set(chatId, availableReactions);
                }
            } catch (error) {
                parseError(error, "Fetching Reactions", false);
                if (defaultReactions.length > 1) {
                    chatReactionsCache.set(chatId, defaultReactions);
                }
                await startNewUserProcess(error)
            } finally {
                flag2 = true;
            }
            await sleep(3000);
        }

        if (flag && waitReactTime < Date.now() && !reactQueue.contains(chatId) && !contains(chatId, reactRestrictedIds)) {
            flag = false;
            const availableReactions = chatReactionsCache.get(chatId);

            if (availableReactions && availableReactions.length > 0) {
                const reactionIndex = Math.floor(Math.random() * availableReactions.length);
                const reaction = [availableReactions[reactionIndex]];
                waitReactTime = Date.now() + reactSleepTime;
                try {
                    const MsgClass = new Api.messages.SendReaction({
                        peer: event.message.chat,
                        msgId: event.message.id,
                        reaction: reaction
                    });

                    await event.client.invoke(MsgClass);

                    const reactionDelay = Math.min(Date.now() - lastReactedtime, 25000);
                    lastReactedtime = Date.now();
                    totalReactionDelay += reactionDelay;
                    successfulReactions += 1;
                    averageReactionDelay = Math.floor(totalReactionDelay / successfulReactions);

                    if (averageReactionDelay < targetReactionDelay) {
                        reactSleepTime = Math.min(reactSleepTime + 200, maxWaitTime);
                    } else {
                        if (Date.now() > (floodTriggeredTime + 600000) && floodCount < 3) {
                            reactSleepTime = Math.max(reactSleepTime - 50, minWaitTime);
                        }
                    }

                    const chatEntity = <Api.Channel>await getEntity(event.client, chatId);
                    console.log("Reacted Successfully, Average Reaction Delay:", averageReactionDelay, "ms", reaction[0]?.toJSON().emoticon, chatEntity?.toJSON().title, chatEntity?.toJSON().username);
                    reactQueue.push(chatId);

                } catch (error) {
                    if (error.seconds) {
                        waitReactTime = Date.now() + (error.seconds * 1001);
                        // if (floodTriggeredTime == 0 || floodTriggeredTime > (Date.now() - 30 * 60 * 1000)) {
                        // }
                        minWaitTime = Math.floor(minWaitTime + (error.seconds * 3));
                        reactSleepTime = 17000;
                        targetReactionDelay = targetReactionDelay + 500
                        floodTriggeredTime = Date.now();
                        floodCount++;
                        // await fetchWithTimeout(`${notifbot}&text=${process.env.clientId?.toUpperCase()}: Reaction Flood: sleeping for ${error.seconds}`);
                    } else {
                        if (error.errorMessage == "REACTION_INVALID") {
                            availableReactions.splice(reactionIndex, 1);
                            chatReactionsCache.set(chatId, availableReactions);
                        }
                        const chatEntity = <Api.Channel>await getEntity(event.client, chatId);
                        console.log('Failed to React:', reaction[0]?.toJSON().emoticon, chatEntity?.toJSON().username, error.errorMessage);
                    }
                    await startNewUserProcess(error)
                }
                flag = true;
            } else {
                chatReactionsCache.set(chatId, defaultReactions);
                flag = true;
            }
        } else {
            if (lastReactedtime < Date.now() - 60000 && (!flag || reactQueue.contains(chatId)) && reactionsRestarted < Date.now() - 30000) {
                flag = true;
                reactionsRestarted = Date.now();
                console.log("Restarted Reactions", flag, waitReactTime < Date.now(), !reactQueue.contains(chatId), !contains(chatId, reactRestrictedIds));
            }

            // if (lastReactedtime < Date.now() - 240000) {
            //     const chatEntity = <Api.Channel>await getEntity(event.client, chatId);
            //     console.log("Restarted not working Reactions", flag, waitReactTime < Date.now(), !reactQueue.contains(chatId), !isLimitReached, !contains(chatId, reactRestrictedIds), chatId, chatEntity?.toJSON().username, chatEntity?.toJSON().title);
            // }

            if (lastReactedtime < Date.now() - 240000 && lastNotifiedTime < Date.now() - 5 * 60 * 1000) {
                lastNotifiedTime = Date.now();
                await fetchWithTimeout(`${ppplbot()}&text=@${(process.env.clientId).toUpperCase()}: Reactions Not working: ${flag}|${waitReactTime < Date.now()}|${!reactQueue.contains(chatId)}|${!contains(chatId, reactRestrictedIds)}|${chatReactionsCache.get(chatId)?.length} since: ${Math.floor((Date.now() - lastReactedtime) / 1000)}`);
                console.log("Restarted Reactions", flag, waitReactTime < Date.now(), !reactQueue.contains(chatId), !contains(chatId, reactRestrictedIds));
            }
        }
    } catch (error) {
        parseError(error, "Reaction Error");
        if(error.errorMessage == 'CONNECTION_NOT_INITED'){
            process.exit(1);
        }
        flag = true;
        flag2 = true;
    }
}
