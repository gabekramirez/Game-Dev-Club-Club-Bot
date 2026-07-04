const SLASH_COMMANDS = [
    {
        name: "club",
        description: "Get your club's role!",
        options: [
            {
                name: "club",
                description: "Your one club from #list-of-clubs | Choosing one you already have removes it",
                type: 8,
                required: true
            }
        ]
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
