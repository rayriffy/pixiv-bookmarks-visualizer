import { type SQL, and, eq, inArray } from 'drizzle-orm'
import type { ProcessedTags } from './filterUtils'
import { illustTagsTable, illustsTable, tagsTable } from '../../db/schema'
import { getDbClient } from '../../db/connect'
import { batchedQuery } from './dbUtils'

/**
 * Process tag filters and return the IDs of illustrations that match all included tags
 * and don't contain any excluded tags
 * Optimized to use indexes and efficient set operations
 */
export const processTagFilters = async (
  tags: ProcessedTags,
  existingFilters: SQL[] = []
): Promise<number[] | null> => {
  const { includeTags, excludeTags } = tags
  const db = getDbClient()

  // Early return if no tag filters
  if (includeTags.length === 0 && excludeTags.length === 0) {
    return null
  }

  // Initialize result variable
  let targetIllustIds: number[] | null = null

  // Handle include tags - get illusts that have ALL included tags
  if (includeTags.length > 0) {
    // Get all tag IDs at once using the tag name index
    const includeTagMap = new Map<string, number>()

    // Process tags in small batches to avoid parameter limits
    for (let i = 0; i < includeTags.length; i += 50) {
      const batchTags = includeTags.slice(i, i + 50)
      const tagResults = await db
        .select({ id: tagsTable.id, name: tagsTable.name })
        .from(tagsTable)
        .where(inArray(tagsTable.name, batchTags))

      // Build a map of tag name to ID for quick lookups
      tagResults.forEach(tag => {
        includeTagMap.set(tag.name, tag.id)
      })
    }

    // Check if all tags exist in database
    const missingTags = includeTags.filter(tag => !includeTagMap.has(tag))
    if (missingTags.length > 0) {
      // If any include tag doesn't exist, no results match
      return []
    }

    const validTagIds = Array.from(includeTagMap.values())

    // Get illustrations that match the base filters first
    const illustQuery = db
      .select({ id: illustsTable.id })
      .from(illustsTable)
      .where(and(...existingFilters))

    const allIllusts = await illustQuery
    const allIllustIds = allIllusts.map(i => i.id)

    if (allIllustIds.length === 0) {
      return []
    }

    // Get illust IDs for each tag using the indexed tag_id field
    const tagIllustSets = await Promise.all(
      validTagIds.map(async tagId => {
        // Use batched query to handle large sets of illusts
        const results = await batchedQuery(allIllustIds, async batchIds => {
          return db
            .select({ illust_id: illustTagsTable.illust_id })
            .from(illustTagsTable)
            .where(
              and(
                eq(illustTagsTable.tag_id, tagId),
                inArray(illustTagsTable.illust_id, batchIds)
              )
            )
        })

        // Convert to a Set for efficient intersection
        return new Set(results.map(r => r.illust_id))
      })
    )

    // Find illusts that have ALL tags using set intersection
    // Start with the smallest set for efficiency
    if (tagIllustSets.length > 0) {
      const sortedSets = [...tagIllustSets].sort((a, b) => a.size - b.size)
      const baseSet = sortedSets[0]

      // Filter for IDs present in all sets
      targetIllustIds = Array.from(baseSet).filter(id =>
        sortedSets.every(set => set.has(id))
      )

      if (targetIllustIds.length === 0) {
        return []
      }
    } else {
      return []
    }
  }

  // Handle exclude tags - remove illusts that have ANY excluded tag
  if (
    excludeTags.length > 0 &&
    (targetIllustIds === null || targetIllustIds.length > 0)
  ) {
    // Get all tag IDs at once using the tag name index
    const excludeTagMap = new Map<string, number>()

    // Process tags in small batches
    for (let i = 0; i < excludeTags.length; i += 50) {
      const batchTags = excludeTags.slice(i, i + 50)
      const tagResults = await db
        .select({ id: tagsTable.id, name: tagsTable.name })
        .from(tagsTable)
        .where(inArray(tagsTable.name, batchTags))

      // Build a map of tag name to ID for quick lookups
      tagResults.forEach(tag => {
        excludeTagMap.set(tag.name, tag.id)
      })
    }

    // Filter to only valid tag IDs
    const validTagIds = Array.from(excludeTagMap.values())

    if (validTagIds.length > 0) {
      // Get the base set of illust IDs we're working with
      let baseIllustIds: number[]

      if (targetIllustIds !== null) {
        // Use filtered illusts from include tags step
        baseIllustIds = targetIllustIds
      } else {
        // Get all illusts matching base filters
        const allIllusts = await db
          .select({ id: illustsTable.id })
          .from(illustsTable)
          .where(and(...existingFilters))

        baseIllustIds = allIllusts.map(i => i.id)
      }

      if (baseIllustIds.length === 0) {
        return []
      }

      // Get all illust IDs that have any of the excluded tags
      // Using a Set for faster lookups and to avoid duplicates
      const excludedIllustIds = new Set<number>()

      // Process each tag ID to find matching illusts
      await Promise.all(
        validTagIds.map(async tagId => {
          const results = await batchedQuery(baseIllustIds, async batchIds => {
            return db
              .select({ illust_id: illustTagsTable.illust_id })
              .from(illustTagsTable)
              .where(
                and(
                  eq(illustTagsTable.tag_id, tagId),
                  inArray(illustTagsTable.illust_id, batchIds)
                )
              )
          })

          // Add all matching illusts to our exclusion set
          results.forEach(r => excludedIllustIds.add(r.illust_id))
        })
      )

      // Filter out excluded illusts
      targetIllustIds = baseIllustIds.filter(id => !excludedIllustIds.has(id))

      if (targetIllustIds.length === 0) {
        return []
      }
    }
  }

  return targetIllustIds
}
