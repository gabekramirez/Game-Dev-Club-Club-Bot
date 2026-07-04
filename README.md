# Game-Dev-Club-Club-Bot

Discord Bot for the Game Dev Club Club (GDCC - A club of game dev clubs).

This Discord Bot runs remotely on a Cloudflare Worker that automatically updates with this GitHub repo SAFELY for FREE with NO ADS!


## Table of Contents

- [Development Setup](#development-setup)
- [For those new to GitHub](#for-those-new-to-github)
- [USEFUL RESOURCES](#useful-resources)


## Development Setup

### STEP 0: Before following Development Setup

- Send me (@ninwu) a DM on Discord about wanting to contribute and I will give you the Google API token.
- Install the required software: [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) | [npm](https://docs.npmjs.com/cli/v9/configuring-npm/install)
- Create a [Cloudflare](https://dash.cloudflare.com/login) account and login to it.

### STEP 1: Clone the GitHub repo

```shell
git clone https://github.com/gabekramirez/Game-Dev-Club-Club-Bot
cd Game-Dev-Club-Club-Bot
npm install
```

### STEP 2: Create Cloudflare Worker

Authorize Wrangler:
```shell
npx wrangler login
```

Deploy Worker:
```shell
npx wrangler deploy --env dev
```

NOTE: You will have to redo this step to update your worker

### STEP 3: Create Discord Bot

- Make a test server on [Discord](https://discord.com) to test your bot on
- Go to [Discord Developer Portal](https://discord.com/developers/applications)
- Click on "New Application"
- Name it something like "Dev GDCC Bot"
- Click on "Create"

### STEP 4: Set up APIs

- In a new tab go to [Cloudflare](https://dash.cloudflare.com)
- Click on "dev-gdcc-bot" in "Workers and Pages"
- Click on "Settings"
- Click on "Add" in Variables and secrets
- Add the following variables:

```
Type      Variable name

Text      DISCORD_APPLICATION_ID
Text      DISCORD_PUBLIC_KEY
Secret    DISCORD_TOKEN
Text      DISCORD_CLUB_LIST_CHANNEL_ID
Text      DISCORD_GUILD_ID
Secret    DISCORD_NEW_ROLE_POSITION
Secret    GCP_SERVICE_ACCOUNT
Secret    GOOGLE_SHEET_ID
```

- Next copy the following values from the Discord Developer Portal into the variables you just made
- Copy "Application ID" into "DISCORD_APPLICATION_ID"
- Copy "Public Key" into "DISCORD_PUBLIC_KEY"
- Go to "Bot" and click on "Reset Token"
- Confirm
- Copy into "DISCORD_TOKEN"
- Save this Discord bot token somewhere safe and private where you won't lose it (NOT THE REPO)
- Type into DISCORD_CLUB_LIST_CHANNEL_ID the Channel ID of the club list in your test server (or 0 for none)
- Type into DISCORD_GUILD_ID the Server ID in your test server (or 0 for none)
- Type into DISCORD_NEW_ROLE_POSITION the Role ID of the role to insert new club roles above in your test server (or 0 for none)
- Copy the Google API token that I gave you at the start into "GCP_SERVICE_ACCOUNT"
- Copy the Schools List Google Sheet's ID into "GOOGLE_SHEET_ID" (part of the URL after "spreadsheets/d/" and before the next "/" after that)
- Click on "Deploy"
- Click on "Visit"
- Copy the URL at the top
- Go back to "General Information" in the [Discord Developer Portal](https://discord.com/developers/applications)
- Scroll down to "Interactions Endpoint URL"
- Paste in the URL that you copied earlier and type "/discord" after it
- Click "Save Changes"
- Go back to "Oath2"
- Under "Scopes" checkmark "bot" and "applications.commands"
- Under "Bot Permissions" checkmark "Manage Roles", "Ban Members", "Manage Webhooks", and "Send Messages"
- Copy the "Generated URL" at the bottom
- Open it in your web browser
- Add the Discord Bot to your test server

### STEP 5: Register the Discord Bot's slash commands

Run to get slash commands:
```shell
npx tsx scripts/register-slash-commands.ts InsertDiscordBotTokenHere InsertDiscordBotApplicationIDHere
```
Go to 

NOTE: You will have to redo this whenever you want to update slash commands

### DEBUGGING

Run this to see console logs
```shell
npx wrangler tail --env dev
```


## For those new to GitHub

Create your own branch before making any changes (name it based on whatever you're going to work on with it):
```shell
git checkout -b your-branch-name
```

Publish changes on your personal branch to GitHub with:
```shell
git add .
git commit -m "your message"
git push origin your-branch-name
```

To update your branch with other's changes made to it on GitHub:
```shell
git fetch origin
git rebase origin/your-branch-name
```

If you get "error: failed to push some refs" run:
```shell
git pull --rebase origin your-branch-name
git push origin your-branch-name
```

Open a pull request on [GitHub](https://github.com/gabekramirez/Game-Dev-Club-Club-Bot/compare) to request that I add your changes when you're done.


## USEFUL RESOURCES

- GOOGLE SHEETS ACCOUNT: https://www.datacamp.com/tutorial/google-sheets-api
- GOOGLE SHEETS AUTHENTICATION: https://medium.com/@tamnvhustcc/how-to-authenticate-google-apis-on-cloudflare-workers-in-2025-a-complete-guide-with-custom-jwt-80614398425a
- GOOGLE SHEETS API: https://developers.google.com/workspace/sheets/api/guides/concepts
- DISCORD BOT SETUP: https://docs.discord.com/developers/tutorials/hosting-on-cloudflare-workers?EwVcT9cY=9Ur0EzgkC
- DISCORD BOT INTERACTING: https://docs.discord.com/developers/interactions/receiving-and-responding
- DISCORD BOT MESSAGING: https://docs.discord.com/developers/resources/channel
- DISCORD BOT WEBHOOKS: https://pinggy.io/blog/how_to_set_up_and_test_discord_bot_webhook
- CRON TRIGGERS: https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled
