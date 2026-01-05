import { randomUUID } from 'expo-crypto'
import { useApiActions } from '@/hooks/useApiActions'
import { useNotifications } from '@/lib/ui/NotificationContext'

export const useEsimActions = () => {
  const { handleCancelEsimProfile } = useApiActions()
  const { showToast } = useNotifications()

  const cancelEsim = async (esimTranNo: string, iccid: string) => {
    try {
      await handleCancelEsimProfile(esimTranNo, iccid)
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
