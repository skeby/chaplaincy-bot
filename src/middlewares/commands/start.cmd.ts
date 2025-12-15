import { AppContext } from "../../context";

const start_cmd = async (ctx: AppContext) => {
  await ctx.reply(
    "Hi there. This is the Covenant University Chaplaincy Bot that helps to disseminate information from the student chaplaincy channel."
  );
};

export default start_cmd;
