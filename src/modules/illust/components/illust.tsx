import { memo, useEffect, useMemo } from 'react'

import { RectangleStackIcon } from '@heroicons/react/24/solid'
import { ExtendedPixivIllust } from '../../../core/@types/ExtendedPixivIllust'
import { getOptimizedIllustUrl } from '../services/getOptimizedIllustUrl'

interface Props {
  illust: ExtendedPixivIllust
}

export const Illust = memo<Props>(props => {
  const { illust } = props

  const illustSize = useMemo(() => illust.meta_pages.length, [])
  const slicedImage = useMemo(() => illust.meta_pages.slice(1, 3), [])

  useEffect(() => {
    if (slicedImage.length !== 0) {
      console.log(slicedImage)
    }
  }, [])

  return (
    <div className="mx-auto relative">
      <a
        href={`https://www.pixiv.net/artworks/${illust.id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="absolute bg-black/70 px-2 py-0.5 text-xs font-mono text-white z-[4] rounded-full top-1 left-1">
          {illust.width} x {illust.height}
        </span>
        {illustSize !== 0 && (
          <span className="absolute bg-black/70 z-[4] top-1 right-1 px-2 py-0.5 text-white rounded-full text-xs flex items-center font-bold">
            <RectangleStackIcon className="w-4 h-4 mr-1" /> {illustSize}
          </span>
        )}
        <div className="relative">
          <img
            src={getOptimizedIllustUrl(
              illust.id,
              illust.type,
              illust.image_urls.medium
            )}
            width={illust.width}
            height={illust.height}
            loading="lazy"
            className="rounded-lg shadow z-20"
          />
          {slicedImage.map((image, i) => (
            <img
              key={`sub-illust${illust.id}-${i}`}
              src={getOptimizedIllustUrl(
                illust.id,
                illust.type,
                image.image_urls.medium
              )}
              width={illust.width}
              height={illust.height}
              className={`absolute h-auto left-0 right-0 mx-auto rounded-lg ${
                i === 0
                  ? '-bottom-2 -z-10 w-11/12 shadow-lg'
                  : '-bottom-4 -z-20 w-10/12 shadow-xl'
              }`}
            />
          ))}
        </div>
      </a>
    </div>
  )
})
