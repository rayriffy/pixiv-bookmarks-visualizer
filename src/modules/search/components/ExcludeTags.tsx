import { useTagSearch } from '../hooks/useTagSearch'
import { useSearchParams } from '../../../hooks/useSearchParams'
import { useRef } from 'react'
import dynamic from 'next/dynamic'

const TagSelector = dynamic(() => import('./TagSelector').then(o => o.TagSelector))

export const ExcludeTags = () => {
  const { includeTags, excludeTags, setExcludeTags } = useSearchParams()
  const isUpdating = useRef(false)

  // Use the custom hook for tag search, passing both include and exclude tags
  // so we don't suggest tags that are already selected in either category
  const loadOptions = useTagSearch(excludeTags, [...includeTags, ...excludeTags])

  // Wrapper for setExcludeTags to ensure clean updates
  const handleTagsChange = (newTags: any[]) => {
    if (isUpdating.current) return
    
    isUpdating.current = true
    
    try {
      // Ensure we're calling with a properly defined array, even if empty
      setExcludeTags(newTags || []);
    } finally {
      // Reset after a delay
      setTimeout(() => {
        isUpdating.current = false
      }, 100)
    }
  }

  return (
    <TagSelector
      label="Exclude tags"
      tags={excludeTags}
      loadOptions={loadOptions}
      onChange={handleTagsChange}
    />
  )
}