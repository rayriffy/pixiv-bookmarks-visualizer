import { ExtendedPixivIllust } from "../ExtendedPixivIllust"

export interface SearchResult {
  illusts: ExtendedPixivIllust[]
  paginate: {
    current: number
    max: number
  }
}
