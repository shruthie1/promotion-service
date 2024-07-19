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
exports.sendPing = void 0;
const dbservice_1 = require("./dbservice");
const fetchWithTimeout_1 = require("./fetchWithTimeout");
const parseError_1 = require("./parseError");
const TelegramManager_1 = __importDefault(require("./TelegramManager"));
const utils_1 = require("./utils");
const index_1 = require("./index");
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
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (exports.sendPing && ((_a = dbservice_1.UserDataDtoCrud.getInstance()) === null || _a === void 0 ? void 0 : _a.isConnected) && TelegramManager_1.default.getInstance().connected()) {
            try {
                yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${process.env.uptimebot}/receive?clientId=${process.env.clientId}`, {}, false);
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
            if (!process.env.repl.includes("glitch")) {
                const resp = yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${process.env.repl}/getProcessId`, { timeout: 100000 });
                try {
                    console.log(resp);
                    const data = yield resp.data;
                    if (parseInt(data.ProcessId) === index_1.prcessID) {
                        console.log('Sending Req to Check Health: ', `${process.env.uptimebot}/tgclientoff/${index_1.prcessID}?clientId=${process.env.clientId}`);
                        const respon = yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${process.env.uptimebot}/tgclientoff/${index_1.prcessID}?clientId=${process.env.clientId}`);
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
                const respon = yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${process.env.uptimebot}/tgclientoff/${index_1.prcessID}?clientId=${process.env.clientId}`);
                if (!respon.data) {
                    console.log("EXITTING");
                    process.exit(1);
                }
            }
        }
        exports.sendPing = false;
    });
}
