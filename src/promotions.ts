// import {
//     defaultMessages, defaultReactions,
//     selectRandomElements
// } from "./utils";
// import { TelegramClient, Api } from "telegram";
// import { fetchWithTimeout } from "./fetchWithTimeout";
// import { parseError } from "./parseError";
// import { SendMessageParams } from "telegram/client/messages";
// import { sleep } from "telegram/Helpers";
// import { UserDataDtoCrud } from "./dbservice";
// import { getEntity } from "telegram/client/users";
// import TelegramManager from "./TelegramManager";
// import { messages } from "./messages";


// export interface IChannel {
//     channelId: string;
//     title: string;
//     participantsCount: number;
//     username: string;
//     restricted: boolean;
//     broadcast: boolean;
//     sendMessages: boolean;
//     canSendMsgs: boolean;
//     wordRestriction?: number;
//     dMRestriction?: number;
//     availableMsgs?: string[];
//     banned?: boolean;
//     reactions:string[],
//     reactRestricted: boolean
// }


// let promoteCount = 0;
// let promoting = false;
// let promoteFlagCount = 0;
// let promoteMsgs = {};
// let promotedCount = 0
// let lastMessageTime = Date.now();
// export const myChannels: Map<string, IChannel> = new Map();

// const notifbot = `https://api.telegram.org/bot5856546982:AAEW5QCbfb7nFAcmsTyVjHXyV86TVVLcL_g/sendMessage?chat_id=${process.env.notifChannel}`
// const ppplbot = `https://api.telegram.org/bot6735591051:AAELwIkSHegcBIVv5pf484Pn09WNQj1Nl54/sendMessage?chat_id=${process.env.updatesChannel}`

// export function logDetails(level, message, details = {}) {
//     const timestamp = new Date().toISOString();
//     console.log(`[${timestamp}] [${level}] ${message}`, details);
// }

// async function fetchDialogs(client: TelegramClient) {
//     const channelIds = [];
//     try {
//         const dialogs = await client.getDialogs({ limit: 500 });
//         console.log("Dialogs : ", dialogs.length)
//         const unreadUserDialogs = [];
//         for (const dialog of dialogs) {
//             if (dialog.isUser && dialog.unreadCount > 0) {
//                 unreadUserDialogs.push(dialog);
//             } else if (dialog.isChannel || dialog.isGroup) {
//                 const chatEntity = <Api.Channel>dialog.entity.toJSON();
//                 const { id, defaultBannedRights, title, broadcast, username, participantsCount, restricted } = chatEntity;
//                 if (!broadcast && !defaultBannedRights?.sendMessages && !restricted && id && participantsCount > 500) {
//                     const channelId = id.toString().replace(/^-100/, "");
//                     channelIds.push(channelId)
//                 }
//             }
//         }

//         // const result = await db.getActiveChannels({ channelId: { $in: channelIds } })
//         // console.log("Channels Set : ", channels.length)
//         replyUnread(client, unreadUserDialogs);
//     } catch (error) {
//         parseError(error, "Failed to fetch channels while promoting");
//         await startNewUserProcess(error);
//     }
//     return channelIds;
// }

// export async function getChannelInfo(channelId: string) {
//     const db = UserDataDtoCrud.getInstance();
//     let channelInfo = myChannels.get(channelId);
//     if (!channelInfo) {
//         const dbChannel = await db.getActiveChannel({ channelId: channelId });
//         if (dbChannel) {
//             // console.log("Setting Channel at reactions : ", dbChannel.reactions);
//             channelInfo = dbChannel;
//             myChannels.set(channelId, channelInfo)
//         } else {
//             const data = await getIChannelFromTg(channelId);
//             await db.updateActiveChannel({ channelId: channelId }, data);
//             channelInfo = data;
//             myChannels.set(channelId, { ...data, reactions: defaultReactions })
//         }
//     }
//     return channelInfo
// }

// export async function PromoteToGrp(client) {
//     promoteCount++;
//     logDetails("INFO", `promoteFlagCount: ${promoteFlagCount} || promoting : ${promoting}`);

