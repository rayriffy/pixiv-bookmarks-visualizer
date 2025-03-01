import { SQL, and, asc, count, desc, eq, gt, gte, inArray, isNotNull, isNull, like, lt, lte, ne, not, or, sql } from 'drizzle-orm'
import { ExtendedPixivIllust } from '../@types/ExtendedPixivIllust'
import { SearchRequest } from '../@types/api/SearchRequest'
import { getDbClient } from '../../db/connect'
import { illustTagsTable, illustUsersTable, illustsTable, tagsTable, usersTable } from '../../db/schema'
import { MinimumSizer } from '../@types/MinimumSizer'
import { Tag } from '../@types/api/TagSearchResponse'

// Helper to convert DB records to ExtendedPixivIllust objects
function dbResultToPixivIllust(result: any): ExtendedPixivIllust {
  const illust = result.illusts

  return {
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
    total_comments: illust.total_comments,
    illust_ai_type: illust.illust_ai_type,
    illust_book_style: illust.illust_book_style,
    restrict: illust.restrict,
    bookmark_private: illust.bookmark_private,
    image_urls: JSON.parse(illust.image_urls),
    meta_single_page: JSON.parse(illust.meta_single_page),
    meta_pages: JSON.parse(illust.meta_pages),
    tools: JSON.parse(illust.tools),
    url: illust.url,
    user: {
      id: result.users.id,
      name: result.users.name,
      account: result.users.account,
      profile_image_urls: JSON.parse(result.users.profile_image_urls),
      is_followed: result.users.is_followed,
      comment: '',
    },
    tags: result.tags.map((tag: any) => ({
      name: tag.name,
      translated_name: tag.translated_name
    })),
  }
}

