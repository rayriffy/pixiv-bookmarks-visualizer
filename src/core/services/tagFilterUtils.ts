import { SQL, and, eq, inArray } from 'drizzle-orm'
import { ProcessedTags } from './filterUtils'
import { illustTagsTable, illustsTable, tagsTable } from '../../db/schema'
import { getDbClient } from '../../db/connect'

/**
 * Process tag filters and return the IDs of illustrations that match all included tags
 * and don't contain any excluded tags
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
    // For each include tag, find the tag IDs first
    const tagIds = await Promise.all(includeTags.map(async (tagName) => {
      const tagResults = await db
        .select({ id: tagsTable.id })
        .from(tagsTable)
        .where(eq(tagsTable.name, tagName))
      
      return tagResults.length > 0 ? tagResults[0].id : null
    }))
    
    // Filter out null values
    const validTagIds = tagIds.filter(id => id !== null) as number[]
    
    if (validTagIds.length > 0) {
      // Get all illust IDs that match the provided filters
      const illustQuery = db
        .select({ id: illustsTable.id })
        .from(illustsTable)
        .where(and(...existingFilters))
      
      const allIllusts = await illustQuery
      const allIllustIds = allIllusts.map(i => i.id)
      
      if (allIllustIds.length === 0) {
        return []
      }
      
      // Process in batches for large datasets
      const batchSize = 1000
      const batches: number[][] = []
      
      for (let i = 0; i < allIllustIds.length; i += batchSize) {
        batches.push(allIllustIds.slice(i, i + batchSize))
      }
      
      let matchingIllustIds: number[] = []
      
      for (const batch of batches) {
        // For each tag, find illusts in this batch that have the tag
        const tagMatches = await Promise.all(validTagIds.map(async (tagId) => {
          const matches = await db
            .select({ illust_id: illustTagsTable.illust_id })
            .from(illustTagsTable)
            .where(and(
              eq(illustTagsTable.tag_id, tagId),
              inArray(illustTagsTable.illust_id, batch)
            ))
          
          return new Set(matches.map(m => m.illust_id))
        }))
        
        // Find illusts that have ALL tags (intersection)
        if (tagMatches.length > 0 && tagMatches[0].size > 0) {
          const intersectedIds = [...tagMatches[0]].filter(id => 
            tagMatches.every(tagSet => tagSet.has(id))
          )
          
          matchingIllustIds = [...matchingIllustIds, ...intersectedIds]
        }
      }
      
      if (matchingIllustIds.length === 0) {
        return []
      }
      
      targetIllustIds = matchingIllustIds
    } else {
      // If any include tag doesn't match any illusts, return empty
      return []
    }
  }
  
  // Handle exclude tags - remove illusts that have ANY excluded tag
  if (excludeTags.length > 0 && (targetIllustIds === null || targetIllustIds.length > 0)) {
    // Get tag IDs for exclude tags
    const tagIds = await Promise.all(excludeTags.map(async (tagName) => {
      const tagResults = await db
        .select({ id: tagsTable.id })
        .from(tagsTable)
        .where(eq(tagsTable.name, tagName))
      
      return tagResults.length > 0 ? tagResults[0].id : null
    }))
    
    const validTagIds = tagIds.filter(id => id !== null) as number[]
    
    if (validTagIds.length > 0) {
      // Process in batches for large datasets
      const batchSize = 1000
      let excludedIllustIds: Set<number> = new Set()
      
      // If we have target illusts from include tags
      if (targetIllustIds !== null) {
        const batches: number[][] = []
        for (let i = 0; i < targetIllustIds.length; i += batchSize) {
          batches.push(targetIllustIds.slice(i, i + batchSize))
        }
        
        // For each exclude tag, find illusts to exclude
        for (const tagId of validTagIds) {
          for (const batch of batches) {
            const excludeMatches = await db
              .select({ illust_id: illustTagsTable.illust_id })
              .from(illustTagsTable)
              .where(and(
                eq(illustTagsTable.tag_id, tagId),
                inArray(illustTagsTable.illust_id, batch)
              ))
            
            excludeMatches.forEach(match => excludedIllustIds.add(match.illust_id))
          }
        }
        
        // Filter out excluded illusts
        targetIllustIds = targetIllustIds.filter(id => !excludedIllustIds.has(id))
        
        if (targetIllustIds.length === 0) {
          return []
        }
      } 
      // If we only have exclude tags (no include tags)
      else {
        // Get all illusts that match the filters
        const allIllusts = await db
          .select({ id: illustsTable.id })
          .from(illustsTable)
          .where(and(...existingFilters))
        
        const allIllustIds = allIllusts.map(i => i.id)
        
        if (allIllustIds.length === 0) {
          return []
        }
        
        // Process in batches
        const batches: number[][] = []
        for (let i = 0; i < allIllustIds.length; i += batchSize) {
          batches.push(allIllustIds.slice(i, i + batchSize))
        }
        
        // For each exclude tag, find illusts to exclude
        for (const tagId of validTagIds) {
          for (const batch of batches) {
            const excludeMatches = await db
              .select({ illust_id: illustTagsTable.illust_id })
              .from(illustTagsTable)
              .where(and(
                eq(illustTagsTable.tag_id, tagId),
                inArray(illustTagsTable.illust_id, batch)
              ))
            
            excludeMatches.forEach(match => excludedIllustIds.add(match.illust_id))
          }
        }
        
        // Keep illusts that don't have any excluded tags
        targetIllustIds = allIllustIds.filter(id => !excludedIllustIds.has(id))
        
        if (targetIllustIds.length === 0) {
          return []
        }
      }
    }
  }

  return targetIllustIds
}