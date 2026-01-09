import { AppContext } from "../../context";
import { ChatModel } from "../../database/models/chat.model";

const bot_added_event = async (ctx: AppContext) => {
  // Telegraf provides membership updates under `my_chat_member`
  const update = (ctx as any).update ?? {};
  const memberUpdate = update.my_chat_member ?? (ctx as any).my_chat_member;

  if (!memberUpdate) return;

  const newMember = memberUpdate.new_chat_member;
  if (!newMember) return;

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
  const chatId = memberUpdate.chat?.id;
  const chatTitle = memberUpdate.chat?.title;
  const chatType = memberUpdate.chat?.type;

  if (!chatId) return;

  console.log(`Bot membership update in chat ${chatId}: ${status}`);

  try {
    if (status === "member" || status === "administrator" || status === "restricted") {
      await ChatModel.updateOne(
        { chatId },
        {
          $set: {
            chatId,
            title: chatTitle,
            type: chatType,
            isMember: true,
          },
        },
        { upsert: true }
      );
      console.log(`Updated chat ${chatId} status to MEMBER`);
    } else if (status === "left" || status === "kicked") {
      await ChatModel.updateOne(
        { chatId },
        {
          $set: {
            isMember: false,
          },
        }
      );
      console.log(`Updated chat ${chatId} status to NOT MEMBER`);
    }
  } catch (err) {
    console.error(`Failed to update DB for chat ${chatId}`, err);
  }
};

export default bot_added_event;
