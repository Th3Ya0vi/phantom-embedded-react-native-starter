import { randomUUID } from 'expo-crypto'
import { useApiActions } from '@/hooks/useApiActions'
import { useToast } from '@/lib/ui/ToastContext'

export const useEsimActions = () => {
  const { handleCancelEsimProfile } = useApiActions()
  const { showToast } = useToast()

  const cancelEsim = async (esimTranNo: string) => {
    try {
      await handleCancelEsimProfile({
        esimTranNo,
        idempotencyKey: randomUUID(),
      })
      showToast('eSIM cancelled successfully')
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel eSIM')
      throw err
    }
  }

  return {
    cancelEsim,
  }
}
