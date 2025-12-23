import instance from './axiosInstance'

export const apiService = {
  login: async (data: {
    walletAddress: string
  }) => {
    const res = await instance.post('/api/auth/getaccess', data)
    return res.data
  },

  logout: async () => {
    const res = await instance.post('/api/auth/logout')
    return res.data
  },

  getUser: async () => {
      const res = await instance.post('/api/user/getuser')
      return res.data
    },

addSubscription: async (data: any) => {
    const res = await instance.post(
      '/api/subscriptions/addsubscription',
      data
    )
    return res.data
  },

  addTransaction: async (data: any) => {
    const res = await instance.post(
      '/api/transactions/addtransaction',
      data
    )
    return res.data
  },

 usageCheck: async (payload: { esimTranNoList: string[] }) => {
    if (!payload.esimTranNoList?.length) return null

    const res = await instance.post(
      '/api/esimAccess/usageCheck',
      payload
    )
    return res.data
  },

  getUserSubscriptions: async (userId: string) => {
    if (!userId) return []

    const res = await instance.get(
      `/api/subscriptions/user/${userId}`
    )
    return res.data
  },

refreshAuth: async (refreshToken: string) => {
  const res = await instance.post(
    '/api/auth/refresh',
    {},
    {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    }
  )
  return res.data
},

cancelEsimProfile: async (payload: {
  esimTranNo: string
  idempotencyKey: string
}) => {
  return instance.post(
    '/api/esimAccess/cancelProfile',
    payload
  ).then((r) => r.data)
},
orderEsim: async (payload: {
  transactionId: string
  amount: number
  packageInfoList: any[]
  idempotencyKey: string
}) => {
  const res = await instance.post(
    '/api/esimAccess/orderSim',
    payload
  )
  return res.data
},

getAllocatedProfiles: async (payload: { orderNo: string }) => {
  const res = await instance.post(
    '/api/esimAccess/getAllocatedProfiles',
    payload
  )
  return res.data
},

redeemInviteCode: async (payload: {
  code: string
  redeemedByAddress: string
}) => {
  const res = await instance.post(
    '/api/invite/redeem',
    payload
  )
  return res.data
}
}