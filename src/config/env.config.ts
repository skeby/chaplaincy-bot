import dotenv from "dotenv";

dotenv.config();

export const BOT_TOKEN = process.env.BOT_TOKEN as string;
export const DEV_CHAT_ID = Number(process.env.DEV_CHAT_ID as string);
export const WEBHOOK_DOMAIN = process.env.WEBHOOK_DOMAIN as string;
export const WEBHOOK_PORT = Number(process.env.WEBHOOK_PORT);
export const NODE_ENV = process.env.NODE_ENV as string;
export const SOURCE_CHAT_IDS =
  (process.env.SOURCE_CHAT_IDS as string)
    ?.split(",")
    ?.map((id) => Number(id.trim()) || null)
    ?.filter((id) => Number.isInteger(id)) || [];

export const MONGODB_URI = process.env.MONGODB_URI as string;
export const DESTINATION_CHAT_IDS =
  (process.env.DESTINATION_CHAT_IDS as string)
    ?.split(",")
    ?.map((id) => Number(id.trim()) || null)
    ?.filter((id) => Number.isInteger(id)) || [];
