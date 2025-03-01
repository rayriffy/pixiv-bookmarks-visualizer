export const buildURLParams = (input: any) => {
  return new URLSearchParams(
    Object.entries(input).flatMap(([key, val]) => {
      if (typeof val !== 'object') return [[key, val]]
      // @ts-ignore
      return val.map(o => [key, o])
    })
  ).toString()
}
