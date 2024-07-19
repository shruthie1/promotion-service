"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.react = react;
const telegram_1 = require("telegram");
const users_1 = require("telegram/client/users");
const Helpers_1 = require("telegram/Helpers");
const fetchWithTimeout_1 = require("./fetchWithTimeout");
const parseError_1 = require("./parseError");
const ReactQueue_1 = require("./ReactQueue");
const utils_1 = require("./utils");
const standardEmoticons = ['👍', '❤', '🔥', '👏', '🥰', '😁'];
const emoticons = [
    '❤', '🔥', '👏', '🥰', '😁', '🤔',
    '🤯', '😱', '🤬', '😢', '🎉', '🤩',
    '🤮', '💩', '🙏', '👌', '🕊', '🤡',
    '🥱', '🥴', '😍', '🐳', '❤‍🔥', '💯',
    '🤣', '💔', '🏆', '😭', '😴', '👍',
    '🌚', '⚡', '🍌', '😐', '💋', '👻',
    '👀', '🙈', '🤝', '🤗', '🆒',
    '🗿', '🙉', '🙊', '🤷', '👎'
];
const standardReactions = standardEmoticons.map(emoticon => new telegram_1.Api.ReactionEmoji({ emoticon }));
let defaultReactions = emoticons.map(emoticon => new telegram_1.Api.ReactionEmoji({ emoticon }));
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
];
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
const maxWaitTime = 25000;
let reactSleepTime = 17000;
let floodTriggeredTime = 0;
let floodCount = 0;
let targetReactionDelay = 17000;
function react(event) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const chatId = event.message.chatId.toString();
        const reactQueue = ReactQueue_1.ReactQueue.getInstance();
        try {
            if (!chatReactionsCache.has(chatId) && flag2) {
                flag2 = false;
                try {
                    const result = yield event.client.invoke(new telegram_1.Api.channels.GetFullChannel({ channel: event.chatId }));
                    const reactionsJson = (_b = (_a = result === null || result === void 0 ? void 0 : result.fullChat) === null || _a === void 0 ? void 0 : _a.availableReactions) === null || _b === void 0 ? void 0 : _b.toJSON();
                    const availableReactions = reactionsJson === null || reactionsJson === void 0 ? void 0 : reactionsJson.reactions;
                    if (availableReactions && (availableReactions.length > 3 || availableReactions.length > defaultReactions.length)) {
                        defaultReactions = availableReactions;
                    }
                    if ((!availableReactions || availableReactions.length < 1) && defaultReactions.length > 1) {
                        chatReactionsCache.set(chatId, defaultReactions);
                    }
                    else {
                        chatReactionsCache.set(chatId, availableReactions);
                    }
                }
                catch (error) {
                    (0, parseError_1.parseError)(error, "Fetching Reactions", false);
                    if (defaultReactions.length > 1) {
                        chatReactionsCache.set(chatId, defaultReactions);
                    }
                }
                finally {
                    flag2 = true;
                }
                yield (0, Helpers_1.sleep)(3000);
            }
            if (flag && waitReactTime < Date.now() && !reactQueue.contains(chatId) && !(0, utils_1.contains)(chatId, reactRestrictedIds)) {
                flag = false;
                const availableReactions = chatReactionsCache.get(chatId);
                if (availableReactions && availableReactions.length > 0) {
                    const reactionIndex = Math.floor(Math.random() * availableReactions.length);
                    const reaction = [availableReactions[reactionIndex]];
                    waitReactTime = Date.now() + reactSleepTime;
                    try {
                        const MsgClass = new telegram_1.Api.messages.SendReaction({
                            peer: event.message.chat,
                            msgId: event.message.id,
                            reaction: reaction
                        });
                        yield event.client.invoke(MsgClass);
                        const reactionDelay = Math.min(Date.now() - lastReactedtime, 25000);
                        lastReactedtime = Date.now();
                        totalReactionDelay += reactionDelay;
                        successfulReactions += 1;
                        averageReactionDelay = Math.floor(totalReactionDelay / successfulReactions);
                        if (averageReactionDelay < targetReactionDelay) {
                            reactSleepTime = Math.min(reactSleepTime + 200, maxWaitTime);
                        }
                        else {
                            if (Date.now() > (floodTriggeredTime + 600000) && floodCount < 3) {
                                reactSleepTime = Math.max(reactSleepTime - 50, minWaitTime);
                            }
                        }
                        const chatEntity = yield (0, users_1.getEntity)(event.client, chatId);
                        console.log("Reacted Successfully, Average Reaction Delay:", averageReactionDelay, "ms", (_c = reaction[0]) === null || _c === void 0 ? void 0 : _c.toJSON().emoticon, chatEntity === null || chatEntity === void 0 ? void 0 : chatEntity.toJSON().title, chatEntity === null || chatEntity === void 0 ? void 0 : chatEntity.toJSON().username);
                        reactQueue.push(chatId);
                    }
                    catch (error) {
                        if (error.seconds) {
                            waitReactTime = Date.now() + (error.seconds * 1001);
                            // if (floodTriggeredTime == 0 || floodTriggeredTime > (Date.now() - 30 * 60 * 1000)) {
                            // }
                            minWaitTime = Math.floor(minWaitTime + (error.seconds * 3));
                            reactSleepTime = 17000;
                            targetReactionDelay = targetReactionDelay + 500;
                            floodTriggeredTime = Date.now();
                            floodCount++;
                            // await fetchWithTimeout(`${notifbot}&text=${process.env.clientId?.toUpperCase()}: Reaction Flood: sleeping for ${error.seconds}`);
                        }
                        else {
                            if (error.errorMessage == "REACTION_INVALID") {
                                availableReactions.splice(reactionIndex, 1);
                                chatReactionsCache.set(chatId, availableReactions);
                            }
                            const chatEntity = yield (0, users_1.getEntity)(event.client, chatId);
                            console.log('Failed to React:', (_d = reaction[0]) === null || _d === void 0 ? void 0 : _d.toJSON().emoticon, chatEntity === null || chatEntity === void 0 ? void 0 : chatEntity.toJSON().username, error.errorMessage);
                        }
                    }
                    flag = true;
                }
                else {
                    chatReactionsCache.set(chatId, defaultReactions);
                    flag = true;
                }
            }
            else {
                if (lastReactedtime < Date.now() - 60000 && (!flag || reactQueue.contains(chatId)) && reactionsRestarted < Date.now() - 30000) {
                    flag = true;
                    reactionsRestarted = Date.now();
                    console.log("Restarted Reactions", flag, waitReactTime < Date.now(), !reactQueue.contains(chatId), !(0, utils_1.contains)(chatId, reactRestrictedIds));
                }
                // if (lastReactedtime < Date.now() - 240000) {
                //     const chatEntity = <Api.Channel>await getEntity(event.client, chatId);
                //     console.log("Restarted not working Reactions", flag, waitReactTime < Date.now(), !reactQueue.contains(chatId), !isLimitReached, !contains(chatId, reactRestrictedIds), chatId, chatEntity?.toJSON().username, chatEntity?.toJSON().title);
                // }
                if (lastReactedtime < Date.now() - 240000 && lastNotifiedTime < Date.now() - 5 * 60 * 1000) {
                    lastNotifiedTime = Date.now();
                    yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${utils_1.ppplbot}&text=@${(process.env.clientId).toUpperCase()}: Reactions Not working: ${flag}|${waitReactTime < Date.now()}|${!reactQueue.contains(chatId)}|${!(0, utils_1.contains)(chatId, reactRestrictedIds)}|${(_e = chatReactionsCache.get(chatId)) === null || _e === void 0 ? void 0 : _e.length} since: ${Math.floor((Date.now() - lastReactedtime) / 1000)}`);
                    console.log("Restarted Reactions", flag, waitReactTime < Date.now(), !reactQueue.contains(chatId), !(0, utils_1.contains)(chatId, reactRestrictedIds));
                }
            }
        }
        catch (error) {
            (0, parseError_1.parseError)(error, "Reaction Error");
            flag = true;
            flag2 = true;
        }
    });
}
