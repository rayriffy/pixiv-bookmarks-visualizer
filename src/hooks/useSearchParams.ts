import { useRouter } from 'next/router'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  serializeFiltersToURL,
  deserializeURLToFilters,
} from '../core/services/buildURLParams'
import { minimumSizer as defaultMinimumSizer } from '../core/constants/minimumSizer'
import type { MinimumSizer } from '../core/@types/MinimumSizer'

// Define a TagItem interface for storing both the name and metadata
export interface TagItem {
  id?: string
  name: string
  translated?: string | null
  count?: number
}

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

export function useSearchParams() {
  const router = useRouter()
  const { query, isReady } = router

  // State for all filter types
  const [includeTags, setIncludeTags] = useState<TagItem[]>([])
  const [excludeTags, setExcludeTags] = useState<TagItem[]>([])
  const [restriction, setRestriction] = useState<'all' | 'public' | 'private'>(
    'public'
  )
  const [aspect, setAspect] = useState<'all' | 'horizontal' | 'vertical'>('all')
  const [minimumSizer, setMinimumSizer] =
    useState<MinimumSizer>(defaultMinimumSizer)
  const [blur, setBlur] = useState<boolean>(false)
  const [aiMode, setAiMode] = useState<'all' | 'non-ai-only' | 'ai-only'>('all')
  const [minimumPageCount, setMinimumPageCount] = useState<string>('0')
  const [maximumPageCount, setMaximumPageCount] = useState<string>('0')

  // Refs to track state
  const isUpdatingFromUrl = useRef(false)
  const pendingUrlUpdate = useRef<NodeJS.Timeout | null>(null)

  // Track previous URL to avoid unnecessary updates
  const prevUrlRef = useRef('')

  // Initialize state from URL
  useEffect(() => {
    if (!isReady) return

    // Skip if we're currently processing an update
    if (isUpdatingFromUrl.current) return

    // Skip if URL hasn't changed
    const currentUrl = window.location.href
    if (currentUrl === prevUrlRef.current) return

    prevUrlRef.current = currentUrl
    isUpdatingFromUrl.current = true

    try {
      const url = new URL(currentUrl)
      const params = new URLSearchParams(url.search)
      const filters = deserializeURLToFilters(params)

      // Set states based on URL parameters
      setIncludeTags(filters.includeTags || [])
      setExcludeTags(filters.excludeTags || [])
      setRestriction(filters.restriction || 'public')
      setAspect(filters.aspect || 'all')
      setBlur(filters.blur || false)
      setAiMode(filters.aiMode || 'all')
      setMinimumPageCount(filters.minimumPageCount?.toString() || '0')
      setMaximumPageCount(filters.maximumPageCount?.toString() || '0')
      setMinimumSizer(filters.minimumSizer || defaultMinimumSizer)
    } finally {
      // Use a small timeout to ensure all state updates complete before allowing URL updates
      setTimeout(() => {
        isUpdatingFromUrl.current = false
      }, 100)
    }
  }, [router.asPath, isReady])

  // Single function to update URL
  const updateURL = useCallback(() => {
    if (!isReady || isUpdatingFromUrl.current) return

    // Get current page number from router
    const pageNumber =
      query.page === undefined ? 1 : Number(query.page as string)

    // Prepare filter state object
    const filterState = {
      includeTags,
      excludeTags,
      restriction: restriction !== 'all' ? restriction : undefined,
      aspect: aspect !== 'all' ? aspect : undefined,
      minimumSizer: minimumSizer.size > 0 ? minimumSizer : undefined,
      blur: blur || undefined,
      aiMode: aiMode !== 'all' ? aiMode : undefined,
      minimumPageCount:
        Number(minimumPageCount) > 0 ? Number(minimumPageCount) : undefined,
      maximumPageCount:
        Number(maximumPageCount) > 0 ? Number(maximumPageCount) : undefined,
    }

    // Serialize to URL parameters
    const params = serializeFiltersToURL(filterState)
    const newParamsString = params.toString()

    // Current URL parameters
    const currentUrl = new URL(window.location.href)
    const currentParams = new URLSearchParams(currentUrl.search)

    // Only update if parameters have changed
    if (currentParams.toString() !== newParamsString) {
      // Update the URL reference before pushing to prevent feedback loop
      prevUrlRef.current = `${window.location.origin}/${pageNumber}${newParamsString ? `?${newParamsString}` : ''}`

      router.push(
        {
          pathname: `/${pageNumber}`,
          search: newParamsString,
        },
        undefined,
        { shallow: true, scroll: false }
      )
    }
  }, [
    router,
    isReady,
    query.page,
    includeTags,
    excludeTags,
    restriction,
    aspect,
    minimumSizer,
    blur,
    aiMode,
    minimumPageCount,
    maximumPageCount,
  ])

  // Debounced URL update to handle all filter changes
  const debouncedUpdateURL = useCallback(() => {
    // Cancel any pending update
    if (pendingUrlUpdate.current) {
      clearTimeout(pendingUrlUpdate.current)
      pendingUrlUpdate.current = null
    }

    // Schedule a new update
    pendingUrlUpdate.current = setTimeout(() => {
      pendingUrlUpdate.current = null
      updateURL()
    }, 200)
  }, [updateURL])

  // Watch for changes to any filter and update URL
  useEffect(() => {
    if (!isReady || isUpdatingFromUrl.current) return
    debouncedUpdateURL()

    // Cleanup on unmount
    return () => {
      if (pendingUrlUpdate.current) {
        clearTimeout(pendingUrlUpdate.current)
      }
    }
  }, [
    isReady,
    includeTags,
    excludeTags,
    restriction,
    aspect,
    minimumSizer,
    blur,
    aiMode,
    minimumPageCount,
    maximumPageCount,
    debouncedUpdateURL,
  ])

  // Create a search payload for API requests
  const searchPayload = useCallback(() => {
    const pageNumber =
      query.page === undefined ? 1 : Number(query.page as string)
    const includeTagNames = includeTags.map(tag => tag.name)
    const excludeTagNames = excludeTags.map(tag => tag.name)

    return {
      page: pageNumber.toString(),
      includeTags: includeTagNames,
      excludeTags: excludeTagNames,
      restrict: restriction,
      aspect,
      sizerMode: minimumSizer.mode,
      sizerSize: minimumSizer.size.toString(),
      aiMode,
      minimumPageCount,
      maximumPageCount,
    }
  }, [
    query.page,
    includeTags,
    excludeTags,
    restriction,
    aspect,
    minimumSizer.mode,
    minimumSizer.size,
    aiMode,
    minimumPageCount,
    maximumPageCount,
  ])

  return {
    // Filter values
    includeTags,
    excludeTags,
    restriction,
    aspect,
    minimumSizer,
    blur,
    aiMode,
    minimumPageCount,
    maximumPageCount,

    // Setters
    setIncludeTags,
    setExcludeTags,
    setRestriction,
    setAspect,
    setMinimumSizer,
    setBlur,
    setAiMode,
    setMinimumPageCount,
    setMaximumPageCount,

    // Helper function for API requests
    searchPayload,
  }
}
