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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDataDtoCrud = exports.user = void 0;
console.log(`in Db - ${process.env.dbcoll} | ${process.env.username}`);
const mongodb_1 = require("mongodb");
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
})(user || (exports.user = user = {}));
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
                console.log('trying to connect to DB......');
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
                        data: data, //sortedData,
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
    deactivatePromotions() {
        return __awaiter(this, arguments, void 0, function* (day = Date.now()) {
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
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
