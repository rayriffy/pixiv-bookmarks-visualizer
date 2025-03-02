import Pixiv, { type PixivMultiCall } from "pixiv.ts";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

import type { ExtendedPixivIllust } from "$types/ExtendedPixivIllust";
import { illustsTable, illustTagsTable, illustUsersTable, tagsTable, usersTable } from "$db/schema";

dotenv.config();
const { PIXIV_USER_ID, PIXIV_REFRESH_TOKEN, DB_FILE_NAME } = process.env;

const BATCH_SIZE = 25; // Number of illusts to process in a batch

// Initialize database connection
const initDb = () => {
    if (!DB_FILE_NAME) {
        throw new Error("DB_FILE_NAME environment variable is not set");
    }

    const sqlite = new Database(DB_FILE_NAME);
    return drizzle({ client: sqlite });
};

// Get existing illustration IDs from the database
const getExistingIllustIds = async (db: ReturnType<typeof drizzle>): Promise<Set<number>> => {
    console.log("Getting existing illust IDs from database...");
    const existingIllusts = await db.select({ id: illustsTable.id }).from(illustsTable);
    return new Set(existingIllusts.map((i) => i.id));
};

// Insert a batch of illustrations into the database
const insertIllustrations = async (
    db: ReturnType<typeof drizzle>,
    illusts: ExtendedPixivIllust[],
    existingTagMap: Map<string, number>,
): Promise<void> => {
    if (illusts.length === 0) return;

    // Process each illustration
    for (const illust of illusts) {
        // Skip if this illust already exists in the database
        try {
            // 1. Insert the illustration
            await db
                .insert(illustsTable)
                .values({
                    id: illust.id,
                    title: illust.title,
                    type: illust.type,
                    caption: illust.caption,
                    create_date: illust.create_date,
                    page_count: illust.page_count,
                    width: illust.width,
                    height: illust.height,
                    sanity_level: illust.sanity_level,
                    total_view: illust.total_view,
                    total_bookmarks: illust.total_bookmarks,
                    is_bookmarked: illust.is_bookmarked,
                    visible: illust.visible,
                    x_restrict: illust.x_restrict,
                    is_muted: illust.is_muted,
                    total_comments: illust.total_comments,
                    illust_ai_type: illust.illust_ai_type,
                    illust_book_style: illust.illust_book_style,
                    restrict: illust.restrict,
                    bookmark_private: illust.bookmark_private,
                    image_urls: JSON.stringify(illust.image_urls),
                    meta_single_page: JSON.stringify(illust.meta_single_page),
                    meta_pages: JSON.stringify(illust.meta_pages),
                    tools: JSON.stringify(illust.tools),
                    url: illust.url || null,
                })
                .onConflictDoUpdate({
                    target: illustsTable.id,
                    set: {
                        bookmark_private: illust.bookmark_private,
                    },
                });

            // 2. Insert or get the user
            await db
                .insert(usersTable)
                .values({
                    id: illust.user.id,
                    name: illust.user.name,
                    account: illust.user.account,
                    profile_image_urls: JSON.stringify(illust.user.profile_image_urls),
                    is_followed: illust.user.is_followed,
                })
                .onConflictDoNothing();

            // 3. Create user-illustration relation
            await db
                .insert(illustUsersTable)
                .values({
                    id: illust.id + illust.user.id, // Simple way to generate a unique ID
                    illust_id: illust.id,
                    user_id: illust.user.id,
                })
                .onConflictDoNothing();

            // 4. Process tags
            let tagIdCounter = existingTagMap.size + 1;

            for (const tag of illust.tags) {
                // Get or create tag ID
                let tagId: number;
                if (existingTagMap.has(tag.name)) {
                    tagId = existingTagMap.get(tag.name)!;
                } else {
                    // Insert new tag
                    try {
                        await db
                            .insert(tagsTable)
                            .values({
                                id: tagIdCounter,
                                name: tag.name,
                                translated_name: tag.translated_name || null,
                            })
                            .onConflictDoNothing();

                        existingTagMap.set(tag.name, tagIdCounter);
                        tagId = tagIdCounter;
                        tagIdCounter++;
                    } catch (_e) {
                        // If there's an error, try to fetch the tag ID
                        const tagResult = await db
                            .select({ id: tagsTable.id })
                            .from(tagsTable)
                            .where(eq(tagsTable.name, tag.name))
                            .limit(1);

                        if (tagResult.length > 0) {
                            tagId = tagResult[0].id;
                            existingTagMap.set(tag.name, tagId);
                        } else {
                            console.error(`Failed to insert or retrieve tag: ${tag.name}`);
                            continue;
                        }
                    }
                }

                // Create illustration-tag relation
                const relationId = `${illust.id}-${tagId}`;
                await db
                    .insert(illustTagsTable)
                    .values({
                        id: Number.parseInt(relationId.replace(/-/g, "")),
                        illust_id: illust.id,
                        tag_id: tagId,
                    })
                    .onConflictDoNothing();
            }
        } catch (e) {
            console.error(`Error processing illust ${illust.id}:`, e);
        }
    }
};

