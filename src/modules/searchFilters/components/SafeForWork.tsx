import { useContext } from 'react'
import { SearchBarContext } from '../../../context/SearchBarContext'

export const SafeForWork = () => {
  const searchBarContext = useContext(SearchBarContext)
  const [blur, setBlur] = searchBarContext.blur

  return (
    <>
      <label className="fieldset-label">Danger zone</label>
      <label className="fieldset-label">
        <input
          type="checkbox"
          checked={blur}
          onChange={e => {
            setBlur(e.target.checked)
          }}
          className="toggle" />
        SFW mode
      </label>
    </>
  )
}