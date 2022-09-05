import { createContext, Dispatch, SetStateAction } from 'react'

type ReactState<S = any> = [S, Dispatch<SetStateAction<S>>]

interface Context {
  tags: ReactState<string[]>
  restriction: ReactState<'all' | 'public' | 'private'>
  aspect: ReactState<'all' | 'horizontal' | 'vertical'>
}

export const SearchBarContext = createContext<Context>({
  tags: [[], () => {}],
  restriction: ['public', () => {}],
  aspect: ['all', () => {}],
})
