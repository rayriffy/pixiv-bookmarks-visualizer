import { type ChangeEvent, useEffect, useState, useRef } from 'react'
import { useSearchParams } from '../../../hooks/useSearchParams'

export const Aspect = () => {
  const { aspect, setAspect } = useSearchParams()
  const isFirstRender = useRef(true)
  const isHandlingChange = useRef(false)
  
  // Initialize local state based on aspect value
  const [toggleHorizontal, setToggleHorizontal] = useState(aspect === 'horizontal')
  const [toggleVertical, setToggleVertical] = useState(aspect === 'vertical')

  // Update local state when aspect changes from URL
  useEffect(() => {
    if (isHandlingChange.current) return
    
    setToggleHorizontal(aspect === 'horizontal')
    setToggleVertical(aspect === 'vertical')
  }, [aspect])

  const handleClick =
    (variant: 'horizontal' | 'vertical') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      isHandlingChange.current = true
      
      if (variant === 'horizontal') setToggleHorizontal(event.target.checked)
      else setToggleVertical(event.target.checked)
      
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
    
    // Skip if we're not handling a user change
    if (!isHandlingChange.current) return
    
    const selectedMode =
      toggleHorizontal === toggleVertical
        ? 'all'
        : toggleHorizontal
          ? 'horizontal'
          : 'vertical'
    setAspect(selectedMode)
  }, [toggleHorizontal, toggleVertical, setAspect])

  return (
    <>
      <label className="fieldset-label">Orientation</label>
      <div className={'flex gap-4'}>
        <label className="fieldset-label">
          <input
            type="checkbox"
            className="checkbox"
            checked={toggleHorizontal}
            onChange={handleClick('horizontal')}
          />
          Horizontal
        </label>
        <label className="fieldset-label">
          <input
            type="checkbox"
            className="checkbox"
            checked={toggleVertical}
            onChange={handleClick('vertical')}
          />
          Vertical
        </label>
      </div>
    </>
  )
}
