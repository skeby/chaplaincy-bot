import { Context } from "telegraf";

export interface AppContext extends Context {
  payload?: string;
}
