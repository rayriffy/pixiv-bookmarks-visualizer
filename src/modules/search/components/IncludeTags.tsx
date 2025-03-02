import { useContext } from 'react'
import { SearchBarContext } from '../../../context/SearchBarContext'
import { TagSelector } from './TagSelector'
import { useTagSearch } from '../hooks/useTagSearch'

export const IncludeTags = () => {
  const searchBarContext = useContext(SearchBarContext)
  const [tags, setTags] = searchBarContext.includeTags

  // Use the custom hook for tag search
  const loadOptions = useTagSearch(tags)

  return (
    <TagSelector
      label="Include tags"
      tags={tags}
      loadOptions={loadOptions}
      onChange={setTags}
    />
  )
}
