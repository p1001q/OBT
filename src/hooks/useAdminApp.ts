import { useCallback, useEffect, useRef, useState } from 'react'
import type { AdminOverview, AdminRepository, NewRosterEntry } from '../data/adminRepository'
import { RepositoryError, type RepositoryErrorCode } from '../data/boardRepository'
import { ERROR_MESSAGES } from '../data/errorMessages'
import { SupabaseAdminRepository } from '../data/supabaseAdminRepository'
import { clearAdminPassword, readAdminPassword, writeAdminPassword } from '../storage/adminSession'

const repository: AdminRepository = new SupabaseAdminRepository()

function errorCode(cause: unknown): RepositoryErrorCode {
  return cause instanceof RepositoryError ? cause.code : 'UNKNOWN'
}

/** 관리자 비밀번호는 현재 탭의 sessionStorage에만 둔다. */
export function useAdminApp() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [checking, setChecking] = useState(() => readAdminPassword(sessionStorage) !== null)
  const [busy, setBusy] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const password = useRef<string | null>(readAdminPassword(sessionStorage))

  const logout = useCallback((message: string | null = null) => {
    password.current = null
    clearAdminPassword(sessionStorage)
    setOverview(null)
    setError(null)
    setNotice(null)
    setLoginError(message)
  }, [])

  const refresh = useCallback(async () => {
    if (!password.current) return
    setOverview(await repository.list(password.current))
  }, [])

  useEffect(() => {
    if (!password.current) return
    refresh()
      .catch((cause) => logout(errorCode(cause) === 'ADMIN_UNAUTHORIZED' ? null : ERROR_MESSAGES[errorCode(cause)]))
      .finally(() => setChecking(false))
  }, [refresh, logout])

  const login = useCallback(async (input: string) => {
    if (!input) {
      setLoginError('비밀번호를 입력해 주세요.')
      return
    }
    setBusy(true)
    setLoginError(null)
    try {
      setOverview(await repository.list(input))
      password.current = input
      writeAdminPassword(sessionStorage, input)
    } catch (cause) {
      setLoginError(ERROR_MESSAGES[errorCode(cause)])
    } finally {
      setBusy(false)
    }
  }, [])

  /** 관리자 작업을 실행하고 목록을 다시 불러온다. 성공 메시지는 작업이 돌려준다. */
  const run = useCallback(async (action: (pw: string) => Promise<string>) => {
    const pw = password.current
    if (!pw || busy) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const message = await action(pw)
      await refresh()
      setNotice(message)
    } catch (cause) {
      const code = errorCode(cause)
      if (code === 'ADMIN_UNAUTHORIZED') logout(ERROR_MESSAGES.ADMIN_UNAUTHORIZED)
      else setError(ERROR_MESSAGES[code])
    } finally {
      setBusy(false)
    }
  }, [busy, refresh, logout])

  return {
    overview,
    checking,
    busy,
    loginError,
    error,
    notice,
    login,
    logout: () => logout(),
    reload: () => run(async () => {
      await refresh()
      return '새로 불러왔어요.'
    }),
    addEntries: (entries: NewRosterEntry[]) => run(async (pw) => {
      const { added, skipped } = await repository.add(pw, entries)
      return skipped > 0
        ? `${added}명을 추가했어요. 이미 등록된 학번 ${skipped}명은 제외했어요.`
        : `${added}명을 명단에 추가했어요.`
    }),
    removeRoster: (rosterId: string, name: string) => run(async (pw) => {
      await repository.remove(pw, rosterId)
      return `${name} 자리를 삭제했어요.`
    }),
    removeMember: (memberId: string, name: string) => run(async (pw) => {
      await repository.removeMember(pw, memberId)
      return `오늘 입장자 ${name}을(를) 삭제했어요.`
    }),
    resetAll: () => run(async (pw) => {
      await repository.reset(pw)
      return '명단과 모든 입장자를 삭제했어요.'
    }),
  }
}
