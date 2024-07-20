/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/ReactQueue.ts":
/*!***************************!*\
  !*** ./src/ReactQueue.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReactQueue = void 0;
class ReactQueue {
    constructor() {
        this.items = [];
        this.maxSize = 7;
    }
    static getInstance() {
        if (!ReactQueue.instance) {
            ReactQueue.instance = new ReactQueue();
        }
        return ReactQueue.instance;
    }
    push(item) {
        while (this.items.length >= this.maxSize) {
            this.items.shift();
        }
        this.items.push(item);
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            this.pop();
        }, 100000); // 1 minute
    }
    pop() {
        if (this.items.length === 0) {
            return undefined;
        }
        const item = this.items.shift();
        return item;
    }
    contains(item) {
        return this.items.indexOf(item) !== -1;
    }
    isEmpty() {
        return this.items.length === 0;
    }
    isFull() {
        return this.items.length === this.maxSize;
    }
}
exports.ReactQueue = ReactQueue;


/***/ }),

/***/ "./src/TelegramManager.ts":
/*!********************************!*\
  !*** ./src/TelegramManager.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
const telegram_1 = __webpack_require__(/*! telegram */ "telegram");
const sessions_1 = __webpack_require__(/*! telegram/sessions */ "telegram/sessions");
const events_1 = __webpack_require__(/*! telegram/events */ "telegram/events");
const tl_1 = __webpack_require__(/*! telegram/tl */ "telegram/tl");
const axios_1 = __importDefault(__webpack_require__(/*! axios */ "axios"));
const fs = __importStar(__webpack_require__(/*! fs */ "fs"));
const uploads_1 = __webpack_require__(/*! telegram/client/uploads */ "telegram/client/uploads");
const utils_1 = __webpack_require__(/*! ./utils */ "./src/utils.ts");
const Helpers_1 = __webpack_require__(/*! telegram/Helpers */ "telegram/Helpers");
const Logger_1 = __webpack_require__(/*! telegram/extensions/Logger */ "telegram/extensions/Logger");
const big_integer_1 = __importDefault(__webpack_require__(/*! big-integer */ "big-integer"));
const react_1 = __webpack_require__(/*! ./react */ "./src/react.ts");
const fetchWithTimeout_1 = __webpack_require__(/*! ./fetchWithTimeout */ "./src/fetchWithTimeout.ts");
class TelegramManager {
    constructor() {
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
    createClient(handler = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const result2 = yield (0, fetchWithTimeout_1.fetchWithTimeout)(`https://uptimechecker2.glitch.me/archived-clients/fetchOne/${process.env.mobile}`);
            console.log("ArchivedClient : ", result2.data);
            TelegramManager.client = new telegram_1.TelegramClient(new sessions_1.StringSession(result2.data.session), parseInt(process.env.API_ID), process.env.API_HASH, {
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
            // PromoteToGrp(TelegramManager.client)
            return TelegramManager.client;
        });
    }
    getMessages(entityLike, limit = 8) {
        return __awaiter(this, void 0, void 0, function* () {
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
    channelInfo(sendIds = true) {
        return __awaiter(this, void 0, void 0, function* () {
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
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            return yield ((_a = TelegramManager.client) === null || _a === void 0 ? void 0 : _a.getEntity(entity));
        });
    }
    joinChannel(entity) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
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
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
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
exports["default"] = TelegramManager;


/***/ }),

/***/ "./src/config.ts":
/*!***********************!*\
  !*** ./src/config.ts ***!
  \***********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getDataAndSetEnvVariables = void 0;
(__webpack_require__(/*! dotenv */ "dotenv").config)();
console.log("in Config");
const node_fetch_1 = __importDefault(__webpack_require__(/*! node-fetch */ "node-fetch"));
function getDataAndSetEnvVariables(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield (0, node_fetch_1.default)(url);
            const jsonData = yield response.json();
            for (const key in jsonData) {
                process.env[key] = jsonData[key];
            }
            console.log('Environment variables set successfully!');
        }
        catch (error) {
            console.error('Error retrieving data or setting environment variables:', error);
        }
    });
}
exports.getDataAndSetEnvVariables = getDataAndSetEnvVariables;
getDataAndSetEnvVariables(`https://uptimechecker2.glitch.me/clients/${process.env.clientId}`).then(() => {
    __webpack_require__(/*! ./index */ "./src/index.ts");
});


/***/ }),

