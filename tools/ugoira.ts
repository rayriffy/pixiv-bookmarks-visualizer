import fs from 'fs'
import path from 'path'

import PQueue from 'p-queue'

import Pixiv from 'pixiv.ts'
import dotenv from 'dotenv'

import { promiseSpawn } from './utils/promiseSpawn'
import { ExtendedPixivIllust } from '../src/core/@types/ExtendedPixivIllust'

dotenv.config()
const { PIXIV_REFRESH_TOKEN } = process.env

const ugoiraCacheDirectory = path.join(__dirname, '../.next/cache/ugoiraProxy')
const bookmarksFilePath = path.join(
  __dirname,
  '../.next/cache',
  'bookmarks.json'
)

const queue = new PQueue({ concurrency: 20 })

;(async () => {
  const bookmarks = JSON.parse(
    fs.readFileSync(bookmarksFilePath, 'utf8')
  ) as ExtendedPixivIllust[]
  const ugoiras = bookmarks.filter(o => o.type === 'ugoira')

  const pixiv = await Pixiv.refreshLogin(PIXIV_REFRESH_TOKEN)
  pixiv.setLanguage('English')

  if (!fs.existsSync(ugoiraCacheDirectory))
    fs.mkdirSync(ugoiraCacheDirectory, {
      recursive: true,
    })

  await Promise.allSettled(
    ugoiras.map(ugoira =>
      queue.add(async () => {
        const targetEncodedFile = path.join(
          ugoiraCacheDirectory,
          `${ugoira.id}.webp`
        )

        if (!fs.existsSync(targetEncodedFile)) {
          try {
            const metadataPromise = pixiv.ugoira.metadata({
              illust_id: ugoira.id,
            })
            const downloadedGifPathPromise = pixiv.util.downloadZip(
              `https://www.pixiv.net/en/artworks/${ugoira.id}`,
              '.'
            )

            const [metadata, downloadedGifPath] = await Promise.all([
              metadataPromise,
              downloadedGifPathPromise,
            ])

            const command = 'img2webp'
            const inputArgs = metadata.ugoira_metadata.frames
              .map(frame => [
                '-d',
                frame.delay.toString(),
                '-lossy',
                '-q',
                '95',
                frame.file,
              ])
              .flat()
            const outputArgs = ['-o', targetEncodedFile]

            await promiseSpawn(command, [...inputArgs, ...outputArgs], {
              cwd: downloadedGifPath,
            })

            await fs.promises.rm(downloadedGifPath, {
              recursive: true,
            })
          } catch (e) {
            console.log(`fail: ${ugoira.id}`)
          }
        }
      })
    )
  )
})()
