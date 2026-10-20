import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BoardRepository } from '../data/boardRepository'
import { MockBoardRepository } from '../data/mockBoardRepository'
import { getKstDay } from '../domain/kstDate'
import {
  EMPTY_STATUS,
  clearListStatus,
  toggleLocation,
  togglePlanned,
  type BoardMember,
  type MemberStatus,
} from '../domain/member'
import {
  clearDailyEntry,
  readDailyEntry,
  writeDailyEntry,
  type DailyEntry,
} from '../storage/dailyEntryStorage'

const repository: BoardRepository = new MockBoardRepository()

function makeNonce(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

export function useBoardApp() {
  const today = getKstDay()
  const initialEntry = useMemo(() => readDailyEntry(localStorage, today), [today])
  const [entry, setEntry] = useState<DailyEntry | null>(initialEntry)
  const [screen, setScreen] = useState<'entry' | 'board'>(initialEntry ? 'board' : 'entry')
  const [members, setMembers] = useState<BoardMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const loadBoard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const snapshot = await repository.getBoard()
      setMembers(snapshot.members)
    } catch {
      setError('Could not load the board. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBoard()
  }, [loadBoard])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (getKstDay() !== today) {
        clearDailyEntry(localStorage)
        setEntry(null)
        setScreen('entry')
        setAnnouncement('A new KST day has started. Please enter your name again.')
      }
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [today])

  const persist = useCallback((next: DailyEntry) => {
    setEntry(next)
    writeDailyEntry(localStorage, next)
  }, [])

  const enter = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return false
    const next: DailyEntry = entry
      ? { ...entry, name: trimmed, day: getKstDay() }
      : {
          name: trimmed,
          day: getKstDay(),
          clientNonce: makeNonce(),
          memberId: null,
          ...EMPTY_STATUS,
        }
    persist(next)
    setScreen('board')
    return true
  }, [entry, persist])

  const updateStatus = useCallback((rule: (status: MemberStatus) => MemberStatus, message: string) => {
    if (!entry) return
    const status = rule(entry)
    persist({ ...entry, ...status, memberId: entry.memberId ?? `local-${entry.clientNonce}` })
    setAnnouncement(message)
  }, [entry, persist])

  return {
    entry,
    screen,
    members,
    loading,
    error,
    announcement,
    enter,
    showEntry: () => setScreen('entry'),
    showBoard: () => entry && setScreen('board'),
    retry: loadBoard,
    togglePlanned: () => updateStatus(togglePlanned, entry?.planned ? 'Removed from Riding today' : 'Pinned to Riding today'),
    toggleRoom: () => updateStatus((status) => toggleLocation(status, 'room'), entry?.location === 'room' ? 'Removed from Club room' : 'Pinned to Club room'),
    toggleRide: () => updateStatus((status) => toggleLocation(status, 'ride'), entry?.location === 'ride' ? 'Removed from Out riding' : 'Pinned to Out riding'),
    clearList: (list: 'plan' | 'room' | 'ride') => updateStatus(
      (status) => clearListStatus(status, list),
      list === 'plan' ? 'Removed from Riding today' : 'Location sticker removed',
    ),
  }
}
