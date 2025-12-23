// hooks/useApiExecutor.ts
import { useState, useCallback } from 'react'

export const useApiExecutor = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const execute = useCallback(async (apiFn: () => Promise<any>) => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiFn()
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { execute, loading, error }
}
