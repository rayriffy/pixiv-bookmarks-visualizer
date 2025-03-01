import { NextApiHandler } from 'next'

import { TagSearchRequest } from '../../core/@types/api/TagSearchRequest'
import { searchTags } from '../../core/services/searchTags'

const api: NextApiHandler = async (req, res) => {
  try {
    const tagSearchRequest = req.query as unknown as TagSearchRequest
    
    // Use our optimized tag search service
    const results = await searchTags(tagSearchRequest)
    
    res.setHeader('Cache-Control', 'max-age=60')
    return res.send(results)
  } catch (error) {
    console.error('Tag search error:', error)
    return res.status(500).json({ 
      error: 'An error occurred during tag search',
      message: error instanceof Error ? error.message : String(error)
    })
  }
}

export default api