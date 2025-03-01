import type { ExtendedPixivIllust } from '../../../core/@types/ExtendedPixivIllust'

export const supporterFilter = (illust: ExtendedPixivIllust): boolean => {
  return [illust.title, illust.caption].some(line =>
    ['fanbox', 'fantia', 'gumroad', 'patreon'].some(service =>
      line.toLowerCase().includes(service)
    )
  )
}
