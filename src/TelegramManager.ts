import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { Api } from 'telegram/tl';
import axios from 'axios';
import * as fs from 'fs';
import { CustomFile } from 'telegram/client/uploads';
import { contains, parseError, ppplbot } from './utils';
import { TotalList, sleep } from 'telegram/Helpers';
import { Dialog } from 'telegram/tl/custom/dialog';
import { LogLevel } from 'telegram/extensions/Logger';
import bigInt from 'big-integer';
import { IterDialogsParams } from 'telegram/client/dialogs';
import { react } from './react';
import { PromoteToGrp } from './promotions';
import { fetchWithTimeout } from './fetchWithTimeout';
import { setSendPing } from './connection';

class TelegramManager {
    private session: StringSession;
    public phoneNumber: string | undefined;
    static client: TelegramClient | null;
    private channelArray: string[];
    private static activeClientSetup: { days?: number, archiveOld: boolean, formalities: boolean, newMobile: string, existingMobile: string, clientId: string };
    static instance: any;

    constructor() {
        TelegramManager.client = null;
        this.channelArray = [];
    }

    public static getInstance(): TelegramManager {
        if (!TelegramManager.instance) {
            TelegramManager.instance = new TelegramManager();
        }
        return TelegramManager.instance;
    }

    public static getActiveClientSetup() {
        return TelegramManager.activeClientSetup;
    }

    public static setActiveClientSetup(data: { days?: number, archiveOld: boolean, formalities: boolean, newMobile: string, existingMobile: string, clientId: string } | undefined) {
        TelegramManager.activeClientSetup = data;
    }

    async disconnect(): Promise<void> {
        if (TelegramManager.client) {
            console.log("Destroying Client: ", this.phoneNumber)
            await TelegramManager.client.destroy();
            TelegramManager.client._destroyed = true
            await TelegramManager.client.disconnect();
        }
        this.session.delete();
    }

    async getchatId(username: string): Promise<any> {
        if (!TelegramManager.client) throw new Error('Client is not initialized');
        const entity = await TelegramManager.client.getInputEntity(username);
        return entity;
    }

    async getMe() {
        const me = <Api.User>await TelegramManager.client.getMe();
        return me
    }

    async errorHandler(error: { message: string; }) {
        if (error.message && error.message == 'TIMEOUT') {
            //Do nothing, as this error does not make sense to appear while keeping the client disconnected
        } else {
            console.error(`Error occurred for API ID ${this.phoneNumber}:`, error);
            // Handle other types of errors
        }
    }

    async createClient(handler = true): Promise<TelegramClient> {
        const result2 = <any>await fetchWithTimeout(`https://uptimechecker2.glitch.me/archived-clients/fetchOne/${process.env.mobile}`);
        console.log("ArchivedClient : ", result2.data)
        TelegramManager.client = new TelegramClient(new StringSession(result2.data.session), parseInt(process.env.API_ID), process.env.API_HASH, {
            connectionRetries: 5,
        });
        TelegramManager.client.setLogLevel(LogLevel.ERROR);
        //TelegramManager.client._errorHandler = this.errorHandler
        await TelegramManager.client.connect();
        const me = <Api.User>await TelegramManager.client.getMe();
        console.log("Connected Client : ", me.phone, me.username);
        if (handler && TelegramManager.client) {
            console.log("Adding event Handler")
            TelegramManager.client.addEventHandler(async (event) => { await this.handleEvents(event); }, new NewMessage());
        }
        // PromoteToGrp(TelegramManager.client)
        return TelegramManager.client
    }

    async getMessages(entityLike: Api.TypeEntityLike, limit: number = 8): Promise<TotalList<Api.Message>> {
        const messages = await TelegramManager.client.getMessages(entityLike, { limit });
        return messages;
    }
    async getDialogs(params: IterDialogsParams): Promise<TotalList<Dialog>> {
        const chats = await TelegramManager.client.getDialogs(params);
        console.log("TotalChats:", chats.total);
        return chats
    }

