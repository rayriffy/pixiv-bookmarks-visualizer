import { NextApiHandler } from 'next'

import { SearchRequest } from '../../core/@types/api/SearchRequest'
import { getTopTags } from '../../core/services/getTopTags'
import { parseQuery, sendCachedResponse, withErrorHandling } from '../../core/services/apiUtils'

const handleTopTags = async (req, res) => {
  const searchRequest = parseQuery<SearchRequest>(req)
  const topTags = await getTopTags(searchRequest)
  sendCachedResponse(res, topTags, 300)
}

const api: NextApiHandler = withErrorHandling(handleTopTags, 'Top tags')

export default api
