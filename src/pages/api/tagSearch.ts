import { NextApiHandler } from 'next'

import { TagSearchRequest } from '../../core/@types/api/TagSearchRequest'
import { searchTags } from '../../core/services/searchTags'
import { parseQuery, sendCachedResponse, withErrorHandling } from '../../core/services/apiUtils'

const handleTagSearch = async (req, res) => {
  const tagSearchRequest = parseQuery<TagSearchRequest>(req)
  const results = await searchTags(tagSearchRequest)
  sendCachedResponse(res, results, 60)
}

const api: NextApiHandler = withErrorHandling(handleTagSearch, 'Tag search')

export default api