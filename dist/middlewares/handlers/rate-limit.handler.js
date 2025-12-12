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
exports.rateLimitHandler = void 0;
const bottleneck_1 = __importDefault(require("bottleneck"));
const rateLimitHandler = () => {
    const queue = new bottleneck_1.default({
        maxConcurrent: 1, // Ensure only one request is sent at a time
        minTime: 1000 / 30, // Minimum delay between requests (30 requests per second)
    });
    const middleware = (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
        const oldCallApi = ctx.telegram.callApi.bind(ctx.telegram);
        const newCallApi = function newCallApi(method_1, payload_1) {
            return __awaiter(this, arguments, void 0, function* (method, payload, options = {}) {
                const maxRetries = 5;
                let retryCount = 0;
                return queue.schedule(() => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    while (retryCount < maxRetries) {
                        try {
                            return yield oldCallApi(method, payload, options);
                        }
                        catch (error) {
                            if (((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.error_code) === 429) {
                                const retryAfter = ((_b = error.response.parameters) === null || _b === void 0 ? void 0 : _b.retry_after) || 1;
                                yield new Promise((resolve) => {
                                    console.warn(`Rate limited on ${method}, retrying after ${retryAfter} seconds...`);
                                    setTimeout(resolve, retryAfter * 1000);
                                });
                                console.log("Retrying...");
                                retryCount++;
                            }
                            else {
                                throw error;
                            }
                        }
                    }
                    throw new Error(`Max retries reached for method: ${method}`);
                }));
            });
        };
        ctx.telegram.callApi = newCallApi.bind(ctx.telegram);
        yield next();
    });
    return middleware;
};
exports.rateLimitHandler = rateLimitHandler;
