import { fetchWithTimeout } from "./fetchWithTimeout";
import { parseError } from "./parseError";
import TelegramManager from "./TelegramManager";
import { ppplbot } from "./utils";
import { prcessID } from "./express";

let retryTime = 0;
export let sendPing = false;
export function setSendPing(value) {
    sendPing = value
}
setTimeout(async () => {
    await retryConnection();
    if (TelegramManager.client) {
        await TelegramManager.client?.connect();
        await TelegramManager.client.getMe();
    }
    setInterval(async () => {
        await retryConnection();
    }, 120000)
}, 20000)

function getAllEnvironmentVariables(): { [key: string]: string } {
    return process.env;
}

async function retryConnection() {
    if (sendPing && TelegramManager.getInstance().connected()) {
        try {
            await fetchWithTimeout(`${process.env.promoteChecker}/receive?clientId=${process.env.clientId}`, {}, false);
        } catch (error) {
            parseError(error, "Cannot fetch pinger:")
        }
        retryTime = 0
    } else {
        retryTime++;
        if (retryTime > 1) {
            // await fetchWithTimeout(`${ppplbot()}&text=${encodeURIComponent(`${process.env.clientId}: Exitting as-\nProcessId:${prcessID}\nMongo-${UserDataDtoCrud.getInstance()?.isConnected}\nTGClient-${tgClass.getClient()?.connected}\nRetryCount: ${retryTime}`)}`);
        }
        if (retryTime > 5) {
            console.log("Exitiing");
            // await fetchWithTimeout(`${process.env.uptimebot}/refreshmap`)
            // await (UserDataDtoCrud.getInstance()).closeConnection();
            // const environmentVariables = getAllEnvironmentVariables();
            await fetchWithTimeout(`${ppplbot()}&text=${(process.env.clientId).toUpperCase()}:UNABLE TO START at RETRY - EXITTING\n\nPid:${process.pid}\n\nenv: ${process.env.clientId}`);
            process.exit(1);
            //execSync("refresh");
        }
        if (!process.env.promoteRepl?.includes("glitch")) {
            const resp = await fetchWithTimeout(`${process.env.promoteRepl}/getProcessId`, { timeout: 100000 });
            try {
                console.log(resp);
                const data = await resp.data;
                if (parseInt(data.ProcessId) === prcessID) {
                    console.log('Sending Req to Check Health: ', `${process.env.promoteChecker}/tgclientoff/${prcessID}?clientId=${process.env.clientId}`)
                    const respon = await fetchWithTimeout(`${process.env.promoteChecker}/tgclientoff/${prcessID}?clientId=${process.env.clientId}`);
                    if (!respon.data) {
                        console.log("EXITTING")
                        process.exit(1);
                    }
                } else {
                    console.log("EXITTING")
                    process.exit(1);
                }
            } catch (error) {
                console.log('Cannot fetch pinger', error);
            }
        } else {
            const respon = await fetchWithTimeout(`${process.env.promoteChecker}/tgclientoff/${prcessID}?clientId=${process.env.clientId}`);
            if (!respon.data) {
                console.log("EXITTING")
                process.exit(1);
            }
        }
    }
    sendPing = false;
}