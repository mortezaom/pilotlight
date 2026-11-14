// CI setup: makes sure the D1 database exists and writes its ID into
// wrangler.json, so a fresh fork deploys with zero manual config.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const DB_NAME = "pilotlight-db";
const CONFIG = "wrangler.json";

const wrangler = (...args: string[]) =>
  execFileSync("bunx", ["wrangler", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });

const findDatabase = () =>
  (
    JSON.parse(wrangler("d1", "list", "--json")) as {
      name: string;
      uuid: string;
    }[]
  ).find((db) => db.name === DB_NAME)?.uuid;

let databaseId = findDatabase();
if (!databaseId) {
  console.log(`Creating D1 database ${DB_NAME}`);
  wrangler("d1", "create", DB_NAME);
  databaseId = findDatabase();
}
if (!databaseId) {
  throw new Error(`Could not create D1 database ${DB_NAME}`);
}

const config = JSON.parse(readFileSync(CONFIG, "utf8"));
config.d1_databases[0].database_id = databaseId;
writeFileSync(CONFIG, `${JSON.stringify(config, null, 2)}\n`);
console.log("Cloudflare resources ready");
