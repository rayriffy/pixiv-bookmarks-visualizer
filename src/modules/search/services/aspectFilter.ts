import type { ExtendedPixivIllust } from '../../../core/@types/ExtendedPixivIllust'
import type { SearchRequest } from '../../../core/@types/api/SearchRequest'

// search image orientation
export const aspectFilter =
  (searchRequest: SearchRequest) =>
  (illust: ExtendedPixivIllust): boolean => {
    if (searchRequest.aspect === 'all') return true
    if (searchRequest.aspect === 'horizontal')
      return illust.width / illust.height >= 1
    if (searchRequest.aspect === 'vertical')
      return illust.width / illust.height <= 1
    return false
  }
