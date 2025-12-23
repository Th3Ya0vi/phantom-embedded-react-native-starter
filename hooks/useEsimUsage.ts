import { useState, useCallback } from 'react'
import { useApiActions } from '@/hooks/useApiActions'

export const useEsimUsage = () => {
  const { handleUsageCheck } = useApiActions()

  const [usage, setUsage] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkUsage = useCallback(
    async (esimTranNoList: string[]) => {
      if (!esimTranNoList.length) return null

      setLoading(true)
      setError(null)

      try {
        const res = await handleUsageCheck({
          esimTranNoList,
        })
        setUsage(res)
        return res
      } catch (err: any) {
        setError(err.message || 'Usage check failed')
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    usage,
    loading,
    error,
    checkUsage,
  }
}
