import { useMemo, useState } from 'react'
import type { AdminMember, AdminOverview, NewRosterEntry } from '../../data/adminRepository'
import { filterRoster, sortMembers, sortRoster } from '../../domain/rosterView'
import { AddNamesForm } from './AddNamesForm'
import { CollapsibleSection } from './CollapsibleSection'

const RESET_PHRASE = '전체 초기화'

function statusLabel(member: AdminMember): string {
  const parts: string[] = []
  if (member.planned) parts.push('오늘 탈 예정')
  if (member.location === 'room') parts.push('동방')
  if (member.location === 'ride') parts.push('타는 중')
  return parts.length > 0 ? parts.join(' · ') : '관전'
}

export function AdminDashboard({
  overview,
  busy,
  error,
  notice,
  onReload,
  onLogout,
  onAdd,
  onRemoveRoster,
  onRemoveMember,
  onReset,
}: {
  overview: AdminOverview
  busy: boolean
  error: string | null
  notice: string | null
  onReload: () => void
  onLogout: () => void
  onAdd: (entries: NewRosterEntry[]) => Promise<void>
  onRemoveRoster: (rosterId: string, name: string) => Promise<void>
  onRemoveMember: (memberId: string, name: string) => Promise<void>
  onReset: () => void
}) {
  const [phrase, setPhrase] = useState('')
  const [query, setQuery] = useState('')
  const counts = new Map(overview.summary.map((item) => [item.name, item]))
  const sortedMembers = useMemo(() => sortMembers(overview.members, overview.roster), [overview.members, overview.roster])
  const sortedRoster = useMemo(() => sortRoster(overview.roster), [overview.roster])
  const visibleRoster = useMemo(() => filterRoster(sortedRoster, query), [sortedRoster, query])
  const searching = query.trim() !== ''
  const [leaving, setLeaving] = useState<ReadonlySet<string>>(new Set())

  /** 행을 옆으로 밀며 사라지게 한 뒤 삭제를 실행한다. 실패하면 행을 되돌린다. */
  async function removeWithMotion(id: string, action: () => Promise<void>) {
    setLeaving((current) => new Set(current).add(id))
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      await new Promise((resolve) => window.setTimeout(resolve, 180))
    }
    try {
      await action()
    } finally {
      setLeaving((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
    }
  }

  function removeRoster(id: string, name: string, joined: boolean) {
    const effect = joined ? ' 오늘 입장 정보와 상태도 함께 지워져요.' : ''
    if (window.confirm(`${name} 자리를 명단에서 삭제할까요?${effect}`)) void removeWithMotion(id, () => onRemoveRoster(id, name))
  }

  function removeMember(id: string, name: string) {
    if (window.confirm(`오늘 입장자 ${name}의 입장 정보와 상태를 삭제할까요? 같은 자리에 다시 입장할 수 있어요.`)) void removeWithMotion(id, () => onRemoveMember(id, name))
  }

  return (
    <>
      <section className="admin-card admin-head">
        <div>
          <p className="kicker">OBT · ADMIN</p>
          <h1>관리자</h1>
          <p className="admin-hint">{overview.day} · 명단 {overview.roster.length}명 · 오늘 입장 {overview.members.length}명</p>
        </div>
        <div className="admin-actions">
          <button className="admin-btn" type="button" onClick={onReload} disabled={busy}>새로고침</button>
          <button className="admin-btn" type="button" onClick={onLogout}>로그아웃</button>
          <a className="admin-link" href="/">현황판</a>
        </div>
      </section>

      <div className="admin-messages" aria-live="polite">
        {notice && <p key={notice} className="admin-notice" role="status">{notice}</p>}
        {error && <p key={error} className="admin-error" role="alert">{error}</p>}
      </div>

      <AddNamesForm summary={overview.summary} roster={overview.roster} busy={busy} onAdd={onAdd} />

      <CollapsibleSection id="members" title="오늘의 입장자" meta={`${overview.members.length}명`}>
        {sortedMembers.length === 0 ? <p className="admin-empty">아직 오늘 입장한 사람이 없어요.</p> : (
          <ul className="admin-list">
            {sortedMembers.map((member) => (
              <li key={member.id} className={leaving.has(member.id) ? 'leaving' : undefined}>
                <span className="admin-name">{member.name}</span>
                <span className="admin-status">{statusLabel(member)}</span>
                <button className="admin-btn danger" type="button" disabled={busy} aria-label={`오늘 입장자 ${member.name} 삭제`} onClick={() => removeMember(member.id, member.name)}>삭제</button>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        id="roster"
        title="명단"
        meta={searching ? `${visibleRoster.length} / ${overview.roster.length}자리` : `${overview.roster.length}자리`}
        actions={(
          <>
            <label className="sr" htmlFor="rosterSearch">명단 검색</label>
            <input id="rosterSearch" className="admin-search" type="search" value={query} placeholder="이름·학번 검색" autoComplete="off" onChange={(event) => setQuery(event.target.value)} />
          </>
        )}
      >
        {overview.roster.length === 0 ? <p className="admin-empty">명단이 비어 있어요. 위에서 이름을 추가해 주세요.</p> : visibleRoster.length === 0 ? <p className="admin-empty">검색 결과가 없어요.</p> : (
          <ul className="admin-list">
            {visibleRoster.map((entry) => {
              const count = counts.get(entry.name)
              return (
                <li key={entry.id} className={leaving.has(entry.id) ? 'leaving' : undefined}>
                  <span className="admin-name">{entry.name}{entry.studentId && <small> {entry.studentId}</small>}</span>
                  <span className="admin-status">{entry.memberId ? '오늘 입장' : '—'}{count && count.slots > 1 ? ` · 같은 이름 ${count.joined}/${count.slots}` : ''}</span>
                  <button className="admin-btn danger" type="button" disabled={busy} aria-label={`${entry.name} 자리 삭제`} onClick={() => removeRoster(entry.id, entry.name, entry.memberId !== null)}>삭제</button>
                </li>
              )
            })}
          </ul>
        )}
      </CollapsibleSection>

      <section className="admin-card admin-danger" aria-labelledby="resetTitle">
        <h2 id="resetTitle">전체 초기화</h2>
        <p className="admin-hint">명단 {overview.roster.length}자리, 오늘 입장자 {overview.members.length}명과 모든 상태가 삭제돼요. 되돌릴 수 없어요. 계속하려면 <b>{RESET_PHRASE}</b>를 입력하세요.</p>
        <label className="sr" htmlFor="resetPhrase">확인 문구</label>
        <input id="resetPhrase" type="text" value={phrase} autoComplete="off" onChange={(event) => setPhrase(event.target.value)} />
        <button className="admin-btn danger" type="button" disabled={busy || phrase !== RESET_PHRASE} onClick={() => { onReset(); setPhrase('') }}>명단과 입장자 전부 삭제</button>
      </section>
    </>
  )
}
