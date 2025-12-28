import { useApiActions } from '@/hooks/useApiActions'
import { useSession } from '@/lib/session/SessionContext'
import { useToast } from '@/lib/ui/ToastContext'
import { useDisconnect } from '@phantom/react-native-sdk'
import { useRouter } from 'expo-router'

export const useAuthActions = () => {
  const { handleLogin, handleLogout: apiLogout } = useApiActions()
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
        console.log("[AUTH] Initiating full logout sequence...");
        try {
          // Step 1: Tell the backend to invalidate the token (optional, can fail silently)
          await apiLogout().catch(e => console.warn("Backend API logout failed, proceeding...", e));

          // Step 2: Disconnect the Phantom Wallet
          // This is wrapped in its own try/catch because the wallet might already be disconnected
          try {
            await disconnect();
            console.log("[AUTH] Phantom wallet disconnected.");
          } catch (e) {
            console.warn("Phantom SDK disconnect warning (might already be disconnected):", e);
          }
        } catch (error) {
          console.error("An error occurred during API or wallet disconnect:", error);
        } finally {
          // Step 3: ALWAYS clear the local session and redirect the user
          // This ensures the user is logged out on the device even if the server is down.
          await clearSession();
          console.log("[AUTH] Local session and storage cleared.");

          // Step 4: Redirect to the login/home screen.
          // We use router.replace so the user cannot press the "back" button to get into the app.
          router.replace('/home');

          showToast("Disconnected successfully");
        }
      };
      // --- END OF UPDATED FUNCTION ---


  return {
    loginWithWallet,
    logout,
  }
}
