import { type SQL, eq, gte, lte, ne, sql } from "drizzle-orm";

import type { SearchRequest } from "$types/SearchRequest";
import { illustsTable } from "$db/schema";
import type { MinimumSizer } from "$types/MinimumSizer";

/**
 * Process search request parameters into standardized arrays
 */
export interface ProcessedTags {
    includeTags: string[];
    excludeTags: string[];
}

export const processTagParams = (searchRequest: SearchRequest): ProcessedTags => {
    const includeTags = Array.isArray(searchRequest.includeTags)
        ? searchRequest.includeTags
        : typeof searchRequest.includeTags === "string"
          ? searchRequest.includeTags === ""
              ? []
              : [searchRequest.includeTags]
          : [];

    const excludeTags = Array.isArray(searchRequest.excludeTags)
        ? searchRequest.excludeTags
        : typeof searchRequest.excludeTags === "string"
          ? searchRequest.excludeTags === ""
              ? []
              : [searchRequest.excludeTags]
          : [];

    return { includeTags, excludeTags };
};

/**
 * Create SQL filters from a search request
 */
export const createFiltersFromSearchRequest = (searchRequest: SearchRequest): SQL[] => {
    const filters: SQL[] = [];

    // Parse numeric parameters
    const minimumPageCount = Number(searchRequest.minimumPageCount) || 0;
    const maximumPageCount = Number(searchRequest.maximumPageCount) || 0;
    const sizerSize = Number(searchRequest.sizerSize) || 0;

    // 1. Restriction filter (public/private bookmarks)
    if (searchRequest.restrict === "public") {
        filters.push(eq(illustsTable.bookmark_private, false));
    } else if (searchRequest.restrict === "private") {
        filters.push(eq(illustsTable.bookmark_private, true));
    }

    // 2. Aspect ratio filter (horizontal/vertical)
    if (searchRequest.aspect === "horizontal") {
        filters.push(sql`${illustsTable.width} / ${illustsTable.height} >= 1`);
    } else if (searchRequest.aspect === "vertical") {
        filters.push(sql`${illustsTable.width} / ${illustsTable.height} <= 1`);
    }

    // 3. Size filter (minimum width/height)
    if (searchRequest.sizerMode !== "none" && sizerSize > 0) {
        // Type guard to make TypeScript happy
        const validSizerModes: MinimumSizer["mode"][] = ["width", "height"];
        if (validSizerModes.includes(searchRequest.sizerMode)) {
            if (searchRequest.sizerMode === "width") {
                filters.push(gte(illustsTable.width, sizerSize));
            } else if (searchRequest.sizerMode === "height") {
                filters.push(gte(illustsTable.height, sizerSize));
            }
        }
    }

    // 4. Page count filter
    if (minimumPageCount > 0) {
        filters.push(gte(illustsTable.page_count, minimumPageCount));
    }
    if (maximumPageCount > 0) {
        filters.push(lte(illustsTable.page_count, maximumPageCount));
    }

    // 5. AI filter
    if (searchRequest.aiMode === "non-ai-only") {
        filters.push(ne(illustsTable.illust_ai_type, 2));
    } else if (searchRequest.aiMode === "ai-only") {
        filters.push(eq(illustsTable.illust_ai_type, 2));
    }

    return filters;
};
