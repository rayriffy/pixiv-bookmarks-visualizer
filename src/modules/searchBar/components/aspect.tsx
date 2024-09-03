import { memo, useContext, useEffect, useState } from 'react'
import { SearchBarContext } from '../../../context/SearchBarContext'

import { classNames } from '../../../core/components/classNames'

export const Aspect = memo(() => {
  const [toggleHorizontal, setToggleHorizontal] = useState(false)
  const [toggleVertical, setToggleVertical] = useState(false)

  const searchBarContext = useContext(SearchBarContext)
  const [_, setAspect] = searchBarContext.aspect

  useEffect(() => {
    const selectedMode =
      toggleHorizontal === toggleVertical
        ? 'all'
        : toggleHorizontal
        ? 'horizontal'
        : 'vertical'
    setAspect(selectedMode)
  }, [toggleHorizontal, toggleVertical])

  return (
    <span className="isolate inline-flex rounded-md shadow-sm m-1">
      <button
        type="button"
        onClick={() => setToggleHorizontal(o => !o)}
        className={classNames(
          toggleHorizontal
            ? 'text-white bg-indigo-600 hover:bg-indigo-500'
            : 'text-gray-500 bg-dark-bg hover:bg-dark-bg-inactive',
          'relative inline-flex items-center rounded-l-md border border-gray-300 px-4 py-2 text-sm font-medium focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
        )}
      >
        Horizontal
      </button>
      <button
        type="button"
        onClick={() => setToggleVertical(o => !o)}
        className={classNames(
          toggleVertical
            ? 'text-white bg-indigo-600 hover:bg-indigo-500'
            : 'text-gray-500 bg-dark-bg hover:bg-dark-bg-inactive',
          'relative -ml-px inline-flex items-center rounded-r-md border border-gray-300 px-4 py-2 text-sm font-medium focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
        )}
      >
        Vertical
      </button>
    </span>
  )
})