export async function searchIllusts(searchRequest: SearchRequest) {
  const db = getDbClient()
  const pageSize = 30
  const page = Number(searchRequest.page) || 1
  const offset = (page - 1) * pageSize

  // Parse pagination parameters
  const minimumPageCount = Number(searchRequest.minimumPageCount) || 0
  const maximumPageCount = Number(searchRequest.maximumPageCount) || 0
  const sizerSize = Number(searchRequest.sizerSize) || 0

  // Build filters
  const filters: SQL[] = []

  // 1. Tag filters (include/exclude)
  const includeTags = Array.isArray(searchRequest.includeTags) 
    ? searchRequest.includeTags 
    : (typeof searchRequest.includeTags === 'string' ? [searchRequest.includeTags] : [])
  
  const excludeTags = Array.isArray(searchRequest.excludeTags) 
    ? searchRequest.excludeTags 
    : (typeof searchRequest.excludeTags === 'string' ? [searchRequest.excludeTags] : [])

  // 2. Restriction filter
  if (searchRequest.restrict === 'public') {
    filters.push(eq(illustsTable.bookmark_private, false))
  } else if (searchRequest.restrict === 'private') {
    filters.push(eq(illustsTable.bookmark_private, true))
  }

  // 3. Aspect ratio filter
  if (searchRequest.aspect === 'horizontal') {
    filters.push(sql`${illustsTable.width} / ${illustsTable.height} >= 1`)
  } else if (searchRequest.aspect === 'vertical') {
    filters.push(sql`${illustsTable.width} / ${illustsTable.height} <= 1`)
  }

  // 4. Size filter
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

  // 5. Page count filter
  if (minimumPageCount > 0) {
    filters.push(gte(illustsTable.page_count, minimumPageCount))
  }
  if (maximumPageCount > 0) {
    filters.push(lte(illustsTable.page_count, maximumPageCount))
  }

  // 6. AI filter
  if (searchRequest.aiMode === 'non-ai-only') {
    filters.push(ne(illustsTable.illust_ai_type, 2))
  } else if (searchRequest.aiMode === 'ai-only') {
    filters.push(eq(illustsTable.illust_ai_type, 2))
  }

  // Create subqueries for tag filters to get illust IDs first
  let targetIllustIds: number[] | null = null

  if (includeTags.length > 0 || excludeTags.length > 0) {
    // For included tags - get illusts that have ALL of these tags
    if (includeTags.length > 0) {
      // For each include tag, get the illust IDs that have this tag
      const includeQueries = await Promise.all(includeTags.map(async (tagName) => {
        const tagResults = await db
          .select({ id: tagsTable.id })
          .from(tagsTable)
          .where(eq(tagsTable.name, tagName))
        
        if (tagResults.length === 0) return []
        
        const tagId = tagResults[0].id
        const illustResults = await db
          .select({ illust_id: illustTagsTable.illust_id })
          .from(illustTagsTable)
          .where(eq(illustTagsTable.tag_id, tagId))
        
        return illustResults.map(r => r.illust_id)
      }))

      // Find the intersection of all illust ID sets - illusts with ALL included tags
      if (includeQueries.length > 0 && includeQueries[0].length > 0) {
        targetIllustIds = includeQueries.reduce((acc, curr) => 
          acc.filter(id => curr.includes(id))
        )
      } else {
        // If any include tag doesn't match any illusts, return empty
        targetIllustIds = []
      }
    }

    // For excluded tags - remove illusts that have ANY of these tags
    if (excludeTags.length > 0 && (targetIllustIds === null || targetIllustIds.length > 0)) {
      const excludeQueries = await Promise.all(excludeTags.map(async (tagName) => {
        const tagResults = await db
          .select({ id: tagsTable.id })
          .from(tagsTable)
          .where(eq(tagsTable.name, tagName))
        
        if (tagResults.length === 0) return []
        
        const tagId = tagResults[0].id
        const illustResults = await db
          .select({ illust_id: illustTagsTable.illust_id })
          .from(illustTagsTable)
          .where(eq(illustTagsTable.tag_id, tagId))
        
        return illustResults.map(r => r.illust_id)
      }))

      // Combine all excluded illust IDs
      const excludedIllustIds = excludeQueries.flat()

      // If we have included tags, filter those results
      if (targetIllustIds !== null) {
        targetIllustIds = targetIllustIds.filter(id => !excludedIllustIds.includes(id))
      } 
      // If we only have excluded tags, get all illusts and exclude these
      else if (excludedIllustIds.length > 0) {
        const allIllusts = await db
          .select({ id: illustsTable.id })
          .from(illustsTable)
        
        targetIllustIds = allIllusts
          .map(illust => illust.id)
          .filter(id => !excludedIllustIds.includes(id))
      }
    }
  }

  // If we have specific illust IDs from tag filtering, add to filters
  if (targetIllustIds !== null) {
    if (targetIllustIds.length === 0) {
      // If there are no matching illusts after tag filtering, return empty
      return { illusts: [], count: 0, tags: [], paginate: { current: page, max: 0 } }
    }
    
    // Add illust ID filter
    filters.push(inArray(illustsTable.id, targetIllustIds))
  }

  // Get the total count first to support pagination
  const [{ total }] = await db
    .select({ total: count() })
    .from(illustsTable)
    .where(and(...filters))

  // Early return if no results
  if (total === 0) {
    return { illusts: [], count: 0, tags: [], paginate: { current: page, max: 0 } }
  }

  // Get the illust data with pagination
  const results = await db
    .select({
      illusts: illustsTable
    })
    .from(illustsTable)
    .where(and(...filters))
    .orderBy(desc(illustsTable.id))
    .limit(pageSize)
    .offset(offset)

  // Get user data for these illusts
  const illustIds = results.map(r => r.illusts.id)

  const userResults = await db
    .select({
      illust_id: illustUsersTable.illust_id,
      users: usersTable
    })
    .from(illustUsersTable)
    .innerJoin(usersTable, eq(illustUsersTable.user_id, usersTable.id))
    .where(inArray(illustUsersTable.illust_id, illustIds))

  // Map users to illusts
  const usersByIllustId = new Map()
  userResults.forEach(result => {
    usersByIllustId.set(result.illust_id, result.users)
  })

  // Get tags for these illusts
  const tagResults = await db
    .select({
      illust_id: illustTagsTable.illust_id,
      tag: tagsTable
    })
    .from(illustTagsTable)
    .innerJoin(tagsTable, eq(illustTagsTable.tag_id, tagsTable.id))
    .where(inArray(illustTagsTable.illust_id, illustIds))

  // Group tags by illust
  const tagsByIllustId = new Map<number, any[]>()
  tagResults.forEach(result => {
    const tags = tagsByIllustId.get(result.illust_id) || []
    tags.push(result.tag)
    tagsByIllustId.set(result.illust_id, tags)
  })

  // Combine all the data into ExtendedPixivIllust format
  const illusts = results.map(result => {
    const combinedResult = {
      illusts: result.illusts,
      users: usersByIllustId.get(result.illusts.id),
      tags: tagsByIllustId.get(result.illusts.id) || []
    }
    return dbResultToPixivIllust(combinedResult)
  })

  // Get related tags for search suggestions
  // 1. Get all tags from the current filtered illusts (excluding already selected tags)
  const allTagsInResults = tagResults
    .filter(t => !includeTags.includes(t.tag.name) && !excludeTags.includes(t.tag.name))
    .map(t => t.tag)

  // 2. Count occurrences of each tag
  const tagCounts = new Map<string, { tag: any, count: number }>()
  allTagsInResults.forEach(tag => {
    if (!tagCounts.has(tag.name)) {
      tagCounts.set(tag.name, { tag, count: 1 })
    } else {
      const current = tagCounts.get(tag.name)!
      tagCounts.set(tag.name, { ...current, count: current.count + 1 })
    }
  })

  // 3. Convert to expected Tag format and sort by count
  const relatedTags: Tag[] = Array.from(tagCounts.values())
    .map(({ tag, count }) => ({
      name: {
        original: tag.name,
        translated: tag.translated_name,
      },
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10 related tags

  // Construct the final result with pagination
  return {
    illusts,
    count: total,
    tags: relatedTags,
    paginate: {
      current: page,
      max: Math.ceil(total / pageSize)
    }
  }
}