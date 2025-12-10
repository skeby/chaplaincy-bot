import { AppContext } from "../../context";
import { SOURCE_CHAT_IDS, DESTINATION_CHAT_IDS } from "../../config/env.config";

const message_event = async (ctx: AppContext) => {
  console.log("ctx: ", ctx);

  if (!ctx.chat || !SOURCE_CHAT_IDS.includes(ctx.chat.id)) {
    return;
  }

  const forwardPromises = DESTINATION_CHAT_IDS.map(async (destId) => {
    try {
      await ctx.telegram.forwardMessage(
        destId,
        ctx.chat.id,
        ctx.message.message_id
      );
    } catch (error) {
      console.error(`Failed to forward to ${destId}`, error);
    }
  });

  await Promise.allSettled(forwardPromises);
};

export default message_event;
