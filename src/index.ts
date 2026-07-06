import { handleDiscordRequest, handleDiscordUpdate } from "./discord.ts";


export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        switch (`${request.method} ${url.pathname}`) {
            case "GET /health":
                return new Response("OK");
            case "POST /discord":
                return handleDiscordRequest(request, env, ctx);
            default:
                return new Response("NOT FOUND", {status: 404});
        }
    },
    async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
        ctx.waitUntil(handleDiscordUpdate(env, ctx));
    }
};
