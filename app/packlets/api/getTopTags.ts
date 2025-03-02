import { and, count, inArray, sql } from "drizzle-orm";

import type { TagSearchResponse } from "$types/TagSearchResponse";
import type { SearchRequest } from "$types/SearchRequest";
import type { Tag } from "$types/Tag";
import { illustTagsTable, illustsTable, tagsTable } from "$db/schema";
import { getDbClient } from "$db/connect";
import { batchedQuery } from "./dbUtils";
import { createFiltersFromSearchRequest, processTagParams } from "./filterUtils";
import { processTagFilters } from "./tagFilterUtils";

/**
 * Get top tags for illusts matching the search request
 * Optimized to use indexes and efficient batched queries
 */
export const getTopTags = async (searchRequest: SearchRequest): Promise<TagSearchResponse> => {
    const db = getDbClient();

    // Create base filters from search request
    const filters = createFiltersFromSearchRequest(searchRequest);

    // Process tag filters using optimized tag filter utility
    const tags = processTagParams(searchRequest);
    const targetIllustIds = await processTagFilters(tags, filters);

    // If there are no matching illusts after filtering, return empty result
    if (targetIllustIds !== null && targetIllustIds.length === 0) {
        return { tags: [] };
    }

    // Get final list of illusts to analyze
    let illustsToAnalyze: number[];

    if (targetIllustIds !== null) {
        // Use the IDs from tag filtering
        illustsToAnalyze = targetIllustIds;
    } else {
        // Get all illusts that match the base filters
        const allIllusts = await db
            .select({ id: illustsTable.id })
            .from(illustsTable)
            .where(and(...filters));

        illustsToAnalyze = allIllusts.map((i) => i.id);

        if (illustsToAnalyze.length === 0) {
            return { tags: [] };
        }
    }

    // Get tag counts for all filtered illusts using batched queries
    // This uses the optimized batchedQuery utility and leverages the illust_id index
    async function getTagCountsForBatch(illustIds: number[]): Promise<{ tag_id: number; count: number }[]> {
        return db
            .select({
                tag_id: illustTagsTable.tag_id,
                count: count(illustTagsTable.illust_id),
            })
            .from(illustTagsTable)
            .where(inArray(illustTagsTable.illust_id, illustIds))
            .groupBy(illustTagsTable.tag_id)
            .orderBy(sql`count(${illustTagsTable.illust_id}) DESC`); // Fix the SQL syntax
    }

    // Process using batched query utility for better efficiency
    const tagResultsBatches = await batchedQuery(illustsToAnalyze, getTagCountsForBatch);

    // Combine all batches into a single tag count map
    const tagCounts = new Map<number, number>();

    // Accumulate counts from all batches
    // The type returned by batchedQuery is flattened, so we iterate directly
    for (const result of tagResultsBatches) {
        const currentCount = tagCounts.get(result.tag_id) || 0;
        tagCounts.set(result.tag_id, currentCount + Number(result.count));
    }

    // If we have include tags, prepare to make sure they are included in results
    const includeTagNames = searchRequest.includeTags || [];
    const includeTagNameSet = new Set(Array.isArray(includeTagNames) ? includeTagNames : [includeTagNames]);
    let includeTagIds: number[] = [];

    // Get tag ids for include tags if any exist
    if (includeTagNameSet.size > 0) {
        // Convert set back to array for the query
        const includeTagNamesArray = Array.from(includeTagNameSet);

        // Only query if we have tags to look up
        if (includeTagNamesArray.length > 0) {
            const includeTags = await db
                .select({
                    id: tagsTable.id,
                    name: tagsTable.name,
                })
                .from(tagsTable)
                .where(inArray(tagsTable.name, includeTagNamesArray));

            // Map of tag name to id
            const includeTagMap = new Map(includeTags.map((tag) => [tag.name, tag.id]));

            // Build list of include tag IDs
            includeTagIds = includeTagNamesArray
                .map((tagName) => includeTagMap.get(tagName))
                .filter(Boolean) as number[];

            // Ensure these appear in our tag counts
            for (const tagId of includeTagIds) {
                if (!tagCounts.has(tagId)) {
                    tagCounts.set(tagId, 0);
                }
            }
        }
    }

    // Short-circuit if no tags found
    if (tagCounts.size === 0) {
        return { tags: [] };
    }

    // Convert to array for sorting and get top tags
    // 1. Sort by count descending
    // 2. Take the top 10, ensuring include tags are in the list
    let sortedTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);

    // Filter out include tags from the main results to avoid duplicates
    const otherTags = sortedTags.filter(([tagId]) => !includeTagIds.includes(tagId));

    // Get the top tags excluding those already in include tags
    const topOtherTags = otherTags.slice(0, 10);

    // Prepare final tag IDs list - we'll first get all the tag details
    const tagIds = [...includeTagIds, ...topOtherTags.map(([id]) => id)];

    // If no tag IDs to look up, return empty result
    if (tagIds.length === 0) {
        return { tags: [] };
    }

    // Get tag info for all these tags - using batchedQuery for safety
    const allTagDetails = await batchedQuery(tagIds, async (batchIds) => {
        return db
            .select({
                id: tagsTable.id,
                name: tagsTable.name,
                translated_name: tagsTable.translated_name,
            })
            .from(tagsTable)
            .where(inArray(tagsTable.id, batchIds));
    });

    // Create a map for faster lookups
    const tagDetailsMap = new Map(allTagDetails.map((tag) => [tag.id, tag]));

    // Format the response for include tags first, then top tags
    // We'll skip include tags in the top tags section to avoid duplicates
    const includeTagsResponse = includeTagIds
        .map((tagId) => {
            const tag = tagDetailsMap.get(tagId);
            const count = tagCounts.get(tagId) || 0;

            if (!tag) return null;

            return {
                name: {
                    original: tag.name,
                    translated: tag.translated_name || null,
                },
                count,
                isIncludeTag: true, // Mark as include tag for UI
            };
        })
        .filter(Boolean);

    // Format the response for top tags
    const topTagsResponse = topOtherTags
        .map(([tagId]) => {
            const tag = tagDetailsMap.get(tagId);
            const count = tagCounts.get(tagId) || 0;

            if (!tag) return null;

            return {
                name: {
                    original: tag.name,
                    translated: tag.translated_name || null,
                },
                count,
                isIncludeTag: false, // Not an include tag
            };
        })
        .filter(Boolean);

    // Return both sets of tags
    // The filter(Boolean) removes any null values, so the result is an array of Tag objects
    // but TypeScript needs help to understand this
    return {
        tags: [...includeTagsResponse, ...topTagsResponse].filter(Boolean) as unknown as Tag[],
    };
};
