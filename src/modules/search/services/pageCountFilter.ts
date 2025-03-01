import { ExtendedPixivIllust } from '../../../core/@types/ExtendedPixivIllust'
import { SearchRequest } from '../../../core/@types/api/SearchRequest'

// search image count for work
export const pageCountFilter =
  (searchRequest: SearchRequest) =>
    (illust: ExtendedPixivIllust): boolean => {
      const maximumPageCount = Number(searchRequest.maximumPageCount);
      return illust.page_count >= Number(searchRequest.minimumPageCount) && (maximumPageCount <= 0 || illust.page_count <= maximumPageCount)
    }

