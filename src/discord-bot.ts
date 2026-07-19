import * as discord from "./discord.ts";
import * as sheets from "./sheets.ts";




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


async function isClubRole(roleID: string, env: Env, inSheets: boolean): Promise<boolean> {
    var clubRoles = [];
    const position = await discord.getRolePosition(roleID, env);
    if (inSheets) {clubRoles = (await sheets.get("Main!G:G", env.GOOGLE_SHEET_ID, env)).slice(1).map(row => row[0]);}
    return (roleID != null && (!inSheets || clubRoles.includes(roleID)) &&
            position > (await discord.getRolePosition(env.DISCORD_ROLE_POSITION_START, env)) &&
            position < (await discord.getRolePosition(env.DISCORD_ROLE_POSITION_END, env)))
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
                    const limit = interaction.data.options.find(option => option.name === "limit")?.value;
                    const roles = await discord.getAllRoles(env);
                    var rolesDeleted = 0;
                    for (const role of roles)
                    {
                        if (await isClubRole(role.id, env, false)) {
                            discord.deleteRole(role.id, env);
                            rolesDeleted += 1;
                        }
                        if (rolesDeleted == limit) {break;}
                    }
                    return await discord.slashCommandReply(`Deleted ${rolesDeleted} roles!`, env);
                }

                case "club": {
                    const roleID = interaction.data.options.find(option => option.name === "role")?.value;
                    ctx.waitUntil((async () => {
                        try {
                            const roleID = interaction.data.options[0].value;
                            if (env.DISCORD_ROLE_POSITION_START === "0") {throw new Error("Missing DISCORD_ROLE_POSITION_START");}
                            if (env.DISCORD_ROLE_POSITION_END === "0") {throw new Error("Missing DISCORD_ROLE_POSITION_END");}
                            const clubRoles = (await sheets.get("Main!G:G", env.GOOGLE_SHEET_ID, env)).slice(1).map(row => row[0]);
                            if (await isClubRole(roleID, env, true)) {
                                const oldRoles = (await discord.getUserRoles(interaction.member.user.id, env)).filter(role => clubRoles.includes(role));
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
                    const userID = interaction.data.options.find(option => option.name === "user")?.value;
                    try {
                        const runnerRoles = await discord.getUserRoles(interaction.member.user.id, env);
                        const roles = await discord.getUserRoles(userID, env);
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

                case "clublist": {
                    const runnerRoles = await discord.getUserRoles(interaction.member.user.id, env);
                    if (!runnerRoles.includes(env.DISCORD_ROLE_STAFF)) {return await discord.slashCommandReply(`You need <@&${env.DISCORD_ROLE_STAFF}> to use this!`, env, interaction);}
                    const subcommand = interaction.data.options[0].name;
                    const subcommandOptions = interaction.data.options[0].options;
                    switch (subcommand) {
                        case "create": {
                            // get command options
                            const roleName = subcommandOptions.find(option => option.name === "role_name")?.value;
                            var roleColor: string | null = subcommandOptions.find(option => option.name === "role_color")?.value;
                            const school = subcommandOptions.find(option => option.name === "school")?.value;
                            const club = subcommandOptions.find(option => option.name === "club_name")?.value;
                            // check if role with that name already exists
                            const roleFound = (await discord.getAllRoles(env)).find(role => role.name === roleName);
                            if (roleFound != null) {return await discord.slashCommandReply(`<@&${roleFound.id}> already exists.`, env, interaction);}
                            // parse hex color
                            var roleColorParsed = roleColor != null ? await parseColor(roleColor) : null;
                            if (roleColorParsed == null) {return await discord.slashCommandReply(`"${roleColor}" is not a valide hex color.`, env, interaction);}
                            // check if club already has a role
                            const queryResult = (await sheets.get("Main!B:H", env.GOOGLE_SHEET_ID, env));
                            const index = queryResult.map((row, index) => row[0] == school && row[1] == club ? index : null).filter(row => row != null).at(0);
                            if (index != null) {return await discord.slashCommandReply(`Club is already associated with role <@&${queryResult[index][5]}>`, env, interaction);}
                            // write to workspace
                            await sheets.set(`Main!Z2:Z2`, env.GOOGLE_SHEET_ID, [[Date.now()]], env);
                            const queryResultClub = (await sheets.get("Main!Z:Z", env.GOOGLE_SHEET_ID, env)).slice(1);
                            const queryClubIndex = queryResultClub.findIndex(row => row[0] === interaction.member.user.id);
                            if (queryClubIndex === -1) {
                                await sheets.append("Main!Z:Z", env.GOOGLE_SHEET_ID, [[interaction.member.user.id], [roleName], [roleColorParsed], [school], [club]], env);
                            } else {
                                await sheets.set(`Main!Z${queryClubIndex + 2}:Z${queryClubIndex + 6}`, env.GOOGLE_SHEET_ID, [[interaction.member.user.id], [roleName], [roleColorParsed], [school], [club]], env);
                            }
                            return await discord.modal("clublist_create", "Add New Club", [
                                {
                                    type: 18,  // Label
                                    label: "Acronym",
                                    description: "Acronym to put at the end of club members' usernames",
                                    component: {
                                        type: 4,  // Text Input
                                        custom_id: "acronym",
                                        style: 1,  // Short
                                        placeholder: "Optional",
                                        required: false
                                    }
                                },
                                {
                                    type: 18,  // Label
                                    label: "Link",
                                    description: "https link to associate with the club",
                                    component: {
                                        type: 4,  // Text Input
                                        custom_id: "club_link",
                                        style: 1,  // Short
                                        placeholder: "Optional",
                                        required: false
                                    }
                                },
                                {
                                    type: 18,  // Label
                                    label: "Main Contact",
                                    description: "Select the club's primary contact",
                                    component: {
                                        type: 5,  // User Select
                                        custom_id: "contact",
                                        required: false
                                    }
                                }
                            ]);
                        }
                        case "edit": {
                            const roleID = subcommandOptions.find(option => option.name === "role")?.value;
                            const roleName = subcommandOptions.find(option => option.name === "role_name")?.value;
                            const roleColor: string | null = subcommandOptions.find(option => option.name === "role_color")?.value;
                            const roleColorParsed = roleColor != null ? await parseColor(roleColor) : null;
                            if (roleColor != null && roleColorParsed == null) {return await discord.slashCommandReply(`"${roleColor}" is not a valide hex color.`, env, interaction);}
                            var region = subcommandOptions.find(option => option.name === "region")?.value;
                            var school = subcommandOptions.find(option => option.name === "school")?.value;
                            var club = subcommandOptions.find(option => option.name === "club")?.value;
                            var clubLink = subcommandOptions.find(option => option.name === "club_link")?.value;
                            if (clubLink != "" && !clubLink.startsWith("https://")) {clubLink = `https://${clubLink}`}
                            var mainContact = subcommandOptions.find(option => option.name === "main_contact")?.value;
                            if (mainContact != null) {mainContact = await discord.getUsername(mainContact, env);}
                            var acronym = subcommandOptions.find(option => option.name === "acronym")?.value;
                            const rows = (await sheets.get("Main!A:H", env.GOOGLE_SHEET_ID, env)).slice(1).map((row, index) => row[6] === roleID ? [index, row] : null).filter(row => row != null);
                            const clubs = rows.map(row => row[1][2]);
                            if (rows.length === 0) {return await discord.slashCommandReply(`<@&${roleID}> not found. in Google sheets. WIP: registering it to sheets`, env, interaction);}  // TODO: register role with a club
                            if (rows.length > 1) {return await discord.slashCommandReply(`Please specify a club\n${clubs}`, env, interaction);}  // TODO: change this to whole thing to a club selection and a modal
                            const index: number = rows[0][0];
                            if (region == null) {region = rows[0][1][0];}
                            if (school == null) {school = rows[0][1][1];}
                            if (club == null) {club = rows[0][1][2];}
                            if (clubLink == null) {clubLink = rows[0][1][3];}
                            if (mainContact == null) {mainContact = rows[0][1][4];}
                            if (acronym == null) {acronym = rows[0][1][7];}
                            await discord.editRole(roleID, roleName, roleColorParsed, env);
                            await sheets.set(`Main!A${index + 2}:H${index + 2}`, env.GOOGLE_SHEET_ID, [[region, school, club, clubLink, mainContact, "In The Discord", roleID, acronym]], env);
                            return await discord.slashCommandReply("Club edited successfully!", env, interaction);
                        }
                    }
                }

                case "update": {
                    await handleDiscordUpdate(env, ctx);
                    return await discord.slashCommandReply("Ran update!", env, interaction);
                }

                default: {
                    return await discord.slashCommandReply(`Unknown command: /${command}`, env);
                }

            }
        }



        // MESSAGE COMPONENTS
        else if (interaction.type === 3) {
            if (!interaction.member.roles.includes(env.DISCORD_ROLE_STAFF)) {return await discord.slashCommandReply(`You need <@&${env.DISCORD_ROLE_STAFF}> to use this!`, env, interaction);}
            const queryResult = (await sheets.get("Main!B:C", env.GOOGLE_SHEET_ID, env)).slice(1);
            const queryResultClub = (await sheets.get("Main!Z:Z", env.GOOGLE_SHEET_ID, env)).slice(1);
            const queryClubIndex = queryResultClub.findIndex(row => row[0] === interaction.member.user.id);
            const queryClub = queryResultClub.slice(queryClubIndex, queryClubIndex + 5);
            const school = queryClub[3][0];
            const club = queryClub[4] != undefined ? queryClub[4][0] : "";
            const region = interaction.data.values[0];
            const index = queryResult.findIndex(row => row[0] === school && row[1] === club);
            ctx.waitUntil((async () => {
                await sheets.set(`Main!A${index + 2}:A${index + 2}`, env.GOOGLE_SHEET_ID, [[region]], env)
            })());
            return Response.json({type: 7, data: {components: [{
                type: 10,  // Text Display
                content: "Updated region successfully!"
            }]}});
        }



        // MODAL SUBMISSIONS
        else if (interaction.type === 5) {
            if (!interaction.member.roles.includes(env.DISCORD_ROLE_STAFF)) {return await discord.slashCommandReply(`You need <@&${env.DISCORD_ROLE_STAFF}> to use this!`, env, interaction);}
            const modalID = interaction.data.custom_id;

            switch (modalID) {
                case "clublist_create": {
                    const queryResultClub = (await sheets.get("Main!Z:Z", env.GOOGLE_SHEET_ID, env)).slice(1);
                    const queryClubIndex = queryResultClub.findIndex(row => row[0] === interaction.member.user.id);
                    const queryClub = queryResultClub.slice(queryClubIndex, queryClubIndex + 5);
                    const roleName = queryClub[1][0];
                    const roleColorParsed = queryClub[2][0];
                    const school = queryClub[3][0];
                    const club = queryClub[4][0];
                    const position = await discord.getRolePosition(env.DISCORD_ROLE_POSITION_START, env) + 1;
                    const role = await discord.createRole(roleName, position, env);
                    await discord.editRole(role.id, null, roleColorParsed, env);
                    const acronym = interaction.data.components[0].component.value;
                    var clubLink = interaction.data.components[1].component.value;
                    if (clubLink != "" && !clubLink.startsWith("https://")) {clubLink = `https://${clubLink}`;}
                    var mainContact = "";
                    const contactUserIDs = interaction.data.components[2].component.values;
                    if (contactUserIDs.length == 1) {mainContact = await discord.getUsername(contactUserIDs[0], env);}
                    if (club == "Add New Club") {throw new Error("Invalid club name!");}
                    const queryResult = (await sheets.get("Main!B:H", env.GOOGLE_SHEET_ID, env));
                    const index = queryResult.map((row, index) => row[0] == school && row[1] == club ? index : null).filter(row => row != null).at(0);
                    if (index == null) {
                        await sheets.append("Main!A:H", env.GOOGLE_SHEET_ID, [["", school, club, clubLink, mainContact, "In The Discord", role.id, acronym]], env);
                    } else {
                        await sheets.set(`Main!A${index + 2}:H${index + 2}`, env.GOOGLE_SHEET_ID, [["", school, club, clubLink, mainContact, "In The Discord", role.id, acronym]], env);
                    }
                    return await discord.ephemeralMessage([
                        {
                            type: 12,  // Media Gallery
                            items: [{media: {url: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2155149285/settings_images/b41ed6-0fd5-6f-e08a-bbcb352e6_Regions.webp"}}]
                        },
                        {
                            type: 1,  // Action Row
                            components: [
                                {
                                    type: 3,  // String Select
                                    custom_id: "region",
                                    placeholder: "Select your club's region! (May need to scroll)",
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
                        }
                    ]);
                }
            }
        }



        return discord.slashCommandReply("Error: Unsupported interaction!", env);
    } catch (err) {
        return discord.slashCommandReply(String(err), env);
    }
}


export async function handleDiscordUpdate(env: Env, ctx: ExecutionContext) {
    // clear Google sheets workspace
    const timestamp = (await sheets.get("Main!Z2:Z2", env.GOOGLE_SHEET_ID, env))[0];
    if (timestamp == null || Date.now() - timestamp[0] > 300_000) {
        await sheets.set("Main!Z2:Z999", env.GOOGLE_SHEET_ID, Array(998).fill([""]), env);
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

                // create club list channel text from query result and record club roles
                // TODO: display club roles not in google sheets and better display for clubs in discord on google sheets but dont have role
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
                    if (!row[3]) {
                        text += ` ${row[1]}`;
                        if (row[2]) {text += ` - ${row[2]}`;}
                    } else if (row[2]) {
                        text += ` ${row[1]}`;
                        text += ` - [${row[2]}](${row[3]})`;
                    } else {
                        text += ` [${row[1]}](${row[3]})`;
                    }
                    text += "\n";
                    i++;
                }
                text += `\n**GAME DEV CLUB CLUB CLUB LIST - ${i - 1} clubs and counting B)**\n\n**Use /club to get your club's role!**`;

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
