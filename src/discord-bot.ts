import * as discord from "./discord.ts";
import { sheetsGet, sheetsSet } from "./sheets.ts";


export async function handleDiscordRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
        // This is for setting up Interactions Endpoint URL
        const isValid = await discord.verify(request, env);
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
                            const clubRoles = (await sheetsGet("Main!G:G", env.GOOGLE_SHEET_ID, env)).slice(1).map(row => row[0]);
                            if (roleID != null && clubRoles.includes(roleID) &&
                            (await discord.getRolePosition(roleID, env)) < (await discord.getRolePosition(env.DISCORD_ROLE_POSITION_END, env))) {
                                const oldRoles = (await discord.getRoles(interaction.member.user.id, env)).filter(role => clubRoles.includes(role));
                                for (var role of oldRoles) {
                                    discord.removeRole(interaction.member.user.id, role, env);
                                }
                                if (oldRoles.includes(roleID)) {
                                    await discord.slashCommandReply(`You lost role <@&${roleID}> x_x`, env, interaction, true);
                                } else {
                                    await discord.giveRole(interaction.member.user.id, roleID, env);
                                    await discord.slashCommandReply(`Successfully obtained role <@&${roleID}> !`, env, interaction, true);
                                }
                            } else {
                                await discord.slashCommandReply(`Nice try! <@&${roleID}> is not a valid club role.`, env, interaction, true);
                            }
                        } catch (err) {
                            await discord.slashCommandReply(`Error giving role <@&${roleID}>. Please report to admin. O_O`, env, interaction, true);
                        }
                    })());
                    return await discord.defferedReply();
                }

                case "staff": {
                    const userID = interaction.data?.options[0].value;
                    try {
                        const runnerRoles = await discord.getRoles(interaction.member.user.id, env);
                        const roles = await discord.getRoles(userID, env);
                        if (!runnerRoles.includes(env.DISCORD_ROLE_STAFF)) {
                            return await discord.slashCommandReply(`You don't even have the <@&${env.DISCORD_ROLE_STAFF}> role yourself >:P`, env, interaction);
                        } else if (roles.includes(env.DISCORD_ROLE_STAFF)) {
                            return await discord.slashCommandReply(`<@${userID}> already has the <@&${env.DISCORD_ROLE_STAFF}> role :P`, env, interaction);
                        } else {
                            await discord.giveRole(userID, env.DISCORD_ROLE_STAFF, env);
                            return await discord.slashCommandReply(`Successfully gave <@${userID}> the <@&${env.DISCORD_ROLE_STAFF}> role!`, env, interaction);
                        }
                    } catch (err) {
                        return await discord.slashCommandReply(`Error giving <@${userID}> the <@&${env.DISCORD_ROLE_STAFF}> role.`, env, interaction);
                    }
                }

                case "update": {
                    await handleDiscordUpdate(env, ctx);
                    return await discord.slashCommandReply("Ran update. To make new club roles make sure they are marked as \"In The Discord\" in the Schools List Google sheet.", env, interaction);
                }

                default: {
                    return await discord.slashCommandReply(`Unknown command: /${name}`, env, interaction);
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
        for (const user of await discord.getUsersWithRole(env.DISCORD_ROLE_AUTO_BAN, env))
        {
            await discord.banUser(user.user.id, env);
        }
    }

    if (env.DISCORD_CLUB_LIST_CHANNEL_ID !== "0") {
        ctx.waitUntil((async () => {
            try {
                var clubs = [];
                var roles = [];

                // query Google Sheets
                const queryResult = (await sheetsGet("Main!A:G", env.GOOGLE_SHEET_ID, env)).slice(1);

                // create club list channel text from query result and record club roles
                var text: string = "";
                var i = 1;
                var j = -1;
                for (const row of queryResult) {
                    j++;
                    if (!row?.[1] || row[5] != "In The Discord") {
                        clubs.push(null);
                        roles.push(null);
                        continue;
                    };
                    clubs.push(row[1]);
                    roles.push(row[6]);
                    text += `${i}.`;
                    if (roles[j]) text += ` <@&${roles[j]}>`;
                    text += ` ${row[1]}`;
                    if (row[2]) {text += ` - ${row[2]}`;}
                    text += "\n";
                    i++;
                }
                text += `\n**GAME DEV CLUB CLUB CLUB LIST - ${i - 1} clubs and counting B)**\n\n**Use /club to get your club's role!**`;

                // add new Discord roles from Google Sheets
                if (env.DISCORD_GUILD_ID !== "0" && env.DISCORD_ROLE_POSITION_START !== "0" && env.DISCORD_ROLE_POSITION_END !== "0") {
                    var numReusedRoles = 0;
                    var passed: string[] = [];
                    for (const role of roles) {
                        if (role != null && passed.includes(role)) {
                            numReusedRoles += 1;
                        }
                        passed.push(role);
                    }

                    var limit = 5
                    const position_start = (await discord.getRolePosition(env.DISCORD_ROLE_POSITION_START, env)) + 1;
                    const position_end = (await discord.getRolePosition(env.DISCORD_ROLE_POSITION_END, env)) - 1;
                    const discordRoles = await discord.getAllRoles(env);
                    const discordClubRoles = discordRoles.filter(role => position_start <= role.position && role.position <= position_end)
                    for (var i = 0; i < clubs.length; i++) {
                        if (clubs[i] != null && roles[i] == null) {
                            const numClubs = clubs.filter(club => club != null).length;
                            if ((discordRoles.length > numClubs - numReusedRoles + 50) ||  // Error when attempting to create a role if there are more than 50 roles that aren't club roles (likely that club roles are being mistaken as not club roles)
                                (discordClubRoles.length >= numClubs - numReusedRoles)) {  // Error when attempting to create a role if it would make there be more club roles than clubs in the Schools List Google sheet marked as In The Discord (likely there is a duplicate role)
                                text += `\n*Unable to create role for ${clubs[i]} ;-;*`;
                                break;
                            }
                            const roleID = (await discord.createRole(clubs[i], position_start, env));
                            await sheetsSet(`Main!G${i + 2}:G${i + 2}`, env.GOOGLE_SHEET_ID, [[roleID.id]], env);
                            limit--;
                        }
                        if (limit === 0) {break;}
                    }
                }

                // split text into messages
                var messages: string[] = [];
                var start = 0;
                while (start < text.length) {
                    var end = Math.min(start + discord.MAX_MESSAGE_LENGTH, text.length);
                    var i = text.lastIndexOf("\n", end);
                    if (i <= start) i = end;

                    messages.push(text.slice(start, i));
                    start = i + 1;
                }

                // send/edit/delete messages to club list channel
                var botID = await discord.getBotID(env);
                var botMessages = [];
                const oldMessages = (await discord.readMessages(messages.length * 2, env.DISCORD_CLUB_LIST_CHANNEL_ID, env)).reverse();
                for (const message of oldMessages) {
                    if (message.author.id === botID) {
                        botMessages.push(message);
                    }
                }
                var i = 0;
                for (; i < botMessages.length; i++) {
                    if (i >= messages.length) {
                        await discord.deleteMessage(botMessages[i].id, env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
                    } else if (botMessages[i].content !== messages[i]) {
                        await discord.editMessage(botMessages[i].id, messages[i], env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
                    }
                }
                for (; i < messages.length; i++) {
                    await discord.sendMessage(messages[i], env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
                }
            } catch (err) {
                await discord.sendMessage("Bot error: " + String(err), env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
            }
        })());
    }
}
