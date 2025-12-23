import { useCallback } from 'react'
import { apiService } from '@/lib/services/apiService'
import { useApiExecutor } from './useApiExecutor'

export const useApiActions = () => {
  const { execute, loading, error } = useApiExecutor()

  const handleGetUser = useCallback(() => {
    return execute(() => apiService.getUser())
  }, [execute])

const handleLogin = useCallback(
    async (data: { email?: string; walletAddress: string }) => {
      return execute(() => apiService.login(data))
    },
    [execute]
  )

  const handleLogout = useCallback(async () => {
    return execute(() => apiService.logout())
  }, [execute])

const handleAddSubscription = useCallback(
    async (payload: any) => {
      return execute(() =>
        apiService.addSubscription(payload)
      )
    },
    [execute]
  )

  const handleAddTransaction = useCallback(
    async (payload: any) => {
      return execute(() =>
        apiService.addTransaction(payload)
      )
    },
    [execute]
  )

const handleUsageCheck = useCallback(
  async (payload: { esimTranNoList: string[] }) => {
    return execute(() =>
      apiService.usageCheck(payload)
    )
  },
  [execute]
)

const handleGetUserSubscriptions = useCallback(
  async (userId: string) => {
    return execute(() =>
      apiService.getUserSubscriptions(userId)
    )
  },
  [execute]
)
const handleOrderEsim = useCallback(
  async (payload) =>
    execute(() => apiService.orderEsim(payload)),
  [execute]
)

const handleGetAllocatedProfiles = useCallback(
  async (payload) =>
    execute(() => apiService.getAllocatedProfiles(payload)),
  [execute]
)

const handleRedeemInviteCode = useCallback(
  async (payload: {
    code: string
    redeemedByAddress: string
  }) => {
    return execute(() =>
      apiService.redeemInviteCode(payload)
    )
  },
  [execute]
)


  return {
      handleLogin,
      handleLogout,
      handleAddSubscription,
      handleAddTransaction,
      handleUsageCheck,
      handleGetUserSubscriptions,
      handleOrderEsim,
      handleGetAllocatedProfiles,
      handleRedeemInviteCode,
    handleGetUser,
    loading,
    error,
  }
}
