import { BoardScreen } from '../features/board/BoardScreen'
import { EntryScreen } from '../features/entry/EntryScreen'
import { useBoardApp } from '../hooks/useBoardApp'

export function BoardPage() {
  const app = useBoardApp()

  return (
    <>
      <img className="desk-logo" src="/assets/oz-logo.webp" alt="" aria-hidden="true" />
      <div id="app"><div className="cork grain">
        <img className="poster deco" src="/assets/cut/poster.webp" alt="" aria-hidden="true" />
        <img className="sparkles deco" src="/assets/cut/sparkles.webp" alt="" aria-hidden="true" />
        <img className="wm deco" src="/assets/oz-logo.webp" alt="" aria-hidden="true" />
        <img className="wm wm2 deco" src="/assets/oz-logo.webp" alt="" aria-hidden="true" />
        <img className="wm wm-top deco" src="/assets/oz-logo.webp" alt="" aria-hidden="true" />
        <div className="confetti deco" aria-hidden="true" />
        {app.screen === 'entry' || !app.entry ? (
          <EntryScreen initialName={app.entry?.name ?? ''} returning={Boolean(app.entry)} onCheck={app.checkEntry} onSubmit={app.enter} />
        ) : (
          <BoardScreen
            entry={app.entry}
            members={app.members}
            loading={app.loading}
            error={app.error}
            actionError={app.actionError}
            onBack={app.showEntry}
            onRetry={app.retry}
            onTogglePlanned={app.togglePlanned}
            onToggleRoom={app.toggleRoom}
            onToggleRide={app.toggleRide}
            onClearList={app.clearList}
          />
        )}
      </div></div>
      <div className="sr" aria-live="polite">{app.announcement}</div>
    </>
  )
}
