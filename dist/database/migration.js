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
exports.migrateDestinationChats = void 0;
const env_config_1 = require("../config/env.config");
const chat_model_1 = require("./models/chat.model");
const bot_1 = __importDefault(require("../bot"));
const migrateDestinationChats = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Starting migration of DESTINATION_CHAT_IDS...");
    for (const chatId of env_config_1.DESTINATION_CHAT_IDS) {
        if (!chatId)
            continue;
        try {
            // Check if already exists to avoid unnecessary API calls,
            // but if we want to ensure data consistency we might want to refresh info.
            // The requirement says "Add the existing DESTINATION_CHAT_IDS to the new dynamic list initially".
            // We will try to fetch info from Telegram to ensure valid type/title.
            const exists = yield chat_model_1.ChatModel.findOne({ chatId });
            if (exists) {
                console.log(`Chat ${chatId} already in DB. Skipping.`);
                continue;
            }
            console.log(`Fetching info for chat ${chatId}...`);
            const chatInfo = yield bot_1.default.telegram.getChat(chatId);
            yield chat_model_1.ChatModel.updateOne({ chatId }, {
                $set: {
                    chatId,
                    title: chatInfo.title,
                    type: chatInfo.type,
                    isMember: true, // Assuming member if we can fetch it, or at least we want to try
                },
            }, { upsert: true });
            console.log(`Migrated chat ${chatId} (${chatInfo.type})`);
        }
        catch (error) {
            console.error(`Failed to migrate chat ${chatId}:`, error);
            // If we fail to get chat, it might be because the bot is not a member or kicked.
            // We can choose to insert it as isMember: false, or just skip.
            // Skipping is safer to avoid errors during forwarding.
        }
    }
    console.log("Migration complete.");
});
exports.migrateDestinationChats = migrateDestinationChats;
