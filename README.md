# Game-Dev-Club-Club-Bot
Discord Bot for the Game Dev Club Club (GDCC - A club of game dev clubs).


## Setup

```shell
git clone https://github.com/gabekramirez/Game-Dev-Club-Club-Bot
cd Game-Dev-Club-Club-Bot
npm install
git checkout -b feature/name-for-what-you-are-working-on
npx wrangler dev --remote
```

Use the provided staging Discord bot (do not create your own bot)

Push changes:
```shell
git add .
git commit -m "your message"
git push origin feature/name-for-what-you-are-working-on
```
Open a pull request on [GitHub](https://github.com/gabekramirez/Game-Dev-Club-Club-Bot/compare) to request that I add your changes when you're done.



## How to add a new slash command

- Open [scripts/register-discord-bot.ts](/scripts/register-discord-bot.ts)
- Add the name and discription of your new command under "// SLASH COMMMANDS" and put it in ALL_COMMANDS
- (FOR WINDOWS) Run in Command Prompt:
```shell
set DISCORD_TOKEN=INSERT SECRET DISCORD BOT TOKEN HERE
set DISCORD_APPLICATION_ID=1521670425170411590
npm run register
```
- (FOR MAC/LINUX) Run in terminal:
```shell
DISCORD_TOKEN="INSERT SECRET DISCORD BOT TOKEN HERE" \
DISCORD_APPLICATION_ID="1521670425170411590" \
npm run register
```
- Then open [src/discord.ts](/src/discord.ts)
- Add the response to the command under "// SLASH COMMMANDS"


## USEFUL RESOURCES

- GOOGLE SHEETS API: https://medium.com/@tamnvhustcc/how-to-authenticate-google-apis-on-cloudflare-workers-in-2025-a-complete-guide-with-custom-jwt-80614398425a
- DISCORD BOT SETUP: https://docs.discord.com/developers/tutorials/hosting-on-cloudflare-workers?EwVcT9cY=9Ur0EzgkC
- DISCORD BOT RESPONSE: https://docs.discord.com/developers/interactions/receiving-and-responding
- CRON TRIGGERS: https://reintech.io/blog/setting-up-cloudflare-workers-cron-triggers
