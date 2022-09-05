import { useState } from 'react'

import { NextPage } from 'next'
import { AppProps } from 'next/app'

import { SearchBarContext } from '../context/SearchBarContext'
import { SearchBar } from '../modules/searchBar/components'

import '../styles/tailwind.css'

const App: NextPage<AppProps> = props => {
  const { Component, pageProps } = props

  const tagState = useState<string[]>([])
  const restrictState = useState<'all' | 'public' | 'private'>('public')
  const aspectState = useState<'all' | 'horizontal' | 'vertical'>('all')

  return (
    <SearchBarContext.Provider
      value={{
        tags: tagState,
        restriction: restrictState,
        aspect: aspectState,
      }}
    >
      <main className="max-w-7xl mx-auto px-4 py-8">
        <SearchBar />
        <Component {...pageProps} />
      </main>
    </SearchBarContext.Provider>
  )
}

export default App
