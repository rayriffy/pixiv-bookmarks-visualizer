import { memo } from 'react'
import NextImage from 'next/image'

import { stringify } from 'querystring'

export const Image = memo<React.ComponentProps<typeof NextImage>>(props => (
  <NextImage
    {...props}
    src={`/api/pixivProxy?${stringify({
      url: props.src as string,
    })}`}
  />
))
