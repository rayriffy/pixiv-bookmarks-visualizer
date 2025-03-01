import { Tag } from '../../../core/@types/api/TagSearchResponse'
import { memo, useContext, useMemo } from 'react'
import { SearchBarContext } from '../../../context/SearchBarContext'

interface Props {
  tags: Tag[]
}

export const TopTags = memo<Props>(({ tags }) => {
  const searchBarContext = useContext(SearchBarContext)
  const [includeTags, setIncludeTags] = searchBarContext.includeTags
  const [excludeTags] = searchBarContext.excludeTags

  // Add a tag to the search filter
  const addTagToSearch = (tagName: string) => {
    // Avoid adding duplicates
    if (!includeTags.includes(tagName)) {
      setIncludeTags(prev => [...prev, tagName])
    }
  }

  // Filter out tags that are already in includeTags or excludeTags
  const filteredTags = useMemo(() => {
    return tags.filter(tag => 
      !includeTags.includes(tag.name.original) && 
      !excludeTags.includes(tag.name.original)
    )
  }, [tags, includeTags, excludeTags])

  return (
    <fieldset
      className="fieldset bg-base-100 border border-base-300 p-4 rounded-box col-span-1">
      <legend className="fieldset-legend">Top 10 tags across all results</legend>
      <div className={"flex flex-wrap gap-1"}>
        {filteredTags.length === 0 ? (
          <p className="text-base-content/60 italic">
            {tags.length === 0 
              ? "No tags available or still loading..." 
              : "All top tags are already in your filters"}
          </p>
        ) : (
          filteredTags.map(tag => (
            <p
              key={`tag-${tag.name.original}`}
              className={"bg-base-300 px-2 py-1 cursor-pointer hover:bg-base-200 transition-colors"}
              onClick={() => addTagToSearch(tag.name.original)}
              title="Click to add to search filters"
            >
              <span className={"text-base-content"}>
                {tag.name.original}
              </span>
              {tag.name.translated && (
                <span className={"px-1 text-base-content/60"}>
                  {tag.name.translated}
                </span>
              )}
              <span className="text-xs text-white bg-gray-900 py-0.5 px-2 rounded-md ml-2">{tag.count}</span>
            </p>
          ))
        )}
      </div>
    </fieldset>
  )
})