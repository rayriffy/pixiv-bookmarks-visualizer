import fs from 'fs'
import path from 'path'

import { NextApiHandler } from 'next'

const cacheDirectory = path.join(process.cwd(), '.next/cache/pixivProxy')

const api: NextApiHandler = async (req, res) => {
  try {
    const url = req.query.url as string

    const expectedCachePath = path.join(cacheDirectory, path.basename(url))
    if (fs.existsSync(path.join(expectedCachePath))) {
      const fetchedImage = fs.readFileSync(expectedCachePath)
      res.status(200).send(Buffer.from(fetchedImage))
    } else {
      const fetchedResponse = await fetch(url, {
        headers: {
          referer: 'https://www.pixiv.net/',
        },
      })
      const fetchedImage = await fetchedResponse.arrayBuffer()

      if (!fs.existsSync(cacheDirectory))
        fs.mkdirSync(cacheDirectory, { recursive: true })

      fs.writeFileSync(expectedCachePath, Buffer.from(fetchedImage))
      res.status(200).send(Buffer.from(fetchedImage))
    }

    res.end()
  } catch (e) {
    res.status(500).send('Internal Server Error')
    res.end()
  }
}

export default api
