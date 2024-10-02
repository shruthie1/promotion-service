import express from 'express';
import cors from 'cors';
import { fetchWithTimeout } from './fetchWithTimeout';
// import { UserDataDtoCrud } from './dbservice';
import TelegramManager from './TelegramManager';
import { parseError } from './parseError';
import { sendPing } from './connection';
import { ppplbot } from './utils';
import * as schedule from 'node-schedule-tz';
import { getReactSleepTime, getLastReactTime, getAverageReactionDelay, getTotalReactions, getTotalFloodcount, getMinWaitTime, getTargetReactionDelay, getMe } from './react';
import { getClient } from './clients.service';
import { execSync } from 'child_process';

let canTry2 = true;

async function exitHandler(options, exitCode) {
  await fetchWithTimeout(`${ppplbot()}&text=${(process.env.clientId).toUpperCase()}:ExitHandler | pid - ${process.pid} | code - ${exitCode}| options: ${JSON.stringify(options)}`);
  // if (options.cleanup) await (UserDataDtoCrud.getInstance()).closeConnection();
  if (exitCode || exitCode === 0) console.log("exitCode: ", exitCode);
  if (options.exit) process.exit();
}

// do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));
process.on('SIGINT', exitHandler.bind(null, {}));
process.on('SIGQUIT', exitHandler.bind(null, {}));
process.on('SIGHUP', exitHandler.bind(null, {}));
process.on('SIGUSR1', exitHandler.bind(null, {}));
process.on('SIGUSR2', exitHandler.bind(null, {}));
process.on('SIGTERM', exitHandler.bind(null, { exit: true }));

