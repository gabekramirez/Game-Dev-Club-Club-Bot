import type {BotError, Env, ExecutionContext} from "./type-hints.ts";
import * as discord from "./discord.ts";
import * as sheets from "./sheets.ts";


const CLUB_ROLE_LIMIT = 3;


async function getClublistModal(session: any[], index: number): Promise<any> {
    const roleName = session[10];
    const roleColor = session[11];
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
                value: roleName
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
                value: roleColor,
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
    const BOT_SHEET = env.GOOGLE_SHEET_ID_BOT ? env.GOOGLE_SHEET_ID_BOT : env.GOOGLE_SHEET_ID
    const session = (await sheets.get("DiscordBot!A:N", BOT_SHEET, env)).find(row => row[0] === sessionID);
    if (session === undefined) {return null;}
    return [
        {
            type: 10,  // Text Display
            content: "**Edit Club [1/2]\n---------------**"
        },
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
        },
        {
            type: 10,  // Text Display
            content: "***NOTE:** You must click **Submit** on the next form for changes to be saved!*"
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
    const BOT_SHEET = env.GOOGLE_SHEET_ID_BOT ? env.GOOGLE_SHEET_ID_BOT : env.GOOGLE_SHEET_ID
    try {
        // This is for setting up Interactions Endpoint URL
        const interaction = await discord.verify(request, env);
        if (interaction instanceof Response) {
            return interaction;
        }



        // SLASH COMMAND
        if (interaction.type === 2) {
            const command: string = interaction.data?.name;
            const commandOptions: {name: string; value?: any;}[] = interaction.data.options

            switch (command) {

                // case "deleteroles": {
                //     const runnerRoles = await discord.getUserRoles(interaction.member.user.id, env);
                //     if (!runnerRoles.includes(env.DISCORD_ROLE_STAFF)) {return await discord.slashCommandReply(`You need <@&${env.DISCORD_ROLE_STAFF}> to use this!`, env, interaction);}
                //     const limit = commandOptions.find(option => option.name === "limit")?.value;
                //     const roles = await discord.getAllRoles(env);
                //     var rolesDeleted = 0;
                //     for (const role of roles)
                //     {
                //         if (await isClubRole(role.id, env)) {
                //             discord.deleteRole(role.id, env);
                //             rolesDeleted += 1;
                //         }
                //         if (rolesDeleted == limit) {break;}
                //     }
                //     return await discord.slashCommandReply(`Deleted ${rolesDeleted} roles!`, env);
                // }

                case "club": {
                    ctx.waitUntil((async () => {
                        const roleID = commandOptions.find(option => option.name === "role")?.value;
                        if (env.DISCORD_ROLE_POSITION_START === "0") {throw new Error("Missing DISCORD_ROLE_POSITION_START");}
                        if (env.DISCORD_ROLE_POSITION_END === "0") {throw new Error("Missing DISCORD_ROLE_POSITION_END");}
                        if (!(await isClubRole(roleID, env))) {return await discord.slashCommandReply(`Nice try! <@&${roleID}> is not a valid club role :P`, env, interaction);}
                        const row = (await sheets.get("Main!A:H", env.GOOGLE_SHEET_ID, env)).slice(1).find(row => row[6] === roleID);
                        const acronym = row === undefined || row[7] === undefined ? "" : row[7];
                        const userID = interaction.member.user.id;
                        const oldRoles = (await discord.getUserRoles(userID, env));
                        const oldNick = (await discord.getNickname(interaction.member.user.id, env));
                        var clubRoleCount = 0;
                        for (const oldRoleID of oldRoles) {
                            if (await isClubRole(oldRoleID, env)) {
                                if (oldRoleID === roleID) {
                                    if (oldNick.endsWith(` | ${acronym}`)) {
                                        var splitNick = oldNick.split(" | ");
                                        splitNick.pop();
                                        const newNick = splitNick.join(" | ");
                                        if (newNick.length > 0) {
                                            try {
                                                await discord.setNickname(interaction.member.user.id, newNick, env);
                                            } catch (err) {};
                                        }
                                    }
                                    await discord.removeUserRole(userID, roleID, env);
                                    return await discord.slashCommandReply(`You lost <@&${roleID}> x_x`, env, interaction);
                                }
                                clubRoleCount++;
                            }
                        }
                        const countText = clubRoleCount ? `   (${clubRoleCount + (clubRoleCount >= CLUB_ROLE_LIMIT ? 0 : 1)}/${CLUB_ROLE_LIMIT} max club roles)` : "";
                        if (clubRoleCount >= CLUB_ROLE_LIMIT) {return await discord.slashCommandReply(`Please remove a club role before adding more!${countText}`, env, interaction);}
                        await discord.giveUserRole(userID, roleID, env);
                        var splitNick = oldNick.split(" | ");
                        if (splitNick.length > 1) {splitNick.pop();}
                        const newNick = `${splitNick.join(" | ")} | ${acronym}`;
                        const obtainText = `Successfully obtained <@&${roleID}> !${countText}`;
                        var canChangeNick = !(acronym === "" || newNick.length > 32);
                        try {
                            await discord.setNickname(interaction.member.user.id, oldNick, env);
                        } catch (err) {
                            canChangeNick = false;
                        }
                        if (!canChangeNick) {return await discord.slashCommandReply(obtainText, env, interaction);}
                        return await discord.editEphemeralMessageByToken(interaction.token, [
                            {
                                type: 10,
                                content: obtainText
                            },
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 2,
                                        style: 1,
                                        label: `Add "${acronym}" to Username`,
                                        custom_id: `username_add__${acronym}`
                                    }
                                ]
                            }
                        ], env);
                    })());
                    return discord.defferedReply();
                }

                case "staff": {
                    ctx.waitUntil((async () => {
                        const userID = commandOptions.find(option => option.name === "user")?.value;
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
                    })());
                    return discord.defferedReply();
                }

                case "clublist": {
                    ctx.waitUntil((async () => {
                        const runnerRoles = await discord.getUserRoles(interaction.member.user.id, env);
                        if (!runnerRoles.includes(env.DISCORD_ROLE_STAFF)) {return await discord.slashCommandReply(`You need <@&${env.DISCORD_ROLE_STAFF}> to use this!`, env, interaction);}
                        const queryResult = (await sheets.get("Main!A:H", env.GOOGLE_SHEET_ID, env)).slice(1);
                        var clubRoles: string[] = [];
                        var clubs = [];
                        for (const roleID of runnerRoles) {
                            if (await isClubRole(roleID, env)) {
                                clubRoles.push(roleID);
                                const rolesClubs = queryResult.filter(row => row[5] == "In The Discord" && row[6] == roleID).map((row, index) => ({
                                    label: row[2] ? `${row[1]} - ${row[2]}` : row[1],
                                    value: `${row[6]}__${index}`
                                }));
                                for (const club of rolesClubs) {
                                    clubs.push(club);
                                }
                            }
                        }
                        if (clubRoles.length === 0) {return await discord.slashCommandReply("Please give yourself the club role for your school with `/club` first!", env, interaction);}
                        if (clubs.length === 0) {return await discord.slashCommandReply("Couldn't find associated club. Please contact Discord Team to get this fixed.", env, interaction);}
                        const sessionID = crypto.randomUUID();
                        if (clubs.length === 1) {
                            var row = queryResult.find(row => row[6] === clubRoles[0]);
                            if (row === undefined) {return await discord.slashCommandReply("Couldn't find associated club. Please contact Discord Team to get this fixed.", env, interaction);}
                            while (row.length < 8) {row.push("");}
                            // A:N [sessionID, region, school, club, clubLink, mainContact, "In The Discord", roleID, acronym, roleIndex, roleName, roleColor, interactionToken, timeStamp]
                            const role = await discord.getRole(row[6], env);
                            const roleColor = "#" + role.color.toString(16).padStart(6, "0");
                            const session = [sessionID, ...row, 0, role.name, roleColor, "", Date.now()];
                            await sheets.append("DiscordBot!A:A", BOT_SHEET, [session], env);
                            return await discord.editEphemeralMessageByToken(interaction.token, [
                                {
                                    type: 10,  // Text Display
                                    content: "/clublist"
                                },
                                {
                                    type: 1, // Action Row
                                    components: [
                                        {
                                            type: 2, // Button
                                            style: 1, // Primary
                                            label: "PRESS START",
                                            custom_id: `clublist_edit_club_start__${sessionID}`
                                        }
                                    ]
                                },
                            ], env);
                        } else {
                            const rows = queryResult.filter(row => clubRoles.includes(row[6]));
                            if (rows === undefined || rows.length === 0) {return await discord.slashCommandReply("Couldn't find associated club. Please contact Discord Team to get this fixed.", env, interaction);}
                            const session = [sessionID, ...Array(12).fill(""), Date.now()];
                            await sheets.append("DiscordBot!A:A", BOT_SHEET, [session], env);
                            return await discord.editEphemeralMessageByToken(interaction.token, [
                                {
                                    type: 10,  // Text Display
                                    content: "Select club"
                                },
                                {
                                    type: 1,  // Action Row
                                    components: [
                                        {
                                            type: 3,  // String Select
                                            custom_id: `clublist_select_club__${sessionID}`,
                                            placeholder: "Choose a club...",
                                            options: clubs
                                        }
                                    ]
                                }
                            ], env);
                        }
                    })());
                    return discord.defferedReply();
                }

                case "update": {
                    await handleDiscordUpdate(env, ctx);
                    return await discord.slashCommandReply("Running update...", env);
                }

                default: {
                    return await discord.slashCommandReply(`Unknown command: /${command}`, env);
                }

            }
        }



        // EPHEMERAL MESSAGE
        else if (interaction.type === 3) {
            const component = interaction.data.custom_id.split("__")[0];
            if (component === "username_add") {
                try {
                    const acronym = interaction.data.custom_id.split("__")[1];
                    const oldNick = (await discord.getNickname(interaction.member.user.id, env));
                    var splitNick = oldNick.split(" | ");
                    if (splitNick.length > 1) {splitNick.pop();}
                    const newNick = `${splitNick.join(" | ")} | ${acronym}`
                    if (newNick.length > 32) {
                        return await discord.ephemeralMessage([
                            {
                                type: 10,  // Text Display
                                content: "Nickname too long :("
                            }
                        ], true);
                    }
                    await discord.setNickname(interaction.member.user.id, newNick, env);
                    return await discord.ephemeralMessage([
                        {
                            type: 10,  // Text Display
                            content: `"${acronym}" successfully added to username :D`
                        }
                    ], true);
                } catch (err) {
                    return await discord.ephemeralMessage([
                        {
                            type: 10,  // Text Display
                            content: "Error trying to add acronym :("
                        }
                    ], true);
                }
            }
            if (!interaction.member.roles.includes(env.DISCORD_ROLE_STAFF)) {return await discord.slashCommandReply(`You need <@&${env.DISCORD_ROLE_STAFF}> to use this!`, env, interaction);}
            const sessionID = interaction.data.custom_id.split("__")[1];
            const queryResult = await sheets.get("DiscordBot!A:N", BOT_SHEET, env);
            const rowIndex = queryResult.findIndex(row => row[0] === sessionID);
            if (rowIndex === -1) {return await discord.slashCommandReply("Session Expired :/", env, interaction);}
            switch (component) {
                case "clublist_select_club": {
                    const roleID = interaction.data.values[0].split("__")[0];
                    const roleIndex = interaction.data.values[0].split("__")[1];
                    const row = (await sheets.get("Main!A:H", env.GOOGLE_SHEET_ID, env)).slice(1).filter(row => row[6] === roleID)[roleIndex];
                    while (row.length < 8) {row.push("");}
                    const role = await discord.getRole(row[6], env);
                    const roleColor = "#" + role.color.toString(16).padStart(6, "0");
                    const session = [sessionID, ...row, roleIndex, role.name, roleColor, interaction.token, Date.now()];
                    await sheets.set(`DiscordBot!A${rowIndex + 1}:N${rowIndex + 1}`, BOT_SHEET, [session], env);
                    const modal = await getClublistModal(session, 0);
                    return await discord.modal(`clublist_edit_club_1__${sessionID}`, "Edit Club [1/2]", modal);
                }
                case "clublist_edit_club_start": {
                    await sheets.set(`DiscordBot!M${rowIndex + 1}:M${rowIndex + 1}`, BOT_SHEET, [[interaction.token]], env);
                    const modal = await getClublistModal(queryResult[rowIndex], 0);
                    return await discord.modal(`clublist_edit_club_1__${sessionID}`, "Edit Club [1/2]", modal);
                }
                case "clublist_edit_club_region": {
                    const region = interaction.data.values[0];
                    await sheets.set(`DiscordBot!B${rowIndex + 1}:B${rowIndex + 1}`, BOT_SHEET, [[region]], env);
                    const regionMessage = await getRegionMessage(sessionID, env);
                    if (regionMessage === null) {return await discord.slashCommandReply("Session Expired :/", env, interaction);}
                    return await discord.ephemeralMessage(regionMessage, true);
                }
                case "clublist_edit_club_continue": {
                    await sheets.set(`DiscordBot!M${rowIndex + 1}:M${rowIndex + 1}`, BOT_SHEET, [[interaction.token]], env);
                    const modal = await getClublistModal(queryResult[rowIndex], 1);
                    return await discord.modal(`clublist_edit_club_2__${sessionID}`, "Edit Club [2/2]", modal);
                }
            }
        }



        // MODAL
        else if (interaction.type === 5) {
            if (!interaction.member.roles.includes(env.DISCORD_ROLE_STAFF)) {return await discord.slashCommandReply(`You need <@&${env.DISCORD_ROLE_STAFF}> to use this!`, env, interaction);}
            const modalID = interaction.data.custom_id.split("__")[0];
            const sessionID = interaction.data.custom_id.split("__")[1];
            const queryResult = await sheets.get("DiscordBot!A:N", BOT_SHEET, env);
            const rowIndex = queryResult.findIndex(row => row[0] === sessionID);
            const session = queryResult[rowIndex];

            switch (modalID) {
                case "clublist_edit_club_1": {
                    const queryResult = await sheets.get("DiscordBot!A:N", BOT_SHEET, env);
                    const rowIndex = queryResult.findIndex(row => row[0] === sessionID);
                    if (rowIndex === -1) {return await discord.slashCommandReply("Session Expired :/", env, interaction);}
                    const roleName = interaction.data.components[0].component.value;
                    const roleColor = interaction.data.components[1].component.value;
                    const school = interaction.data.components[2].component.value;
                    const clubName = interaction.data.components[3].component.value;
                    const acronym = interaction.data.components[4].component.value;
                    await sheets.set(`DiscordBot!C${rowIndex + 1}:L${rowIndex + 1}`, BOT_SHEET, [[
                        school,
                        clubName,
                        queryResult[rowIndex][4], // keep existing club link
                        queryResult[rowIndex][5], // keep existing main contact
                        queryResult[rowIndex][6], // keep existing status
                        queryResult[rowIndex][7], // keep existing role ID
                        acronym,
                        queryResult[rowIndex][9], // keep existing role index
                        roleName,
                        roleColor
                    ]], env);

                    if (session[12] != "") {
                        await discord.editEphemeralMessageByToken(session[12], [
                            {
                                type: 10,  // Text Display
                                content: "Club chosen!"
                            }
                        ], env);
                    }
                    return await discord.ephemeralMessage(await getRegionMessage(sessionID, env));
                }
                case "clublist_edit_club_2": {
                    var clubLink = interaction.data.components[0].component.value;
                    var mainContact = interaction.data.components[1].component.value;

                    try {
                        // Update Role
                        const roleID = session[7];
                        const roleName = session[10] || null;
                        const roleColorString = session[11] || "";
                        const roleColor = await parseColor(roleColorString);
                        await discord.editRole(roleID, roleName, roleColor, env);

                        // Update session with modal values
                        clubLink = clubLink === "" || clubLink.startsWith("http") ? clubLink : `https://${clubLink}`
                        mainContact = mainContact ? await discord.getUsername(mainContact, env) : null;
                        await sheets.set(`DiscordBot!E${rowIndex + 1}:F${rowIndex + 1}`, BOT_SHEET, [[
                            clubLink ?? session[4],
                            mainContact ?? session[5],
                        ]], env);

                        // Copy session into Main table
                        const updatedSession = (await sheets.get("DiscordBot!A:N", BOT_SHEET, env)).find(row => row[0] === sessionID);
                        if (updatedSession === undefined) {return await discord.slashCommandReply("Session expired :/", env);}
                        const mainRows = await sheets.get("Main!A:H", env.GOOGLE_SHEET_ID, env);
                        var roleIndex = session[9];
                        var mainRowIndex = mainRows.findIndex(row => row[6] === updatedSession[7]);
                        while (roleIndex > 0) {
                            mainRowIndex = mainRows.findIndex((row, index) => row[6] === updatedSession[7] && index > mainRowIndex);
                            roleIndex--;
                        }
                        if (mainRowIndex === -1) {return await discord.slashCommandReply("Couldn't find club in Main sheet.", env);}
                        await sheets.set(`Main!A${mainRowIndex + 1}:H${mainRowIndex + 1}`, env.GOOGLE_SHEET_ID, [[...updatedSession.slice(1, 9)]], env);

                        // Clear session
                        await sheets.set(`DiscordBot!A${rowIndex + 1}:N${rowIndex + 1}`, BOT_SHEET, [Array(14).fill("")], env);
                    } catch (err) {}

                    ctx.waitUntil((async () => {
                        await handleDiscordUpdate(env, ctx);
                    })());
                    await discord.editEphemeralMessageByToken(session[12], [
                        {
                            type: 10,  // Text Display
                            content: "Club updated successfully! [1/2]"
                        }
                    ], env);
                    return await discord.slashCommandReply("Club updated successfully! [2/2]", env);
                }
            }
        }



        return discord.slashCommandReply("Error: Unsupported interaction!", env);
    } catch (err) {
        return discord.slashCommandReply(String(err), env);
    }
}


