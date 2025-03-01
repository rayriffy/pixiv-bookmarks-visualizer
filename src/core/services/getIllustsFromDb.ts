import { desc, eq, inArray, like, SQL, and, or } from 'drizzle-orm'
import mem from 'mem'

import { getDbClient } from '../../db/connect'
import { illustsTable, tagsTable, illustTagsTable, usersTable, illustUsersTable } from '../../db/schema'
import { ExtendedPixivIllust } from '../@types/ExtendedPixivIllust'

// SQLite parameters limit
const SQLITE_PARAMS_LIMIT = 500;

// Convert database result to ExtendedPixivIllust structure
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

// Process queries in batches to avoid "too many SQL variables" error
async function batchedQuery<T>(
  idArray: number[],
  queryFn: (ids: number[]) => Promise<T[]>
): Promise<T[]> {
  let allResults: T[] = [];
  
  for (let i = 0; i < idArray.length; i += SQLITE_PARAMS_LIMIT) {
    const batchIds = idArray.slice(i, i + SQLITE_PARAMS_LIMIT);
    const batchResults = await queryFn(batchIds);
    allResults = [...allResults, ...batchResults];
  }
  
  return allResults;
}

// Get all illusts with relations
export const getAllIllusts = mem(async (): Promise<ExtendedPixivIllust[]> => {
  const db = getDbClient()
  
  // Join illusts with users and tags
  const results = await db
    .select({
      illusts: illustsTable,
      users: usersTable,
    })
    .from(illustsTable)
    .innerJoin(
      illustUsersTable,
      eq(illustsTable.id, illustUsersTable.illust_id)
    )
    .innerJoin(
      usersTable,
      eq(illustUsersTable.user_id, usersTable.id)
    )
  
  // Get all tags for each illust
  const illustIds = results.map(result => result.illusts.id)
  const tagsByIllustId = new Map<number, any[]>()
  
  // Process tag queries in batches
  const tagResults = await batchedQuery(illustIds, async (batchIds) => {
    return db
      .select({
        illust_id: illustTagsTable.illust_id,
        tag: tagsTable,
      })
      .from(illustTagsTable)
      .innerJoin(tagsTable, eq(illustTagsTable.tag_id, tagsTable.id))
      .where(inArray(illustTagsTable.illust_id, batchIds))
  })
  
  // Group tags by illust_id
  tagResults.forEach(result => {
    const illustId = result.illust_id
    const tags = tagsByIllustId.get(illustId) || []
    tags.push(result.tag)
    tagsByIllustId.set(illustId, tags)
  })
  
  // Combine results
  return results.map(result => {
    const combinedResult = {
      ...result,
      tags: tagsByIllustId.get(result.illusts.id) || []
    }
    return dbResultToPixivIllust(combinedResult)
  })
}, {
  maxAge: 10000, // 10 seconds cache
})

// Search illusts by tags
export const searchIllustsByTags = async (
  includeTags: string[] = [],
  excludeTags: string[] = []
): Promise<ExtendedPixivIllust[]> => {
  const db = getDbClient()
  
  // Get illustrations that match the tag criteria
  let illustIdsQuery = db
    .select({
      illust_id: illustTagsTable.illust_id,
    })
    .from(illustTagsTable)
    .innerJoin(tagsTable, eq(illustTagsTable.tag_id, tagsTable.id))
  
  // Handle include tags
  let whereClause: SQL | undefined = undefined;
  if (includeTags.length > 0) {
    whereClause = inArray(tagsTable.name, includeTags);
  }
  
  const matchingIllustIds = await db
    .select({
      illust_id: illustTagsTable.illust_id,
    })
    .from(illustTagsTable)
    .innerJoin(tagsTable, eq(illustTagsTable.tag_id, tagsTable.id))
    .where(whereClause)
    .execute()
  const includedIllustIds = matchingIllustIds.map(result => result.illust_id)
  
  // Get illustrations that don't have excluded tags
  let excludedIllustIds: number[] = []
  if (excludeTags.length > 0) {
    const excludeResults = await db
      .select({
        illust_id: illustTagsTable.illust_id,
      })
      .from(illustTagsTable)
      .innerJoin(tagsTable, eq(illustTagsTable.tag_id, tagsTable.id))
      .where(inArray(tagsTable.name, excludeTags))
    
    excludedIllustIds = excludeResults.map(result => result.illust_id)
  }

  // Final list of illust IDs to fetch
  let finalIllustIds: number[];
  if (includeTags.length > 0) {
    finalIllustIds = includedIllustIds.filter(id => !excludedIllustIds.includes(id));
  } else {
    // For all illustrations, we need to fetch in batches too
    const allIllusts = await db.select({ id: illustsTable.id }).from(illustsTable);
    finalIllustIds = allIllusts.map(result => result.id)
      .filter(id => !excludedIllustIds.includes(id));
  }
  
  // If no matching illusts, return empty array
  if (finalIllustIds.length === 0) {
    return []
  }
  
  // Process illust queries in batches
  const results = await batchedQuery(finalIllustIds, async (batchIds) => {
    return db
      .select({
        illusts: illustsTable,
        users: usersTable,
      })
      .from(illustsTable)
      .innerJoin(
        illustUsersTable,
        eq(illustsTable.id, illustUsersTable.illust_id)
      )
      .innerJoin(
        usersTable,
        eq(illustUsersTable.user_id, usersTable.id)
      )
      .where(inArray(illustsTable.id, batchIds))
  });
  
  // Process tag queries in batches
  const tagResults = await batchedQuery(finalIllustIds, async (batchIds) => {
    return db
      .select({
        illust_id: illustTagsTable.illust_id,
        tag: tagsTable,
      })
      .from(illustTagsTable)
      .innerJoin(tagsTable, eq(illustTagsTable.tag_id, tagsTable.id))
      .where(inArray(illustTagsTable.illust_id, batchIds))
  });
  
  // Group tags by illust_id
  const tagsByIllustId = new Map<number, any[]>()
  tagResults.forEach(result => {
    const illustId = result.illust_id
    const tags = tagsByIllustId.get(illustId) || []
    tags.push(result.tag)
    tagsByIllustId.set(illustId, tags)
  })
  
  // Combine results
  return results.map(result => {
    const combinedResult = {
      ...result,
      tags: tagsByIllustId.get(result.illusts.id) || []
    }
    return dbResultToPixivIllust(combinedResult)
  })
}

