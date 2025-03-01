import { NextApiRequest, NextApiResponse } from 'next'

/**
 * Common error response structure
 */
interface ErrorResponse {
  error: string
  message: string
}

/**
 * Set cache control headers on the response
 */
export const setCacheControl = (res: NextApiResponse, maxAge: number): void => {
  res.setHeader('Cache-Control', `max-age=${maxAge}`)
}

/**
 * Wrap API handler with common error handling
 */
export const withErrorHandling = <T>(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<T>,
  errorPrefix: string = 'API'
) => {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    try {
      await handler(req, res)
    } catch (error) {
      console.error(`${errorPrefix} error:`, error)
      res.status(500).json({
        error: `An error occurred during ${errorPrefix.toLowerCase()}`,
        message: error instanceof Error ? error.message : String(error)
      } as ErrorResponse)
    }
  }
}

/**
 * Type-safe query parser for API requests
 */
export const parseQuery = <T>(req: NextApiRequest): T => {
  return req.query as unknown as T
}

/**
 * Send a successful JSON response with cache control
 */
export const sendCachedResponse = <T>(
  res: NextApiResponse,
  data: T,
  maxAge: number = 300
): void => {
  setCacheControl(res, maxAge)
  res.send(data)
}