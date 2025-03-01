import { NextApiHandler } from 'next'

import { SearchRequest } from '../../core/@types/api/SearchRequest'
import { searchIllusts } from '../../core/services/searchIllusts'

const api: NextApiHandler = async (req, res) => {
  const searchRequest = req.query as unknown as SearchRequest
  
  try {
    // The searchIllusts function handles everything now - filtering, pagination, and related tags
    const searchResults = await searchIllusts(searchRequest)
    
    res.setHeader('Cache-Control', 'max-age=300')
    return res.send(searchResults)
  } catch (error) {
    console.error('Search error:', error)
    return res.status(500).json({ 
      error: 'An error occurred during search',
      message: error instanceof Error ? error.message : String(error)
    })
  }
}

export default api