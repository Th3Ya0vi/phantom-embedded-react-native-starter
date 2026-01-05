import { useCallback, useState } from 'react'
import { apiService } from '@/lib/services/apiService'
import { useApiExecutor } from './useApiExecutor'
import { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction, SendTransactionError } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useEmbeddedSolanaWallet, usePrivy } from '@privy-io/expo';
import axios from 'axios';

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
    async (payload: any) =>
      execute(() => apiService.orderEsim(payload)),
    [execute]
  )

  const handleGetAllocatedProfiles = useCallback(
    async (payload: any) =>
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

  // --- Cancel eSIM ---
  const handleCancelEsimProfile = useCallback(async (esimTranNo: string, iccid: string) => {
    console.log(`[API] Cancelling eSIM profile: ${esimTranNo} ,iccid: ${iccid}`);
    const payload = {
      esimTranNo,
      iccid
    };
    return execute(() => apiService.cancelEsimProfile(payload));
  }, [execute]);

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

      if (wallet.status !== 'connected' && wallet.status !== 'reconnecting') {
        throw new Error(`Wallet not ready (Status: ${wallet.status}). Please wait a moment and try again.`);
      }

      console.log(`[TX-PROVIDER] Fetching provider for status: ${wallet.status}...`);
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
          console.error('[TX-ERROR] Error Logs (Raw):', JSON.stringify(err.logs, null, 2));
        } else if (typeof err.getLogs === 'function') {
          console.error('[TX-ERROR] Error Logs (via getLogs()):', JSON.stringify(err.getLogs(), null, 2));
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
    onProgress: (stage: 'PAYING' | 'LOGGING' | 'PROVISIONING' | 'SUCCESS') => void
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
      console.log(`[2/4 AXIOS REQUEST] POST to /api/transactions/addTransaction:`, JSON.stringify(transactionData, null, 2));
      const logRes = await execute(() => apiService.addTransaction(transactionData));
      console.log(`[2/4 AXIOS RESPONSE] addTransaction:`, JSON.stringify(logRes, null, 2));

      // --- 3. ORDERING ---
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
      console.log(`[3/4 AXIOS REQUEST] POST to /api/esimAccess/orderEsim:`, JSON.stringify(orderPayload, null, 2));
      const orderRes = await execute(() => apiService.orderEsim(orderPayload));
      console.log(`[3/4 AXIOS RESPONSE] orderEsim:`, JSON.stringify(orderRes, null, 2));

      // --- 4. ALLOCATING ---
      // Capture the 'orderNo' from the previous step's response
      const orderNo = orderRes?.data?.obj?.orderNo;

      if (!orderNo) {
        console.error("[ALLOCATE ERROR] 'orderNo' missing from /orderEsim response");
        throw new Error("Order successful, but missing the Order Number for profile retrieval.");
      }

      // ✅ BUILD THE CORRECT PAYLOAD for getAllocatedProfiles
      const allocPayload = {
        userId: Number(userId),
        orderNo: orderNo,
        pager: { pageNum: 1, pageSize: 6 }
      };
      console.log(`[4/4 AXIOS REQUEST] POST to /api/esimAccess/getAllocatedProfiles:`, JSON.stringify(allocPayload, null, 2));

      const allocRes = await execute(() => apiService.getAllocatedProfiles(allocPayload));
      console.log(`[4/4 AXIOS RESPONSE] getAllocatedProfiles:`, JSON.stringify(allocRes, null, 2));

      // --- 5. FINISH ---
      onProgress('SUCCESS');
      console.log("==================== PURCHASE FLOW COMPLETE ====================");
      return allocRes;

    } catch (error: any) {
      console.log("-------------------- FLOW FAILED --------------------");
      if (error.response) {
        console.error(`[AXIOS ERROR RESPONSE] URL: ${error.config?.url}`);
        console.error(`[AXIOS ERROR RESPONSE] DATA:`, JSON.stringify(error.response.data, null, 2));
      }
      console.log("-----------------------------------------------------");
      throw error;
    }
  }, [handleSendTransaction, execute]);


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
    handleSendTransaction,
    getWalletBalance,
    processEsimPurchase,
    handleGetUser,
    loading,
    error,
  }
}
