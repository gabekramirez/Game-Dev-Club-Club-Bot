import { verifyKey } from "discord-interactions";


export const MAX_MESSAGE_LENGTH = 2000;
export enum Flags {
    CROSSPOSTED = 1 << 0,
    IS_CROSSPOST = 1 << 1,
    SUPPRESS_EMBEDS = 1 << 2,
    SOURCE_MESSAGE_DELETED = 1 << 3,
    URGENT = 1 << 4,
    HAS_THREAD = 1 << 5,
    EPHEMERAL = 1 << 6,
    LOADING = 1 << 7,
    FAILED_TO_MENTION_SOME_ROLES_IN_THREAD = 1 << 8,
    SUPPRESS_NOTIFICATIONS = 1 << 12,
    IS_VOICE_MESSAGE = 1 << 13,
    HAS_SNAPSHOT = 1 << 14,
    IS_COMPONENTS_V2 = 1 << 15,
}


export async function verify(request: Request, env: Env): Promise<Response | any> {
    const signature = request.headers.get("X-Signature-Ed25519");
    const timestamp = request.headers.get("X-Signature-Timestamp");
    var isValid;
    if (!signature || !timestamp) {
        isValid = false;
    } else {
        const body = await request.clone().text();
        isValid = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
    }
    if (!isValid) {
        return new Response("Invalid request signature", {status: 401});
    }
    const interaction = await request.json();
    if (interaction.type === 1) {
        return Response.json({type: 1});
    }
    return interaction;
}


export async function slashCommandReply(message: string, env: Env, interaction: any = null, deferred: boolean = false): Promise<Response> {
    if (deferred)
    {
        // if deferred, make sure it's wrapped in a ctx.waitUntil((async () => {   })());
        return await fetch(`https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${interaction.token}`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({content: message, flags: Flags.EPHEMERAL})}
        );
    }
    else
    {
        return Response.json({type: 4, data: {content: message, flags: Flags.EPHEMERAL}});
    }
}


export async function modal(modalID: string, title: string, components: Array<any>): Promise<Response> {
    return Response.json({type: 9, data: {custom_id: modalID, title: title, components: components}});
}


export async function ephemeralMessage(components: Array<any>): Promise<Response> {
    return Response.json({type: 4, data: {flags: Flags.EPHEMERAL | Flags.IS_COMPONENTS_V2, components: components}});
}


export async function defferedReply(): Promise<Response>
{
    return Response.json({type: 5, data: {flags: Flags.EPHEMERAL}});
}


export async function getBotID(env: Env): Promise<string> {
    const response = await fetch("https://discord.com/api/v10/users/@me", {
        headers: {
            Authorization: `Bot ${env.DISCORD_TOKEN}`,
        }
    });
    if (!response.ok) {throw new Error(await response.text());}
    const bot = await response.json();
    return bot.id;
}


export async function readMessages(count: number, channelID: string, env: Env): Promise<any[]> {
    if (!Number.isInteger(count)) {throw new Error("count must be an integer");}
    const response = await fetch(`https://discord.com/api/v10/channels/${channelID}/messages?limit=${count}`, {
        method: "GET",
        headers: {
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        }
    });
    if (!response.ok) {throw new Error(await response.text());}
    const messages = await response.json();
    return messages.length > 0 ? messages : [];
}


export async function sendMessage(message: string, channelID: string, env: Env): Promise<any> {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelID}/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        },
        body: JSON.stringify({content: message, flags: Flags.SUPPRESS_EMBEDS})
    });
    if (!response.ok) {throw new Error(await response.text());}
    return response.json();
}


export async function editMessage(messageID: string, newMessage: string, channelID: string, env: Env): Promise<any> {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelID}/messages/${messageID}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        },
        body: JSON.stringify({content: newMessage, flags: Flags.SUPPRESS_EMBEDS})
    });
    if (!response.ok) {throw new Error(await response.text());}
    return response.json();
}


