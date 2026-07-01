# Game-Dev-Club-Club-Bot
Discord Bot for the Game Dev Club Club (GDCC - A club of game dev clubs).


## Development Setup

REQUIREMENTS: git, npm, cloudflared

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
- Put "Dev Game Dev Club Club Bot" or whatever you want as the "Name"
- Click on "Create"
- Copy "Application ID" into ["DISCORD_APPLICATION_ID"](/.dev.vars)
- Copy "Public Key" into ["DISCORD_PUBLIC_KEY"](/.dev.vars)
- Go to "OAuth2" and click on "Reset Secret"
- Confirm
- Copy "Client Secret" into ["DISCORD_TOKEN"](/.dev.vars)
- Go back to "General Information" and scroll down to "Interactions Endpoint URL"

Run the bot:
```shell
npx wrangler dev --remote
```

In a second terminal create a tunnel for Interactions Endpoint URL:
```shell
cloudflared tunnel --url http://localhost:8787
```

- Copy the URL under "Your quick Tunnel has been created!" into "Interactions Endpoint URL"
- Type "/discord" after the URL
- Click "Save Changes"
- Go back to "Oath2"
- Under Scopes checkmark "Bot" and "applications.commands"
- Under Bot Permissions checkmark "Manage Roles", "Ban Members", and "Send Messages"
- Open the "Generated URL" in your web browser and add the discord bot to a test server

NOTE: you will have to generate a new URL every time you want to test your bot

Create your own branch before making any changes:
```shell
git checkout -b your-branch-name
```

Update your personal branch:
```shell
git add .
git commit -m "your message"
git push origin your-branch-name
```

Open a pull request on [GitHub](https://github.com/gabekramirez/Game-Dev-Club-Club-Bot/compare) to request that I add your changes when you're done.


## Must be ran after editing slash commands

For development use:
```shell
npm run register
```

For production use:
```shell
node --import tsx scripts/register-discord-bot.ts --prod
```


## USEFUL RESOURCES

- GOOGLE SHEETS API ACCOUNT: https://www.datacamp.com/tutorial/google-sheets-api
- GOOGLE SHEETS API: https://medium.com/@tamnvhustcc/how-to-authenticate-google-apis-on-cloudflare-workers-in-2025-a-complete-guide-with-custom-jwt-80614398425a
- DISCORD BOT SETUP: https://docs.discord.com/developers/tutorials/hosting-on-cloudflare-workers?EwVcT9cY=9Ur0EzgkC
- DISCORD BOT RESPONSE: https://docs.discord.com/developers/interactions/receiving-and-responding
- CRON TRIGGERS: https://reintech.io/blog/setting-up-cloudflare-workers-cron-triggers
