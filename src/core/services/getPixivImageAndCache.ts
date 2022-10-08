import fs from 'fs'
import path from 'path'

import sharp from 'sharp'
import fetch from 'node-fetch'

const cacheDirectory = path.join(process.cwd(), '.next/cache/pixivProxy')

export const getPixivImageAndCache = async (url: string) => {
  const expectedCacheFileName = `${path.parse(url).name}.webp`
  const expectedCachePath = path.join(cacheDirectory, expectedCacheFileName)

  if (fs.existsSync(path.join(expectedCachePath))) {
    return Buffer.from(fs.readFileSync(expectedCachePath))
  } else {
    const fetchedResponse = await fetch(url, {
      headers: {
        referer: 'https://www.pixiv.net/',
      },
    })
    const fetchedImage = await fetchedResponse.arrayBuffer()

    if (!fs.existsSync(cacheDirectory))
      fs.mkdirSync(cacheDirectory, { recursive: true })

    const optimizedImage = await sharp(Buffer.from(fetchedImage))
      .webp({
        quality: 85,
        effort: 6
      })
      .toBuffer()
    fs.writeFileSync(expectedCachePath, Buffer.from(optimizedImage))

    return Buffer.from(optimizedImage)
  }
}
