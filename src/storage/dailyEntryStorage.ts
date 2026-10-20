import type { MemberStatus } from '../domain/member'

export const DAILY_ENTRY_KEY = 'obt.daily-entry.v1'

export interface DailyEntry extends MemberStatus {
  name: string
  day: string
  clientNonce: string
  memberId: string | null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function readDailyEntry(storage: StorageLike, today: string): DailyEntry | null {
  try {
    const raw = storage.getItem(DAILY_ENTRY_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<DailyEntry>
    if (
      value.day !== today ||
      typeof value.name !== 'string' ||
      !value.name.trim() ||
      typeof value.clientNonce !== 'string' ||
      typeof value.planned !== 'boolean' ||
      !['room', 'ride', null].includes(value.location ?? null)
    ) {
      storage.removeItem(DAILY_ENTRY_KEY)
      return null
    }
    // 서버 연동 이전 버전이 남긴 `local-…` 같은 값은 서버 입장자 ID가 아니므로 버리고 상태도 비운다.
    if (typeof value.memberId !== 'string' || !UUID.test(value.memberId)) {
      return { name: value.name, day: value.day, clientNonce: value.clientNonce, memberId: null, planned: false, location: null }
    }
    return {
      name: value.name,
      day: value.day,
      clientNonce: value.clientNonce,
      memberId: value.memberId,
      planned: value.planned,
      location: value.location ?? null,
    }
  } catch {
    storage.removeItem(DAILY_ENTRY_KEY)
    return null
  }
}

export function writeDailyEntry(storage: StorageLike, entry: DailyEntry): void {
  storage.setItem(DAILY_ENTRY_KEY, JSON.stringify(entry))
}

export function clearDailyEntry(storage: StorageLike): void {
  storage.removeItem(DAILY_ENTRY_KEY)
}
