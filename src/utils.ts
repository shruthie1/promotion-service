import axios from "axios";
import { fetchWithTimeout } from "./fetchWithTimeout";

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
export function contains(str, arr) {
  return (arr.some(element => {
    if (str?.includes(element)) {
      return true;
    }
    return false;
  }))
};

export function selectRandomElements<T>(array: T[], n: number): T[] {
  if (array) {
    const selectedElements: T[] = [];
    for (let i = 0; i < n; i++) {
      const randomIndex = Math.floor(Math.random() * array.length);
      selectedElements.push(array[randomIndex]);
    }
    return selectedElements;
  } else {
    return [];
  }
}

export function toBoolean(value: string | number | boolean): boolean {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return value
}

export function fetchNumbersFromString(inputString) {
  const regex = /\d+/g;
  const matches = inputString.match(regex);
  if (matches) {
    const result = matches.join('');
    return result;
  } else {
    return '';
  }
}

export function parseError(
  err,
  prefix = 'TgCms',
) {
  let status = 'UNKNOWN';
  let message = 'An unknown error occurred';
  let error = 'UnknownError';

  const extractMessage = (data) => {
    if (Array.isArray(data)) {
      const messages = data.map((item) => extractMessage(item));
      return messages.filter((message) => message !== undefined).join(', ');
    } else if (typeof data === 'string') {
      return data;
    } else if (typeof data === 'object' && data !== null) {
      let resultString = ''
      for (const key in data) {
        const value = data[key]
        if (Array.isArray(data[key]) && data[key].every(item => typeof item === 'string')) {
          resultString = resultString + data[key].join(', ');
        } else {
          const result = extractMessage(value);
          if (result) {
            resultString = resultString + result;
          }
        }
      }
      return resultString
    }
    return JSON.stringify(data);
  };

  if (err.response) {
    const response = err.response;
    status =
      response.data?.status ||
      response.status ||
      err.status ||
      'UNKNOWN';
    message =
      response.data?.message ||
      response.data?.errors ||
      response.message ||
      response.statusText ||
      response.data ||
      err.message ||
      'An error occurred';
    error =
      response.data?.error ||
      response.error ||
      err.name ||
      err.code ||
      'Error';
  } else if (err.request) {
    status = err.status || 'NO_RESPONSE';
    message = err.data?.message ||
      err.data?.errors ||
      err.message ||
      err.statusText ||
      err.data ||
      err.message || 'The request was triggered but no response was received';
    error = err.name || err.code || 'NoResponseError';
  } else if (err.message) {
    status = err.status || 'UNKNOWN';
    message = err.message;
    error = err.name || err.code || 'Error';
  } else if (err.errorMessage) {
    status = err.status || 'UNKNOWN';
    message = err.errorMessage;
    error = err.name || err.code || 'Error';
  }

  const msg = `${prefix ? `${prefix} ::` : ""} ${extractMessage(message)} `

  const resp = { status, message: msg, error };
  console.log(resp.error == 'RPCError' ? resp.message : resp);
  return resp
}
let botCount = 0;

export function ppplbot(chatId?: string, botToken?: string) {
  let token = botToken;

  if (!token) {
    if (botCount % 2 === 1) {
      token = 'bot6624618034:AAHoM3GYaw3_uRadOWYzT7c2OEp6a7A61mY';
    } else {
      token = 'bot6607225097:AAG6DJg9Ll5XVxy24Nr449LTZgRb5bgshUA';
    }
    botCount++;
  }
  const targetChatId = chatId || process.env.notifChannel; // Replace with actual chat ID
  const apiUrl = `https://api.telegram.org/${token}/sendMessage?chat_id=${targetChatId}`;
  return apiUrl;
};

export const defaultReactions = [
  '❤', '🔥', '👏', '🥰', '😁', '🤔',
  '🤯', '😱', '🤬', '😢', '🎉', '🤩',
  '🤮', '💩', '🙏', '👌', '🕊', '🤡',
  '🥱', '🥴', '😍', '🐳', '❤‍🔥', '💯',
  '🤣', '💔', '🏆', '😭', '😴', '👍',
  '🌚', '⚡', '🍌', '😐', '💋', '👻',
  '👀', '🙈', '🤝', '🤗', '🆒',
  '🗿', '🙉', '🙊', '🤷', '👎'
]
export const defaultMessages = [
  "1", "2", "3", "4", "5", "6", "7", "8",
  "9", "10", "11", "12", "13", "14", "15",
  "16", "17", "18"
];

export async function startNewUserProcess(error: any) {
  if (error.errorMessage == 'CONNECTION_NOT_INITED' || error.errorMessage == 'AUTH_KEY_DUPLICATED') {
    await axios.delete(`${process.env.tgcms}/archived-clients/${process.env.mobile}`);
    console.log("Deleting Archived Client")
    process.exit(1);
}
  if (error.errorMessage === "USER_DEACTIVATED_BAN" || error.errorMessage === "USER_DEACTIVATED") {
    console.log("Exitiing")
    process.exit(1)
  }
}
