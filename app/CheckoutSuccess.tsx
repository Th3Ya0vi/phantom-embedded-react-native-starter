import { useEsimProvisioning } from '@/hooks/useEsimProvisioning'

export default function CheckoutSuccess() {
  const { provisionEsim } = useEsimProvisioning()

  const onConfirm = async () => {
    const res = await provisionEsim({
      transactionId: 'txn123',
      amount: 10000,
      packageInfoList: [
        {
          packageCode: 'pkg001',
          count: 1,
          price: 10000,
        },
      ],
    })

    console.log('Allocated Profiles:', res.profiles)
  }

  return <Button title="Activate eSIM" onPress={onConfirm} />
}
