import { useCallback, useState } from 'react'
import { apiService } from '@/lib/services/apiService'
import { useApiExecutor } from './useApiExecutor'
import { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction, SendTransactionError } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useEmbeddedSolanaWallet, usePrivy } from '@privy-io/expo';
import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from '@/lib/storage/storage';

//  RPC endpoint.
const SOLANA_RPC_ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=a402e454-bd4a-4f11-af00-5ded49abd1ff';
const USDC_MINT_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const connection = new Connection(SOLANA_RPC_ENDPOINT);

export const useApiActions = () => {
  const { execute, loading, error } = useApiExecutor()

  // Privy Hooks
  const { user } = usePrivy();
  const wallet = useEmbeddedSolanaWallet();

  // Helper to extract Solana address from Privy user
  const getSolanaAddress = useCallback((u: any) => {
    if (!u) return null;
    const solanaAccount = u.linked_accounts?.find(
      (acc: any) => acc.type === 'wallet' && acc.chain_type === 'solana'
    );
    return solanaAccount?.address || null;
  }, []);

  // Helper: Generic Retry Logic
  const withRetry = useCallback(async <T>(
    fn: () => Promise<T>,
    attempts: number = 3,
    delay: number = 2000,
    operationName: string = 'Operation',
    shouldRetry?: (error: any, response?: any) => boolean
  ): Promise<T> => {
    let lastError: any;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fn();
        // If a custom predicate is provided, check if we should retry based on the SUCCESSFUL response
        if (shouldRetry && shouldRetry(null, res)) {
          // Treat as an error to trigger retry logic
          throw new Error(`Custom retry condition met for ${operationName}`);
        }
        return res;
      } catch (error) {
        // ✅ CHECK IF WE SHOULD STOP RETRYING
        if (shouldRetry && !shouldRetry(error)) {
          console.warn(`[${operationName}] Non-retriable error encountered. Aborting retries.`);
          throw error;
        }

        console.warn(`[${operationName}] Attempt ${i + 1}/${attempts} failed. Retrying in ${delay}ms...`);
        if (error instanceof Error) {
          console.warn(`[${operationName}] Error: ${error.message}`);
        }

        lastError = error;

        if (i < attempts - 1) await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }, []);

  // ... (Other helper functions) ...

  const handleGetUser = useCallback(() => {
    return execute(() => withRetry(() => apiService.getUser(), 3, 2000, 'Get User'))
  }, [execute, withRetry])

  const handleLogin = useCallback(
    async (data: { email?: string; walletAddress: string }) => {
      return execute(() => withRetry(() => apiService.login(data), 3, 2000, 'Login'))
    },
    [execute, withRetry]
  )

  const handleLogout = useCallback(async () => {
    return execute(() => withRetry(() => apiService.logout(), 3, 2000, 'Logout'))
  }, [execute, withRetry])

  const handleAddSubscription = useCallback(
    async (payload: any) => {
      return execute(() => withRetry(
        () => apiService.addSubscription(payload),
        3, 2000, 'Add Subscription'
      ))
    },
    [execute, withRetry]
  )

  const handleAddTransaction = useCallback(
    async (payload: any) => {
      return execute(() => withRetry(
        () => apiService.addTransaction(payload),
        3, 2000, 'Add Transaction'
      ))
    },
    [execute, withRetry]
  )

  const handleUsageCheck = useCallback(
    async (payload: { esimTranNoList: string[] }) => {
      return execute(() => withRetry(
        () => apiService.usageCheck(payload),
        3, 2000, 'Usage Check'
      ))
    },
    [execute, withRetry]
  )

  const handleGetUserSubscriptions = useCallback(
    async (userId: string) => {
      return execute(() => withRetry(
        () => apiService.getUserSubscriptions(userId),
        3,
        2000,
        'Get User Subscriptions',
        (error: any) => {
          // Do NOT retry if we get a 404 (User not found / No plans)
          if (error?.response?.status === 404) return false;
          return true; // Retry other errors
        }
      ))
    },
    [execute, withRetry]
  )

  // handleOrderEsim left raw to allow custom control over retries (prevent double-spend)
  const handleOrderEsim = useCallback(
    async (payload: any) =>
      execute(() => apiService.orderEsim(payload)),
    [execute]
  )

  const handleGetAllocatedProfiles = useCallback(
    async (payload: any) =>
      execute(() => withRetry(() => apiService.getAllocatedProfiles(payload), 3, 2000, 'Get Profiles')),
    [execute, withRetry]
  )

  const handleRedeemInviteCode = useCallback(
    async (payload: {
      code: string
      redeemedByAddress: string
    }) => {
      const res = await execute(() => withRetry(
        () => apiService.redeemInviteCode(payload),
        3, 2000, 'Redeem Invite'
      ));

      // --- AUTO-CREDIT for ACCOUNT_CREATION ---
      if (res?.ok && (res.user?.id || res.user?._id)) {
        console.log("[REWARDS] Auto-crediting for account creation...");
        await handleCreditRewards({
          userId: Number(res.user?.id || res.user?._id),
          reason: 'ACCOUNT_CREATION',
          source: Platform.OS === 'android' ? 'Android App' : 'iOS App',
          referenceId: `invite_${payload.code}_${res.user?.id || res.user?._id}`,
          description: 'Account creation bonus'
        });
      }
      return res;
    },
    [execute, user]
  )

  // --- REWARDS ACTIONS ---
  const handleGetRewardsSummary = useCallback(async (userId: string) => {
    // 1. Try local storage first (as requested)
    const cached = await storage.getRewardsBalance();
    console.log(`[REWARDS] Cached balance: ${cached}`);

    // Still fetch from API to sync
    const res = await execute(() => withRetry(
      () => apiService.getRewardsSummary(userId),
      3, 2000, 'Get Rewards'
    ));
    if (res?.totalPoints !== undefined) {
      await storage.setRewardsBalance(res.totalPoints);
      return res.totalPoints;
    }
    return cached;
  }, [execute]);

  const handleCreditRewards = useCallback(async (payload: any) => {
    const res = await execute(() => withRetry(
      () => apiService.creditRewards(payload),
      3, 2000, 'Credit Rewards'
    ));
    if (res?.success && res.totalPoints !== undefined) {
      await storage.setRewardsBalance(res.totalPoints);
    }
    return res;
  }, [execute]);

  // --- Cancel eSIM ---
  const handleCancelEsimProfile = useCallback(async (esimTranNo: string, iccid: string) => {
    console.log(`[API] Cancelling eSIM profile: ${esimTranNo} ,iccid: ${iccid}`);
    const payload = {
      esimTranNo,
      iccid
    };
    return execute(() => withRetry(
      () => apiService.cancelEsimProfile(payload),
      3, 2000, 'Cancel Profile'
    ));
  }, [execute, withRetry]);

  // --- Solana On-Chain & Price APIs ---
  const getWalletBalance = useCallback(async (address: string) => {
    try {
      const publicKey = new PublicKey(address);

      const [solBalanceLamports, tokenAccounts, solPriceUsd] = await Promise.all([
        connection.getBalance(publicKey),
        connection.getParsedTokenAccountsByOwner(publicKey, { mint: new PublicKey(USDC_MINT_ADDRESS) }),
        axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd').then(res => res.data.solana.usd)
      ]);

      const solBalance = solBalanceLamports / LAMPORTS_PER_SOL;
      const solValueUsd = solBalance * solPriceUsd;

      let usdcBalance = 0;
      if (tokenAccounts.value.length > 0) {
        const largestAccount = tokenAccounts.value.reduce((prev, current) =>
          (prev.account.data.parsed.info.tokenAmount.uiAmount > current.account.data.parsed.info.tokenAmount.uiAmount) ? prev : current
        );
        usdcBalance = largestAccount.account.data.parsed.info.tokenAmount.uiAmount || 0;
      }

      const totalValue = solValueUsd + usdcBalance;

      console.log(`[BALANCE] SOL: ${solBalance.toFixed(4)} ($${solValueUsd.toFixed(2)}), USDC: $${usdcBalance.toFixed(2)}, Total: $${totalValue.toFixed(2)}`);

      return {
        solBalance,
        usdcBalance,
        totalValue,
        solPrice: solPriceUsd,
        solValue: solValueUsd
      };
    } catch (error) {
      console.error("Failed to fetch wallet balance and prices:", error);
      return { solBalance: 0, usdcBalance: 0, totalValue: 0, solPrice: 0, solValue: 0 };
    }
  }, []);

  const handleSendTransaction = useCallback(
    async (amount: string, token: 'SOL' | 'USDC') => {
      console.log(`[TX-START] Initiating ${token} transfer. Amount: ${amount}`);

      // Wait up to 5 seconds if status is "reconnecting"
      let attempts = 0;
      while (wallet.status === 'reconnecting' && attempts < 10) {
        console.log(`[TX-WAIT] Wallet is reconnecting, waiting... (${attempts + 1}/10)`);
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      if (wallet.status !== 'connected') {
        throw new Error(`Wallet not ready (Status: ${wallet.status}). Please ensure you are logged in and try again.`);
      }

      console.log(`[TX-PROVIDER] Fetching provider...`);
      const provider = await wallet.getProvider();

      if (!provider) {
        throw new Error('Solana provider unavailable. Please ensure your embedded wallet is initialized.');
      }

      // Robust Address Extraction
      const privyAddress = getSolanaAddress(user);
      const hookAddress = (wallet as any).wallet?.address || (wallet as any).address;
      const address = privyAddress || hookAddress;

      if (!address) {
        throw new Error("Wallet public key not found. Please ensure your wallet is connected.");
      }

      const fromPubkey = new PublicKey(address);

      const recipient = 'QgBkSapQmUqwzAU8RcP7HeR3ySPd2pbf1d2tzAEfHUz';
      const recipientPubKey = new PublicKey(recipient);
      const numericAmount = parseFloat(amount);
      const userAddressStr = fromPubkey.toBase58();

      console.log(`[TX-INFO] Sender: ${userAddressStr}`);
      console.log(`[TX-INFO] Recipient: ${recipient}`);

      let transaction: Transaction;

      if (token === 'SOL') {
        console.log('[TX-BUILD] Adding SOL transfer instruction...');
        transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey: recipientPubKey,
            lamports: Math.floor(numericAmount * LAMPORTS_PER_SOL),
          })
        );
      } else {
        console.log('[TX-USDC] Building USDC transfer...');

        const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
        const { blockhash } = await connection.getLatestBlockhash();

        const fromTokenAccount = await getAssociatedTokenAddress(
          usdcMint,
          fromPubkey
        );

        const toTokenAccount = await getAssociatedTokenAddress(
          usdcMint,
          recipientPubKey,
          true
        );

        const amountRaw = Math.round(numericAmount * 1_000_000); // USDC decimals

        transaction = new Transaction({
          recentBlockhash: blockhash,
          feePayer: fromPubkey,
        }).add(
          createTransferInstruction(
            fromTokenAccount,
            toTokenAccount,
            fromPubkey,
            amountRaw
          )
        );
      }

      // Ensure blockhash is set
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // IMPORTANT: When 'sponsor: true' is used, Privy's relayer replaces the feePayer.
      // Since we are now enforcing a SOL balance in the UI ($0.50 min), 
      // we set the feePayer to the user. This ensures simulation succeeds
      // even if sponsorship is delayed or unavailable.
      transaction.feePayer = fromPubkey;

      console.log('[TX-SIGN] Requesting signature via Privy Provider (Sponsored RPC)...');

      // Pre-check balances for debugging
      try {
        const balances = await getWalletBalance(address);
        console.log(`[TX-DEBUG] Wallet ${address} Balances: SOL=${balances.solBalance}, USDC=${balances.usdcBalance}`);
      } catch (e) {
        console.warn(`[TX-DEBUG] Could not fetch balances for pre-check logging.`);
      }

      try {
        const response = await provider.request({
          method: 'signAndSendTransaction',
          params: {
            transaction: transaction,
            connection: connection,
            options: {
              sponsor: true,
              preflightCommitment: 'confirmed'
            } as any
          }
        });

        const signature = (response as any).signature;
        console.log('[TX-SUCCESS] Signature:', signature);

        // If it returns object with signature
        if (typeof signature === 'object' && signature.signature) {
          return signature.signature;
        }
        return signature;
      } catch (err: any) {
        console.error('[TX-ERROR] Transaction failed during signAndSendTransaction:');

        // Detailed Solana error logging as requested by user
        if (err.logs) {
          console.error('[TX-ERROR] Error Logs (Raw):');
        } else if (typeof err.getLogs === 'function') {
          console.error('[TX-ERROR] Error Logs (via getLogs()):');
        }

        if (err.message && err.message.includes('Simulation failed')) {
          console.error('[TX-ERROR] Simulation Failure Summary:', err.message);

          if (err.message.includes('Attempt to debit an account')) {
            console.error('[TX-ERROR] ANALYSIS: This error often occurs if the transaction feePayer has 0 SOL. GeSIM uses Privy Gas Sponsorship, but if the feePayer was manually set to the user account (0 SOL), the simulation fails.');
          }
        }

        throw err;
      }

    },
    [wallet, connection, user, getSolanaAddress]
  );

  const processEsimPurchase = useCallback(async (
    plan: any,
    userId: string,
    onProgress: (stage: 'PAYING' | 'LOGGING' | 'PROVISIONING' | 'CREDITING_REWARDS' | 'SUCCESS') => void
  ) => {
    console.log("==================== PURCHASE FLOW START ====================");

    try {
      // --- 1. PAYMENT ---
      onProgress('PAYING');
      const dollarAmount = (plan.price * 1.4 / 10000).toString();
      console.log(`[1/4 PAYMENT] Requesting inflated ${dollarAmount} USDC (includes 40% markup)...`);
      const signature = await handleSendTransaction(dollarAmount, 'USDC');
      if (!signature) throw new Error("Payment cancelled or signature missing.");
      const txHash = typeof signature === 'object' ? signature.signature : signature;
      console.log(`[1/4 PAYMENT] SUCCESS. Signature: ${txHash}`);

      // --- 2. LOGGING ---
      onProgress('LOGGING');
      const transactionData = {
        userId: Number(userId),
        amount: Number(plan.price * 1.4 / 10000), // Log the actual inflated amount paid
        tokenUsed: "USDC",
        txHash: txHash,
        transactionTypeId: 1,
        status: "confirmed"
      };
      console.log(`[2/4 AXIOS REQUEST] POST to /api/transactions/addTransaction:`);
      // Retry logging to ensure we have a record
      const logRes = await execute(() => withRetry(
        () => apiService.addTransaction(transactionData),
        3, 2000, 'Log Transaction'
      ));
      console.log(`[2/4 AXIOS RESPONSE] addTransaction is returned`);

      // --- 3. ORDERING (SPECIAL RETRY LOGIC) ---
      onProgress('PROVISIONING');
      const orderPayload = {
        transactionId: txHash,
        idempotencyKey: txHash,
        amount: Number(plan.price),
        packageInfoList: [{
          packageCode: plan.packageCode,
          count: 1,
          price: Number(plan.price),
        }],
      };

      console.log(`[3/4 AXIOS REQUEST] POST to /api/esimAccess/orderEsim:`);

      let orderRes: any;
      let orderAttempts = 0;
      const MAX_ORDER_ATTEMPTS = 3;

      // Retry loop specifically for "success: false"
      while (orderAttempts < MAX_ORDER_ATTEMPTS) {
        orderAttempts++;
        try {
          console.log(`[ORDER ATTEMPT] ${orderAttempts}/${MAX_ORDER_ATTEMPTS}...`);
          orderRes = await execute(() => apiService.orderEsim(orderPayload));

          // CHECK: success: false
          if (orderRes && orderRes.success === false) {
            console.warn(`[ORDER FAILED] Response was success: false. Retrying...`, JSON.stringify(orderRes));
            if (orderAttempts < MAX_ORDER_ATTEMPTS) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue; // Retry
            } else {
              // Max attempts reached for success: false, throw an error
              throw new Error(`Order failed after ${MAX_ORDER_ATTEMPTS} attempts with success: false.`);
            }
          }

          // If success is missing or true, valid response or different error, break loop to process
          break;

        } catch (err: any) {
          console.error(`[ORDER ERROR] Attempt ${orderAttempts} exception:`);
          // Log full error details as requested
          if (err.response) {
            console.error(`[ORDER ERROR RESPONSE] Status: ${err.response.status}`);
            console.error(`[ORDER ERROR DATA]`, JSON.stringify(err.response.data, null, 2));
          } else {
            console.error(`[ORDER ERROR] Message: ${err.message}`);
          }

          // User Requirement: "retry on order API , only if we get "success": false"
          // This implies we DO NOT retry on standard network errors (to avoid double charge risk).
          // So we throw immediately on exception.
          throw err;
        }
      }

      console.log(`[3/4 AXIOS RESPONSE] orderEsim returned`);

      // Check required parameter for next step
      const orderNo = orderRes?.data?.obj?.orderNo;
      if (!orderNo) {
        console.error("[ALLOCATE ERROR] 'orderNo' missing from /orderEsim response");
        // Log the response that lacked the orderNo for debugging
        console.error("[ALLOCATE DEBUG] Response Data:", JSON.stringify(orderRes, null, 2));
        throw new Error("Order processed, but failed to retrieve Order Number for profile retrieval. Please contact support with Transaction ID: " + txHash);
      }

      // --- 4. ALLOCATING ---
      // ✅ BUILD THE CORRECT PAYLOAD for getAllocatedProfiles
      const allocPayload = {
        userId: Number(userId),
        orderNo: orderNo,
        pager: { pageNum: 1, pageSize: 6 }
      };
      console.log(`[4/4 AXIOS REQUEST] POST to /api/esimAccess/getAllocatedProfiles:`);

      // Retry allocation since it's a read operation and we have a valid orderNo
      const allocRes = await execute(() => withRetry(
        () => apiService.getAllocatedProfiles(allocPayload),
        3, 2000, 'Fetch Profiles'
      ));
      console.log(`[4/4 AXIOS RESPONSE] getAllocatedProfiles is returned`);

      // --- 5. REWARDS ---
      if (orderNo && userId) {
        onProgress('CREDITING_REWARDS');
        console.log("[REWARDS] Auto-crediting for purchase...");
        await handleCreditRewards({
          userId: Number(userId),
          reason: 'PURCHASE',
          source: Platform.OS === 'android' ? 'Android App' : 'iOS App',
          referenceId: `order_${orderNo}`,
          description: `Bonus for purchasing ${plan.name}`
        });
      }

      // --- 6. FINISH ---
      onProgress('SUCCESS');
      console.log("==================== PURCHASE FLOW COMPLETE ====================");
      return allocRes;

    } catch (error: any) {
      console.log("-------------------- FLOW FAILED --------------------");
      if (error.response) {
        console.error(`[AXIOS ERROR RESPONSE] URL: ${error.config?.url}`);
        console.error(`[AXIOS ERROR RESPONSE] DATA:`);
        // Log deep data if available
        if (error.response.data) {
          console.error(JSON.stringify(error.response.data, null, 2));
        }
      } else {
        console.error(`[FLOW ERROR] ${error.message}`);
      }
      console.log("-----------------------------------------------------");
      throw error;
    }
  }, [handleSendTransaction, execute, withRetry, handleCreditRewards]);


  return {
    handleLogin,
    handleLogout,
    handleAddSubscription,
    handleAddTransaction,
    handleUsageCheck,
    handleGetUserSubscriptions,
    handleCancelEsimProfile,
    handleOrderEsim,
    handleGetAllocatedProfiles,
    handleRedeemInviteCode,
    handleGetRewardsSummary,
    handleCreditRewards,
    handleSendTransaction,
    getWalletBalance,
    processEsimPurchase,
    handleGetUser,
    loading,
    error,
  }
}
