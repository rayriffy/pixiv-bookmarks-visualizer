import { type SQL, and, count, desc, eq, inArray } from 'drizzle-orm'
import type { SearchRequest } from '../@types/api/SearchRequest'
import { getDbClient } from '../../db/connect'
import {
  illustTagsTable,
  illustUsersTable,
  illustsTable,
  tagsTable,
  usersTable,
} from '../../db/schema'
import {
  dbResultToPixivIllust,
  groupTagsByIllustId,
  mapUsersByIllustId,
  batchedQuery,
  SQLITE_PARAMS_LIMIT,
} from './dbUtils'
import type { SearchResult } from '../@types/api/SearchResult'
import { createFiltersFromSearchRequest, processTagParams } from './filterUtils'
import { processTagFilters } from './tagFilterUtils'

/**
 * Search illusts with optimized queries leveraging indexes
 */
export async function searchIllusts(
  searchRequest: SearchRequest
): Promise<SearchResult> {
  const db = getDbClient()
  const pageSize = 30
  const page = Number(searchRequest.page) || 1
  const offset = (page - 1) * pageSize

  // Create base filters from search request
  const filters: SQL[] = createFiltersFromSearchRequest(searchRequest)

  // Process tag filters using optimized tag filter utility
  const tags = processTagParams(searchRequest)
  const targetIllustIds = await processTagFilters(tags, filters)

  // If we have specific illust IDs from tag filtering
  if (targetIllustIds !== null) {
    if (targetIllustIds.length === 0) {
      // If there are no matching illusts after tag filtering, return empty
      return { illusts: [], count: 0, paginate: { current: page, max: 0 } }
    }

    // DON'T add the full array of IDs to filters - handle large arrays specially
    // This is to avoid "too many SQL variables" error with large arrays
  }

  // Get the total count first to support pagination
  let total = 0;
  
  if (targetIllustIds === null) {
    // If no tag filters, just count with base filters
    const [countResult] = await db
      .select({ total: count() })
      .from(illustsTable)
      .where(and(...filters));
    total = countResult.total;
  } else {
    // If we have target illust IDs, count them directly
    total = targetIllustIds.length;
  }

  // Early return if no results
  if (total === 0) {
    return { illusts: [], count: 0, paginate: { current: page, max: 0 } }
  }

  // Get the illusts for the current page
  let illustIds: number[] = [];

  if (targetIllustIds === null) {
    // If no tag filters, get illusts with pagination
    const results = await db
      .select({ id: illustsTable.id })
      .from(illustsTable)
      .where(and(...filters))
      .orderBy(desc(illustsTable.id))
      .limit(pageSize)
      .offset(offset);
    
    illustIds = results.map(r => r.id);
  } else {
    // If we have target illust IDs from tag filtering, paginate them in memory
    // Sort in descending order (newest first)
    const sortedIds = [...targetIllustIds].sort((a, b) => b - a);
    illustIds = sortedIds.slice(offset, offset + pageSize);
  }

  if (illustIds.length === 0) {
    return { illusts: [], count: 0, paginate: { current: page, max: 0 } }
  }

  // Get full illust data for the paginated IDs
  const illustResults = await db
    .select({ illusts: illustsTable })
    .from(illustsTable)
    .where(inArray(illustsTable.id, illustIds))
    .orderBy(desc(illustsTable.id));

  // Get user data and tag data in parallel
  const [userResults, tagResults] = await Promise.all([
    // User data
    db
      .select({
        illust_id: illustUsersTable.illust_id,
        users: usersTable,
      })
      .from(illustUsersTable)
      .innerJoin(usersTable, eq(illustUsersTable.user_id, usersTable.id))
      .where(inArray(illustUsersTable.illust_id, illustIds)),

    // Tag data
    db
      .select({
        illust_id: illustTagsTable.illust_id,
        tag: tagsTable,
      })
      .from(illustTagsTable)
      .innerJoin(tagsTable, eq(illustTagsTable.tag_id, tagsTable.id))
      .where(inArray(illustTagsTable.illust_id, illustIds)),
  ]);

  // Map users to illusts
  const usersByIllustId = mapUsersByIllustId(userResults);

  // Group tags by illust
  const tagsByIllustId = groupTagsByIllustId(tagResults);

  // Combine all the data into ExtendedPixivIllust format
  const illusts = illustResults.map(result => {
    const combinedResult = {
      illusts: result.illusts,
      users: usersByIllustId.get(result.illusts.id),
      tags: tagsByIllustId.get(result.illusts.id) || [],
    }
    return dbResultToPixivIllust(combinedResult)
  });

  // Construct the final result with pagination
  return {
    illusts,
    count: total,
    paginate: {
      current: page,
      max: Math.ceil(total / pageSize),
    },
  }
}