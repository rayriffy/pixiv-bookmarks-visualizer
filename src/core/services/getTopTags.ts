import { and, count, inArray, sql } from 'drizzle-orm'

import { TagSearchResponse } from '../@types/api/TagSearchResponse'
import { SearchRequest } from '../@types/api/SearchRequest'
import { illustTagsTable, illustsTable, tagsTable } from '../../db/schema'
import { getDbClient } from '../../db/connect'
import { batchedQuery } from './dbUtils'
import { createFiltersFromSearchRequest, processTagParams } from './filterUtils'
import { processTagFilters } from './tagFilterUtils'

/**
 * Get top tags for illusts matching the search request
 * Optimized to use indexes and efficient batched queries
 */
export const getTopTags = async (searchRequest: SearchRequest): Promise<TagSearchResponse> => {
  const db = getDbClient()
  
  // Create base filters from search request
  const filters = createFiltersFromSearchRequest(searchRequest)
  
  // Process tag filters using optimized tag filter utility
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
  
  // Get tag counts for all filtered illusts using batched queries
  // This uses the optimized batchedQuery utility and leverages the illust_id index
  async function getTagCountsForBatch(illustIds: number[]): Promise<{tag_id: number, count: number}[]> {
    return db
      .select({
        tag_id: illustTagsTable.tag_id,
        count: count(illustTagsTable.illust_id)
      })
      .from(illustTagsTable)
      .where(inArray(illustTagsTable.illust_id, illustIds))
      .groupBy(illustTagsTable.tag_id)
      .orderBy(sql`count(illust_id) DESC`) // Explicit count column reference
  }
  
  // Process using batched query utility for better efficiency
  const tagResultsBatches = await batchedQuery(illustsToAnalyze, getTagCountsForBatch)
  
  // Combine all batches into a single tag count map
  const tagCounts = new Map<number, number>()
  
  // Accumulate counts from all batches
  // The type returned by batchedQuery is flattened, so we iterate directly
  for (const result of tagResultsBatches) {
    const currentCount = tagCounts.get(result.tag_id) || 0
    tagCounts.set(result.tag_id, currentCount + Number(result.count))
  }
  
  // Short-circuit if no tags found
  if (tagCounts.size === 0) {
    return { tags: [] }
  }
  
  // Convert to array for sorting and get top 10
  const sortedTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  
  // Get tag details using the id index
  const tagIds = sortedTags.map(([id]) => id)
  
  // Get tag info for these top tags - using batchedQuery for safety with large datasets
  const topTags = await batchedQuery(tagIds, async (batchIds) => {
    return db
      .select({
        id: tagsTable.id,
        name: tagsTable.name,
        translated_name: tagsTable.translated_name
      })
      .from(tagsTable)
      .where(inArray(tagsTable.id, batchIds))
  });
  
  // Create a map for faster lookups
  const tagDetailsMap = new Map(topTags.map(tag => [tag.id, tag]))
  
  // Format the response with faster map lookups
  return {
    tags: tagIds.map(tagId => {
      const tag = tagDetailsMap.get(tagId)
      const count = tagCounts.get(tagId) || 0
      
      if (!tag) return null // Handle missing tags
      
      return {
        name: {
          original: tag.name,
          translated: tag.translated_name || null
        },
        count
      }
    })
    .filter(Boolean) as any[] // Filter out any nulls (missing tags)
  }
}