/***/ "./src/connection.ts":
/*!***************************!*\
  !*** ./src/connection.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sendPing = void 0;
const dbservice_1 = __webpack_require__(/*! ./dbservice */ "./src/dbservice.ts");
const fetchWithTimeout_1 = __webpack_require__(/*! ./fetchWithTimeout */ "./src/fetchWithTimeout.ts");
const parseError_1 = __webpack_require__(/*! ./parseError */ "./src/parseError.ts");
const TelegramManager_1 = __importDefault(__webpack_require__(/*! ./TelegramManager */ "./src/TelegramManager.ts"));
const utils_1 = __webpack_require__(/*! ./utils */ "./src/utils.ts");
const index_1 = __webpack_require__(/*! ./index */ "./src/index.ts");
let retryTime = 0;
exports.sendPing = false;
setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
    yield retryConnection();
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        yield retryConnection();
    }), 120000);
}), 20000);
function getAllEnvironmentVariables() {
    return process.env;
}
function retryConnection() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        if (exports.sendPing && ((_a = dbservice_1.UserDataDtoCrud.getInstance()) === null || _a === void 0 ? void 0 : _a.isConnected) && TelegramManager_1.default.getInstance().connected()) {
            try {
                yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${process.env.promoteChecker}/receive?clientId=${process.env.clientId}`, {}, false);
            }
            catch (error) {
                (0, parseError_1.parseError)(error, "Cannot fetch pinger:");
            }
            retryTime = 0;
        }
        else {
            retryTime++;
            if (retryTime > 1) {
                // await fetchWithTimeout(`${ppplbot}&text=${encodeURIComponent(`${process.env.clientId}: Exitting as-\nProcessId:${prcessID}\nMongo-${UserDataDtoCrud.getInstance()?.isConnected}\nTGClient-${tgClass.getClient()?.connected}\nRetryCount: ${retryTime}`)}`);
            }
            if (retryTime > 5) {
                console.log("Exitiing");
                // await fetchWithTimeout(`${process.env.uptimebot}/refreshmap`)
                yield (dbservice_1.UserDataDtoCrud.getInstance()).closeConnection();
                // const environmentVariables = getAllEnvironmentVariables();
                yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${utils_1.ppplbot}&text=${(process.env.clientId).toUpperCase()}:UNABLE TO START at RETRY - EXITTING\n\nPid:${process.pid}\n\nenv: ${process.env.clientId}`);
                process.exit(1);
                //execSync("refresh");
            }
            if (!((_b = process.env.repl) === null || _b === void 0 ? void 0 : _b.includes("glitch"))) {
                const resp = yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${process.env.repl}/getProcessId`, { timeout: 100000 });
                try {
                    console.log(resp);
                    const data = yield resp.data;
                    if (parseInt(data.ProcessId) === index_1.prcessID) {
                        console.log('Sending Req to Check Health: ', `${process.env.promoteChecker}/tgclientoff/${index_1.prcessID}?clientId=${process.env.clientId}`);
                        const respon = yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${process.env.promoteChecker}/tgclientoff/${index_1.prcessID}?clientId=${process.env.clientId}`);
                        if (!respon.data) {
                            console.log("EXITTING");
                            process.exit(1);
                        }
                    }
                    else {
                        console.log("EXITTING");
                        process.exit(1);
                    }
                }
                catch (error) {
                    console.log('Cannot fetch pinger', error);
                }
            }
            else {
                const respon = yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${process.env.promoteChecker}/tgclientoff/${index_1.prcessID}?clientId=${process.env.clientId}`);
                if (!respon.data) {
                    console.log("EXITTING");
                    process.exit(1);
                }
            }
        }
        exports.sendPing = false;
    });
}


/***/ }),

/***/ "./src/dbservice.ts":
/*!**************************!*\
  !*** ./src/dbservice.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserDataDtoCrud = exports.user = void 0;
console.log(`in Db - ${process.env.dbcoll} | ${process.env.username}`);
const mongodb_1 = __webpack_require__(/*! mongodb */ "mongodb");
var user;
(function (user) {
    user["picCount"] = "picCount";
    user["totalCount"] = "totalCount";
    user["lastMsgTimeStamp"] = "lastMsgTimeStamp";
    user["prfCount"] = "prfCount";
    user["paidCount"] = "paidCount";
    user["limitTime"] = "limitTime";
    user["canReply"] = "canReply";
    user["payAmount"] = "payAmount";
    user["chatId"] = "chatId";
    user["username"] = "username";
    user["paidReply"] = "paidReply";
    user["demoGiven"] = "demoGiven";
    user["secondShow"] = "secondShow";
    user["picsSent"] = "picsSent";
})(user = exports.user || (exports.user = {}));
class UserDataDtoCrud {
    constructor() {
        this.clients = {};
        this.isConnected = false;
        this.client = undefined;
        console.log("Creating MongoDb Instance");
    }
    static getInstance() {
        if (!UserDataDtoCrud.instance) {
            UserDataDtoCrud.instance = new UserDataDtoCrud();
        }
        return UserDataDtoCrud.instance;
    }
    static isInstanceExist() {
        return !!UserDataDtoCrud.instance;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client && !this.isConnected) {
                console.log('trying to connect to DB......', process.env.mongodburi);
                try {
                    this.client = yield mongodb_1.MongoClient.connect(process.env.mongodburi, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: mongodb_1.ServerApiVersion.v1, maxPoolSize: 10 });
                    console.log('Connected to MongoDB');
                    this.isConnected = true;
                    this.db = this.client.db("tgclients").collection('userData');
                    this.statsDb = this.client.db("tgclients").collection('stats');
                    this.statsDb2 = this.client.db("tgclients").collection('stats2');
                    this.activeChannelDb = this.client.db("tgclients").collection('activeChannels');
                    this.promoteStatsDb = this.client.db("tgclients").collection('promoteStats');
                    const clients = yield this.client.db("tgclients").collection('clients').find({}).toArray();
                    this.client.on('close', () => {
                        console.log('MongoDB connection closed.');
                        this.isConnected = false;
                    });
                    clients.forEach(clt => {
                        this.clients = Object.assign(this.clients, { [clt.dbcoll]: clt });
                    });
                    return true;
                }
                catch (error) {
                    console.log(`Error connecting to MongoDB: ${error}`);
                    return false;
                }
            }
            else {
                console.log('MongoConnection ALready Existing');
            }
        });
    }
    checkIfUserAlreadyExists(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const document = yield this.db.findOne({ chatId });
            if (document) {
                return true;
            }
            return false;
        });
    }
    textedClientCount(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const documents = yield this.db.find({ chatId, client: { $ne: process.env.clientId } }).toArray();
                const lastdayProfiles = getRecentProfiles(documents, 24 * 60 * 60 * 1000, 6);
                const lastHourProfiles = getRecentProfiles(documents, 30 * 60 * 1000, 1);
                let count = 0;
                const profiles = documents.map(item => item.profile);
                const profileslastDay = lastdayProfiles.map(item => item.profile);
                const profileslastHour = lastHourProfiles.map(item => item.profile);
                const twoDaysAgo = Date.now() - (1 * 24 * 60 * 60 * 1000);
                for (const doc of documents) {
                    if (doc.payAmount > 9) {
                        count = count - 20;
                    }
                    else {
                        if (doc.canReply == 0) {
                            count = count + 20;
                        }
                        else if (doc.lastMsgTimeStamp > twoDaysAgo) {
                            count++;
                        }
                    }
                }
                const res = { count, list: profiles, lastDay: profileslastDay, lastHour: profileslastHour };
                console.log(res);
                return res;
            }
            catch (error) {
                console.log(error);
                return { count: 1, list: [], lastDay: [], lastHour: [] };
            }
        });
    }
    checkIfPaidToOthers(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = { paid: '', demoGiven: '' };
            try {
                const document = yield this.db.find({ chatId, profile: { $exists: true, "$ne": `${process.env.dbcoll}` }, payAmount: { $gte: 10 } }).toArray();
                const document2 = yield this.db.find({ chatId, profile: { $exists: true, "$ne": `${process.env.dbcoll}` }, demoGiven: true }).toArray();
                if (document.length > 0) {
                    document.map((doc) => {
                        var _a;
                        resp.paid = resp.paid + `@${(_a = this.clients[doc.profile]) === null || _a === void 0 ? void 0 : _a.username}` + ", ";
                    });
                }
                if (document2.length > 0) {
                    document.map((doc) => {
                        var _a;
                        resp.demoGiven = resp.demoGiven + `@${(_a = this.clients[doc.profile]) === null || _a === void 0 ? void 0 : _a.username}` + ", ";
                    });
                }
            }
            catch (error) {
                console.log(error);
            }
            return resp;
        });
    }
    getClientFirstNames() {
        var _a;
        const names = [];
        for (const client in this.clients) {
            if (client.toLowerCase() !== process.env.dbcoll.toLowerCase()) {
                names.push((_a = this.clients[client]) === null || _a === void 0 ? void 0 : _a.dbcoll.toLowerCase());
            }
        }
        return names;
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.findOne({ chatId: data.chatId, profile: { $exists: true, $eq: `${process.env.dbcoll}` } });
            if (result) {
                return result;
            }
            else {
                const userData = Object.assign(Object.assign({}, data), { profile: `${process.env.dbcoll}` });
                const result = yield this.db.insertOne(userData);
                console.log(`New userData created for: ${data.username} | ${data.chatId}`);
                return result.insertedId;
            }
        });
    }
    createOrUpdateStats(chatId, name, payAmount, newUser, demoGiven, paidReply, secondShow, didPay) {
        return __awaiter(this, void 0, void 0, function* () {
            const filter = { chatId, client: process.env.clientId };
            const chat = yield this.statsDb.findOne(filter);
            const chat2 = yield this.statsDb2.findOne(filter);
            if (chat) {
                yield this.statsDb.updateOne(filter, { $set: { count: chat.count + 1, payAmount: payAmount, didPay: didPay, demoGiven: demoGiven, paidReply, secondShow } });
            }
            else {
                yield this.statsDb.insertOne({ chatId, count: 1, payAmount, demoGiven: demoGiven, demoGivenToday: false, newUser, name, secondShow, didPay: false, paidReply, client: process.env.clientId, profile: `${process.env.dbcoll}` });
            }
            if (chat2) {
                yield this.statsDb2.updateOne(filter, { $set: { count: chat2.count + 1, payAmount: payAmount, didPay: didPay, demoGiven: demoGiven, paidReply, secondShow } });
            }
            else {
                yield this.statsDb2.insertOne({ chatId, count: 1, payAmount, demoGiven: demoGiven, demoGivenToday: false, newUser, paidReply, name, secondShow, didPay: false, client: process.env.clientId, profile: `${process.env.dbcoll}` });
                const textedClientCount = yield this.textedClientCount(chatId);
                if (textedClientCount.lastHour.length > 2) {
                    setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        yield this.updateSingleKey(chatId, user.limitTime, Date.now() + (2 * 60 * 60 * 1000));
                    }), 20000);
                }
                const userDetail = yield this.read(chatId);
                if (userDetail) {
                    if ((userDetail === null || userDetail === void 0 ? void 0 : userDetail.payAmount) > 20) {
                        if (userDetail === null || userDetail === void 0 ? void 0 : userDetail.demoGiven) {
                            yield this.updateSingleKey(chatId, user.paidReply, true);
                        }
                        else {
                            yield this.updateSingleKey(chatId, user.paidReply, false);
                        }
                    }
                    else {
                        yield this.updateSingleKey(chatId, user.paidReply, true);
                    }
                }
            }
        });
    }
    updateStatSingleKey(chatId, mykey, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const filter = { chatId, profile: { $exists: true, $eq: `${process.env.dbcoll}` } };
            yield this.statsDb.updateOne(filter, { $set: { [mykey]: value } }, { upsert: true, returnDocument: 'after' });
            yield this.statsDb2.updateOne(filter, { $set: { [mykey]: value } }, { upsert: true, returnDocument: 'after' });
        });
    }
    delete(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.deleteMany({ chatId, profile: { $exists: true, $eq: `${process.env.dbcoll}` } });
        });
    }
    read(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.findOne({ chatId, profile: { $exists: true, $eq: `${process.env.dbcoll}` } });
            if (result) {
                return result;
            }
            else {
                return undefined;
            }
        });
    }
    getAChannel() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.promoteStatsDb.findOne({ client: process.env.clientId });
            let lowestKey;
            let lowestValue;
            const data = result.data;
            for (const [key, value] of Object.entries(data.data)) {
                if (lowestValue === null || value < lowestValue) {
                    lowestKey = key;
                    lowestValue = value;
                }
            }
            return lowestKey;
        });
    }
    ;
    addTodaysChannels(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const clientId = process.env.clientId;
            const result = yield this.promoteStatsDb.updateOne({ client: clientId }, {
                $set: {
                    channels: data
                },
            }, { upsert: true });
        });
    }
    updatePromoteStats(channelName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const clientId = process.env.clientId;
                const existingDocument = yield this.promoteStatsDb.findOne({ client: clientId });
                let count = 0;
                let data = {};
                let totalCount = 0;
                if (existingDocument) {
                    count = existingDocument.count + 1;
                    data = existingDocument.data;
                    totalCount = existingDocument.totalCount;
                }
                if (data[channelName]) {
                    data[channelName]++;
                }
                else {
                    data[channelName] = 1;
                }
                totalCount++;
                const uniqueChannels = Object.keys(data).length;
                // const sortedDataEntries = Object.entries(data).sort((a, b) => b[1] - a[1]);
                // const sortedData = Object.fromEntries(sortedDataEntries);
                const result = yield this.promoteStatsDb.updateOne({ client: clientId }, {
                    $set: {
                        totalCount: totalCount,
                        data: data,
                        uniqueChannels: uniqueChannels,
                        lastUpdatedTimeStamp: Date.now(),
                        releaseDay: Date.now(),
                        isActive: true
                    },
                }, { upsert: true });
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    activatePromotions() {
        return __awaiter(this, void 0, void 0, function* () {
            const clientId = process.env.clientId;
            const result = yield this.promoteStatsDb.updateOne({ client: clientId }, {
                $set: {
                    releaseDay: Date.now(),
                    isActive: true
                },
            }, { upsert: true });
        });
    }
    deactivatePromotions(day = Date.now()) {
        return __awaiter(this, void 0, void 0, function* () {
            const clientId = process.env.clientId;
            const result = yield this.promoteStatsDb.updateOne({ client: clientId }, {
                $set: {
                    releaseDay: day,
                    isActive: false
                },
            }, { upsert: true });
        });
    }
    readPromoteStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.promoteStatsDb.findOne({ "client": process.env.clientId });
            return result;
        });
    }
    readPromoteStatsTime() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.promoteStatsDb.findOne({ "client": process.env.clientId }, { projection: { "client": 1, "totalCount": 1, "lastUpdatedTimeStamp": 1, "isActive": 1, "_id": 0 } });
            return result;
        });
    }
    readstats() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.statsDb.find({ client: process.env.clientId }).sort({ newUser: -1 });
            if (result) {
                return result.toArray();
            }
            else {
                return undefined;
            }
        });
    }
    readstats2() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.statsDb2.find({ client: process.env.clientId }).sort({ newUser: -1 });
            if (result) {
                return result.toArray();
            }
            else {
                return [];
            }
        });
    }
    readstats2Opt() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.statsDb2.aggregate([
                { $match: { client: process.env.clientId } },
                {
                    $group: {
                        _id: null,
                        totalCount: { $sum: "$count" },
                        userCount: { $sum: 1 }
                    }
                }
            ]).toArray();
        });
    }
    getTodayPaidUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.statsDb2.find({ client: process.env.clientId, payAmount: { $gt: 10 } });
                if (result) {
                    const res = yield result.toArray();
                    let newUsers = 0;
                    for (const u of res) {
                        if (u.true) {
                            newUsers++;
                        }
                    }
                    return ({ total: res.length || 0, new: newUsers || 0 });
                }
                else {
                    return ({ total: 0, new: 0 });
                }
            }
            catch (error) {
                console.log(error);
                return ({ total: 0, new: 0 });
            }
        });
    }
    checkIfPaidTodayToOthers(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.statsDb2.find({ chatId: chatId, client: { $ne: `${process.env.clientId}` } }).sort({ newUser: -1 });
            if (result) {
                const res = result.toArray();
                if (res.length > 0) {
                    return true;
                }
                return false;
            }
            else {
                return false;
            }
        });
    }
    readSingleStats(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.statsDb.find({ chatId, client: process.env.clientId }).sort({ newUser: -1 });
            if (result) {
                return result.toArray();
            }
            else {
                return undefined;
            }
        });
    }
    removeSingleStat(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.statsDb.deleteMany({ chatId, profile: process.env.dbcoll });
            }
            catch (error) {
                console.log("Unable to delete");
            }
        });
    }
    readRecentPaidPpl() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.statsDb.find({ client: process.env.clientId, payAmount: { $gt: 26 } });
            if (result) {
                return result.toArray();
            }
            else {
                return undefined;
            }
        });
    }
    readRecentPaidPpl2() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.statsDb2.find({ client: process.env.clientId, payAmount: { $gt: 25 } });
            if (result) {
                return result.toArray();
            }
            else {
                return undefined;
            }
        });
    }
    todayPaidPpl() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.statsDb2.find({ client: process.env.clientId, newUser: true, payAmount: { $gt: 25 } });
            if (result) {
                return result.toArray();
            }
            else {
                return undefined;
            }
        });
    }
    getPaidList() {
        return __awaiter(this, void 0, void 0, function* () {
            let ppl = '';
            const result = yield this.db.find({ payAmount: { $gt: 26 } }).sort({ lastMsgTimeStamp: -1 }).limit(25).toArray();
            if (result) {
                result.forEach((element) => {
                    ppl = ppl + '\n ' + (element === null || element === void 0 ? void 0 : element.username) + ' : ' + (element === null || element === void 0 ? void 0 : element.paidCount) + "|" + (element === null || element === void 0 ? void 0 : element.payAmount);
                });
                return ppl;
            }
            else {
                return undefined;
            }
        });
    }
    getPaidListIds() {
        return __awaiter(this, void 0, void 0, function* () {
            let ppl = [];
            const result = yield this.db.find({ payAmount: { $gt: 26 } }).sort({ lastMsgTimeStamp: -1 }).limit(25).toArray();
            if (result) {
                result.forEach((element) => __awaiter(this, void 0, void 0, function* () {
                    const id = (element === null || element === void 0 ? void 0 : element.username.startsWith("@")) ? element === null || element === void 0 ? void 0 : element.username : element === null || element === void 0 ? void 0 : element.chatId;
                    ppl.push({ userId: id, accessHash: element.accessHash, paidReply: element.paidReply, payAmount: element.payAmount });
                    // const chatId = element.chatId
                    // const result = await this.db.updateOne({ chatId }, { $set: { limitTime: Date.now() + (3 * 60 * 60 * 1000) } });
                }));
                return ppl;
            }
            else {
                return undefined;
            }
        });
    }
    // Update a UserDataDto in the database by chatId
    update(chatId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.updateOne({ chatId, profile: { $exists: true, $eq: `${process.env.dbcoll}` } }, { $set: Object.assign(Object.assign({}, updates), { lastMsgTimeStamp: Date.now() }) }, { upsert: true, returnDocument: 'after' });
        });
    }
    resetUnpaid() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.updateMany({ "_id": { $lt: new mongodb_1.ObjectId("63fca4730000000000000000") }, "paidCount": { $gt: 0 }, "payAmount": 0 }, { $set: { paidCount: 0 } });
            return result;
        });
    }
    resetPpl() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.updateMany({}, { $set: { paidReply: true } });
            return result;
        });
    }
    remove(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.deleteMany({ chatId, profile: { $exists: true, $eq: `${process.env.dbcoll}` } });
        });
    }
    getSingleKey(chatId, key) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.findOne({ chatId, profile: { $exists: true, $eq: `${process.env.dbcoll}` } }, { projection: { [key]: 1 } });
            if (result) {
                return result[key];
            }
            else {
                return undefined;
            }
        });
    }
    updateSingleKey(chatId, key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.updateOne({ chatId, profile: { $exists: true, $eq: `${process.env.dbcoll}` } }, { $set: { [key]: value, lastMsgTimeStamp: Date.now() } });
        });
    }
    getPromoteMsgs() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const channelDb = this.client.db("tgclients").collection('promoteMsgs');
                return yield channelDb.findOne({});
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    removeFromAvailableMsgs(filter, valueToRemove) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.activeChannelDb.updateOne(filter, { $pull: { availableMsgs: valueToRemove } });
                console.log(`${result.modifiedCount} document(s) updated.`);
            }
            catch (error) {
                console.error('Error occurred:', error);
            }
        });
    }
    addToAvailableMsgs(filter, valueToAdd) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.activeChannelDb.updateOne(filter, { $addToSet: { availableMsgs: valueToAdd } });
                console.log(`${result.modifiedCount} document(s) updated.`);
            }
            catch (error) {
                console.error('Error occurred:', error);
            }
        });
    }
    // async getAvgCalculatedChannels() {
    //     const channelStatsDb = this.client.db("tgclients").collection('channelStats');
    //     const results = await channelStatsDb.find({ averageCalculated: true }, { projection: { channelId: 1, _id: 0 } }).toArray();
    //     const ids = [];
    //     results.map(doc => {
    //         ids.push(doc.channelId)
    //     })
    //     return ids;
    // } 
    // async saveChannelStatsToDB(chatRequestCounts: { [chatId: string]: number }): Promise<void> {
    //     try {
    //         const channelStatsDb = this.client.db("tgclients").collection('channelStats');
    //         // Calculate the time 1 minutes ago
    //         for (const chatId in chatRequestCounts) {
    //             const channelId = chatId.replace(/^-100/, "")
    //             const existingStats = await channelStatsDb.findOne({ channelId });
    //             const oneMinutesAgo = new Date(Date.now() - 1 * 60 * 1000);
    //             if (!existingStats || existingStats?.updatedAt <= oneMinutesAgo) {
    //                 const requestCount: number = chatRequestCounts[chatId];
    //                 const chatStats = await channelStatsDb.updateOne(
    //                     { channelId },
    //                     {
    //                         $push: { requestCounts: requestCount },
    //                         $set: { updatedAt: Date.now() }
    //                     },
    //                     { upsert: true }
    //                 );
    //             }
    //             chatRequestCounts[chatId] = 0;
    //         }
    //     } catch (error) {
    //         console.log(error)
    //     }
    // }
    updateActiveChannel(filter, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.activeChannelDb.updateOne(filter, {
                $set: Object.assign({}, data),
            }, { upsert: true });
        });
    }
    getChannel(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const channelDb = this.client.db("tgclients").collection('channels');
            const result = yield channelDb.findOne(filter);
            return result;
        });
    }
    getActiveChannel(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.activeChannelDb.findOne(filter);
            return result;
        });
    }
    removeOnefromActiveChannel(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.activeChannelDb.deleteOne(filter);
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    removeOnefromChannel(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const channelDb = this.client.db("tgclients").collection('channels');
                yield channelDb.deleteOne(filter);
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    closeConnection() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.isConnected) {
                    this.isConnected = false;
                    console.log('MongoDB connection closed.');
                }
                yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.close());
            }
            catch (error) {
                console.log(error);
            }
        });
    }
}
exports.UserDataDtoCrud = UserDataDtoCrud;
function getRecentProfiles(data, time, expectedCount) {
    const currentTime = Date.now();
    const oldTime = currentTime - time;
    const filteredData = data.filter(item => {
        const condition = ((item.lastMsgTimeStamp > oldTime) && (item.totalCount > expectedCount) && (item.payAmount < 10));
        return (condition);
    });
    return filteredData;
}


/***/ }),

/***/ "./src/fetchWithTimeout.ts":
/*!*********************************!*\
  !*** ./src/fetchWithTimeout.ts ***!
  \*********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.fetchWithTimeout = void 0;
const axios_1 = __importDefault(__webpack_require__(/*! axios */ "axios"));
const parseError_1 = __webpack_require__(/*! ./parseError */ "./src/parseError.ts");
const ppplbot = `https://api.telegram.org/bot6735591051:AAELwIkSHegcBIVv5pf484Pn09WNQj1Nl54/sendMessage?chat_id=${process.env.updatesChannel}`;
function fetchWithTimeout(resource, options = {}, sendErr = true, maxRetries = 1) {
    return __awaiter(this, void 0, void 0, function* () {
        options.timeout = options.timeout || 50000;
        options.method = options.method || 'GET';
        const fetchWithProtocol = (url, version) => __awaiter(this, void 0, void 0, function* () {
            const source = axios_1.default.CancelToken.source();
            const id = setTimeout(() => {
                source.cancel(`Request timed out after ${options.timeout}ms`);
            }, options.timeout);
            const defaultHeaders = {
                'Content-Type': 'application/json'
            };
            const headers = Object.assign(Object.assign({}, defaultHeaders), options.headers);
            try {
                const response = yield (0, axios_1.default)(Object.assign(Object.assign({ headers }, options), { url, cancelToken: source.token, family: version }));
                clearTimeout(id);
                return response;
            }
            catch (error) {
                clearTimeout(id);
                console.log(`Error at URL (IPv${version}): `, url);
                if (axios_1.default.isCancel(error)) {
                    console.log('Request canceled:', error.message, url);
                    return undefined;
                }
                throw error; // Rethrow the error to handle retry logic outside
            }
        });
        for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
            try {
                const responseIPv4 = yield fetchWithProtocol(resource, 4);
                if (responseIPv4)
                    return responseIPv4;
                const responseIPv6 = yield fetchWithProtocol(resource, 6);
                if (responseIPv6)
                    return responseIPv6;
            }
            catch (error) {
                console.log("Error at URL : ", resource);
                const errorDetails = (0, parseError_1.parseError)(error, undefined, false);
                if (errorDetails.status.toString() !== '429' && error.code !== 'ERR_NETWORK' && error.code !== "ECONNABORTED" && error.code !== "ETIMEDOUT" && !errorDetails.message.toLowerCase().includes('too many requests') && !axios_1.default.isCancel(error)) {
                    if (retryCount < maxRetries) {
                        console.log(`Retrying... (${retryCount + 1}/${maxRetries})`);
                        yield new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds delay
                    }
                    else {
                        console.log(`All ${maxRetries + 1} retries failed for ${resource}`);
                        if (sendErr) {
                            axios_1.default.get(`${ppplbot}&text=${encodeURIComponent(`HELPER :: All ${maxRetries + 1} retries failed for ${resource}\n${errorDetails.message}`)}`);
                        }
                        return undefined;
                    }
                }
            }
        }
    });
}
exports.fetchWithTimeout = fetchWithTimeout;


