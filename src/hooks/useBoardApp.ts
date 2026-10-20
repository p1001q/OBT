import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  RepositoryError,
  type BoardRepository,
  type BoardSnapshot,
  type RepositoryErrorCode,
} from '../data/boardRepository'
import { SupabaseBoardRepository } from '../data/supabaseBoardRepository'
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

const repository: BoardRepository = new SupabaseBoardRepository()

const POLL_INTERVAL_MS = 10_000
const RENAME_CONFIRM = '현재 상태를 모두 지우고 이름을 바꿀까요?'

const ERROR_MESSAGES: Record<RepositoryErrorCode, string> = {
  NAME_NOT_FOUND: '명단에 없는 이름이에요. 회장에게 문의해 주세요.',
  NAME_SLOTS_FULL: '같은 이름의 자리가 모두 찼어요. 회장에게 문의해 주세요.',
  MEMBER_NOT_FOUND: '입장 정보를 찾지 못했어요. 다시 시도해 주세요.',
  MEMBER_EXPIRED: '날짜가 바뀌었어요. 이름을 다시 입력해 주세요.',
  INVALID_STATUS: '저장하지 못했어요. 다시 시도해 주세요.',
  INVALID_REQUEST: '요청을 처리하지 못했어요. 다시 시도해 주세요.',
  UNKNOWN: '연결에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
}

export type EntryCheck = { ok: true } | { ok: false; message: string }

