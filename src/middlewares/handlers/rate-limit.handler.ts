import Bottleneck from "bottleneck";
import { Context, Middleware } from "telegraf";

export const rateLimitHandler = (): Middleware<Context> => {
  const queue = new Bottleneck({
    maxConcurrent: 1, // Ensure only one request is sent at a time
    minTime: 1000 / 30, // Minimum delay between requests (30 requests per second)
  });

  const middleware: Middleware<Context> = async (ctx, next) => {
    const oldCallApi = ctx.telegram.callApi.bind(ctx.telegram);

    const newCallApi: typeof ctx.telegram.callApi = async function newCallApi(
      this: typeof ctx.telegram,
      method,
      payload,
      options = {}
    ) {
      const maxRetries = 5;
      let retryCount = 0;

      return queue.schedule(async () => {
        while (retryCount < maxRetries) {
          try {
            return await oldCallApi(method, payload, options);
          } catch (error) {
            if (error?.response?.error_code === 429) {
              const retryAfter = error.response.parameters?.retry_after || 1;
              await new Promise((resolve) => {
                console.warn(
                  `Rate limited on ${method}, retrying after ${retryAfter} seconds...`
                );
                setTimeout(resolve, retryAfter * 1000);
              });
              console.log("Retrying...");
              retryCount++;
            } else {
              throw error;
            }
          }
        }
        throw new Error(`Max retries reached for method: ${method}`);
      });
    };

    ctx.telegram.callApi = newCallApi.bind(ctx.telegram);
    await next();
  };

  return middleware;
};
