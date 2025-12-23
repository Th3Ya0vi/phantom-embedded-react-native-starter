import { useEffect, useState, useCallback } from 'react'
import { useApiActions } from '@/hooks/useApiActions'
import { useSession } from '@/lib/session/SessionContext'

export const useSubscriptions = () => {
  const { handleGetUserSubscriptions } = useApiActions()
  const { user } = useSession()

  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscriptions = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const res = await handleGetUserSubscriptions(user.id)
      setSubscriptions(res)
    } catch (err: any) {
      setError(err.message || 'Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  return {
    subscriptions,
    loading,
    error,
    refetch: fetchSubscriptions,
  }
}
