import { handleDiscordRequest } from "./discord.ts";
import { getFirstCell } from "./sheets.ts";


export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        switch (`${request.method} ${url.pathname}`) {
            case "GET /health": return new Response("OK");
            case "POST /discord": return handleDiscordRequest(request, env, ctx);
            default: {
                const value = await getFirstCell(env);
                return new Response(JSON.stringify(value), {status: 404});
            }
        }
    }
};
