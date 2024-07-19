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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWithTimeout = fetchWithTimeout;
const axios_1 = __importDefault(require("axios"));
const parseError_1 = require("./parseError");
const ppplbot = `https://api.telegram.org/bot6735591051:AAELwIkSHegcBIVv5pf484Pn09WNQj1Nl54/sendMessage?chat_id=${process.env.updatesChannel}`;
function fetchWithTimeout(resource_1) {
    return __awaiter(this, arguments, void 0, function* (resource, options = {}, sendErr = true, maxRetries = 1) {
        options.timeout = options.timeout || 50000;
        options.method = options.method || 'GET';
        const fetchWithProtocol = (url, version) => __awaiter(this, void 0, void 0, function* () {
            const source = axios_1.default.CancelToken.source();
            const id = setTimeout(() => {
                source.cancel(`Request timed out after ${options.timeout}ms`);
            }, options.timeout);
            const defaultHeaders = {
                'Content-Type': 'application/json'
            };
            const headers = Object.assign(Object.assign({}, defaultHeaders), options.headers);
            try {
                const response = yield (0, axios_1.default)(Object.assign(Object.assign({ headers }, options), { url, cancelToken: source.token, family: version }));
                clearTimeout(id);
                return response;
            }
            catch (error) {
                clearTimeout(id);
                console.log(`Error at URL (IPv${version}): `, url);
                if (axios_1.default.isCancel(error)) {
                    console.log('Request canceled:', error.message, url);
                    return undefined;
                }
                throw error; // Rethrow the error to handle retry logic outside
            }
        });
        for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
            try {
                const responseIPv4 = yield fetchWithProtocol(resource, 4);
                if (responseIPv4)
                    return responseIPv4;
                const responseIPv6 = yield fetchWithProtocol(resource, 6);
                if (responseIPv6)
                    return responseIPv6;
            }
            catch (error) {
                console.log("Error at URL : ", resource);
                const errorDetails = (0, parseError_1.parseError)(error, undefined, false);
                if (errorDetails.status.toString() !== '429' && error.code !== 'ERR_NETWORK' && error.code !== "ECONNABORTED" && error.code !== "ETIMEDOUT" && !errorDetails.message.toLowerCase().includes('too many requests') && !axios_1.default.isCancel(error)) {
                    if (retryCount < maxRetries) {
                        console.log(`Retrying... (${retryCount + 1}/${maxRetries})`);
                        yield new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds delay
                    }
                    else {
                        console.log(`All ${maxRetries + 1} retries failed for ${resource}`);
                        if (sendErr) {
                            axios_1.default.get(`${ppplbot}&text=${encodeURIComponent(`HELPER :: All ${maxRetries + 1} retries failed for ${resource}\n${errorDetails.message}`)}`);
                        }
                        return undefined;
                    }
                }
            }
        }
    });
}
