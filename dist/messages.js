"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomMsg = exports.messages = exports.endpoint = void 0;
exports.pickOneMsg = pickOneMsg;
console.log("in MEssages");
exports.endpoint = `mode=02`; //&mam=15
exports.messages = {
    assureMSgArray: [
        "I'm little busy now, I will call u in some time",
        'Oyee.... Now??',
        'Oyee.... U there?',
        "Lets do now??",
        "Are you free now??",
        "Hey...Dont worry!! I will Call you pakka ok!!",
        "Hey...Dont worry!! I will Call you pakka ok!!",
        'Sorry, wait a while!!Dont worry, I will call you!!',
        "I'm Outside now, I will only Call you in some time!",
        'Sorry for the delay, I will Call you when I have a moment',
        'Can you please wait for a while? I will Call you after 1 hour',
        "I Just Came outside, I will only call u when I'm free!!"
    ],
    thanksArray: [`Aww...Thanks Naughty Boii!! ♥️🙈👀 `,
        `Thank youuu Dear!!♥️`,
        'Haha... Thanks🙈',
        `Thanks Baby🤗`,
        '♥️🙈♥️🙈♥️🙈',
        'Thanks a lot, dear! ❤️',
        'Thank you so much, love! 😍',
        'Thank you very much, sweetheart! 💖',
        'Thank you, dearie! 🥰',
        'Thank you, my dear! 😘',
    ],
    PayMsgArray: [
        `Just **Pay Now**\nNext Second itself..I will call nd SHOW you My BOOBs🙈🙈!!\n`,
        `**PAY** and **Message Me Dear!!**\nI will do **Now Itself🤗**\n`,
        "I'm ready and waiting! 😏\nComplete the payment and message me. 😚\n",
        "Oyyy...Pay and Msg!\nI'm ready to provide service 😚❤️\n",
        "I'm also ready now! 😏\nPay and message me. 💸📩\n",
        `**PAY** and **Message Me!**\nI will do **Now Itself**\n`,
        "Yeah, Do the Payment First!!\nI'm Ready for Service!!❤️\n",
        "I'm ready now😏!!\n** Pay and Msg me**\n"
    ],
    bye: `Byee!!`,
    cantPay: `If You cant Pay Just **20₹** to a **Beautiful Girl** Like Me!! Never message me again and Waste your own Time!!`,
    time: `Demo : 1 minute\nFull service 1 hour\n\nFor any service you take!`,
    wait: "**I'm Checking Payments**, What is Your Name on Payment???\n\nWait... 5 Mins!!\n\n**Send your Payment Screenshot Once Now!!**",
    screenshot: `**Send ur  Payment Screenshot!!**`,
    qr: '**"PhonePe / PayTm"  ONLY!!** 👆👆\n',
    qr1: 'Pay to this NEW QR Code!!',
    demo: `\n**DEMO** Nude pics: **25₹**\n**DEMO** Video call: **50₹**\n**DEMO** Voice call: **40₹**\n\n**Pay on My Website 👉🏻 ${process.env.link}**`,
    noFreeDemo: `**No FREE Demos!!**`,
    installments: 'You Can Take Video call in Installments!!\n\n**Like...Daily 15Mins!!So 4 days u can enjoy in Full video call.🤗🤗**',
    daily100: `So Many **People** Msg me for **Free Demo😔**\nI cant waste my time on **TimePassers!!**\n\nDemo **Video Call** is just **50₹!!**\nTake **Full Service** Only If U like **Demo VC!!**\n\n**PAY nd Enjoy** me Like a **REAL MAN!!🔥❤️**\nDont be a **TimePasser!!😏**`,
    just50: `**Video Call** is just 👉🏻 **50₹!!**\n\nDont be a **TimePasser Baby!!😏**\n**Pay nd Msg!!**`,
    link: `\n**Pay on my Website 👇👇\n${process.env.link}**`,
    dir: `OPEN 👉🏻 **${process.env.demolink}/${process.env.clientId}**`,
    pricelist: `**Full Service**\n\nSex chat                     :  **150₹/-**\n30 Full Nude Pics     :  **200₹**/-\n7 Full Nude Videos   :  **400₹/-**\nVoicecall sex             :   **350₹/-**\n\n**Full Nude Video call**  : **600₹/-**  (1 hour)`,
    botArray: [`No, I'm using **Auto reply** option!!\nDont worry I'm **Real girl** only!!`, `No Dear, Dont worry I'm **Real girl** only!!`, 'No Baby, I am Not!!'],
    thanksNdPay: `**PAY** and **Msg Me!!**\nI will Call you **Now Itself!\n\nOPEN 👉🏻 ${process.env.link}**`,
    ntnw: `Not now,\n**First take Online Service....🤗**\nIf I like your Behaviour and If i get satisfied with your **Video Call**...😚😚\nI will give you **My Address** and **NUMBER**.`,
    doing: `**Giving service** to other BOY\nHe PAID me just now`,
    fine: "I'm fine, you?",
    aut: "Heyy!!\n\nAll the Above message are **AUTOMATIC SYSTEM Msgs**. Please ignore!!",
    okayPay: `okay!!\n**Pay** and Msg me....**I'm Ready!!**`,
    dp: `Sure okay......!!\nYou See **All the Pics** in **My Profile**...!!\n\n**Pay for Demo**,I will send you more **Secret Pics**😜😜`,
    allDp: `You See **All the Pics** in **My Profile**...!!\n\n**Pay for Demo**,I will send you more **Secret Pics**😜😜`,
    notVirgin: "No, I'm not virgin!!",
    age: `I'm 24yrs old`,
    language: `I know telugu, hindi, english`,
    notMarried: "No, I'm not Married yet!!😜",
    number: '**Yes Okay**,\n\nPay and Message me!!\nI will call now...!!',
    study: "I'm doing **M.Tech** now!!",
    greeting: `\n\nI'm ready to do **Full Nude Video Call, Phone Sex, I will Send my NUDE Pics and Videos**💵\n\n🟢 **DEMO** Nude pics: **25₹**\n**🟢 DEMO** Video call: **50₹**\n🟢 **DEMO** Voice call: **40₹**\n\n\nI will make ur **Dick 🍆 Very HARD** that u will **Cumm** with **Full Satisfaction!!♥️🙈👀 **`,
    nameGreet: `!!!** \n\nI'm **${process.env.name}**\nAge: **24yrs**\nFrom: **HYDERABAD**\n\nAll online **SEX SERVICES** AVAILABLE`,
    channelLinks: `**My Website 👉🏻 ${process.env.link}\nJOIN 👉🏻 @${process.env.channelLink}**`,
    pp: `**Yes!!**\n\nIf u want more... Pay for the Demo!!`,
    nmns: "Pay and Msg!!\n\n**No MONEY? then No SERVICE!!\n\nDont WASTE your TIME,\nI will not do Anything Without Money!!**"
};
const someMsg = `**Video Call** is JUST **50₹!!**\nI will **Show Everything** to You!!\n\nDont be a **TimePasser!!😏**` + '\n**Just TRY ONCE Dear...❤️❤️**';
exports.randomMsg = [exports.messages.demo, "👀👀", exports.messages.just50, 'hmm👀', exports.messages.just50, 'What do you do?', 'haaa', 'haaa❤️', '?', "I'm mood now!!😔", 'are you vigin?', 'Show Me your Dick!!', "I'm Pressing my boobs now🙈", 'Will you lick my pussy??🙈', 'Your Dick is Hard Now??🙈', 'You want to lick My nipples?🙈', 'Your Dick Size??', 'numb', 'numb', 'what are you doing?', 'Where are you from?', 'What do like Most in SEX👀', 'your age?', 'what?', 'You want to kiss my boobies?🙈', "I'm not Wearing Dress now!!🙈\nTake the Demo!!", 'Hmm Okay❤️', "qr", ...exports.messages.PayMsgArray, someMsg];
function pickOneMsg(msgsArray) {
    return (msgsArray[Math.floor(Math.random() * msgsArray.length)]);
}