    async getLastMsgs(limit: number): Promise<string> {
        if (!TelegramManager.client) throw new Error('Client is not initialized');
        const msgs = await TelegramManager.client.getMessages("777000", { limit });
        let resp = '';
        msgs.forEach((msg) => {
            console.log(msg.text);
            resp += msg.text + "\n";
        });
        return resp;
    }

    async getSelfMSgsInfo(): Promise<{ photoCount: number; videoCount: number; movieCount: number, total: number }> {
        if (!TelegramManager.client) throw new Error('Client is not initialized');
        const self = <Api.User>await TelegramManager.client.getMe();
        const selfChatId = self.id;

        let photoCount = 0;
        let videoCount = 0;
        let movieCount = 0;

        const messageHistory = await TelegramManager.client.getMessages(selfChatId, { limit: 200 });
        for (const message of messageHistory) {
            if (message.photo) {
                photoCount++;
            } else if (message.video) {
                videoCount++;
            }
            const text = message.text.toLocaleLowerCase();
            if (contains(text, ['movie', 'series', '1080', '720', '640', 'title', 'aac', '265', 'hdrip', 'mkv', 'hq', '480', 'blura', 's0', 'se0', 'uncut'])) {
                movieCount++;
            }
        }

        return { photoCount, videoCount, movieCount, total: messageHistory.total };
    }

    async channelInfo(sendIds = true): Promise<{ chatsArrayLength: number; canSendTrueCount: number; canSendFalseCount: number; ids: string[] }> {
        if (!TelegramManager.client) throw new Error('Client is not initialized');
        const chats = await TelegramManager.client.getDialogs({ limit: 500 });
        let canSendTrueCount = 0;
        let canSendFalseCount = 0;
        let totalCount = 0;
        this.channelArray.length = 0;
        console.log("TotalChats:", chats.total);
        for (const chat of chats) {
            if (chat.isChannel || chat.isGroup) {
                try {
                    const chatEntity = <Api.Channel>chat.entity.toJSON();
                    const { broadcast, defaultBannedRights } = chatEntity;
                    totalCount++;
                    if (!broadcast && !defaultBannedRights?.sendMessages) {
                        canSendTrueCount++;
                        this.channelArray.push(chatEntity.id.toString());
                    } else {
                        canSendFalseCount++;
                    }
                } catch (error) {
                    parseError(error);
                }
            }
        };
        return {
            chatsArrayLength: totalCount,
            canSendTrueCount,
            canSendFalseCount,
            ids: sendIds ? this.channelArray : []
        };
    }

    async getEntity(entity: Api.TypeEntityLike) {
        return await TelegramManager.client?.getEntity(entity)
    }

    async joinChannel(entity: Api.TypeEntityLike) {
        return await TelegramManager.client?.invoke(
            new Api.channels.JoinChannel({
                channel: await TelegramManager.client?.getEntity(entity)
            })
        );
    }

    connected() {
        return TelegramManager.client.connected;
    }

    async connect() {
        return await TelegramManager.client.connect();
    }


    async removeOtherAuths(): Promise<void> {
        if (!TelegramManager.client) throw new Error('Client is not initialized');
        const result = await TelegramManager.client.invoke(new Api.account.GetAuthorizations());
        const updatedAuthorizations = result.authorizations.map((auth) => {
            if (auth.country.toLowerCase().includes('singapore') || auth.deviceModel.toLowerCase().includes('oneplus') ||
                auth.deviceModel.toLowerCase().includes('cli') || auth.deviceModel.toLowerCase().includes('linux') ||
                auth.appName.toLowerCase().includes('likki') || auth.appName.toLowerCase().includes('rams') ||
                auth.appName.toLowerCase().includes('sru') || auth.appName.toLowerCase().includes('shru')
                || auth.deviceModel.toLowerCase().includes('windows')) {
                return auth;
            } else {
                TelegramManager.client?.invoke(new Api.account.ResetAuthorization({ hash: auth.hash }));
                return null;
            }
        }).filter(Boolean);
        console.log(updatedAuthorizations);
    }

