import { describe, expect, it } from 'vitest'
import { parseRoute } from './route.ts'

describe('parseRoute', () => {
  it('treats an empty hash as the catalog', () => {
    expect(parseRoute('')).toEqual({ kind: 'catalog' })
    expect(parseRoute('#/')).toEqual({ kind: 'catalog' })
  })

  it('reads a campaign id', () => {
    expect(parseRoute('#/c/masterclass')).toEqual({ kind: 'campaign', id: 'masterclass' })
  })

  it('ignores a trailing slash', () => {
    expect(parseRoute('#/c/mural/')).toEqual({ kind: 'campaign', id: 'mural' })
  })

  it('reads the site pages', () => {
    expect(parseRoute('#/about')).toEqual({ kind: 'about' })
    expect(parseRoute('#/team/')).toEqual({ kind: 'team' })
  })

  it('rejects anything else', () => {
    expect(parseRoute('#/c/')).toEqual({ kind: 'missing' })
    expect(parseRoute('#/faq')).toEqual({ kind: 'missing' })
    expect(parseRoute('#/c/Has Space')).toEqual({ kind: 'missing' })
  })
})
