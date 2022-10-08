import fs from 'fs'
import path from 'path'

import PQueue from 'p-queue'

import { ExtendedPixivIllust } from '../src/core/@types/ExtendedPixivIllust'
import { getPixivImageAndCache } from '../src/core/services/getPixivImageAndCache'

const bookmarksFilePath = path.join(
  __dirname,
  '../.next/cache',
  'bookmarks.json'
)

const queue = new PQueue({ concurrency: 40 })

;(async () => {
  const bookmarks = JSON.parse(
    fs.readFileSync(bookmarksFilePath, 'utf8')
  ) as ExtendedPixivIllust[]

  // get all urls
  const illustUrls = bookmarks.map(bookmark => {
    const mainUrl = bookmark.image_urls.medium
    const subUrls = bookmark.meta_pages.slice(1, 3).map(o => o.image_urls.medium)

    return [mainUrl, ...subUrls]
  }).flat()

  await Promise.allSettled(illustUrls.map(illustUrl => queue.add(async () => {
    // console.log(path.basename(illustUrl))
    try {
      await getPixivImageAndCache(illustUrl)
    } catch (e) {
      console.log(`fail - ${path.basename(illustUrl)}`)
    }
  })))
})()
