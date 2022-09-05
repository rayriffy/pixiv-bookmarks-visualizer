import fs from 'fs'
import path from 'path'

import mem from 'mem'

import { ExtendedPixivIllust } from '../@types/ExtendedPixivIllust'

export const getIllusts = mem(async (): Promise<ExtendedPixivIllust[]> => {
  return JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), '.next/cache', 'bookmarks.json'),
      'utf8'
    )
  )
}, {
  maxAge: 2 * 60 * 1000
})
