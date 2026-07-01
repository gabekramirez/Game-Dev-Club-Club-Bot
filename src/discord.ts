import { verifyKey } from "discord-interactions";
import { getFirstCell } from "./sheets.ts";


async function verify(request: Request, env: Env): Promise<boolean> {
    const signature = request.headers.get("X-Signature-Ed25519");
    const timestamp = request.headers.get("X-Signature-Timestamp");
    if (!signature || !timestamp) return false;
    const body = await request.clone().text();
    return verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
}


async function sendMessage(message: string, env: Env, interaction: any) {
    return await fetch(`https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${interaction.token}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({content: message})}
    );
}


export async function handleDiscordRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
        // This is for setting up Interactions Endpoint URL
        const isValid = await verify(request, env);
        if (!isValid) {
            return new Response("Invalid request signature", { status: 401 });
        }
        const interaction = await request.json();
        if (interaction.type === 1) {
            return Response.json({ type: 1 });
        }



        // SLASH COMMANDS
        if (interaction.type === 2) {
            const name = interaction.data?.name;

            switch (name) {

                case "getfirstcell": {
                    ctx.waitUntil((async () => {
                        try {
                            const value = await getFirstCell(env);
                            await sendMessage(value, env, interaction);
                        } catch (err) {
                            await sendMessage("Unable to fetch information from Google Sheets.", env, interaction);
                        }
                    })());
                    return Response.json({type: 5});
                }

                default: {
                    return Response.json({type: 5, data: {content: `Unknown command: /${name}`}});
                }

            }
        }



        return Response.json({type: 5, data: {content: "Unsupported interaction type."}});
    } catch (err) {
        return Response.json({type: 5, data: {content: "Bot error: " + String(err)}});
    }
}
