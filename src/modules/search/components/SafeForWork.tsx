import { useRef, useEffect } from 'react'
import { useSearchParams } from '../../../hooks/useSearchParams'

export const SafeForWork = () => {
  const { blur, setBlur } = useSearchParams()
  const isHandlingChange = useRef(false)
  
  // To prevent double-render issues with checkboxes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isHandlingChange.current = true
    setBlur(e.target.checked)
    
    // Reset flag after a delay
    setTimeout(() => {
      isHandlingChange.current = false
    }, 50)
  }

  return (
    <>
      <label className="fieldset-label">Danger zone</label>
      <label className="fieldset-label">
        <input
          type="checkbox"
          checked={blur}
          onChange={handleChange}
          className="toggle"
        />
        SFW mode
      </label>
    </>
  )
}
