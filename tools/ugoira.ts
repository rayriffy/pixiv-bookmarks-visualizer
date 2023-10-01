import fs from 'fs'
import path from 'path'

import destr from 'destr'
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

const queue = new PQueue({ concurrency: 10 })

;(async () => {
  let failures: number[] = []
  let attempt = 0

  const bookmarks = destr(
    await fs.promises.readFile(bookmarksFilePath, 'utf8')
  ) as ExtendedPixivIllust[]
  const ugoiras = bookmarks.filter(o => o.type === 'ugoira')

  const pixiv = await Pixiv.refreshLogin(PIXIV_REFRESH_TOKEN!)
  pixiv.setLanguage('English')

  if (!fs.existsSync(ugoiraCacheDirectory))
    await fs.promises.mkdir(ugoiraCacheDirectory, {
      recursive: true,
    })

  while (attempt === 0 || failures.length !== 0) {
    attempt++
    failures = []

    console.log(`attempt #${attempt}`)

    await Promise.allSettled(
      ugoiras.map(ugoira =>
        queue.add(async () => {
          const targetEncodedFile = path.join(
            ugoiraCacheDirectory,
            `${ugoira.id}.webp`
          )

          if (!fs.existsSync(targetEncodedFile)) {
            try {
              const metadata = await pixiv.ugoira.metadata({
                illust_id: ugoira.id,
                r18: true,
                restrict: 'private',
              })

              const fileName = path.basename(
                metadata.ugoira_metadata.zip_urls.medium
              )
              const fetchedZip = await fetch(
                metadata.ugoira_metadata.zip_urls.medium,
                {
                  method: 'GET',
                  headers: {
                    Referer: 'https://www.pixiv.net/',
                  },
                }
              )
                .then(o => o.arrayBuffer())
                .then(o => Buffer.from(o))

              const targetExtractPath = path.join(__dirname, '.cache', 'ugoira')
              const targetZipPath = path.join(targetExtractPath, fileName)
              const targetUgoiraDirPath = path.join(
                targetExtractPath,
                ugoira.id.toString()
              )

              if (!fs.existsSync(targetExtractPath))
                fs.mkdirSync(targetExtractPath, {
                  recursive: true,
                })

              await fs.writeFileSync(targetZipPath, fetchedZip)
              await promiseSpawn(
                'unzip',
                ['-d', ugoira.id.toString(), fileName],
                {
                  cwd: targetExtractPath,
                }
              )

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
                cwd: targetUgoiraDirPath,
              })

              await Promise.all([
                fs.promises.rm(targetUgoiraDirPath, {
                  recursive: true,
                }),
                fs.promises.rm(targetZipPath),
              ])
            } catch (e) {
              failures.push(ugoira.id)
              console.log(`fail: ${ugoira.id}`)
            }
          }
        })
      )
    )

    if (failures.length !== 0) {
      console.log(`attempt #${attempt} - ${failures.length} failures`)
      console.log('cooling down...')
      await new Promise(res => setTimeout(res, 2 * 60000))
    }
  }
})()
