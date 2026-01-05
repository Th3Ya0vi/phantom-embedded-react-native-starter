export enum StorageKey {
  USER = 'USER',
  ACCESS_TOKEN = 'ACCESS_TOKEN',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  LAST_PATH = 'LAST_PATH',
}

export type StoredUser = {
  id: string
  email: string
  name?: string
}
