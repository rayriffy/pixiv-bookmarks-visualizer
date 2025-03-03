import { Database } from "bun:sqlite";
import path from "node:path";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/bun-sqlite";
import PQueue from "p-queue";

import { getPixivImageAndCache } from "$api/getPixivImageAndCache";
import { illustsTable } from "$db/schema";

dotenv.config();
const { DB_FILE_NAME } = process.env;

// Queue to limit concurrent downloads
const queue = new PQueue({ concurrency: 40 });

// Initialize database connection
const initDb = () => {
    if (!DB_FILE_NAME) {
        throw new Error("DB_FILE_NAME environment variable is not set");
    }

    const sqlite = new Database(DB_FILE_NAME);
    return drizzle({ client: sqlite });
};

// Extracts image URLs from illustration data
const extractImageUrls = (illust: { id: number; image_urls: string; meta_pages: string }): string[] => {
    const imageUrls: string[] = [];

    try {
        // Parse JSON strings from database
        const imageUrlsData = JSON.parse(illust.image_urls);
        const metaPagesData = JSON.parse(illust.meta_pages);

        // Add main image
        if (imageUrlsData.medium) {
            imageUrls.push(imageUrlsData.medium);
        }

        // Add first few pages (if multi-page)
        if (Array.isArray(metaPagesData) && metaPagesData.length > 0) {
            metaPagesData.slice(0, 3).forEach((page) => {
                if (page.image_urls?.medium) {
                    imageUrls.push(page.image_urls.medium);
                }
            });
        }
    } catch (error) {
        console.error(`Error extracting image URLs for illust ${illust.id}:`, error);
    }

    return imageUrls;
};

// Main function
(async () => {
    try {
        console.log("Initializing database connection...");
        const db = initDb();

        console.log("Fetching illustrations from database...");
        const illusts = await db.select().from(illustsTable);

        console.log(`Found ${illusts.length} illustrations, extracting image URLs...`);

        // Extract all image URLs
        const allImageUrls: string[] = [];
        for (const illust of illusts) {
            const urls = extractImageUrls(illust);
            allImageUrls.push(...urls);
        }

        console.log(`Starting to download ${allImageUrls.length} images...`);

        // Download all images concurrently using the queue
        await Promise.allSettled(
            allImageUrls.map((url) =>
                queue.add(async () => {
                    try {
                        await getPixivImageAndCache(url);
                    } catch (_error) {
                        console.log(`Failed to download ${path.basename(url)}`);
                    }
                }),
            ),
        );

        console.log("Image preloading completed!");
    } catch (error) {
        console.error("Error during image preloading:", error);
    }
})();
