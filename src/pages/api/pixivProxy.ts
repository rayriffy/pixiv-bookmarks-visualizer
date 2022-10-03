import { NextApiHandler } from 'next'

import { getPixivImageAndCache } from '../../core/services/getPixivImageAndCache'

const api: NextApiHandler = async (req, res) => {
  try {
    const url = req.query.url as string

    res.status(200).send(await getPixivImageAndCache(url))
    res.end()
  } catch (e) {
    res.status(500).send('Internal Server Error')
    res.end()
  }
}

export default api
