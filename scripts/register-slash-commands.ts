const SLASH_COMMANDS = [
    {
        name: "club",
        description: "Get your club's role!",
        options: [
            {
                name: "role",
                description: "Your one club from #list-of-clubs | Choosing one you already have removes it",
                type: 8,
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
                type: 6,
                required: true
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
