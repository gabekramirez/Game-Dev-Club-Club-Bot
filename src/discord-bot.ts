import * as discord from "./discord.ts";
import * as sheets from "./sheets.ts";


async function getClublistModal(session: any[], index: number, env: Env): Promise<any> {
    const roleID = session[7];
    const role = await discord.getRole(roleID, env);
    const color = "#" + role.color.toString(16).padStart(6, "0");
    const school = session[2] ? session[2] : "";
    const club = session[3] ? session[3] : "";
    const acronym = session[8] ? session[8] : "";
    const clubLink = session[4] ? session[4] : "";
    const mainContact = session[5] ? session[5] : "";
    return [[
        {
            type: 18, // Label
            label: "Role Name",
            description: "Name of school role",
            component: {
                type: 4, // Text Input
                custom_id: "role_name",
                style: 1, // Short
                value: role.name
            }
        },
        {
            type: 18, // Label
            label: "Role Color",
            description: "Hex color of school role",
            component: {
                type: 4, // Text Input
                custom_id: "role_color",
                style: 1, // Short
                value: color,
                required: false
            }
        },
        {
            type: 18, // Label
            label: "School",
            description: "School this club belongs to",
            component: {
                type: 4, // Text Input
                custom_id: "school",
                style: 1, // Short
                value: school
            }
        },
        {
            type: 18, // Label
            label: "Club Name",
            description: "Name of this club",
            component: {
                type: 4, // Text Input
                custom_id: "club_name",
                style: 1,
                value: club,
                required: false
            }
        },
        {
            type: 18, // Label
            label: "Acronym",
            description: "School acronym to put on members' usernames",
            component: {
                type: 4,
                custom_id: "acronym",
                style: 1,
                value: acronym,
                required: false
            }
        }
    ], [
        {
            type: 18, // Label
            label: "Link",
            description: "Link associated with this club",
            component: {
                type: 4,
                custom_id: "club_link",
                style: 1,
                value: clubLink,
                placeholder: "https://...",
                required: false
            }
        },
        {
            type: 18, // Label
            label: "Main Contact",
            description: "Club's primary contact on this Discord server",
            component: {
                type: 5, // User Select
                custom_id: "contact",
                placeholder: mainContact,
                required: false
            }
        }
    ]][index];
}


