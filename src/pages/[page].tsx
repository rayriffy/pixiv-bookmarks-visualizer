import { NextPage } from 'next'
import { useRouter } from 'next/router'

import { useMemo, useContext, useEffect } from 'react'
import useSWR from 'swr'

import { buildURLParams } from '../core/services/buildURLParams'
import { SearchBarContext, TagItem, updateTagCounts } from '../context/SearchBarContext'
import { Pagination } from '../core/components/pagination'
import { Illust } from '../modules/illust/components/Illust'

import { SearchRequest } from '../core/@types/api/SearchRequest'
import { SearchResult } from '../core/@types/api/SearchResult'
import {
  SearchFilters
} from '../modules/search/components/SearchFilters'
import { TopTags } from '../modules/topTags/component/TopTags'
import { Tag } from '../core/@types/api/TagSearchResponse'

const Page: NextPage = props => {
  const { query } = useRouter()

  // Context
  const searchBarContext = useContext(SearchBarContext)
  const [includeTags, setIncludeTags] = searchBarContext.includeTags
  const [excludeTags, setExcludeTags] = searchBarContext.excludeTags
  const [restrict] = searchBarContext.restriction
  const [aspect] = searchBarContext.aspect
  const [minimumSizer] = searchBarContext.minimumSizer
  const [aiMode] = searchBarContext.aiMode
  const [minimumPageCount] = searchBarContext.minimumPageCount
  const [maximumPageCount] = searchBarContext.maximumPageCount

  const pageNumber = useMemo(
    () => (query.page === undefined ? 1 : Number(query.page as string)),
    [query]
  )

  // Extract just the tag names for the API request
  const includeTagNames = useMemo(() => includeTags.map(tag => tag.name), [includeTags])
  const excludeTagNames = useMemo(() => excludeTags.map(tag => tag.name), [excludeTags])

  const searchPayload = useMemo<SearchRequest>(
    () => ({
      page: pageNumber.toString(),
      includeTags: includeTagNames,
      excludeTags: excludeTagNames,
      restrict,
      aspect,
      sizerMode: minimumSizer.mode,
      sizerSize: minimumSizer.size.toString(),
      aiMode: aiMode,
      minimumPageCount: minimumPageCount,
      maximumPageCount: maximumPageCount,
    }),
    [pageNumber, includeTagNames, excludeTagNames, restrict, aspect, minimumSizer.mode, minimumSizer.size, aiMode, minimumPageCount, maximumPageCount]
  )

  const { data, error } = useSWR<SearchResult, any, string>(
    `/api/search?${buildURLParams(searchPayload)}`
  )
  const { data: topTagsResponse, error: topTagsError } = useSWR<{ tags: Tag[] }, any, string>(
    `/api/topTags?${buildURLParams(searchPayload)}`
  )
  
  // Update tag counts when top tags data changes
  useEffect(() => {
    if (topTagsResponse?.tags && topTagsResponse.tags.length > 0) {
      // Update include tags counts - use functional update to avoid closure issues
      if (includeTags.length > 0) {
        setIncludeTags(prev => updateTagCounts(prev, topTagsResponse.tags));
      }
      
      // Update exclude tags counts - use functional update to avoid closure issues
      if (excludeTags.length > 0) {
        setExcludeTags(prev => updateTagCounts(prev, topTagsResponse.tags));
      }
    }
  }, [topTagsResponse, setIncludeTags, setExcludeTags]);

  return (
    <main className={"p-4"}>
      <section className={"grid md:grid-cols-2 lg:grid-cols-4 gap-4"}>
        <SearchFilters />
        <TopTags tags={topTagsResponse?.tags ?? []} />
      </section>
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
    </main>
  )
}

export default Page
