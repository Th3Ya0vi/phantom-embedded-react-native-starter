export enum StorageKey {
  USER = 'USER',
  ACCESS_TOKEN = 'ACCESS_TOKEN',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  LAST_PATH = 'LAST_PATH',
  REWARDS_BALANCE = 'REWARDS_BALANCE',
}

export type StoredUser = {
  id: string
  email: string
  name?: string
}
