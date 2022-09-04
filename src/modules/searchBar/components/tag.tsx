import { FunctionComponent, useContext, useState } from 'react'

import Async from 'react-select/async'

import { buildURLParams } from '../../../core/services/buildURLParams'

import { TagSearchRequest } from '../../../core/@types/api/TagSearchRequest'
import { TagSearchResponse } from '../../../core/@types/api/TagSearchResponse'
import { SearchBarContext } from '../../../context/SearchBarContext'

export const TagSeachBar: FunctionComponent = () => {
  const searchBarContext = useContext(SearchBarContext)
  const [tags, setTags] = searchBarContext.tags

  const [loading, setLoading] = useState(false)
  const tagLoadOptions = async (inputValue: string) => {
    try {
      setLoading(true)

      const tagSearchPayload: TagSearchRequest = {
        query: inputValue,
        selectedTags: tags,
      }

      const expectedResults: TagSearchResponse = await fetch(
        `/api/tagSearch?${buildURLParams(tagSearchPayload)}`
      ).then(o => o.json())

      return expectedResults.tags.map(tag => ({
        value: tag.name,
        label: `${tag.name} (${tag.count})`,
      }))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Async
      isMulti
      loadOptions={tagLoadOptions}
      isLoading={loading}
      onChange={val => setTags(val.map(o => o.value))}
    />
  )
}