export async function deleteMessage(messageID: string, channelID: string, env: Env) {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelID}/messages/${messageID}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        }
    });
    if (!response.ok) {throw new Error(await response.text());}
}


export async function getUsername(userID: string, env: Env): Promise<string> {
    if (env.DISCORD_GUILD_ID === "0") return "";
    const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/members/${userID}`, {
        method: "GET",
        headers: {
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        }
    });
    if (!response.ok) {throw new Error(await response.text());}
    return (await response.json()).user.username;
}


export async function banUser(userID: string, env: Env): Promise<any> {
    const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/bans/${userID}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        }
    });
    if (!response.ok) {throw new Error(await response.text());}
    return response.json();
}


export async function createRole(name: string, position: number, env: Env): Promise<any> {
    if (env.DISCORD_GUILD_ID === "0") {return null;}
    const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/roles`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        },
        body: JSON.stringify({name: name})
    });
    if (!response.ok) {throw new Error(await response.text());}
    var responseJson = await response.json();
    await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/roles`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        },
        body: JSON.stringify([{id: responseJson.id, position: position}])
    });
    return responseJson;
}


export async function editRole(roleID: string, name: string | null, color: number | null, env: Env) {
    const body: any = {};
    if (name !== null) body.name = name;
    if (color !== null) body.color = color;
    const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/roles/${roleID}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bot ${env.DISCORD_TOKEN}`
            },
            body: JSON.stringify(body)
        }
    );
    if (!response.ok) {throw new Error(await response.text());}
    return await response.json();
}


export async function deleteRole(roleID: string, env: Env): Promise<Response> {
    const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/roles/${roleID}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bot ${env.DISCORD_TOKEN}`
            }
        }
    );
    if (!response.ok) {throw new Error(await response.text());}
    return response;
}


export async function getAllRoles(env: Env): Promise<any[]> {
    const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/roles`, {
        headers: {
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        }
    });
    if (!response.ok) throw new Error(await response.text());
    return await response.json()
}


export async function getRole(roleID: string, env: Env): Promise<any | null> {
    if (env.DISCORD_GUILD_ID === "0") {return null;}
    const roles = await getAllRoles(env);
    const role = roles.find(r => r.id === roleID);
    if (!role) {return null;}
    return role;
}


export async function getRolePosition(roleID: string, env: Env): Promise<number> {
    if (env.DISCORD_GUILD_ID === "0") {return 0;}
    const roles = await getAllRoles(env);
    const role = roles.find(r => r.id === roleID);
    if (!role) throw new Error("Role not found");
    return role.position;
}


export async function getUsersWithRole(roleID: string, env: Env): Promise<any[]> {
    let members = [];
    let after = "0";

    while (true) {
        const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/members?limit=1000&after=${after}`, {
            headers: {
                Authorization: `Bot ${env.DISCORD_TOKEN}`,
            }
        });
        if (!response.ok) {throw new Error(await response.text());}

        const pageMembers = await response.json();
        if (!pageMembers.length) break;
        members.push(...pageMembers);
        after = pageMembers[pageMembers.length - 1].user.id;
    }
    return members.filter(member => member.roles.includes(roleID));
}


export async function getUserRoles(userID: string, env: Env): Promise<string[]> {
    if (env.DISCORD_GUILD_ID === "0") return [];
    const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/members/${userID}`, {
        method: "GET",
        headers: {
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        }
    });
    if (!response.ok) {throw new Error(await response.text());}
    return (await response.json()).roles;
}


export async function giveUserRole(userID: string, roleID: string, env: Env): Promise<any> {
    if (env.DISCORD_GUILD_ID === "0") {return null;}
    const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/members/${userID}/roles/${roleID}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        }
    });
    if (!response.ok) {throw new Error(await response.text());}
}


export async function removeUserRole(userID: string, roleID: string, env: Env): Promise<any> {
    if (env.DISCORD_GUILD_ID === "0") {return null;}
    const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/members/${userID}/roles/${roleID}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        }
    });
    if (!response.ok) {throw new Error(await response.text());}
}
