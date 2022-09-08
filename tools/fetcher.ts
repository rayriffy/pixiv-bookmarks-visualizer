import fs from 'fs'
import path from 'path'

import Pixiv from 'pixiv.ts'
import { sortBy, reverse } from 'lodash'
import dotenv from 'dotenv'

import { ExtendedPixivIllust } from '../src/core/@types/ExtendedPixivIllust'

const cacheFilePath = path.join(__dirname, '../.next/cache', 'bookmarks.json')

dotenv.config()
const {
  PIXIV_USER_ID,
  PIXIV_REFRESH_TOKEN
} = process.env

const getBookmarks = async (pixiv: Pixiv, restrict: 'public' | 'private'): Promise<ExtendedPixivIllust[]> => {
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

  return bookmarks.map(o => ({
    ...o,
    bookmark_private: restrict === 'private'
  }))
}

;(async () => {
  const pixiv = await Pixiv.refreshLogin(
    PIXIV_REFRESH_TOKEN
  )
  pixiv.setLanguage('English')

  console.log('fetching public bookmarks...')
  const publicIllust = await getBookmarks(pixiv, 'public')
  console.log('fetcing private bookmarks...')
  const privateIllust = await getBookmarks(pixiv, 'private')

  // const [publicIllust, privateIllust] = await Promise.all([
  //   getBookmarks(pixiv, 'public'),
  //   getBookmarks(pixiv, 'private'),
  // ])

  if (!fs.existsSync(path.dirname(cacheFilePath)))
    fs.mkdirSync(path.dirname(cacheFilePath), {
      recursive: true
    })

  fs.writeFileSync(
    cacheFilePath,
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
  console.log(e)
  // console.log(e.response.data)
})
