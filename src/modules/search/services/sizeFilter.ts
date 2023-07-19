import { ExtendedPixivIllust } from '../../../core/@types/ExtendedPixivIllust'
import { SearchRequest } from '../../../core/@types/api/SearchRequest'

// search image size
export const sizeFilter =
  (searchRequest: SearchRequest) =>
  (illust: ExtendedPixivIllust): boolean => {
    if (searchRequest.sizerMode === 'none') return true
    else
      return illust[searchRequest.sizerMode] >= Number(searchRequest.sizerSize)
  }
