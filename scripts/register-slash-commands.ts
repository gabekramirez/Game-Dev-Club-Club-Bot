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
        description: "Add or remove a club role!",
        options: [
            {
                name: "role",
                description: "Club role from #list-of-clubs",
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
        description: "Edit your club's information",
        default_member_permissions: "268435456"  // they need Manage Roles permission to see the command
    },
    {
        name: "update",
        description: "Discord Bot Update (This is automatically ran once every hour)",
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
