import { ExtendedPixivIllust } from '../ExtendedPixivIllust'

export interface SearchResult {
  illusts: ExtendedPixivIllust[]
  count: number
  paginate: {
    current: number
    max: number
  }
}
