import express from "express";
import Bottleneck from "bottleneck";
import bot from "./bot";
import { rateLimitHandler } from "./middlewares/handlers/rate-limit.handler";
import telegrafThrottler from "telegraf-throttler";
import start_cmd from "./middlewares/commands/start.cmd";
import message_event from "./middlewares/events/message.event";
import bot_added_event from "./middlewares/events/bot-added.event";
import {
  NODE_ENV,
  WEBHOOK_DOMAIN,
  WEBHOOK_PORT,
  DEV_CHAT_ID,
} from "./config/env.config";
import { message } from "telegraf/filters";

const inConfig = {
  highWater: 3, // Trigger strategy if throttler is not ready for a new job
  maxConcurrent: 1, // Only 1 job at a time
  minTime: 333, // Wait this many milliseconds to be ready, after a job
  strategy: Bottleneck.strategy.LEAK, // Drop jobs if throttler is not ready
};

bot.use(
  telegrafThrottler({
    in: inConfig,
  })
);
bot.use(rateLimitHandler());

bot.start(start_cmd);
bot.on(message(), message_event);
bot.on("channel_post", message_event);
bot.on("my_chat_member", bot_added_event);


console.log(NODE_ENV);

if (NODE_ENV === "production") {
  const app = express();

  bot
    .createWebhook({
      domain: WEBHOOK_DOMAIN as string,
      drop_pending_updates: false, // TODO: Change to true when launching bot for use in school, after that, change back to false
    })
    .then((middleware) => {
      app.use(middleware);

      app.use(express.json());

      app.get("/", (_, res) => {
        res.status(200).json({ status: "success", message: "Hello world" });
      });

      app.listen(WEBHOOK_PORT, () => {
        console.log(`Server is listening on port ${WEBHOOK_PORT}`);
      });
    })
    .catch((err) =>
      console.error("An error occured while setting up the webhook:", err)
    );
} else {
  bot
    .launch({ dropPendingUpdates: false }, async () => {
      await bot.telegram.sendMessage(DEV_CHAT_ID, `Listening...`);
    })
    .catch((err) =>
      console.error("An error occured while launching the bot:", err)
    );
}

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
