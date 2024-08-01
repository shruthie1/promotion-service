import { TelegramClient, Api } from "telegram";
import { NewMessage, NewMessageEvent } from "telegram/events";
import { LogLevel } from "telegram/extensions/Logger";
import { StringSession } from "telegram/sessions";
import { setSendPing } from "./connection";
import { react } from "./react";
import { fetchWithTimeout } from "./fetchWithTimeout";
import { startNewUserProcess } from "./utils";

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

    async createClient(handler = true): Promise<TelegramClient> {
        try {
            console.log("Creating Client: ", process.env.mobile)
            const result2 = <any>await fetchWithTimeout(`https://checker-production-8f93.up.railway.app/forward/archived-clients/fetchOne/${process.env.mobile}`);
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
            await react(event);
            setSendPing(true)
        }
    }
}

export default TelegramManager;
