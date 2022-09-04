import { NextPage } from 'next'
import { useRouter } from 'next/router'

import { stringify } from 'querystring'
import { useMemo, useContext } from 'react'
import useSWR from 'swr'

import { Image } from '../core/components/image'
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

  const pageNumber = useMemo(
    () =>
      query.page === undefined
        ? 1
        : Number((query.page as string[])[(query.page as string[]).length - 1]),
    [query]
  )

  const searchPayload = useMemo<SearchRequest>(
    () => ({
      page: pageNumber.toString(),
      tags,
      restrict,
      aspect,
    }),
    [pageNumber, tags, restrict, aspect]
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
          <Pagination {...data.paginate} />
          <div className="grid grid-cols-5 gap-4 items-center">
            {data.illusts.map(illust => (
              <div key={`illust-${illust.id}`} className="mx-auto">
                <a href={`https://www.pixiv.net/artworks/${illust.id}`} target="_blank" rel="noopener noreferrer">
                  <img
                    src={`/api/pixivProxy?${stringify({
                      url: illust.image_urls.large,
                    })}`}
                    width={illust.width}
                    height={illust.height}
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
