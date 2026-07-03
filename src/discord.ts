import { verifyKey } from "discord-interactions";
import { sheetsGet } from "./sheets.ts";


const MAX_MESSAGE_LENGTH = 2000;


async function verify(request: Request, env: Env): Promise<boolean> {
    const signature = request.headers.get("X-Signature-Ed25519");
    const timestamp = request.headers.get("X-Signature-Timestamp");
    if (!signature || !timestamp) return false;
    const body = await request.clone().text();
    return verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
}


async function slashCommandReply(message: string, env: Env, interaction: any, deferred: boolean = false): Promise<Response> {
    if (deferred)
    {
        // if deferred, make sure it's wrapped in a ctx.waitUntil((async () => {   })());
        return await fetch(`https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${interaction.token}`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({content: message, flags: 64})}
        );
    }
    else
    {
        return Response.json({type: 4, data: {content: message, flags: 64}});
    }
}


async function defferedReply(): Promise<Response>
{
    return Response.json({type: 5});
}


async function sendMessage(message: string, channelId: string, env: Env) {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        },
        body: JSON.stringify({content: message})
    });
    if (!response.ok) {
        throw new Error(await response.text());
    }
    return response.json();
}


async function editMessage(messageId: string, newMessage: string, channelId: string, env: Env) {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        },
        body: JSON.stringify({content: newMessage})
    });

    if (!response.ok) {
        throw new Error(await response.text());
    }

    return response.json();
}


export async function handleDiscordRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
        // This is for setting up Interactions Endpoint URL
        const isValid = await verify(request, env);
        if (!isValid) {
            return new Response("Invalid request signature", {status: 401});
        }
        const interaction = await request.json();
        if (interaction.type === 1) {
            return Response.json({type: 1});
        }



        // SLASH COMMANDS
        if (interaction.type === 2) {
            const name = interaction.data?.name;

            switch (name) {

                case "getfirstcell": {
                    await sendMessage("a", env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
                    return await slashCommandReply("testing", env, interaction);
                }

                default: {
                    return await slashCommandReply(`Unknown command: /${name}`, env, interaction);
                }

            }
        }



        return Response.json({type: 4, data: {content: "Unsupported interaction type."}});
    } catch (err) {
        return Response.json({type: 4, data: {content: "Bot error: " + String(err)}});
    }
}


export async function handleDiscordUpdate(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    if (env.DISCORD_CLUB_LIST_CHANNEL_ID != 0) {
        ctx.waitUntil((async () => {
            try {
                const queryResult = (await sheetsGet("Main!B1:C", env)).slice(1).filter(row => row[0]);
                const clubs = queryResult.map(row => row.filter(Boolean).join(" - ")).filter(Boolean);
                var text = clubs.map((club, i) => `${i + 1}. ${club}`).join("\n");
                var response = (await sendMessage(text.slice(0, MAX_MESSAGE_LENGTH), env.DISCORD_CLUB_LIST_CHANNEL_ID, env)).id;
            //    editMessage(response.id, "test", env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
            } catch (err) {
                await sendMessage(`Unable to fetch information from Google Sheets.\n${err}`, env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
            }
        })());
    }
}
