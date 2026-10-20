import type { MemberStatus } from '../domain/member'

export const DAILY_ENTRY_KEY = 'obt.daily-entry.v1'

export interface DailyEntry extends MemberStatus {
  name: string
  day: string
  clientNonce: string
  memberId: string | null
}

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
    return {
      name: value.name,
      day: value.day,
      clientNonce: value.clientNonce,
      memberId: typeof value.memberId === 'string' ? value.memberId : null,
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
