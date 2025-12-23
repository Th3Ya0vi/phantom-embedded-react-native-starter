export type AddSubscriptionArgs = {
  esimId: string
  planRef: string
  packageCode: string
  slug: string
  duration: number
  esimTranNo: string
  orderNo: string
  transactionId: string
  imsi?: string
  iccid?: string
  qrCodeUrl?: string
  status: string
}
