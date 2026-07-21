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


async function isClubRole(roleID: string, env: Env): Promise<boolean> {
    const position = await discord.getRolePosition(roleID, env);
    return (roleID != null &&
            position > (await discord.getRolePosition(env.DISCORD_ROLE_POSITION_START, env)) &&
            position < (await discord.getRolePosition(env.DISCORD_ROLE_POSITION_END, env)));
}


async function setWorkspace(userID: string, values: any[], env: Env) {
    console.log(values);
    values = [userID, values.length].concat(values).map(value => [value]);
    await sheets.set("Main!Z2:Z2", env.GOOGLE_SHEET_ID, [[Date.now()]], env);
    const queryResultClub = (await sheets.get("Main!Z:Z", env.GOOGLE_SHEET_ID, env)).slice(1);
    const queryClubIndex = queryResultClub.findIndex(row => row[0] === userID);
    if (queryClubIndex != -1) {
        const length = queryResultClub[queryClubIndex + 1][0];
        await sheets.set(`Main!Z${queryClubIndex}:Z${queryClubIndex + length + 2}`, env.GOOGLE_SHEET_ID, Array(length).fill([""]), env);
    }
    await sheets.append("Main!Z:Z", env.GOOGLE_SHEET_ID, values, env);
}


async function getWorkspace(userID: string, length: number, env: Env): Promise<any[]> {
    const queryResultClub = (await sheets.get("Main!Z:Z", env.GOOGLE_SHEET_ID, env)).slice(1);
    const queryClubIndex = queryResultClub.findIndex(row => row[0] === userID);
    const queryClub = queryResultClub.slice(queryClubIndex + 2, queryClubIndex + length + 2).map(row => row == undefined ? null : row[0]);
    return queryClub;
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
                            if (roleColorParsed == null) {return await discord.slashCommandReply(`"${roleColor}" is not a valid hex color.`, env, interaction);}
                            // check if club already has a role
                            const queryResult = (await sheets.get("Main!B:H", env.GOOGLE_SHEET_ID, env));
                            const index = queryResult.map((row, index) => row[0] == school && row[1] == club ? index : null).filter(row => row != null).at(0);
                            if (index != null) {return await discord.slashCommandReply(`Club is already associated with role <@&${queryResult[index][5]}> - Did you mean to use "/clublist edit" ?`, env, interaction);}
                            await setWorkspace(interaction.member.user.id, [roleName, roleColorParsed, school, club], env);
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
                            if (roleColor != null && roleColorParsed == null) {return await discord.slashCommandReply(`"${roleColor}" is not a valid hex color.`, env, interaction);}
                            const roleFound = (await discord.getAllRoles(env)).find(role => role.name === roleName && role.id !== roleID);
                            if (roleFound != null) {return await discord.slashCommandReply(`<@&${roleFound.id}> already exists.`, env, interaction);}
                            await discord.editRole(roleID, roleName, roleColorParsed, env);
                            const role = await discord.getRole(roleID, env);
                            const rows = (await sheets.get("Main!A:H", env.GOOGLE_SHEET_ID, env)).slice(1).map((row, index) => row[6] === roleID ? [index, row] : null).filter(row => row != null);
                            if (rows.length === 0) {  // role isn't registered to any clubs
                                await setWorkspace(interaction.member.user.id, [role.name, role.color ?? "", "", "", "", "", ""], env);
                                return await discord.modal("clublist_create", "Add New Club", [
                                    {
                                        type: 18,
                                        label: "School",
                                        component: {
                                            type: 4,
                                            custom_id: "school",
                                            style: 1
                                        }
                                    },
                                    {
                                        type: 18,
                                        label: "Club Name",
                                        component: {
                                            type: 4,
                                            custom_id: "club_name",
                                            style: 1
                                        }
                                    },
                                    {
                                        type: 18,
                                        label: "Acronym",
                                        description: "Acronym to put at the end of usernames",
                                        component: {
                                            type: 4,
                                            custom_id: "acronym",
                                            style: 1,
                                            required: false
                                        }
                                    },
                                    {
                                        type: 18,
                                        label: "Link",
                                        description: "Club website",
                                        component: {
                                            type: 4,
                                            custom_id: "club_link",
                                            style: 1,
                                            required: false
                                        }
                                    },
                                    {
                                        type: 18,
                                        label: "Main Contact",
                                        component: {
                                            type: 5,
                                            custom_id: "contact",
                                            required: false
                                        }
                                    }
                                ]);
                            } else {
                                const clubs = rows.map(row => row[1][2]);
                                clubs.push("__CREATE_NEW__");
                                return await discord.ephemeralMessage([
                                    {
                                        type: 10,
                                        content: "Select which club to edit or create a new club"
                                    },
                                    {
                                        type: 1,
                                        components: [
                                            {
                                                type: 3,
                                                custom_id: "clublist_edit_select_club",
                                                placeholder: "Choose a club...",
                                                options: clubs.map(club => ({
                                                    label: club === "__CREATE_NEW__" ? "Create New Club" : club,
                                                    value: club
                                                }))
                                            }
                                        ]
                                    }
                                ]);
                            }
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
            switch (interaction.data.custom_id) {
                case "region": {
                    const queryResult = (await sheets.get("Main!B:C", env.GOOGLE_SHEET_ID, env)).slice(1);
                    const queryClub = await getWorkspace(interaction.member.user.id, 5, env);
                    const school = queryClub[2];
                    const club = queryClub[3] != null ? queryClub[3] : "";
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
                case "clublist_edit_select_club": {
                    const club = interaction.data.values[0];
                    const queryClub = await getWorkspace(interaction.member.user.id, 5, env);
                    const roleName = queryClub[0];
                    const roleColor = queryClub[1];
                    const school = queryClub[2];
                    const queryResult = (await sheets.get("Main!A:H", env.GOOGLE_SHEET_ID, env)).slice(1);
                    const index = queryResult.findIndex(row => row[1] === school && row[2] === club);
                    var acronym = "";
                    var clubLink = "";
                    if (index != -1) {
                        if (queryResult[index][7] != null) {acronym = queryResult[index][7];}
                        if (queryResult[index][3] != null) {clubLink = queryResult[index][3];}
                    }
                    if (club === "__CREATE_NEW__") {
                        await setWorkspace(interaction.member.user.id, [roleName, roleColor, school, club, "", "", ""], env);
                        return await discord.modal("clublist_create", "Add New Club", [
                            {
                                type: 18,
                                label: "School",
                                component: {
                                    type: 4,
                                    custom_id: "school",
                                    style: 1
                                }
                            },
                            {
                                type: 18,
                                label: "Club Name",
                                component: {
                                    type: 4,
                                    custom_id: "club_name",
                                    style: 1,
                                    required: false
                                }
                            },
                            {
                                type: 18,
                                label: "Acronym",
                                component: {
                                    type: 4,
                                    custom_id: "acronym",
                                    style: 1,
                                    required: false
                                }
                            },
                            {
                                type: 18,
                                label: "Link",
                                component: {
                                    type: 4,
                                    custom_id: "club_link",
                                    style: 1,
                                    required: false
                                }
                            },
                            {
                                type: 18,
                                label: "Main Contact",
                                component: {
                                    type: 5,
                                    custom_id: "contact",
                                    required: false
                                }
                            }
                        ]);
                    } else {
                        await setWorkspace(interaction.member.user.id, [roleName, roleColor, school, club, "", "", ""], env);
                        return await discord.modal("clublist_edit", "Edit Club", [
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
                                description: "Leave blank to use the school name",
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
                                description: "Acronym to append to members' usernames",
                                component: {
                                    type: 4,
                                    custom_id: "acronym",
                                    style: 1,
                                    value: acronym,
                                    required: false
                                }
                            },
                            {
                                type: 18, // Label
                                label: "Link",
                                description: "https:// link associated with the club",
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
                                description: "Select the club's primary contact",
                                component: {
                                    type: 5, // User Select
                                    custom_id: "contact",
                                    required: false
                                }
                            }
                        ]);
                    }
                }
            }
        }



        // MODAL SUBMISSIONS
        else if (interaction.type === 5) {
            if (!interaction.member.roles.includes(env.DISCORD_ROLE_STAFF)) {return await discord.slashCommandReply(`You need <@&${env.DISCORD_ROLE_STAFF}> to use this!`, env, interaction);}
            const modalID = interaction.data.custom_id;

            switch (modalID) {
                case "clublist_create": {
                    const queryClub = await getWorkspace(interaction.member.user.id, 4, env);
                    const roleName = queryClub[0];
                    const roleColorParsed = queryClub[1];
                    const school = queryClub[2];
                    const club = queryClub[3];
                    if (roleName == null || school == null || club == null || club === "Add New Club") {throw new Error("Invalid workspace data!");}
                    const position = await discord.getRolePosition(env.DISCORD_ROLE_POSITION_START, env) + 1;
                    const role = await discord.createRole(roleName, position, env);
                    await discord.editRole(role.id, null, roleColorParsed, env);
                    const acronym = interaction.data.components.find(component => component.component.custom_id === "acronym")?.component.value ?? "";
                    let clubLink = interaction.data.components.find(component => component.component.custom_id === "club_link")?.component.value ?? "";
                    if (clubLink != "" && !clubLink.startsWith("https://")) {clubLink = `https://${clubLink}`;}
                    var mainContact = "";
                    const contactUserIDs = interaction.data.components.find(component => component.component.custom_id === "contact")?.component.values ?? [];
                    if (contactUserIDs.length == 1) {mainContact = await discord.getUsername(contactUserIDs[0], env);}
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
                case "clublist_edit": {
                    // get workspace
                    const queryClub = await getWorkspace(interaction.member.user.id, 7, env);
                    const school = queryClub[2];
                    const club = queryClub[3];
                    // read modal values
                    const newSchool = interaction.data.components.find(c => c.component.custom_id === "school")?.component.value ?? school;
                    const newClub = interaction.data.components.find(c => c.component.custom_id === "club_name")?.component.value ?? club;
                    const acronym = interaction.data.components.find(c => c.component.custom_id === "acronym")?.component.value ?? queryClub[6];
                    let clubLink = interaction.data.components.find(c => c.component.custom_id === "club_link")?.component.value ?? queryClub[4];
                    const contactIDs = interaction.data.components.find(c => c.component.custom_id === "contact")?.component.values ?? [];
                    let contact = queryClub[5];
                    if (contactIDs.length === 1) {contact = await discord.getUsername(contactIDs[0], env);}
                    // find the sheet row
                    const queryResult = (await sheets.get("Main!A:H", env.GOOGLE_SHEET_ID, env)).slice(1);
                    const index = queryResult.findIndex(row => row[1] === school && row[2] === club);
                    // update
                    if (index === -1) {
                        const roleName = queryClub[0];
                        console.log(JSON.stringify(await discord.getAllRoles(env)));
                        const role = (await discord.getAllRoles(env)).find(r => r.name === roleName);
                        console.log(roleName);
                        console.log(role);
                        if (!role) {throw new Error("Role not found.");}
                        await sheets.append("Main!A:H", env.GOOGLE_SHEET_ID, [["", newSchool, newClub, clubLink, contact, "In The Discord", role.id, acronym]], env);
                    } else {
                        await sheets.set(`Main!A${index + 2}:H${index + 2}`, env.GOOGLE_SHEET_ID, [[queryResult[index][0], newSchool, newClub, clubLink, contact, queryResult[index][5], queryResult[index][6], acronym]], env);
                    }
                    return await discord.slashCommandReply("Updated club successfully!", env, interaction);
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
                const positionStart = await discord.getRolePosition(env.DISCORD_ROLE_POSITION_START, env);
                const positionEnd = await discord.getRolePosition(env.DISCORD_ROLE_POSITION_END, env);
                var clubRoles = (await discord.getAllRoles(env)).filter(role => positionStart < role.position && role.position < positionEnd).map(role => role.id);

                // create club list channel text from query result and record club roles
                // TODO: display club roles not in google sheets and better display for clubs in discord on google sheets but dont have role
                var text: string = "";
                var i = 1;
                for (const row of queryResult) {
                    if (row[5] != "In The Discord") {
                        clubs.push(null);
                        roles.push(null);
                        continue;
                    };
                    text += `${i}.`;
                    if (row[6]) {
                        text += ` <@&${row[6]}>`;
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
                        text += ` - [${row[2]}](${row[3]})`;
                    } else {
                        text += ` [${row[1]}](${row[3]})`;
                    }
                    text += "\n";
                    if (!row?.[1]) {
                        clubs.push(null);
                        roles.push(null);
                    } else {
                        clubs.push(row[1]);
                        roles.push(row[6]);
                        clubRoles = clubRoles.filter(roleID => roleID != row[6]);
                    }
                    i++;
                }
                for (const roleID of clubRoles) {
                    text += `${i}. <@&${roleID}> [MISSING CLUB]\n`;
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
