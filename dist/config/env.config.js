"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DESTINATION_CHAT_IDS = exports.MONGODB_URI = exports.SOURCE_CHAT_IDS = exports.NODE_ENV = exports.WEBHOOK_PORT = exports.WEBHOOK_DOMAIN = exports.DEV_CHAT_ID = exports.BOT_TOKEN = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.BOT_TOKEN = process.env.BOT_TOKEN;
exports.DEV_CHAT_ID = Number(process.env.DEV_CHAT_ID);
exports.WEBHOOK_DOMAIN = process.env.WEBHOOK_DOMAIN;
exports.WEBHOOK_PORT = Number(process.env.WEBHOOK_PORT);
exports.NODE_ENV = process.env.NODE_ENV;
exports.SOURCE_CHAT_IDS = ((_c = (_b = (_a = process.env.SOURCE_CHAT_IDS) === null || _a === void 0 ? void 0 : _a.split(",")) === null || _b === void 0 ? void 0 : _b.map((id) => Number(id.trim()) || null)) === null || _c === void 0 ? void 0 : _c.filter((id) => Number.isInteger(id))) || [];
exports.MONGODB_URI = process.env.MONGODB_URI;
exports.DESTINATION_CHAT_IDS = ((_f = (_e = (_d = process.env.DESTINATION_CHAT_IDS) === null || _d === void 0 ? void 0 : _d.split(",")) === null || _e === void 0 ? void 0 : _e.map((id) => Number(id.trim()) || null)) === null || _f === void 0 ? void 0 : _f.filter((id) => Number.isInteger(id))) || [];
