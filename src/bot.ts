import { Telegraf } from "telegraf";
import { AppContext } from "./context";
import { BOT_TOKEN } from "./config/env.config";

const bot = new Telegraf<AppContext>(BOT_TOKEN as string);

export default bot;
