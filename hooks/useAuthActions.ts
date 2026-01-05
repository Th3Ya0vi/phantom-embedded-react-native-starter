import { useApiActions } from '@/hooks/useApiActions'
import { useSession } from '@/lib/session/SessionContext'
import { useNotifications } from '@/lib/ui/NotificationContext'
import { usePrivy } from '@privy-io/expo'
import { useRouter } from 'expo-router'

export const useAuthActions = () => {
  const { handleLogin, handleLogout: apiLogout } = useApiActions()
  const { login: setSession, logout: clearSession } = useSession()
  const { showToast } = useNotifications()

  // Privy hook
  const { logout: privyLogout } = usePrivy()
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
    console.log("[AUTH] Initiating full logout sequence...");
    try {
      // Step 1: Tell the backend to invalidate the token (optional, can fail silently)
      await apiLogout().catch(e => console.warn("Backend API logout failed, proceeding...", e));

      // Step 2: Disconnect Privy
      try {
        await privyLogout();
        console.log("[AUTH] Privy disconnected.");
      } catch (e) {
        console.warn("Privy disconnect warning:", e);
      }
    } catch (error) {
      console.error("An error occurred during API or Privy disconnect:", error);
    } finally {
      // Step 3: ALWAYS clear the local session and redirect the user
      await clearSession();
      console.log("[AUTH] Local session and storage cleared.");

      // Step 4: Redirect to the login/home screen.
      router.replace('/home');

      showToast("Disconnected successfully");
    }
  };

  return {
    loginWithWallet,
    logout,
  }
}
