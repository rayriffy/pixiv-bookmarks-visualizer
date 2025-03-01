import type { NextApiHandler } from 'next'

import type { SearchRequest } from '../../core/@types/api/SearchRequest'
import { searchIllusts } from '../../core/services/searchIllusts'
import {
  parseQuery,
  sendCachedResponse,
  withErrorHandling,
} from '../../core/services/apiUtils'

const handleSearch = async (req, res) => {
  const searchRequest = parseQuery<SearchRequest>(req)
  const searchResults = await searchIllusts(searchRequest)
  sendCachedResponse(res, searchResults, 300)
}

const api: NextApiHandler = withErrorHandling(handleSearch, 'Search')

export default api