async function getRegionMessage(sessionID: string, env: Env): Promise<any | null> {
    const session = (await sheets.get("DiscordBot!A:N", env.GOOGLE_SHEET_ID, env)).find(row => row[0] === sessionID);
    if (session === undefined) {return null;}
    return [
        {
            type: 12,  // Media Gallery
            items: [{media: {url: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2155149285/settings_images/b41ed6-0fd5-6f-e08a-bbcb352e6_Regions.webp"}}]
        },
        {
            type: 1,  // Action Row
            components: [
                {
                    type: 3, // String Select
                    custom_id: `clublist_edit_club_region__${sessionID}`,
                    placeholder: session[1],
                    required: false,
                    options: [
                        {
                            label: "Other",
                            value: "Other"
                        },
                        {
                            label: "Northeast",
                            value: "Northeast"
                        },
                        {
                            label: "Southeast",
                            value: "Southeast"
                        },
                        {
                            label: "Midwest",
                            value: "Midwest"
                        },
                        {
                            label: "West",
                            value: "West"
                        },
                        {
                            label: "Southwest",
                            value: "Southwest"
                        }
                    ]
                }
            ]
        },
        {
            type: 1, // Action Row
            components: [
                {
                    type: 2, // Button
                    style: 1, // Primary
                    label: "Continue",
                    custom_id: `clublist_edit_club_continue__${sessionID}`
                }
            ]
        }
    ];
}


async function parseColor(color: string): Promise<number | null> {
    var error = false;
    if (color.charAt(0) === "#") {color = color.slice(1);}
    if (color.length != 6) {error = true} else {
        for (var i = 0; i < color.length; i++) {
            if (!"0123456789abcdefABCDEF".includes(color.charAt(i))) {
                error = true;
                break;
            }
        }
    }
    if (error) {return null;}
    return parseInt(color, 16);;
}


async function isClubRole(roleID: string, env: Env): Promise<boolean> {
    const position = await discord.getRolePosition(roleID, env);
    return (roleID != null &&
            position > (await discord.getRolePosition(env.DISCORD_ROLE_POSITION_START, env)) &&
            position < (await discord.getRolePosition(env.DISCORD_ROLE_POSITION_END, env)));
}


export async function handleDiscordRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
        // This is for setting up Interactions Endpoint URL
        const interaction = await discord.verify(request, env);
        if (interaction instanceof Response) {
            return interaction;
        }



        // SLASH COMMANDS
        if (interaction.type === 2) {
            const command = interaction.data?.name;

            switch (command) {

                case "deleteroles": {
                    const runnerRoles = await discord.getUserRoles(interaction.member.user.id, env);
                    if (!runnerRoles.includes(env.DISCORD_ROLE_STAFF)) {return await discord.slashCommandReply(`You need <@&${env.DISCORD_ROLE_STAFF}> to use this!`, env, interaction);}
                    const limit = interaction.data.options.find(option => option.name === "limit")?.value;
                    const roles = await discord.getAllRoles(env);
                    var rolesDeleted = 0;
                    for (const role of roles)
                    {
                        if (await isClubRole(role.id, env)) {
                            discord.deleteRole(role.id, env);
                            rolesDeleted += 1;
                        }
                        if (rolesDeleted == limit) {break;}
                    }
                    return await discord.slashCommandReply(`Deleted ${rolesDeleted} roles!`, env);
                }

                case "club": {
                    const userID = interaction.member.user.id;
                    const roleID1 = interaction.data.options == null ? null : interaction.data.options.find(option => option.name === "role1")?.value;
                    const roleID2 = interaction.data.options == null ? null : interaction.data.options.find(option => option.name === "role2")?.value;
                    const roleID3 = interaction.data.options == null ? null : interaction.data.options.find(option => option.name === "role3")?.value;
                    ctx.waitUntil((async () => {
                        try {
                            if (env.DISCORD_ROLE_POSITION_START === "0") {throw new Error("Missing DISCORD_ROLE_POSITION_START");}
                            if (env.DISCORD_ROLE_POSITION_END === "0") {throw new Error("Missing DISCORD_ROLE_POSITION_END");}
                            if (roleID1 != null && !(await isClubRole(roleID1, env))) {return await discord.slashCommandReply(`Nice try! <@&${roleID1}> is not a valid club role.`, env, interaction, true);}
                            if (roleID2 != null && !(await isClubRole(roleID2, env))) {return await discord.slashCommandReply(`Nice try! <@&${roleID2}> is not a valid club role.`, env, interaction, true);}
                            if (roleID3 != null && !(await isClubRole(roleID3, env))) {return await discord.slashCommandReply(`Nice try! <@&${roleID3}> is not a valid club role.`, env, interaction, true);}
                            const oldRoles = (await discord.getUserRoles(userID, env));
                            for (const roleID of oldRoles) {
                                if (await isClubRole(roleID, env)) {
                                    await discord.removeUserRole(userID, roleID, env);
                                }
                            }
                            if (roleID1 == null && roleID2 == null && roleID3 == null) {return await discord.slashCommandReply("You lost your club roles x_x", env, interaction, true);}
                            if (roleID1 != null) {await discord.giveUserRole(userID, roleID1, env);}
                            if (roleID2 != null) {await discord.giveUserRole(userID, roleID2, env);}
                            if (roleID3 != null) {await discord.giveUserRole(userID, roleID3, env);}
                            await discord.slashCommandReply("Successfully obtained club roles!", env, interaction, true);
                        } catch (err) {
                            await discord.slashCommandReply("Error giving roles. Please report to admin. O_O", env, interaction, true);
                        }
                    })());
                    return await discord.defferedReply();
                }

                case "staff": {
                    const userID = interaction.data.options.find(option => option.name === "user")?.value;
                    try {
                        const runnerRoles = await discord.getUserRoles(interaction.member.user.id, env);
                        const roles = await discord.getUserRoles(userID, env);
                        if (!runnerRoles.includes(env.DISCORD_ROLE_STAFF)) {
                            return await discord.slashCommandReply(`You don't even have the <@&${env.DISCORD_ROLE_STAFF}> role yourself >:P`, env, interaction);
                        } else if (roles.includes(env.DISCORD_ROLE_STAFF)) {
                            return await discord.slashCommandReply(`<@${userID}> already has the <@&${env.DISCORD_ROLE_STAFF}> role :P`, env, interaction);
                        } else {
                            await discord.giveUserRole(userID, env.DISCORD_ROLE_STAFF, env);
                            return await discord.slashCommandReply(`Successfully gave <@${userID}> the <@&${env.DISCORD_ROLE_STAFF}> role!`, env, interaction);
                        }
                    } catch (err) {
                        return await discord.slashCommandReply(`Error giving <@${userID}> the <@&${env.DISCORD_ROLE_STAFF}> role.`, env, interaction);
                    }
                }

                case "clublist": {
                    // TODO: change how clublist works: enter one role in at a time | ephemeral messages asking to add role, set role, or clear roles if you already have a club role | when you add/set a club role ask to change your username to add the school's acronym | still limit to 3 club roles max
                    const runnerRoles = await discord.getUserRoles(interaction.member.user.id, env);
                    if (!runnerRoles.includes(env.DISCORD_ROLE_STAFF)) {return await discord.slashCommandReply(`You need <@&${env.DISCORD_ROLE_STAFF}> to use this!`, env, interaction);}
                    var clubRoles: string[] = []
                    for (const roleID of runnerRoles) {
                        if (await isClubRole(roleID, env)) {
                            clubRoles.push(roleID);
                        }
                    }
                    if (clubRoles.length === 0) {return await discord.slashCommandReply("Please give yourself the club role for your school with `/club` first!", env, interaction);}
                    const sessionID = crypto.randomUUID();
                    if (clubRoles.length === 1) {
                        const queryResult = (await sheets.get("Main!A:H", env.GOOGLE_SHEET_ID, env)).slice(1);
                        var row = queryResult.find(row => row[6] === clubRoles[0]);
                        if (row === undefined) {return await discord.slashCommandReply("Couldn't find associated club. Please contact Discord Team to get this fixed.", env, interaction);}
                        while (row.length < 12) {row.push("");}
                        // A:N [sessionID, region, school, club, clubLink, mainContact, "In The Discord", roleID, acronym, roleIndex, roleName, roleColor, interactionToken, timeStamp]
                        const session = [sessionID, ...row, Date.now()];
                        await sheets.append("DiscordBot!A:A", env.GOOGLE_SHEET_ID, [session], env);
                        const modal = await getClublistModal(session, 0, env);
                        return await discord.modal(`clublist_edit_club_1__${sessionID}`, "Edit Club [1/2]", modal);
                    } else {
                        const queryResult = (await sheets.get("Main!A:H", env.GOOGLE_SHEET_ID, env)).slice(1);
                        const rows = queryResult.filter(row => clubRoles.includes(row[6]));
                        if (rows === undefined || rows.length === 0) {return await discord.slashCommandReply("Couldn't find associated club. Please contact Discord Team to get this fixed.", env, interaction);}
                        return await discord.ephemeralMessage([
                            {
                                type: 10,
                                content: "Select club"
                            },
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 3,
                                        custom_id: `clublist_select_club__${sessionID}`,
                                        placeholder: "Choose a club...",
                                        options: rows.map(row => ({
                                            label: row[2] ? `${row[1]} - ${row[2]}` : row[1],
                                            value: row[6]
                                        }))
                                    }
                                ]
                            }
                        ]);
                    }
                }

                case "update": {
                    await handleDiscordUpdate(env, ctx);
                    return await discord.slashCommandReply("Running update...", env, interaction);
                }

                default: {
                    return await discord.slashCommandReply(`Unknown command: /${command}`, env);
                }

            }
        }



        // MESSAGE COMPONENTS
        else if (interaction.type === 3) {
            if (!interaction.member.roles.includes(env.DISCORD_ROLE_STAFF)) {return await discord.slashCommandReply(`You need <@&${env.DISCORD_ROLE_STAFF}> to use this!`, env, interaction);}
            const component = interaction.data.custom_id.split("__")[0];
            const sessionID = interaction.data.custom_id.split("__")[1];
            const queryResult = await sheets.get("DiscordBot!A:N", env.GOOGLE_SHEET_ID, env);
            const rowIndex = queryResult.findIndex(row => row[0] === sessionID);
            if (rowIndex === -1) {return await discord.slashCommandReply("Session Expired :/", env, interaction);}
            switch (component) {
                case "clublist_edit_club_region": {
                    const region = interaction.data.values[0];
                    await sheets.set(`DiscordBot!B${rowIndex + 1}:B${rowIndex + 1}`, env.GOOGLE_SHEET_ID, [[region]], env);
                    const regionMessage = await getRegionMessage(sessionID, env);
                    if (regionMessage === null) {return await discord.slashCommandReply("Session Expired :/", env, interaction);}
                    return await discord.ephemeralMessage(regionMessage, true);
                }
                case "clublist_edit_club_continue": {
                    await sheets.set(`DiscordBot!M${rowIndex + 1}:M${rowIndex + 1}`, env.GOOGLE_SHEET_ID, [[interaction.token]], env);
                    const modal = await getClublistModal(queryResult[rowIndex], 1, env);
                    return await discord.modal(`clublist_edit_club_2__${sessionID}`, "Edit Club [2/2]", modal);
                }
            }
        }



        // MODAL SUBMISSIONS
        else if (interaction.type === 5) {
            if (!interaction.member.roles.includes(env.DISCORD_ROLE_STAFF)) {return await discord.slashCommandReply(`You need <@&${env.DISCORD_ROLE_STAFF}> to use this!`, env, interaction);}
            const modalID = interaction.data.custom_id.split("__")[0];
            const sessionID = interaction.data.custom_id.split("__")[1];

            switch (modalID) {
                case "clublist_edit_club_1": {
                    const queryResult = await sheets.get("DiscordBot!A:N", env.GOOGLE_SHEET_ID, env);
                    const rowIndex = queryResult.findIndex(row => row[0] === sessionID);
                    if (rowIndex === -1) {return await discord.slashCommandReply("Session Expired :/", env, interaction);}
                    const roleName = interaction.data.components[0].component.value;
                    const roleColor = interaction.data.components[1].component.value;
                    const school = interaction.data.components[2].component.value;
                    const clubName = interaction.data.components[3].component.value;
                    const acronym = interaction.data.components[4].component.value;
                    await sheets.set(`DiscordBot!C${rowIndex + 1}:L${rowIndex + 1}`, env.GOOGLE_SHEET_ID, [[
                        school,
                        clubName,
                        queryResult[rowIndex][4], // keep existing club link
                        queryResult[rowIndex][5], // keep existing main contact
                        queryResult[rowIndex][6], // keep existing status
                        queryResult[rowIndex][7], // keep existing role ID
                        acronym,
                        queryResult[rowIndex][9], // keep existing role index (NOTE: role index is currently unused)
                        roleName,
                        roleColor
                    ]], env);
                    return await discord.ephemeralMessage(await getRegionMessage(sessionID, env));
                }
                case "clublist_edit_club_2": {
                    const queryResult = await sheets.get("DiscordBot!A:N", env.GOOGLE_SHEET_ID, env);
                    const rowIndex = queryResult.findIndex(row => row[0] === sessionID);
                    const session = queryResult[rowIndex];
                    var clubLink = interaction.data.components[0].component.value;
                    var mainContact = interaction.data.components[1].component.value;

                    // Update Role
                    const roleID = session[7];
                    const roleName = session[10] || null;
                    const roleColorString = session[11] || "";
                    const roleColor = await parseColor(roleColorString);
                    await discord.editRole(roleID, roleName, roleColor, env);

                    // Update session with modal values
                    clubLink = clubLink.startsWith("http") ? clubLink : `https://${clubLink}`
                    mainContact = mainContact ? await discord.getUsername(mainContact, env) : null;
                    await sheets.set(`DiscordBot!E${rowIndex + 1}:F${rowIndex + 1}`, env.GOOGLE_SHEET_ID, [[
                        clubLink ?? session[4],
                        mainContact ?? session[5],
                    ]], env);

                    // Copy session into Main table
                    const updatedSession = (await sheets.get("DiscordBot!A:N", env.GOOGLE_SHEET_ID, env)).find(row => row[0] === sessionID);
                    if (updatedSession === undefined) {return await discord.slashCommandReply("Session expired :/", env, interaction);}
                    const mainRows = await sheets.get("Main!A:H", env.GOOGLE_SHEET_ID, env);
                    const mainRowIndex = mainRows.findIndex(row => row[6] === updatedSession[7]);
                    if (mainRowIndex === -1) {return await discord.slashCommandReply("Couldn't find club in Main sheet.", env, interaction);}
                    await sheets.set(`Main!A${mainRowIndex + 1}:H${mainRowIndex + 1}`, env.GOOGLE_SHEET_ID, [[...updatedSession.slice(1, 9)]], env);

                    // Clear session
                    console.log(rowIndex);
                    await sheets.set(`DiscordBot!A${rowIndex + 1}:N${rowIndex + 1}`, env.GOOGLE_SHEET_ID, [Array(14).fill("")], env);

                    await fetch(`https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${session[12]}/messages/@original`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            flags: discord.Flags.EPHEMERAL | discord.Flags.IS_COMPONENTS_V2,
                            components: [
                                {
                                    type: 10,
                                    content: "Club updated successfully! [1/2]"
                                }
                            ]
                        })
                    });
                    return await discord.slashCommandReply("Club updated successfully! [2/2]", env, interaction);
                }
            }
        }



        return discord.slashCommandReply("Error: Unsupported interaction!", env);
    } catch (err) {
        return discord.slashCommandReply(String(err), env);
    }
}


