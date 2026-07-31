const SLASH_COMMANDS = [
    // {
    //     name: "deleteroles",
    //     description: "Delete all club roles (for dev debug purposes only!!!)",
    //     options: [
    //         {
    //             name: "limit",
    //             description: "Max number of roles to try deleting in one go",
    //             type: 4,  // INTEGER
    //             required: true
    //         }
    //     ]
    // },
    {
        name: "club",
        description: "Get your club roles! (Maximum of 3 - Leave blank for none)",
        options: [
            {
                name: "role1",
                description: "Your club's role from #list-of-clubs",
                type: 8,  // ROLE
            },
            {
                name: "role2",
                description: "Your club's role from #list-of-clubs",
                type: 8,  // ROLE
            },
            {
                name: "role3",
                description: "Your club's role from #list-of-clubs",
                type: 8,  // ROLE
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
        description: "Edit your club's information",
        default_member_permissions: "268435456"  // they need Manage Roles permission to see the command
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
    console.log("Registered all commands!");
}


main().catch(console.error);
