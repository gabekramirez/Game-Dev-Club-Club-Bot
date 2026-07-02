import { handleDiscordRequest } from "./discord.ts";


export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        switch (`${request.method} ${url.pathname}`) {
            case "GET /health": return new Response("OK");
            case "POST /discord": return handleDiscordRequest(request, env, ctx);
            default: {return new Response("NOT FOUND:" + JSON.stringify(env), {status: 404})}
        }
    }
};
