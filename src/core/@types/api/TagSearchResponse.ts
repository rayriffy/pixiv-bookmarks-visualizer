export interface Tag {
  name: {
    original: string
    translated: string | null
  }
  count: number
  isIncludeTag?: boolean
}

export interface TagSearchResponse {
  tags: Tag[]
}