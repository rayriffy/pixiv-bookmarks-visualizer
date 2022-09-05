import { PixivIllust } from 'pixiv.ts'

export interface ExtendedPixivIllust extends PixivIllust {
  bookmark_private: boolean
}
