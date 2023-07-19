import { ExtendedPixivIllust } from '../../../core/@types/ExtendedPixivIllust'

// search image tag
export const tagFilter =
  (searchTags: string[]) =>
  (illust: ExtendedPixivIllust): boolean => {
    return searchTags.length === 0
      ? true
      : searchTags.every(tag => illust.tags.map(o => o.name).includes(tag))
  }
