import { useState, useCallback } from 'react';
import { useApiActions } from './useApiActions';
import { randomUUID } from 'expo-crypto'; // For creating idempotencyKey

// --- TYPE DEFINITIONS ---

// The final success data we need to show the user
export interface EsimProfile {
  qrCodeUrl: string;
  ac: string; // The LPA string
  iccid: string;
}

// Status to track the purchase flow
export type PurchaseStatus =
  | 'idle'          // Not started
  | 'ordering'      // Calling the first API
  | 'provisioning'  // Polling for the second API
  | 'success'       // All done
  | 'error';        // Something failed

// --- THE CUSTOM HOOK ---

export const useEsimPurchase = () => {
  const [status, setStatus] = useState<PurchaseStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<EsimProfile | null>(null);

  // We get the actual API-calling functions from another hook (good practice)
  const { handleOrderEsim, handleGetAllocatedProfiles } = useApiActions();

  /**
   * Recursive function to poll the getProfiles endpoint.
   * It will try 10 times, waiting 3 seconds between each attempt.
   */
  const pollForProfile = useCallback(async (orderNo: string, attempt = 1) => {
    if (attempt > 5) { // Max retries reached
      setStatus('error');
      setErrorMessage('Provisioning is taking longer than expected. Please check your profile later eSIM will be delivered shortly.');
      return;
    }

    try {
      console.log(`[POLL] Attempt ${attempt} for Order: ${orderNo}`);
      const payload = { orderNo, pager: { pageNum: 1, pageSize: 6 } };
      console.log(`[ pollForProfile ] Starting eSIM provisioning orderNo: ${orderNo}`,JSON.stringify(payload, null, 2));
      const response = await handleGetAllocatedProfiles(payload);

      // Navigate through the nested response to find the esim data
      const esim = response?.data?.obj?.esimList?.[0];

      console.log(`[POLL] Status Check:`, esim?.smdpStatus || 'PENDING');

      // The profile is ready when its status is 'RELEASED'
      if (esim && esim.smdpStatus === 'RELEASED') {
      console.log(`[POLL] ✅ Success! Profile Released.`);
        setStatus('success');
        setProfile({
          qrCodeUrl: esim.qrCodeUrl,
          ac: esim.ac,
          iccid: esim.iccid,
        });
      } else {
        // If not ready, wait 3 seconds and then call this function again
        setTimeout(() => pollForProfile(orderNo, attempt + 1), 3000);
      }
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e.message || 'Failed to fetch eSIM profile.');
    }
  }, [handleGetAllocatedProfiles]);


  /**
   * Main function to be called from the UI. It orchestrates the entire purchase.
   */
  const purchaseEsim = useCallback(async (plan: any) => {
        console.log(`[FLOW] 1. Purchase Initiated for: ${plan.name} (${plan.packageCode})`);
    setStatus('ordering');
    setErrorMessage(null);
    setProfile(null);

    try {
      // Step 1: Order the eSIM
      const orderPayload = {
        amount: plan.price,
        packageInfoList: [{
          packageCode: plan.packageCode,
          count: 1,
          price: plan.price,
        }],
      };
      console.log(`[FLOW] 2. Calling Order API with Payload:`, JSON.stringify(orderPayload, null, 2));

      const orderResponse = await handleOrderEsim(orderPayload);
      console.log(`[FLOW] 3. Order API Success! OrderNo: ${orderResponse?.data?.obj?.orderNo}`);

      // Validate the response from the first API call
      if (!orderResponse.success || !orderResponse.data.obj.orderNo) {
        throw new Error(orderResponse.errorMsg || 'Failed to place eSIM order.');
      }

      // Step 2: Update status and start polling for the profile
      setStatus('provisioning');
      const  orderNo  = orderResponse.data.obj.orderNo;
            console.log(`[ pollForProfile ] Provisioning STep Started for OrderNo: ${orderNo}`);

      pollForProfile(orderNo);

    } catch (e: any) {
      console.error(`[FLOW ERROR] Purchase Step Failed:`, e.message);
      setStatus('error');
      setErrorMessage(e.message || 'An unknown error occurred during purchase.');
    }
  }, [handleOrderEsim, pollForProfile]);

const resetStatus = useCallback(() => {
    setStatus('idle');
    setProfile(null);
    setErrorMessage(null);
  }, []);


  return { status, errorMessage, profile, purchaseEsim ,resetStatus};
};