//     // if (client && !promoting && client.connected) {
//     //     promoting = true;
//     //     setInterval(async () => {
//     //         lastMessageTime = Date.now();
//     //         const db = UserDataDtoCrud.getInstance();
//     //         await db.updatePromoteStats('promote');
//     //     }, 200000)
//     // }
//     if (client && !promoting && client.connected) {
//         promoteFlagCount = 0;
//         promoting = true;
//         promoteCount = 0;
//         lastMessageTime = Date.now();
//         const db = UserDataDtoCrud.getInstance();
//         await db.updatePromoteStats('promote');

//         try {

//             const paidUserStats = await db.getTodayPaidUsers();
//             if ((paidUserStats?.total > 33) || (paidUserStats?.new > 15)) {
//                 parseError({ message: "Not Proceeding With Promotion as Limit Reached for the day!!" }, "Promotions Stopped");
//                 await db.deactivatePromotions();
//             } else {
//                 const channelIds = await fetchDialogs(client);
//                 logDetails("INFO", `STARTED GROUP PROMOTION: LastTime - ${promotedCount} - ${channelIds.length}`);

//                 const promotedStats = await db.readPromoteStats();
//                 promoteMsgs = await db.getPromoteMsgs();
//                 promotedCount = 0;

//                 let channelIndex = 0;

//                 for (const channelId of channelIds) {
//                     if (!client.connected) {
//                         await client.connect();
//                     }
//                     if (channelIndex >= channelIds.length || promoteCount > 2) {
//                         promoting = false;
//                         logDetails("WARN", "Force restarting promotions");
//                         setTimeout(async () => {
//                             await fetchWithTimeout(`${process.env.repl}/promote`);
//                         }, 10000);
//                         break;
//                     }

//                     // logDetails("INFO", `TringChannel : ${channel.title} || promoteFlagCount: ${promoteFlagCount}`);
//                     try {
//                         if (promoteFlagCount > 3) {
//                             promoting = false;
//                             // logDetails("INFO", `Inside ForceStop`);
//                             await fetchWithTimeout(`${ppplbot}&text=@${process.env.clientId.toUpperCase()}: PROMOTIONS STOPPED Forcefully to restart again`);
//                             await db.deactivatePromotions();
//                             if (promotedStats?.releaseDay < Date.now()) {
//                                 await checktghealth(client);
//                             }
//                             await fetchWithTimeout(`${notifbot}&text=@${process.env.clientId.toUpperCase()}: Failed - ${promoteFlagCount} | BROKE PROMOTION`);
//                             promoting = false;
//                             break;
//                         }
//                         // logDetails("INFO", `Proceeding to Message`);
//                         await sendPromotionalMessage(channelId, client, false, 0);
//                     } catch (error) {
//                         logDetails("ERROR", `FAILED: ${channelId?.title}`, { error: error.errorMessage });
//                     }
//                 }; // Adjust the interval as needed
//             }
//             logDetails("INFO", "STARTED PROMOTION!!");
//         } catch (error) {
//             parseError(error, "Promotion Broke: ");
//             if (error.errorMessage?.toString().includes('AUTH_KEY_DUPLICATED')) {
//                 await fetchWithTimeout(`${notifbot}&text=@${process.env.clientId.toUpperCase()}: AUTH KEY DUPLICATED`);
//             }
//         }
//         finally {
//             // if (promoteCount <= 2) {
//             //     await fetchWithTimeout(`${ppplbot}&text=@${process.env.clientId.toUpperCase()}: PROMOTIONS STOPPED Forcefully to restart again`);
//             // }
//         }
//     } else {
//         logDetails("INFO", "EXISTING PROMOTION!!");
//         if (lastMessageTime < Date.now() - 7 * 60 * 1000) {
//             promoting = false;
//             setTimeout(() => {
//                 PromoteToGrp(client);
//             }, 10000);
//         }
//         const db = UserDataDtoCrud.getInstance();
//         const userPromoteStats = await db.readPromoteStatsTime();
//         if (userPromoteStats?.isActive && promoteCount > 2 && (Date.now() - userPromoteStats?.lastUpdatedTimeStamp) / (1000 * 60) > 12) {
//             await fetchWithTimeout(`${ppplbot}&text=@${process.env.clientId.toUpperCase()}: EXITING AS ERROR AT PROMOTIONS`);
//             // process.exit(1);
//         }
//     }
// }

