import { AppContext } from "../../context";
import { SOURCE_CHAT_IDS, DESTINATION_CHAT_IDS } from "../../config/env.config";

type BufferEntry = {
  msgs: any[];
  timer: NodeJS.Timeout;
  telegram: any;
};

const MEDIA_GROUP_WAIT = 700; // ms to collect album parts
const mediaGroupBuffer = new Map<string, BufferEntry>();

const flushMediaGroup = async (key: string) => {
  const entry = mediaGroupBuffer.get(key);
  if (!entry) return;
  mediaGroupBuffer.delete(key);

  const msgs = entry.msgs.sort((a, b) => a.message_id - b.message_id);
  // Check if all are photos/videos (sendMediaGroup supports only photo/video)
  const allSupported = msgs.every(
    (m) => (m.photo && m.photo.length > 0) || m.video
  );

  if (!allSupported) {
    // fallback: forward each part individually
    const forwardPromises = DESTINATION_CHAT_IDS.flatMap((destId) =>
      msgs.map(async (m) => {
        try {
          await entry.telegram.forwardMessage(destId, m.chat.id, m.message_id);
        } catch (err) {
          console.error(`Failed to forward media part to ${destId}`, err);
        }
      })
    );
    await Promise.allSettled(forwardPromises);
    return;
  }

  // build InputMedia array
  // pick caption from the first message that has one
  const firstCaptionMsg = msgs.find((m) => m.caption);
  const captionToUse = firstCaptionMsg?.caption;

  const mediaArray = msgs
    .map((m, idx) => {
      if (m.photo && m.photo.length > 0) {
        const best = m.photo[m.photo.length - 1];
        return {
          type: "photo",
          media: best.file_id,
          // Only one item in the group may have caption; attach it to the first item
          ...(idx === 0 && captionToUse ? { caption: captionToUse } : {}),
        };
      } else if (m.video) {
        return {
          type: "video",
          media: m.video.file_id,
          ...(idx === 0 && captionToUse ? { caption: captionToUse } : {}),
        };
      }
      // shouldn't happen due to allSupported check
      return null;
    })
    .filter(Boolean) as Array<any>;

  // Send as a group to each destination
  const sendPromises = DESTINATION_CHAT_IDS.map(async (destId) => {
    try {
      await entry.telegram.sendMediaGroup(destId, mediaArray);
    } catch (err) {
      console.error(`Failed to send media group to ${destId}`, err);
      // fallback: forward individually if sendMediaGroup fails
      try {
        await Promise.all(
          msgs.map((m) =>
            entry.telegram.forwardMessage(destId, m.chat.id, m.message_id)
          )
        );
      } catch (err2) {
        console.error(`Fallback forwarding also failed for ${destId}`, err2);
      }
    }
  });

  await Promise.allSettled(sendPromises);
};

const message_event = async (ctx: AppContext) => {
  const msg =
    (ctx as any).message ??
    (ctx as any).channel_post ??
    (ctx as any).channelPost;
  if (!msg) return;

  // detect original source when a message was forwarded
  const originalChatId =
    msg?.forward_from_chat?.id ?? // origin was a channel/group
    msg?.forward_from?.id ?? // origin was a private user (user id == private chat id)
    null;
  const originalChatTitle = msg?.forward_from_chat?.title ?? null;

  if (originalChatId) {
    console.log("forwarded from chat title:", originalChatTitle);
  }

  if (originalChatId) {
    console.log("forwarded from chat id:", originalChatId);
    // optional: also log original message id and date
    console.log(
      "forwarded from message id:",
      msg.forward_from_message_id ?? "n/a"
    );
    console.log("forwarded at (unix):", msg.forward_date ?? "n/a");
  }

  const chatId = msg.chat?.id ?? ctx.chat?.id;
  if (!chatId || !SOURCE_CHAT_IDS.includes(chatId)) return;

  const mgid = msg.media_group_id;
  if (mgid) {
    const key = `${chatId}:${mgid}`;
    const existing = mediaGroupBuffer.get(key);
    if (existing) {
      clearTimeout(existing.timer);
      existing.msgs.push(msg);
      existing.timer = setTimeout(() => flushMediaGroup(key), MEDIA_GROUP_WAIT);
    } else {
      const timer = setTimeout(() => flushMediaGroup(key), MEDIA_GROUP_WAIT);
      mediaGroupBuffer.set(key, { msgs: [msg], timer, telegram: ctx.telegram });
    }
    return;
  }

  // non-album message: forward as before
  const messageId = msg.message_id;
  if (!messageId) return;

  const forwardPromises = DESTINATION_CHAT_IDS.map(async (destId) => {
    try {
      await ctx.telegram.forwardMessage(destId, chatId, messageId);
    } catch (error) {
      console.error(`Failed to forward to ${destId}`, error);
    }
  });

  await Promise.allSettled(forwardPromises);
};

export default message_event;
