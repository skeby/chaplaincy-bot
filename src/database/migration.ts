import { DESTINATION_CHAT_IDS } from "../config/env.config";
import { ChatModel } from "./models/chat.model";
import bot from "../bot";

export const migrateDestinationChats = async () => {
  console.log("Starting migration of DESTINATION_CHAT_IDS...");

  for (const chatId of DESTINATION_CHAT_IDS) {
    if (!chatId) continue;

    try {
      // Check if already exists to avoid unnecessary API calls,
      // but if we want to ensure data consistency we might want to refresh info.
      // The requirement says "Add the existing DESTINATION_CHAT_IDS to the new dynamic list initially".
      // We will try to fetch info from Telegram to ensure valid type/title.

      const exists = await ChatModel.findOne({ chatId });
      if (exists) {
        console.log(`Chat ${chatId} already in DB. Skipping.`);
        continue;
      }

      console.log(`Fetching info for chat ${chatId}...`);
      const chatInfo = await bot.telegram.getChat(chatId);

      await ChatModel.updateOne(
        { chatId },
        {
          $set: {
            chatId,
            title: (chatInfo as any).title,
            type: chatInfo.type,
            isMember: true, // Assuming member if we can fetch it, or at least we want to try
          },
        },
        { upsert: true }
      );
      console.log(`Migrated chat ${chatId} (${chatInfo.type})`);
    } catch (error) {
      console.error(`Failed to migrate chat ${chatId}:`, error);
      // If we fail to get chat, it might be because the bot is not a member or kicked.
      // We can choose to insert it as isMember: false, or just skip.
      // Skipping is safer to avoid errors during forwarding.
    }
  }

  console.log("Migration complete.");
};
