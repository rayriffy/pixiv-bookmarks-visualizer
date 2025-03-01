import { createContext, type Dispatch, type SetStateAction } from 'react'

import { minimumSizer } from './defaults/minimumSizer'

import type { MinimumSizer } from '../core/@types/MinimumSizer'

type ReactState<S = any> = [S, Dispatch<SetStateAction<S>>]

// Define a TagItem interface for storing both the name and metadata
export interface TagItem {
  name: string
  translated?: string | null
  count?: number
}

interface Context {
  includeTags: ReactState<TagItem[]>
  excludeTags: ReactState<TagItem[]>
  restriction: ReactState<'all' | 'public' | 'private'>
  aspect: ReactState<'all' | 'horizontal' | 'vertical'>
  minimumSizer: ReactState<MinimumSizer>
  blur: ReactState<boolean>
  aiMode: ReactState<'all' | 'non-ai-only' | 'ai-only'>
  minimumPageCount: ReactState<string>
  maximumPageCount: ReactState<string>
}

export const SearchBarContext = createContext<Context>({
  includeTags: [[], () => {}],
  excludeTags: [[], () => {}],
  restriction: ['public', () => {}],
  aspect: ['all', () => {}],
  minimumSizer: [minimumSizer, () => {}],
  blur: [true, () => {}],
  aiMode: ['all', () => {}],
  minimumPageCount: ['0', () => {}],
  maximumPageCount: ['0', () => {}],
})

// Utility function to update tag counts based on top tags data
export function updateTagCounts(
  existingTags: TagItem[],
  topTags: {
    name: { original: string; translated: string | null }
    count: number
  }[]
): TagItem[] {
  // Create a map of tag counts from top tags for quick lookup
  const tagCountMap = new Map<
    string,
    { count: number; translated: string | null }
  >()

  topTags.forEach(tag => {
    tagCountMap.set(tag.name.original, {
      count: tag.count,
      translated: tag.name.translated,
    })
  })

  // Update existing tags with new counts if available
  return existingTags.map(tag => {
    const updatedInfo = tagCountMap.get(tag.name)
    if (updatedInfo) {
      return {
        ...tag,
        count: updatedInfo.count,
        // Only update the translation if it's not already set or if the new one is available
        translated: tag.translated || updatedInfo.translated,
      }
    }
    return tag
  })
}
