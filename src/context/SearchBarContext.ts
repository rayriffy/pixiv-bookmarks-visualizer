import { createContext, Dispatch, SetStateAction } from 'react'

import { minimumSizer } from './defaults/minimumSizer'

import { MinimumSizer } from '../core/@types/MinimumSizer'

type ReactState<S = any> = [S, Dispatch<SetStateAction<S>>]

interface Context {
  includeTags: ReactState<string[]>
  excludeTags: ReactState<string[]>
  restriction: ReactState<'all' | 'public' | 'private'>
  aspect: ReactState<'all' | 'horizontal' | 'vertical'>
  minimumSizer: ReactState<MinimumSizer>
  blur: ReactState<boolean>
  aiMode: ReactState<'all' | 'non-ai-only' | 'ai-only'>
  minimumPageCount: ReactState<string>
  maximumPageCount: ReactState<string>
}

export const SearchBarContext = createContext<Context>({
  includeTags: [[], () => { }],
  excludeTags: [[], () => { }],
  restriction: ['public', () => { }],
  aspect: ['all', () => { }],
  minimumSizer: [minimumSizer, () => { }],
  blur: [true, () => { }],
  aiMode: ['all', () => { }],
  minimumPageCount: ['0', () => { }],
  maximumPageCount: ['0', () => { }],
})
