import { useApiActions } from '@/hooks/useApiActions'
import { useSession } from '@/lib/session/SessionContext'
import { useToast } from '@/lib/ui/ToastContext'
import { useDisconnect } from '@phantom/react-native-sdk'
import { useRouter } from 'expo-router'

export const useAuthActions = () => {
  const { handleLogin, handleLogout } = useApiActions()
  const { login: setSession, logout: clearSession } = useSession()
  const { showToast } = useToast()
  // 2. INITIALIZE DISCONNECT AND ROUTER
    const { disconnect } = useDisconnect()
    const router = useRouter()


 const loginWithWallet = async (walletAddress: string) => {
    try {
      console.log("Auth: Logging in with address:", walletAddress);

      const res = await handleLogin({ walletAddress });
      console.log("Auth: Server Response:", res); // <--- DEBUG LOG

      // 1. EXTRACT DATA SAFELY
      // Adjust 'accessToken' key based on what your actual API returns (e.g., res.token vs res.accessToken)
      const token = res.accessToken || res.data?.accessToken;
      const user = res.user;

      // 2. CRITICAL CHECK
      if (!token) {
        console.error("Auth Error: Missing accessToken in response", res);
        throw new Error("Authentication failed: No access token received from server.");
      }

      if (!user) {
        console.error("Auth Error: Missing user data in response", res);
        throw new Error("Authentication failed: No user data received.");
      }

      // 3. PROCEED ONLY IF DATA EXISTS
      await setSession(user, token);

      // ... toast success ...
      return user;

    } catch (error) {
            console.error("Auth Action Failed:", error);
            throw error;
          }
        };

  const logout = async () => {
      try {
        // Step A: Tell your backend to invalidate the session
        await handleLogout()

        // Step B: Disconnect the actual Phantom wallet
        // We wrap this in a sub-try/catch so that if the wallet
        // is already disconnected, the rest of the logout still works.
        try {
          await disconnect()
        } catch (e) {
          console.warn("Auth: Wallet already disconnected from Phantom side.")
        }

      } catch (error) {
        console.error("Auth: Logout process encountered an error:", error)
      } finally {
        // Step C: ALWAYS clear the local state/storage and redirect
        // even if the API or Wallet disconnect fails.
        await clearSession()

        // Step D: Send user back to the starting screen
        // Use 'replace' so they can't click "back" to see the dashboard
        router.replace('/home')

        showToast("Logged out successfully")
      }
    }

  return {
    loginWithWallet,
    logout,
  }
}
