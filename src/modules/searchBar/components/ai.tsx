import { memo, useContext, useEffect, useState } from 'react'
import { SearchBarContext } from '../../../context/SearchBarContext'

import { classNames } from '../../../core/components/classNames'

export const AiMode = memo(() => {
  const [toggleAiOnly, setToggleAiOnly] = useState(true)
  const [toggleNonAiOnly, setToggleNonAiOnly] = useState(true)

  const searchBarContext = useContext(SearchBarContext)
  const [_, setAiMode] = searchBarContext.aiMode

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
    <span className="isolate inline-flex rounded-md shadow-sm m-1">
      <button
        type="button"
        onClick={() => setToggleAiOnly(o => !o)}
        className={classNames(
          toggleAiOnly
            ? 'text-white bg-indigo-600 hover:bg-indigo-500'
            : 'text-gray-700 bg-white hover:bg-gray-50',
          'relative inline-flex items-center rounded-l-md border border-gray-300 px-4 py-2 text-sm font-medium focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
        )}
      >
        Non-Ai
      </button>
      <button
        type="button"
        onClick={() => setToggleNonAiOnly(o => !o)}
        className={classNames(
          toggleNonAiOnly
            ? 'text-white bg-indigo-600 hover:bg-indigo-500'
            : 'text-gray-700 bg-white hover:bg-gray-50',
          'relative -ml-px inline-flex items-center rounded-r-md border border-gray-300 px-4 py-2 text-sm font-medium focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
        )}
      >
        Ai
      </button>
    </span>
  )
})
