import { memo } from 'react'

import Link from 'next/link'
import { classNames } from './classNames'

interface Props {
  max: number
  current: number
}

export const Pagination = memo<Props>(props => {
  const { max, current } = props

  const pageLength: number = max > 5 ? 5 : max
  const startPoint: number =
    max > 5
      ? current - 2 < 1
        ? 0
        : current + 2 > max
        ? max - pageLength
        : current - (pageLength - 2)
      : 0

  return (
    <div className="flex justify-center py-8">
      <div className="join">
        {Array.from({ length: pageLength }, (_, i) => (
          <Link
            key={`pagination-${startPoint + i}`}
            href={startPoint + i === 0 ? '/' : `/${startPoint + i + 1}`}
            className={classNames("join-item btn", current === startPoint + i + 1 ? "btn-active" : "")}
          >
            {startPoint + i + 1}
          </Link>
        ))}
      </div>

    </div>
  );
})
