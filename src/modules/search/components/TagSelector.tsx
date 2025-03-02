import Async from 'react-select/async'
import { WindowedMenuList } from 'react-windowed-select'
import { useState } from 'react'
import type { TagItem } from '../../../context/SearchBarContext'
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

  return (
    <fieldset className="fieldset">
      <label className="fieldset-label">{label}</label>
      <Async
        isMulti
        value={selectValue}
        loadOptions={handleLoadOptions}
        isLoading={loading}
        onChange={val => onChange(val.map(o => o.value as TagItem))}
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