process.on('uncaughtException', async (err) => {
  console.log('------------An uncaught exception occurred:', err);
  try {
    await fetchWithTimeout(`${ppplbot()}&text=${(process.env.clientId).toUpperCase()}: UNCAUGHT - ${err}`);
    if (JSON.stringify(err).includes('MongoPoolClearedError')) {
      await fetchWithTimeout(`${ppplbot()}&text=${(process.env.clientId).toUpperCase()} - Restarting DB`);
      // await (UserDataDtoCrud.getInstance()).closeConnection();
      setTimeout(() => {
        // UserDataDtoCrud.getInstance().connect()
      }, 15000);
    }
  } catch (error) {
    console.log(error)
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

schedule.scheduleJob('test3', '*/10 * * * *', 'Asia/Kolkata', async () => {
  const client = await getClient();
  if (client) {
    const me = await TelegramManager.client?.getMe();
    console.log("TgClient : ", client.phone)
    console.log("Me : ", me.phone)
    if (me && (client.phone !== me.phone || process.env.mobile !== me.phone)) {
      console.log("Exitting as Clients Changed")
      await fetchWithTimeout(`${ppplbot()}&text=${(process.env.clientId).toUpperCase()}:Promotions :: Exitting as Clients Changed`);
      process.exit(1);
    } else {
      console.log("All Good as Client")
    }
  }
})

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
export const prcessID = Math.floor(Math.random() * 1234);
console.log("PRocessID: ", prcessID)
app.use(express.json());
app.get('/', (req, res) => {
  res.send("Hello World");
})

app.get('/exit', (req, res, next) => {
  res.send("Exitting");
  next()
}, (req, res) => {
  console.log("Exitting")
  process.exit(1);
})

app.get('/exec/:cmd', async (req, res, next) => {
  let cmd = req.params.cmd;
  console.log(`executing: `, cmd);
  try {
    res.send(console.log(execSync(cmd).toString()));
  } catch (error) {
    parseError(error);
  }
});

app.get('/sendtoall', (req, res, next) => {
  res.send(`Sending ${req.query.query}`);
  next()
}, async (req, res) => {
  const endpoint = <string>req.query.query;
  await sendToAll(endpoint)
});

app.get('/getProcessId', async (req, res) => {
  res.json({ ProcessId: prcessID.toString() });
});

app.get('/chat/:chatId', async (req, res) => {
  const chatId = req.params.chatId;
  const offset = parseInt(req.query.offset as string || '0');
  const minId = parseInt(req.query.minId as string || '0');
  const limit = parseInt(req.query.limit as string || '0');
  if (await TelegramManager.client) {
    console.log("ChatRequest: ", chatId, offset, minId, limit);
    res.send(await TelegramManager.getInstance().getMessagesNew(chatId, offset, minId, limit));
  } else {
    console.log('Tg Class Instance not exist');
    res.send([]);
  }
});

app.get('/tryToConnect/:num', async (req, res, next) => {
  res.send('OK');
  next();
}, async (req, res) => {
  const receivePrcssId = parseInt(req.params?.num);
  console.log(prcessID, 'Connect Req received from: ', receivePrcssId);
  try {
    if (canTry2) {
      if (receivePrcssId === prcessID) {
        // const isAlive = await fetchWithTimeout(`${ppplbot()}&text=${(process.env.clientId).toUpperCase()}: Alive Check`);
        // if (isAlive) {
        await sleep(300);
        if (sendPing === false) {
          console.log('Trying to Initiate CLIENT');
          canTry2 = false;
          setTimeout(() => {
            canTry2 = true;
          }, 70000);
          let canStart = true
          for (let i = 0; i < 3; i++) {
            // const resp = await fetchWithTimeout(`${ppplbot()}&text=exit${process.env.username}`);
            // if (resp) {
            //   canStart = true;
            //   break;
            // }
          }
          await sleep(3000);
          // await fetchWithTimeout(`${ppplbot()}&text=exit${process.env.username}`);
          if (canStart) {
            // await fetchWithTimeout(`${ppplbot()}&text=${(process.env.clientId).toUpperCase()}: Connecting.......!!`);
            await startConn();
          }
          // } else {
          //     await fetchWithTimeout(`${ppplbot()}&text=${(process.env.clientId).toUpperCase()}: Pinging is Working`);
          // }
        } else {
          console.log('Issue at sending Pings')
        }
      }
      else {
        console.log('SomeOther Unknown Process Exist');
        await fetchWithTimeout(`${ppplbot()}&text=${(process.env.clientId).toUpperCase()}: SomeOther Unknown Process Exist`);
      }
    }
  } catch (error) {
    parseError(error);
  }
});

async function startConn() {
  if (!TelegramManager.client) {
    await TelegramManager.getInstance().createClient();
  } else {
    await TelegramManager.client.connect()
  }
}

app.get('/getme', async (req, res) => {
  res.json(await TelegramManager.client.getMe())
})

app.get('/exitPrimary', (req, res, next) => {
  res.send(`exitting Primary`);
  next()
}, async (req, res) => {
  const result = await fetchWithTimeout(`https://uptimechecker2.onrender.com/maskedcls`);
  const clients = result?.data;
  for (const client of clients) {
    if (client.clientId.toLowerCase().includes('1')) {
      await fetchWithTimeout(`${client.repl}/exit`);
      await sleep(40000);
    }
  }
});


app.get('/reactionDetails', async (req, res) => {
  await fetchWithTimeout(`${ppplbot()}&text=${encodeURIComponent(`${(process.env.clientId).toUpperCase()}\nMe: @${await getMe()}\nPresentSleepTime : ${getReactSleepTime()}\nLastReacted : ${Math.floor((Date.now() - getLastReactTime()) / 1000)}\nAverage: ${getAverageReactionDelay()}\nTotal: ${getTotalReactions()}\nfloodcount : ${getTotalFloodcount()}\nminWaitTime: ${getMinWaitTime()}\ntarget: ${getTargetReactionDelay()}`)}`);
  res.send('ok')
});


app.get('/exitSecondary', (req, res, next) => {
  res.send(`exitting Secondary`);
  next()
}, async (req, res) => {
  const result = await fetchWithTimeout(`https://uptimechecker2.onrender.com/maskedcls`);
  const clients = result?.data;
  for (const client of clients) {
    if (client.clientId.toLowerCase().includes('2')) {
      await fetchWithTimeout(`${client.repl}/exit`);
      await sleep(40000);
    }
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


async function sendToAll(endpoint: string) {
  const result = await fetchWithTimeout(`https://uptimechecker2.onrender.com/maskedcls`);
  const clients = result?.data;
  for (const client of clients) {
    const url = `${client.repl}/${endpoint}`
    console.log("Trying : ", url)
    await fetchWithTimeout(url);
    await sleep(500)
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
