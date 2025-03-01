import { ExtendedPixivIllust } from '../../../core/@types/ExtendedPixivIllust'
import { SearchRequest } from '../../../core/@types/api/SearchRequest'
/* 
search ai contents
note that illust_ai_type goes is one in {0,1,2}, with 2 meaning full AI and 0 meaning non-ai
1 is thus nonconclusive and is reported as non-ai
*/
export const aiFilter =
  (searchRequest: SearchRequest) =>
    (illust: ExtendedPixivIllust): boolean => {
      if (searchRequest.aiMode === 'all') return true
      else if (searchRequest.aiMode === 'non-ai-only')
        return illust.illust_ai_type !== 2
      else if (searchRequest.aiMode === 'ai-only')
        return illust.illust_ai_type === 2
      return false
    }
