import type { ExtendedPixivIllust } from '../@types/ExtendedPixivIllust'
import type { Tag } from '../@types/api/TagSearchResponse'

// SQLite parameters limit
export const SQLITE_PARAMS_LIMIT = 500

/**
 * Convert database result to ExtendedPixivIllust structure
 */
export function dbResultToPixivIllust(result: any): ExtendedPixivIllust {
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
      translated_name: tag.translated_name,
    })),
  }
}

/**
 * Process queries in batches to avoid "too many SQL variables" error
 */
export async function batchedQuery<T>(
  idArray: number[],
  queryFn: (ids: number[]) => Promise<T[]>
): Promise<T[]> {
  let allResults: T[] = []

  for (let i = 0; i < idArray.length; i += SQLITE_PARAMS_LIMIT) {
    const batchIds = idArray.slice(i, i + SQLITE_PARAMS_LIMIT)
    const batchResults = await queryFn(batchIds)
    allResults = [...allResults, ...batchResults]
  }

  return allResults
}

/**
 * Group tags by illust_id from tag query results
 */
export function groupTagsByIllustId(
  tagResults: { illust_id: number; tag: any }[]
): Map<number, any[]> {
  const tagsByIllustId = new Map<number, any[]>()

  tagResults.forEach(result => {
    const illustId = result.illust_id
    const tags = tagsByIllustId.get(illustId) || []
    tags.push(result.tag)
    tagsByIllustId.set(illustId, tags)
  })

  return tagsByIllustId
}

/**
 * Map users to illusts by illust_id
 */
export function mapUsersByIllustId(
  userResults: { illust_id: number; users: any }[]
): Map<number, any> {
  const usersByIllustId = new Map<number, any>()

  userResults.forEach(result => {
    usersByIllustId.set(result.illust_id, result.users)
  })

  return usersByIllustId
}
