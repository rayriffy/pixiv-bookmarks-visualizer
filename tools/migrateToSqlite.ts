import fs from 'node:fs/promises'
import path from 'node:path'
import destr from 'destr'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import dotenv from 'dotenv'

import {
  illustsTable,
  tagsTable,
  usersTable,
  illustTagsTable,
  illustUsersTable,
} from '../src/db/schema'

import type { ExtendedPixivIllust } from '../src/core/@types/ExtendedPixivIllust'

dotenv.config()

async function main() {
  // Validate environment
  if (!process.env.DB_FILE_NAME) {
    console.error('DB_FILE_NAME environment variable is not set')
    process.exit(1)
  }

  // Initialize DB client
  const client = createClient({
    url: process.env.DB_FILE_NAME,
  })
  const db = drizzle(client)

  // Read the JSON file
  console.log('Reading JSON file...')
  const jsonFilePath = path.join(process.cwd(), '.next/cache', 'bookmarks.json')
  const jsonData = await fs.readFile(jsonFilePath, 'utf8')
  const illusts = destr<ExtendedPixivIllust[]>(jsonData)

  console.log(`Found ${illusts.length} illustrations to migrate`)

  // Create a map to track unique users and tags
  const uniqueUsers = new Map()
  const uniqueTags = new Map()
  let tagIdCounter = 1

  // Collect unique users and tags
  console.log('Collecting unique users and tags...')
  for (const illust of illusts) {
    // Track unique users
    if (!uniqueUsers.has(illust.user.id)) {
      uniqueUsers.set(illust.user.id, {
        id: illust.user.id,
        name: illust.user.name,
        account: illust.user.account,
        profile_image_urls: JSON.stringify(illust.user.profile_image_urls),
        is_followed: illust.user.is_followed,
      })
    }

    // Track unique tags
    for (const tag of illust.tags) {
      if (!uniqueTags.has(tag.name)) {
        uniqueTags.set(tag.name, {
          id: tagIdCounter++,
          name: tag.name,
          translated_name: tag.translated_name || null,
        })
      }
    }
  }

  // Insert users
  console.log(`Inserting ${uniqueUsers.size} users...`)
  const usersToInsert: (typeof usersTable.$inferInsert)[] = Array.from(
    uniqueUsers.values()
  )
  for (let i = 0; i < usersToInsert.length; i += 100) {
    const batch = usersToInsert.slice(i, i + 100)
    await db.transaction(async tx => {
      await tx.insert(usersTable).values(batch).onConflictDoNothing()
    })
    console.log(
      `Inserted users batch ${i + 1} to ${Math.min(i + 100, usersToInsert.length)}`
    )
  }

  // Insert tags
  console.log(`Inserting ${uniqueTags.size} tags...`)
  const tagsToInsert: (typeof tagsTable.$inferInsert)[] = Array.from(
    uniqueTags.values()
  )
  for (let i = 0; i < tagsToInsert.length; i += 100) {
    const batch = tagsToInsert.slice(i, i + 100)
    await db.transaction(async tx => {
      await tx.insert(tagsTable).values(batch).onConflictDoNothing()
    })
    console.log(
      `Inserted tags batch ${i + 1} to ${Math.min(i + 100, tagsToInsert.length)}`
    )
  }

  // Create a map of tag name to ID for quicker lookup
  const tagMap = new Map(
    Array.from(uniqueTags.values()).map(tag => [tag.name, tag.id])
  )

  // Insert illustrations and relations
  console.log(`Inserting ${illusts.length} illustrations...`)
  let relationCounter = 1

  for (let i = 0; i < illusts.length; i += 100) {
    const batch = illusts.slice(i, i + 100)

    // Process batch in a transaction
    await db.transaction(async tx => {
      // Prepare all data for batch insertion
      const illustsToInsert: (typeof illustsTable.$inferInsert)[] = []
      const userRelationsToInsert: (typeof illustUsersTable.$inferInsert)[] = []
      const tagRelationsToInsert: (typeof illustTagsTable.$inferInsert)[] = []

      for (const illust of batch) {
        // Prepare illustration data
        illustsToInsert.push({
          id: illust.id,
          title: illust.title,
          type: illust.type,
          caption: illust.caption,
          create_date: illust.create_date,
          page_count: illust.page_count,
          width: illust.width,
          height: illust.height,
          sanity_level: illust.sanity_level,
          total_view: illust.total_view,
          total_bookmarks: illust.total_bookmarks,
          is_bookmarked: illust.is_bookmarked,
          visible: illust.visible,
          x_restrict: illust.x_restrict,
          is_muted: illust.is_muted,
          total_comments: illust.total_comments ?? 0,
          illust_ai_type: illust.illust_ai_type,
          illust_book_style: illust.illust_book_style,
          restrict: illust.restrict,
          bookmark_private: illust.bookmark_private,
          image_urls: JSON.stringify(illust.image_urls),
          meta_single_page: JSON.stringify(illust.meta_single_page),
          meta_pages: JSON.stringify(illust.meta_pages),
          tools: JSON.stringify(illust.tools),
          url: illust.url || null,
        })

        // Prepare user-illustration relation
        userRelationsToInsert.push({
          id: relationCounter++,
          illust_id: illust.id,
          user_id: illust.user.id,
        })

        // Prepare tag-illustration relations
        for (const tag of illust.tags) {
          tagRelationsToInsert.push({
            id: relationCounter++,
            illust_id: illust.id,
            tag_id: tagMap.get(tag.name)!,
          })
        }
      }

      // Insert all illustrations in a single query
      if (illustsToInsert.length > 0) {
        await tx
          .insert(illustsTable)
          .values(illustsToInsert)
          .onConflictDoNothing()
      }

      // Insert all user relations in a single query
      if (userRelationsToInsert.length > 0) {
        await tx
          .insert(illustUsersTable)
          .values(userRelationsToInsert)
          .onConflictDoNothing()
      }

      // Insert all tag relations in a single query
      if (tagRelationsToInsert.length > 0) {
        await tx
          .insert(illustTagsTable)
          .values(tagRelationsToInsert)
          .onConflictDoNothing()
      }
    })

    console.log(
      `Inserted illustrations batch ${i + 1} to ${Math.min(i + 100, illusts.length)}`
    )
  }

  console.log('Migration completed successfully!')
}

main().catch(error => {
  console.error('Migration failed:', error)
  process.exit(1)
})
