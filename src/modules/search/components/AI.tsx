import { type ChangeEvent, useEffect, useState, useRef } from 'react'
import { useSearchParams } from '../../../hooks/useSearchParams'

export const AI = () => {
  const { aiMode, setAiMode } = useSearchParams()
  const isFirstRender = useRef(true)
  const isHandlingChange = useRef(false)

  // Initialize local state based on aiMode value
  const [toggleAiOnly, setToggleAiOnly] = useState(aiMode === 'ai-only')
  const [toggleNonAiOnly, setToggleNonAiOnly] = useState(
    aiMode === 'non-ai-only'
  )

  // Update local state when aiMode changes from URL
  useEffect(() => {
    if (isHandlingChange.current) return

    setToggleAiOnly(aiMode === 'ai-only')
    setToggleNonAiOnly(aiMode === 'non-ai-only')
  }, [aiMode])

  const handleClick =
    (variant: 'ai' | 'human') => (event: ChangeEvent<HTMLInputElement>) => {
      isHandlingChange.current = true

      if (variant === 'ai') setToggleAiOnly(event.target.checked)
      else setToggleNonAiOnly(event.target.checked)

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
      toggleAiOnly === toggleNonAiOnly
        ? 'all'
        : toggleAiOnly
          ? 'non-ai-only'
          : 'ai-only'
    setAiMode(selectedMode)
  }, [toggleAiOnly, toggleNonAiOnly, setAiMode])

  return (
    <>
      <label className="fieldset-label">AI generated</label>
      <div className={'flex gap-4'}>
        <label className="fieldset-label">
          <input
            type="checkbox"
            className="checkbox"
            checked={toggleNonAiOnly}
            onChange={handleClick('human')}
          />
          Non-AI
        </label>
        <label className="fieldset-label">
          <input
            type="checkbox"
            className="checkbox"
            checked={toggleAiOnly}
            onChange={handleClick('ai')}
          />
          AI
        </label>
      </div>
    </>
  )
}
