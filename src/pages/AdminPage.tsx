import { AdminDashboard } from '../features/admin/AdminDashboard'
import { AdminLogin } from '../features/admin/AdminLogin'
import { useAdminApp } from '../hooks/useAdminApp'
import '../styles/admin.css'

export function AdminPage() {
  const app = useAdminApp()

  const view = app.checking ? 'checking' : app.overview ? 'dashboard' : 'login'

  return (
    <main className="admin">
      {/* view가 바뀔 때마다 새로 마운트되어 화면 전환 애니메이션이 다시 실행된다. */}
      <div key={view} className="admin-view">
      {view === 'checking' ? (
        <p className="admin-card" role="status">확인 중…</p>
      ) : app.overview ? (
        <AdminDashboard
          overview={app.overview}
          busy={app.busy}
          error={app.error}
          notice={app.notice}
          onReload={app.reload}
          onLogout={app.logout}
          onAdd={app.addEntries}
          onRemoveRoster={app.removeRoster}
          onRemoveMember={app.removeMember}
          onReset={app.resetAll}
        />
      ) : (
        <AdminLogin busy={app.busy} error={app.loginError} onLogin={app.login} />
      )}
      </div>
    </main>
  )
}
