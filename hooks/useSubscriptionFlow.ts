import { useApiActions } from '@/hooks/useApiActions'
import { useSession } from '@/lib/session/SessionContext'
import {
  AddSubscriptionArgs,
} from '@/types/subscription'
import {
  AddTransactionArgs,
} from '@/types/transaction'

export const useSubscriptionFlow = () => {
  const { handleAddSubscription, handleAddTransaction } =
    useApiActions()
  const { user } = useSession()

  if (!user) {
    throw new Error('User not authenticated')
  }

  /**
   * 1️⃣ Add transaction
   * 2️⃣ Add subscription (linked to transaction)
   */
  const createSubscriptionWithTransaction = async ({
    transaction,
    subscription,
  }: {
    transaction: AddTransactionArgs
    subscription: AddSubscriptionArgs
  }) => {
    // 1️⃣ Create transaction
    const transactionRes = await handleAddTransaction({
      userId: user.id,
      ...transaction,
    })

    // 2️⃣ Create subscription linked to transaction
    const subscriptionRes = await handleAddSubscription({
      userId: user.id,
      transactionId: transactionRes.id,
      ...subscription,
    })

    return {
      transaction: transactionRes,
      subscription: subscriptionRes,
    }
  }

  return {
    createSubscriptionWithTransaction,
  }
}
