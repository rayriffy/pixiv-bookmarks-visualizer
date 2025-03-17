import type { MinimumSizer } from "$types/MinimumSizer";

export interface SearchRequest {
    page: string;
    includeTags: string[] | string;
    excludeTags: string[] | string;
    restrict: "all" | "public" | "private";
    aspect: "all" | "horizontal" | "vertical";
    sizerMode: MinimumSizer["mode"];
    sizerSize: string;
    aiMode: "all" | "non-ai-only" | "ai-only";
    minimumPageCount: string;
    maximumPageCount: string;
}
