# Game-Dev-Club-Club-Bot
Discord Bot for the Game Dev Club Club (GDCC - A club of game dev clubs).


## Table of Contents
- [Development Setup](#development-setup)
- [For those new to GitHub](#for-those-new-to-github)
- [Must be ran after editing slash commands to reregister them](#must-be-ran-after-editing-slash-commands-to-reregister-them)
- [USEFUL RESOURCES](#useful-resources)


## Development Setup

### STEP 0: Before following Development Setup

- Send me (@ninwu) a DM on Discord about wanting to contribute and I will give you the Google API token.
- Install the required software: [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) | [npm](https://docs.npmjs.com/cli/v9/configuring-npm/install)
- Create a [Cloudflare](https://dash.cloudflare.com/login) account and login to it

### STEP 1: Clone the GitHub repo

```shell
git clone https://github.com/gabekramirez/Game-Dev-Club-Club-Bot
cd Game-Dev-Club-Club-Bot
npm install
```

### STEP 2: Create your own Discord bot to test changes on

- Make a test server on [Discord](https://discord.com) to test your bot on
- Go to [Discord Developer Portal](https://discord.com/developers/applications)
- Click on "New Application"
- Name it something like "Dev GDCC Bot"
- Click on "Create"
- Open the [.dev.vars](/.dev.vars) file in your local repository
- Copy "Application ID" into "DISCORD_APPLICATION_ID"
- Copy "Public Key" into "DISCORD_PUBLIC_KEY"
- Go to "OAuth2" and click on "Reset Secret"
- Confirm
- Copy "Client Secret" into "DISCORD_TOKEN"
- Copy the Google API token that I gave you at the start into "GCP_SERVICE_ACCOUNT"
- Copy the Schools List Google Sheet's ID into "GOOGLE_SHEET_ID"
- Make a copy of [.dev.vars](/.dev.vars) and save it somewhere safe and secure outside your local repository so you never lose it

### STEP 3: Run the bot locally

Authorize Wrangler:
```shell
npx wrangler login
```

Deploy the bot:
```shell
npx wrangler deploy --env dev
```

- Copy the https URL that it gives you
- Go back to "General Information" in the [Discord Developer Portal](https://discord.com/developers/applications) and scroll down to "Interactions Endpoint URL"
- Paste in the https URL and type "/discord" after it
- Click "Save Changes"
- Go back to "Oath2"
- Under Scopes checkmark "Bot" and "applications.commands"
- Under Bot Permissions checkmark "Manage Roles", "Ban Members", and "Send Messages"
- Copy the "Generated URL" at the bottom
- Open it in your web browser
- Add the Discord bot to your test server

### STEP 4: Register the Discord bot's slash commands

Lastly, in your local repository run the following
```shell
npm run register
```

## For those new to GitHub

Create your own branch before making any changes (name it based on whatever you're going to work on with it):
```shell
git checkout -b your-branch-name
```

Save changes to your personal branch with:
```shell
git add .
git commit -m "your message"
git push origin your-branch-name
```

To update with other people's changes on your branch:
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
