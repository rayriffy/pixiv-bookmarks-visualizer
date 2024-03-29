import fs from 'fs'
import path from 'path'

import { NextApiHandler } from 'next'
import destr from 'destr'

import { getPixivImageAndCache } from '../../core/services/getPixivImageAndCache'

import { ExtendedPixivIllust } from '../../core/@types/ExtendedPixivIllust'

const ugoiraCacheDirectory = path.join(process.cwd(), '.next/cache/ugoiraProxy')

const api: NextApiHandler = async (req, res) => {
  try {
    const illustId = req.query.illustId as string

    const expectedCachePath = path.join(
      ugoiraCacheDirectory,
      `${illustId}.webp`
    )

    if (fs.existsSync(path.join(expectedCachePath))) {
      res.status(200).send(Buffer.from(await fs.promises.readFile(expectedCachePath)))
    } else {
      const targetUrl = (
        destr<ExtendedPixivIllust[]>(
          await fs.promises.readFile(
            path.join(process.cwd(), '.next/cache/bookmarks.json'),
            'utf8'
          )
        )
      ).find(o => o.id === Number(illustId))!.image_urls.medium
      res.status(200).send(await getPixivImageAndCache(targetUrl))
    }

    res.end()
  } catch (e) {
    res.status(500).send('Internal Server Error')
    res.end()
  }
}

export default api

export const config = {
  api: {
    responseLimit: false,
  },
}
