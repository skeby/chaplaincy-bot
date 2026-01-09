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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bottleneck_1 = __importDefault(require("bottleneck"));
const bot_1 = __importDefault(require("./bot"));
const rate_limit_handler_1 = require("./middlewares/handlers/rate-limit.handler");
const telegraf_throttler_1 = __importDefault(require("telegraf-throttler"));
const start_cmd_1 = __importDefault(require("./middlewares/commands/start.cmd"));
const message_event_1 = __importDefault(require("./middlewares/events/message.event"));
const bot_added_event_1 = __importDefault(require("./middlewares/events/bot-added.event"));
const env_config_1 = require("./config/env.config");
const filters_1 = require("telegraf/filters");
const database_1 = require("./database");
const migration_1 = require("./database/migration");
const inConfig = {
    highWater: 3, // Trigger strategy if throttler is not ready for a new job
    maxConcurrent: 1, // Only 1 job at a time
    minTime: 333, // Wait this many milliseconds to be ready, after a job
    strategy: bottleneck_1.default.strategy.LEAK, // Drop jobs if throttler is not ready
};
bot_1.default.use((0, telegraf_throttler_1.default)({
    in: inConfig,
}));
bot_1.default.use((0, rate_limit_handler_1.rateLimitHandler)());
bot_1.default.start(start_cmd_1.default);
bot_1.default.on((0, filters_1.message)(), message_event_1.default);
bot_1.default.on("channel_post", message_event_1.default);
bot_1.default.on("my_chat_member", bot_added_event_1.default);
console.log(env_config_1.NODE_ENV);
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.connectToDatabase)();
    yield (0, migration_1.migrateDestinationChats)();
    if (env_config_1.NODE_ENV === "production") {
        const app = (0, express_1.default)();
        bot_1.default
            .createWebhook({
            domain: env_config_1.WEBHOOK_DOMAIN,
            drop_pending_updates: false, // TODO: Change to true when launching bot for use in school, after that, change back to false
        })
            .then((middleware) => {
            app.use(middleware);
            app.use(express_1.default.json());
            app.get("/", (_, res) => {
                res.status(200).json({ status: "success", message: "Hello world" });
            });
            app.listen(env_config_1.WEBHOOK_PORT, () => {
                console.log(`Server is listening on port ${env_config_1.WEBHOOK_PORT}`);
            });
        })
            .catch((err) => console.error("An error occured while setting up the webhook:", err));
    }
    else {
        bot_1.default
            .launch({ dropPendingUpdates: false }, () => __awaiter(void 0, void 0, void 0, function* () {
            yield bot_1.default.telegram.sendMessage(env_config_1.DEV_CHAT_ID, `Listening...`);
        }))
            .catch((err) => console.error("An error occured while launching the bot:", err));
    }
}))();
// Enable graceful stop
process.once("SIGINT", () => bot_1.default.stop("SIGINT"));
process.once("SIGTERM", () => bot_1.default.stop("SIGTERM"));
