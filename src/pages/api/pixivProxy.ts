import { NextApiHandler } from 'next'

import { getPixivImageAndCache } from '../../core/services/getPixivImageAndCache'
import { handleProxyError, sendBinaryResponse } from '../../core/services/proxyUtils'

const api: NextApiHandler = async (req, res) => {
  try {
    const url = req.query.url as string
    const imageData = await getPixivImageAndCache(url)
    sendBinaryResponse(res, imageData)
  } catch (error) {
    handleProxyError(res, error)
  }
}

export default api
