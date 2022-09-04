export const buildURLParams = (input: any) => {
  return new URLSearchParams(
    Object.entries(input)
      .map(([key, val]) => {
        if (typeof val !== 'object') return [[key, val]]
        // @ts-ignore
        else return val.map(o => [key, o])
      })
      .flat()
  ).toString()
}