require('dotenv').config()
console.log("in Config");
import fetch from "node-fetch";

export async function getDataAndSetEnvVariables(url: string) {
    try {
        const response = await fetch(url);
        const jsonData:any  = await response.json();
        for (const key in jsonData) {
            process.env[key] = jsonData[key];
        }
        console.log('Environment variables set successfully!');
    } catch (error) {
        console.error('Error retrieving data or setting environment variables:', error);
    }
}

getDataAndSetEnvVariables(`https://uptimechecker2.glitch.me/clients/${process.env.clientId}`).then(()=>{
    require('./express')
})
