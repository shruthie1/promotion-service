import express from 'express';
import { fetchWithTimeout } from './fetchWithTimeout';
import { UserDataDtoCrud } from './dbservice';
import TelegramManager from './TelegramManager';
import { parseError } from './parseError';
import { sendPing } from './connection';

let canTry2 = true;
const ppplbot = `https://api.telegram.org/bot6735591051:AAELwIkSHegcBIVv5pf484Pn09WNQj1Nl54/sendMessage?chat_id=${process.env.updatesChannel}`;

const app = express();
const port = process.env.PORT || 3000;
export const prcessID = Math.floor(Math.random() * 123);
console.log("PRocessID: ", prcessID)
app.use(express.json());
app.get('/', (req, res) => {
  res.send("Hello World");
})
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

app.get('/tryToConnect/:num', async (req, res, next) => {
  res.send('OK');
  next();
}, async (req, res) => {
  const receivePrcssId = parseInt(req.params?.num);
  console.log(prcessID, 'Connect Req received from: ', receivePrcssId);
  try {
    if (canTry2) {
      if (receivePrcssId === prcessID) {
        // const isAlive = await fetchWithTimeout(`${ppplbot}&text=${(process.env.clientId).toUpperCase()}: Alive Check`);
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
            // const resp = await fetchWithTimeout(`${ppplbot}&text=exit${process.env.username}`);
            // if (resp) {
            //   canStart = true;
            //   break;
            // }
          }
          await sleep(3000);
          // await fetchWithTimeout(`${ppplbot}&text=exit${process.env.username}`);
          if (canStart) {
            // await fetchWithTimeout(`${ppplbot}&text=${(process.env.clientId).toUpperCase()}: Connecting.......!!`);
            await startConn();
          }
          // } else {
          //     await fetchWithTimeout(`${ppplbot}&text=${(process.env.clientId).toUpperCase()}: Pinging is Working`);
          // }
        } else {
          console.log('Issue at sending Pings')
        }
      }
      else {
        console.log('SomeOther Unknown Process Exist');
        await fetchWithTimeout(`${ppplbot}&text=${(process.env.clientId).toUpperCase()}: SomeOther Unknown Process Exist`);
      }
    }
  } catch (error) {
    parseError(error);
  }
});

async function startConn() {
  const userDataDtoCrud = UserDataDtoCrud.getInstance();
  if (!userDataDtoCrud.isConnected) {
    try {
      const isConnected = await userDataDtoCrud.connect();
      if (isConnected) {
        await TelegramManager.getInstance().createClient();
      } else {
        console.log('Error While Connecting to DB=====', isConnected);
      }
    } catch (error) {
      console.log('Error While Connecting to DB', error);
    }
  } else {
    await TelegramManager.getInstance().createClient();
  }
}

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
