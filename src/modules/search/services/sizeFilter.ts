import type { ExtendedPixivIllust } from '../../../core/@types/ExtendedPixivIllust'
import type { SearchRequest } from '../../../core/@types/api/SearchRequest'

// search image size
export const sizeFilter =
  (searchRequest: SearchRequest) =>
  (illust: ExtendedPixivIllust): boolean => {
    if (searchRequest.sizerMode === 'none') return true

    return illust[searchRequest.sizerMode] >= Number(searchRequest.sizerSize)
  }
