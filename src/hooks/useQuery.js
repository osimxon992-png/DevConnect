import { useCallback, useEffect, useState } from 'react'

// Runs an async loader, re-running when deps change. Returns setData for optimistic updates.
export function useQuery(loader, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try { setData(await run()) } catch (e) { setError(e) } finally { setLoading(false) }
  }, [run])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    run().then((d) => alive && setData(d)).catch((e) => alive && setError(e)).finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [run])

  return { data, setData, loading, error, reload }
}