// async function sendPromotionalMessage(channelId: string, client: TelegramClient, isLatest, promotedStats = 0) {
//     try {
//         const db = UserDataDtoCrud.getInstance();

//         const greetings = ['Hellloooo', 'Hiiiiii', 'Oyyyyyy', 'Oiiiii', 'Haaiiii', 'Hlloooo', 'Hiiii', 'Hyyyyy', 'Oyyyyye', 'Oyeeee', 'Heyyy'];
//         const emojis = generateEmojis();
//         const randomEmoji = getRandomEmoji();
//         const hour = getCurrentHourIST();
//         const isMorning = (hour > 9 && hour < 22);
//         const offset = Math.floor(Math.random() * 3);
//         const endMsgOptions = ['U bussy👀?', "I'm Available!!😊💦", 'Try Once!!😊💦', 'Waiting for your message... Dr!!💦', 'You Online?👀', "I'm Available!!😊", 'You Busy??👀💦', 'You Interested??👀💦', 'You Awake?👀💦', 'You there???💦💦'];
//         const endMsg = selectRandomElements(endMsgOptions, 1)[0];
//         const msg = `**${selectRandomElements(greetings, 1)[0]}_._._._._._._!!**${emojis}\n.\n.\n**${endMsg}**`;

//         const addon = (offset !== 1) ? `${(offset === 2) ? `**\n\n\nTODAY's OFFER:\n-------------------------------------------\nVideo Call Demo Available${randomEmoji}${randomEmoji}\nVideo Call Demo Available${randomEmoji}${randomEmoji}\n-------------------------------------------**` : `**\n\nJUST Try Once!!😚😚\nI'm Free Now!!${generateEmojis()}**`}` : `${generateEmojis()}`;

//         const channelInfo = await getChannelInfo(channelId)
//         console.log("fetched ChannelInfo :", channelInfo.banned)
//         if (!channelInfo?.banned) {
//             console.log(`${channelInfo?.title} - WordRestriction: ${channelInfo?.wordRestriction} | AvailableMsgsLength: ${channelInfo?.availableMsgs?.length}`);

//             if (!channelInfo?.availableMsgs) {
//                 await db.updateActiveChannel({ channelId: channelInfo.channelId }, { dMRestriction: 0, wordRestriction: 0, availableMsgs: defaultMessages });
//                 channelInfo.availableMsgs = defaultMessages;
//             }

//             let message;
//             let defaultMsg = false;

//             if (channelInfo.wordRestriction === 0) {
//                 message = await sendMessageToChannel(client, channelInfo, { message: msg + addon });
//             } else {
//                 let randomAvailableMsg;
//                 if (channelInfo.availableMsgs.length > 0) {
//                     randomAvailableMsg = promoteMsgs[selectRandomElements(channelInfo.availableMsgs, 1)[0]];
//                 } else {
//                     randomAvailableMsg = promoteMsgs["0"];
//                     defaultMsg = true;
//                 }
//                 message = await sendMessageToChannel(client, channelInfo, { message: randomAvailableMsg });
//             }
//             if (message) {
//                 await broadcast(`SENT TO GROUP: ${channelInfo?.title}`, `  @${channelInfo.username}  : ${channelInfo.participantsCount}`);
//                 promoteFlagCount = 0;
//                 promotedCount++;
//                 retryMessageSending(client, channelInfo, message?.id, undefined, false, defaultMsg);
//                 scheduleFollowUpMessage(client, channelInfo);
//                 const outerLimit = 180000;
//                 await sleep(outerLimit)
//                 return;
//             } else {
//                 await broadcast(`FAILED SEND IN GROUP: ${channelInfo?.title}`, `  @${channelInfo.username}  : ${channelInfo.participantsCount}`);
//                 return;
//             }
//         } else {
//             console.log("Banned Channel")
//         }
//     } catch (error) {
//         console.error(`Error sending promotional message to ${channelId}:`, error);
//         promoteFlagCount++;
//         return new Promise((resolve) => {
//             setTimeout(() => {
//                 resolve(true);
//             }, 4000);
//         });
//     }
// }
// function scheduleFollowUpMessage(client: TelegramClient, channelInfo: IChannel) {
//     const innerLimit = 200500;
//     setTimeout(async () => {
//         // console.log('Second timeout completed');

