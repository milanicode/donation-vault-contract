export type AppRoute =
  | { kind: 'catalog' }
  | { kind: 'about' }
  | { kind: 'team' }
  | { kind: 'campaign'; id: string }
  | { kind: 'missing' }

/** Hash routes: `#/` is the catalog, `#/about` and `#/team` are site pages, `#/c/<id>` is one campaign. */
export function parseRoute(hash: string): AppRoute {
  const path = hash.replace(/^#/, '').replace(/\/+$/, '') || '/'
  if (path === '/') return { kind: 'catalog' }
  if (path === '/about') return { kind: 'about' }
  if (path === '/team') return { kind: 'team' }
  const match = /^\/c\/([a-z0-9-]+)$/.exec(path)
  if (!match?.[1]) return { kind: 'missing' }
  return { kind: 'campaign', id: match[1] }
}
