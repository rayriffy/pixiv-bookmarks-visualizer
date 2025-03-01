import fs from 'node:fs'
import path from 'node:path'

import type { NextApiHandler } from 'next'
import { eq } from 'drizzle-orm'

import { getPixivImageAndCache } from '../../core/services/getPixivImageAndCache'
import {
  handleProxyError,
  sendBinaryResponse,
} from '../../core/services/proxyUtils'

import { getDbClient } from '../../db/connect'
import { illustsTable } from '../../db/schema'

const ugoiraCacheDirectory = path.join(process.cwd(), '.next/cache/ugoiraProxy')

const api: NextApiHandler = async (req, res) => {
  try {
    const illustId = req.query.illustId as string
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

    sendBinaryResponse(res, imageData)
  } catch (error) {
    handleProxyError(res, error)
  }
}

export default api

export const config = {
  api: {
    responseLimit: false,
  },
}
