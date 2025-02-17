import { NextApiHandler } from 'next'
import { chunk } from 'lodash'

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

  const illustChunks = chunk(filteredIllusts, 30)

  const payload: SearchResult = {
    illusts: illustChunks[targetPage - 1] ?? [],
    count: filteredIllusts.length,
    paginate: {
      current: targetPage,
      max: illustChunks.length,
    },
  }

  res.setHeader('Cache-Control', 'max-age=300')

  return res.send(payload)
}

export default api
