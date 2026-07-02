import dotenv from "dotenv";
import path from "path";

const isProd = process.argv.includes("--prod");

const envPath = path.resolve(
  process.cwd(),
  isProd ? ".prod.vars" : ".dev.vars"
);

const result = dotenv.config({
  path: envPath,
  override: true,
});

if (result.error) {
  throw new Error(`Failed to load env file: ${envPath}`);
}

if (!result.parsed) {
  throw new Error(`Env file parsed empty: ${envPath}`);
}

const envRaw = result.parsed;

export const env = {
  ENVIRONMENT: envRaw.ENVIRONMENT!,
  DISCORD_TOKEN: envRaw.DISCORD_TOKEN!,
  DISCORD_APPLICATION_ID: envRaw.DISCORD_APPLICATION_ID!,
  CLIENT_ID: envRaw.CLIENT_ID!,
  GUILD_ID: envRaw.GUILD_ID!,
  DISCORD_PUBLIC_KEY: envRaw.DISCORD_PUBLIC_KEY!,
};
