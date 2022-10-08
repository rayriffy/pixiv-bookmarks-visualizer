export const getOptimizedIllustUrl = (
  illustId: number,
  illustType: string,
  imageUrl: string
) =>
  `/api/${
    illustType === 'ugoira' ? 'ugoiraProxy' : 'pixivProxy'
  }?${new URLSearchParams({
    url: imageUrl,
    illustId: illustId.toString(),
  })}`
