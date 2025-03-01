import { ChangeEvent, useContext, useEffect, useState } from 'react'
import { SearchBarContext } from '../../../context/SearchBarContext'

export const AI = () => {
  const [toggleAiOnly, setToggleAiOnly] = useState(false)
  const [toggleNonAiOnly, setToggleNonAiOnly] = useState(false)

  const searchBarContext = useContext(SearchBarContext)
  const [_, setAiMode] = searchBarContext.aiMode

  const handleClick = (variant: 'ai' | 'human') => (event: ChangeEvent<HTMLInputElement>) => {
    if (variant === 'ai')
      setToggleAiOnly(event.target.checked)
    else
      setToggleNonAiOnly(event.target.checked)
  }

  useEffect(() => {
    const selectedMode =
      toggleAiOnly === toggleNonAiOnly
        ? 'all'
        : toggleAiOnly
          ? 'non-ai-only'
          : 'ai-only'
    setAiMode(selectedMode)
  }, [toggleAiOnly, toggleNonAiOnly])

  return (
    <>
      <label className="fieldset-label">AI generated</label>
      <div className={"flex gap-4"}>
        <label className="fieldset-label">
          <input type="checkbox" className="checkbox" checked={toggleNonAiOnly} onChange={handleClick('human')} />
          Non-AI
        </label>
        <label className="fieldset-label">
          <input type="checkbox" className="checkbox" checked={toggleAiOnly} onChange={handleClick('ai')} />
          AI
        </label>
      </div>
    </>
  )
}