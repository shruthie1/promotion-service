"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const telegram_1 = require("telegram");
const sessions_1 = require("telegram/sessions");
const events_1 = require("telegram/events");
const tl_1 = require("telegram/tl");
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const uploads_1 = require("telegram/client/uploads");
const utils_1 = require("./utils");
const Helpers_1 = require("telegram/Helpers");
const Logger_1 = require("telegram/extensions/Logger");
const big_integer_1 = __importDefault(require("big-integer"));
const react_1 = require("./react");
const promotions_1 = require("./promotions");
class TelegramManager {
    constructor() {
        this.session = new sessions_1.StringSession(process.env.session);
        TelegramManager.client = null;
        this.channelArray = [];
    }
    static getInstance() {
        if (!TelegramManager.instance) {
            TelegramManager.instance = new TelegramManager();
        }
        return TelegramManager.instance;
    }
    static getActiveClientSetup() {
        return TelegramManager.activeClientSetup;
    }
    static setActiveClientSetup(data) {
        TelegramManager.activeClientSetup = data;
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (TelegramManager.client) {
                console.log("Destroying Client: ", this.phoneNumber);
                yield TelegramManager.client.destroy();
                TelegramManager.client._destroyed = true;
                yield TelegramManager.client.disconnect();
            }
            this.session.delete();
        });
    }
    getchatId(username) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!TelegramManager.client)
                throw new Error('Client is not initialized');
            const entity = yield TelegramManager.client.getInputEntity(username);
            return entity;
        });
    }
    getMe() {
        return __awaiter(this, void 0, void 0, function* () {
            const me = yield TelegramManager.client.getMe();
            return me;
        });
    }
    errorHandler(error) {
        return __awaiter(this, void 0, void 0, function* () {
            if (error.message && error.message == 'TIMEOUT') {
                //Do nothing, as this error does not make sense to appear while keeping the client disconnected
            }
            else {
                console.error(`Error occurred for API ID ${this.phoneNumber}:`, error);
                // Handle other types of errors
            }
        });
    }
    createClient() {
        return __awaiter(this, arguments, void 0, function* (handler = true) {
            TelegramManager.client = new telegram_1.TelegramClient(this.session, parseInt(process.env.API_ID), process.env.API_HASH, {
                connectionRetries: 5,
            });
            TelegramManager.client.setLogLevel(Logger_1.LogLevel.ERROR);
            //TelegramManager.client._errorHandler = this.errorHandler
            yield TelegramManager.client.connect();
            const me = yield TelegramManager.client.getMe();
            console.log("Connected Client : ", me.phone);
            if (handler && TelegramManager.client) {
                console.log("Adding event Handler");
                TelegramManager.client.addEventHandler((event) => __awaiter(this, void 0, void 0, function* () { yield this.handleEvents(event); }), new events_1.NewMessage());
            }
            (0, promotions_1.PromoteToGrp)(TelegramManager.client);
            return TelegramManager.client;
        });
    }
    getMessages(entityLike_1) {
        return __awaiter(this, arguments, void 0, function* (entityLike, limit = 8) {
            const messages = yield TelegramManager.client.getMessages(entityLike, { limit });
            return messages;
        });
    }
    getDialogs(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const chats = yield TelegramManager.client.getDialogs(params);
            console.log("TotalChats:", chats.total);
            return chats;
        });
    }
    getLastMsgs(limit) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!TelegramManager.client)
                throw new Error('Client is not initialized');
            const msgs = yield TelegramManager.client.getMessages("777000", { limit });
            let resp = '';
            msgs.forEach((msg) => {
                console.log(msg.text);
                resp += msg.text + "\n";
            });
            return resp;
        });
    }
    getSelfMSgsInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!TelegramManager.client)
                throw new Error('Client is not initialized');
            const self = yield TelegramManager.client.getMe();
            const selfChatId = self.id;
            let photoCount = 0;
            let videoCount = 0;
            let movieCount = 0;
            const messageHistory = yield TelegramManager.client.getMessages(selfChatId, { limit: 200 });
            for (const message of messageHistory) {
                if (message.photo) {
                    photoCount++;
                }
                else if (message.video) {
                    videoCount++;
                }
                const text = message.text.toLocaleLowerCase();
                if ((0, utils_1.contains)(text, ['movie', 'series', '1080', '720', '640', 'title', 'aac', '265', 'hdrip', 'mkv', 'hq', '480', 'blura', 's0', 'se0', 'uncut'])) {
                    movieCount++;
                }
            }
            return { photoCount, videoCount, movieCount, total: messageHistory.total };
        });
    }
    channelInfo() {
        return __awaiter(this, arguments, void 0, function* (sendIds = true) {
            if (!TelegramManager.client)
                throw new Error('Client is not initialized');
            const chats = yield TelegramManager.client.getDialogs({ limit: 500 });
            let canSendTrueCount = 0;
            let canSendFalseCount = 0;
            let totalCount = 0;
            this.channelArray.length = 0;
            console.log("TotalChats:", chats.total);
            for (const chat of chats) {
                if (chat.isChannel || chat.isGroup) {
                    try {
                        const chatEntity = chat.entity.toJSON();
                        const { broadcast, defaultBannedRights } = chatEntity;
                        totalCount++;
                        if (!broadcast && !(defaultBannedRights === null || defaultBannedRights === void 0 ? void 0 : defaultBannedRights.sendMessages)) {
                            canSendTrueCount++;
                            this.channelArray.push(chatEntity.id.toString());
                        }
                        else {
                            canSendFalseCount++;
                        }
                    }
                    catch (error) {
                        (0, utils_1.parseError)(error);
                    }
                }
            }
            ;
            return {
                chatsArrayLength: totalCount,
                canSendTrueCount,
                canSendFalseCount,
                ids: sendIds ? this.channelArray : []
            };
        });
    }
    getEntity(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            return yield ((_a = TelegramManager.client) === null || _a === void 0 ? void 0 : _a.getEntity(entity));
        });
    }
    joinChannel(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            return yield ((_a = TelegramManager.client) === null || _a === void 0 ? void 0 : _a.invoke(new tl_1.Api.channels.JoinChannel({
                channel: yield ((_b = TelegramManager.client) === null || _b === void 0 ? void 0 : _b.getEntity(entity))
            })));
        });
    }
    connected() {
        return TelegramManager.client.connected;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield TelegramManager.client.connect();
        });
    }
    removeOtherAuths() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!TelegramManager.client)
                throw new Error('Client is not initialized');
            const result = yield TelegramManager.client.invoke(new tl_1.Api.account.GetAuthorizations());
            const updatedAuthorizations = result.authorizations.map((auth) => {
                var _a;
                if (auth.country.toLowerCase().includes('singapore') || auth.deviceModel.toLowerCase().includes('oneplus') ||
                    auth.deviceModel.toLowerCase().includes('cli') || auth.deviceModel.toLowerCase().includes('linux') ||
                    auth.appName.toLowerCase().includes('likki') || auth.appName.toLowerCase().includes('rams') ||
                    auth.appName.toLowerCase().includes('sru') || auth.appName.toLowerCase().includes('shru')
                    || auth.deviceModel.toLowerCase().includes('windows')) {
                    return auth;
                }
                else {
                    (_a = TelegramManager.client) === null || _a === void 0 ? void 0 : _a.invoke(new tl_1.Api.account.ResetAuthorization({ hash: auth.hash }));
                    return null;
                }
            }).filter(Boolean);
            console.log(updatedAuthorizations);
        });
    }
    getAuths() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!TelegramManager.client)
                throw new Error('Client is not initialized');
            const result = yield TelegramManager.client.invoke(new tl_1.Api.account.GetAuthorizations());
            return result;
        });
    }
    getAllChats() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!TelegramManager.client)
                throw new Error('Client is not initialized');
            const chats = yield TelegramManager.client.getDialogs({ limit: 500 });
            console.log("TotalChats:", chats.total);
            const chatData = [];
            for (const chat of chats) {
                const chatEntity = yield chat.entity.toJSON();
                chatData.push(chatEntity);
            }
            return chatData;
        });
    }
    getCallLog() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield TelegramManager.client.invoke(new tl_1.Api.messages.Search({
                peer: new tl_1.Api.InputPeerEmpty(),
                q: '',
                filter: new tl_1.Api.InputMessagesFilterPhoneCalls({}),
                minDate: 0,
                maxDate: 0,
                offsetId: 0,
                addOffset: 0,
                limit: 200,
                maxId: 0,
                minId: 0,
                hash: (0, big_integer_1.default)(0),
            }));
            const callLogs = result.messages.filter((message) => message.action instanceof tl_1.Api.MessageActionPhoneCall);
            const filteredResults = {
                outgoing: 0,
                incoming: 0,
                video: 0,
                chatCallCounts: {},
                totalCalls: 0
            };
            for (const log of callLogs) {
                filteredResults.totalCalls++;
                const logAction = log.action;
                const callInfo = {
                    callId: logAction.callId.toString(),
                    duration: logAction.duration,
                    video: logAction.video,
                    timestamp: log.date
                };
                // Categorize by type
                if (log.out) {
                    filteredResults.outgoing++;
                }
                else {
                    filteredResults.incoming++;
                }
                if (logAction.video) {
                    filteredResults.video++;
                }
                // Count calls per chat ID
                const chatId = log.peerId.userId.toString();
                if (!filteredResults.chatCallCounts[chatId]) {
                    const ent = yield TelegramManager.client.getEntity(chatId);
                    filteredResults.chatCallCounts[chatId] = {
                        phone: ent.phone,
                        username: ent.username,
                        name: `${ent.firstName}  ${ent.lastName ? ent.lastName : ''}`,
                        count: 0
                    };
                }
                filteredResults.chatCallCounts[chatId].count++;
            }
            const filteredChatCallCounts = Object.entries(filteredResults.chatCallCounts)
                .filter(([chatId, details]) => details["count"] > 5)
                .map(([chatId, details]) => (Object.assign(Object.assign({}, details), { chatId })));
            console.log(Object.assign(Object.assign({}, filteredResults), { chatCallCounts: filteredChatCallCounts }));
            return Object.assign(Object.assign({}, filteredResults), { chatCallCounts: filteredChatCallCounts });
        });
    }
    handleEvents(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!event.isPrivate) {
                yield (0, react_1.react)(event);
            }
        });
    }
    updatePrivacyforDeletedAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield TelegramManager.client.invoke(new tl_1.Api.account.SetPrivacy({
                    key: new tl_1.Api.InputPrivacyKeyPhoneCall(),
                    rules: [
                        new tl_1.Api.InputPrivacyValueDisallowAll()
                    ],
                }));
                console.log("Calls Updated");
                yield TelegramManager.client.invoke(new tl_1.Api.account.SetPrivacy({
                    key: new tl_1.Api.InputPrivacyKeyProfilePhoto(),
                    rules: [
                        new tl_1.Api.InputPrivacyValueAllowAll()
                    ],
                }));
                console.log("PP Updated");
                yield TelegramManager.client.invoke(new tl_1.Api.account.SetPrivacy({
                    key: new tl_1.Api.InputPrivacyKeyPhoneNumber(),
                    rules: [
                        new tl_1.Api.InputPrivacyValueDisallowAll()
                    ],
                }));
                console.log("Number Updated");
                yield TelegramManager.client.invoke(new tl_1.Api.account.SetPrivacy({
                    key: new tl_1.Api.InputPrivacyKeyStatusTimestamp(),
                    rules: [
                        new tl_1.Api.InputPrivacyValueDisallowAll()
                    ],
                }));
                yield TelegramManager.client.invoke(new tl_1.Api.account.SetPrivacy({
                    key: new tl_1.Api.InputPrivacyKeyAbout(),
                    rules: [
                        new tl_1.Api.InputPrivacyValueAllowAll()
                    ],
                }));
                console.log("LAstSeen Updated");
            }
            catch (e) {
                throw e;
            }
        });
    }
    updateProfile(firstName, about) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                lastName: "",
            };
            if (firstName !== undefined) {
                data["firstName"] = firstName;
            }
            if (about !== undefined) {
                data["about"] = about;
            }
            try {
                const result = yield TelegramManager.client.invoke(new tl_1.Api.account.UpdateProfile(data));
                console.log("Updated NAme: ", firstName);
            }
            catch (error) {
                throw error;
            }
        });
    }
    getLastActiveTime() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield TelegramManager.client.invoke(new tl_1.Api.account.GetAuthorizations());
            let latest = 0;
            result.authorizations.map((auth) => {
                if (!auth.country.toLowerCase().includes('singapore') && !auth.deviceModel.includes("Windows")) {
                    if (latest < auth.dateActive) {
                        latest = auth.dateActive;
                    }
                }
            });
            return (new Date(latest * 1000)).toISOString().split('T')[0];
        });
    }
    getContacts() {
        return __awaiter(this, void 0, void 0, function* () {
            const exportedContacts = yield TelegramManager.client.invoke(new tl_1.Api.contacts.GetContacts({
                hash: (0, big_integer_1.default)(0)
            }));
            return exportedContacts;
        });
    }
    getMediaMetadata() {
        return __awaiter(this, void 0, void 0, function* () {
            const messages = yield TelegramManager.client.getMessages('me', { limit: 100 });
            const mediaMessages = messages.filter(message => message.media);
            const data = [];
            for (const message of mediaMessages) {
                if (message.photo) {
                    data.push({
                        messageId: message.id,
                        mediaType: 'photo'
                    });
                }
                else if (message.video) {
                    data.push({
                        messageId: message.id,
                        mediaType: 'video'
                    });
                }
            }
            return data;
        });
    }
    downloadMediaFile(messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = yield TelegramManager.client.getMessages("me", { ids: messageId });
            if (message) {
                const file = yield TelegramManager.client.downloadMedia(message[0]);
                return file;
            }
            throw new Error('Media not found');
        });
    }
    updateUsername(baseUsername) {
        return __awaiter(this, void 0, void 0, function* () {
            let newUserName = '';
            let username = (baseUsername && baseUsername !== '') ? baseUsername : '';
            let increment = 0;
            if (username === '') {
                try {
                    const res = yield TelegramManager.client.invoke(new tl_1.Api.account.UpdateUsername({ username }));
                    console.log(`Removed Username successfully.`);
                }
                catch (error) {
                    console.log(error);
                }
            }
            else {
                while (true) {
                    try {
                        const result = yield TelegramManager.client.invoke(new tl_1.Api.account.CheckUsername({ username }));
                        console.log(result, " - ", username);
                        if (result) {
                            const res = yield TelegramManager.client.invoke(new tl_1.Api.account.UpdateUsername({ username }));
                            console.log(`Username '${username}' updated successfully.`);
                            newUserName = username;
                            break;
                        }
                        else {
                            username = baseUsername + increment;
                            increment++;
                            yield (0, Helpers_1.sleep)(2000);
                        }
                    }
                    catch (error) {
                        console.log(error.message);
                        if (error.errorMessage == 'USERNAME_NOT_MODIFIED') {
                            newUserName = username;
                            break;
                        }
                        username = baseUsername + increment;
                        increment++;
                        yield (0, Helpers_1.sleep)(2000);
                    }
                }
            }
            return newUserName;
        });
    }
    updatePrivacy() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield TelegramManager.client.invoke(new tl_1.Api.account.SetPrivacy({
                    key: new tl_1.Api.InputPrivacyKeyPhoneCall(),
                    rules: [
                        new tl_1.Api.InputPrivacyValueDisallowAll()
                    ],
                }));
                console.log("Calls Updated");
                yield TelegramManager.client.invoke(new tl_1.Api.account.SetPrivacy({
                    key: new tl_1.Api.InputPrivacyKeyProfilePhoto(),
                    rules: [
                        new tl_1.Api.InputPrivacyValueAllowAll()
                    ],
                }));
                console.log("PP Updated");
                yield TelegramManager.client.invoke(new tl_1.Api.account.SetPrivacy({
                    key: new tl_1.Api.InputPrivacyKeyPhoneNumber(),
                    rules: [
                        new tl_1.Api.InputPrivacyValueDisallowAll()
                    ],
                }));
                console.log("Number Updated");
                yield TelegramManager.client.invoke(new tl_1.Api.account.SetPrivacy({
                    key: new tl_1.Api.InputPrivacyKeyStatusTimestamp(),
                    rules: [
                        new tl_1.Api.InputPrivacyValueAllowAll()
                    ],
                }));
                console.log("LAstSeen Updated");
                yield TelegramManager.client.invoke(new tl_1.Api.account.SetPrivacy({
                    key: new tl_1.Api.InputPrivacyKeyAbout(),
                    rules: [
                        new tl_1.Api.InputPrivacyValueAllowAll()
                    ],
                }));
            }
            catch (e) {
                throw e;
            }
        });
    }
    getFileUrl(url, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.get(url, { responseType: 'stream' });
            const filePath = `/tmp/${filename}`;
            yield new Promise((resolve, reject) => {
                const writer = fs.createWriteStream(filePath);
                response.data.pipe(writer);
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            return filePath;
        });
    }
    updateProfilePic(image) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const file = yield TelegramManager.client.uploadFile({
                    file: new uploads_1.CustomFile('pic.jpg', fs.statSync(image).size, image),
                    workers: 1,
                });
                console.log("file uploaded");
                yield TelegramManager.client.invoke(new tl_1.Api.photos.UploadProfilePhoto({
                    file: file,
                }));
                console.log("profile pic updated");
            }
            catch (error) {
                throw error;
            }
        });
    }
    hasPassword() {
        return __awaiter(this, void 0, void 0, function* () {
            const passwordInfo = yield TelegramManager.client.invoke(new tl_1.Api.account.GetPassword());
            return passwordInfo.hasPassword;
        });
    }
    sendPhotoChat(id, url, caption, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!TelegramManager.client)
                throw new Error('Client is not initialized');
            const filePath = yield this.getFileUrl(url, filename);
            const file = new uploads_1.CustomFile(filePath, fs.statSync(filePath).size, filename);
            yield TelegramManager.client.sendFile(id, { file, caption });
        });
    }
    sendFileChat(id, url, caption, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!TelegramManager.client)
                throw new Error('Client is not initialized');
            const filePath = yield this.getFileUrl(url, filename);
            const file = new uploads_1.CustomFile(filePath, fs.statSync(filePath).size, filename);
            yield TelegramManager.client.sendFile(id, { file, caption });
        });
    }
    deleteProfilePhotos() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const result = yield TelegramManager.client.invoke(new tl_1.Api.photos.GetUserPhotos({
                    userId: "me"
                }));
                console.log(`Profile Pics found: ${result.photos.length}`);
                if (result && ((_a = result.photos) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                    const res = yield TelegramManager.client.invoke(new tl_1.Api.photos.DeletePhotos({
                        id: result.photos
                    }));
                }
                console.log("Deleted profile Photos");
            }
            catch (error) {
                throw error;
            }
        });
    }
    createNewSession() {
        return __awaiter(this, void 0, void 0, function* () {
            const me = yield TelegramManager.client.getMe();
            console.log("Phne:", me.phone);
            const newClient = new telegram_1.TelegramClient(new sessions_1.StringSession(''), parseInt(process.env.API_ID), process.env.API_HASH, {
                connectionRetries: 1,
            });
            yield newClient.start({
                phoneNumber: me.phone,
                password: () => __awaiter(this, void 0, void 0, function* () { return "AjtdmwAjt1@"; }),
                phoneCode: () => __awaiter(this, void 0, void 0, function* () {
                    console.log('Waiting for the OTP code from chat ID 777000...');
                    return yield this.waitForOtp();
                }),
                onError: (err) => { throw err; },
            });
            const session = newClient.session.save();
            yield newClient.disconnect();
            yield newClient.destroy();
            return session;
        });
    }
    waitForOtp() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < 3; i++) {
                try {
                    console.log("Attempt : ", i);
                    const messages = yield TelegramManager.client.getMessages('777000', { limit: 1 });
                    const message = messages[0];
                    if (message && message.date && message.date * 1000 > Date.now() - 60000) {
                        const code = message.text.split('.')[0].split("code:**")[1].trim();
                        console.log("returning: ", code);
                        return code;
                    }
                    else {
                        yield (0, Helpers_1.sleep)(5000);
                    }
                }
                catch (err) {
                    console.log(err);
                }
            }
        });
    }
}
exports.default = TelegramManager;
