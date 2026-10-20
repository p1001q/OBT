import type { BoardMember } from '../domain/member'
import type { DailyEntry } from '../storage/dailyEntryStorage'
import { BoardHeader } from './BoardHeader'
import { Notice } from './Notice'
import { StatusControls } from './StatusControls'
import { StatusNote } from './StatusNote'

export function BoardScreen({
  entry,
  members,
  loading,
  error,
  onBack,
  onRetry,
  onTogglePlanned,
  onToggleRoom,
  onToggleRide,
  onClearList,
}: {
  entry: DailyEntry
  members: BoardMember[]
  loading: boolean
  error: string | null
  onBack: () => void
  onRetry: () => void
  onTogglePlanned: () => void
  onToggleRoom: () => void
  onToggleRide: () => void
  onClearList: (list: 'plan' | 'room' | 'ride') => void
}) {
  const planned = members.filter((member) => member.planned)
  const room = members.filter((member) => member.location === 'room')
  const riding = members.filter((member) => member.location === 'ride')
  const me: BoardMember = { id: 'me', name: entry.name, planned: entry.planned, location: entry.location }

  return (
    <main id="board" className="arrive" aria-label="OBT board">
      <button className="board-back" type="button" aria-label="이름 입력 화면으로 돌아가기" onClick={onBack}><img src="/assets/cut/back-chevron-patch.png" alt="" aria-hidden="true" /></button>
      <div className="layout">
        <BoardHeader />
        <StatusControls entry={entry} onTogglePlanned={onTogglePlanned} onToggleRoom={onToggleRoom} onToggleRide={onToggleRide} />
        {loading && <p className="board-message" role="status">Loading today's board…</p>}
        {error && <p className="board-message board-error" role="alert">{error} <button type="button" onClick={onRetry}>Try again</button></p>}
        {!loading && !error && (
          <div className="notes">
            <div className="rs-row rs-2 deco" aria-hidden="true"><img className="redstars" src="/assets/cut/redstars.png" alt="" /></div>
            <StatusNote kind="plan" members={planned} me={entry.planned ? me : null} onRemoveMe={() => onClearList('plan')} />
            <div className="rs-row deco" aria-hidden="true"><img className="redstars" src="/assets/cut/redstars.png" alt="" /></div>
            <StatusNote kind="room" members={room} me={entry.location === 'room' ? me : null} onRemoveMe={() => onClearList('room')} />
            <div className="fish-row deco" aria-hidden="true"><img src="/assets/cut/fish.png" alt="" /></div>
            <StatusNote kind="ride" members={riding} me={entry.location === 'ride' ? me : null} onRemoveMe={() => onClearList('ride')} />
          </div>
        )}
        <Notice />
      </div>
    </main>
  )
}