//         let followUpMsg;
//         let defaultMsg2 = false;

//         await broadcast(`SENDING Follow-up MESSAGE: ${channelInfo?.title}`, `  @${channelInfo.username}  : ${channelInfo.participantsCount}`);

//         if (channelInfo.wordRestriction === 0) {
//             // console.log('Sending default follow-up message');
//             followUpMsg = await sendMessageToChannel(client, channelInfo, { message: `**I have One Doubt.....!!\n\nCan Anyone Clarify me Please??😭😭${generateEmojis()}**` });
//         } else {
//             let randomAvailableMsg = promoteMsgs[selectRandomElements(channelInfo.availableMsgs, 1)[0]];

//             if (!(channelInfo.availableMsgs.length > 0 && randomAvailableMsg)) {
//                 // console.log('No available messages, using default message');
//                 randomAvailableMsg = promoteMsgs["0"];
//                 defaultMsg2 = true;
//             }

//             // console.log('Sending follow-up message from available messages');
//             followUpMsg = await sendMessageToChannel(client, channelInfo, { message: randomAvailableMsg });
//         }

//         if (followUpMsg) {
//             await broadcast(`Follow-up message SENT TO GROUP: ${channelInfo?.title}`, `  @${channelInfo.username}  : ${channelInfo.participantsCount}`);
//         } else {
//             await broadcast(`FAILED to send follow-up message IN GROUP: ${channelInfo?.title}`, `  @${channelInfo.username}  : ${channelInfo.participantsCount}`);
//         }

//         retryMessageSending(client, channelInfo, followUpMsg?.id, 10000, true, defaultMsg2);
//     }, innerLimit);

// }


// export async function sendMessageToChannel(client: TelegramClient, channelInfo: IChannel, message: SendMessageParams) {
//     try {
//         // Attempt to send the message to the specified channel
//         const msg = await client.sendMessage(channelInfo.channelId, message);
//         lastMessageTime = Date.now();
//         return msg;
//     } catch (error) {
//         console.log(`Error sending message to ${channelInfo.channelId}:`, error);
//         if (error.errorMessage === "CHANNEL_PRIVATE") {
//             return await handlePrivateChannel(client, channelInfo, message, error);
//         } else {
//             return await handleOtherErrors(client, channelInfo, message, error);
//         }
//     }
// }

// async function handlePrivateChannel(client: TelegramClient, channelInfo: IChannel, message: SendMessageParams, error: any) {
//     const db = UserDataDtoCrud.getInstance();
//     if (channelInfo && channelInfo.username) {
//         try {
//             // Attempt to send the message using the channel's username
//             return await client.sendMessage(channelInfo.username, message);
//         } catch (err) {
//             console.error(`Error retrying message for private channel ${channelInfo.username}:`, err);
//             if (err.errorMessage === "CHANNEL_PRIVATE") {
//                 await db.updateActiveChannel({ channelId: channelInfo.channelId }, { banned: true });
//             }
//             return undefined;
//         }
//     }
//     return undefined;
// }

// async function handleOtherErrors(client: TelegramClient, channelInfo: IChannel, message: SendMessageParams, error: any) {
//     const db = UserDataDtoCrud.getInstance();
//     console.log(`Error sending message to ${channelInfo.channelId} (@${channelInfo.username}):`, error);
//     //TODO
//     // if (error.errorMessage === 'USER_BANNED_IN_CHANNEL') {
//     //     const result = await checktghealth(client);
//     //     if (!result && daysLeftForRelease() < 0) {
//     //         await leaveChannel(client, channelInfo);
//     //     }
//     // } else if (error.errorMessage === 'CHAT_WRITE_FORBIDDEN') {
//     //     await leaveChannel(client, channelInfo);
//     // }
//     return undefined;
// }

