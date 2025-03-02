import { type SQL, and, count, eq, inArray, not, or, sql } from 'drizzle-orm'
import type { TagSearchRequest } from '../@types/api/TagSearchRequest'
import type { Tag, TagSearchResponse } from '../@types/api/TagSearchResponse'
import { getDbClient } from '../../db/connect'
import { illustTagsTable, tagsTable } from '../../db/schema'
import { batchedQuery } from './dbUtils'

/**
 * Optimized tag search function using Drizzle ORM with index-aware queries
 */
export async function searchTags(
  request: TagSearchRequest
): Promise<TagSearchResponse> {
  const db = getDbClient()
  const query = request.query || ''

  // Normalize selected tags and excluded tags
  const selectedTags = Array.isArray(request.selectedTags)
    ? request.selectedTags
    : typeof request.selectedTags === 'string'
      ? [request.selectedTags]
      : []

  // Get already selected tags (to exclude them from results)
  const alreadySelectedTags = Array.isArray(request.alreadySelectedTags)
    ? request.alreadySelectedTags
    : typeof request.alreadySelectedTags === 'string'
      ? [request.alreadySelectedTags]
      : []

  // If we have selected tags, first get all illusts that have these tags
  let filteredIllustIds: number[] = []

  if (selectedTags.length > 0) {
    // Get all tag IDs in one query first (using the name index)
    const tagNames = selectedTags.filter(Boolean) // Filter out any empty strings
    if (tagNames.length === 0) {
      return { tags: [] }
    }

    // Get tag IDs efficiently with batching
    const tagIdsMap = new Map<string, number>()

    // Process in small batches to avoid parameter limits
    for (let i = 0; i < tagNames.length; i += 20) {
      const batchNames = tagNames.slice(i, i + 20)
      const tagResults = await db
        .select({ id: tagsTable.id, name: tagsTable.name })
        .from(tagsTable)
        .where(inArray(tagsTable.name, batchNames))

      tagResults.forEach(tag => {
        tagIdsMap.set(tag.name, tag.id)
      })
    }

    // If any tag doesn't exist, there's no match
    if (tagNames.some(name => !tagIdsMap.has(name))) {
      return { tags: [] }
    }

    const validTagIds = Array.from(tagIdsMap.values())

    // For each tag ID, get matching illusts using the tag_id index
    const tagIllustSets = await Promise.all(
      validTagIds.map(async tagId => {
        const illustResults = await db
          .select({ illust_id: illustTagsTable.illust_id })
          .from(illustTagsTable)
          .where(eq(illustTagsTable.tag_id, tagId))

        // Use a Set for faster lookups in intersection
        return new Set(illustResults.map(r => r.illust_id))
      })
    )

    // Find illusts that have ALL selected tags (intersection)
    if (tagIllustSets.length > 0 && tagIllustSets[0].size > 0) {
      // Start with the smallest set for best performance
      const sortedSets = [...tagIllustSets].sort((a, b) => a.size - b.size)
      const baseSet = sortedSets[0]

      // Keep only IDs that are in all sets
      filteredIllustIds = Array.from(baseSet).filter(id =>
        sortedSets.every(set => set.has(id))
      )
    }

    // If no illusts have all selected tags, return empty results
    if (filteredIllustIds.length === 0) {
      return { tags: [] }
    }
  }

  // Function to process a batch of illusts and count their tags
  async function processIllustBatch(
    illustIds: number[]
  ): Promise<{ tag_id: number; count: number }[]> {
    // Use composite index (illust_id, tag_id) for better performance
    return db
      .select({
        tag_id: illustTagsTable.tag_id,
        count: count(illustTagsTable.tag_id),
      })
      .from(illustTagsTable)
      .where(inArray(illustTagsTable.illust_id, illustIds))
      .groupBy(illustTagsTable.tag_id)
  }

  // Helper to get tag details by IDs with optimized batching
  async function getTagDetails(tagIds: number[]): Promise<any[]> {
    return batchedQuery(tagIds, async batchIds => {
      // Build initial query
      let tagQuery = db
        .select({
          id: tagsTable.id,
          name: tagsTable.name,
          translated_name: tagsTable.translated_name,
        })
        .from(tagsTable)
        .where(inArray(tagsTable.id, batchIds))

      // Apply text search if needed
      const whereConditions: SQL[] = [inArray(tagsTable.id, batchIds)]

      if (query) {
        const lowerQuery = `%${query.toLowerCase()}%`
        const searchClause = or(
          sql`lower(${tagsTable.name}) like ${lowerQuery}`,
          sql`lower(${tagsTable.translated_name}) like ${lowerQuery}`
        )
        whereConditions.push(searchClause)
      }

      // Exclude already selected tags
      if (alreadySelectedTags.length > 0) {
        const excludeClause = not(inArray(tagsTable.name, alreadySelectedTags))
        whereConditions.push(excludeClause)
      }

      // Build final query with all conditions
      return db
        .select({
          id: tagsTable.id,
          name: tagsTable.name,
          translated_name: tagsTable.translated_name,
        })
        .from(tagsTable)
        .where(and(...whereConditions))
    })
  }

  // Process differently based on whether we have filtered illusts
  const tagCountsMap: Record<number, number> = {}

  if (selectedTags.length > 0) {
    // Process filtered illusts in batches, using batch query utility
    // Note: batchedQuery returns a flattened array, not an array of batch results
    const results = await batchedQuery(filteredIllustIds, processIllustBatch)

    // Each result contains a tag_id and count
    results.forEach(result => {
      const numericTagId = result.tag_id
      tagCountsMap[numericTagId] =
        (tagCountsMap[numericTagId] || 0) + Number(result.count)
    })
  } else {
    // Use optimized direct count query instead of fetching all
    const tagCounts = await db
      .select({
        tag_id: illustTagsTable.tag_id,
        count: count(illustTagsTable.illust_id),
      })
      .from(illustTagsTable)
      .groupBy(illustTagsTable.tag_id)

    // Convert to map for faster lookups
    tagCounts.forEach(result => {
      tagCountsMap[result.tag_id] = Number(result.count)
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
    // Skip tags that are already selected (double check)
    if (alreadySelectedTags.includes(tag.name)) {
      return
    }

    // Only add if this tag name isn't already in our map, or if it has a higher count
    if (
      !uniqueTags.has(tag.name) ||
      tagCountsMap[tag.id] > (uniqueTags.get(tag.name)?.count ?? 0)
    ) {
      uniqueTags.set(tag.name, {
        name: {
          original: tag.name,
          translated: tag.translated_name,
        },
        count: tagCountsMap[tag.id],
      })
    }
  })

  // Convert to array and sort by count
  const limit = request.limit ? Number(request.limit) : 20
  const tags = Array.from(uniqueTags.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit) // Apply limit early

  return { tags }
}
