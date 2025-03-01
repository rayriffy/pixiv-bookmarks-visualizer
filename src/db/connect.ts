import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import mem from 'mem'

// Import the schema
import * as schema from './schema'

// Memoized function to get database connection
export const getDbClient = mem(() => {
  const url = process.env.DB_FILE_NAME
  
  if (!url) {
    throw new Error('DB_FILE_NAME environment variable is not set')
  }
  
  const client = createClient({ url })
  return drizzle(client, { schema })
}, {
  maxAge: 1000 * 60 * 5, // Cache for 5 minutes
})