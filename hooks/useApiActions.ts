import { useCallback } from 'react'
import { apiService } from '@/lib/services/apiService'
import { useApiExecutor } from './useApiExecutor'
import { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction ,TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {  useAccounts, useSolana } from '@phantom/react-native-sdk';
import axios from 'axios';

//  RPC endpoint.
const SOLANA_RPC_ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=a402e454-bd4a-4f11-af00-5ded49abd1ff';
const USDC_MINT_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const connection = new Connection(SOLANA_RPC_ENDPOINT);


export const useApiActions = () => {
  const { execute, loading, error } = useApiExecutor()
  const { addresses } = useAccounts();
  const { solana } = useSolana();


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

  const handleSendTransaction = useCallback(
    async (amount: string, token: 'SOL' | 'USDC') => {
      console.log(`[TX-START] Initiating ${token} transfer. Amount: ${amount}`);

      const fromAddress = await solana.getPublicKey();
      const fromPubkey = new PublicKey(fromAddress);
      const recipient = 'bWvKxXuv3hiRQYsRXzJgZcFJPTBvAghgjp6prbzEPBG';

      if (!fromPubkey || !connection) {
        throw new Error('Wallet not connected');
      }

      const recipientPubKey = new PublicKey(recipient);
      const numericAmount = parseFloat(amount);

      console.log(`[TX-INFO] Sender: ${fromAddress}`);
      console.log(`[TX-INFO] Recipient: ${recipient}`);

      if (token === 'SOL') {
        console.log('[TX-BUILD] Adding SOL transfer instruction...');

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey: recipientPubKey,
            lamports: Math.floor(numericAmount * LAMPORTS_PER_SOL),
          })
        );

        const result = await solana.signAndSendTransaction(transaction);
        console.log('[TX-SUCCESS] Signature:', result);
        return result;

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

        const transaction = new Transaction({
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

        const result = await solana.signAndSendTransaction(transaction);
        console.log('[TX-SUCCESS] Signature:', result);
        return result;
      }
    },
    [addresses, solana, connection]
  );

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
      handleGetUser,
      loading,
      error,
  }
}
