import type { StorageLike } from './dailyEntryStorage'

export const ADMIN_PASSWORD_KEY = 'obt.admin-password.v1'

export function readAdminPassword(storage: StorageLike): string | null {
  try {
    return storage.getItem(ADMIN_PASSWORD_KEY)
  } catch {
    return null
  }
}

export function writeAdminPassword(storage: StorageLike, password: string): void {
  try {
    storage.setItem(ADMIN_PASSWORD_KEY, password)
  } catch {
    // 저장하지 못해도 현재 화면에서는 계속 사용할 수 있다.
  }
}

export function clearAdminPassword(storage: StorageLike): void {
  try {
    storage.removeItem(ADMIN_PASSWORD_KEY)
  } catch {
    // 무시
  }
}
