"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const env_config_1 = require("./config/env.config");
const bot = new telegraf_1.Telegraf(env_config_1.BOT_TOKEN);
exports.default = bot;
