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
Object.defineProperty(exports, "__esModule", { value: true });
const chat_model_1 = require("../../database/models/chat.model");
const bot_added_event = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    // Telegraf provides membership updates under `my_chat_member`
    const update = (_a = ctx.update) !== null && _a !== void 0 ? _a : {};
    const memberUpdate = (_b = update.my_chat_member) !== null && _b !== void 0 ? _b : ctx.my_chat_member;
    if (!memberUpdate)
        return;
    const newMember = memberUpdate.new_chat_member;
    if (!newMember)
        return;
    // Only care when the update is about a bot (i.e., the bot itself)
    // `my_chat_member` updates are always about the bot itself unless it's a `chat_member` update.
    // Double check if we need to filter for self, but usually my_chat_member is for me.
    // However, verifying it is the bot user doesn't hurt.
    // Actually, memberUpdate.from is the user who triggered the change, new_chat_member.user is the user who changed status.
    // For `my_chat_member`, the user whose status changed is the bot itself.
    // Statuses: 'member', 'administrator' (joined/added/promoted)
    // 'left', 'kicked' (left/removed)
    // 'restricted' (still a member usually, but limited)
    const status = newMember.status;
    const chatId = (_c = memberUpdate.chat) === null || _c === void 0 ? void 0 : _c.id;
    const chatTitle = (_d = memberUpdate.chat) === null || _d === void 0 ? void 0 : _d.title;
    const chatType = (_e = memberUpdate.chat) === null || _e === void 0 ? void 0 : _e.type;
    if (!chatId)
        return;
    console.log(`Bot membership update in chat ${chatId}: ${status}`);
    try {
        if (status === "member" || status === "administrator" || status === "restricted") {
            yield chat_model_1.ChatModel.updateOne({ chatId }, {
                $set: {
                    chatId,
                    title: chatTitle,
                    type: chatType,
                    isMember: true,
                },
            }, { upsert: true });
            console.log(`Updated chat ${chatId} status to MEMBER`);
        }
        else if (status === "left" || status === "kicked") {
            yield chat_model_1.ChatModel.updateOne({ chatId }, {
                $set: {
                    isMember: false,
                },
            });
            console.log(`Updated chat ${chatId} status to NOT MEMBER`);
        }
    }
    catch (err) {
        console.error(`Failed to update DB for chat ${chatId}`, err);
    }
});
exports.default = bot_added_event;
