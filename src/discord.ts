import { InteractionResponseFlags, verifyKey } from "discord-interactions";
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


async function getAllRoles(env: Env): Promise<any[]> {
    const response = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/roles`, {
        headers: {
            "Authorization": `Bot ${env.DISCORD_TOKEN}`
        }
    });
    if (!response.ok) throw new Error(await response.text());
    return await response.json()
}


async function getRolePosition(roleID: string, env: Env): Promise<number> {
    if (env.DISCORD_GUILD_ID === "0") {return 0;}
    const roles = await getAllRoles(env);
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

                case "staff": {
                    const userID = interaction.data?.options[0].value;
                    try {
                        const runnerRoles = await getRoles(interaction.member.user.id, env);
                        const roles = await getRoles(userID, env);
                        if (!runnerRoles.includes(env.DISCORD_ROLE_STAFF)) {
                            return await slashCommandReply(`You don't even have the <@&${env.DISCORD_ROLE_STAFF}> role yourself >:P`, env, interaction);
                        } else if (roles.includes(env.DISCORD_ROLE_STAFF)) {
                            return await slashCommandReply(`<@${userID}> already has the <@&${env.DISCORD_ROLE_STAFF}> role :P`, env, interaction);
                        } else {
                            await giveRole(userID, env.DISCORD_ROLE_STAFF, env);
                            return await slashCommandReply(`Successfully gave <@${userID}> the <@&${env.DISCORD_ROLE_STAFF}> role!`, env, interaction);
                        }
                    } catch (err) {
                        return await slashCommandReply(`Error giving <@${userID}> the <@&${env.DISCORD_ROLE_STAFF}> role.`, env, interaction);
                    }
                }

                case "update": {
                    await handleDiscordUpdate(env, ctx);
                    return await slashCommandReply("Ran update. To make new club roles make sure they are marked as \"In The Discord\" in the Schools List Google sheet.", env, interaction);
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


export async function handleDiscordUpdate(env: Env, ctx: ExecutionContext) {
    if (env.DISCORD_ROLE_AUTO_BAN !== "0") {
        // ban all users with the "Auto Ban" role
        for (const user of await getUsersWithRole(env.DISCORD_ROLE_AUTO_BAN, env))
        {
            await banUser(user.user.id, env);
        }
    }

    if (env.DISCORD_CLUB_LIST_CHANNEL_ID !== "0") {
        ctx.waitUntil((async () => {
            try {
                var otherClubs = [];  // on prod: GOOGLE_SHEET_ROLES club names
                var clubs = [];
                var roles = [];

                // query Google Sheets
                const queryResult = (await sheetsGet("Main!A:G", env.GOOGLE_SHEET_ID, env)).slice(1);
                if (env.GOOGLE_SHEET_ROLES != null) {  // in production, a second google sheet is used to store role ids instead so that the School List sheet can be read only
                    const rolesQueryResult = (await sheetsGet("Main!A:G", env.GOOGLE_SHEET_ROLES, env)).slice(1);
                    otherClubs = rolesQueryResult.map(row => row[1]);
                    roles = rolesQueryResult.map(row => row[6]);
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
                    //if (roles[j]) text += ` <@&${roles[j]}>`;
                    text += ` ${row[1]}`;
                    if (row[2]) {text += ` - ${row[2]}`;}
                    text += "\n";
                    i++;
                }
                text += `**GAME DEV CLUB CLUB CLUB LIST - ${i - 1} clubs and counting B)**`;

                // add new Discord roles from Google Sheets
                if (env.DISCORD_GUILD_ID !== "0" && env.DISCORD_ROLE_POSITION_START !== "0" && env.DISCORD_ROLE_POSITION_END !== "0") {
                    var numReusedRoles = 0;
                    var passed: string[] = [];
                    for (const role of roles) {
                        if (env.GOOGLE_SHEET_ROLES != null) {
                            // this keeps the Role IDs in sync with the correct row numbers when clubs are moved or renamed
                            var otherClub = otherClubs[passed.length];
                            var newClub = clubs[passed.length];
                            if (otherClub != newClub && role != null) {
                                if (clubs.includes(otherClubs[passed.length])) {
                                    // swap rows
                                    const swapIndex = clubs.indexOf(otherClub);
                                    var otherRole = roles[passed.length];
                                    var newRole = roles[swapIndex];
                                    otherClubs[swapIndex] = otherClub;
                                    roles[swapIndex] = otherRole;
                                    otherClubs[passed.length] = newClub;
                                    roles[passed.length] = newRole;
                                    if (otherClub == null) {otherClub = "";}
                                    if (otherRole == null) {otherRole = "";}
                                    if (newClub == null) {newClub = "";}
                                    if (newRole == null) {newRole = "";}
                                    await sheetsSet(`Main!B${swapIndex + 2}:B${swapIndex + 2}`, env.GOOGLE_SHEET_ROLES, [[otherClub]], env);
                                    await sheetsSet(`Main!G${swapIndex + 2}:G${swapIndex + 2}`, env.GOOGLE_SHEET_ROLES, [[otherRole]], env);
                                    await sheetsSet(`Main!B${passed.length + 2}:B${passed.length + 2}`, env.GOOGLE_SHEET_ROLES, [[newClub]], env);
                                    await sheetsSet(`Main!G${passed.length + 2}:G${passed.length + 2}`, env.GOOGLE_SHEET_ROLES, [[newRole]], env);
                                } else {
                                    // rename row
                                    await sheetsSet(`Main!B${passed.length + 2}:B${passed.length + 2}`, env.GOOGLE_SHEET_ROLES, [[newClub]], env);
                                }
                            }
                        }

                        if (role != null && passed.includes(role)) {
                            numReusedRoles += 1;
                        }
                        passed.push(role);
                    }

                    var limit = 5
                    const roleSheet = env.GOOGLE_SHEET_ROLES != null ? env.GOOGLE_SHEET_ROLES : env.GOOGLE_SHEET_ID;
                    const position_start = (await getRolePosition(env.DISCORD_ROLE_POSITION_START, env)) + 1;
                    const position_end = (await getRolePosition(env.DISCORD_ROLE_POSITION_END, env)) - 1;
                    const discordRoles = await getAllRoles(env);
                    const discordClubRoles = discordRoles.filter(role => position_start <= role.position && role.position <= position_end)
                    for (var i = 0; i < clubs.length; i++) {
                        if (clubs[i] != null && roles[i] == null) {
                            const numClubs = clubs.filter(club => club != null).length;
                            if ((discordRoles.length > numClubs - numReusedRoles + 50) ||  // Error when attempting to create a role if there are more than 50 roles that aren't club roles (likely that club roles are being mistaken as not club roles)
                                (discordClubRoles.length >= numClubs - numReusedRoles)) {  // Error when attempting to create a role if it would make there be more club roles than clubs in the Schools List Google sheet marked as In The Discord (likely there is a duplicate role)
                                text += `\n*Unable to create role for ${clubs[i]} ;-;*`;
                                break;
                            }
                            const roleID = (await createRole(clubs[i], position_start, env));
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