export async function handleDiscordUpdate(env: Env, ctx: ExecutionContext) {
    const sessions = await sheets.get("DiscordBot!N:N", env.GOOGLE_SHEET_ID, env);
    const now = Date.now();
    const sessionTimeout = 15 * 60 * 1000;  // 15 minutes
    for (var i = 0; i < sessions.length; i++) {
        const timestamp = Number(sessions[i][0]);
        if (!timestamp || now - timestamp > sessionTimeout) {
            await sheets.set(`DiscordBot!A${i + 1}:N${i + 1}`, env.GOOGLE_SHEET_ID, [Array(14).fill("")], env);
        }
    }

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
                const queryResult = (await sheets.get("Main!A:H", env.GOOGLE_SHEET_ID, env)).slice(1);
                const positionStart = await discord.getRolePosition(env.DISCORD_ROLE_POSITION_START, env);
                const positionEnd = await discord.getRolePosition(env.DISCORD_ROLE_POSITION_END, env);
                var clubRoles = (await discord.getAllRoles(env)).filter(role => positionStart < role.position && role.position < positionEnd).map(role => role.id);

                // record club roles from query result
                for (const row of queryResult) {
                    if (row[5] != "In The Discord") {
                        clubs.push(null);
                        roles.push(null);
                        continue;
                    };
                    if (!row?.[1]) {
                        clubs.push(null);
                        roles.push(null);
                    } else {
                        clubs.push(row[1]);
                        roles.push(row[6]);
                        clubRoles = clubRoles.filter(roleID => roleID != row[6]);
                    }
                }

                // add new Discord roles from Google Sheets
                var error = "";
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
                    const roleSheet = env.GOOGLE_SHEET_ID;
                    const position_start = (await discord.getRolePosition(env.DISCORD_ROLE_POSITION_START, env)) + 1;
                    const position_end = (await discord.getRolePosition(env.DISCORD_ROLE_POSITION_END, env)) - 1;
                    const discordRoles = await discord.getAllRoles(env);
                    const discordClubRoles = discordRoles.filter(role => position_start <= role.position && role.position <= position_end)
                    for (var i = 0; i < clubs.length; i++) {
                        if (clubs[i] != null && roles[i] == null) {
                            const numClubs = clubs.filter(club => club != null).length;
                            if ((discordRoles.length > numClubs - numReusedRoles + 50) ||  // Error when attempting to create a role if there are more than 50 roles that aren't club roles (likely that club roles are being mistaken as not club roles)
                                (discordClubRoles.length >= numClubs - numReusedRoles)) {  // Error when attempting to create a role if it would make there be more club roles than clubs in the Schools List Google sheet marked as In The Discord (likely there is a duplicate role)
                                error = `\n*Unable to create role for ${clubs[i]} ;-;*`;
                                break;
                            }
                            const role = (await discord.createRole(clubs[i], position_start, env));
                            await sheets.set(`Main!G${i + 2}:G${i + 2}`, roleSheet, [[role.id]], env);
                            roles[i] = role.id;
                            limit--;
                        }
                        if (limit === 0) {break;}
                    }
                }

                // create club list channel text from query result and recorded club roles
                var text: string = "";
                var i = 1;
                var j = -1;
                for (const row of queryResult) {
                    j++;
                    if (clubs[j] === null) {continue;}
                    var link = "";
                    text += `${i}.`;
                    if (roles[j]) {
                        text += ` <@&${roles[j]}>`;
                    } else {
                        text += ` [MISSING ROLE]`;
                    }
                    if (!row?.[1]) {
                        text += ` [MISSING CLUB]`;
                    } else if (!row[3]) {
                        text += ` ${row[1]}`;
                        if (row[2]) {text += ` - ${row[2]}`;}
                    } else if (row[2]) {
                        text += ` ${row[1]}`;
                        text += " - ";
                        link = `${row[2]}`
                    } else {
                        text += " ";
                        link = `${row[2]}`
                    }
                    if (link != "") {
                        if (row[3].startsWith("https://discord")) {
                            text += `${link} \`${row[3]}\``;
                        } else {
                            text += `[${link}](${row[3]})`;
                        }
                    }
                    text += "\n";
                    i++;
                }
                for (const roleID of clubRoles) {
                    text += `${i}. <@&${roleID}> [MISSING CLUB]\n`;
                    i++;
                }
                text += `\n**GAME DEV CLUB CLUB CLUB LIST - ${i - 1} clubs and counting B)**\n\n**Use /club to get your club's role!**`;
                text += error;

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
                    const response = await discord.sendMessage("...", env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
                    await discord.editMessage(response.id, messages[i], env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
                }
            } catch (err) {
                await discord.sendMessage("Bot error: " + String(err), env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
            }
        })());
    }
}
