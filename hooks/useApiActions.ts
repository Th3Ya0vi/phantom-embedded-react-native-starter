import { useCallback, useState } from 'react'
import { apiService } from '@/lib/services/apiService'
import { useApiExecutor } from './useApiExecutor'
import { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import axios from 'axios';

//  RPC endpoint.
const SOLANA_RPC_ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=a402e454-bd4a-4f11-af00-5ded49abd1ff';
const USDC_MINT_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const connection = new Connection(SOLANA_RPC_ENDPOINT);

export const useApiActions = () => {
  const { execute, loading, error } = useApiExecutor()

  // Privy Embedded Solana Wallet
  const wallet = useEmbeddedSolanaWallet();
  // const [walletAddress, setWalletAddress] = useState<string | null>(null); // Unused for now, deriving from wallet

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

      const w = wallet as any;
      if (wallet.status !== 'connected' || !w.provider) {
        throw new Error('Wallet not connected or provider unavailable');
      }

      const provider = w.provider;
      const fromPubkey = provider.publicKey;

      if (!fromPubkey) throw new Error("Wallet public key not found");

      const recipient = 'bWvKxXuv3hiRQYsRXzJgZcFJPTBvAghgjp6prbzEPBG';
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
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      console.log('[TX-SIGN] Requesting signature via Privy Provider...');
      const signature = await provider.signAndSendTransaction(transaction);

      console.log('[TX-SUCCESS] Signature:', signature);

      // If it returns object with signature
      if (typeof signature === 'object' && signature.signature) {
        return signature.signature;
      }
      return signature;

    },
    [wallet, connection]
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
      const dollarAmount = (plan.price / 10000).toString();
      console.log(`[1/4 PAYMENT] Requesting ${dollarAmount} USDC...`);
      const signature = await handleSendTransaction(dollarAmount, 'USDC');
      if (!signature) throw new Error("Payment cancelled or signature missing.");
      const txHash = typeof signature === 'object' ? signature.signature : signature;
      console.log(`[1/4 PAYMENT] SUCCESS. Signature: ${txHash}`);

      // --- 2. LOGGING ---
      onProgress('LOGGING');
      const transactionData = {
        userId: Number(userId),
        amount: Number(plan.price / 10000),
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
      } else {
        console.error(`[FLOW ERROR]: ${error.message}`);
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
