import { MinimumSizer } from '../MinimumSizer'

export interface SearchRequest {
  page: string
  tags: string[]
  restrict: 'all' | 'public' | 'private'
  aspect: 'all' | 'horizontal' | 'vertical'
  sizerMode: MinimumSizer['mode']
  sizerSize: string
}
