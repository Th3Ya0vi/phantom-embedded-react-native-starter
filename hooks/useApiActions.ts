// 1. ADD THESE TWO LINES AT THE VERY TOP
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { useCallback } from 'react'
import { apiService } from '@/lib/services/apiService'
import { useApiExecutor } from './useApiExecutor'
import { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction } from '@solana/web3.js';
//import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import { useConnection, useWallet, useSignAndSendTransaction } from '@phantom/react-native-sdk';
import axios from 'axios';

//  RPC endpoint.
const SOLANA_RPC_ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=a402e454-bd4a-4f11-af00-5ded49abd1ff';
const USDC_MINT_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export const useApiActions = () => {
  const { execute, loading, error } = useApiExecutor()
 // const { connection } = useConnection();
 // const { publicKey } = useWallet();
//  const { signAndSendTransaction } = useSignAndSendTransaction();


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
  async (payload) =>
    execute(() => apiService.orderEsim(payload)),
  [execute]
)

const handleGetAllocatedProfiles = useCallback(
  async (payload) =>
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
  const handleCancelEsimProfile = useCallback(async (esimTranNo: string, iccid : string) => {
    console.log(`[API] Cancelling eSIM profile: ${esimTranNo} ,iccid: ${iccid}`);
    const payload = {
      esimTranNo,
      iccid
    };
    // Assuming apiService.cancelEsimProfile is already defined in your apiService file
    // You might need to wrap this with `execute` if you want global loading/error state
    return execute(() => apiService.cancelEsimProfile(payload));
  }, [execute]);


// --- Solana On-Chain & Price APIs ---
   const getWalletBalance = useCallback( async (walletAddress: string) => {
     try {
       const connection = new Connection(SOLANA_RPC_ENDPOINT);
       const publicKey = new PublicKey(walletAddress);

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

 // --- FUNCTION FOR SENDING TRANSACTIONS ---
//    const handleSendTransaction = useCallback(async (recipient: string, amount: string, token: 'SOL' | 'USDC') => {
//      if (!publicKey || !connection) throw new Error("Wallet not connected");
//
//      const recipientPubKey = new PublicKey(recipient);
//      const numericAmount = parseFloat(amount);
//      const transaction = new Transaction();
//
//      if (token === 'SOL') {
//        transaction.add(
//          SystemProgram.transfer({
//            fromPubkey: publicKey,
//            toPubkey: recipientPubKey,
//            lamports: numericAmount * LAMPORTS_PER_SOL,
//          })
//        );
//      } else { // Handle USDC
//        const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
//        const fromTokenAccount = await getAssociatedTokenAddress(usdcMint, publicKey);
//        const toTokenAccount = await getAssociatedTokenAddress(usdcMint, recipientPubKey);
//
//         // Note: A production app would check if `toTokenAccount` exists and create it if not.
//              transaction.add(
//                createTransferInstruction(
//                  fromTokenAccount,
//                  toTokenAccount,
//                  publicKey,
//                  numericAmount * 1_000_000 // USDC has 6 decimals
//                )
//              );
//            }
//
//            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
//            transaction.feePayer = publicKey;
//
//            const signature = await signAndSendTransaction({ transaction });
//            console.log('[SEND] Transaction sent with signature:', signature);
//            return signature;
//          }, [publicKey, connection, signAndSendTransaction]);
//          // --- END OF --- FUNCTION FOR SENDING TRANSACTIONS ---
//


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
   //   handleSendTransaction,
      getWalletBalance,
      handleGetUser,
      loading,
      error,
  }
}
