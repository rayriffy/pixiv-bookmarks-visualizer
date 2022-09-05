import { NextPage } from 'next'
import { useRouter } from 'next/router'

import { stringify } from 'querystring'
import { useMemo, useContext } from 'react'
import useSWR from 'swr'

import { buildURLParams } from '../core/services/buildURLParams'
import { SearchBarContext } from '../context/SearchBarContext'
import { Pagination } from '../core/components/pagination'

import { SearchRequest } from '../core/@types/api/SearchRequest'
import { SearchResult } from '../core/@types/api/SearchResult'

const Page: NextPage = props => {
  const { query } = useRouter()

  // Context
  const searchBarContext = useContext(SearchBarContext)
  const [tags] = searchBarContext.tags
  const [restrict] = searchBarContext.restriction
  const [aspect] = searchBarContext.aspect
  const [minimumSizer] = searchBarContext.minimumSizer

  const pageNumber = useMemo(
    () => (query.page === undefined ? 1 : Number(query.page as string)),
    [query]
  )

  const searchPayload = useMemo<SearchRequest>(
    () => ({
      page: pageNumber.toString(),
      tags,
      restrict,
      aspect,
      sizerMode: minimumSizer.mode,
      sizerSize: minimumSizer.size.toString(),
    }),
    [pageNumber, tags, restrict, aspect, minimumSizer.mode, minimumSizer.size]
  )

  const { data, error } = useSWR<SearchResult, any, string>(
    `/api/search?${buildURLParams(searchPayload)}`,
    (...args) => fetch(...args).then(res => res.json())
  )

  return (
    <div className="py-6">
      {!data && !error ? (
        <h1>Loading</h1>
      ) : error ? (
        <h1>Failed to fetch</h1>
      ) : (
        <section>
          <div className="my-1">
            <h2 className="text-sm font-semibold">
              {(data.count ?? -1).toLocaleString()} images found, with a total
              of {data.paginate.max.toLocaleString()} pages
            </h2>
          </div>
          <Pagination {...data.paginate} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6 items-center">
            {data.illusts.map(illust => (
              <div key={`illust-${illust.id}`} className="mx-auto">
                <a
                  href={`https://www.pixiv.net/artworks/${illust.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative"
                >
                  <div className="absolute bg-black px-1.5 py-0.5 text-xs font-mono text-white opacity-70 z-10 top-0 left-0">
                    {illust.width} x {illust.height}
                  </div>
                  <img
                    src={`/api/pixivProxy?${stringify({
                      url: illust.image_urls.medium,
                    })}`}
                    width={illust.width}
                    height={illust.height}
                    loading="lazy"
                  />
                </a>
              </div>
            ))}
          </div>
          <Pagination {...data.paginate} />
        </section>
      )}
    </div>
  )
}

export default Page
