import { NextApiHandler } from 'next'

import { last } from 'lodash'

const api: NextApiHandler = async (req, res) => {
  try {
    const url = req.query.url as string
  
    const fetchedResponse = await fetch(url, {
      headers: {
        referer: 'https://www.pixiv.net/'
      },
    })
    const fetchedImage = await fetchedResponse.arrayBuffer()
  
    res.setHeader('Content-Type', `image/${last(url.split('.'))}`)
    res.status(200).send(Buffer.from(fetchedImage))
    res.end()
  } catch (e) {
    res.status(500).send('Internal Server Error')
    res.end()
  }
}

export default api
