import { memo, useEffect, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { classNames } from './classNames'

interface Props {
  max: number
  current: number
}

export const Pagination = memo<Props>(props => {
  const { max, current } = props
  const router = useRouter()
  const [searchParams, setSearchParams] = useState('')
  
  // Get current search parameters to preserve them when changing pages
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSearchParams(window.location.search)
    }
  }, [router.asPath])

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
        {Array.from({ length: pageLength }, (_, i) => {
          const pageNum = startPoint + i + 1
          const path = pageNum === 1 ? '/' : `/${pageNum}`
          
          // Preserve search params when changing page
          const href = {
            pathname: path,
            search: searchParams,
          }
          
          return (
            <Link
              key={`pagination-${startPoint + i}`}
              href={href}
              className={classNames(
                'join-item btn',
                current === pageNum ? 'btn-active' : ''
              )}
            >
              {pageNum}
            </Link>
          )
        })}
      </div>
    </div>
  )
})
