import { useState, type FormEvent } from 'react'

export function AdminLogin({
  busy,
  error,
  onLogin,
}: {
  busy: boolean
  error: string | null
  onLogin: (password: string) => void
}) {
  const [password, setPassword] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    onLogin(password)
  }

  return (
    <section className="admin-card admin-login">
      <p className="kicker">OBT · ADMIN</p>
      <h1>관리자 로그인</h1>
      <form onSubmit={submit}>
        <label htmlFor="adminPw">관리자 비밀번호</label>
        <input id="adminPw" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <p className="admin-error" role="alert">{error}</p>
        <button className="admin-btn primary" type="submit" disabled={busy}>{busy ? '확인 중…' : '들어가기'}</button>
      </form>
      <a className="admin-link" href="/">현황판으로 돌아가기</a>
    </section>
  )
}
