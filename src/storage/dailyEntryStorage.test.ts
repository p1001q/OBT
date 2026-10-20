import { describe, expect, it } from 'vitest'
import { DAILY_ENTRY_KEY, readDailyEntry, writeDailyEntry, type StorageLike } from './dailyEntryStorage'

function createStorage(): StorageLike {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

describe('daily entry storage', () => {
  it('restores a valid entry for the same KST day', () => {
    const storage = createStorage()
    const entry = { name: '김민서', day: '2026-10-20', clientNonce: 'nonce', memberId: '26ff7795-76ee-43d8-8bb3-529772e9f517', planned: true, location: 'room' as const }
    writeDailyEntry(storage, entry)
    expect(readDailyEntry(storage, entry.day)).toEqual(entry)
  })

  it('removes yesterday data and malformed values', () => {
    const storage = createStorage()
    storage.setItem(DAILY_ENTRY_KEY, JSON.stringify({ name: '김민서', day: '2026-10-19', clientNonce: 'nonce', planned: true, location: null }))
    expect(readDailyEntry(storage, '2026-10-20')).toBeNull()
    expect(storage.getItem(DAILY_ENTRY_KEY)).toBeNull()
  })

  it('drops a non-uuid member id left by the pre-server version and clears its local status', () => {
    const storage = createStorage()
    storage.setItem(DAILY_ENTRY_KEY, JSON.stringify({ name: '김민서', day: '2026-10-20', clientNonce: 'nonce', memberId: 'local-nonce', planned: true, location: 'room' }))
    expect(readDailyEntry(storage, '2026-10-20')).toEqual({
      name: '김민서', day: '2026-10-20', clientNonce: 'nonce', memberId: null, planned: false, location: null,
    })
  })
})
