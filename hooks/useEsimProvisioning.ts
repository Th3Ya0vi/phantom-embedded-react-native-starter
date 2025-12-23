import { randomUUID } from 'expo-crypto'
import { useApiActions } from '@/hooks/useApiActions'

const sleep = (ms: number) =>
  new Promise((res) => setTimeout(res, ms))

export const useEsimProvisioning = () => {
  const {
    handleOrderEsim,
    handleGetAllocatedProfiles,
  } = useApiActions()

  /**
   * Full provisioning flow
   */
  const provisionEsim = async ({
    transactionId,
    amount,
    packageInfoList,
  }: {
    transactionId: string
    amount: number
    packageInfoList: any[]
  }) => {
    const idempotencyKey = randomUUID()

    // 1️⃣ Place order (idempotent)
    const orderRes = await handleOrderEsim({
      transactionId,
      amount,
      packageInfoList,
      idempotencyKey,
    })

    const orderNo = orderRes.orderNo
    if (!orderNo) {
      throw new Error('Order number missing')
    }

    // 2️⃣ Poll for allocated profiles
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      const profiles = await handleGetAllocatedProfiles({
        orderNo,
      })

      if (profiles && profiles.length > 0) {
        return {
          order: orderRes,
          profiles,
        }
      }

      attempts++
      await sleep(3000) // wait 3s before retry
    }

    throw new Error(
      'eSIM provisioning pending. Please check again later.'
    )
  }

  return {
    provisionEsim,
  }
}
