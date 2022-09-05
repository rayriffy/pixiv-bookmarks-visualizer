import { NextApiHandler } from 'next'
import { chunk } from 'lodash'

import { getIllusts } from '../../core/services/getIllusts'

import { SearchRequest } from '../../core/@types/api/SearchRequest'
import { SearchResult } from '../../core/@types/api/SearchResult'

const api: NextApiHandler = async (req, res) => {
  const illusts = await getIllusts()

  const searchRequest = req.query as unknown as SearchRequest
  const targetPage = Number(searchRequest.page)

  const searchTags =
    searchRequest.tags === undefined
      ? []
      : typeof searchRequest.tags === 'string'
      ? [searchRequest.tags]
      : searchRequest.tags

  const filteredIllusts = illusts
    .filter(illust => {
      if (searchRequest.restrict === 'all')
        return true
      else if (searchRequest.restrict === 'public')
        return illust.bookmark_private === false
      else if (searchRequest.restrict === 'private')
        return illust.bookmark_private === true
    })
    .filter(illust => {
      if (searchRequest.aspect === 'all')
        return true
      else if (searchRequest.aspect === 'horizontal')
        return illust.width / illust.height >= 1
      else if (searchRequest.aspect === 'vertical')
        return illust.width / illust.height <= 1
    })
    .filter(illust =>
      searchTags.length === 0
        ? true
        : searchTags.every(tag => illust.tags.map(o => o.name).includes(tag))
    )

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