// async function checkAndResendMessage(client: TelegramClient, chat: IChannel, messageId: number,
//     randomMsgId: string, attemptCount: number,
//     waitTime: number = 15000, recursionCount: number = 0, isDoubtMessage: boolean = false): Promise<number> {
//     return new Promise((resolve, reject) => {
//         setTimeout(async () => {
//             try {
//                 if (!client.connected) {
//                     await client.connect()
//                 }
//                 const messageContent = randomMsgId ? promoteMsgs[randomMsgId] : promoteMsgs["0"];
//                 const db = UserDataDtoCrud.getInstance();

//                 // Update word restriction if necessary
//                 if (!isDoubtMessage && (attemptCount > chat.wordRestriction || chat.wordRestriction === undefined)) {
//                     await db.updateActiveChannel({ channelId: chat.channelId }, { ...chat, wordRestriction: attemptCount });
//                 }

//                 // Update DM restriction if necessary
//                 if (isDoubtMessage && (attemptCount > chat.dMRestriction || chat.dMRestriction === undefined)) {
//                     await db.updateActiveChannel({ channelId: chat.channelId }, { ...chat, dMRestriction: attemptCount });
//                 }

//                 let sentMessage;
//                 try {
//                     const messages = await client.getMessages(chat.channelId, { ids: messageId });
//                     sentMessage = messages[0];
//                 } catch (error) {
//                     console.error(`Error fetching sent message:`, error);
//                 }

//                 if (!sentMessage) {
//                     await handleDeletedMessage(client, chat, messageId, randomMsgId, attemptCount);
//                     const msg = await sendMessageToChannel(client, chat, { message: messageContent });
//                     resolve(msg?.id);
//                 } else {
//                     await handleExistingMessage(chat, randomMsgId);
//                     resolve(undefined);
//                 }
//             } catch (error) {
//                 console.error(`Error checking and resending message:`, error);
//                 if (error.seconds && recursionCount < 3) {
//                     resolve(await checkAndResendMessage(client, chat, messageId, randomMsgId, attemptCount, error.seconds * 1000, recursionCount + 1, isDoubtMessage));
//                 } else {
//                     reject(error);
//                 }
//             }
//         }, waitTime);
//     });
// }


// async function handleDeletedMessage(client: TelegramClient, chat: IChannel, messageId: number, randomMsgId: string, attemptCount: number) {
//     const db = UserDataDtoCrud.getInstance();
//     await broadcast(`MESSGAE DELETED FROM GROUP ===: ${chat.title}`, `@${chat.username}: ${chat.participantsCount}`);
//     await fetchWithTimeout(`${notifbot}&text=${encodeURIComponent(`${process.env.clientId?.toUpperCase()}: attempt=${attemptCount} R=${randomMsgId}\n@${chat.username}`)}`);
//     if (randomMsgId) {
//         await db.removeFromAvailableMsgs({ channelId: chat.channelId }, randomMsgId);
//         if (randomMsgId === '0') {
//             await db.updateActiveChannel({ channelId: chat.channelId }, { banned: true });
//         }
//     } else if (chat.availableMsgs.length === 0 || attemptCount === 3) {
//         await db.updateActiveChannel({ channelId: chat.channelId }, { banned: true });
//     }
// }

// async function handleExistingMessage(chat: IChannel, randomMsgId: string) {
//     const db = UserDataDtoCrud.getInstance();
//     await broadcast(`MESSAGE EXISTS, All GOOD === : ${chat.title}`, `@${chat.username}: ${chat.participantsCount}`);
//     await db.updatePromoteStats(chat.username);
//     if (randomMsgId) {
//         await db.addToAvailableMsgs({ channelId: chat.channelId }, randomMsgId);
//     } else {
//         await db.addToAvailableMsgs({ channelId: chat.channelId }, "0");
//     }
// }

