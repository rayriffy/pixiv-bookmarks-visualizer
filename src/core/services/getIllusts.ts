import fs from 'node:fs/promises'
import path from 'node:path'

import destr from 'destr'
import mem from 'mem'

import type { ExtendedPixivIllust } from '../@types/ExtendedPixivIllust'

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
    maxAge: 1,
  }
)
