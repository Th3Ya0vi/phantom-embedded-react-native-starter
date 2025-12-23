import { useApiActions } from '@/hooks/useApiActions'
import { useSession } from '@/lib/session/SessionContext'

export const useInviteActions = () => {
  const { handleRedeemInviteCode } = useApiActions()
  const { user, updateUser } = useSession()

  const redeemInvite = async (code: string) => {
    if (!user?.walletAddress) {
      throw new Error('Wallet not connected')
    }

    const res = await handleRedeemInviteCode({
      code,
      redeemedByAddress: user.walletAddress,
    })

    // ✅ Update session user with backend response
    await updateUser(res.user)

    return res
  }

  return { redeemInvite }
}
