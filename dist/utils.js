"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultMessages = exports.defaultReactions = void 0;
exports.sleep = sleep;
exports.contains = contains;
exports.selectRandomElements = selectRandomElements;
exports.toBoolean = toBoolean;
exports.fetchNumbersFromString = fetchNumbersFromString;
exports.parseError = parseError;
exports.ppplbot = ppplbot;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function contains(str, arr) {
    return (arr.some(element => {
        if (str === null || str === void 0 ? void 0 : str.includes(element)) {
            return true;
        }
        return false;
    }));
}
;
function selectRandomElements(array, n) {
    if (array) {
        const selectedElements = [];
        for (let i = 0; i < n; i++) {
            const randomIndex = Math.floor(Math.random() * array.length);
            selectedElements.push(array[randomIndex]);
        }
        return selectedElements;
    }
    else {
        return [];
    }
}
function toBoolean(value) {
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }
    if (typeof value === 'number') {
        return value === 1;
    }
    return value;
}
function fetchNumbersFromString(inputString) {
    const regex = /\d+/g;
    const matches = inputString.match(regex);
    if (matches) {
        const result = matches.join('');
        return result;
    }
    else {
        return '';
    }
}
function parseError(err, prefix = 'TgCms') {
    var _a, _b, _c, _d, _e, _f;
    let status = 'UNKNOWN';
    let message = 'An unknown error occurred';
    let error = 'UnknownError';
    const extractMessage = (data) => {
        if (Array.isArray(data)) {
            const messages = data.map((item) => extractMessage(item));
            return messages.filter((message) => message !== undefined).join(', ');
        }
        else if (typeof data === 'string') {
            return data;
        }
        else if (typeof data === 'object' && data !== null) {
            let resultString = '';
            for (const key in data) {
                const value = data[key];
                if (Array.isArray(data[key]) && data[key].every(item => typeof item === 'string')) {
                    resultString = resultString + data[key].join(', ');
                }
                else {
                    const result = extractMessage(value);
                    if (result) {
                        resultString = resultString + result;
                    }
                }
            }
            return resultString;
        }
        return JSON.stringify(data);
    };
    if (err.response) {
        const response = err.response;
        status =
            ((_a = response.data) === null || _a === void 0 ? void 0 : _a.status) ||
                response.status ||
                err.status ||
                'UNKNOWN';
        message =
            ((_b = response.data) === null || _b === void 0 ? void 0 : _b.message) ||
                ((_c = response.data) === null || _c === void 0 ? void 0 : _c.errors) ||
                response.message ||
                response.statusText ||
                response.data ||
                err.message ||
                'An error occurred';
        error =
            ((_d = response.data) === null || _d === void 0 ? void 0 : _d.error) ||
                response.error ||
                err.name ||
                err.code ||
                'Error';
    }
    else if (err.request) {
        status = err.status || 'NO_RESPONSE';
        message = ((_e = err.data) === null || _e === void 0 ? void 0 : _e.message) ||
            ((_f = err.data) === null || _f === void 0 ? void 0 : _f.errors) ||
            err.message ||
            err.statusText ||
            err.data ||
            err.message || 'The request was triggered but no response was received';
        error = err.name || err.code || 'NoResponseError';
    }
    else if (err.message) {
        status = err.status || 'UNKNOWN';
        message = err.message;
        error = err.name || err.code || 'Error';
    }
    else if (err.errorMessage) {
        status = err.status || 'UNKNOWN';
        message = err.errorMessage;
        error = err.name || err.code || 'Error';
    }
    const msg = `${prefix ? `${prefix} ::` : ""} ${extractMessage(message)} `;
    const resp = { status, message: msg, error };
    console.log(resp.error == 'RPCError' ? resp.message : resp);
    return resp;
}
let botCount = 0;
function ppplbot(chatId, botToken) {
    let token = botToken;
    if (!token) {
        if (botCount % 2 === 1) {
            token = 'bot6624618034:AAHoM3GYaw3_uRadOWYzT7c2OEp6a7A61mY';
        }
        else {
            token = 'bot6607225097:AAG6DJg9Ll5XVxy24Nr449LTZgRb5bgshUA';
        }
        botCount++;
    }
    const targetChatId = chatId || '-1001801844217'; // Replace with actual chat ID
    const apiUrl = `https://api.telegram.org/${token}/sendMessage?chat_id=${targetChatId}`;
    return apiUrl;
}
;
exports.defaultReactions = [
    '❤', '🔥', '👏', '🥰', '😁', '🤔',
    '🤯', '😱', '🤬', '😢', '🎉', '🤩',
    '🤮', '💩', '🙏', '👌', '🕊', '🤡',
    '🥱', '🥴', '😍', '🐳', '❤‍🔥', '💯',
    '🤣', '💔', '🏆', '😭', '😴', '👍',
    '🌚', '⚡', '🍌', '😐', '💋', '👻',
    '👀', '🙈', '🤝', '🤗', '🆒',
    '🗿', '🙉', '🙊', '🤷', '👎'
];
exports.defaultMessages = [
    "1", "2", "3", "4", "5", "6", "7", "8",
    "9", "10", "11", "12", "13", "14", "15",
    "16", "17", "18"
];
