import { type ChangeEventHandler, useCallback, useContext } from 'react'
import { SearchBarContext } from '../../../context/SearchBarContext'

export const PageCount = () => {
  const searchBarContext = useContext(SearchBarContext)
  const [minimumPageCount, setMinimumPageCount] =
    searchBarContext.minimumPageCount
  const [maximumPageCount, setMaximumPageCount] =
    searchBarContext.maximumPageCount

  const onMinimumValueChange = useCallback<
    ChangeEventHandler<HTMLInputElement>
  >(({ target: { value } }) => {
    setMinimumPageCount(value)
  }, [])

  const onMaximumValueChange = useCallback<
    ChangeEventHandler<HTMLInputElement>
  >(({ target: { value } }) => {
    setMaximumPageCount(value)
  }, [])

  return (
    <>
      <label className="fieldset-label">Multi-page illust</label>
      <div className={'grid grid-cols-2 gap-4'}>
        <label className="input input-sm">
          Min
          <input
            type="number"
            className="grow"
            value={minimumPageCount}
            onChange={onMinimumValueChange}
          />
        </label>
        <label className="input input-sm">
          Max
          <input
            type="number"
            className="grow"
            value={maximumPageCount}
            onChange={onMaximumValueChange}
          />
        </label>
      </div>
    </>
  )
}
