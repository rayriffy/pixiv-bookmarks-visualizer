import debounce from 'lodash/debounce'
import {
  ChangeEventHandler,
  memo,
  useCallback,
  useContext,
  useState,
} from 'react'
import { SearchBarContext } from '../../../context/SearchBarContext'
import { classNames } from '../../../core/components/classNames'

export const Sizer = memo(() => {
  const searchBarContext = useContext(SearchBarContext)
  const [minimumSizer, setMinimumSizer] = searchBarContext.minimumSizer

  const toggleMode = (action: 'width' | 'height') => {
    setMinimumSizer(prev => ({
      ...prev,
      mode: minimumSizer.mode === action ? 'none' : action,
    }))
  }

  const [input, setInput] = useState(minimumSizer.size.toString())

  const setDebounceInput = debounce(value => {
    if (
      !Number.isNaN(Number(value)) &&
      Number(value) >= 0 &&
      value.length !== 0
    ) {
      setMinimumSizer(prev => ({
        ...prev,
        size: Number(value),
      }))
    }
  }, 400)

  const onChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ target: { value } }) => {
      setInput(value)
      setDebounceInput(value)
    },
    []
  )

  return (
    <span className="isolate inline-flex rounded-md shadow-sm m-1">
      <button
        type="button"
        onClick={() => toggleMode('width')}
        className={classNames(
          minimumSizer.mode === 'width'
            ? 'text-white bg-indigo-600 hover:bg-indigo-500'
            : 'text-gray-500 bg-dark-bg hover:bg-dark-bg-inactive',
          'relative inline-flex items-center rounded-l-md border border-gray-300 px-4 py-2 text-sm font-medium focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
        )}
      >
        W
      </button>
      <button
        type="button"
        onClick={() => toggleMode('height')}
        className={classNames(
          minimumSizer.mode === 'height'
            ? 'text-white bg-indigo-600 hover:bg-indigo-500'
            : 'text-gray-500 bg-dark-bg hover:bg-dark-bg-inactive',
          'relative -ml-px inline-flex items-center border border-gray-300 px-4 py-2 text-sm font-medium focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
        )}
      >
        H
      </button>
      <div className="relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={onChange}
          className="form-input block w-full rounded-r-md border-gray-300 pr-12 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-500 bg-dark-bg hover:bg-dark-bg-inactive"
        />
        <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
          <kbd className="inline-flex items-center rounded border border-gray-200 px-2 font-sans text-sm font-medium text-gray-500 bg-dark-bg hover:bg-dark-bg-inactive">
            px
          </kbd>
        </div>
      </div>
    </span>
  )
})