export async function handleDiscordUpdate(env: Env, ctx: ExecutionContext) {
    const BOT_SHEET = env.GOOGLE_SHEET_ID_BOT ? env.GOOGLE_SHEET_ID_BOT : env.GOOGLE_SHEET_ID
    const sessions = await sheets.get("DiscordBot!N:N", BOT_SHEET, env);
    const now = Date.now();
    const sessionTimeout = 15 * 60 * 1000;  // 15 minutes
    for (var i = 0; i < sessions.length; i++) {
        const timestamp = Number(sessions[i][0]);
        if (!timestamp || now - timestamp > sessionTimeout) {
            await sheets.set(`DiscordBot!A${i + 1}:N${i + 1}`, BOT_SHEET, [Array(14).fill("")], env);
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
                var roles = [];
                var clubs = [];
                var missingRoles = [];
                var missingReasons = [];

                // query Google Sheets
                const queryResult = (await sheets.get("Main!A:H", env.GOOGLE_SHEET_ID, env)).slice(1);
                const positionStart = await discord.getRolePosition(env.DISCORD_ROLE_POSITION_START, env);
                const positionEnd = await discord.getRolePosition(env.DISCORD_ROLE_POSITION_END, env);
                var clubRoles = (await discord.getAllRoles(env)).filter(role => positionStart < role.position && role.position < positionEnd).map(role => role.id);

                // record club roles from query result
                for (const row of queryResult) {
                    if (row[5] != "In The Discord") {
                        console.log(row);
                        if (row?.[6]) {
                            missingRoles.push(row[6]);
                            missingReasons.push(row[5]);
                            console.log(missingRoles);
                            console.log(missingReasons);
                        }
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
                        text += ` [MISSING DISCORD ROLE]`;
                    }
                    if (!row?.[1]) {
                        text += ` [MISSING SCHOOL NAME]`;
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
                const clubsInDiscord = i - 1;
                for (const roleID of clubRoles) {
                    text += `${i}. <@&${roleID}> `;
                    if (missingRoles.includes(roleID)) {
                        const missingReason = missingReasons[missingRoles.indexOf(roleID)];
                        text += `[${missingReason}]\n`
                    } else {
                        text += "[Missing From Club List]\n"
                    }
                    i++;
                }
                text += `\n**GAME DEV CLUB CLUB CLUB LIST - ${clubsInDiscord} clubs and counting B)**\n\n**Use /club to get your club's role!**`;
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
                var editsLeft = 5;  // Discord rate limits 5 messages / 5 seconds (https://github.com/discord-net/Discord.Net/issues/2375 | https://www.reddit.com/r/discordapp/comments/cbyu20/do_bots_get_ratelimitedstopped_if_they_do_certain)
                var i = 0;
                for (; i < botMessages.length; i++) {
                    if (i >= messages.length) {
                        await discord.deleteMessage(botMessages[i].id, env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
                    } else if (botMessages[i].content !== messages[i]) {
                        if (editsLeft <= 0) {return;}
                        await discord.editMessage(botMessages[i].id, messages[i], env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
                        editsLeft--;
                    }
                }
                for (; i < messages.length; i++) {
                    if (editsLeft <= 0) {return;}
                    const response = await discord.sendMessage("...", env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
                    await discord.editMessage(response.id, messages[i], env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
                    editsLeft--;
                }
            } catch (err) {
                const botError = err as BotError;
                if (botError.error.code != 503) {  // 503 The service is currently unavailable. (Cloudflare rate limiting?)
                    await discord.sendMessage("Bot error: " + String(err), env.DISCORD_CLUB_LIST_CHANNEL_ID, env);
                }
            }
        })());
    }
}
