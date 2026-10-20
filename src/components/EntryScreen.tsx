import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { RansomText } from './visuals'

export function EntryScreen({
  initialName,
  returning,
  onSubmit,
}: {
  initialName: string
  returning: boolean
  onSubmit: (name: string) => boolean
}) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')
  const [leaving, setLeaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setName(initialName)
    if (returning) inputRef.current?.select()
  }, [initialName, returning])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Write at least one letter')
      inputRef.current?.focus()
      return
    }
    setError('')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onSubmit(name)
      return
    }
    setLeaving(true)
    window.setTimeout(() => onSubmit(name), 380)
  }

  return (
    <main id="entry" className={returning ? 'returning' : ''} aria-labelledby="entry-title">
      <div className={`entry-wrap ${leaving ? 'lift away' : ''}`}>
        <span className="logo-st e-logo deco" aria-hidden="true" />
        <img className="cut deco" src="/assets/cut/s-ladybug.png" alt="" aria-hidden="true" style={{ width: 56, left: -18, top: -30, transform: 'rotate(45deg)' }} />
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
          <button className="go" type="submit">Pin it to the board</button>
        </form>
        <div className="e-scrap deco" aria-hidden="true"><span className="tape" />who's riding?</div>
        <img className="cut deco" src="/assets/cut/s-sardine.png" alt="" aria-hidden="true" style={{ width: 78, right: -8, bottom: -48, transform: 'rotate(12deg)' }} />
      </div>
    </main>
  )
}
