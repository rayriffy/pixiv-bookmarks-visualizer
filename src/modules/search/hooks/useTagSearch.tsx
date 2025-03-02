import type { TagItem } from '../../../context/SearchBarContext'
import type { TagSearchRequest } from '../../../core/@types/api/TagSearchRequest'
import type { TagSearchResponse } from '../../../core/@types/api/TagSearchResponse'
import { buildURLParams } from '../../../core/services/buildURLParams'
import { TagSearchItem } from '../components/TagSearchItem'
import type { ReactElement } from 'react'

export const useTagSearch = (selectedTags: TagItem[]) => {
  return async (
    inputValue: string
  ): Promise<
    {
      value: TagItem
      label: ReactElement
    }[]
  > => {
    try {
      const tagSearchPayload: TagSearchRequest = {
        query: inputValue,
        selectedTags: selectedTags.map(t => t.name), // Use just the names for the API
      }

      const expectedResults: TagSearchResponse = await fetch(
        `/api/tagSearch?${buildURLParams(tagSearchPayload)}`
      ).then(o => o.json())

      return expectedResults.tags.map(tag => ({
        value: {
          name: tag.name.original,
          translated: tag.name.translated,
          count: tag.count,
        } as TagItem,
        label: <TagSearchItem {...tag} />,
      }))
    } catch (e) {
      console.error(e)
      return []
    }
  }
}
