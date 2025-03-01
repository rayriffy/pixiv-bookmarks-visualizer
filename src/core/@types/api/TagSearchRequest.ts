export interface TagSearchRequest {
  query: string
  selectedTags: string[]
  limit?: number | string
}
