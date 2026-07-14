import * as discord from "./discord.ts";
import * as sheets from "./sheets.ts";




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

                case "club": {
                    const roleID = interaction.data.options.find(option => option.name === "role")?.value;
                    ctx.waitUntil((async () => {
                        try {
                            const roleID = interaction.data.options[0].value;
                            if (env.DISCORD_ROLE_POSITION_START === "0") {throw new Error("Missing DISCORD_ROLE_POSITION_START");}
                            if (env.DISCORD_ROLE_POSITION_END === "0") {throw new Error("Missing DISCORD_ROLE_POSITION_END");}
                            const clubRoles = (await sheets.get("Main!G:G", env.GOOGLE_SHEET_ID, env)).slice(1).map(row => row[0]);
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
                    const userID = interaction.data.options.find(option => option.name === "user")?.value;
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

                case "clublist": {
                    const runnerRoles = await discord.getRoles(interaction.member.user.id, env);
                    if (!runnerRoles.includes(env.DISCORD_ROLE_STAFF)) {return await discord.slashCommandReply(`You need <@&${env.DISCORD_ROLE_STAFF}> to use this!`, env, interaction);}
                    const subcommand = interaction.data.options[0].name;
                    const subcommandOptions = interaction.data.options[0].options;
                    switch (subcommand) {
                        case "create": {
                            const roleName = subcommandOptions.find(option => option.name === "role_name")?.value;
                            const roleColor = subcommandOptions.find(option => option.name === "role_color")?.value;
                            const school = subcommandOptions.find(option => option.name === "school")?.value;
                            const queryResult = (await sheets.get("Main!A:H", env.GOOGLE_SHEET_ID, env)).slice(1);
                            const schools = queryResult.map(row => row[1]);
                            if (schools.includes(school)) {
                                var clubs = queryResult.map(row => row[2]).filter((club, index) => schools[index] === school);
                                clubs.push("Add New Club");
                                const options = clubs.map(x => ({label: (x === "" ? school : x), value: (x === "" ? school : x)}));
                                await sheets.set("Main!Z2:Z2", env.GOOGLE_SHEET_ID, [[school]], env);
                                return await discord.modal("clublist_create_register_club", "Register Club", [
                                    {
                                        type: 18,  // Label
                                        label: "Club associated with this role",
                                        component: {
                                            type: 3,  // String Select
                                            custom_id: "club",
                                            placeholder: "Choose...",
                                            options: options
                                        }
                                    }
                                ]);
                            } else {
                                await sheets.set("Main!Z2:Z2", env.GOOGLE_SHEET_ID, [[school]], env);
                                return await discord.modal("clublist_create", "Add New Club", [
                                    {
                                        type: 18,  // Label
                                        label: "Name",
                                        description: "Club name",
                                        component: {
                                            type: 4,  // Text Input
                                            custom_id: "club_name",
                                            style: 1,  // Short
                                            placeholder: "Optional",
                                            required: false
                                        }
                                    },
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
                                            placeholder: "https://...",
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
                        }
                        case "edit": {
                            const roleID = subcommandOptions.find(option => option.name === "role")?.value;
                            const roleName = subcommandOptions.find(option => option.name === "role_name")?.value;
                            const roleColor = subcommandOptions.find(option => option.name === "role_color")?.value;
                            var region = subcommandOptions.find(option => option.name === "region")?.value;
                            var school = subcommandOptions.find(option => option.name === "school")?.value;
                            var club = subcommandOptions.find(option => option.name === "club")?.value;
                            var clubLink = subcommandOptions.find(option => option.name === "club_link")?.value;
                            var mainContact = subcommandOptions.find(option => option.name === "main_contact")?.value;
                            if (mainContact != null) {mainContact = await discord.getUsername(mainContact, env);}
                            var acronym = subcommandOptions.find(option => option.name === "acronym")?.value;
                            const rows = (await sheets.get("Main!A:H", env.GOOGLE_SHEET_ID, env)).slice(1).map((row, index) => row[6] === roleID ? [index, row] : null).filter(row => row != null);
                            if (rows.length === 0) {return await discord.slashCommandReply("WIP: 0 clubs found", env, interaction);}
                            if (rows.length > 1) {return await discord.slashCommandReply("WIP: More than 1 club found", env, interaction);}
                            const index: number = rows[0][0];
                            if (region == null) {region = rows[0][1][0];}
                            if (school == null) {school = rows[0][1][1];}
                            if (club == null) {club = rows[0][1][2];}
                            if (clubLink == null) {clubLink = rows[0][1][3];}
                            if (mainContact == null) {mainContact = rows[0][1][4];}
                            if (acronym == null) {acronym = rows[0][1][7];}
                            await sheets.set(`Main!A${index + 2}:H${index + 2}`, env.GOOGLE_SHEET_ID, [[region, school, club, clubLink, mainContact, "In The Discord", roleID, acronym]], env);
                            return await discord.slashCommandReply("Club edited successfully!", env, interaction);
                        }
                    }
                }

                case "update": {
                    await handleDiscordUpdate(env, ctx);
                    return await discord.slashCommandReply("Ran update. To make new club roles make sure they are marked as \"In The Discord\" in the Schools List Google sheet.", env, interaction);
                }

                default: {
                    return await discord.slashCommandReply(`Unknown command: /${command}`, env);
                }

            }
        }



        // MESSAGE COMPONENTS
        else if (interaction.type === 3) {
            if (!interaction.member.roles.includes(env.DISCORD_ROLE_STAFF)) {return await discord.slashCommandReply(`You need <@&${env.DISCORD_ROLE_STAFF}> to use this!`, env, interaction);}
            console.log(JSON.stringify(interaction));
            const queryResult = (await sheets.get("Main!B:C", env.GOOGLE_SHEET_ID, env)).slice(1);
            const queryResultClub = await sheets.get("Main!Z2:Z3", env.GOOGLE_SHEET_ID, env);
            const school = queryResultClub[0][0];
            const club = queryResultClub[1] != undefined ? queryResultClub[1][0] : "";
            const region = interaction.data.values[0];
            const index = queryResult.map(row => row[0] === school ? row[1] : null).findIndex(club);
            await sheets.set(`Main!A${index + 2}:A${index + 2}`, env.GOOGLE_SHEET_ID, [[region]], env)
            await discord.deleteMessage(interaction.message.id, interaction.message.chaneel_id, env);
            return await discord.slashCommandReply(`${school} - ${club} Region updated to ${region}`, env);
        }



        // MODAL SUBMISSIONS
        else if (interaction.type === 5) {
            if (!interaction.member.roles.includes(env.DISCORD_ROLE_STAFF)) {return await discord.slashCommandReply(`You need <@&${env.DISCORD_ROLE_STAFF}> to use this!`, env, interaction);}
            const modalID = interaction.data.custom_id;

            switch (modalID) {

                case "clublist_create_register_club": {
                    const school = (await sheets.get("Main!Z2:Z2", env.GOOGLE_SHEET_ID, env))[0][0];
                    const club = interaction.data.components[0].component.values[0];
                    // TODO: add something that checks if club already has role and ask user if they are sure they wish to override
                    if (club == "Add New Club") {
                    }
                    return discord.slashCommandReply(`clublist_create_register_club W.I.P. ${club}`, env);
                }

                case "clublist_create": {
                    const school = (await sheets.get("Main!Z2:Z2", env.GOOGLE_SHEET_ID, env))[0][0];
                    const club = interaction.data.components[0].component.value;
                    const acronym = interaction.data.components[1].component.value;
                    const clubLink = interaction.data.components[2].component.value;
                    var contactUserID = ""
                    if (interaction.data.components[3].component.values.length == 1) {contactUserID = interaction.data.components[3].component.values[0];}
                    if (club == "Add New Club") {throw new Error("Invalid club name!");}
                    await sheets.append("Main!A:H", env.GOOGLE_SHEET_ID, [["", school, club, clubLink, "", "In The Discord", acronym]], env);
                    await sheets.set("Main!Z2:Z3", env.GOOGLE_SHEET_ID, [[school], [club]], env);
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

                case "clublist_create_cont": {
                    const queryResultClub = (await sheets.get("Main!Z2:Z3", env.GOOGLE_SHEET_ID, env)).slice(0);
                    const school = queryResultClub[0][0];
                    const club = queryResultClub[1][0];
                    const region = interaction.data.components[1].component.values[0];
                    const queryResult = (await sheets.get("Main!B:C", env.GOOGLE_SHEET_ID, env)).slice(1);
                    const index = queryResult.map(row => row[0] == school ? row[1] : "").findIndex(club);
                    await sheets.set(`Main!A${index + 2}:A${index + 2}`, env.GOOGLE_SHEET_ID, [[region]], env);
                    return discord.slashCommandReply("Club successfully created!", env);
                }
            }
        }



        return discord.slashCommandReply("Error: Unsupported interaction!", env);
    } catch (err) {
        return discord.slashCommandReply(String(err), env);
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
                const queryResult = (await sheets.get("Main!A:H", env.GOOGLE_SHEET_ID, env)).slice(1);

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