/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.prcessID = void 0;
const express_1 = __importDefault(__webpack_require__(/*! express */ "express"));
const fetchWithTimeout_1 = __webpack_require__(/*! ./fetchWithTimeout */ "./src/fetchWithTimeout.ts");
const dbservice_1 = __webpack_require__(/*! ./dbservice */ "./src/dbservice.ts");
const TelegramManager_1 = __importDefault(__webpack_require__(/*! ./TelegramManager */ "./src/TelegramManager.ts"));
const parseError_1 = __webpack_require__(/*! ./parseError */ "./src/parseError.ts");
const connection_1 = __webpack_require__(/*! ./connection */ "./src/connection.ts");
let canTry2 = true;
const ppplbot = `https://api.telegram.org/bot6735591051:AAELwIkSHegcBIVv5pf484Pn09WNQj1Nl54/sendMessage?chat_id=${process.env.updatesChannel}`;
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
exports.prcessID = Math.floor(Math.random() * 123);
console.log("PRocessID: ", exports.prcessID);
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send("Hello World");
});
app.get('/sendtoall', (req, res, next) => {
    res.send(`Sending ${req.query.query}`);
    next();
}, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const endpoint = req.query.query;
    yield sendToAll(endpoint);
}));
app.get('/getProcessId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ ProcessId: exports.prcessID.toString() });
}));
app.get('/tryToConnect/:num', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.send('OK');
    next();
}), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const receivePrcssId = parseInt((_a = req.params) === null || _a === void 0 ? void 0 : _a.num);
    console.log(exports.prcessID, 'Connect Req received from: ', receivePrcssId);
    try {
        if (canTry2) {
            if (receivePrcssId === exports.prcessID) {
                // const isAlive = await fetchWithTimeout(`${ppplbot}&text=${(process.env.clientId).toUpperCase()}: Alive Check`);
                // if (isAlive) {
                yield sleep(300);
                if (connection_1.sendPing === false) {
                    console.log('Trying to Initiate CLIENT');
                    canTry2 = false;
                    setTimeout(() => {
                        canTry2 = true;
                    }, 70000);
                    let canStart = true;
                    for (let i = 0; i < 3; i++) {
                        // const resp = await fetchWithTimeout(`${ppplbot}&text=exit${process.env.username}`);
                        // if (resp) {
                        //   canStart = true;
                        //   break;
                        // }
                    }
                    yield sleep(3000);
                    // await fetchWithTimeout(`${ppplbot}&text=exit${process.env.username}`);
                    if (canStart) {
                        // await fetchWithTimeout(`${ppplbot}&text=${(process.env.clientId).toUpperCase()}: Connecting.......!!`);
                        yield startConn();
                    }
                    // } else {
                    //     await fetchWithTimeout(`${ppplbot}&text=${(process.env.clientId).toUpperCase()}: Pinging is Working`);
                    // }
                }
                else {
                    console.log('Issue at sending Pings');
                }
            }
            else {
                console.log('SomeOther Unknown Process Exist');
                yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${ppplbot}&text=${(process.env.clientId).toUpperCase()}: SomeOther Unknown Process Exist`);
            }
        }
    }
    catch (error) {
        (0, parseError_1.parseError)(error);
    }
}));
function startConn() {
    return __awaiter(this, void 0, void 0, function* () {
        const userDataDtoCrud = dbservice_1.UserDataDtoCrud.getInstance();
        if (!userDataDtoCrud.isConnected) {
            try {
                const isConnected = yield userDataDtoCrud.connect();
                if (isConnected) {
                    yield TelegramManager_1.default.getInstance().createClient();
                }
                else {
                    console.log('Error While Connecting to DB=====', isConnected);
                }
            }
            catch (error) {
                console.log('Error While Connecting to DB', error);
            }
        }
        else {
            yield TelegramManager_1.default.getInstance().createClient();
        }
    });
}
app.get('/exitPrimary', (req, res, next) => {
    res.send(`exitting Primary`);
    next();
}, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, fetchWithTimeout_1.fetchWithTimeout)(`https://uptimechecker2.onrender.com/maskedcls`);
    const clients = result === null || result === void 0 ? void 0 : result.data;
    for (const client of clients) {
        if (client.clientId.toLowerCase().includes('1')) {
            yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${client.repl}/exit`);
            yield sleep(40000);
        }
    }
}));
app.get('/exitSecondary', (req, res, next) => {
    res.send(`exitting Secondary`);
    next();
}, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, fetchWithTimeout_1.fetchWithTimeout)(`https://uptimechecker2.onrender.com/maskedcls`);
    const clients = result === null || result === void 0 ? void 0 : result.data;
    for (const client of clients) {
        if (client.clientId.toLowerCase().includes('2')) {
            yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${client.repl}/exit`);
            yield sleep(40000);
        }
    }
}));
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
function sendToAll(endpoint) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield (0, fetchWithTimeout_1.fetchWithTimeout)(`https://uptimechecker2.onrender.com/maskedcls`);
        const clients = result === null || result === void 0 ? void 0 : result.data;
        for (const client of clients) {
            const url = `${client.repl}/${endpoint}`;
            console.log("Trying : ", url);
            yield (0, fetchWithTimeout_1.fetchWithTimeout)(url);
            yield sleep(500);
        }
    });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


/***/ }),

/***/ "./src/parseError.ts":
/*!***************************!*\
  !*** ./src/parseError.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseError = void 0;
const fetchWithTimeout_1 = __webpack_require__(/*! ./fetchWithTimeout */ "./src/fetchWithTimeout.ts");
const notifbot = `https://api.telegram.org/bot5856546982:AAEW5QCbfb7nFAcmsTyVjHXyV86TVVLcL_g/sendMessage?chat_id=${process.env.notifChannel}`;
function parseError(err, prefix, sendErr = true) {
    var _a, _b, _c, _d, _e, _f;
    let status = 'UNKNOWN';
    let message = 'An unknown error occurred';
    let error = 'UnknownError';
    prefix = `${process.env.clientId} - ${prefix ? prefix : ""}`;
    const extractMessage = (data) => {
        if (Array.isArray(data)) {
            const messages = data.map((item) => extractMessage(item));
            return messages.filter((message) => message !== undefined).join(', ');
        }
        else if (typeof data === 'string') {
            return data;
        }
        else if (typeof data === 'object' && data !== null) {
            let resultString = '';
            for (const key in data) {
                const value = data[key];
                if (Array.isArray(data[key]) && data[key].every(item => typeof item === 'string')) {
                    resultString = resultString + data[key].join(', ');
                }
                else {
                    const result = extractMessage(value);
                    if (result) {
                        resultString = resultString + result;
                    }
                }
            }
            return resultString;
        }
        return JSON.stringify(data);
    };
    if (err.response) {
        console.log("Checking in response");
        const response = err.response;
        status =
            ((_a = response.data) === null || _a === void 0 ? void 0 : _a.status) ||
                response.status ||
                err.status ||
                'UNKNOWN';
        message =
            ((_b = response.data) === null || _b === void 0 ? void 0 : _b.message) ||
                ((_c = response.data) === null || _c === void 0 ? void 0 : _c.errors) ||
                response.message ||
                response.statusText ||
                response.data ||
                err.message ||
                'An error occurred';
        error =
            ((_d = response.data) === null || _d === void 0 ? void 0 : _d.error) ||
                response.error ||
                err.name ||
                err.code ||
                'Error';
    }
    else if (err.request) {
        console.log("Checking in request");
        status = err.status || 'NO_RESPONSE';
        message = ((_e = err.data) === null || _e === void 0 ? void 0 : _e.message) ||
            ((_f = err.data) === null || _f === void 0 ? void 0 : _f.errors) ||
            err.message ||
            err.statusText ||
            err.data ||
            err.message || 'The request was triggered but no response was received';
        error = err.name || err.code || 'NoResponseError';
    }
    else if (err.message) {
        console.log("Checking in error");
        status = err.status || 'UNKNOWN';
        message = err.message;
        error = err.name || err.code || 'Error';
    }
    else if (err.errorMessage) {
        status = err.status || 'UNKNOWN';
        message = err.errorMessage;
        error = err.name || err.code || 'Error';
    }
    const msg = `${prefix ? `${prefix} ::` : ""} ${extractMessage(message)} `;
    const resp = { status, message: msg, error };
    console.log(resp);
    if (sendErr && !msg.includes("INPUT_USER_DEACTIVATED")) {
        (0, fetchWithTimeout_1.fetchWithTimeout)(`${notifbot}&text=${resp.message}`);
    }
    return resp;
}
exports.parseError = parseError;


/***/ }),

