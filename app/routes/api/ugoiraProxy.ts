import { getPixivImageAndCache } from "$api/getPixivImageAndCache";
import fs from 'node:fs'
import { createAPIFileRoute } from "@tanstack/react-start/api";
import path from 'node:path'
import { getDbClient } from '$db/connect'
import { illustsTable } from '$db/schema'
import { eq } from 'drizzle-orm'

const ugoiraCacheDirectory = path.join(process.cwd(), ".data/ugoiraProxy");

export const APIRoute = createAPIFileRoute("/api/ugoiraProxy")({
  GET: async ({ request }) => {
    const illustId = new URL(request.url).searchParams.get("illustId");
    const expectedCachePath = path.join(
      ugoiraCacheDirectory,
      `${illustId}.webp`
    )

    let imageData: Buffer

    if (fs.existsSync(expectedCachePath)) {
      imageData = Buffer.from(await fs.promises.readFile(expectedCachePath))
    } else {
      // Get the illust from SQLite database
      const db = getDbClient()
      const result = await db
        .select({ image_urls: illustsTable.image_urls })
        .from(illustsTable)
        .where(eq(illustsTable.id, Number(illustId)))
        .limit(1)

      if (!result.length) {
        throw new Error(`Illustration with ID ${illustId} not found`)
      }

      // Parse the image_urls JSON string from the database
      const imageUrls = JSON.parse(result[0].image_urls)
      const targetUrl = imageUrls.medium

      imageData = await getPixivImageAndCache(targetUrl)
    }

    return new Response(imageData, {
      status: 200,
      headers: { "content-type": "image/webp" },
    });
  },
});
