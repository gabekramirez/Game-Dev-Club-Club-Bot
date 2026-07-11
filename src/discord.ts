import { verifyKey } from "discord-interactions";


export const MAX_MESSAGE_LENGTH = 2000;


export async function verify(request: Request, env: Env): Promise<boolean> {
    const signature = request.headers.get("X-Signature-Ed25519");
    const timestamp = request.headers.get("X-Signature-Timestamp");
    if (!signature || !timestamp) return false;
    const body = await request.clone().text();
    return verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
}


export async function slashCommandReply(message: string, env: Env, interaction: any, deferred: boolean = false): Promise<Response> {
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


export async function defferedReply(): Promise<Response>
{
    return Response.json({type: 5, data: {flags: 64}});
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
        body: JSON.stringify({content: message})
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
        body: JSON.stringify({content: newMessage})
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


export async function getAllRoles(env: Env): Promise<any[]> {
    const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/roles`, {
        headers: {
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        }
    });
    if (!response.ok) throw new Error(await response.text());
    return await response.json()
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


export async function getRoles(userID: string, env: Env): Promise<string[]> {
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


export async function giveRole(userID: string, roleID: string, env: Env): Promise<any> {
    if (env.DISCORD_GUILD_ID === "0") {return null;}
    const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/members/${userID}/roles/${roleID}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        }
    });
    if (!response.ok) {throw new Error(await response.text());}
}


export async function removeRole(userID: string, roleID: string, env: Env): Promise<any> {
    if (env.DISCORD_GUILD_ID === "0") {return null;}
    const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/members/${userID}/roles/${roleID}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        }
    });
    if (!response.ok) {throw new Error(await response.text());}
}
