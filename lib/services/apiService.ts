import instance from './axiosInstance'

// --- TYPE DEFINITIONS FOR PAYLOADS ---
interface OrderEsimPayload {
  transactionId: string; // Already in your file
  amount: number;
  packageInfoList: {
    packageCode: string;
    count: number;
    price: number;
  }[];
  idempotencyKey: string; // Already in your file
}

interface GetProfilesPayload {
  orderNo: string;
  esimTranNo?: string; // Optional
  iccid?: string;      // Optional
  pager?: {             // Optional but good practice
    pageNum: number;
    pageSize: number;
  };
}

interface RedeemInvitePayload {
  code: string;
  redeemedByAddress: string;
}

// --- API SERVICE DEFINITION ---

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

 // --- UPDATED METHOD ---
  orderEsim: async (payload: OrderEsimPayload) => {
    const res = await instance.post('/api/esimAccess/orderSim', payload)
    return res.data
  },

  // --- UPDATED METHOD ---
  getAllocatedProfiles: async (payload: GetProfilesPayload) => {
    const res = await instance.post('/api/esimAccess/getAllocatedProfiles', payload)
    return res.data
  },

  // --- UPDATED METHOD ---
  redeemInviteCode: async (payload: RedeemInvitePayload) => {
    const res = await instance.post('/api/invite/redeem', payload)
    return res.data
  }
}