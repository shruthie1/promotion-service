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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.myChannels = void 0;
exports.logDetails = logDetails;
exports.getChannelInfo = getChannelInfo;
exports.PromoteToGrp = PromoteToGrp;
exports.sendMessageToChannel = sendMessageToChannel;
exports.broadcast = broadcast;
exports.replyUnread = replyUnread;
exports.getIChannelFromTg = getIChannelFromTg;
const utils_1 = require("./utils");
const telegram_1 = require("telegram");
const fetchWithTimeout_1 = require("./fetchWithTimeout");
const parseError_1 = require("./parseError");
const Helpers_1 = require("telegram/Helpers");
const dbservice_1 = require("./dbservice");
const TelegramManager_1 = __importDefault(require("./TelegramManager"));
const messages_1 = require("./messages");
let promoteCount = 0;
let promoting = false;
let promoteFlagCount = 0;
let promoteMsgs = {};
let promotedCount = 0;
let lastMessageTime = Date.now();
exports.myChannels = new Map();
const notifbot = `https://api.telegram.org/bot5856546982:AAEW5QCbfb7nFAcmsTyVjHXyV86TVVLcL_g/sendMessage?chat_id=${process.env.notifChannel}`;
const ppplbot = `https://api.telegram.org/bot6735591051:AAELwIkSHegcBIVv5pf484Pn09WNQj1Nl54/sendMessage?chat_id=${process.env.updatesChannel}`;
function logDetails(level, message, details = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`, details);
}
function fetchDialogs(client) {
    return __awaiter(this, void 0, void 0, function* () {
        const channelIds = [];
        try {
            const dialogs = yield client.getDialogs({ limit: 500 });
            console.log("Dialogs : ", dialogs.length);
            const unreadUserDialogs = [];
            for (const dialog of dialogs) {
                if (dialog.isUser && dialog.unreadCount > 0) {
                    unreadUserDialogs.push(dialog);
                }
                else if (dialog.isChannel || dialog.isGroup) {
                    const chatEntity = dialog.entity.toJSON();
                    const { id, defaultBannedRights, title, broadcast, username, participantsCount, restricted } = chatEntity;
                    if (!broadcast && !(defaultBannedRights === null || defaultBannedRights === void 0 ? void 0 : defaultBannedRights.sendMessages) && !restricted && id && participantsCount > 500) {
                        const channelId = id.toString().replace(/^-100/, "");
                        channelIds.push(channelId);
                    }
                }
            }
            // const result = await db.getActiveChannels({ channelId: { $in: channelIds } })
            // console.log("Channels Set : ", channels.length)
            replyUnread(client, unreadUserDialogs);
        }
        catch (error) {
            (0, parseError_1.parseError)(error, "Failed to fetch channels while promoting");
            yield startNewUserProcess(error);
        }
        return channelIds;
    });
}
function getChannelInfo(channelId) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = dbservice_1.UserDataDtoCrud.getInstance();
        let channelInfo = exports.myChannels.get(channelId);
        if (!channelInfo) {
            const dbChannel = yield db.getActiveChannel({ channelId: channelId });
            if (dbChannel) {
                // console.log("Setting Channel at reactions : ", dbChannel.reactions);
                channelInfo = dbChannel;
                exports.myChannels.set(channelId, channelInfo);
            }
            else {
                const data = yield getIChannelFromTg(channelId);
                yield db.updateActiveChannel({ channelId: channelId }, data);
                channelInfo = data;
                exports.myChannels.set(channelId, Object.assign(Object.assign({}, data), { reactions: utils_1.defaultReactions }));
            }
        }
        return channelInfo;
    });
}
function PromoteToGrp(client) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        promoteCount++;
        logDetails("INFO", `promoteFlagCount: ${promoteFlagCount} || promoting : ${promoting}`);
        // if (client && !promoting && client.connected) {
        //     promoting = true;
        //     setInterval(async () => {
        //         lastMessageTime = Date.now();
        //         const db = UserDataDtoCrud.getInstance();
        //         await db.updatePromoteStats('promote');
        //     }, 200000)
        // }
        if (client && !promoting && client.connected) {
            promoteFlagCount = 0;
            promoting = true;
            promoteCount = 0;
            lastMessageTime = Date.now();
            const db = dbservice_1.UserDataDtoCrud.getInstance();
            yield db.updatePromoteStats('promote');
            try {
                const paidUserStats = yield db.getTodayPaidUsers();
                if (((paidUserStats === null || paidUserStats === void 0 ? void 0 : paidUserStats.total) > 33) || ((paidUserStats === null || paidUserStats === void 0 ? void 0 : paidUserStats.new) > 15)) {
                    (0, parseError_1.parseError)({ message: "Not Proceeding With Promotion as Limit Reached for the day!!" }, "Promotions Stopped");
                    yield db.deactivatePromotions();
                }
                else {
                    const channelIds = yield fetchDialogs(client);
                    logDetails("INFO", `STARTED GROUP PROMOTION: LastTime - ${promotedCount} - ${channelIds.length}`);
                    const promotedStats = yield db.readPromoteStats();
                    promoteMsgs = yield db.getPromoteMsgs();
                    promotedCount = 0;
                    let channelIndex = 0;
                    for (const channelId of channelIds) {
                        if (!client.connected) {
                            yield client.connect();
                        }
                        if (channelIndex >= channelIds.length || promoteCount > 2) {
                            promoting = false;
                            logDetails("WARN", "Force restarting promotions");
                            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${process.env.repl}/promote`);
                            }), 10000);
                            break;
                        }
                        // logDetails("INFO", `TringChannel : ${channel.title} || promoteFlagCount: ${promoteFlagCount}`);
                        try {
                            if (promoteFlagCount > 3) {
                                promoting = false;
                                // logDetails("INFO", `Inside ForceStop`);
                                yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${ppplbot}&text=@${process.env.clientId.toUpperCase()}: PROMOTIONS STOPPED Forcefully to restart again`);
                                yield db.deactivatePromotions();
                                if ((promotedStats === null || promotedStats === void 0 ? void 0 : promotedStats.releaseDay) < Date.now()) {
                                    yield checktghealth(client);
                                }
                                yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${notifbot}&text=@${process.env.clientId.toUpperCase()}: Failed - ${promoteFlagCount} | BROKE PROMOTION`);
                                promoting = false;
                                break;
                            }
                            // logDetails("INFO", `Proceeding to Message`);
                            yield sendPromotionalMessage(channelId, client, false, 0);
                        }
                        catch (error) {
                            logDetails("ERROR", `FAILED: ${channelId === null || channelId === void 0 ? void 0 : channelId.title}`, { error: error.errorMessage });
                        }
                    }
                    ; // Adjust the interval as needed
                }
                logDetails("INFO", "STARTED PROMOTION!!");
            }
            catch (error) {
                (0, parseError_1.parseError)(error, "Promotion Broke: ");
                if ((_a = error.errorMessage) === null || _a === void 0 ? void 0 : _a.toString().includes('AUTH_KEY_DUPLICATED')) {
                    yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${notifbot}&text=@${process.env.clientId.toUpperCase()}: AUTH KEY DUPLICATED`);
                }
            }
            finally {
                // if (promoteCount <= 2) {
                //     await fetchWithTimeout(`${ppplbot}&text=@${process.env.clientId.toUpperCase()}: PROMOTIONS STOPPED Forcefully to restart again`);
                // }
            }
        }
        else {
            logDetails("INFO", "EXISTING PROMOTION!!");
            if (lastMessageTime < Date.now() - 7 * 60 * 1000) {
                promoting = false;
                setTimeout(() => {
                    PromoteToGrp(client);
                }, 10000);
            }
            const db = dbservice_1.UserDataDtoCrud.getInstance();
            const userPromoteStats = yield db.readPromoteStatsTime();
            if ((userPromoteStats === null || userPromoteStats === void 0 ? void 0 : userPromoteStats.isActive) && promoteCount > 2 && (Date.now() - (userPromoteStats === null || userPromoteStats === void 0 ? void 0 : userPromoteStats.lastUpdatedTimeStamp)) / (1000 * 60) > 12) {
                yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${ppplbot}&text=@${process.env.clientId.toUpperCase()}: EXITING AS ERROR AT PROMOTIONS`);
                // process.exit(1);
            }
        }
    });
}
function sendPromotionalMessage(channelId_1, client_1, isLatest_1) {
    return __awaiter(this, arguments, void 0, function* (channelId, client, isLatest, promotedStats = 0) {
        var _a;
        try {
            const db = dbservice_1.UserDataDtoCrud.getInstance();
            const greetings = ['Hellloooo', 'Hiiiiii', 'Oyyyyyy', 'Oiiiii', 'Haaiiii', 'Hlloooo', 'Hiiii', 'Hyyyyy', 'Oyyyyye', 'Oyeeee', 'Heyyy'];
            const emojis = generateEmojis();
            const randomEmoji = getRandomEmoji();
            const hour = getCurrentHourIST();
            const isMorning = (hour > 9 && hour < 22);
            const offset = Math.floor(Math.random() * 3);
            const endMsgOptions = ['U bussy👀?', "I'm Available!!😊💦", 'Try Once!!😊💦', 'Waiting for your message... Dr!!💦', 'You Online?👀', "I'm Available!!😊", 'You Busy??👀💦', 'You Interested??👀💦', 'You Awake?👀💦', 'You there???💦💦'];
            const endMsg = (0, utils_1.selectRandomElements)(endMsgOptions, 1)[0];
            const msg = `**${(0, utils_1.selectRandomElements)(greetings, 1)[0]}_._._._._._._!!**${emojis}\n.\n.\n**${endMsg}**`;
            const addon = (offset !== 1) ? `${(offset === 2) ? `**\n\n\nTODAY's OFFER:\n-------------------------------------------\nVideo Call Demo Available${randomEmoji}${randomEmoji}\nVideo Call Demo Available${randomEmoji}${randomEmoji}\n-------------------------------------------**` : `**\n\nJUST Try Once!!😚😚\nI'm Free Now!!${generateEmojis()}**`}` : `${generateEmojis()}`;
            const channelInfo = yield getChannelInfo(channelId);
            console.log("fetched ChannelInfo :", channelInfo.banned);
            if (!(channelInfo === null || channelInfo === void 0 ? void 0 : channelInfo.banned)) {
                console.log(`${channelInfo === null || channelInfo === void 0 ? void 0 : channelInfo.title} - WordRestriction: ${channelInfo === null || channelInfo === void 0 ? void 0 : channelInfo.wordRestriction} | AvailableMsgsLength: ${(_a = channelInfo === null || channelInfo === void 0 ? void 0 : channelInfo.availableMsgs) === null || _a === void 0 ? void 0 : _a.length}`);
                if (!(channelInfo === null || channelInfo === void 0 ? void 0 : channelInfo.availableMsgs)) {
                    yield db.updateActiveChannel({ channelId: channelInfo.channelId }, { dMRestriction: 0, wordRestriction: 0, availableMsgs: utils_1.defaultMessages });
                    channelInfo.availableMsgs = utils_1.defaultMessages;
                }
                let message;
                let defaultMsg = false;
                if (channelInfo.wordRestriction === 0) {
                    message = yield sendMessageToChannel(client, channelInfo, { message: msg + addon });
                }
                else {
                    let randomAvailableMsg;
                    if (channelInfo.availableMsgs.length > 0) {
                        randomAvailableMsg = promoteMsgs[(0, utils_1.selectRandomElements)(channelInfo.availableMsgs, 1)[0]];
                    }
                    else {
                        randomAvailableMsg = promoteMsgs["0"];
                        defaultMsg = true;
                    }
                    message = yield sendMessageToChannel(client, channelInfo, { message: randomAvailableMsg });
                }
                if (message) {
                    yield broadcast(`SENT TO GROUP: ${channelInfo === null || channelInfo === void 0 ? void 0 : channelInfo.title}`, `  @${channelInfo.username}  : ${channelInfo.participantsCount}`);
                    promoteFlagCount = 0;
                    promotedCount++;
                    retryMessageSending(client, channelInfo, message === null || message === void 0 ? void 0 : message.id, undefined, false, defaultMsg);
                    scheduleFollowUpMessage(client, channelInfo);
                    const outerLimit = 240000;
                    yield (0, Helpers_1.sleep)(outerLimit);
                    return;
                }
                else {
                    yield broadcast(`FAILED SEND IN GROUP: ${channelInfo === null || channelInfo === void 0 ? void 0 : channelInfo.title}`, `  @${channelInfo.username}  : ${channelInfo.participantsCount}`);
                    return;
                }
            }
            else {
                console.log("Banned Channel");
            }
        }
        catch (error) {
            console.error(`Error sending promotional message to ${channelId}:`, error);
            promoteFlagCount++;
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(true);
                }, 4000);
            });
        }
    });
}
function scheduleFollowUpMessage(client, channelInfo) {
    const innerLimit = 200500;
    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
        // console.log('Second timeout completed');
        let followUpMsg;
        let defaultMsg2 = false;
        yield broadcast(`SENDING Follow-up MESSAGE: ${channelInfo === null || channelInfo === void 0 ? void 0 : channelInfo.title}`, `  @${channelInfo.username}  : ${channelInfo.participantsCount}`);
        if (channelInfo.wordRestriction === 0) {
            // console.log('Sending default follow-up message');
            followUpMsg = yield sendMessageToChannel(client, channelInfo, { message: `**I have One Doubt.....!!\n\nCan Anyone Clarify me Please??😭😭${generateEmojis()}**` });
        }
        else {
            let randomAvailableMsg = promoteMsgs[(0, utils_1.selectRandomElements)(channelInfo.availableMsgs, 1)[0]];
            if (!(channelInfo.availableMsgs.length > 0 && randomAvailableMsg)) {
                // console.log('No available messages, using default message');
                randomAvailableMsg = promoteMsgs["0"];
                defaultMsg2 = true;
            }
            // console.log('Sending follow-up message from available messages');
            followUpMsg = yield sendMessageToChannel(client, channelInfo, { message: randomAvailableMsg });
        }
        if (followUpMsg) {
            yield broadcast(`Follow-up message SENT TO GROUP: ${channelInfo === null || channelInfo === void 0 ? void 0 : channelInfo.title}`, `  @${channelInfo.username}  : ${channelInfo.participantsCount}`);
        }
        else {
            yield broadcast(`FAILED to send follow-up message IN GROUP: ${channelInfo === null || channelInfo === void 0 ? void 0 : channelInfo.title}`, `  @${channelInfo.username}  : ${channelInfo.participantsCount}`);
        }
        retryMessageSending(client, channelInfo, followUpMsg === null || followUpMsg === void 0 ? void 0 : followUpMsg.id, 10000, true, defaultMsg2);
    }), innerLimit);
}
function sendMessageToChannel(client, channelInfo, message) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Attempt to send the message to the specified channel
            const msg = yield client.sendMessage(channelInfo.channelId, message);
            lastMessageTime = Date.now();
            return msg;
        }
        catch (error) {
            console.log(`Error sending message to ${channelInfo.channelId}:`, error);
            if (error.errorMessage === "CHANNEL_PRIVATE") {
                return yield handlePrivateChannel(client, channelInfo, message, error);
            }
            else {
                return yield handleOtherErrors(client, channelInfo, message, error);
            }
        }
    });
}
function handlePrivateChannel(client, channelInfo, message, error) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = dbservice_1.UserDataDtoCrud.getInstance();
        if (channelInfo && channelInfo.username) {
            try {
                // Attempt to send the message using the channel's username
                return yield client.sendMessage(channelInfo.username, message);
            }
            catch (err) {
                console.error(`Error retrying message for private channel ${channelInfo.username}:`, err);
                if (err.errorMessage === "CHANNEL_PRIVATE") {
                    yield db.updateActiveChannel({ channelId: channelInfo.channelId }, { banned: true });
                }
                return undefined;
            }
        }
        return undefined;
    });
}
function handleOtherErrors(client, channelInfo, message, error) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = dbservice_1.UserDataDtoCrud.getInstance();
        console.log(`Error sending message to ${channelInfo.channelId} (@${channelInfo.username}):`, error);
        //TODO
        // if (error.errorMessage === 'USER_BANNED_IN_CHANNEL') {
        //     const result = await checktghealth(client);
        //     if (!result && daysLeftForRelease() < 0) {
        //         await leaveChannel(client, channelInfo);
        //     }
        // } else if (error.errorMessage === 'CHAT_WRITE_FORBIDDEN') {
        //     await leaveChannel(client, channelInfo);
        // }
        return undefined;
    });
}
function checkAndResendMessage(client_1, chat_1, messageId_1, randomMsgId_1, attemptCount_1) {
    return __awaiter(this, arguments, void 0, function* (client, chat, messageId, randomMsgId, attemptCount, waitTime = 15000, recursionCount = 0, isDoubtMessage = false) {
        return new Promise((resolve, reject) => {
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (!client.connected) {
                        yield client.connect();
                    }
                    const messageContent = randomMsgId ? promoteMsgs[randomMsgId] : promoteMsgs["0"];
                    const db = dbservice_1.UserDataDtoCrud.getInstance();
                    // Update word restriction if necessary
                    if (!isDoubtMessage && (attemptCount > chat.wordRestriction || chat.wordRestriction === undefined)) {
                        yield db.updateActiveChannel({ channelId: chat.channelId }, Object.assign(Object.assign({}, chat), { wordRestriction: attemptCount }));
                    }
                    // Update DM restriction if necessary
                    if (isDoubtMessage && (attemptCount > chat.dMRestriction || chat.dMRestriction === undefined)) {
                        yield db.updateActiveChannel({ channelId: chat.channelId }, Object.assign(Object.assign({}, chat), { dMRestriction: attemptCount }));
                    }
                    let sentMessage;
                    try {
                        const messages = yield client.getMessages(chat.channelId, { ids: messageId });
                        sentMessage = messages[0];
                    }
                    catch (error) {
                        console.error(`Error fetching sent message:`, error);
                    }
                    if (!sentMessage) {
                        yield handleDeletedMessage(client, chat, messageId, randomMsgId, attemptCount);
                        const msg = yield sendMessageToChannel(client, chat, { message: messageContent });
                        resolve(msg === null || msg === void 0 ? void 0 : msg.id);
                    }
                    else {
                        yield handleExistingMessage(chat, randomMsgId);
                        resolve(undefined);
                    }
                }
                catch (error) {
                    console.error(`Error checking and resending message:`, error);
                    if (error.seconds && recursionCount < 3) {
                        resolve(yield checkAndResendMessage(client, chat, messageId, randomMsgId, attemptCount, error.seconds * 1000, recursionCount + 1, isDoubtMessage));
                    }
                    else {
                        reject(error);
                    }
                }
            }), waitTime);
        });
    });
}
function handleDeletedMessage(client, chat, messageId, randomMsgId, attemptCount) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const db = dbservice_1.UserDataDtoCrud.getInstance();
        yield broadcast(`MESSGAE DELETED FROM GROUP ===: ${chat.title}`, `@${chat.username}: ${chat.participantsCount}`);
        yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${notifbot}&text=${encodeURIComponent(`${(_a = process.env.clientId) === null || _a === void 0 ? void 0 : _a.toUpperCase()}: attempt=${attemptCount} R=${randomMsgId}\n@${chat.username}`)}`);
        if (randomMsgId) {
            yield db.removeFromAvailableMsgs({ channelId: chat.channelId }, randomMsgId);
            if (randomMsgId === '0') {
                yield db.updateActiveChannel({ channelId: chat.channelId }, { banned: true });
            }
        }
        else if (chat.availableMsgs.length === 0 || attemptCount === 3) {
            yield db.updateActiveChannel({ channelId: chat.channelId }, { banned: true });
        }
    });
}
function handleExistingMessage(chat, randomMsgId) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = dbservice_1.UserDataDtoCrud.getInstance();
        yield broadcast(`MESSAGE EXISTS, All GOOD === : ${chat.title}`, `@${chat.username}: ${chat.participantsCount}`);
        yield db.updatePromoteStats(chat.username);
        if (randomMsgId) {
            yield db.addToAvailableMsgs({ channelId: chat.channelId }, randomMsgId);
        }
        else {
            yield db.addToAvailableMsgs({ channelId: chat.channelId }, "0");
        }
    });
}
function retryMessageSending(client_1, chat_1, messageId_1) {
    return __awaiter(this, arguments, void 0, function* (client, chat, messageId, waitTime = 8000, isDoubtMessage = false, isDefaultMessage) {
        const availableMessages = [...chat.availableMsgs];
        let nextMessageId = messageId;
        for (let attempt = 0; attempt < 4; attempt++) {
            if (nextMessageId) {
                const randomMsgId = (0, utils_1.selectRandomElements)(availableMessages, 1)[0];
                const index = availableMessages.indexOf(randomMsgId);
                if (index !== -1) {
                    availableMessages.splice(index, 1);
                }
                yield (0, Helpers_1.sleep)(waitTime);
                nextMessageId = yield checkAndResendMessage(client, chat, nextMessageId, randomMsgId, attempt, 1500, 0, isDoubtMessage);
            }
            else {
                break;
            }
        }
    });
}
function getRandomEmoji() {
    const eroticEmojis = ["🔥", "💋", "👅", "🍆", "🔥", "💋", " 🙈", "👅", "🍑", "🍆", "💦", "🍑", "😚", "😏", "💦", "🥕", "🥖"];
    const randomIndex = Math.floor(Math.random() * eroticEmojis.length);
    return eroticEmojis[randomIndex];
}
function generateEmojis() {
    const emoji1 = getRandomEmoji();
    const emoji2 = getRandomEmoji();
    return emoji1 + emoji2;
}
function getCurrentHourIST() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const istHour = istTime.getUTCHours();
    return istHour;
}
function broadcast(name, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date().toLocaleString('en-IN').split(',')[1];
        console.log(`${now}||${name} : ${msg}`);
    });
}
function replyUnread(client, unreadUserDialogs) {
    return __awaiter(this, void 0, void 0, function* () {
        if (client) {
            try {
                const db = dbservice_1.UserDataDtoCrud.getInstance();
                for (const chat of unreadUserDialogs) {
                    try {
                        const userDetails = yield db.read(chat.id.toString());
                        if (userDetails) {
                            if (userDetails.payAmount > 29) {
                                if (!userDetails.demoGiven) {
                                    // const didPaidToOthers = await db.checkIfPaidToOthers(chat.id.toString());
                                    // if (didPaidToOthers.paid !== "" || didPaidToOthers.paid !== "") {
                                    //     await client.sendMessage(chat.entity,{ message: `Wait...\nI'm verifying your Payment again!!\n${didPaidToOthers.paid !== "" ? (`I think U paid to ${didPaidToOthers.paid} and U also`) : "I think U"}  ${didPaidToOthers.demoGiven !== "" ? (` took Demo from ${didPaidToOthers.demoGiven}`) : ""}` });
                                    // } else {
                                    yield client.sendMessage(chat.entity, { message: "Dont Speak Okay!!\nI'm in **Bathroom**\nMute yourself!! I will show you Okay..!!" });
                                    yield client.sendMessage(chat.entity, { message: `Hey U can Call me here\n\nhttps://zomCall.netlify.app/${process.env.clientId}/${userDetails.chatId.toString()}\n\nCall me now!!` });
                                    // }
                                }
                                else {
                                    if (userDetails.payAmount > 50) {
                                        if (!userDetails.secondShow || userDetails.payAmount > 180) {
                                            // await client.sendMessage(chat.entity,{ message: "Mute ok.. I Will Call now!!" });
                                        }
                                        else if (userDetails.payAmount < 201) {
                                            yield client.sendMessage(chat.entity, { message: "**Did you like the full Show??**😚" });
                                            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                                yield client.sendMessage(chat.entity, { message: "**30 Mins VideoCall   :  350₹/-\n1 hour Full   :   600₹/-**" });
                                            }), 3000);
                                        }
                                    }
                                    else {
                                        yield client.sendMessage(chat.entity, { message: "**Did you like the Demo??😚\n\nPay Again!! if You want More....**" });
                                        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                                            yield client.sendMessage(chat.entity, { message: `**Take Full Show Baby...!!**\nPussy also!!\n\nWithout Face : **100₹**\nWith Face      : **150₹**` });
                                        }), 3000);
                                    }
                                }
                            }
                            else {
                                if (userDetails.payAmount > 15) {
                                    yield client.sendMessage(chat.entity, { message: messages_1.messages.noFreeDemo + "\n\n" + messages_1.messages.demo });
                                }
                                else if (userDetails.payAmount > 10 && userDetails.picsSent) {
                                    yield client.sendMessage(chat.entity, { message: `I have sent you Pics for your money\n${messages_1.messages.just50}` });
                                }
                                else {
                                    yield client.sendMessage(chat.entity, { message: (0, utils_1.selectRandomElements)(["oyee..", "oye", "haa", "hmm", "??", "hey"], 1)[0] });
                                }
                            }
                            yield client.markAsRead(chat.entity);
                        }
                    }
                    catch (error) {
                        console.log(error);
                        return new Promise((resolve) => {
                            setTimeout(() => resolve(true), 5000);
                        });
                    }
                }
            }
            catch (error) {
                console.log(error.errorMessage);
                try {
                    if (error.errorMessage === 'AUTH_KEY_DUPLICATED') {
                        yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${ppplbot}&text=@${(process.env.clientId).toUpperCase()}: AUTH KEY DUPLICATED`);
                    }
                    if ((error.errorMessage === "USER_DEACTIVATED_BAN" || error.errorMessage === "USER_DEACTIVATED") && error.errorMessage !== "INPUT_USER_DEACTIVATED") {
                        yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${ppplbot}&text=@${(process.env.clientId).toUpperCase()}: USER_DEACTIVATED - STARTED NEW USER PROCESS`);
                        const url = `${process.env.tgmanager}/clients/setupClient/${process.env.clientId}?a=no`;
                        yield (0, fetchWithTimeout_1.fetchWithTimeout)(url);
                    }
                }
                catch (error) {
                    console.log(error);
                }
            }
        }
    });
}
function startNewUserProcess(error) {
    return __awaiter(this, void 0, void 0, function* () {
        if (error.errorMessage === 'AUTH_KEY_DUPLICATED') {
            yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${ppplbot}&text=@${(process.env.clientId).toUpperCase()}: AUTH KEY DUPLICATED`);
        }
        if ((error.errorMessage === "USER_DEACTIVATED_BAN" || error.errorMessage === "USER_DEACTIVATED") && error.errorMessage !== "INPUT_USER_DEACTIVATED") {
            yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${ppplbot}&text=@${(process.env.clientId).toUpperCase()}: USER_DEACTIVATED - STARTED NEW USER PROCESS`);
            const url = `${process.env.tgmanager}/clients/clients/setupClient/${process.env.clientId}?archiveOld=false&formalities=false`;
            yield (0, fetchWithTimeout_1.fetchWithTimeout)(url);
        }
    });
}
function checktghealth(client) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (client) {
                yield client.sendMessage('@spambot', { message: '/start' });
            }
            else {
                console.log("instanse not exist");
            }
        }
        catch (error) {
            console.log(error);
            try {
                yield client.invoke(new telegram_1.Api.contacts.Unblock({
                    id: '178220800'
                }));
            }
            catch (error) {
                console.log(error);
            }
            yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${ppplbot}&text=@${(process.env.clientId).toUpperCase()}: Failed To Check Health`);
        }
    });
}
function getIChannelFromTg(channelId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const channelEnt = channelId.startsWith('-') ? channelId : `-100${channelId}`;
        const { id, defaultBannedRights, title, broadcast, username, participantsCount, restricted } = yield TelegramManager_1.default.getInstance().getEntity(channelEnt);
        const channel = {
            channelId: (_a = id.toString()) === null || _a === void 0 ? void 0 : _a.replace(/^-100/, ""),
            title,
            participantsCount,
            username,
            restricted,
            broadcast,
            sendMessages: defaultBannedRights === null || defaultBannedRights === void 0 ? void 0 : defaultBannedRights.sendMessages,
            canSendMsgs: !broadcast && !(defaultBannedRights === null || defaultBannedRights === void 0 ? void 0 : defaultBannedRights.sendMessages),
            availableMsgs: utils_1.defaultMessages,
            dMRestriction: 0,
            banned: false,
            reactions: utils_1.defaultReactions,
            reactRestricted: false,
            wordRestriction: 0
        };
        return channel;
    });
}
