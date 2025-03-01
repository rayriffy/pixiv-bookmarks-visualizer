import {
  type ChangeEventHandler,
  useCallback,
  useContext,
  useState,
} from 'react'
import debounce from 'lodash/debounce'
import { SearchBarContext } from '../../../context/SearchBarContext'
import { classNames } from '../../../core/components/classNames'

export const Size = () => {
  const searchBarContext = useContext(SearchBarContext)
  const [minimumSizer, setMinimumSizer] = searchBarContext.minimumSizer

  const toggleMode = (action: 'width' | 'height') => () => {
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
    <>
      <label className="fieldset-label">Size</label>
      <div className={'join'}>
        <button
          onClick={toggleMode('width')}
          className={classNames(
            'btn btn-sm join-item',
            minimumSizer.mode === 'width' ? 'btn-neutral' : ''
          )}
        >
          Width
        </button>
        <button
          onClick={toggleMode('height')}
          className={classNames(
            'btn btn-sm join-item',
            minimumSizer.mode === 'height' ? 'btn-neutral' : ''
          )}
        >
          Height
        </button>
        <label className={'input input-sm join-item w-full'}>
          <input
            type="text"
            className="grow"
            value={input}
            onChange={onChange}
          />
          <span className="badge badge-neutral badge-sm">px</span>
        </label>
      </div>
    </>
  )
}
