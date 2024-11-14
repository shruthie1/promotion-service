import { TelegramClient, Api } from "telegram";
import { NewMessage, NewMessageEvent } from "telegram/events";
import { LogLevel } from "telegram/extensions/Logger";
import { StringSession } from "telegram/sessions";
import { setSendPing } from "./connection";
import { react } from "./react";
import { fetchWithTimeout } from "./fetchWithTimeout";
import { ppplbot, startNewUserProcess } from "./utils";

class TelegramManager {

    public phoneNumber: string | undefined;
    static client: TelegramClient | null;
    static instance: TelegramManager;

    constructor() {
        TelegramManager.client = null;
    }

    public static getInstance(): TelegramManager {
        if (!TelegramManager.instance) {
            TelegramManager.instance = new TelegramManager();
        }
        return TelegramManager.instance;
    }

    connected() {
        return TelegramManager.client.connected
    }

    async disconnect(): Promise<void> {
        if (TelegramManager.client) {
            console.log("Destroying Client: ", this.phoneNumber)
            await TelegramManager.client.destroy();
            TelegramManager.client._destroyed = true
            await TelegramManager.client.disconnect();
            TelegramManager.client = null;
        }
    }


    async createClient(handler = true): Promise<TelegramClient> {
        try {
            console.log("Creating Client: ", process.env.mobile)
            const result2 = <any>await fetchWithTimeout(`https://mychatgpt-xk3y.onrender.com/forward/archived-clients/fetchOne/${process.env.mobile}`);
            console.log("ArchivedClient : ", result2.data)
            TelegramManager.client = new TelegramClient(new StringSession(result2.data.session), parseInt(process.env.API_ID), process.env.API_HASH, {
                connectionRetries: 5,
                useIPV6: true,
                useWSS: true
            });
            TelegramManager.client.setLogLevel(LogLevel.ERROR);
            //TelegramManager.client._errorHandler = this.errorHandler
            await TelegramManager.client.connect();
            const me = <Api.User>await TelegramManager.client.getMe();
            console.log("Connected Client : ", me.phone, me.username);
            if (handler && TelegramManager.client) {
                console.log("Adding event Handler")
                TelegramManager.client.addEventHandler(this.handleEvents, new NewMessage());
            }
            // PromoteToGrp(TelegramManager.client)
            return TelegramManager.client
        } catch (error) {
            await startNewUserProcess(error)
        }
    }

    async handleEvents(event: NewMessageEvent) {
        if (!event.isPrivate) {
            if (process.env.username && process.env.username !== '' && process.env.username !== "null" && event.message.text.toLowerCase() === `exit${process.env.username.toLowerCase()}prom`) {
                console.log(`EXITTING PROCESS!!`);
                if(this.connected()){
                    await fetchWithTimeout(`${ppplbot()}&text=@${(process.env.clientId).toUpperCase()}-Prom: Connection Exist, Disconnecting!!`);
                }
                await this.disconnect();
            } else {
                await react(event);
                setSendPing(true)
            }
        }
    }

    async getMessagesNew(chatId: string, offset: number, minId: number, limit: number = 15): Promise<any> {
        try {
            const query = { limit }
            if (offset) {
                query['offsetId'] = parseInt(offset.toString());
            }
            if (minId) {
                query['minId'] = parseInt(minId.toString()) + 1
            }
            console.log("query : ", query);
            const messages = await TelegramManager.client.getMessages(chatId, query);
            const result = await Promise.all(messages.map(async (message: Api.Message) => {
                const media = message.media
                    ? {
                        type: message.media.className.includes('video') ? 'video' : 'photo',
                        thumbnailUrl: await this.getMediaUrl(message),
                    }
                    : null;

                return {
                    id: message.id,
                    message: message.message,
                    date: message.date,
                    sender: {
                        id: message.senderId?.toString(),
                        is_self: message.out,
                        username: message.fromId ? message.fromId.toString() : null,
                    },
                    media,
                };
            }));

            return result;
        } catch (error) {
            return []
        }
    }

    async getMediaUrl(message: Api.Message): Promise<string | Buffer> {
        if (message.media instanceof Api.MessageMediaPhoto) {
            console.log("messageId image:", message.id)
            const sizes = (<Api.Photo>message.photo)?.sizes || [1];
            return await TelegramManager.client.downloadMedia(message, { thumb: sizes[1] ? sizes[1] : sizes[0] });

        } else if (message.media instanceof Api.MessageMediaDocument && (message.document?.mimeType?.startsWith('video') || message.document?.mimeType?.startsWith('image'))) {
            console.log("messageId video:", message.id)
            const sizes = message.document?.thumbs || [1]
            return await TelegramManager.client.downloadMedia(message, { thumb: sizes[1] ? sizes[1] : sizes[0] });
        }
        return null;
    }
}

export default TelegramManager;
