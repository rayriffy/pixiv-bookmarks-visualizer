import { ChangeEventHandler, memo, useCallback, useContext } from 'react'
import { SearchBarContext } from '../../../context/SearchBarContext'

export const PageCount = memo(() => {
  const searchBarContext = useContext(SearchBarContext)
  const [minimumPageCount, setMinimumPageCount] = searchBarContext.minimumPageCount
  const [maximumPageCount, setMaximumPageCount] = searchBarContext.maximumPageCount

  const onMinimumValueChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ target: { value } }) => {
      setMinimumPageCount(value)
    },
    []
  )

  const onMaximumValueChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ target: { value } }) => {
      setMaximumPageCount(value)
    },
    []
  )

  return (
    <span className="isolate inline-flex rounded-md shadow-sm m-1">
      <div className="relative inline-flex items-center rounded-l-md rounded-r-md border border-gray-300 px-4 py-2 text-sm font-medium focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
        <div>
          <label htmlFor="minimumPageCount" className="font-medium text-gray-900">
            Minimum page count:
          </label>
          <input
            id="minimumPageCount"
            name="minimumPageCount"
            value={minimumPageCount}
            onChange={onMinimumValueChange}
            type="number"
            className="max-width-[30px] rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          />
        </div>
        <div>
          <label htmlFor="maximumPageCount" className="font-medium text-gray-900">
            Maximum page count:
          </label>
          <input
            id="maximumPageCount"
            name="maximumPageCount"
            value={maximumPageCount}
            onChange={onMaximumValueChange}
            type="number"
            className="max-width-[30px] rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          />
        </div>
      </div>
    </span>
  )
})
