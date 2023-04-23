import fs from 'fs/promises'
import path from 'path'

import destr from 'destr'
import mem from 'mem'

import { ExtendedPixivIllust } from '../@types/ExtendedPixivIllust'

export const getIllusts = mem(
  async (): Promise<ExtendedPixivIllust[]> => {
    return destr(
      await fs.readFile(
        path.join(process.cwd(), '.next/cache', 'bookmarks.json'),
        'utf8'
      )
    )
  },
  {
    maxAge: 2 * 60 * 1000,
  }
)
