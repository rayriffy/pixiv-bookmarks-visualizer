import { memo, useContext, useState } from 'react'

import Async from 'react-select/async'
import { WindowedMenuList } from 'react-windowed-select'

import { buildURLParams } from '../../../core/services/buildURLParams'

import { TagSearchRequest } from '../../../core/@types/api/TagSearchRequest'
import { TagSearchResponse } from '../../../core/@types/api/TagSearchResponse'
import { SearchBarContext } from '../../../context/SearchBarContext'

export const TagSeachBar = memo(() => {
  const searchBarContext = useContext(SearchBarContext)
  const [includeTags, setIncludeTags] = searchBarContext.includeTags
  const [excludeTags, setExcludeTags] = searchBarContext.excludeTags

  const [loadingIncludedTags, setLoadingIncludedTags] = useState(false)
  const [loadingExcludedTags, setLoadingExcludedTags] = useState(false)

  // This code must be duplicated due to the separation of results
  const includedTagLoadOptions = async (inputValue: string) => {
    try {
      setLoadingIncludedTags(true)

      const tagSearchPayload: TagSearchRequest = {
        query: inputValue,
        selectedTags: includeTags,
      }

      const expectedResults: TagSearchResponse = await fetch(
        `/api/tagSearch?${buildURLParams(tagSearchPayload)}`
      ).then(o => o.json())

      return expectedResults.tags.map(tag => ({
        value: tag.name.original,
        label: (
          <p className="flex items-center">
            <span className="font-medium">{tag.name.original}</span>
            <span className="ml-2 text-gray-500 text-sm">
              {tag.name.translated}
            </span>
            <span className="text-xs text-white bg-gray-900 py-0.5 px-2 rounded-md ml-2">
              {tag.count}
            </span>
          </p>
        ),
      }))
    } catch (e) {
      console.error(e)
      return []
    } finally {
      setLoadingIncludedTags(false)
    }
  }

  const excludedTagLoadOptions = async (inputValue: string) => {
    try {
      setLoadingExcludedTags(true)

      const tagSearchPayload: TagSearchRequest = {
        query: inputValue,
        selectedTags: excludeTags,
      }

      const expectedResults: TagSearchResponse = await fetch(
        `/api/tagSearch?${buildURLParams(tagSearchPayload)}`
      ).then(o => o.json())

      return expectedResults.tags.map(tag => ({
        value: tag.name.original,
        label: (
          <p className="flex items-center">
            <span className="font-medium">{tag.name.original}</span>
            <span className="ml-2 text-gray-500 text-sm">
              {tag.name.translated}
            </span>
            <span className="text-xs text-white bg-gray-900 py-0.5 px-2 rounded-md ml-2">
              {tag.count}
            </span>
          </p>
        ),
      }))
    } catch (e) {
      console.error(e)
      return []
    } finally {
      setLoadingIncludedTags(false)
    }
  }

  return (
    <div>
      <label htmlFor="tagsLabel" className="font-medium text-gray-900">
        Tag filtering
      </label>
      <Async
        isMulti
        loadOptions={includedTagLoadOptions}
        isLoading={loadingIncludedTags}
        onChange={val => setIncludeTags(val.map(o => o.value))}
        components={{
          MenuList: WindowedMenuList,
        }}
        styles={{
          menu: provided => ({
            ...provided,
            zIndex: 10,
          }),
        }}
      />
      <Async
        isMulti
        loadOptions={excludedTagLoadOptions}
        isLoading={loadingExcludedTags}
        onChange={val => setExcludeTags(val.map(o => o.value))}
        components={{
          MenuList: WindowedMenuList,
        }}
        styles={{
          menu: provided => ({
            ...provided,
            zIndex: 10,
          }),
        }}
      />
    </div>
  )
})
