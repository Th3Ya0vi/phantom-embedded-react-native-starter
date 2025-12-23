import { useApiActions } from '@/hooks/useApiActions'
import { useSession } from '@/lib/session/SessionContext'
import { useToast } from '@/lib/ui/ToastContext'

export const useAuthActions = () => {
  const { handleLogin, handleLogout } = useApiActions()
  const { login: setSession, logout: clearSession } = useSession()
  const { showToast } = useToast()

  const loginWithWallet = async (walletAddress: string) => {
    try {
      const res = await handleLogin({ walletAddress })
// inside loginWithWallet method

console.log("SERVER LOG:", res); // Check if this returns 200 OK or an error

      // res contains { token, user }
      await setSession(res.user, res.token)

      return res.user
    } catch (err: any) {
      showToast(err.message || 'Login failed')
      throw err
    }
  }

  const logout = async () => {
    try {
      await handleLogout()
    } finally {
      await clearSession()
    }
  }

  return {
    loginWithWallet,
    logout,
  }
}
