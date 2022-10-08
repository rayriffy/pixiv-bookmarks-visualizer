import { memo } from 'react'

import { RectangleStackIcon } from '@heroicons/react/24/solid'
import { ExtendedPixivIllust } from '../../../core/@types/ExtendedPixivIllust'

interface Props {
  illust: ExtendedPixivIllust
}

export const Illust = memo<Props>(props => {
  const { illust } = props

  return (
    <div className="mx-auto relative">
      <a
        href={`https://www.pixiv.net/artworks/${illust.id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="absolute bg-black/70 px-2 py-0.5 text-xs font-mono text-white z-[1] rounded-full top-1 left-1">
          {illust.width} x {illust.height}
        </span>
        {illust.meta_pages.length != 0 && (
          <span className="absolute bg-black/70 z-[1] top-1 right-1 px-2 py-0.5 text-white rounded-full text-xs flex items-center font-bold"><RectangleStackIcon className="w-4 h-4 mr-1" /> {illust.meta_pages.length}</span>
        )}
        <img
          src={`/api/${
            illust.type === 'ugoira' ? 'ugoiraProxy' : 'pixivProxy'
          }?${new URLSearchParams({
            url: illust.image_urls.medium,
            illustId: illust.id.toString(),
          })}`}
          width={illust.width}
          height={illust.height}
          loading="lazy"
        />
      </a>
    </div>
  )
})
