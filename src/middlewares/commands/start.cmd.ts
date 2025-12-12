import { AppContext } from "../../context";

const start_cmd = async (ctx: AppContext) => {
  await ctx.reply("Active!");
  console.log("Chat ID:", ctx.chat?.id);
};

export default start_cmd;
