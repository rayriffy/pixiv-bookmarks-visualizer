import { type ChangeEvent, useContext, useEffect, useState } from 'react'
import { SearchBarContext } from '../../../context/SearchBarContext'

export const BookmarkType = () => {
  const [togglePublic, setTogglePublic] = useState(true)
  const [togglePrivate, setTogglePrivate] = useState(false)

  const searchBarContext = useContext(SearchBarContext)
  const [_, setRestriction] = searchBarContext.restriction

  const handleClick =
    (variant: 'public' | 'private') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      if (variant === 'public') setTogglePublic(event.target.checked)
      else setTogglePrivate(event.target.checked)
    }

  useEffect(() => {
    const selectedMode =
      togglePublic === togglePrivate
        ? 'all'
        : togglePublic
          ? 'public'
          : 'private'
    setRestriction(selectedMode)
  }, [togglePublic, togglePrivate])

  return (
    <>
      <label className="fieldset-label">Bookmark type</label>
      <div className={'flex gap-4'}>
        <label className="fieldset-label">
          <input
            type="checkbox"
            className="checkbox"
            checked={togglePublic}
            onChange={handleClick('public')}
          />
          Public
        </label>
        <label className="fieldset-label">
          <input
            type="checkbox"
            className="checkbox"
            checked={togglePrivate}
            onChange={handleClick('private')}
          />
          Private
        </label>
      </div>
    </>
  )
}