/***/ "./src/react.ts":
/*!**********************!*\
  !*** ./src/react.ts ***!
  \**********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.react = void 0;
const telegram_1 = __webpack_require__(/*! telegram */ "telegram");
const users_1 = __webpack_require__(/*! telegram/client/users */ "telegram/client/users");
const Helpers_1 = __webpack_require__(/*! telegram/Helpers */ "telegram/Helpers");
const fetchWithTimeout_1 = __webpack_require__(/*! ./fetchWithTimeout */ "./src/fetchWithTimeout.ts");
const parseError_1 = __webpack_require__(/*! ./parseError */ "./src/parseError.ts");
const ReactQueue_1 = __webpack_require__(/*! ./ReactQueue */ "./src/ReactQueue.ts");
const utils_1 = __webpack_require__(/*! ./utils */ "./src/utils.ts");
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
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
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
exports.react = react;


/***/ }),

/***/ "./src/utils.ts":
/*!**********************!*\
  !*** ./src/utils.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.defaultMessages = exports.defaultReactions = exports.ppplbot = exports.parseError = exports.fetchNumbersFromString = exports.toBoolean = exports.selectRandomElements = exports.contains = exports.sleep = void 0;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
function contains(str, arr) {
    return (arr.some(element => {
        if (str === null || str === void 0 ? void 0 : str.includes(element)) {
            return true;
        }
        return false;
    }));
}
exports.contains = contains;
;
function selectRandomElements(array, n) {
    if (array) {
        const selectedElements = [];
        for (let i = 0; i < n; i++) {
            const randomIndex = Math.floor(Math.random() * array.length);
            selectedElements.push(array[randomIndex]);
        }
        return selectedElements;
    }
    else {
        return [];
    }
}
exports.selectRandomElements = selectRandomElements;
function toBoolean(value) {
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }
    if (typeof value === 'number') {
        return value === 1;
    }
    return value;
}
exports.toBoolean = toBoolean;
function fetchNumbersFromString(inputString) {
    const regex = /\d+/g;
    const matches = inputString.match(regex);
    if (matches) {
        const result = matches.join('');
        return result;
    }
    else {
        return '';
    }
}
exports.fetchNumbersFromString = fetchNumbersFromString;
function parseError(err, prefix = 'TgCms') {
    var _a, _b, _c, _d, _e, _f;
    let status = 'UNKNOWN';
    let message = 'An unknown error occurred';
    let error = 'UnknownError';
    const extractMessage = (data) => {
        if (Array.isArray(data)) {
            const messages = data.map((item) => extractMessage(item));
            return messages.filter((message) => message !== undefined).join(', ');
        }
        else if (typeof data === 'string') {
            return data;
        }
        else if (typeof data === 'object' && data !== null) {
            let resultString = '';
            for (const key in data) {
                const value = data[key];
                if (Array.isArray(data[key]) && data[key].every(item => typeof item === 'string')) {
                    resultString = resultString + data[key].join(', ');
                }
                else {
                    const result = extractMessage(value);
                    if (result) {
                        resultString = resultString + result;
                    }
                }
            }
            return resultString;
        }
        return JSON.stringify(data);
    };
    if (err.response) {
        const response = err.response;
        status =
            ((_a = response.data) === null || _a === void 0 ? void 0 : _a.status) ||
                response.status ||
                err.status ||
                'UNKNOWN';
        message =
            ((_b = response.data) === null || _b === void 0 ? void 0 : _b.message) ||
                ((_c = response.data) === null || _c === void 0 ? void 0 : _c.errors) ||
                response.message ||
                response.statusText ||
                response.data ||
                err.message ||
                'An error occurred';
        error =
            ((_d = response.data) === null || _d === void 0 ? void 0 : _d.error) ||
                response.error ||
                err.name ||
                err.code ||
                'Error';
    }
    else if (err.request) {
        status = err.status || 'NO_RESPONSE';
        message = ((_e = err.data) === null || _e === void 0 ? void 0 : _e.message) ||
            ((_f = err.data) === null || _f === void 0 ? void 0 : _f.errors) ||
            err.message ||
            err.statusText ||
            err.data ||
            err.message || 'The request was triggered but no response was received';
        error = err.name || err.code || 'NoResponseError';
    }
    else if (err.message) {
        status = err.status || 'UNKNOWN';
        message = err.message;
        error = err.name || err.code || 'Error';
    }
    else if (err.errorMessage) {
        status = err.status || 'UNKNOWN';
        message = err.errorMessage;
        error = err.name || err.code || 'Error';
    }
    const msg = `${prefix ? `${prefix} ::` : ""} ${extractMessage(message)} `;
    const resp = { status, message: msg, error };
    console.log(resp.error == 'RPCError' ? resp.message : resp);
    return resp;
}
exports.parseError = parseError;
let botCount = 0;
function ppplbot(chatId, botToken) {
    let token = botToken;
    if (!token) {
        if (botCount % 2 === 1) {
            token = 'bot6624618034:AAHoM3GYaw3_uRadOWYzT7c2OEp6a7A61mY';
        }
        else {
            token = 'bot6607225097:AAG6DJg9Ll5XVxy24Nr449LTZgRb5bgshUA';
        }
        botCount++;
    }
    const targetChatId = chatId || '-1001801844217'; // Replace with actual chat ID
    const apiUrl = `https://api.telegram.org/${token}/sendMessage?chat_id=${targetChatId}`;
    return apiUrl;
}
exports.ppplbot = ppplbot;
;
exports.defaultReactions = [
    '❤', '🔥', '👏', '🥰', '😁', '🤔',
    '🤯', '😱', '🤬', '😢', '🎉', '🤩',
    '🤮', '💩', '🙏', '👌', '🕊', '🤡',
    '🥱', '🥴', '😍', '🐳', '❤‍🔥', '💯',
    '🤣', '💔', '🏆', '😭', '😴', '👍',
    '🌚', '⚡', '🍌', '😐', '💋', '👻',
    '👀', '🙈', '🤝', '🤗', '🆒',
    '🗿', '🙉', '🙊', '🤷', '👎'
];
exports.defaultMessages = [
    "1", "2", "3", "4", "5", "6", "7", "8",
    "9", "10", "11", "12", "13", "14", "15",
    "16", "17", "18"
];


/***/ }),

