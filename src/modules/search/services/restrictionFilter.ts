import { ExtendedPixivIllust } from '../../../core/@types/ExtendedPixivIllust'
import { SearchRequest } from '../../../core/@types/api/SearchRequest'

// search restriction
export const restrictionFilter =
  (searchRequest: SearchRequest) =>
  (illust: ExtendedPixivIllust): boolean => {
    if (searchRequest.restrict === 'all') return true
    else if (searchRequest.restrict === 'public')
      return illust.bookmark_private === false
    else if (searchRequest.restrict === 'private')
      return illust.bookmark_private === true
    return false
  }
