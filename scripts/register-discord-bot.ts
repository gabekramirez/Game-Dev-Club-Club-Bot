// SLASH COMMANDS
const GET_FIRST_CELL_COMMAND = {
  name: "getfirstcell",
  description: "Shows the value of Sheet1!A1",
};
const ALL_COMMANDS = [GET_FIRST_CELL_COMMAND];





async function main() {
  const token = process.env.DISCORD_TOKEN;
  const applicationId = process.env.DISCORD_APPLICATION_ID;

  if (!token) throw new Error("Missing DISCORD_TOKEN");
  if (!applicationId) throw new Error("Missing DISCORD_APPLICATION_ID");

  const url = `https://discord.com/api/v10/applications/${applicationId}/commands`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${token}`,
    },
    body: JSON.stringify(ALL_COMMANDS)
  });

  if (response.ok) {
    console.log("Registered all commands");
  } else {
    console.error("Error registering commands");
    console.error(await response.text());
  }
}


main().catch(console.error);
