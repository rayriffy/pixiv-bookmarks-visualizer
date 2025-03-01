import Async from 'react-select/async'
import { WindowedMenuList } from 'react-windowed-select'
import { useContext, useState } from 'react'
import { SearchBarContext, TagItem } from '../../../context/SearchBarContext'
import { TagSearchRequest } from '../../../core/@types/api/TagSearchRequest'
import { TagSearchResponse } from '../../../core/@types/api/TagSearchResponse'
import { buildURLParams } from '../../../core/services/buildURLParams'
import { TagSearchItem } from './TagSearchItem'

export const ExcludeTags = () => {
  const searchBarContext = useContext(SearchBarContext)
  const [tags, setTags] = searchBarContext.excludeTags

  const [loading, setLoading] = useState(false)

  const excludedTagLoadOptions = async (inputValue: string) => {
    try {
      setLoading(true)

      const tagSearchPayload: TagSearchRequest = {
        query: inputValue,
        selectedTags: tags.map(t => t.name), // Use just the names for the API
      }

      const expectedResults: TagSearchResponse = await fetch(
        `/api/tagSearch?${buildURLParams(tagSearchPayload)}`
      ).then(o => o.json())

      return expectedResults.tags.map(tag => ({
        value: {
          name: tag.name.original,
          translated: tag.name.translated,
          count: tag.count
        } as TagItem,
        label: <TagSearchItem {...tag} />,
      }))
    } catch (e) {
      console.error(e)
      return []
    } finally {
      setLoading(false)
    }
  }

  // Create the value object for react-select
  const selectValue = tags.map(tag => ({
    value: tag,
    label: <TagSearchItem 
      name={{ 
        original: tag.name, 
        translated: tag.translated || null 
      }} 
      count={tag.count || 0} 
    />
  }))

  return (
    <fieldset className="fieldset">
      <label className="fieldset-label">Exclude tags</label>
      <Async
        isMulti
        value={selectValue}
        loadOptions={excludedTagLoadOptions}
        isLoading={loading}
        onChange={val => setTags(val.map(o => o.value as TagItem))}
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
    </fieldset>
  )
}