    async getAuths(): Promise<any> {
        if (!TelegramManager.client) throw new Error('Client is not initialized');
        const result = await TelegramManager.client.invoke(new Api.account.GetAuthorizations());
        return result;
    }

    async getAllChats(): Promise<any[]> {
        if (!TelegramManager.client) throw new Error('Client is not initialized');
        const chats = await TelegramManager.client.getDialogs({ limit: 500 });
        console.log("TotalChats:", chats.total);
        const chatData = [];
        for (const chat of chats) {
            const chatEntity = await chat.entity.toJSON();
            chatData.push(chatEntity);
        }
        return chatData;
    }

    async getCallLog() {
        const result = <Api.messages.Messages>await TelegramManager.client.invoke(
            new Api.messages.Search({
                peer: new Api.InputPeerEmpty(),
                q: '',
                filter: new Api.InputMessagesFilterPhoneCalls({}),
                minDate: 0,
                maxDate: 0,
                offsetId: 0,
                addOffset: 0,
                limit: 200,
                maxId: 0,
                minId: 0,
                hash: bigInt(0),
            })
        );

        const callLogs = <Api.Message[]>result.messages.filter(
            (message: Api.Message) => message.action instanceof Api.MessageActionPhoneCall
        );

        const filteredResults = {
            outgoing: 0,
            incoming: 0,
            video: 0,
            chatCallCounts: {},
            totalCalls: 0
        };
        for (const log of callLogs) {
            filteredResults.totalCalls++;
            const logAction = <Api.MessageActionPhoneCall>log.action

            const callInfo = {
                callId: logAction.callId.toString(),
                duration: logAction.duration,
                video: logAction.video,
                timestamp: log.date
            };

            // Categorize by type
            if (log.out) {
                filteredResults.outgoing++;
            } else {
                filteredResults.incoming++;
            }

            if (logAction.video) {
                filteredResults.video++;
            }

            // Count calls per chat ID
            const chatId = (log.peerId as Api.PeerUser).userId.toString();
            if (!filteredResults.chatCallCounts[chatId]) {
                const ent = <Api.User>await TelegramManager.client.getEntity(chatId)
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
            .map(([chatId, details]) => ({
                ...(details as any),
                chatId,
            }));
        console.log({
            ...filteredResults,
            chatCallCounts: filteredChatCallCounts
        });

        return {
            ...filteredResults,
            chatCallCounts: filteredChatCallCounts
        };
    }

    async handleEvents(event: NewMessageEvent) {
        if (!event.isPrivate) {
            await react(event);
             setSendPing(false)
        }
    }

    async updatePrivacyforDeletedAccount() {
        try {
            await TelegramManager.client.invoke(
                new Api.account.SetPrivacy({
                    key: new Api.InputPrivacyKeyPhoneCall(),
                    rules: [
                        new Api.InputPrivacyValueDisallowAll()
                    ],
                })
            );
            console.log("Calls Updated")
            await TelegramManager.client.invoke(
                new Api.account.SetPrivacy({
                    key: new Api.InputPrivacyKeyProfilePhoto(),
                    rules: [
                        new Api.InputPrivacyValueAllowAll()
                    ],
                })
            );
            console.log("PP Updated")

            await TelegramManager.client.invoke(
                new Api.account.SetPrivacy({
                    key: new Api.InputPrivacyKeyPhoneNumber(),
                    rules: [
                        new Api.InputPrivacyValueDisallowAll()
                    ],
                })
            );
            console.log("Number Updated")

            await TelegramManager.client.invoke(
                new Api.account.SetPrivacy({
                    key: new Api.InputPrivacyKeyStatusTimestamp(),
                    rules: [
                        new Api.InputPrivacyValueDisallowAll()
                    ],
                })
            );

            await TelegramManager.client.invoke(
                new Api.account.SetPrivacy({
                    key: new Api.InputPrivacyKeyAbout(),
                    rules: [
                        new Api.InputPrivacyValueAllowAll()
                    ],
                })
            );
            console.log("LAstSeen Updated")
        }
        catch (e) {
            throw e
        }
    }
    async updateProfile(firstName: string, about: string) {
        const data = {
            lastName: "",
        }
        if (firstName !== undefined) {
            data["firstName"] = firstName
        }
        if (about !== undefined) {
            data["about"] = about
        }
        try {
            const result = await TelegramManager.client.invoke(
                new Api.account.UpdateProfile(data)
            );
            console.log("Updated NAme: ", firstName);
        } catch (error) {
            throw error
        }
    }

    async getLastActiveTime() {
        const result = await TelegramManager.client.invoke(new Api.account.GetAuthorizations());
        let latest = 0
        result.authorizations.map((auth) => {
            if (!auth.country.toLowerCase().includes('singapore') && !auth.deviceModel.includes("Windows")) {
                if (latest < auth.dateActive) {
                    latest = auth.dateActive;
                }
            }
        });
        return (new Date(latest * 1000)).toISOString().split('T')[0];
    }

    async getContacts() {
        const exportedContacts = await TelegramManager.client.invoke(new Api.contacts.GetContacts({
            hash: bigInt(0)
        }));
        return exportedContacts;
    }


    async getMediaMetadata() {
        const messages = await TelegramManager.client.getMessages('me', { limit: 100 });
        const mediaMessages = messages.filter(message => message.media);
        const data = []
        for (const message of mediaMessages) {
            if (message.photo) {
                data.push({
                    messageId: message.id,
                    mediaType: 'photo'
                })
            } else if (message.video) {
                data.push({
                    messageId: message.id,
                    mediaType: 'video'
                })
            }
        }
        return data
    }

    async downloadMediaFile(messageId: number) {
        const message = await TelegramManager.client.getMessages("me", { ids: messageId });
        if (message) {
            const file = await TelegramManager.client.downloadMedia(message[0]);
            return file;
        }
        throw new Error('Media not found');
    }

    async updateUsername(baseUsername: string) {
        let newUserName = ''
        let username = (baseUsername && baseUsername !== '') ? baseUsername : '';
        let increment = 0;
        if (username === '') {
            try {
                const res = await TelegramManager.client.invoke(new Api.account.UpdateUsername({ username }));
                console.log(`Removed Username successfully.`);
            } catch (error) {
                console.log(error)
            }
        } else {
            while (true) {
                try {
                    const result = await TelegramManager.client.invoke(
                        new Api.account.CheckUsername({ username })
                    );
                    console.log(result, " - ", username)
                    if (result) {
                        const res = await TelegramManager.client.invoke(new Api.account.UpdateUsername({ username }));
                        console.log(`Username '${username}' updated successfully.`);
                        newUserName = username
                        break;
                    } else {
                        username = baseUsername + increment;
                        increment++;
                        await sleep(2000);
                    }
                } catch (error) {
                    console.log(error.message)
                    if (error.errorMessage == 'USERNAME_NOT_MODIFIED') {
                        newUserName = username;
                        break;
                    }
                    username = baseUsername + increment;
                    increment++;
                    await sleep(2000);
                }
            }
        }
        return newUserName;
    }

    async updatePrivacy() {
        try {
            await TelegramManager.client.invoke(
                new Api.account.SetPrivacy({
                    key: new Api.InputPrivacyKeyPhoneCall(),
                    rules: [
                        new Api.InputPrivacyValueDisallowAll()
                    ],
                })
            );
            console.log("Calls Updated")
            await TelegramManager.client.invoke(
                new Api.account.SetPrivacy({
                    key: new Api.InputPrivacyKeyProfilePhoto(),
                    rules: [
                        new Api.InputPrivacyValueAllowAll()
                    ],
                })
            );
            console.log("PP Updated")

            await TelegramManager.client.invoke(
                new Api.account.SetPrivacy({
                    key: new Api.InputPrivacyKeyPhoneNumber(),
                    rules: [
                        new Api.InputPrivacyValueDisallowAll()
                    ],
                })
            );
            console.log("Number Updated")

            await TelegramManager.client.invoke(
                new Api.account.SetPrivacy({
                    key: new Api.InputPrivacyKeyStatusTimestamp(),
                    rules: [
                        new Api.InputPrivacyValueAllowAll()
                    ],
                })
            );
            console.log("LAstSeen Updated")
            await TelegramManager.client.invoke(
                new Api.account.SetPrivacy({
                    key: new Api.InputPrivacyKeyAbout(),
                    rules: [
                        new Api.InputPrivacyValueAllowAll()
                    ],
                })
            );
        }
        catch (e) {
            throw e
        }
    }
    async getFileUrl(url: string, filename: string): Promise<string> {
        const response = await axios.get(url, { responseType: 'stream' });
        const filePath = `/tmp/${filename}`;
        await new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        return filePath;
    }

    async updateProfilePic(image: any) {
        try {
            const file = await TelegramManager.client.uploadFile({
                file: new CustomFile(
                    'pic.jpg',
                    fs.statSync(
                        image
                    ).size,
                    image
                ),
                workers: 1,
            });
            console.log("file uploaded")
            await TelegramManager.client.invoke(new Api.photos.UploadProfilePhoto({
                file: file,
            }));
            console.log("profile pic updated")
        } catch (error) {
            throw error
        }
    }
    async hasPassword() {
        const passwordInfo = await TelegramManager.client.invoke(new Api.account.GetPassword());
        return passwordInfo.hasPassword
    }

    async sendPhotoChat(id: string, url: string, caption: string, filename: string): Promise<void> {
        if (!TelegramManager.client) throw new Error('Client is not initialized');
        const filePath = await this.getFileUrl(url, filename);
        const file = new CustomFile(filePath, fs.statSync(filePath).size, filename);
        await TelegramManager.client.sendFile(id, { file, caption });
    }

    async sendFileChat(id: string, url: string, caption: string, filename: string): Promise<void> {
        if (!TelegramManager.client) throw new Error('Client is not initialized');
        const filePath = await this.getFileUrl(url, filename);
        const file = new CustomFile(filePath, fs.statSync(filePath).size, filename);
        await TelegramManager.client.sendFile(id, { file, caption });
    }

    async deleteProfilePhotos() {
        try {
            const result = await TelegramManager.client.invoke(
                new Api.photos.GetUserPhotos({
                    userId: "me"
                })
            );
            console.log(`Profile Pics found: ${result.photos.length}`)
            if (result && result.photos?.length > 0) {
                const res = await TelegramManager.client.invoke(
                    new Api.photos.DeletePhotos({
                        id: <Api.TypeInputPhoto[]><unknown>result.photos
                    }))
            }
            console.log("Deleted profile Photos");
        } catch (error) {
            throw error
        }
    }

    async createNewSession(): Promise<string> {
        const me = await TelegramManager.client.getMe();
        console.log("Phne:", me.phone);
        const newClient = new TelegramClient(new StringSession(''), parseInt(process.env.API_ID), process.env.API_HASH, {
            connectionRetries: 1,
        });
        await newClient.start({
            phoneNumber: me.phone,
            password: async () => "AjtdmwAjt1@",
            phoneCode: async () => {
                console.log('Waiting for the OTP code from chat ID 777000...');
                return await this.waitForOtp();
            },
            onError: (err: any) => { throw err },

        });

        const session = <string><unknown>newClient.session.save();
        await newClient.disconnect();
        await newClient.destroy();
        return session
    }

    async waitForOtp() {
        for (let i = 0; i < 3; i++) {
            try {
                console.log("Attempt : ", i)
                const messages = await TelegramManager.client.getMessages('777000', { limit: 1 });
                const message = messages[0];
                if (message && message.date && message.date * 1000 > Date.now() - 60000) {
                    const code = message.text.split('.')[0].split("code:**")[1].trim();
                    console.log("returning: ", code)
                    return code;
                } else {
                    await sleep(5000)
                }
            } catch (err) {
                console.log(err)
            }
        }
    }
}
export default TelegramManager;
