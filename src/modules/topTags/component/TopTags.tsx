import { Tag } from '../../../core/@types/api/TagSearchResponse'
import { memo } from 'react'

interface Props {
  tags: Tag[]
}

export const TopTags = memo<Props>(({ tags }) => {
  return (
    <fieldset
      className="fieldset bg-base-100 border border-base-300 p-4 rounded-box col-span-1">
      <legend className="fieldset-legend">Top 20 tags on search results</legend>
      <div className={"flex flex-wrap gap-1"}>
        {tags.map(tag => (
          <p key={`tag-${tag.name}`} className={"bg-base-300 px-2 py-1"}>
            <span className={"text-base-content"}>
              {tag.name.original}
            </span>
            <span className={"px-1 text-base-content/60"}>
              {tag.name.translated}
            </span>
            <span className="text-xs text-white bg-gray-900 py-0.5 px-2 rounded-md ml-2">{tag.count}</span>
          </p>
        ))}
      </div>
    </fieldset>
  )
})