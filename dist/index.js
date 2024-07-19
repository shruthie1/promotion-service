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
exports.prcessID = void 0;
const express_1 = __importDefault(require("express"));
const fetchWithTimeout_1 = require("./fetchWithTimeout");
const dbservice_1 = require("./dbservice");
const TelegramManager_1 = __importDefault(require("./TelegramManager"));
const parseError_1 = require("./parseError");
const connection_1 = require("./connection");
let canTry2 = true;
const ppplbot = `https://api.telegram.org/bot6735591051:AAELwIkSHegcBIVv5pf484Pn09WNQj1Nl54/sendMessage?chat_id=${process.env.updatesChannel}`;
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
exports.prcessID = Math.floor(Math.random() * 123);
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
                    let canStart = false;
                    for (let i = 0; i < 3; i++) {
                        const resp = yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${ppplbot}&text=exit${process.env.username}`);
                        if (resp) {
                            canStart = true;
                            break;
                        }
                    }
                    yield sleep(3000);
                    yield (0, fetchWithTimeout_1.fetchWithTimeout)(`${ppplbot}&text=exit${process.env.username}`);
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
                const isConnected = userDataDtoCrud.connect();
                if (isConnected) {
                    yield TelegramManager_1.default.getInstance().connect();
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
            yield TelegramManager_1.default.getInstance().connect();
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
