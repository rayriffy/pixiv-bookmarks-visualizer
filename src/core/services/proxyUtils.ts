import { NextApiRequest, NextApiResponse } from 'next'

/**
 * Simple error handler for proxy routes
 */
export const handleProxyError = (res: NextApiResponse, error: unknown): void => {
  console.error('Proxy error:', error)
  res.status(500).send('Internal Server Error')
  res.end()
}

/**
 * Send a binary response
 */
export const sendBinaryResponse = (res: NextApiResponse, data: Buffer): void => {
  res.status(200).send(data)
  res.end()
}