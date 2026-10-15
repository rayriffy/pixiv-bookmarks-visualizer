import { Database } from "bun:sqlite";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn, write } from "bun";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import sharp from "sharp";
import { illustTagsTable, illustUsersTable, illustsTable, tagsTable, usersTable } from "../../app/packlets/db/schema";

const root = path.resolve(import.meta.dir, "../..");
const directory = await mkdtemp(path.join(tmpdir(), "pixiv-start-fixture-"));
const dbFile = path.join(directory, "pixiv.db");
const sqlite = new Database(dbFile);
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: path.join(root, "drizzle") });

db.insert(usersTable)
    .values({ id: 1, name: "Fixture Artist", account: "fixture", profile_image_urls: "{}", is_followed: false })
    .run();
db.insert(tagsTable)
    .values([
        { id: 1, name: "猫", translated_name: "Cat" },
        { id: 2, name: "風景", translated_name: "Landscape" },
        { id: 3, name: "共通", translated_name: "Common" },
        { id: 4, name: "R-18", translated_name: null },
    ])
    .run();

const image = await sharp({ create: { width: 48, height: 32, channels: 3, background: "#428a74" } })
    .webp()
    .toBuffer();
const secondFrame = await sharp({ create: { width: 48, height: 32, channels: 3, background: "#d99d55" } })
    .png()
    .toBuffer();
const animation = await sharp([image, secondFrame], { join: { animated: true } })
    .webp({ loop: 0, delay: [100, 100] })
    .toBuffer();
if ((await sharp(animation, { animated: true }).metadata()).pages !== 2) {
    throw new Error("Fixture animation must contain two frames");
}
await mkdir(path.join(directory, "pixivProxy/1"), { recursive: true });
await mkdir(path.join(directory, "ugoiraProxy"), { recursive: true });

for (let i = 1; i <= 36; i++) {
    const id = 1_000_000 + i;
    const pages = i % 5 === 0 ? 3 : 1;
    const imageUrl = `https://fixture.invalid/${id}_p0.jpg`;
    const imageUrls = { square_medium: imageUrl, medium: imageUrl, large: imageUrl };
    const metaPages =
        pages === 1
            ? []
            : Array.from({ length: pages }, (_, page) => ({
                  image_urls: { ...imageUrls, medium: `https://fixture.invalid/${id}_p${page}.jpg` },
              }));
    db.insert(illustsTable)
        .values({
            id,
            title: `Fixture ${i}`,
            type: i >= 35 ? "ugoira" : "illust",
            caption: `Fixture illustration ${i}`,
            create_date: "2026-01-01T00:00:00Z",
            page_count: pages,
            width: i % 2 === 0 ? 1920 : 900,
            height: i % 2 === 0 ? 1080 : 1600,
            sanity_level: 2,
            total_view: 100,
            total_bookmarks: 10,
            is_bookmarked: true,
            visible: true,
            x_restrict: i % 7 === 0 ? 1 : 0,
            is_muted: false,
            total_comments: 0,
            illust_ai_type: i % 3 === 0 ? 2 : 1,
            illust_book_style: 0,
            restrict: 0,
            bookmark_private: i % 4 === 0,
            image_urls: JSON.stringify(imageUrls),
            meta_single_page: JSON.stringify({ original_image_url: imageUrl }),
            meta_pages: JSON.stringify(metaPages),
            tools: "[]",
        })
        .run();
    db.insert(illustUsersTable).values({ id: i, illust_id: id, user_id: 1 }).run();
    for (const tagId of [i % 2 === 0 ? 2 : 1, 3, ...(i % 7 === 0 ? [4] : [])]) {
        db.insert(illustTagsTable)
            .values({ id: i * 10 + tagId, illust_id: id, tag_id: tagId })
            .run();
    }
    for (let page = 0; page < pages; page++) {
        await write(path.join(directory, "pixivProxy/1", `${id}_p${page}.webp`), image);
    }
}
await write(path.join(directory, "ugoiraProxy/1000036.webp"), animation);
sqlite.close();

const development = process.env.E2E_SERVER === "development";
const command = development
    ? ["bun", "run", "dev", "--host", "127.0.0.1", "--port", process.env.PORT ?? "4174", "--strictPort"]
    : ["bun", "run", "start"];
const child = spawn(command, {
    cwd: root,
    env: {
        ...Object.fromEntries(Object.entries(process.env).filter(([, value]) => typeof value === "string")),
        DB_FILE_NAME: dbFile,
        PIXIV_DATA_DIR: directory,
    },
    stdout: "inherit",
    stderr: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => child.kill(signal));
}
const exitCode = await child.exited;
// Only this process's mkdtemp fixture is removed; never the user's .data directory.
await rm(directory, { recursive: true, force: true });
process.exit(exitCode);
