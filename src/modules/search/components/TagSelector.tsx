import Async from 'react-select/async'
import { WindowedMenuList } from 'react-windowed-select'
import { useState, useRef } from 'react'
import type { TagItem } from '../../../hooks/useSearchParams'
import { TagSearchItem } from './TagSearchItem'
import type { ReactElement } from 'react'

interface TagSelectorProps {
  label: string
  tags: TagItem[]
  loadOptions: (inputValue: string) => Promise<
    {
      value: TagItem
      label: ReactElement
    }[]
  >
  onChange: (tags: TagItem[]) => void
}

export const TagSelector = ({
  label,
  tags,
  loadOptions,
  onChange,
}: TagSelectorProps) => {
  const [loading, setLoading] = useState(false)
  const isHandlingChange = useRef(false)

  // Create the value object for react-select
  const selectValue = tags.map(tag => ({
    value: tag,
    label: (
      <TagSearchItem
        name={{
          original: tag.name,
          translated: tag.translated || null,
        }}
        count={tag.count || 0}
      />
    ),
  }))

  const handleLoadOptions = async (inputValue: string) => {
    try {
      setLoading(true)
      return await loadOptions(inputValue)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (val: any[]) => {
    // Avoid processing if we're already handling a change
    if (isHandlingChange.current) return

    isHandlingChange.current = true

    try {
      // Extract the tag values and ensure they're valid
      const newTags = Array.isArray(val)
        ? val.map(o => o.value as TagItem).filter(tag => tag && tag.name)
        : []

      // Explicitly call with empty array if all tags were removed
      onChange(newTags)
    } finally {
      // Reset the flag after a delay to allow state to update
      setTimeout(() => {
        isHandlingChange.current = false
      }, 100)
    }
  }

  return (
    <fieldset className="fieldset">
      <label className="fieldset-label">{label}</label>
      <Async
        isMulti
        value={selectValue}
        loadOptions={handleLoadOptions}
        isLoading={loading}
        onChange={handleChange}
        isClearable={true}
        components={{
          MenuList: WindowedMenuList,
        }}
        styles={{
          menu: provided => ({
            ...provided,
            zIndex: 10,
          }),
        }}
        // Force sync updates for multi-select when clearing
        closeMenuOnSelect={false}
      />
    </fieldset>
  )
}
