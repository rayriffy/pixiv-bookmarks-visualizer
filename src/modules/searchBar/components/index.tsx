import { FunctionComponent } from 'react'

import { TagSeachBar } from './tag'
import { Restriction } from './restriction'
import { Aspect } from './aspect'

export const SearchBar: FunctionComponent = () => {
  return (
    <div className="p-6 border border-dashed rounded-xl space-y-4">
      <div className="flex space-x-4">
        <Restriction />
        <Aspect />
      </div>
      <TagSeachBar />
    </div>
  )
}
