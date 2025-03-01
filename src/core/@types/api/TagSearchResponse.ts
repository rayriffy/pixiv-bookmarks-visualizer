
export interface Tag {
  name: {
    original: string
    translated: string | null
  }
  count: number
}


export interface TagSearchResponse {
  tags: Tag[]
}
