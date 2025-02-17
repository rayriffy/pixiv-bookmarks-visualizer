import fs from 'fs'
import path from 'path'

import Pixiv, { PixivMultiCall } from 'pixiv.ts'
import { sortBy, reverse } from 'lodash'
import dotenv from 'dotenv'

import { ExtendedPixivIllust } from '../src/core/@types/ExtendedPixivIllust'

const cacheDirectory = path.join(__dirname, '../.next/cache')
const mergedBookmarkPath = path.join(cacheDirectory, 'bookmarks.json')
const publicBookmarkPath = path.join(cacheDirectory, 'public.json')
const privateBookmarkPath = path.join(cacheDirectory, 'private.json')

dotenv.config()
const { PIXIV_USER_ID, PIXIV_REFRESH_TOKEN } = process.env

const getBookmarks = async (
  pixiv: Pixiv,
  restrict: 'public' | 'private',
  attempt = 1
): Promise<ExtendedPixivIllust[]> => {
  try {
    const bookmarkPath =
      restrict === 'private' ? privateBookmarkPath : publicBookmarkPath
    // read existing cache
    let existingCache: ExtendedPixivIllust[] = []

    if (fs.existsSync(bookmarkPath)) {
      existingCache = JSON.parse(
        await fs.promises.readFile(bookmarkPath, 'utf-8')
      ) as ExtendedPixivIllust[]
    }

    const existingCacheIds = existingCache.map(o => o.id)

    let bookmarks = await pixiv.user.bookmarksIllust({
      user_id: Number(PIXIV_USER_ID),
      restrict,
      en: true,
    })

    let nextUrl: string | null = pixiv.user.nextURL
    let prevDupPercentage = 0
    let page = 2
    while (nextUrl !== null) {
      console.log(`page: ${page}, prevDup: ${prevDupPercentage.toFixed(2)}%`)

      try {
        const response: PixivMultiCall = await pixiv.api.next(nextUrl)
        nextUrl = response.next_url

        // append to existing cache
        bookmarks = bookmarks.concat(...(response.illusts ?? []))

        // calculate duplication
        let ids = response.illusts?.map(i => i.id) ?? []
        let dupPercentage =
          (ids.filter(i => existingCacheIds.includes(i)).length * 100) /
          ids.length

        if (dupPercentage > 90) {
          console.log(
            `duplication percentage is too high, breaking... (${dupPercentage.toFixed(2)}%)`
          )
          break
        }
        page++
      } catch (e) {
        if (e.response.status !== 429) {
          throw e
        }
        console.log(`Too many requests exception was caught. Attempting to make next request attempt in ${attempt} minute ... \n ${e}\n`)
        await new Promise(o => setTimeout(o, attempt * 60000 + 1000))
      }
    }

    const extendedBookmarksToAppend: ExtendedPixivIllust[] = bookmarks
      // remove duplicates
      .filter(o => !existingCacheIds.includes(o.id))
      // make it ExtendedPixivIllust
      .map(o => ({
        ...o,
        bookmark_private: restrict === 'private',
      }))

    console.log('bookmarks: ', bookmarks.length)
    console.log('toAppend: ', extendedBookmarksToAppend.length)
    console.log('existingCache: ', existingCache.length)

    const mergedIllust = existingCache.concat(...extendedBookmarksToAppend)

    console.log('mergedIllust: ', mergedIllust.length)

    await fs.promises.writeFile(
      restrict === 'private' ? privateBookmarkPath : publicBookmarkPath,
      JSON.stringify(mergedIllust, null, 2)
    )

    return mergedIllust
  } catch (e) {
    if (attempt < 5) {
      console.log(`Exception caught. Performing attempt #${attempt} in ${attempt} minute... \n ${e}\n`)
      await new Promise(o => setTimeout(o, attempt * 60000 + 1000))

      return getBookmarks(pixiv, restrict, attempt + 1)
    } else {
      throw e
    }
  }
}

  ; (async () => {
    if (!fs.existsSync(cacheDirectory))
      await fs.promises.mkdir(cacheDirectory, {
        recursive: true,
      })

    const pixiv = await Pixiv.refreshLogin(PIXIV_REFRESH_TOKEN!)

    console.log('fetching public bookmarks...')
    const publicIllust = await getBookmarks(pixiv, 'public')

    console.log('cooling down...')
    await new Promise(res => setTimeout(res, 5000))

    console.log('fetching private bookmarks...')
    const privateIllust = await getBookmarks(pixiv, 'private')

    await fs.promises.writeFile(
      mergedBookmarkPath,
      JSON.stringify(
        reverse(
          sortBy(
            [...publicIllust, ...privateIllust].filter(
              o =>
                ![
                  'https://s.pximg.net/common/images/limit_mypixiv_360.png',
                  'https://s.pximg.net/common/images/limit_unknown_360.png',
                  'https://s.pximg.net/common/images/limit_sanity_level_360.png',
                ].includes(o.image_urls.medium)
            ),
            ['create_date']
          )
        ),
        null,
        2
      )
    )
  })().catch(e => {
    console.log(e?.response?.data ?? e)
  })
