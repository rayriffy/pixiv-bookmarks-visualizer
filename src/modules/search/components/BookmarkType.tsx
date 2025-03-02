import { type ChangeEvent, useEffect, useState, useRef } from 'react'
import { useSearchParams } from '../../../hooks/useSearchParams'

export const BookmarkType = () => {
  const { restriction, setRestriction } = useSearchParams()
  const isFirstRender = useRef(true)
  const isHandlingChange = useRef(false)
  
  // Initialize local state based on restriction value
  const [togglePublic, setTogglePublic] = useState(
    restriction === 'public' || restriction === 'all'
  )
  const [togglePrivate, setTogglePrivate] = useState(
    restriction === 'private' || restriction === 'all'
  )

  // Update local state when restriction changes from URL
  useEffect(() => {
    if (isHandlingChange.current) return
    
    setTogglePublic(restriction === 'public' || restriction === 'all')
    setTogglePrivate(restriction === 'private' || restriction === 'all')
  }, [restriction])

  const handleClick =
    (variant: 'public' | 'private') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      isHandlingChange.current = true
      
      if (variant === 'public') setTogglePublic(event.target.checked)
      else setTogglePrivate(event.target.checked)
      
      // Reset the flag after a small delay to allow state updates to complete
      setTimeout(() => {
        isHandlingChange.current = false
      }, 50)
    }

  useEffect(() => {
    // Skip on first render to avoid double initialization
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    
    // Skip if we're handling a change from the URL
    if (!isHandlingChange.current) return
    
    const selectedMode =
      togglePublic === togglePrivate
        ? 'all'
        : togglePublic
          ? 'public'
          : 'private'
    setRestriction(selectedMode)
  }, [togglePublic, togglePrivate, setRestriction])

  return (
    <>
      <label className="fieldset-label">Bookmark type</label>
      <div className={'flex gap-4'}>
        <label className="fieldset-label">
          <input
            type="checkbox"
            className="checkbox"
            checked={togglePublic}
            onChange={handleClick('public')}
          />
          Public
        </label>
        <label className="fieldset-label">
          <input
            type="checkbox"
            className="checkbox"
            checked={togglePrivate}
            onChange={handleClick('private')}
          />
          Private
        </label>
      </div>
    </>
  )
}
