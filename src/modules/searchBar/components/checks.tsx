import { memo, useContext } from 'react'
import { SearchBarContext } from '../../../context/SearchBarContext'

export const Checks = memo(() => {
  const searchBarContext = useContext(SearchBarContext)
  const [_, setBlur] = searchBarContext.blur

  return (
    <div className="space-y-4">
    <div className="relative flex items-start">
      <div className="flex h-6 items-center">
        <input
          id="blur"
          name="blur"
          onChange={e => {
            setBlur(e.target.checked)
          }}
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
        />
      </div>
      <div className="ml-3 text-sm leading-6">
        <label htmlFor="blur" className="font-medium text-gray-900">
          SFW Mode
        </label>
      </div>
    </div>
    </div>
  )
})