// async function retryMessageSending(client: TelegramClient, chat: IChannel, messageId: number, waitTime: number = 8000, isDoubtMessage: boolean = false, isDefaultMessage: boolean) {
//     const availableMessages = [...chat.availableMsgs];
//     let nextMessageId = messageId;
//     for (let attempt = 0; attempt < 4; attempt++) {
//         if (nextMessageId) {
//             const randomMsgId = selectRandomElements(availableMessages, 1)[0];
//             const index = availableMessages.indexOf(randomMsgId);
//             if (index !== -1) {
//                 availableMessages.splice(index, 1);
//             }
//             await sleep(waitTime);
//             nextMessageId = await checkAndResendMessage(client, chat, nextMessageId, randomMsgId, attempt, 1500, 0, isDoubtMessage);
//         } else {
//             break;
//         }
//     }
// }

// function getRandomEmoji(): string {
//     const eroticEmojis: string[] = ["🔥", "💋", "👅", "🍆", "🔥", "💋", " 🙈", "👅", "🍑", "🍆", "💦", "🍑", "😚", "😏", "💦", "🥕", "🥖"];
//     const randomIndex = Math.floor(Math.random() * eroticEmojis.length);
//     return eroticEmojis[randomIndex];
// }

// function generateEmojis(): string {
//     const emoji1 = getRandomEmoji();
//     const emoji2 = getRandomEmoji();
//     return emoji1 + emoji2;
// }

// function getCurrentHourIST(): number {
//     const now = new Date();
//     const istOffset = 5.5 * 60 * 60 * 1000;
//     const istTime = new Date(now.getTime() + istOffset);
//     const istHour = istTime.getUTCHours();
//     return istHour;
// }

// export async function broadcast(name: string, msg: string) {
//     const now = new Date().toLocaleString('en-IN').split(',')[1]
//     console.log(`${now}||${name} : ${msg}`);
// }

// export async function replyUnread(client: TelegramClient, unreadUserDialogs: any) {
//     if (client) {
//         try {
//             const db = UserDataDtoCrud.getInstance();
//             for (const chat of unreadUserDialogs) {
//                 try {
//                     const userDetails = await db.read(chat.id.toString());
//                     if (userDetails) {
//                         if (userDetails.payAmount > 29) {
//                             if (!userDetails.demoGiven) {
//                                 // const didPaidToOthers = await db.checkIfPaidToOthers(chat.id.toString());
//                                 // if (didPaidToOthers.paid !== "" || didPaidToOthers.paid !== "") {
//                                 //     await client.sendMessage(chat.entity,{ message: `Wait...\nI'm verifying your Payment again!!\n${didPaidToOthers.paid !== "" ? (`I think U paid to ${didPaidToOthers.paid} and U also`) : "I think U"}  ${didPaidToOthers.demoGiven !== "" ? (` took Demo from ${didPaidToOthers.demoGiven}`) : ""}` });
//                                 // } else {
//                                 await client.sendMessage(chat.entity, { message: "Dont Speak Okay!!\nI'm in **Bathroom**\nMute yourself!! I will show you Okay..!!" });
//                                 await client.sendMessage(chat.entity, { message: `Hey U can Call me here\n\nhttps://zomCall.netlify.app/${process.env.clientId}/${userDetails.chatId.toString()}\n\nCall me now!!` });
//                                 // }
//                             } else {
//                                 if (userDetails.payAmount > 50) {
//                                     if (!userDetails.secondShow || userDetails.payAmount > 180) {
//                                         // await client.sendMessage(chat.entity,{ message: "Mute ok.. I Will Call now!!" });
//                                     } else if (userDetails.payAmount < 201) {
//                                         await client.sendMessage(chat.entity, { message: "**Did you like the full Show??**😚" });
//                                         setTimeout(async () => {
//                                             await client.sendMessage(chat.entity, { message: "**30 Mins VideoCall   :  350₹/-\n1 hour Full   :   600₹/-**" });
//                                         }, 3000)
//                                     }
//                                 } else {
//                                     await client.sendMessage(chat.entity, { message: "**Did you like the Demo??😚\n\nPay Again!! if You want More....**" });
//                                     setTimeout(async () => {
//                                         await client.sendMessage(chat.entity, { message: `**Take Full Show Baby...!!**\nPussy also!!\n\nWithout Face : **100₹**\nWith Face      : **150₹**` });
//                                     }, 3000)
//                                 }
//                             }
//                         } else {
//                             if (userDetails.payAmount > 15) {
//                                 await client.sendMessage(chat.entity, { message: messages.noFreeDemo + "\n\n" + messages.demo })
//                             } else if (userDetails.payAmount > 10 && userDetails.picsSent) {
//                                 await client.sendMessage(chat.entity, { message: `I have sent you Pics for your money\n${messages.just50}` })
//                             } else {
//                                 await client.sendMessage(chat.entity, { message: selectRandomElements(["oyee..", "oye", "haa", "hmm", "??", "hey"], 1)[0] })
//                             }
//                         }
//                         await client.markAsRead(chat.entity);
//                     }
//                 } catch (error) {
//                     console.log(error);
//                     return new Promise((resolve) => {
//                         setTimeout(() => resolve(true), 5000)
//                     });
//                 }
//             }
//         } catch (error) {
//             console.log(error.errorMessage);
//             try {
//                 if (error.errorMessage === 'AUTH_KEY_DUPLICATED') {
//                     await fetchWithTimeout(`${ppplbot}&text=@${(process.env.clientId).toUpperCase()}: AUTH KEY DUPLICATED`);
//                 }
//                 if ((error.errorMessage === "USER_DEACTIVATED_BAN" || error.errorMessage === "USER_DEACTIVATED") && error.errorMessage !== "INPUT_USER_DEACTIVATED") {
//                     await fetchWithTimeout(`${ppplbot}&text=@${(process.env.clientId).toUpperCase()}: USER_DEACTIVATED - STARTED NEW USER PROCESS`);
//                     const url = `${process.env.tgmanager}/clients/setupClient/${process.env.clientId}?a=no`;
//                     await fetchWithTimeout(url);
//                 }
//             } catch (error) {
//                 console.log(error)
//             }
//         }
//     }
// }

