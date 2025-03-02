export const buildURLParams = (input: any) => {
  return new URLSearchParams(
    Object.entries(input).flatMap(([key, val]) => {
      if (typeof val !== 'object') return [[key, val]]
      // @ts-ignore
      return val.map(o => [key, o])
    })
  ).toString()
}

/**
 * Serializes search filter state to URL search params string
 */
export const serializeFiltersToURL = (filters: {
  includeTags?: Array<{ id?: string; name: string }>
  excludeTags?: Array<{ id?: string; name: string }>
  restriction?: 'all' | 'public' | 'private'
  aspect?: 'all' | 'horizontal' | 'vertical'
  minimumSizer?: { mode: 'width' | 'height' | 'none'; size: number }
  blur?: boolean
  aiMode?: 'all' | 'non-ai-only' | 'ai-only'
  minimumPageCount?: number | string
  maximumPageCount?: number | string
}) => {
  const params = new URLSearchParams()
  
  // Handle tags - only store the tag name for shorter URLs
  if (filters.includeTags && filters.includeTags.length > 0) {
    filters.includeTags.forEach(tag => {
      if (tag && tag.name) {
        params.append('include', encodeURIComponent(tag.name))
      }
    })
  }
  
  if (filters.excludeTags && filters.excludeTags.length > 0) {
    filters.excludeTags.forEach(tag => {
      if (tag && tag.name) {
        params.append('exclude', encodeURIComponent(tag.name))
      }
    })
  }
  
  // Handle primitives and simple options
  if (filters.restriction && filters.restriction !== 'all') {
    params.set('restriction', filters.restriction)
  }
  
  if (filters.aspect && filters.aspect !== 'all') {
    params.set('aspect', filters.aspect)
  }
  
  if (filters.blur) {
    params.set('blur', String(filters.blur))
  }
  
  if (filters.aiMode && filters.aiMode !== 'all') {
    params.set('aiMode', filters.aiMode)
  }
  
  // Handle page count - convert to number first to handle "0" value properly
  const minPages = typeof filters.minimumPageCount === 'string' 
    ? parseInt(filters.minimumPageCount, 10) 
    : filters.minimumPageCount
    
  const maxPages = typeof filters.maximumPageCount === 'string'
    ? parseInt(filters.maximumPageCount, 10)
    : filters.maximumPageCount
    
  if (minPages && minPages > 0) {
    params.set('minPages', String(minPages))
  }
  
  if (maxPages && maxPages > 0) {
    params.set('maxPages', String(maxPages))
  }
  
  // Handle size filters
  if (filters.minimumSizer?.mode && 
      filters.minimumSizer.mode !== 'none' && 
      filters.minimumSizer.size && 
      filters.minimumSizer.size > 0) {
    params.set('sizerMode', filters.minimumSizer.mode)
    params.set('sizerSize', String(filters.minimumSizer.size))
  }
  
  return params
}

/**
 * Deserializes URL search params to filter state
 */
export const deserializeURLToFilters = (query: URLSearchParams) => {
  const filters: any = {
    includeTags: [],
    excludeTags: [],
    restriction: 'all',
    aspect: 'all',
    blur: false,
    aiMode: 'all',
    minimumPageCount: '0',
    maximumPageCount: '0',
    minimumSizer: {
      mode: 'none',
      size: 0
    }
  }
  
  // Parse tag names and create simple tag objects
  query.getAll('include').forEach(encodedTag => {
    try {
      // Try to handle JSON format for backward compatibility
      const tagObj = JSON.parse(decodeURIComponent(encodedTag))
      if (tagObj && tagObj.name) {
        filters.includeTags.push(tagObj)
      }
    } catch (err) {
      // Not JSON - just use the tag name directly
      const tagName = decodeURIComponent(encodedTag)
      if (tagName) {
        filters.includeTags.push({ name: tagName })
      }
    }
  })
  
  query.getAll('exclude').forEach(encodedTag => {
    try {
      // Try to handle JSON format for backward compatibility
      const tagObj = JSON.parse(decodeURIComponent(encodedTag))
      if (tagObj && tagObj.name) {
        filters.excludeTags.push(tagObj)
      }
    } catch (err) {
      // Not JSON - just use the tag name directly
      const tagName = decodeURIComponent(encodedTag)
      if (tagName) {
        filters.excludeTags.push({ name: tagName })
      }
    }
  })
  
  // Parse simple options
  if (query.has('restriction')) {
    filters.restriction = query.get('restriction')
  }
  
  if (query.has('aspect')) {
    filters.aspect = query.get('aspect')
  }
  
  if (query.has('blur')) {
    filters.blur = query.get('blur') === 'true'
  }
  
  if (query.has('aiMode')) {
    filters.aiMode = query.get('aiMode')
  }
  
  // Parse page counts
  if (query.has('minPages')) {
    const value = query.get('minPages')
    filters.minimumPageCount = value || '0'
  }
  
  if (query.has('maxPages')) {
    const value = query.get('maxPages')
    filters.maximumPageCount = value || '0'
  }
  
  // Parse size filters
  if (query.has('sizerMode') && query.has('sizerSize')) {
    filters.minimumSizer = {
      mode: query.get('sizerMode') || 'none',
      size: Number(query.get('sizerSize')) || 0
    }
  }
  
  return filters
}