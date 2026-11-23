import { useEffect, useState } from 'react'
import { parseRoute, type AppRoute } from '../lib/route.ts'

export function useRoute(): AppRoute {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
