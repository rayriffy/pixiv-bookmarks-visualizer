import { useTagSearch } from '../hooks/useTagSearch'
import { useSearchParams } from '../../../hooks/useSearchParams'
import { useRef } from 'react'
import dynamic from 'next/dynamic'
import type { TagItem } from '../../../core/@types/TagItem'

const TagSelector = dynamic(() => import('./TagSelector').then(o => o.TagSelector))

export const IncludeTags = () => {
  const { includeTags, excludeTags, setIncludeTags } = useSearchParams()
  const isUpdating = useRef(false)

  // Use the custom hook for tag search, passing both include and exclude tags
  // so we don't suggest tags that are already selected in either category
  const loadOptions = useTagSearch(includeTags, [...includeTags, ...excludeTags])

  // Wrapper for setIncludeTags to ensure clean updates
  const handleTagsChange = (newTags: TagItem[]) => {
    if (isUpdating.current) return
    
    isUpdating.current = true
    
    try {
      // Ensure we're calling with a properly defined array, even if empty
      setIncludeTags(newTags || []);
    } finally {
      // Reset after a delay
      setTimeout(() => {
        isUpdating.current = false
      }, 100)
    }
  }

  return (
    <TagSelector
      label="Include tags"
      tags={includeTags}
      loadOptions={loadOptions}
      onChange={handleTagsChange}
    />
  )
}