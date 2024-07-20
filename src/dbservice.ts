console.log(`in Db - ${process.env.dbcoll} | ${process.env.username}`);
import { MongoClient, ServerApiVersion, ConnectOptions, ObjectId } from 'mongodb';
import { IChannel } from './promotions';

export enum user {
    picCount = 'picCount',
    totalCount = "totalCount",
    lastMsgTimeStamp = "lastMsgTimeStamp",
    prfCount = "prfCount",
    paidCount = "paidCount",
    limitTime = "limitTime",
    canReply = "canReply",
    payAmount = "payAmount",
    chatId = "chatId",
    username = "username",
    paidReply = 'paidReply',
    demoGiven = 'demoGiven',
    secondShow = 'secondShow',
    picsSent = 'picsSent'
}
export interface UserDataDto {
    picCount: number;
    totalCount: number;
    lastMsgTimeStamp: number;
    prfCount: number;
    paidCount: number;
    limitTime: number;
    canReply: number;
    payAmount: number;
    chatId: string;
    username: string;
    accessHash: string;
    paidReply: boolean;
    demoGiven: boolean;
    secondShow: boolean;
    profile: string;
    picsSent?: string;
}

export class UserDataDtoCrud {
    private static instance: UserDataDtoCrud;
    private db: any;
    private clients = {}
    private statsDb: any;
    private statsDb2: any;
    private promoteStatsDb: any;
    private activeChannelDb: any;
    public isConnected = false;
    private client: MongoClient = undefined;

    private constructor() {
        console.log("Creating MongoDb Instance");
    }

    static getInstance(): UserDataDtoCrud {
        if (!UserDataDtoCrud.instance) {
            UserDataDtoCrud.instance = new UserDataDtoCrud();
        }
        return UserDataDtoCrud.instance;
    }
    static isInstanceExist(): boolean {
        return !!UserDataDtoCrud.instance;
    }

