import { fetchWithTimeout } from "out";
import { TelegramClient, Api } from "telegram";
import { NewMessage, NewMessageEvent } from "telegram/events";
import { LogLevel } from "telegram/extensions/Logger";
import { StringSession } from "telegram/sessions";
import { setSendPing } from "./connection";
import { react } from "./react";

class TelegramManager {

    public phoneNumber: string | undefined;
    static client: TelegramClient | null;
    static instance: any;

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
      return  TelegramManager.client.connected
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

    async handleEvents(event: NewMessageEvent) {
        if (!event.isPrivate) {
            await react(event);
            setSendPing(true)
        }
    }
}

export default TelegramManager;
