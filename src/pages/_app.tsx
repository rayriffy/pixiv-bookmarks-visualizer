import { Fragment, useState } from 'react'

import { NextPage } from 'next'
import { AppProps } from 'next/app'
import Head from 'next/head'

import { SWRConfig } from 'swr'

import { SearchBarContext } from '../context/SearchBarContext'
import { minimumSizer } from '../context/defaults/minimumSizer'
import { SearchBar } from '../modules/searchBar/components'

import { MinimumSizer } from '../core/@types/MinimumSizer'

import '../styles/tailwind.css'

const App: NextPage<AppProps> = props => {
  const { Component, pageProps } = props

  const includedTagsState = useState<string[]>([])
  const excludedTagsState = useState<string[]>([])
  const restrictState = useState<'all' | 'public' | 'private'>('public')
  const aspectState = useState<'all' | 'horizontal' | 'vertical'>('all')
  const minimumSizerState = useState<MinimumSizer>(minimumSizer)
  const blurState = useState<boolean>(false)
  const ai = useState<'all' | 'non-ai-only' | 'ai-only'>('all')
  const minimumPageCount = useState<string>('0')
  const maximumPageCount = useState<string>('0')

  return (
    <SWRConfig 
      value={{
        fetcher: (resource, init) => fetch(resource, init).then(res => res.json())
      }}
    >
      <Head>
        <title>Pixiv bookmark visualizer</title>
      </Head>
      <SearchBarContext.Provider
        value={{
          includeTags: includedTagsState,
          excludeTags: excludedTagsState,
          restriction: restrictState,
          aspect: aspectState,
          minimumSizer: minimumSizerState,
          blur: blurState,
          aiMode: ai,
          minimumPageCount: minimumPageCount,
          maximumPageCount: maximumPageCount,
        }}
      >
        <main className="max-w-7xl mx-auto px-4 py-8">
          <SearchBar />
          <Component {...pageProps} />
        </main>
      </SearchBarContext.Provider>
    </SWRConfig>
  )
}

export default App
