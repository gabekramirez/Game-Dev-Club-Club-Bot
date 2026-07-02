# Game-Dev-Club-Club-Bot
Discord Bot for the Game Dev Club Club (GDCC - A club of game dev clubs).


## Table of Contents
- [Development Setup](#development-setup)
- [For those new to GitHub](#for-those-new-to-github)
- [Must be ran after editing slash commands to reregister them](#must-be-ran-after-editing-slash-commands-to-reregister-them)
- [USEFUL RESOURCES](#useful-resources)


## Development Setup

Before following Development Setup, send me (@ninwu) a DM on Discord about wanting to contribute and I will give you the Google API token.

INSTALL REQUIRED SOFTWARE: [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) [npm](https://docs.npmjs.com/cli/v9/configuring-npm/install) [cloudflared](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/)

Clone the GitHub repo:
```shell
git clone https://github.com/gabekramirez/Game-Dev-Club-Club-Bot
cd Game-Dev-Club-Club-Bot
npm install
```

Create your own Discord bot to test changes on:
- Make a test server on [Discord](https://discord.com) to test your bot on
- Go to [Discord Developer Portal](https://discord.com/developers/applications)
- Click on "New Application"
- Put "Dev Game Dev Club Club Bot" or whatever you want as the name
- Click on "Create"
- Open the [.dev.vars](/.dev.vars) file in your local repository
- Copy "Application ID" into "DISCORD_APPLICATION_ID"
- Copy "Public Key" into "DISCORD_PUBLIC_KEY"
- Go to "OAuth2" and click on "Reset Secret"
- Confirm
- Copy "Client Secret" into "DISCORD_TOKEN"
- Copy the Google API token that I gave you at the start into "GCP_SERVICE_ACCOUNT"
- Copy the Schools List Google Sheet's ID into "GOOGLE_SHEET_ID"
- Go back to "General Information" in the [Discord Developer Portal](https://discord.com/developers/applications) and scroll down to "Interactions Endpoint URL"

Run the bot in your local repository:
```shell
npx wrangler dev --remote
```

Make sure it says "Ready on http://127.0.0.1:8787" before continuing.

In a second terminal create a tunnel for Interactions Endpoint URL:
```shell
cloudflared tunnel --url http://localhost:8787
```

NOTE: This next step can be pretty finicky.
If you keep getting `Validation errors: interactions_endpoint_url: The specified interactions endpoint url could not be verified.` then close all of your terminals and start over from "Run the bot in your local repository"

- Copy the URL under "Your quick Tunnel has been created!" into "Interactions Endpoint URL"

- Type "/discord" after the URL
- Click "Save Changes"
- Go back to "Oath2"
- Under Scopes checkmark "Bot" and "applications.commands"
- Under Bot Permissions checkmark "Manage Roles", "Ban Members", and "Send Messages"
- Open the "Generated URL" in your web browser and add the discord bot to a test server

NOTE: you will have to generate a new URL every time you want to test your bot

Lastly open a third terminal and run the following in your local repository to register the Discord bot's slash commands:
```shell
npm run register
```

## For those new to GitHub

Create your own branch before making any changes:
```shell
git checkout -b your-branch-name
```

Save changes to your personal branch with:
```shell
git add .
git commit -m "your message"
git push origin your-branch-name
```

Open a pull request on [GitHub](https://github.com/gabekramirez/Game-Dev-Club-Club-Bot/compare) to request that I add your changes when you're done.


## Must be ran after editing slash commands to reregister them

For development use:
```shell
npm run register
```

For production use (likely only going to be used by me):
```shell
node --import tsx scripts/register-discord-bot.ts --prod
```


## USEFUL RESOURCES

- GOOGLE SHEETS API ACCOUNT: https://www.datacamp.com/tutorial/google-sheets-api
- GOOGLE SHEETS API: https://medium.com/@tamnvhustcc/how-to-authenticate-google-apis-on-cloudflare-workers-in-2025-a-complete-guide-with-custom-jwt-80614398425a
- DISCORD BOT SETUP: https://docs.discord.com/developers/tutorials/hosting-on-cloudflare-workers?EwVcT9cY=9Ur0EzgkC
- DISCORD BOT RESPONSE: https://docs.discord.com/developers/interactions/receiving-and-responding
- CRON TRIGGERS: https://reintech.io/blog/setting-up-cloudflare-workers-cron-triggers
