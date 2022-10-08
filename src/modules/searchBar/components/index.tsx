import { FunctionComponent } from 'react'

import dynamic from 'next/dynamic'

import { Restriction } from './restriction'
import { Aspect } from './aspect'
import { Sizer } from './sizer'

const TagSeachBar = dynamic(() => import('./tag').then(o => o.TagSeachBar))

export const SearchBar: FunctionComponent = () => {
  return (
    <div className="p-6 border border-dashed rounded-xl space-y-4">
      <div className="flex flex-wrap">
        <Restriction />
        <Aspect />
        <Sizer />
      </div>
      <TagSeachBar />
    </div>
  )
}
