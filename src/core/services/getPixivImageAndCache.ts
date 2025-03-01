import fs from 'node:fs'
import path from 'node:path'

import sharp from 'sharp'

const cacheDirectory = path.join(process.cwd(), '.next/cache/pixivProxy')

const dividerGroup = 1000000

export const getPixivImageAndCache = async (url: string) => {
  const pureFileName = path.parse(url).name

  const expectedCacheFileName = `${pureFileName}.webp`

  const isValidGroup = Number.isSafeInteger(Number(pureFileName.split('_')[0]))
  const expectedCachePath = isValidGroup
    ? path.join(
        cacheDirectory,
        Math.floor(
          Number(pureFileName.split('_')[0]) / dividerGroup
        ).toString(),
        expectedCacheFileName
      )
    : path.join(cacheDirectory, expectedCacheFileName)

  if (fs.existsSync(path.join(expectedCachePath))) {
    return Buffer.from(await fs.promises.readFile(expectedCachePath))
  }
  const fetchedResponse = await fetch(url, {
    headers: {
      referer: 'https://www.pixiv.net/',
    },
  })
  const fetchedImage = await fetchedResponse.arrayBuffer()

  if (!fs.existsSync(cacheDirectory))
    await fs.promises.mkdir(cacheDirectory, { recursive: true })

  const optimizedImage = await sharp(Buffer.from(fetchedImage))
    .webp({
      quality: 85,
      effort: 6,
    })
    .toBuffer()
  if (!fs.existsSync(path.dirname(expectedCachePath)))
    await fs.promises.mkdir(path.dirname(expectedCachePath), {
      recursive: true,
    })
  await fs.promises.writeFile(expectedCachePath, Buffer.from(optimizedImage))

  return Buffer.from(optimizedImage)
}
