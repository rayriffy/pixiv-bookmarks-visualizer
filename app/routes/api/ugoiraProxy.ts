import fs from "node:fs";
import path from "node:path";
import { methodNotAllowed } from "$api/apiUtils";
import { getPixivImageAndCache } from "$api/getPixivImageAndCache";
import { getDbClient } from "$db/connect";
import { illustsTable } from "$db/schema";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";

const ugoiraCacheDirectory = path.resolve(process.env.PIXIV_DATA_DIR ?? ".data", "ugoiraProxy");

export const Route = createFileRoute("/api/ugoiraProxy")({
    server: {
        handlers: {
            ANY: methodNotAllowed,
            GET: async ({ request }) => {
                const illustId = new URL(request.url).searchParams.get("illustId");
                const expectedCachePath = path.join(ugoiraCacheDirectory, `${illustId}.webp`);

                let imageData: Buffer;

                if (fs.existsSync(expectedCachePath)) {
                    imageData = Buffer.from(await fs.promises.readFile(expectedCachePath));
                } else {
                    // Get the illust from SQLite database
                    const db = getDbClient();
                    const result = await db
                        .select({ image_urls: illustsTable.image_urls })
                        .from(illustsTable)
                        .where(eq(illustsTable.id, Number(illustId)))
                        .limit(1);

                    if (!result.length) {
                        throw new Error(`Illustration with ID ${illustId} not found`);
                    }

                    // Parse the image_urls JSON string from the database
                    const imageUrls = JSON.parse(result[0].image_urls);
                    const targetUrl = imageUrls.medium;

                    imageData = await getPixivImageAndCache(targetUrl);
                }

                return new Response(new Uint8Array(imageData), {
                    status: 200,
                    headers: { "content-type": "image/webp" },
                });
            },
        },
    },
});