    async connect() {
        if (!this.client && !this.isConnected) {
            console.log('trying to connect to DB......', process.env.mongodburi)
            try {
                this.client = await MongoClient.connect(process.env.mongodburi as string, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1, maxPoolSize: 10 } as ConnectOptions);
                console.log('Connected to MongoDB');
                this.isConnected = true;
                this.db = this.client.db("tgclients").collection('userData');
                this.statsDb = this.client.db("tgclients").collection('stats');
                this.statsDb2 = this.client.db("tgclients").collection('stats2');
                this.activeChannelDb = this.client.db("tgclients").collection('activeChannels');
                this.promoteStatsDb = this.client.db("tgclients").collection('promoteStats');
                const clients = await this.client.db("tgclients").collection('clients').find({}).toArray();
                this.client.on('close', () => {
                    console.log('MongoDB connection closed.');
                    this.isConnected = false;
                });
                clients.forEach(clt => {
                    this.clients = Object.assign(this.clients, { [clt.dbcoll]: clt });
                });
                return true;
            } catch (error) {
                console.log(`Error connecting to MongoDB: ${error}`);
                return false;
            }
        } else {
            console.log('MongoConnection ALready Existing');
        }
    }

    async checkIfUserAlreadyExists(chatId: string): Promise<boolean> {
        const document = await this.db.findOne({ chatId });
        if (document) {
            return true;
        }
        return false;
    }

    async textedClientCount(chatId: string): Promise<{ count: number, list: string[], lastDay: string[], lastHour: string[] }> {
        try {
            const documents: UserDataDto[] = await this.db.find({ chatId, client: { $ne: process.env.clientId } }).toArray();
            const lastdayProfiles: UserDataDto[] = getRecentProfiles(documents, 24 * 60 * 60 * 1000, 6);
            const lastHourProfiles: UserDataDto[] = getRecentProfiles(documents, 30 * 60 * 1000, 1);
            let count = 0;
            const profiles: string[] = documents.map(item => item.profile);
            const profileslastDay: string[] = lastdayProfiles.map(item => item.profile);
            const profileslastHour: string[] = lastHourProfiles.map(item => item.profile);

            const twoDaysAgo = Date.now() - (1 * 24 * 60 * 60 * 1000)
            for (const doc of documents) {
                if (doc.payAmount > 9) {
                    count = count - 20;
                } else {
                    if (doc.canReply == 0) {
                        count = count + 20
                    } else if (doc.lastMsgTimeStamp > twoDaysAgo) {
                        count++;
                    }
                }
            }
            const res = { count, list: profiles, lastDay: profileslastDay, lastHour: profileslastHour };
            console.log(res)
            return res;
        } catch (error) {
            console.log(error);
            return { count: 1, list: [], lastDay: [], lastHour: [] };
        }
    }

    async checkIfPaidToOthers(chatId: string): Promise<{ paid: string, demoGiven: string }> {
        const resp = { paid: '', demoGiven: '' };
        try {
            const document = await this.db.find({ chatId, profile: { $exists: true, "$ne": `${process.env.dbcoll}` }, payAmount: { $gte: 10 } }).toArray();
            const document2 = await this.db.find({ chatId, profile: { $exists: true, "$ne": `${process.env.dbcoll}` }, demoGiven: true }).toArray();
            if (document.length > 0) {
                document.map((doc: any) => {
                    resp.paid = resp.paid + `@${this.clients[doc.profile]?.username}` + ", ";
                })
            }
            if (document2.length > 0) {
                document.map((doc: any) => {
                    resp.demoGiven = resp.demoGiven + `@${this.clients[doc.profile]?.username}` + ", ";
                })
            }
        } catch (error) {
            console.log(error);
        }
        return resp;
    }

    getClientFirstNames() {
        const names = [];
        for (const client in this.clients) {
            if (client.toLowerCase() !== process.env.dbcoll.toLowerCase()) {
                names.push(this.clients[client]?.dbcoll.toLowerCase())
            }
        }
        return names;
    }

    async create(data: UserDataDto) {
        const result = await this.db.findOne({ chatId: data.chatId, profile: { $exists: true, $eq: `${process.env.dbcoll}` } });
        if (result) {
            return result;
        } else {
            const userData = { ...data, profile: `${process.env.dbcoll}` };
            const result = await this.db.insertOne(userData);
            console.log(`New userData created for: ${data.username} | ${data.chatId}`);
            return result.insertedId;
        }
    }

    async createOrUpdateStats(chatId: string, name: string, payAmount: number, newUser: boolean, demoGiven: boolean, paidReply: boolean, secondShow: boolean, didPay?: boolean) {
        const filter = { chatId, client: process.env.clientId };
        const chat = await this.statsDb.findOne(filter);
        const chat2 = await this.statsDb2.findOne(filter);
        if (chat) {
            await this.statsDb.updateOne(filter, { $set: { count: chat.count + 1, payAmount: payAmount, didPay: didPay, demoGiven: demoGiven, paidReply, secondShow } });
        } else {
            await this.statsDb.insertOne({ chatId, count: 1, payAmount, demoGiven: demoGiven, demoGivenToday: false, newUser, name, secondShow, didPay: false, paidReply, client: process.env.clientId, profile: `${process.env.dbcoll}` });
        }
        if (chat2) {
            await this.statsDb2.updateOne(filter, { $set: { count: chat2.count + 1, payAmount: payAmount, didPay: didPay, demoGiven: demoGiven, paidReply, secondShow } });
        } else {
            await this.statsDb2.insertOne({ chatId, count: 1, payAmount, demoGiven: demoGiven, demoGivenToday: false, newUser, paidReply, name, secondShow, didPay: false, client: process.env.clientId, profile: `${process.env.dbcoll}` });
            const textedClientCount = await this.textedClientCount(chatId);
            if (textedClientCount.lastHour.length > 2) {
                setTimeout(async () => {
                    await this.updateSingleKey(chatId, user.limitTime, Date.now() + (2 * 60 * 60 * 1000));
                }, 20000);
            }
            const userDetail: UserDataDto = await this.read(chatId);
            if (userDetail) {
                if (userDetail?.payAmount > 20) {
                    if (userDetail?.demoGiven) {
                        await this.updateSingleKey(chatId, user.paidReply, true);
                    } else {
                        await this.updateSingleKey(chatId, user.paidReply, false);
                    }
                } else {
                    await this.updateSingleKey(chatId, user.paidReply, true);
                }
            }
        }
    }

    async updateStatSingleKey(chatId: string, mykey: string, value: any) {
        const filter = { chatId, profile: { $exists: true, $eq: `${process.env.dbcoll}` } };
        await this.statsDb.updateOne(filter, { $set: { [mykey]: value } }, { upsert: true, returnDocument: 'after' });
        await this.statsDb2.updateOne(filter, { $set: { [mykey]: value } }, { upsert: true, returnDocument: 'after' });
    }

    async delete(chatId: string) {
        const result = await this.db.deleteMany({ chatId, profile: { $exists: true, $eq: `${process.env.dbcoll}` } });
    }

    async read(chatId: string) {
        const result = await this.db.findOne({ chatId, profile: { $exists: true, $eq: `${process.env.dbcoll}` } });
        if (result) {
            return result;
        } else {
            return undefined;
        }
    }

    async getAChannel(): Promise<string> {
        const result = await this.promoteStatsDb.findOne({ client: process.env.clientId })
        let lowestKey: string;
        let lowestValue: number;
        const data: Record<string, number> = result.data

        for (const [key, value] of Object.entries(data.data)) {
            if (lowestValue === null || value < lowestValue) {
                lowestKey = key;
                lowestValue = value;
            }
        }
        return lowestKey;
    };

    async addTodaysChannels(data: string[]) {
        const clientId = process.env.clientId;
        const result = await this.promoteStatsDb.updateOne(
            { client: clientId },
            {
                $set: {
                    channels: data
                },
            },
            { upsert: true }
        );
    }
    async updatePromoteStats(channelName: string) {
        try {
            const clientId = process.env.clientId;
            const existingDocument = await this.promoteStatsDb.findOne({ client: clientId });
            let count = 0;
            let data: Record<string, number> = {};
            let totalCount = 0;

            if (existingDocument) {
                count = existingDocument.count + 1;
                data = existingDocument.data;
                totalCount = existingDocument.totalCount;
            }

            if (data[channelName]) {
                data[channelName]++;
            } else {
                data[channelName] = 1;
            }

            totalCount++;
            const uniqueChannels = Object.keys(data).length;
            // const sortedDataEntries = Object.entries(data).sort((a, b) => b[1] - a[1]);
            // const sortedData = Object.fromEntries(sortedDataEntries);

            const result = await this.promoteStatsDb.updateOne(
                { client: clientId },
                {
                    $set: {
                        totalCount: totalCount,
                        data: data,//sortedData,
                        uniqueChannels: uniqueChannels,
                        lastUpdatedTimeStamp: Date.now(),
                        releaseDay: Date.now(),
                        isActive: true
                    },
                },
                { upsert: true }
            );
        } catch (error) {
            console.log(error);
        }
    }

    async activatePromotions() {
        const clientId = process.env.clientId;
        const result = await this.promoteStatsDb.updateOne(
            { client: clientId },
            {
                $set: {
                    releaseDay: Date.now(),
                    isActive: true
                },
            },
            { upsert: true }
        );
    }

    async deactivatePromotions(day = Date.now()) {
        const clientId = process.env.clientId;
        const result = await this.promoteStatsDb.updateOne(
            { client: clientId },
            {
                $set: {
                    releaseDay: day,
                    isActive: false
                },
            },
            { upsert: true }
        );
    }

    async readPromoteStats() {
        const result = await this.promoteStatsDb.findOne({ "client": process.env.clientId });
        return result;
    }


    async readPromoteStatsTime() {
        const result = await this.promoteStatsDb.findOne({ "client": process.env.clientId }, { projection: { "client": 1, "totalCount": 1, "lastUpdatedTimeStamp": 1, "isActive": 1, "_id": 0 } });
        return result;

    }


    async readstats() {
        const result = await this.statsDb.find({ client: process.env.clientId }).sort({ newUser: -1 })
        if (result) {
            return result.toArray();
        } else {
            return undefined;
        }
    }
    async readstats2(): Promise<any[]> {
        const result = await this.statsDb2.find({ client: process.env.clientId }).sort({ newUser: -1 })
        if (result) {
            return result.toArray();
        } else {
            return [];
        }
    }

    async readstats2Opt(): Promise<any[]> {
        return await this.statsDb2.aggregate([
            { $match: { client: process.env.clientId } },
            {
                $group: {
                    _id: null,
                    totalCount: { $sum: "$count" },
                    userCount: { $sum: 1 }
                }
            }
        ]).toArray();
    }

    async getTodayPaidUsers(): Promise<{ total: number, new: number }> {
        try {
            const result = await this.statsDb2.find({ client: process.env.clientId, payAmount: { $gt: 10 } })
            if (result) {
                const res = await result.toArray();
                let newUsers = 0
                for (const u of res) {
                    if (u.true) {
                        newUsers++
                    }
                }
                return ({ total: res.length || 0, new: newUsers || 0 });
            } else {
                return ({ total: 0, new: 0 });
            }
        } catch (error) {
            console.log(error)
            return ({ total: 0, new: 0 });
        }
    }

    async checkIfPaidTodayToOthers(chatId: string) {
        const result = await this.statsDb2.find({ chatId: chatId, client: { $ne: `${process.env.clientId}` } }).sort({ newUser: -1 })
        if (result) {
            const res = result.toArray();
            if (res.length > 0) {
                return true;
            }
            return false;
        } else {
            return false;
        }
    }

    async readSingleStats(chatId: string) {
        const result = await this.statsDb.find({ chatId, client: process.env.clientId }).sort({ newUser: -1 })
        if (result) {
            return result.toArray();
        } else {
            return undefined;
        }
    }

    async removeSingleStat(chatId: string) {
        try {
            const result = await this.statsDb.deleteMany({ chatId, profile: process.env.dbcoll });
        } catch (error) {
            console.log("Unable to delete");
        }
    }

    async readRecentPaidPpl() {
        const result = await this.statsDb.find({ client: process.env.clientId, payAmount: { $gt: 26 } })
        if (result) {
            return result.toArray();
        } else {
            return undefined;
        }
    }

    async readRecentPaidPpl2() {
        const result = await this.statsDb2.find({ client: process.env.clientId, payAmount: { $gt: 25 } });
        if (result) {
            return result.toArray();
        } else {
            return undefined;
        }
    }

    async todayPaidPpl() {
        const result = await this.statsDb2.find({ client: process.env.clientId, newUser: true, payAmount: { $gt: 25 } });
        if (result) {
            return result.toArray();
        } else {
            return undefined;
        }
    }

    async getPaidList() {
        let ppl = ''
        const result = await this.db.find({ payAmount: { $gt: 26 } }).sort({ lastMsgTimeStamp: -1 }).limit(25).toArray();
        if (result) {
            result.forEach((element: any) => {
                ppl = ppl + '\n ' + element?.username + ' : ' + element?.paidCount + "|" + element?.payAmount;
            });
            return ppl;
        } else {
            return undefined;
        }
    }
    async getPaidListIds() {
        let ppl = [];
        const result = await this.db.find({ payAmount: { $gt: 26 } }).sort({ lastMsgTimeStamp: -1 }).limit(25).toArray();
        if (result) {
            result.forEach(async (element: UserDataDto) => {
                const id = element?.username.startsWith("@") ? element?.username : element?.chatId;
                ppl.push({ userId: id, accessHash: element.accessHash, paidReply: element.paidReply, payAmount: element.payAmount });
                // const chatId = element.chatId
                // const result = await this.db.updateOne({ chatId }, { $set: { limitTime: Date.now() + (3 * 60 * 60 * 1000) } });
            });
            return ppl;
        } else {
            return undefined;
        }
    }

    // Update a UserDataDto in the database by chatId
    async update(chatId: string, updates: UserDataDto) {
        const result = await this.db.updateOne({ chatId, profile: { $exists: true, $eq: `${process.env.dbcoll}` } }, { $set: { ...updates, lastMsgTimeStamp: Date.now() } }, { upsert: true, returnDocument: 'after' });
    }

    async resetUnpaid() {
        const result = await this.db.updateMany({ "_id": { $lt: new ObjectId("63fca4730000000000000000") }, "paidCount": { $gt: 0 }, "payAmount": 0 }, { $set: { paidCount: 0 } });
        return result;
    }

    async resetPpl() {
        const result = await this.db.updateMany({}, { $set: { paidReply: true } });
        return result;
    }

    async remove(chatId: string) {
        const result = await this.db.deleteMany({ chatId, profile: { $exists: true, $eq: `${process.env.dbcoll}` } });
    }

    async getSingleKey(chatId: string, key: string) {
        const result = await this.db.findOne({ chatId, profile: { $exists: true, $eq: `${process.env.dbcoll}` } }, { projection: { [key]: 1 } });
        if (result) {
            return result[key];
        } else {
            return undefined;
        }
    }
    async updateSingleKey(chatId: string, key: string, value: any) {
        const result = await this.db.updateOne({ chatId, profile: { $exists: true, $eq: `${process.env.dbcoll}` } }, { $set: { [key]: value, lastMsgTimeStamp: Date.now() } });
    }

    async getPromoteMsgs() {
        try {
            const channelDb = this.client.db("tgclients").collection('promoteMsgs');
            return await channelDb.findOne({})
        } catch (e) {
            console.log(e)
        }
    }

    async removeFromAvailableMsgs(filter: any, valueToRemove: string) {

        try {

            const result = await this.activeChannelDb.updateOne(
                filter,
                { $pull: { availableMsgs: valueToRemove } }
            );

            console.log(`${result.modifiedCount} document(s) updated.`);
        } catch (error) {
            console.error('Error occurred:', error);
        }
    }

    async addToAvailableMsgs(filter: any, valueToAdd: string) {
        try {

            const result = await this.activeChannelDb.updateOne(
                filter,
                { $addToSet: { availableMsgs: valueToAdd } }
            );

            console.log(`${result.modifiedCount} document(s) updated.`);
        } catch (error) {
            console.error('Error occurred:', error);
        }
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

    async updateActiveChannel(filter: any, data: any) {
        const result = await this.activeChannelDb.updateOne(
            filter,
            {
                $set: {
                    ...data
                },
            },
            { upsert: true }
        );
    }
    async getChannel(filter: any) {
        const channelDb = this.client.db("tgclients").collection('channels');
        const result: IChannel = <any>await channelDb.findOne(filter);
        return result
    }

    async getActiveChannel(filter: any) {
        const result: IChannel = <any>await this.activeChannelDb.findOne(filter);
        return result
    }

    async removeOnefromActiveChannel(filter: any) {
        try {
            await this.activeChannelDb.deleteOne(filter)
        } catch (e) {
            console.log(e)
        }
    }

    async removeOnefromChannel(filter: any) {
        try {
            const channelDb = this.client.db("tgclients").collection('channels');
            await channelDb.deleteOne(filter)
        } catch (e) {
            console.log(e)
        }
    }

    async closeConnection() {
        try {
            if (this.isConnected) {
                this.isConnected = false;
                console.log('MongoDB connection closed.');
            }
            await this.client?.close();
        } catch (error) {
            console.log(error)
        }
    }
}

function getRecentProfiles(data: UserDataDto[], time: number, expectedCount: number): UserDataDto[] {
    const currentTime = Date.now();
    const oldTime = currentTime - time;
    const filteredData = data.filter(
        item => {
            const condition = ((item.lastMsgTimeStamp > oldTime) && (item.totalCount > expectedCount) && (item.payAmount < 10))
            return (condition)
        });

    return filteredData;
}
