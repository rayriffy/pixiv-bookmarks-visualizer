import { ExtendedPixivIllust } from '../ExtendedPixivIllust'
import { Tag } from './TagSearchResponse'

export interface SearchResult {
  illusts: ExtendedPixivIllust[]
  tags: Tag[]
  count: number
  paginate: {
    current: number
    max: number
  }
}
