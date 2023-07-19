import { ExtendedPixivIllust } from '../../../core/@types/ExtendedPixivIllust'
import { SearchRequest } from '../../../core/@types/api/SearchRequest'

// search image orientation
export const aspectFilter =
  (searchRequest: SearchRequest) =>
  (illust: ExtendedPixivIllust): boolean => {
    if (searchRequest.aspect === 'all') return true
    else if (searchRequest.aspect === 'horizontal')
      return illust.width / illust.height >= 1
    else if (searchRequest.aspect === 'vertical')
      return illust.width / illust.height <= 1
    return false
  }
