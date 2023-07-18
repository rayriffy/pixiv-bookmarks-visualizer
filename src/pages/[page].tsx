import { NextPage } from 'next'
import { useRouter } from 'next/router'

import { useMemo, useContext } from 'react'
import useSWR from 'swr'

import { buildURLParams } from '../core/services/buildURLParams'
import { SearchBarContext } from '../context/SearchBarContext'
import { Pagination } from '../core/components/pagination'
import { Illust } from '../modules/illust/components/illust'

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
    `/api/search?${buildURLParams(searchPayload)}`
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
            <h2 className="text-sm">
              <span className="font-bold">
                {(data!.count ?? -1).toLocaleString()} images
              </span>{' '}
              found, with a total of{' '}
              <span className="font-bold">
                {data!.paginate.max.toLocaleString()} pages
              </span>
            </h2>
          </div>
          <Pagination {...data!.paginate} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12 items-center">
            {data!.illusts.map(illust => (
              <Illust key={`illust-${illust.id}`} illust={illust} />
            ))}
          </div>
          <Pagination {...data!.paginate} />
        </section>
      )}
    </div>
  )
}

export default Page
