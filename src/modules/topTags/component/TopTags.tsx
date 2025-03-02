import type { Tag } from '../../../core/@types/api/TagSearchResponse'
import { memo, useMemo } from 'react'
import { useSearchParams } from '../../../hooks/useSearchParams'

interface Props {
  tags: Tag[]
}

export const TopTags = memo<Props>(({ tags }) => {
  const { includeTags, excludeTags, setIncludeTags } = useSearchParams()

  // Add a tag to the search filter with complete information
  const addTagToSearch = (tag: Tag) => {
    // Avoid adding duplicates - check if tag name already exists
    const nameExists = includeTags.some(t => t.name === tag.name.original)

    if (!nameExists) {
      // Add complete tag information with the actual count from the tag
      setIncludeTags(prev => [
        ...prev,
        {
          name: tag.name.original,
          translated: tag.name.translated,
          count: tag.count,
        },
      ])
    }
  }

  // Filter out tags that are already in includeTags or excludeTags
  const filteredTags = useMemo(() => {
    const includeTagNames = includeTags.map(t => t.name)
    const excludeTagNames = excludeTags.map(t => t.name)

    return tags.filter(
      tag =>
        !includeTagNames.includes(tag.name.original) &&
        !excludeTagNames.includes(tag.name.original)
    )
  }, [tags, includeTags, excludeTags])

  return (
    <fieldset className="fieldset bg-base-100 border border-base-300 p-4 rounded-box col-span-1">
      <legend className="fieldset-legend">
        Top 10 tags across all results
      </legend>
      <div className={'flex flex-wrap gap-1'}>
        {filteredTags.length === 0 ? (
          <p className="text-base-content/60 italic">
            {tags.length === 0
              ? 'No tags available or still loading...'
              : 'All top tags are already in your filters'}
          </p>
        ) : (
          filteredTags.map(tag => (
            <p
              key={`tag-${tag.name.original}`}
              className="bg-base-300 px-2 py-1 cursor-pointer hover:bg-base-200 transition-colors"
              onClick={() => addTagToSearch(tag)}
              title="Click to add to search filters"
            >
              <span className="text-base-content">{tag.name.original}</span>
              {tag.name.translated && (
                <span className="px-1 text-base-content/60">
                  {tag.name.translated}
                </span>
              )}
              <span className="text-xs text-white bg-gray-900 py-0.5 px-2 rounded-md ml-2">
                {tag.count}
              </span>
            </p>
          ))
        )}
      </div>
    </fieldset>
  )
})