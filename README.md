# Game-Dev-Club-Club-Bot

Discord Bot for the Game Dev Club Club (GDCC), a club of game development clubs

The bot runs remotely on a Cloudflare Worker and is automatically deployed from this GitHub repository at *no cost*



## Table of Contents

- [Development Environment Setup](#development-environment-setup)
  - [1. Prerequisites](#1-prerequisites)
  - [2. Clone the GitHub Repository](#2-clone-the-github-repository)
  - [3. Create Cloudflare Worker](#3-create-cloudflare-worker)
  - [4. Create Discord Bot](#4-create-discord-bot)
  - [5. Configure APIs](#5-configure-apis)
  - [6. Register the Discord Bot's slash commands](#6-register-the-discord-bots-slash-commands)
- [Debugging](#debugging)
- [For those new to GitHub](#for-those-new-to-github)
  - [1. Create your own branch](#1-create-your-own-branch)
  - [2. Save your work](#2-save-your-work)
  - [3. Keep your branch up to date](#3-keep-your-branch-up-to-date)
  - [4. If Git says "failed to push some refs"](#4-if-git-says-failed-to-push-some-refs)
  - [5. Open a Pull Request](#5-open-a-pull-request)
- [Useful Resources](#useful-resources)
  - [1. Cloudflare](#1-cloudflare)
  - [2. Discord](#2-discord)
  - [3. Google Sheets](#3-google-sheets)



## Development Environment Setup

### 1. Prerequisites

- Send me (@ninwu) a DM on Discord about wanting to contribute and I will invite you to be a collaborator on this repo and send you the service account JSON
- Install the required software: [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) | [npm](https://docs.npmjs.com/cli/v9/configuring-npm/install)
- Create a [Cloudflare](https://dash.cloudflare.com/login) account and login to it
- Make a copy of the Schools List Google sheet for testing and share it with editor access to `game-dev-club-club-bot@game-dev-club-club-bot.iam.gserviceaccount.com`

### 2. Clone the GitHub Repository

Open a terminal, navigate to the directory where you'd like to clone the repository, and run the following:
```shell
git clone https://github.com/gabekramirez/Game-Dev-Club-Club-Bot
cd Game-Dev-Club-Club-Bot
npm install
```

> **Tip:** Whenever you pull changes from GitHub, it is good to run `npm install` again in case any dependencies have changed

### 3. Create Cloudflare Worker

Authorize Wrangler:
```shell
npx wrangler login
```

Deploy Worker:
```shell
npx wrangler deploy --env dev
```

> **Note:** You will have to rerun the shell command above every time you wish to update your worker with new code

### 4. Create Discord Bot

- Make a test server on [Discord](https://discord.com) to test your bot on
- Go to [Discord Developer Portal](https://discord.com/developers/applications)
- Click on `New Application`
- Name it `Dev GDCC Bot`
- Click on `Create`

### 5. Configure APIs

- In a *new* tab go to [Cloudflare](https://dash.cloudflare.com)
  - Click on `dev-gdcc-bot` under `Workers and Pages`
  - Click on `Settings`
  - Click on `Add` in `Variables and secrets`
  - Add the following variables:

```
Type      Variable name

Text      DISCORD_APPLICATION_ID
Text      DISCORD_PUBLIC_KEY
Secret    DISCORD_TOKEN
Text      DISCORD_GUILD_ID
Text      DISCORD_CLUB_LIST_CHANNEL_ID
Text      DISCORD_ROLE_POSITION_START
Text      DISCORD_ROLE_POSITION_END
Text      DISCORD_ROLE_AUTO_BAN
Secret    GCP_SERVICE_ACCOUNT
Secret    GOOGLE_SHEET_ID
```

- Next we'll fill out the variables you just made
- From your [Discord Developer Portal](https://discord.com/developers/applications) tab:
  - Copy `Application ID` into `DISCORD_APPLICATION_ID`
  - Copy `Public Key` into `DISCORD_PUBLIC_KEY`
  - Go to `Bot` and click on `Reset Token`
  - Confirm
  - Copy the token that it gives you into `DISCORD_TOKEN`
  - Save the Discord bot token somewhere safe and private where you won't lose it
  - Scroll down and checkmark `Server Members Intent`
- Go to the [Discord](https://discord.com) test server you made and from it:
  - Copy the Server ID into `DISCORD_GUILD_ID` (or 0 for none)
  - Copy the Channel ID of your club list channel into `DISCORD_CLUB_LIST_CHANNEL_ID` (or 0 for none)
  - Copy the Role ID of the role to insert new club roles above into `DISCORD_ROLE_POSITION_START` (or 0 for none)
  - Copy the Role ID of the role above all of the club roles into `DISCORD_ROLE_POSITION_END` (or 0 for none)
  - Copy the Role ID of the `Auto Ban` role into `DISCORD_ROLE_AUTO_BAN` (or 0 for none)
- Finally:
  - Copy the Google API JSON that I gave you at the start into `GCP_SERVICE_ACCOUNT`
  - Copy the ID of the Google Sheet you made for testing (part of the URL after `spreadsheets/d/` and before the next `/` after that) into `GOOGLE_SHEET_ID`
- In [Cloudflare](https://dash.cloudflare.com)
  - Click on `Deploy`
  - Click on `Visit`
  - Copy the URL of the page that it takes you to from your web browser's address bar
- Go back to `General Information` in the [Discord Developer Portal](https://discord.com/developers/applications)
  - Scroll down to `Interactions Endpoint URL`
  - Paste in the URL that you copied earlier and type `/discord` after it
  - Click `Save Changes`
  - Go back to `Oath2`
  - Under `Scopes` checkmark `bot` and `applications.commands`
  - Under `Bot Permissions` checkmark `Manage Roles`, `Ban Members`, `Manage Webhooks`, and `Send Messages`
  - Copy the `Generated URL` at the bottom
  - Open the generated URL in your web browser
  - Authorize the bot and add it to your test server

### 6. Register the Discord Bot's slash commands

Run this in the directory of your local repository to get slash commands from the bot working on your testing server:
```shell
npx tsx scripts/register-slash-commands.ts InsertDiscordBotTokenHere InsertDiscordBotApplicationIDHere
```

> **Warning:** Replace the placeholder values before running this command

> **Note:** You will have to redo this whenever you want to update slash commands



## Debugging

Run this to see console logs
```shell
npx wrangler tail --env dev
```



## For those new to GitHub

### 1. Create your own branch

Before making any changes, create a branch for the feature or bug you're
working on:
```shell
git checkout main
git pull origin main
git checkout -b your-branch-name
git push -u origin your-branch-name
```

> **Tip:** Give your branch a descriptive name, such as `add-role-command` or `fix-modal-bug`
>
> If your branch is for a specific GitHub issue, it's common to include the issue number in the branch name, for example: `42-add-role-command` or `issue-42-fix-modal-bug`

### 2. Save your work

Commit your changes and push them to your branch on GitHub
```shell
git add .
git commit -m "Describe your changes"
git push
```

> **Note:** You're able to use `git push` here instead of
specifying the branch name because of the `-u` flag from before

### 3. Keep your branch up to date

If other people have pushed changes to your branch, update your local
copy with:
```shell
git pull --rebase
```

If you want to incorporate the latest changes from `main` into your
branch:
```shell
git fetch origin
git rebase origin/main
```

### 4. If Git says "failed to push some refs"

This means that your local branch is behind the version on GitHub

Update it, then push again:
```shell
git pull --rebase
git push
```

### 5. Open a Pull Request

When you're finsished with your feature or fix, open a pull request on GitHub so your changes can
be reviewed and merged into the project:

https://github.com/gabekramirez/Game-Dev-Club-Club-Bot/compare



## Useful Resources

### 1. Cloudflare
- Cron Triggers: https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled

### 2. Discord
- Setup: https://docs.discord.com/developers/tutorials/hosting-on-cloudflare-workers?EwVcT9cY=9Ur0EzgkC
- Slash Commands: https://docs.discord.com/developers/interactions/application-commands#slash-commands
- Interacting: https://docs.discord.com/developers/interactions/receiving-and-responding
- Messaging: https://docs.discord.com/developers/resources/channel
- Webhooks: https://pinggy.io/blog/how_to_set_up_and_test_discord_bot_webhook

### 3. Google Sheets
- Account: https://www.datacamp.com/tutorial/google-sheets-api
- Authentication: https://medium.com/@tamnvhustcc/how-to-authenticate-google-apis-on-cloudflare-workers-in-2025-a-complete-guide-with-custom-jwt-80614398425a
- API: https://developers.google.com/workspace/sheets/api/guides/concepts
