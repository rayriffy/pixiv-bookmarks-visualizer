import fs from 'fs'
import path from 'path'

import PQueue from 'p-queue'
import Pixiv from 'pixiv.ts'
import dotenv from 'dotenv'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'

import { promiseSpawn } from './utils/promiseSpawn'
import { illustsTable } from '../src/db/schema'

dotenv.config()
const { PIXIV_REFRESH_TOKEN, DB_FILE_NAME } = process.env

const ugoiraCacheDirectory = path.join(__dirname, '../.next/cache/ugoiraProxy')
const BATCH_SIZE = 50 // Number of ugoiras to process in each batch

// Initialize database connection
const initDb = () => {
  if (!DB_FILE_NAME) {
    throw new Error('DB_FILE_NAME environment variable is not set')
  }
  
  const client = createClient({ url: DB_FILE_NAME })
  return drizzle(client)
}

// Queue to limit concurrent downloads
const queue = new PQueue({ concurrency: 10 })

;(async () => {
  try {
    // Create ugoira cache directory if it doesn't exist
    if (!fs.existsSync(ugoiraCacheDirectory)) {
      await fs.promises.mkdir(ugoiraCacheDirectory, {
        recursive: true,
      })
    }
    
    // Initialize database connection
    console.log('Initializing database connection...')
    const db = initDb()
    
    // Get all ugoira illustrations from the database
    console.log('Fetching ugoira illustrations from database...')
    const ugoiraIllusts = await db.select({
      id: illustsTable.id
    })
    .from(illustsTable)
    .where(eq(illustsTable.type, 'ugoira'))
    
    console.log(`Found ${ugoiraIllusts.length} ugoira illustrations`)
    
    // Initialize Pixiv API
    const pixiv = await Pixiv.refreshLogin(PIXIV_REFRESH_TOKEN!)
    
    // Process all ugoiras with retry logic
    let failures: number[] = []
    let attempt = 0
    
    while (attempt === 0 || failures.length !== 0) {
      attempt++
      const currentBatch = attempt === 1 ? ugoiraIllusts.map(i => i.id) : failures
      failures = []
      
      console.log(`Processing attempt #${attempt} for ${currentBatch.length} ugoiras`)
      
      // Process in smaller batches
      for (let i = 0; i < currentBatch.length; i += BATCH_SIZE) {
        const batchIds = currentBatch.slice(i, i + BATCH_SIZE)
        console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(currentBatch.length/BATCH_SIZE)}`)
        
        await Promise.allSettled(
          batchIds.map(id => queue.add(async () => {
            const targetEncodedFile = path.join(
              ugoiraCacheDirectory,
              `${id}.webp`
            )
            
            // Skip if already processed
            if (fs.existsSync(targetEncodedFile)) {
              return
            }
            
            try {
              const metadata = await pixiv.ugoira.metadata({
                illust_id: id,
                r18: true,
                restrict: 'private',
              })
              
              const fileName = path.basename(
                metadata.ugoira_metadata.zip_urls.medium
              )
              const fetchedZip = await fetch(
                metadata.ugoira_metadata.zip_urls.medium,
                {
                  method: 'GET',
                  headers: {
                    Referer: 'https://www.pixiv.net/',
                  },
                }
              )
              .then(o => o.arrayBuffer())
              .then(o => Buffer.from(o))
              
              const targetExtractPath = path.join(__dirname, '.cache', 'ugoira')
              const targetZipPath = path.join(targetExtractPath, fileName)
              const targetUgoiraDirPath = path.join(
                targetExtractPath,
                id.toString()
              )
              
              if (!fs.existsSync(targetExtractPath)) {
                fs.mkdirSync(targetExtractPath, {
                  recursive: true,
                })
              }
              
              await fs.writeFileSync(targetZipPath, fetchedZip)
              await promiseSpawn(
                'unzip',
                ['-d', id.toString(), fileName],
                {
                  cwd: targetExtractPath,
                }
              )
              
              const command = 'img2webp'
              const inputArgs = metadata.ugoira_metadata.frames
                .map(frame => [
                  '-d',
                  frame.delay.toString(),
                  '-lossy',
                  '-q',
                  '95',
                  frame.file,
                ])
                .flat()
              const outputArgs = ['-o', targetEncodedFile]
              
              await promiseSpawn(command, [...inputArgs, ...outputArgs], {
                cwd: targetUgoiraDirPath,
              })
              
              // Clean up
              await Promise.all([
                fs.promises.rm(targetUgoiraDirPath, {
                  recursive: true,
                }),
                fs.promises.rm(targetZipPath),
              ])
              
              console.log(`Successfully processed ugoira: ${id}`)
            } catch (error) {
              failures.push(id)
              console.log(`Failed to process ugoira: ${id}`)
            }
          }))
        )
      }
      
      if (failures.length !== 0) {
        console.log(`Attempt #${attempt} - ${failures.length} failures`)
        
        if (attempt < 5) {
          console.log('Cooling down before next attempt...')
          await new Promise(res => setTimeout(res, 2 * 60000))
        } else {
          console.log('Maximum attempts reached, quitting with remaining failures')
          console.log('Failed IDs:', failures)
          break
        }
      }
    }
    
    console.log('Ugoira processing completed!')
  } catch (error) {
    console.error('Error processing ugoiras:', error)
  }
})()