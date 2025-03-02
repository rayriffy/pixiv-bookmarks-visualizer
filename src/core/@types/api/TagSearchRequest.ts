export interface TagSearchRequest {
  query: string
  selectedTags: string[]
  alreadySelectedTags?: string[]
  limit?: number | string
}