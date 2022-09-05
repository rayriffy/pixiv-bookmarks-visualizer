export interface TagSearchResponse {
  tags: {
    name: {
      original: string
      translated: string | null
    }
    count: number
  }[]
}
