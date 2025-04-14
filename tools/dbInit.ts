import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { dirname, resolve } from 'node:path'
import { access, mkdir } from "node:fs/promises";


const url = process.env.DB_FILE_NAME;

if (!url) {
    throw new Error("DB_FILE_NAME environment variable is not set");
}

const resolvedPath = resolve(process.cwd(), url);

// if file already exists, throw an error
if (await access(resolvedPath).then(() => true).catch(() => false)) {
    throw new Error("DB_FILE_NAME already exists");
}

// if directory does not exist, create it. (use fs/promises)
await mkdir(dirname(resolvedPath), { recursive: true });

console.log(url, process.cwd());

const sqlite = new Database(resolvedPath);

const db = drizzle(sqlite);
migrate(db, { migrationsFolder: "./drizzle" });
