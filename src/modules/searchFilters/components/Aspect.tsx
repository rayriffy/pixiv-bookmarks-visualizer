import { ChangeEvent, useContext, useEffect, useState } from 'react'
import { SearchBarContext } from '../../../context/SearchBarContext'

export const Aspect = () => {
  const [toggleHorizontal, setToggleHorizontal] = useState(false)
  const [toggleVertical, setToggleVertical] = useState(false)

  const searchBarContext = useContext(SearchBarContext)
  const [_, setAspect] = searchBarContext.aspect

  const handleClick = (variant: 'horizontal' | 'vertical') => (event: ChangeEvent<HTMLInputElement>) => {
    if (variant === 'horizontal')
      setToggleHorizontal(event.target.checked)
    else
      setToggleVertical(event.target.checked)
  }

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
    <>
      <label className="fieldset-label">Orientation</label>
      <div className={"flex gap-4"}>
        <label className="fieldset-label">
          <input type="checkbox" className="checkbox" checked={toggleHorizontal} onChange={handleClick('horizontal')} />
          Horizontal
        </label>
        <label className="fieldset-label">
          <input type="checkbox" className="checkbox" checked={toggleVertical} onChange={handleClick('vertical')} />
          Vertical
        </label>
      </div>
    </>
  )
}