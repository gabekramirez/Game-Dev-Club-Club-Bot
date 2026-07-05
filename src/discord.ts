import { verifyKey } from "discord-interactions";
import { sheetsGet, sheetsSet } from "./sheets.ts";


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
    return Response.json({type: 5, data: {flags: 64}});
}


async function getBotID(env: Env): Promise<string> {
    const response = await fetch("https://discord.com/api/v10/users/@me", {
        headers: {
            Authorization: `Bot ${env.DISCORD_TOKEN}`,
        }
    });
    if (!response.ok) {throw new Error(await response.text());}
    const bot = await response.json();
    return bot.id;
}


async function readMessages(count: number, channelID: string, env: Env): Promise<any[]> {
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


async function sendMessage(message: string, channelID: string, env: Env): Promise<any> {
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


async function editMessage(messageID: string, newMessage: string, channelID: string, env: Env): Promise<any> {
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


async function deleteMessage(messageID: string, channelID: string, env: Env) {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelID}/messages/${messageID}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        }
    });
    if (!response.ok) {throw new Error(await response.text());}
}


async function banUser(userID: string, env: Env): Promise<any> {
    const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/bans/${userID}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        }
    });
    if (!response.ok) {throw new Error(await response.text());}
    return response.json();
}


async function createRole(name: string, position: number, env: Env): Promise<any> {
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


async function getRolePosition(roleID: string, env: Env): Promise<number> {
    if (env.DISCORD_GUILD_ID === "0") {return 0;}
    const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/roles`, {
        headers: {
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        }
    });
    if (!response.ok) throw new Error(await response.text());
    const roles = await response.json() as any[];
    const role = roles.find(r => r.id === roleID);
    if (!role) throw new Error("Role not found");
    return role.position;
}


async function getUsersWithRole(roleID: string, env: Env): Promise<any[]> {
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


async function getRoles(userID: string, env: Env): Promise<string[]> {
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


async function giveRole(userID: string, roleID: string, env: Env): Promise<any> {
    if (env.DISCORD_GUILD_ID === "0") {return null;}
    const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/members/${userID}/roles/${roleID}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        }
    });
    if (!response.ok) {throw new Error(await response.text());}
}


async function removeRole(userID: string, roleID: string, env: Env): Promise<any> {
    if (env.DISCORD_GUILD_ID === "0") {return null;}
    const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/members/${userID}/roles/${roleID}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        }
    });
    if (!response.ok) {throw new Error(await response.text());}
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

                case "club": {
                    const roleID = interaction.data?.options[0].value;
                    ctx.waitUntil((async () => {
                        try {
                            if (env.DISCORD_ROLE_POSITION_START === "0") {throw new Error("Missing DISCORD_ROLE_POSITION_START");}
                            if (env.DISCORD_ROLE_POSITION_END === "0") {throw new Error("Missing DISCORD_ROLE_POSITION_END");}
                            const roleSheet = env.GOOGLE_SHEET_ROLES != null ? env.GOOGLE_SHEET_ROLES : env.GOOGLE_SHEET_ID; // in production, a second google sheet is used to store role ids instead so that the School List sheet can be read only
                            const clubRoles = (await sheetsGet("Main!G:G", roleSheet, env)).slice(1).map(row => row[0]);
                            if (roleID != null && clubRoles.includes(roleID) &&
                            (await getRolePosition(roleID, env)) < (await getRolePosition(env.DISCORD_ROLE_POSITION_END, env))) {
                                const oldRoles = (await getRoles(interaction.member.user.id, env)).filter(role => clubRoles.includes(role));
                                for (var role of oldRoles) {
                                    removeRole(interaction.member.user.id, role, env);
                                }
                                if (oldRoles.includes(roleID)) {
                                    await slashCommandReply(`You lost role <@&${roleID}> x_x`, env, interaction, true);
                                } else {
                                    await giveRole(interaction.member.user.id, roleID, env);
                                    await slashCommandReply(`Successfully obtained role <@&${roleID}> !`, env, interaction, true);
                                }
                            } else {
                                await slashCommandReply(`Nice try! <@&${roleID}> is not a valid club role.`, env, interaction, true);
                            }
                        } catch (err) {
                            await slashCommandReply(`Error giving role <@&${roleID}>. Please report to admin. O_O`, env, interaction, true);
                        }
                    })());
                    return await defferedReply();
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
    if (env.DISCORD_ROLE_AUTO_BAN !== "0") {
        // ban all users with the "Auto Ban" role
        for (const user of await getUsersWithRole(env.DISCORD_ROLE_AUTO_BAN, env))
        {
            console.log(user);
            await banUser(user.user.id, env);
        }
    }

    if (env.DISCORD_CLUB_LIST_CHANNEL_ID !== "0") {
        ctx.waitUntil((async () => {
            try {
                var clubs = [];
                var roles = [];

                // query Google Sheets
                const queryResult = (await sheetsGet("Main!A:G", env.GOOGLE_SHEET_ID, env)).slice(1);
                if (env.GOOGLE_SHEET_ROLES != null) {  // in production, a second google sheet is used to store role ids instead so that the School List sheet can be read only
                    roles = (await sheetsGet("Main!G:G", env.GOOGLE_SHEET_ROLES, env)).slice(1).map(row => row[0]);
                }

                // create club list channel text from query result and record club roles
                var text: string = "";
                var i = 1;
                var j = -1;
                for (const row of queryResult) {
                    j++;
                    if (!row?.[1] || row[5] != "In The Discord") {
                        clubs.push(null);
                        if (env.GOOGLE_SHEET_ROLES == null) {roles.push(null);}
                        continue;
                    };
                    clubs.push(row[1]);
                    if (env.GOOGLE_SHEET_ROLES == null) {roles.push(row[6]);}
                    text += `${i}.`;
                    if (roles[j]) text += ` <@&${roles[j]}>`;
                    text += ` ${row[1]}`;
                    if (row[2]) {text += ` - ${row[2]}`;}
                    text += "\n";
                    i++;
                }
                text += `**GAME DEV CLUB CLUB CLUB LIST - ${i - 1} clubs and counting B)**`;

                // add new Discord roles from Google Sheets
                var limit = 5
                const roleSheet = env.GOOGLE_SHEET_ROLES != null ? env.GOOGLE_SHEET_ROLES : env.GOOGLE_SHEET_ID;
                if (env.DISCORD_GUILD_ID !== "0" && env.DISCORD_ROLE_POSITION_START !== "0" && env.DISCORD_ROLE_POSITION_END !== "0") {
                    const position = (await getRolePosition(env.DISCORD_ROLE_POSITION_START, env)) + 1;
                    for (var i = 0; i < clubs.length; i++) {
                        if (clubs[i] != null && roles[i] == null) {
                            console.log(clubs[i]);
                            console.log(roles[i]);
                            const roleID = (await createRole(clubs[i], position, env));
                            await sheetsSet(`Main!G${i + 2}:G${i + 2}`, roleSheet, [[roleID.id]], env);
                            limit--;
                        }
                        if (limit === 0) {break;}
                    }
                }

                // split text into messages
                var messages: string[] = [];
                var start = 0;
                while (start < text.length) {
                    var end = Math.min(start + MAX_MESSAGE_LENGTH, text.length);
                    var i = text.lastIndexOf("\n", end);
                    if (i <= start) i = end;

                    messages.push(text.slice(start, i));
                    start = i + 1;
                }

                // send/edit/delete messages to club list channel
                var botID = await getBotID(env);
                var botMessages = [];
                const oldMessages = (await readMessages(messages.length * 2, env.DISCORD_CLUB_LIST_CHANNEL_ID, env)).reverse();
                for (const message of oldMessages) {
                    if (message.author.id === botID) {
                        botMessages.push(message);
                    }
                }
                var i = 0;
                for (; i < botMessages.length; i++) {
                    if (i >= messages.length) {
                        await deleteMessage(botMessages[i].id, env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
                    } else if (botMessages[i].content !== messages[i]) {
                        await editMessage(botMessages[i].id, messages[i], env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
                    }
                }
                for (; i < messages.length; i++) {
                    await sendMessage(messages[i], env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
                }
            } catch (err) {
                await sendMessage("Bot error: " + String(err), env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
            }
        })());
    }
}
