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
const env_config_1 = require("../../config/env.config");
const MEDIA_GROUP_WAIT = 700; // ms to collect album parts
const mediaGroupBuffer = new Map();
const flushMediaGroup = (key) => __awaiter(void 0, void 0, void 0, function* () {
    const entry = mediaGroupBuffer.get(key);
    if (!entry)
        return;
    mediaGroupBuffer.delete(key);
    const msgs = entry.msgs.sort((a, b) => a.message_id - b.message_id);
    // Check if all are photos/videos (sendMediaGroup supports only photo/video)
    const allSupported = msgs.every((m) => (m.photo && m.photo.length > 0) || m.video);
    if (!allSupported) {
        // fallback: forward each part individually
        const forwardPromises = env_config_1.DESTINATION_CHAT_IDS.flatMap((destId) => msgs.map((m) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield entry.telegram.forwardMessage(destId, m.chat.id, m.message_id);
            }
            catch (err) {
                console.error(`Failed to forward media part to ${destId}`, err);
            }
        })));
        yield Promise.allSettled(forwardPromises);
        return;
    }
    // build InputMedia array
    // pick caption from the first message that has one
    const firstCaptionMsg = msgs.find((m) => m.caption);
    const captionToUse = firstCaptionMsg === null || firstCaptionMsg === void 0 ? void 0 : firstCaptionMsg.caption;
    const mediaArray = msgs
        .map((m, idx) => {
        if (m.photo && m.photo.length > 0) {
            const best = m.photo[m.photo.length - 1];
            return Object.assign({ type: "photo", media: best.file_id }, (idx === 0 && captionToUse ? { caption: captionToUse } : {}));
        }
        else if (m.video) {
            return Object.assign({ type: "video", media: m.video.file_id }, (idx === 0 && captionToUse ? { caption: captionToUse } : {}));
        }
        // shouldn't happen due to allSupported check
        return null;
    })
        .filter(Boolean);
    // Send as a group to each destination
    const sendPromises = env_config_1.DESTINATION_CHAT_IDS.map((destId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield entry.telegram.sendMediaGroup(destId, mediaArray);
        }
        catch (err) {
            console.error(`Failed to send media group to ${destId}`, err);
            // fallback: forward individually if sendMediaGroup fails
            try {
                yield Promise.all(msgs.map((m) => entry.telegram.forwardMessage(destId, m.chat.id, m.message_id)));
            }
            catch (err2) {
                console.error(`Fallback forwarding also failed for ${destId}`, err2);
            }
        }
    }));
    yield Promise.allSettled(sendPromises);
});
const message_event = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const msg = (_b = (_a = ctx.message) !== null && _a !== void 0 ? _a : ctx.channel_post) !== null && _b !== void 0 ? _b : ctx.channelPost;
    if (!msg)
        return;
    // detect original source when a message was forwarded
    const originalChatId = (_f = (_d = (_c = msg.forward_from_chat) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : (_e = msg.forward_from) === null || _e === void 0 ? void 0 : _e.id) !== null && _f !== void 0 ? _f : null;
    const originalChatTitle = (_h = (_g = msg.forward_from_chat) === null || _g === void 0 ? void 0 : _g.title) !== null && _h !== void 0 ? _h : null;
    if (originalChatId) {
        console.log("forwarded from chat title:", originalChatTitle);
    }
    if (originalChatId) {
        console.log("forwarded from chat id:", originalChatId);
        // optional: also log original message id and date
        console.log("forwarded from message id:", (_j = msg.forward_from_message_id) !== null && _j !== void 0 ? _j : "n/a");
        console.log("forwarded at (unix):", (_k = msg.forward_date) !== null && _k !== void 0 ? _k : "n/a");
    }
    const chatId = (_m = (_l = msg.chat) === null || _l === void 0 ? void 0 : _l.id) !== null && _m !== void 0 ? _m : (_o = ctx.chat) === null || _o === void 0 ? void 0 : _o.id;
    if (!chatId || !env_config_1.SOURCE_CHAT_IDS.includes(chatId))
        return;
    const mgid = msg.media_group_id;
    if (mgid) {
        const key = `${chatId}:${mgid}`;
        const existing = mediaGroupBuffer.get(key);
        if (existing) {
            clearTimeout(existing.timer);
            existing.msgs.push(msg);
            existing.timer = setTimeout(() => flushMediaGroup(key), MEDIA_GROUP_WAIT);
        }
        else {
            const timer = setTimeout(() => flushMediaGroup(key), MEDIA_GROUP_WAIT);
            mediaGroupBuffer.set(key, { msgs: [msg], timer, telegram: ctx.telegram });
        }
        return;
    }
    // non-album message: forward as before
    const messageId = msg.message_id;
    if (!messageId)
        return;
    const forwardPromises = env_config_1.DESTINATION_CHAT_IDS.map((destId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield ctx.telegram.forwardMessage(destId, chatId, messageId);
        }
        catch (error) {
            console.error(`Failed to forward to ${destId}`, error);
        }
    }));
    yield Promise.allSettled(forwardPromises);
});
exports.default = message_event;
