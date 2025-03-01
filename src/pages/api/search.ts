import { NextApiHandler } from 'next'

import { getIllusts } from '../../core/services/getIllusts'
import { aspectFilter } from '../../modules/search/services/aspectFilter'
import { restrictionFilter } from '../../modules/search/services/restrictionFilter'
import { sizeFilter } from '../../modules/search/services/sizeFilter'
import { supporterFilter } from '../../modules/search/services/supporterFilter'
import { tagFilter } from '../../modules/search/services/tagFilter'
import { pageCountFilter } from '../../modules/search/services/pageCountFilter'

import { SearchRequest } from '../../core/@types/api/SearchRequest'
import { SearchResult } from '../../core/@types/api/SearchResult'
import { aiFilter } from '../../modules/search/services/aiFilter'
import { Tag } from '../../core/@types/api/TagSearchResponse'

const api: NextApiHandler = async (req, res) => {
  const illusts = await getIllusts()

  const searchRequest = req.query as unknown as SearchRequest
  const targetPage = Number(searchRequest.page)

  const includedTags =
    searchRequest.includeTags === undefined
      ? []
      : typeof searchRequest.includeTags === 'string'
        ? [searchRequest.includeTags]
        : searchRequest.includeTags

  const excludedTags =
    searchRequest.excludeTags === undefined
      ? []
      : typeof searchRequest.excludeTags === 'string'
        ? [searchRequest.excludeTags]
        : searchRequest.excludeTags

  const filteredIllusts = illusts
    .filter(restrictionFilter(searchRequest))
    .filter(aspectFilter(searchRequest))
    .filter(sizeFilter(searchRequest))
    .filter(tagFilter(includedTags, excludedTags))
    .filter(pageCountFilter(searchRequest))
    .filter(aiFilter(searchRequest))
  //.filter(supporterFilter(searchRequest)) // Broken support

  const tags = filteredIllusts.reduce<Record<string, Tag>>((acc, illust) => {
    for (const tag of illust.tags)
      if (acc[tag.name] === undefined)
        acc[tag.name] = {
          name: {
            original: tag.name,
            translated: tag.translated_name,
          },
          count: 1
        }
      else
        acc[tag.name].count++

    return acc
  }, {})

  const payload: SearchResult = {
    illusts: filteredIllusts.slice(
      (targetPage - 1) * 30,
      targetPage * 30
    ),
    tags: Object.values(tags).sort((a, b) => b.count - a.count).slice(0, 10),
    count: filteredIllusts.length,
    paginate: {
      current: targetPage,
      max: Math.ceil(filteredIllusts.length / 30),
    },
  }

  res.setHeader('Cache-Control', 'max-age=300')

  return res.send(payload)
}

export default api
