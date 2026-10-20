import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import type { EntryCheck } from '../../hooks/useBoardApp'
import { RansomText } from '../../shared/ui/RansomText'

export function EntryScreen({
  initialName,
  returning,
  onCheck,
  onSubmit,
}: {
  initialName: string
  returning: boolean
  onCheck: (name: string) => Promise<EntryCheck>
  onSubmit: (name: string) => boolean
}) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [returningActive, setReturningActive] = useState(returning)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastLadybugClick = useRef(0)

  // 관리자 화면에서 뒤로 돌아왔을 때 페이드 아웃 상태가 남지 않게 한다.
  useEffect(() => {
    const reset = () => document.body.classList.remove('to-admin')
    reset()
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])

  // 무당벌레를 두 번 연달아 누르면 관리자 화면으로 이동한다. 한 번만 누르면 아무 반응이 없다.
  function openAdmin() {
    const now = Date.now()
    if (now - lastLadybugClick.current > 450) {
      lastLadybugClick.current = now
      return
    }
    lastLadybugClick.current = 0
    const go = () => window.location.assign('/admin')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      go()
      return
    }
    document.body.classList.add('to-admin')
    window.setTimeout(go, 240)
  }

  useEffect(() => {
    setName(initialName)
    if (!returning) return
    setReturningActive(true)
    inputRef.current?.select()
    const timer = window.setTimeout(() => setReturningActive(false), 420)
    return () => window.clearTimeout(timer)
  }, [initialName, returning])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (checking || submitting) return
    if (!name.trim()) {
      setError('Write at least one letter')
      inputRef.current?.focus()
      return
    }
    setError('')
    setChecking(true)
    const result = await onCheck(name)
    if (!result.ok) {
      setChecking(false)
      if (result.message) setError(result.message)
      inputRef.current?.focus()
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onSubmit(name)
      return
    }
    setReturningActive(false)
    setSubmitting(true)
    window.setTimeout(() => onSubmit(name), 380)
  }

  return (
    <main id="entry" className={returningActive ? 'returning' : ''} aria-labelledby="entry-title">
      <div className={`entry-wrap ${submitting ? 'submitting' : ''}`}>
        <span className="logo-st e-logo deco" aria-hidden="true" />
        <img className="cut ladybug-door" src="/assets/cut/s-ladybug.png" alt="" aria-hidden="true" draggable={false} onClick={openAdmin} style={{ width: 56, left: -18, top: -30, transform: 'rotate(45deg)' }} />
        <form className={`card paper-noise ${error ? 'shake' : ''}`} noValidate onSubmit={submit}>
          <span className="pin clear deco" aria-hidden="true" />
          <p className="kicker">OBT · Who's riding today</p>
          <h1 id="entry-title" className="e-h1">
            <span className="deco" style={{ '--rh': '40px' } as CSSProperties}><RansomText text="HEY" /></span>
            <img className="ex deco" src="/assets/cut/p-ex.png" alt="" aria-hidden="true" />
            <span className="h1t">Write your name on a&nbsp;new sticker</span>
          </h1>
          <label className="sr" htmlFor="nameIn">Name</label>
          <input ref={inputRef} className="field" id="nameIn" name="name" type="text" autoComplete="nickname" maxLength={12} placeholder="e.g. 김민서" value={name} onChange={(event) => { setName(event.target.value); if (event.target.value.trim()) setError('') }} />
          <p className="err" role="alert">{error}</p>
          <button className="go" type="submit" disabled={checking && !submitting}>Pin it to the board</button>
        </form>
        <div className="e-scrap deco" aria-hidden="true"><span className="tape" />who's riding?</div>
        <img className="cut deco" src="/assets/cut/s-sardine.png" alt="" aria-hidden="true" style={{ width: 78, right: -8, bottom: -48, transform: 'rotate(12deg)' }} />
      </div>
    </main>
  )
}
