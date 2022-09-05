import { memo, useContext, useEffect, useState } from 'react'
import { SearchBarContext } from '../../../context/SearchBarContext'

import { classNames } from '../../../core/components/classNames'

export const Restriction = memo(() => {
  const [togglePublic, setTogglePublic] = useState(true)
  const [togglePrivate, setTogglePrivate] = useState(false)

  const searchBarContext = useContext(SearchBarContext)
  const [_, setRestriction] = searchBarContext.restriction

  useEffect(() => {
    const selectedMode = togglePublic === togglePrivate ? 'all' : togglePublic ? 'public' : 'private'
    setRestriction(selectedMode)
  }, [togglePublic, togglePrivate])

  return (
    <span className="isolate inline-flex rounded-md shadow-sm">
      <button
        type="button"
        onClick={() => setTogglePublic(o => !o)}
        className={classNames(
          togglePublic
            ? 'text-white bg-indigo-600 hover:bg-indigo-500'
            : 'text-gray-700 bg-white hover:bg-gray-50',
          'relative inline-flex items-center rounded-l-md border border-gray-300 px-4 py-2 text-sm font-medium focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
        )}
      >
        Public
      </button>
      <button
        type="button"
        onClick={() => setTogglePrivate(o => !o)}
        className={classNames(
          togglePrivate
            ? 'text-white bg-indigo-600 hover:bg-indigo-500'
            : 'text-gray-700 bg-white hover:bg-gray-50',
          'relative -ml-px inline-flex items-center rounded-r-md border border-gray-300 px-4 py-2 text-sm font-medium focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
        )}
      >
        Private
      </button>
    </span>
  )
})
