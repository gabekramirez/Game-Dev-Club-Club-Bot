const SLASH_COMMANDS = [
  {
    name: "getfirstcell",
    description: "Shows the value of Sheet1!A1",
  }
];





async function main() {
  const applicationId = process.argv[2];
  const token = process.argv[3];

  if (!token) throw new Error("Missing DISCORD_TOKEN");
  if (!applicationId) throw new Error("Missing DISCORD_APPLICATION_ID");

  const url = `https://discord.com/api/v10/applications/${applicationId}/commands`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${token}`,
    },
    body: JSON.stringify(SLASH_COMMANDS)
  });

  if (response.ok) {
    console.log("Registered all commands");
  } else {
    console.error("Error registering commands");
    console.error(await response.text());
  }
}


main().catch(console.error);
