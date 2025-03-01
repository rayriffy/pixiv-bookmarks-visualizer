import type { ExtendedPixivIllust } from '../../../core/@types/ExtendedPixivIllust'
import type { SearchRequest } from '../../../core/@types/api/SearchRequest'

// search restriction
export const restrictionFilter =
  (searchRequest: SearchRequest) =>
  (illust: ExtendedPixivIllust): boolean => {
    if (searchRequest.restrict === 'all') return true
    if (searchRequest.restrict === 'public')
      return illust.bookmark_private === false
    if (searchRequest.restrict === 'private')
      return illust.bookmark_private === true
    return false
  }
