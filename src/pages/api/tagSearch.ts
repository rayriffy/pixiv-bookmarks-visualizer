import fs from 'fs'
import path from 'path'

import { NextApiHandler } from 'next'
import { chunk, groupBy, reverse, sortBy } from 'lodash'

import { TagSearchRequest } from '../../core/@types/api/TagSearchRequest'
import { TagSearchResponse } from '../../core/@types/api/TagSearchResponse'
import { ExtendedPixivIllust } from '../../core/@types/ExtendedPixivIllust'

interface NumberizedTag {
  name: {
    original: string
    translated: string | null
  }
  count: number
}

const api: NextApiHandler = async (req, res) => {
  const illusts: ExtendedPixivIllust[] = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), '.next/cache', 'bookmarks.json'),
      'utf8'
    )
  )

  const { query, selectedTags } = req.query as unknown as TagSearchRequest

  const transformedSelectedTags =
    selectedTags === undefined
      ? []
      : typeof selectedTags === 'string'
      ? [selectedTags]
      : selectedTags

  const searchedTags = illusts
    .map(o => o.tags)
    .filter(illustTags =>
      transformedSelectedTags.length === 0
        ? true
        : transformedSelectedTags.every(selectedTag =>
            illustTags.map(o => o.name).includes(selectedTag)
          )
    )
    .flat()
  const processedTags: NumberizedTag[] = reverse(
    sortBy(
      Object.entries(groupBy(searchedTags, o => o.name)).map(
        ([tagName, items]) => ({
          name: {
            original: items[0].name,
            translated: items[0].translated_name,
          },
          count: items.length,
        })
      ),
      ['count', o => o.name.original]
    )
  )

  const payload: TagSearchResponse = {
    tags: processedTags.filter(tag =>
      query.length === 0
        ? true
        : tag.name.original.includes(query) ||
          (tag.name.translated ?? '')
            .toLowerCase()
            .includes(query.toLowerCase())
    ),
  }

  res.setHeader('Cache-Control', 'max-age=60')

  return res.send(payload)
}

export default api
