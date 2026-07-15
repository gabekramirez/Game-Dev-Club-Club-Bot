const SLASH_COMMANDS = [
    {
        name: "club",
        description: "Get your club's role!",
        options: [
            {
                name: "role",
                description: "Your one club from #list-of-clubs | Choosing one you already have removes it",
                type: 8,  // ROLE
                required: true
            }
        ]
    },
    {
        name: "staff",
        description: "Give others the Staff Staff role",
        default_member_permissions: "268435456",  // they need Manage Roles permission to see the command
        options: [
            {
                name: "user",
                description: "User to give the Staff Staff role",
                type: 6,  // USER
                required: true
            }
        ]
    },
    {
        name: "clublist",
        description: "Manage list of clubs",
        default_member_permissions: "268435456",
        options: [
            {
                type: 1,
                name: "create",
                description: "Create a new club role",
                options: [
                    {
                        type: 3,  // STRING
                        name: "role_name",
                        description: "Role name",
                        required: true
                    },
                    {
                        type: 3,  // STRING
                        name: "role_color",
                        description: "Color for your club's role",
                        required: true
                    },
                    {
                        type: 3,  // STRING
                        name: "school",
                        description: "School from database",
                        required: true
                    },
                    {
                        type: 3,  // STRING
                        name: "club_name",
                        description: "Club name",
                        required: true
                    }
                ]
            },
            {
                type: 1,
                name: "edit",
                description: "Edit an existing club role",
                options: [
                    {
                        type: 8,  // ROLE
                        name: "role",
                        description: "Club role to edit",
                        required: true
                    },
                    {
                        type: 3,  // STRING
                        name: "role_name",
                        description: "Club role name"
                    },
                    {
                        type: 3,  // STRING
                        name: "role_color",
                        description: "Color for your club's role"
                    },
                    {
                        type: 3,  // STRING
                        name: "school",
                        description: "School from database"
                    },
                    {
                        type: 3,  // STRING
                        name: "club",
                        description: "Club name"
                    },
                    {
                        type: 3,  // STRING
                        name: "club_link",
                        description: "https link to associate with the club"
                    },
                    {
                        type: 6,  // USER
                        name: "main_contact",
                        description: "Club's main contact"
                    },
                    {
                        type: 3,  // STRING
                        name: "acronym",
                        description: "Acronym to put at the end of club members' usernames"
                    },
                    {
                        type: 3,  // STRING
                        name: "region",
                        description: "Region that the school is in",
                        choices: [
                            {
                                name: "Other",
                                value: "Other"
                            },
                            {
                                name: "Northeast",
                                value: "Northeast"
                            },
                            {
                                name: "Southeast",
                                value: "Southeast"
                            },
                            {
                                name: "Midwest",
                                value: "Midwest"
                            },
                            {
                                name: "West",
                                value: "West"
                            },
                            {
                                name: "Southwest",
                                value: "Southwest"
                            }
                        ]
                    }

                ]
            }
        ]
    },
    {
        name: "update",
        description: "Force a server update to run",
        default_member_permissions: "268435456"  // they need Manage Roles permission to see the command
    }
];





async function main() {
    const token = process.argv[2];
    const applicationId = process.argv[3];

    if (!token) throw new Error("Missing Discord Token");
    if (!applicationId) throw new Error("Missing Discord Application ID");

    const response = await fetch(`https://discord.com/api/v10/applications/${applicationId}/commands`, {
        method: "PUT",
        headers: {"Content-Type": "application/json", Authorization: `Bot ${token}`},
        body: JSON.stringify(SLASH_COMMANDS)
    });
    if (!response.ok) {throw new Error(await response.text());}
    console.log("Registered all commands");
}


main().catch(console.error);
