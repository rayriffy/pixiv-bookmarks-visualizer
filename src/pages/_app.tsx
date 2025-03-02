import type { NextPage } from 'next'
import type { AppProps } from 'next/app'
import Head from 'next/head'

import { SWRConfig } from 'swr'

import '../styles/tailwind.css'

const App: NextPage<AppProps> = props => {
  const { Component, pageProps } = props

  return (
    <SWRConfig
      value={{
        fetcher: (resource, init) =>
          fetch(resource, init).then(res => res.json()),
      }}
    >
      <Head>
        <title>Pixiv bookmark visualizer</title>
      </Head>
      <Component {...pageProps} />
    </SWRConfig>
  )
}

export default App