function makeNonce(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

function errorCode(cause: unknown): RepositoryErrorCode {
  return cause instanceof RepositoryError ? cause.code : 'UNKNOWN'
}

/** 첫 상태 클릭이면 등록한 뒤, 바뀐 축만 서버에 저장하고 확정된 입장 정보를 돌려준다. */
async function saveStatus(entry: DailyEntry, desired: MemberStatus): Promise<DailyEntry> {
  const register = async () => (await repository.register(entry.name, entry.clientNonce)).memberId

  const write = async (memberId: string, base: MemberStatus): Promise<DailyEntry> => {
    let status: MemberStatus = base
    if (desired.planned !== base.planned) status = await repository.setPlanned(memberId, desired.planned)
    if (desired.location !== base.location) status = await repository.setLocation(memberId, desired.location)
    return { ...entry, memberId, ...status }
  }

  if (!entry.memberId) return write(await register(), EMPTY_STATUS)

  try {
    return await write(entry.memberId, entry)
  } catch (cause) {
    if (errorCode(cause) !== 'MEMBER_NOT_FOUND') throw cause
    // 서버에서 입장자가 삭제됐다면 새로 등록하고 빈 상태에서 다시 저장한다.
    return write(await register(), EMPTY_STATUS)
  }
}

export function useBoardApp() {
  const today = getKstDay()
  const initialEntry = useMemo(() => readDailyEntry(localStorage, today), [today])
  const [entry, setEntry] = useState<DailyEntry | null>(initialEntry)
  const [screen, setScreen] = useState<'entry' | 'board'>(initialEntry ? 'board' : 'entry')
  const [members, setMembers] = useState<BoardMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const entryRef = useRef<DailyEntry | null>(initialEntry)
  const requestSeq = useRef(0)
  const hasLoaded = useRef(false)
  const pending = useRef(false)

  const persist = useCallback((next: DailyEntry) => {
    entryRef.current = next
    setEntry(next)
    writeDailyEntry(localStorage, next)
  }, [])

  const resetToEntry = useCallback((message: string) => {
    clearDailyEntry(localStorage)
    entryRef.current = null
    setEntry(null)
    setScreen('entry')
    setActionError(null)
    setAnnouncement(message)
  }, [])

  const applySnapshot = useCallback((snapshot: BoardSnapshot, requestedMemberId: string | null) => {
    const current = entryRef.current
    if (current && snapshot.day !== current.day) {
      resetToEntry('A new KST day has started. Please enter your name again.')
      return
    }
    setMembers(snapshot.members)
    hasLoaded.current = true
    // 요청 이후 입장자 ID가 바뀌었다면 이 응답의 me 값은 쓰지 않는다.
    if (!current?.memberId || current.memberId !== requestedMemberId) return
    if (!snapshot.me) {
      persist({ ...current, ...EMPTY_STATUS, memberId: null })
    } else if (snapshot.me.planned !== current.planned || snapshot.me.location !== current.location) {
      persist({ ...current, ...snapshot.me })
    }
  }, [persist, resetToEntry])

  const loadBoard = useCallback(async (options: { silent?: boolean } = {}) => {
    const seq = ++requestSeq.current
    const requestedMemberId = entryRef.current?.memberId ?? null
    if (!options.silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const snapshot = await repository.getBoard(requestedMemberId)
      // 더 최근에 시작한 요청이 있으면 이 응답은 버린다.
      if (seq !== requestSeq.current) return
      applySnapshot(snapshot, requestedMemberId)
      setError(null)
    } catch {
      if (seq !== requestSeq.current) return
      if (!options.silent || !hasLoaded.current) setError('Could not load the board. Please try again.')
    } finally {
      if (seq === requestSeq.current) setLoading(false)
    }
  }, [applySnapshot])

  useEffect(() => {
    void loadBoard()
  }, [loadBoard])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (getKstDay() !== today) {
        resetToEntry('A new KST day has started. Please enter your name again.')
        return
      }
      if (!pending.current) void loadBoard({ silent: true })
    }, POLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [today, loadBoard, resetToEntry])

  const checkEntry = useCallback(async (name: string): Promise<EntryCheck> => {
    const trimmed = name.trim()
    const current = entryRef.current
    if (current && current.name === trimmed) return { ok: true }
    try {
      const result = await repository.checkName(trimmed)
      if (!result.found) return { ok: false, message: ERROR_MESSAGES.NAME_NOT_FOUND }
      if (current?.memberId) {
        if (!window.confirm(RENAME_CONFIRM)) return { ok: false, message: '' }
        try {
          await repository.leaveToday(current.memberId)
        } catch (cause) {
          const code = errorCode(cause)
          if (code !== 'MEMBER_NOT_FOUND' && code !== 'MEMBER_EXPIRED') throw cause
        }
      }
      return { ok: true }
    } catch (cause) {
      return { ok: false, message: ERROR_MESSAGES[errorCode(cause)] }
    }
  }, [])

  const enter = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return false
    const current = entryRef.current
    const next: DailyEntry = current && current.name === trimmed
      ? current
      : { name: trimmed, day: getKstDay(), clientNonce: makeNonce(), memberId: null, ...EMPTY_STATUS }
    persist(next)
    setActionError(null)
    setScreen('board')
    void loadBoard({ silent: true })
    return true
  }, [persist, loadBoard])

  const updateStatus = useCallback(async (rule: (status: MemberStatus) => MemberStatus, message: string) => {
    const current = entryRef.current
    if (!current || pending.current) return
    pending.current = true
    requestSeq.current++ // 진행 중인 폴링 응답이 이 변경을 덮어쓰지 않게 한다.
    setActionError(null)
    try {
      persist(await saveStatus(current, rule(current)))
      setAnnouncement(message)
      void loadBoard({ silent: true })
    } catch (cause) {
      const code = errorCode(cause)
      if (code === 'MEMBER_EXPIRED') resetToEntry(ERROR_MESSAGES.MEMBER_EXPIRED)
      else setActionError(ERROR_MESSAGES[code])
    } finally {
      pending.current = false
    }
  }, [persist, loadBoard, resetToEntry])

  return {
    entry,
    screen,
    members,
    loading,
    error,
    actionError,
    announcement,
    checkEntry,
    enter,
    showEntry: () => setScreen('entry'),
    showBoard: () => entry && setScreen('board'),
    retry: () => loadBoard(),
    togglePlanned: () => updateStatus(togglePlanned, entry?.planned ? 'Removed from Riding today' : 'Pinned to Riding today'),
    toggleRoom: () => updateStatus((status) => toggleLocation(status, 'room'), entry?.location === 'room' ? 'Removed from Club room' : 'Pinned to Club room'),
    toggleRide: () => updateStatus((status) => toggleLocation(status, 'ride'), entry?.location === 'ride' ? 'Removed from Out riding' : 'Pinned to Out riding'),
    clearList: (list: 'plan' | 'room' | 'ride') => updateStatus(
      (status) => clearListStatus(status, list),
      list === 'plan' ? 'Removed from Riding today' : 'Location sticker removed',
    ),
  }
}
