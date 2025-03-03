export interface TagSearchRequest {
    query: string;
    selectedTags: string[] | string;
    alreadySelectedTags?: string[] | string;
    limit?: number | string;
}
