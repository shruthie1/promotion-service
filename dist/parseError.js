"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseError = parseError;
const fetchWithTimeout_1 = require("./fetchWithTimeout");
const notifbot = `https://api.telegram.org/bot5856546982:AAEW5QCbfb7nFAcmsTyVjHXyV86TVVLcL_g/sendMessage?chat_id=${process.env.notifChannel}`;
function parseError(err, prefix, sendErr = true) {
    var _a, _b, _c, _d, _e, _f;
    let status = 'UNKNOWN';
    let message = 'An unknown error occurred';
    let error = 'UnknownError';
    prefix = `${process.env.clientId} - ${prefix ? prefix : ""}`;
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
        console.log("Checking in response");
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
        console.log("Checking in request");
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
        console.log("Checking in error");
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
    console.log(resp);
    if (sendErr && !msg.includes("INPUT_USER_DEACTIVATED")) {
        (0, fetchWithTimeout_1.fetchWithTimeout)(`${notifbot}&text=${resp.message}`);
    }
    return resp;
}