// Get tag counts
export const getTagCounts = async (
  query?: string,
  selectedTags: string[] = []
): Promise<{ name: string, translated_name: string | null, count: number }[]> => {
  const db = getDbClient()
  
  // Start with base query - we'll define it inside the conditions below
  let tagCounts: { tag_id: number; illust_id: number }[] = [];
  
  // Filter by selected tags if provided
  if (selectedTags.length > 0) {
    // Get illusts that have the selected tags
    const filteredIllusts = await db
      .select({
        illust_id: illustTagsTable.illust_id,
      })
      .from(illustTagsTable)
      .innerJoin(tagsTable, eq(illustTagsTable.tag_id, tagsTable.id))
      .where(inArray(tagsTable.name, selectedTags))
      .execute()
    
    const illustIds = filteredIllusts.map(result => result.illust_id)
    
    // Only include tags from those illusts - in batches if needed
    if (illustIds.length > 0) {
      if (illustIds.length <= SQLITE_PARAMS_LIMIT) {
        tagCounts = await db
          .select({
            tag_id: illustTagsTable.tag_id,
            illust_id: illustTagsTable.illust_id,
          })
          .from(illustTagsTable)
          .where(inArray(illustTagsTable.illust_id, illustIds))
          .execute()
      } else {
        // For large result sets, we'll query in batches and combine
        const allTagCounts: { tag_id: number; illust_id: number }[] = [];
        for (let i = 0; i < illustIds.length; i += SQLITE_PARAMS_LIMIT) {
          const batchIds = illustIds.slice(i, i + SQLITE_PARAMS_LIMIT);
          const batchResults = await db
            .select({
              tag_id: illustTagsTable.tag_id,
              illust_id: illustTagsTable.illust_id,
            })
            .from(illustTagsTable)
            .where(inArray(illustTagsTable.illust_id, batchIds))
            .execute();
          
          allTagCounts.push(...batchResults);
        }
        
        // Count occurrences of each tag
        const countByTagId = new Map<number, number>();
        allTagCounts.forEach(result => {
          const count = countByTagId.get(result.tag_id) || 0;
          countByTagId.set(result.tag_id, count + 1);
        });
        
        // Get tag details - in batches if needed
        const tagIds = Array.from(countByTagId.keys());
        let allTagDetails: { id: number; name: string; translated_name: string | null }[] = [];
        
        for (let i = 0; i < tagIds.length; i += SQLITE_PARAMS_LIMIT) {
          const batchIds = tagIds.slice(i, i + SQLITE_PARAMS_LIMIT);
          const batchResults = await db
            .select()
            .from(tagsTable)
            .where(inArray(tagsTable.id, batchIds))
            .execute();
            
          allTagDetails.push(...batchResults);
        }
        
        // Apply text search if query provided
        if (query && query.length > 0) {
          allTagDetails = allTagDetails.filter(tag => 
            tag.name.toLowerCase().includes(query.toLowerCase()) || 
            (tag.translated_name && tag.translated_name.toLowerCase().includes(query.toLowerCase()))
          );
        }
        
        // Combine with counts
        return allTagDetails.map(tag => ({
          name: tag.name,
          translated_name: tag.translated_name,
          count: countByTagId.get(tag.id) || 0
        })).sort((a, b) => b.count - a.count);
      }
    } else {
      return [] // No matching illusts
    }
  }
  
  // For queries without selected tags
  if (tagCounts.length === 0) {
    tagCounts = await db
      .select({
        tag_id: illustTagsTable.tag_id,
        illust_id: illustTagsTable.illust_id,
      })
      .from(illustTagsTable)
      .execute()
  }
  
  // Count occurrences of each tag
  const countByTagId = new Map<number, number>()
  tagCounts.forEach(result => {
    const count = countByTagId.get(result.tag_id) || 0
    countByTagId.set(result.tag_id, count + 1)
  })
  
  // Get tag details
  const tagIds = Array.from(countByTagId.keys())
  
  // Process tag details in batches if needed
  let tagDetails: { id: number; name: string; translated_name: string | null }[] = [];
  if (tagIds.length <= SQLITE_PARAMS_LIMIT) {
    tagDetails = await db
      .select()
      .from(tagsTable)
      .where(inArray(tagsTable.id, tagIds))
      .execute();
  } else {
    tagDetails = await batchedQuery(tagIds, async (batchIds) => {
      return db
        .select()
        .from(tagsTable)
        .where(inArray(tagsTable.id, batchIds))
        .execute();
    });
  }
  
  // Apply text search if query provided
  if (query && query.length > 0) {
    tagDetails = tagDetails.filter(tag => 
      tag.name.toLowerCase().includes(query.toLowerCase()) || 
      (tag.translated_name && tag.translated_name.toLowerCase().includes(query.toLowerCase()))
    )
  }
  
  // Combine with counts
  return tagDetails.map(tag => ({
    name: tag.name,
    translated_name: tag.translated_name,
    count: countByTagId.get(tag.id) || 0
  })).sort((a, b) => b.count - a.count)
}