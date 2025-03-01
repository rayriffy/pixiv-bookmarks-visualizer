import type { ExtendedPixivIllust } from '../../../core/@types/ExtendedPixivIllust'

// search image tag
export const tagFilter =
  (includedTags: string[], excludedTags: string[]) =>
  (illust: ExtendedPixivIllust): boolean => {
    if (includedTags.length === 0 && excludedTags.length === 0) return true
    const illustTagNames = illust.tags.map(o => o.name)
    return (
      includedTags.every(tag => illustTagNames.includes(tag)) &&
      excludedTags.every(tag => !illustTagNames.includes(tag))
    )
  }
