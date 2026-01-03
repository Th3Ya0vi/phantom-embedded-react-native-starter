import { useState, useCallback } from 'react';
import { useApiActions } from './useApiActions';
import { useSession } from '@/lib/session/SessionContext';

// --- TYPE DEFINITIONS ---
export interface EsimProfile {
  qrCodeUrl: string;
  ac: string;
  iccid: string;
}

export type PurchaseStatus = 'idle' | 'ordering' | 'provisioning' | 'success' | 'error';

// --- THE CUSTOM HOOK ---
export const useEsimPurchase = () => {
  const [status, setStatus] = useState<PurchaseStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<EsimProfile | null>(null);
  const { user } = useSession();
  const { handleOrderEsim, handleGetAllocatedProfiles } = useApiActions();

  /**
   * Recursive function to poll the getProfiles endpoint.
   */
  const pollForProfile = useCallback(async (orderNo: string, attempt = 1) => {
    const userId = user?.id || user?._id;
    if (!userId) {
      setStatus('error');
      setErrorMessage("Session invalid. Please log in again.");
      return;
    }

    if (attempt > 5) { // Max retries
      setStatus('error');
      setErrorMessage('Provisioning is taking longer than expected. Please check your profile later.');
      return;
    }

    try {
      console.log(`[POLL] Attempt #${attempt} for Order: ${orderNo}`);

      // ✅ CORRECTED: Convert userId to a Number for the payload
      const payload = {
        userId: Number(userId),
        orderNo,
        pager: { pageNum: 1, pageSize: 6 }
      };

      console.log("[POLL] Sending Request:", JSON.stringify(payload, null, 2));
      const response = await handleGetAllocatedProfiles(payload);
      console.log("[POLL] Received Response:", JSON.stringify(response, null, 2));

      // Navigate the nested response to find the eSIM data
      const esim = response?.data?.obj?.esimList?.[0];
      console.log(`[POLL] Found eSIM with status:`, esim?.smdpStatus || 'PENDING');

      // Check if the profile is ready
      if (esim && esim.smdpStatus === 'RELEASED') {
        console.log(`[POLL] ✅ Success! Profile is released.`);
        setStatus('success');
        setProfile({
          qrCodeUrl: esim.qrCodeUrl,
          ac: esim.ac,
          iccid: esim.iccid,
        });
      } else {
        // If not ready, wait 3 seconds and try again
        setTimeout(() => pollForProfile(orderNo, attempt + 1), 3000);
      }
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e.message || 'Failed to fetch eSIM profile.');
    }
    // ✅ FIX: Added `user` to the dependency array because it's used inside
  }, [handleGetAllocatedProfiles, user]);

  /**
   * Main function to orchestrate the entire purchase flow.
   */
  const purchaseEsim = useCallback(async (plan: any) => {
    console.log(`[FLOW] Purchase initiated for: ${plan.packageCode}`);
    setStatus('ordering');
    setErrorMessage(null);
    setProfile(null);

    try {
      // Step 1: Order the eSIM to get an order number
      const orderPayload = {
        amount: plan.price,
        packageInfoList: [{
          packageCode: plan.packageCode,
          count: 1,
          price: plan.price,
        }],
      };
      const orderResponse = await handleOrderEsim(orderPayload);
      const orderNo = orderResponse?.data?.obj?.orderNo;

      if (!orderNo) {
        throw new Error('Order number was not returned from the server.');
      }

      // Step 2: Start polling for the provisioned profile
      console.log(`[FLOW] Order placed. Now provisioning for OrderNo: ${orderNo}`);
      setStatus('provisioning');
      pollForProfile(orderNo);

    } catch (e: any) {
      console.error(`[FLOW] Purchase failed during 'ordering' step:`, e.message);
      setStatus('error');
      setErrorMessage(e.message || 'The purchase could not be completed.');
    }
  }, [handleOrderEsim, pollForProfile]);

  const resetStatus = useCallback(() => {
    setStatus('idle');
    setProfile(null);
    setErrorMessage(null);
  }, []);

  return { status, errorMessage, profile, purchaseEsim, resetStatus };
};