/***/ "axios":
/*!************************!*\
  !*** external "axios" ***!
  \************************/
/***/ ((module) => {

module.exports = require("axios");

/***/ }),

/***/ "big-integer":
/*!******************************!*\
  !*** external "big-integer" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("big-integer");

/***/ }),

/***/ "dotenv":
/*!*************************!*\
  !*** external "dotenv" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("dotenv");

/***/ }),

/***/ "express":
/*!**************************!*\
  !*** external "express" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("express");

/***/ }),

/***/ "mongodb":
/*!**************************!*\
  !*** external "mongodb" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("mongodb");

/***/ }),

/***/ "node-fetch":
/*!*****************************!*\
  !*** external "node-fetch" ***!
  \*****************************/
/***/ ((module) => {

module.exports = require("node-fetch");

/***/ }),

/***/ "telegram":
/*!***************************!*\
  !*** external "telegram" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("telegram");

/***/ }),

/***/ "telegram/Helpers":
/*!***********************************!*\
  !*** external "telegram/Helpers" ***!
  \***********************************/
/***/ ((module) => {

module.exports = require("telegram/Helpers");

/***/ }),

/***/ "telegram/client/uploads":
/*!******************************************!*\
  !*** external "telegram/client/uploads" ***!
  \******************************************/
/***/ ((module) => {

module.exports = require("telegram/client/uploads");

/***/ }),

/***/ "telegram/client/users":
/*!****************************************!*\
  !*** external "telegram/client/users" ***!
  \****************************************/
/***/ ((module) => {

module.exports = require("telegram/client/users");

/***/ }),

/***/ "telegram/events":
/*!**********************************!*\
  !*** external "telegram/events" ***!
  \**********************************/
/***/ ((module) => {

module.exports = require("telegram/events");

/***/ }),

/***/ "telegram/extensions/Logger":
/*!*********************************************!*\
  !*** external "telegram/extensions/Logger" ***!
  \*********************************************/
/***/ ((module) => {

module.exports = require("telegram/extensions/Logger");

/***/ }),

/***/ "telegram/sessions":
/*!************************************!*\
  !*** external "telegram/sessions" ***!
  \************************************/
/***/ ((module) => {

module.exports = require("telegram/sessions");

/***/ }),

/***/ "telegram/tl":
/*!******************************!*\
  !*** external "telegram/tl" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("telegram/tl");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/config.ts");
/******/ 	var __webpack_export_target__ = exports;
/******/ 	for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
/******/ 	if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map