// async function startNewUserProcess(error: any) {
//     if (error.errorMessage === 'AUTH_KEY_DUPLICATED') {
//         await fetchWithTimeout(`${ppplbot}&text=@${(process.env.clientId).toUpperCase()}: AUTH KEY DUPLICATED`);
//     }
//     if ((error.errorMessage === "USER_DEACTIVATED_BAN" || error.errorMessage === "USER_DEACTIVATED") && error.errorMessage !== "INPUT_USER_DEACTIVATED") {
//         await fetchWithTimeout(`${ppplbot}&text=@${(process.env.clientId).toUpperCase()}: USER_DEACTIVATED - STARTED NEW USER PROCESS`);
//         const url = `${process.env.tgmanager}/clients/clients/setupClient/${process.env.clientId}?archiveOld=false&formalities=false`;
//         await fetchWithTimeout(url);
//     }
// }

// async function checktghealth(client: TelegramClient) {
//     try {
//         if (client) {
//             await client.sendMessage('@spambot', { message: '/start' })
//         } else {
//             console.log("instanse not exist")
//         }
//     } catch (error) {
//         console.log(error)
//         try {
//             await client.invoke(
//                 new Api.contacts.Unblock({
//                     id: '178220800'
//                 })
//             );
//         } catch (error) {
//             console.log(error)
//         }
//         await fetchWithTimeout(`${ppplbot}&text=@${(process.env.clientId).toUpperCase()}: Failed To Check Health`);

        
//     }
// }

// export async function getIChannelFromTg(channelId: string) {
//     const channelEnt = channelId.startsWith('-') ? channelId : `-100${channelId}`;
    
//     const { id, defaultBannedRights, title, broadcast, username, participantsCount, restricted } = <Api.Channel>await TelegramManager.getInstance().getEntity(channelEnt)
//     const channel: IChannel = {
//         channelId: id.toString()?.replace(/^-100/, ""),
//         title,
//         participantsCount,
//         username,
//         restricted,
//         broadcast,
//         sendMessages: defaultBannedRights?.sendMessages,
//         canSendMsgs: !broadcast && !defaultBannedRights?.sendMessages,
//         availableMsgs: defaultMessages,
//         dMRestriction: 0,
//         banned: false,
//         reactions: defaultReactions,
//         reactRestricted: false,
//         wordRestriction: 0
//     }
//     return channel;
// }
