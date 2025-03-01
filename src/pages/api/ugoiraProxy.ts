import fs from 'node:fs'
import path from 'node:path'

import type { NextApiHandler } from 'next'
import destr from 'destr'

import { getPixivImageAndCache } from '../../core/services/getPixivImageAndCache'
import {
  handleProxyError,
  sendBinaryResponse,
} from '../../core/services/proxyUtils'

import type { ExtendedPixivIllust } from '../../core/@types/ExtendedPixivIllust'

const ugoiraCacheDirectory = path.join(process.cwd(), '.next/cache/ugoiraProxy')

const api: NextApiHandler = async (req, res) => {
  try {
    const illustId = req.query.illustId as string
    const expectedCachePath = path.join(
      ugoiraCacheDirectory,
      `${illustId}.webp`
    )

    let imageData: Buffer

    if (fs.existsSync(path.join(expectedCachePath))) {
      imageData = Buffer.from(await fs.promises.readFile(expectedCachePath))
    } else {
      const targetUrl = destr<ExtendedPixivIllust[]>(
        await fs.promises.readFile(
          path.join(process.cwd(), '.next/cache/bookmarks.json'),
          'utf8'
        )
      ).find(o => o.id === Number(illustId))?.image_urls.medium

      imageData = await getPixivImageAndCache(targetUrl!)
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
