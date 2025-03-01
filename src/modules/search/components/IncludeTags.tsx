import Async from 'react-select/async'
import { WindowedMenuList } from 'react-windowed-select'
import { useContext, useState } from 'react'
import { SearchBarContext } from '../../../context/SearchBarContext'
import { TagSearchRequest } from '../../../core/@types/api/TagSearchRequest'
import { TagSearchResponse } from '../../../core/@types/api/TagSearchResponse'
import { buildURLParams } from '../../../core/services/buildURLParams'
import { TagSearchItem } from './TagSearchItem'

export const IncludeTags = () => {
  const searchBarContext = useContext(SearchBarContext)
  const [tags, setTags] = searchBarContext.includeTags

  const [loading, setLoading] = useState(false)

  const includedTagLoadOptions = async (inputValue: string) => {
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
        value: tag.name.original,
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
    label: <TagSearchItem name={{ original: tag, translated: null }} count={0} />
  }))

  return (
    <fieldset className="fieldset">
      <label className="fieldset-label">Include tags</label>
      <Async
        isMulti
        value={selectValue}
        loadOptions={includedTagLoadOptions}
        isLoading={loading}
        onChange={val => setTags(val.map(o => o.value))}
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