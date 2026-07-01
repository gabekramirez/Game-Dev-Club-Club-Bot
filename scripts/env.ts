import dotenv from "dotenv";
import path from "path";

const isProd = process.argv.includes("--prod");

const envPath = path.resolve(
  process.cwd(),
  isProd ? ".prod.vars" : ".dev.vars"
);

// loads env last and overwrite everything
dotenv.config({path: envPath, override: true});

export const env = process.env;
