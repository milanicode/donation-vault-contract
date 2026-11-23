import { useEffect, useState } from 'react'

/** `Date.now()`, refreshed once a second so countdowns tick. */
export function useNowMs(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}
