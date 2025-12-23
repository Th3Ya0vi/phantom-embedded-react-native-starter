import { apiService } from '@/lib/services/apiService'
import { useSession } from '@/lib/session/SessionContext'

export const useWalletLogin = () => {
  const { login } = useSession()

  const loginWithWallet = async (walletAddress: string) => {
    const res = await apiService.login({ walletAddress })

    // Store token + user globally
    await login(res.user, res.accessToken)

    return res.user
  }

  return { loginWithWallet }
}
