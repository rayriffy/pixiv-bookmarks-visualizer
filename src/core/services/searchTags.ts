import { SQL, and, count, eq, inArray, ilike, like, or, sql } from 'drizzle-orm'
import { TagSearchRequest } from '../@types/api/TagSearchRequest'
import { Tag, TagSearchResponse } from '../@types/api/TagSearchResponse'
import { getDbClient } from '../../db/connect'
import { illustTagsTable, tagsTable } from '../../db/schema'

// SQLite parameter limit
const SQLITE_PARAMS_LIMIT = 500

/**
 * Optimized tag search function using Drizzle ORM
 */
export async function searchTags(
  request: TagSearchRequest
): Promise<TagSearchResponse> {
  const db = getDbClient()
  const query = request.query || ''
  
  // Normalize selected tags
  const selectedTags = Array.isArray(request.selectedTags) 
    ? request.selectedTags 
    : (typeof request.selectedTags === 'string' ? [request.selectedTags] : [])

  // If we have selected tags, first get all illusts that have these tags
  let filteredIllustIds: number[] = []
  
  if (selectedTags.length > 0) {
    // For each selected tag, get illusts that have it
    const tagQueries = await Promise.all(selectedTags.map(async (tagName) => {
      // Get tag ID first
      const tagResult = await db
        .select({ id: tagsTable.id })
        .from(tagsTable)
        .where(eq(tagsTable.name, tagName))
        .limit(1)
        
      if (tagResult.length === 0) return []
      
      // Get illust IDs that have this tag
      const illustResults = await db
        .select({ illust_id: illustTagsTable.illust_id })
        .from(illustTagsTable)
        .where(eq(illustTagsTable.tag_id, tagResult[0].id))
        
      return illustResults.map(r => r.illust_id)
    }))
    
    // Find illusts that have ALL selected tags (intersection)
    if (tagQueries.length > 0 && tagQueries[0].length > 0) {
      filteredIllustIds = tagQueries.reduce((acc, curr) => 
        acc.filter(id => curr.includes(id))
      )
    }
    
    // If no illusts have all selected tags, return empty results
    if (filteredIllustIds.length === 0) {
      return { tags: [] }
    }
  }
  
  // Function to process a batch of illusts and count their tags
  async function processIllustBatch(illustIds: number[]): Promise<Record<number, number>> {
    // Get all tag relationships for these illusts
    const tagRelations = await db
      .select({
        tag_id: illustTagsTable.tag_id,
      })
      .from(illustTagsTable)
      .where(inArray(illustTagsTable.illust_id, illustIds))

    // Count occurrences of each tag
    const tagCounts: Record<number, number> = {}
    tagRelations.forEach(relation => {
      tagCounts[relation.tag_id] = (tagCounts[relation.tag_id] || 0) + 1
    })
    
    return tagCounts
  }
  
  // Helper to get tag details by IDs
  async function getTagDetails(tagIds: number[]): Promise<any[]> {
    // Process in batches if needed
    if (tagIds.length > SQLITE_PARAMS_LIMIT) {
      let allTags: any[] = []
      for (let i = 0; i < tagIds.length; i += SQLITE_PARAMS_LIMIT) {
        const batchIds = tagIds.slice(i, i + SQLITE_PARAMS_LIMIT)
        
        let tagQuery = db
          .select({
            id: tagsTable.id,
            name: tagsTable.name,
            translated_name: tagsTable.translated_name,
          })
          .from(tagsTable)
          .where(inArray(tagsTable.id, batchIds))
        
        // Apply text search if needed
        if (query) {
          const lowerQuery = `%${query.toLowerCase()}%`
          tagQuery = tagQuery.where(
            or(
              sql`lower(${tagsTable.name}) like ${lowerQuery}`,
              sql`lower(${tagsTable.translated_name}) like ${lowerQuery}`
            )
          )
        }
        
        const batchResults = await tagQuery
        allTags = [...allTags, ...batchResults]
      }
      return allTags
    } else {
      // For smaller batches
      let tagQuery = db
        .select({
          id: tagsTable.id,
          name: tagsTable.name,
          translated_name: tagsTable.translated_name,
        })
        .from(tagsTable)
        .where(inArray(tagsTable.id, tagIds))
      
      // Apply text search if needed
      if (query) {
        const lowerQuery = `%${query.toLowerCase()}%`
        tagQuery = tagQuery.where(
          or(
            sql`lower(${tagsTable.name}) like ${lowerQuery}`,
            sql`lower(${tagsTable.translated_name}) like ${lowerQuery}`
          )
        )
      }
      
      return tagQuery
    }
  }
  
  // Process differently based on whether we have filtered illusts
  let tagCountsMap: Record<number, number> = {}
  
  if (selectedTags.length > 0) {
    // Process filtered illusts in batches
    for (let i = 0; i < filteredIllustIds.length; i += SQLITE_PARAMS_LIMIT) {
      const batchIds = filteredIllustIds.slice(i, i + SQLITE_PARAMS_LIMIT)
      const batchCounts = await processIllustBatch(batchIds)
      
      // Combine with overall counts
      Object.entries(batchCounts).forEach(([tagId, count]) => {
        const numericTagId = Number(tagId)
        tagCountsMap[numericTagId] = (tagCountsMap[numericTagId] || 0) + count
      })
    }
  } else {
    // Get all tag counts by processing all illusts in the database
    // Get all illust IDs first - this could be optimized further with a direct count query
    const allIllustrationsQuery = await db
      .select({ id: illustTagsTable.illust_id, tag_id: illustTagsTable.tag_id })
      .from(illustTagsTable)
    
    // Count occurrences of each tag
    allIllustrationsQuery.forEach(relation => {
      tagCountsMap[relation.tag_id] = (tagCountsMap[relation.tag_id] || 0) + 1
    })
  }
  
  // Get details for all the tags we've counted
  const tagIds = Object.keys(tagCountsMap).map(Number)
  if (tagIds.length === 0) {
    return { tags: [] }
  }
  
  const tagDetails = await getTagDetails(tagIds)
  
  // Format results to match expected API response and deduplicate by tag name
  const uniqueTags = new Map<string, Tag>()
  
  tagDetails.forEach(tag => {
    // Only add if this tag name isn't already in our map, or if it has a higher count
    if (!uniqueTags.has(tag.name) || tagCountsMap[tag.id] > uniqueTags.get(tag.name)!.count) {
      uniqueTags.set(tag.name, {
        name: {
          original: tag.name,
          translated: tag.translated_name,
        },
        count: tagCountsMap[tag.id]
      })
    }
  })
  
  // Convert to array and sort by count
  const tags = Array.from(uniqueTags.values())
    .sort((a, b) => b.count - a.count)
  
  return { tags }
}