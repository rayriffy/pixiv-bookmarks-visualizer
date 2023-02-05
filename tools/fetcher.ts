import fs from 'fs'
import path from 'path'

import Pixiv from 'pixiv.ts'
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
  restrict: 'public' | 'private'
): Promise<ExtendedPixivIllust[]> => {
  let bookmarks = await pixiv.user.bookmarksIllust({
    user_id: Number(PIXIV_USER_ID),
    restrict,
    en: true,
  })
  if (pixiv.user.nextURL)
    bookmarks = await pixiv.util.multiCall(
      { next_url: pixiv.user.nextURL, illusts: bookmarks },
      Number.MAX_SAFE_INTEGER
    )

  const extendedBookmarks: ExtendedPixivIllust[] = bookmarks.map(o => ({
    ...o,
    bookmark_private: restrict === 'private',
  }))

  fs.writeFileSync(
    restrict === 'private' ? privateBookmarkPath : publicBookmarkPath,
    JSON.stringify(extendedBookmarks, null, 2)
  )

  return extendedBookmarks
}

;(async () => {
  if (!fs.existsSync(cacheDirectory))
    fs.mkdirSync(cacheDirectory, {
      recursive: true,
    })

  const pixiv = await Pixiv.refreshLogin(PIXIV_REFRESH_TOKEN)
  pixiv.setLanguage('English')

  console.log('fetching public bookmarks...')
  const publicIllust = await getBookmarks(pixiv, 'public')

  console.log('cooling down...')
  await new Promise(res => setTimeout(res, 5000))

  console.log('fetcing private bookmarks...')
  const privateIllust = await getBookmarks(pixiv, 'private')

  fs.writeFileSync(
    mergedBookmarkPath,
    JSON.stringify(
      reverse(
        sortBy(
          [...publicIllust, ...privateIllust].filter(
            o =>
              ![
                'https://s.pximg.net/common/images/limit_mypixiv_360.png',
                'https://s.pximg.net/common/images/limit_unknown_360.png',
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
