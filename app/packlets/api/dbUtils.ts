import type { ExtendedPixivIllust } from "$types/ExtendedPixivIllust";

// SQLite parameters limit
export const SQLITE_PARAMS_LIMIT = 500;

/**
 * User data structure
 */
interface UserData {
    id: number;
    name: string;
    account: string;
    profile_image_urls: string;
    is_followed: boolean | null;
}

/**
 * Tag data structure
 */
interface TagData {
    name: string;
    translated_name: string | null;
}

/**
 * Convert database result to ExtendedPixivIllust structure
 */
interface DbIllustResult {
    illusts: {
        id: number;
        title: string;
        type: string;
        caption: string;
        create_date: string;
        page_count: number;
        width: number;
        height: number;
        sanity_level: number;
        total_view: number;
        total_bookmarks: number;
        is_bookmarked: boolean;
        visible: boolean;
        x_restrict: number;
        is_muted: boolean;
        total_comments: number;
        illust_ai_type: number;
        illust_book_style: number;
        restrict: number;
        bookmark_private: boolean;
        image_urls: string;
        meta_single_page: string;
        meta_pages: string;
        tools: string;
        url: string | null;
    };
    users: UserData;
    tags: Array<TagData>;
}

export function dbResultToPixivIllust(result: DbIllustResult): ExtendedPixivIllust {
    const illust = result.illusts;

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
        url: illust.url ?? "",
        user: {
            id: result.users.id,
            name: result.users.name,
            account: result.users.account,
            profile_image_urls: JSON.parse(result.users.profile_image_urls),
            is_followed: result.users.is_followed ?? false,
            comment: "",
        },
        tags: result.tags.map((tag) => ({
            name: tag.name,
            translated_name: tag.translated_name,
        })),
    };
}

/**
 * Process queries in batches to avoid "too many SQL variables" error
 */
export async function batchedQuery<T>(idArray: number[], queryFn: (ids: number[]) => Promise<T[]>): Promise<T[]> {
    let allResults: T[] = [];

    for (let i = 0; i < idArray.length; i += SQLITE_PARAMS_LIMIT) {
        const batchIds = idArray.slice(i, i + SQLITE_PARAMS_LIMIT);
        const batchResults = await queryFn(batchIds);
        allResults = [...allResults, ...batchResults];
    }

    return allResults;
}

/**
 * Group tags by illust_id from tag query results
 */
export function groupTagsByIllustId(tagResults: { illust_id: number; tag: TagData }[]): Map<number, TagData[]> {
    const tagsByIllustId = new Map<number, TagData[]>();

    for (const result of tagResults) {
        const illustId = result.illust_id;
        const tags = tagsByIllustId.get(illustId) || [];
        tags.push(result.tag);
        tagsByIllustId.set(illustId, tags);
    }

    return tagsByIllustId;
}

/**
 * Map users to illusts by illust_id
 */
export function mapUsersByIllustId(userResults: { illust_id: number; users: UserData }[]): Map<number, UserData> {
    const usersByIllustId = new Map<number, UserData>();

    for (const result of userResults) {
        usersByIllustId.set(result.illust_id, result.users);
    }

    return usersByIllustId;
}
