import { createContext, Dispatch, SetStateAction } from 'react'

import { minimumSizer } from './defaults/minimumSizer'

import { MinimumSizer } from '../core/@types/MinimumSizer'

type ReactState<S = any> = [S, Dispatch<SetStateAction<S>>]

interface Context {
  tags: ReactState<string[]>
  restriction: ReactState<'all' | 'public' | 'private'>
  aspect: ReactState<'all' | 'horizontal' | 'vertical'>
  minimumSizer: ReactState<MinimumSizer>
  blur: ReactState<boolean>
}

export const SearchBarContext = createContext<Context>({
  tags: [[], () => {}],
  restriction: ['public', () => {}],
  aspect: ['all', () => {}],
  minimumSizer: [minimumSizer, () => {}],
  blur: [true, () => {}],
})
