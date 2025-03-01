import { and, count, inArray, sql } from 'drizzle-orm'

import { TagSearchResponse } from '../@types/api/TagSearchResponse'
import { SearchRequest } from '../@types/api/SearchRequest'
import { illustTagsTable, illustsTable, tagsTable } from '../../db/schema'
import { getDbClient } from '../../db/connect'
import { createFiltersFromSearchRequest, processTagParams } from './filterUtils'
import { processTagFilters } from './tagFilterUtils'

/**
 * Get top tags for illusts matching the search request
 */
export const getTopTags = async (searchRequest: SearchRequest): Promise<TagSearchResponse> => {
  const db = getDbClient()
  
  // Create base filters from search request
  const filters = createFiltersFromSearchRequest(searchRequest)
  
  // Process tag filters
  const tags = processTagParams(searchRequest)
  const targetIllustIds = await processTagFilters(tags, filters)
  
  // If there are no matching illusts after filtering, return empty result
  if (targetIllustIds !== null && targetIllustIds.length === 0) {
    return { tags: [] }
  }
  
  // Get final list of illusts to analyze
  let illustsToAnalyze: number[]
  
  if (targetIllustIds !== null) {
    // Use the IDs from tag filtering
    illustsToAnalyze = targetIllustIds
  } else {
    // Get all illusts that match the base filters
    const allIllusts = await db
      .select({ id: illustsTable.id })
      .from(illustsTable)
      .where(and(...filters))
    
    illustsToAnalyze = allIllusts.map(i => i.id)
    
    if (illustsToAnalyze.length === 0) {
      return { tags: [] }
    }
  }
  
  // Process in batches to avoid too many SQL parameters
  const batchSize = 1000
  const batches: number[][] = []
  
  for (let i = 0; i < illustsToAnalyze.length; i += batchSize) {
    batches.push(illustsToAnalyze.slice(i, i + batchSize))
  }
  
  let tagCounts: Map<number, number> = new Map()
  
  // Process each batch
  for (const batch of batches) {
    const tagResults = await db
      .select({
        tag_id: illustTagsTable.tag_id,
        count: count()
      })
      .from(illustTagsTable)
      .where(inArray(illustTagsTable.illust_id, batch))
      .groupBy(illustTagsTable.tag_id)
      .orderBy(sql`count(*) DESC`)
    
    // Accumulate counts
    for (const result of tagResults) {
      const currentCount = tagCounts.get(result.tag_id) || 0
      tagCounts.set(result.tag_id, currentCount + Number(result.count))
    }
  }
  
  // Convert to array for sorting
  const sortedTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // Get top 10
  
  // Get tag details
  const tagIds = sortedTags.map(([id]) => id)
  
  // Get tag info for these top tags
  const topTags = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      translated_name: tagsTable.translated_name
    })
    .from(tagsTable)
    .where(inArray(tagsTable.id, tagIds))
  
  // Format the response
  return {
    tags: tagIds.map(tagId => {
      const tag = topTags.find(t => t.id === tagId)
      const count = tagCounts.get(tagId) || 0
      
      return {
        name: {
          original: tag?.name || '',
          translated: tag?.translated_name || null
        },
        count
      }
    })
    .filter(tag => tag.name.original) // Filter out any tags that weren't found
  }
}