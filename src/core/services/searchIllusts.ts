import { SQL, and, count, desc, eq, inArray } from 'drizzle-orm'
import { SearchRequest } from '../@types/api/SearchRequest'
import { getDbClient } from '../../db/connect'
import { illustTagsTable, illustUsersTable, illustsTable, tagsTable, usersTable } from '../../db/schema'
import {
  dbResultToPixivIllust,
  groupTagsByIllustId,
  mapUsersByIllustId,
} from './dbUtils'
import { SearchResult } from '../@types/api/SearchResult'
import { createFiltersFromSearchRequest, processTagParams } from './filterUtils'
import { processTagFilters } from './tagFilterUtils'

export async function searchIllusts(searchRequest: SearchRequest): Promise<SearchResult> {
  const db = getDbClient()
  const pageSize = 30
  const page = Number(searchRequest.page) || 1
  const offset = (page - 1) * pageSize

  // Create base filters from search request
  const filters: SQL[] = createFiltersFromSearchRequest(searchRequest)

  // Process tag filters
  const tags = processTagParams(searchRequest)
  const targetIllustIds = await processTagFilters(tags, filters)

  // If we have specific illust IDs from tag filtering, add to filters
  if (targetIllustIds !== null) {
    if (targetIllustIds.length === 0) {
      // If there are no matching illusts after tag filtering, return empty
      return { illusts: [], count: 0, paginate: { current: page, max: 0 } }
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
    return { illusts: [], count: 0, paginate: { current: page, max: 0 } }
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
  const usersByIllustId = mapUsersByIllustId(userResults)

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
  const tagsByIllustId = groupTagsByIllustId(tagResults)

  // Combine all the data into ExtendedPixivIllust format
  const illusts = results.map(result => {
    const combinedResult = {
      illusts: result.illusts,
      users: usersByIllustId.get(result.illusts.id),
      tags: tagsByIllustId.get(result.illusts.id) || []
    }
    return dbResultToPixivIllust(combinedResult)
  })

  // Construct the final result with pagination
  return {
    illusts,
    count: total,
    paginate: {
      current: page,
      max: Math.ceil(total / pageSize)
    }
  }
}