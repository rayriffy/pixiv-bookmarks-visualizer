import { NextApiHandler } from 'next'
import { and, count, eq, inArray, sql, gte, lte, ne } from 'drizzle-orm'

import { Tag, TagSearchResponse } from '../../core/@types/api/TagSearchResponse'
import { SearchRequest } from '../../core/@types/api/SearchRequest'
import { illustTagsTable, illustsTable, tagsTable } from '../../db/schema'
import { getDbClient } from '../../db/connect'
import { MinimumSizer } from '../../core/@types/MinimumSizer'

const api: NextApiHandler = async (req, res) => {
  const searchRequest = req.query as unknown as SearchRequest
  
  try {
    const db = getDbClient()
    
    // Build filters similar to searchIllusts, but without pagination
    const filters: any[] = []

    // Parse parameters
    const minimumPageCount = Number(searchRequest.minimumPageCount) || 0
    const maximumPageCount = Number(searchRequest.maximumPageCount) || 0
    const sizerSize = Number(searchRequest.sizerSize) || 0

    // Get include/exclude tags
    const includeTags = Array.isArray(searchRequest.includeTags) 
      ? searchRequest.includeTags 
      : (typeof searchRequest.includeTags === 'string' ? [searchRequest.includeTags] : [])
    
    const excludeTags = Array.isArray(searchRequest.excludeTags) 
      ? searchRequest.excludeTags 
      : (typeof searchRequest.excludeTags === 'string' ? [searchRequest.excludeTags] : [])

    // Apply filters similar to searchIllusts.ts
    // 1. Restriction filter
    if (searchRequest.restrict === 'public') {
      filters.push(eq(illustsTable.bookmark_private, false))
    } else if (searchRequest.restrict === 'private') {
      filters.push(eq(illustsTable.bookmark_private, true))
    }

    // 2. Aspect ratio filter
    if (searchRequest.aspect === 'horizontal') {
      filters.push(sql`${illustsTable.width} / ${illustsTable.height} >= 1`)
    } else if (searchRequest.aspect === 'vertical') {
      filters.push(sql`${illustsTable.width} / ${illustsTable.height} <= 1`)
    }

    // 3. Size filter
    if (searchRequest.sizerMode !== 'none' && sizerSize > 0) {
      // Type guard to make TypeScript happy
      const validSizerModes: MinimumSizer['mode'][] = ['width', 'height']
      if (validSizerModes.includes(searchRequest.sizerMode)) {
        if (searchRequest.sizerMode === 'width') {
          filters.push(gte(illustsTable.width, sizerSize))
        } else if (searchRequest.sizerMode === 'height') {
          filters.push(gte(illustsTable.height, sizerSize))
        }
      }
    }

    // 4. Page count filter
    if (minimumPageCount > 0) {
      filters.push(gte(illustsTable.page_count, minimumPageCount))
    }
    if (maximumPageCount > 0) {
      filters.push(lte(illustsTable.page_count, maximumPageCount))
    }

    // 5. AI filter
    if (searchRequest.aiMode === 'non-ai-only') {
      filters.push(ne(illustsTable.illust_ai_type, 2))
    } else if (searchRequest.aiMode === 'ai-only') {
      filters.push(eq(illustsTable.illust_ai_type, 2))
    }

    // Handle tag filtering similarly to searchIllusts.ts
    // but we'll use a different approach for large datasets
    let targetIllustIds: number[] | null = null

    // First, handle include tags - get illusts that have ALL these tags
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
        // Use SQL to find illusts that have ALL these tags
        // This is more efficient for large datasets than the array approach
        
        // First get all illust IDs
        const illustQuery = db
          .select({ id: illustsTable.id })
          .from(illustsTable)
          .where(and(...filters))
        
        const allIllusts = await illustQuery
        const allIllustIds = allIllusts.map(i => i.id)
        
        if (allIllustIds.length === 0) {
          return res.json({ tags: [] })
        }
        
        // Process in batches if there are too many illusts
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
          return res.json({ tags: [] })
        }
        
        targetIllustIds = matchingIllustIds
      } else {
        // If any include tag doesn't match any illusts, return empty
        return res.json({ tags: [] })
      }
    }
    
    // Handle exclude tags
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
        // Process in batches if we need to exclude from many illusts
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
            return res.json({ tags: [] })
          }
        } 
        // If we only have exclude tags (no include tags)
        else {
          // Get all illusts that match the filters
          const allIllusts = await db
            .select({ id: illustsTable.id })
            .from(illustsTable)
            .where(and(...filters))
          
          const allIllustIds = allIllusts.map(i => i.id)
          
          if (allIllustIds.length === 0) {
            return res.json({ tags: [] })
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
            return res.json({ tags: [] })
          }
        }
      }
    }
    
    // If we don't have any tag filters, get all illusts that match other filters
    if (targetIllustIds === null) {
      const allIllusts = await db
        .select({ id: illustsTable.id })
        .from(illustsTable)
        .where(and(...filters))
      
      targetIllustIds = allIllusts.map(i => i.id)
      
      if (targetIllustIds.length === 0) {
        return res.json({ tags: [] })
      }
    }
    
    // Now that we have the filtered illust IDs, get the top 10 tags
    // Process in batches to avoid too many SQL parameters
    const batchSize = 1000
    const batches: number[][] = []
    
    for (let i = 0; i < targetIllustIds.length; i += batchSize) {
      batches.push(targetIllustIds.slice(i, i + batchSize))
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
    const response: TagSearchResponse = {
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
    
    res.setHeader('Cache-Control', 'max-age=300')
    return res.json(response)
    
  } catch (error) {
    console.error('Top tags error:', error)
    return res.status(500).json({ 
      error: 'An error occurred while fetching top tags',
      message: error instanceof Error ? error.message : String(error)
    })
  }
}

export default api
