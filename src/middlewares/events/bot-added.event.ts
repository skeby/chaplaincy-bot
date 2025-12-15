import { AppContext } from "../../context";

const bot_added_event = async (ctx: AppContext) => {
  // Telegraf provides membership updates under `my_chat_member` (or `chat_member` in some updates)
  const update = (ctx as any).update ?? {};
  const memberUpdate =
    update.my_chat_member ??
    update.chat_member ??
    (ctx as any).my_chat_member ??
    (ctx as any).chat_member;
  if (!memberUpdate) return;

  const newMember =
    memberUpdate.new_chat_member ?? memberUpdate.new_member ?? null;
  if (!newMember) return;

  // Only care when the update is about a bot (i.e., the bot itself)
  if (!newMember.user?.is_bot) return;

  // We're interested when the bot becomes a member or administrator (i.e., it was added)
  const status = newMember.status;
  if (status !== "member" && status !== "administrator") return;

  const chatId = memberUpdate.chat?.id ?? ctx.chat?.id;
  const chatTitle = memberUpdate.chat?.title ?? null;

  console.log("Bot added to chat id:", chatId);
  if (chatTitle) console.log("Chat title:", chatTitle);
};

export default bot_added_event;
