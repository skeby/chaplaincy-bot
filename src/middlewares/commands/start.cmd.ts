import { AppContext } from "../../context";

const start_cmd = async (ctx: AppContext) => {
  await ctx.reply("Active!");
};

export default start_cmd;