const getBookmarks = async (
    pixiv: Pixiv,
    db: ReturnType<typeof drizzle>,
    existingIllustIds: Set<number>,
    existingTagMap: Map<string, number>,
    restrict: "public" | "private",
    attempt = 1,
): Promise<void> => {
    try {
        const bookmarks = await pixiv.user.bookmarksIllust({
            user_id: Number(PIXIV_USER_ID),
            restrict,
            en: true,
        });

        // Add bookmark privacy info
        const extendedBookmarks = bookmarks.map((bookmark) => ({
            ...bookmark,
            bookmark_private: restrict === "private",
        })) as ExtendedPixivIllust[];

        // Filter out already existing bookmarks
        const newBookmarks = extendedBookmarks.filter((bookmark) => !existingIllustIds.has(bookmark.id));

        // Process initial batch
        if (newBookmarks.length > 0) {
            console.log(`Found ${newBookmarks.length} new bookmarks in initial page`);

            // Process in smaller batches to avoid overwhelming the database
            for (let i = 0; i < newBookmarks.length; i += BATCH_SIZE) {
                const batch = newBookmarks.slice(i, i + BATCH_SIZE);
                console.log(`Processing batch ${i / BATCH_SIZE + 1}/${Math.ceil(newBookmarks.length / BATCH_SIZE)}...`);
                await insertIllustrations(db, batch, existingTagMap);

                // Add these IDs to our existing set to avoid duplicates
                batch.forEach((illust) => existingIllustIds.add(illust.id));
            }
        }

        // Process subsequent pages
        let nextUrl: string | null = pixiv.user.nextURL;
        let page = 2;
        let duplicateCount = 0;

        while (nextUrl !== null) {
            try {
                console.log(`Fetching page ${page}...`);
                const response: PixivMultiCall = await pixiv.api.next(nextUrl);
                nextUrl = response.next_url;

                if (!response.illusts || response.illusts.length === 0) {
                    console.log("No more illusts, breaking");
                    break;
                }

                // Add bookmark privacy info
                const pageBookmarks = response.illusts.map((illust) => ({
                    ...illust,
                    bookmark_private: restrict === "private",
                })) as ExtendedPixivIllust[];

                // Filter out already existing bookmarks
                const newPageBookmarks = pageBookmarks.filter((bookmark) => !existingIllustIds.has(bookmark.id));

                // Calculate duplication rate
                const dupPercentage = ((pageBookmarks.length - newPageBookmarks.length) * 100) / pageBookmarks.length;
                console.log(
                    `Page ${page}: Found ${newPageBookmarks.length} new bookmarks (${dupPercentage.toFixed(2)}% duplication)`,
                );

                // Process new bookmarks
                if (newPageBookmarks.length > 0) {
                    for (let i = 0; i < newPageBookmarks.length; i += BATCH_SIZE) {
                        const batch = newPageBookmarks.slice(i, i + BATCH_SIZE);
                        console.log(
                            `Processing batch ${i / BATCH_SIZE + 1}/${Math.ceil(newPageBookmarks.length / BATCH_SIZE)}...`,
                        );
                        await insertIllustrations(db, batch, existingTagMap);

                        // Add these IDs to our existing set to avoid duplicates
                        batch.forEach((illust) => existingIllustIds.add(illust.id));
                    }
                } else {
                    duplicateCount++;
                }

                // If we've seen multiple pages with 100% duplication, consider stopping
                if (dupPercentage > 98 && duplicateCount >= 3) {
                    console.log("High duplication rate for multiple pages, stopping...");
                    break;
                }

                page++;
            } catch (e) {
                const error = e as { response?: { status: number } };
                if (error.response && error.response.status === 429) {
                    console.log(`Too many requests. Cooling down for ${attempt} minute(s)...`);
                    await new Promise((resolve) => setTimeout(resolve, attempt * 60000));
                } else {
                    throw e;
                }
            }
        }

        console.log(`Finished processing ${restrict} bookmarks`);
    } catch (e) {
        if (attempt < 5) {
            console.log(`Exception caught. Performing attempt #${attempt} in ${attempt} minute(s)...`);
            console.error(e);
            await new Promise((resolve) => setTimeout(resolve, attempt * 60000));
            return getBookmarks(pixiv, db, existingIllustIds, existingTagMap, restrict, attempt + 1);
        }
        throw e;
    }
};
(async () => {
    try {
        // Initialize database
        const db = initDb();

        // Get existing illustration IDs
        const existingIllustIds = await getExistingIllustIds(db);
        console.log(`Found ${existingIllustIds.size} existing illustrations in the database`);

        // Get existing tags mapping
        const existingTags = await db.select().from(tagsTable);
        const existingTagMap = new Map(existingTags.map((tag) => [tag.name, tag.id]));
        console.log(`Found ${existingTagMap.size} existing tags in the database`);

        // Initialize Pixiv API
        const pixiv = await Pixiv.refreshLogin(PIXIV_REFRESH_TOKEN!);

        // Fetch public bookmarks
        console.log("Fetching public bookmarks...");
        await getBookmarks(pixiv, db, existingIllustIds, existingTagMap, "public");

        // Cooling down
        console.log("Cooling down before fetching private bookmarks...");
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Fetch private bookmarks
        console.log("Fetching private bookmarks...");
        await getBookmarks(pixiv, db, existingIllustIds, existingTagMap, "private");

        console.log("All bookmarks have been processed and stored in the database!");
    } catch (e) {
        const error = e as { response?: { data?: unknown } };
        console.error("Error during bookmark fetching:", error?.response?.data ?? e);
    }
})();
