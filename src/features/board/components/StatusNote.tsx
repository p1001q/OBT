import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { BoardMember } from '../../../domain/member'
import { Icon } from '../../../shared/ui/Icon'
import { RansomText } from '../../../shared/ui/RansomText'
import { NameSticker } from './NameSticker'

const NOTE_DETAILS = {
  plan: {
    className: 'n-plan', label: 'riding today', title: 'TODAY', index: 2,
    subtitle: 'riding today', empty: "Nobody's planning to ride yet", icon: 'star' as const,
  },
  room: {
    className: 'n-room', label: 'in the club room now', title: 'CLUB', index: 3,
    subtitle: 'in the club room now', empty: 'The club room is quiet for now', icon: 'bubbles' as const,
  },
  ride: {
    className: 'n-ride', label: 'out riding now', title: 'RIDING', index: 4,
    subtitle: 'out riding now', empty: "Nobody's out riding yet", icon: 'wheel' as const,
  },
}

export function StatusNote({
  kind,
  members,
  me,
  onRemoveMe,
}: {
  kind: 'plan' | 'room' | 'ride'
  members: BoardMember[]
  me: BoardMember | null
  onRemoveMe: () => void
}) {
  const detail = NOTE_DETAILS[kind]
  const previousMe = useRef<BoardMember | null>(me)
  const [exitingMe, setExitingMe] = useState<BoardMember | null>(null)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (me) {
      previousMe.current = me
      setExitingMe(null)
      return
    }

    const departing = previousMe.current
    previousMe.current = null
    if (!departing || reducedMotion) return

    setExitingMe(departing)
    const timer = window.setTimeout(() => setExitingMe(null), 200)
    return () => window.clearTimeout(timer)
  }, [me, reducedMotion])

  const displayedMe = me ?? exitingMe ?? (reducedMotion ? null : previousMe.current)
  const allMembers = displayedMe ? [displayedMe, ...members] : members
  const count = members.length + (me ? 1 : 0)

  return (
    <section className={`note paper-noise ${detail.className}`} aria-labelledby={`h-${kind}`}>
      {kind === 'plan' && <img className="pinimg deco" src="/assets/cut/p-pin.png" alt="" aria-hidden="true" style={{ top: -24, left: '50%', marginLeft: -18 }} />}
      {kind === 'room' && <img className="clip deco" src="/assets/cut/cGreen2-h.png" alt="" aria-hidden="true" style={{ width: 80, top: -66, left: '22%', transform: 'rotate(-3deg)' }} />}
      {kind === 'ride' && <><img className="clip deco" src="/assets/cut/cMint-h.png" alt="" aria-hidden="true" style={{ width: 72, top: -62, left: '60%', transform: 'rotate(5deg)' }} /><span className="tape deco" aria-hidden="true" style={{ top: -10, right: -12, width: 62, transform: 'rotate(38deg)', '--tc': 'rgba(176,160,190,.7)' } as CSSProperties} /></>}
      <div className="note-h">
        {kind === 'plan' && <><img className="dog deco" src="/assets/cut/dog.png" alt="" aria-hidden="true" /><img className="cut deco star-gs" src="/assets/cut/star-red.png" alt="" aria-hidden="true" /></>}
        <div className="nh-txt"><span className="pc-lbl deco" aria-hidden="true">POST CARD · 0{kind === 'plan' ? 1 : kind === 'room' ? 2 : 3}</span>
          <h2 id={`h-${kind}`} aria-label={detail.label}><RansomText text={detail.title} wordIndex={detail.index} /></h2>
          <span className="note-sub deco" aria-hidden="true">{detail.subtitle}</span>
          <span className="count"><b>{count}</b> <span className="ppl">people</span></span>
        </div>
        <Postmark />
        {kind === 'plan' && <img className="st-img deco goskate" src="/assets/cut/goskate.png" alt="" aria-hidden="true" />}
        {kind === 'room' && <><img className="st-img deco goose" src="/assets/cut/goose-stamp.png" alt="" aria-hidden="true" /><img className="sofa2 deco" src="/assets/cut/sofa2.png" alt="" aria-hidden="true" /></>}
        {kind === 'ride' && <><img className="st-img deco peng" src="/assets/cut/s-penguin.png" alt="" aria-hidden="true" style={{ width: 44, transform: 'rotate(6deg)' }} /><span className="badge-sk deco" aria-hidden="true"><img src="/assets/cut/badge-skate.png" alt="" /></span></>}
      </div>
      <div className="stickers" role="list">
        {allMembers.map((member) => <NameSticker key={member.id} member={member} list={kind} isMe={member.id === 'me'} removing={member.id === 'me' && !me} onRemove={member.id === 'me' ? onRemoveMe : undefined} />)}
      </div>
      {count === 0 && !displayedMe && <p className="empty fade"><Icon name={detail.icon} color="#f4eee2" size={24} />{detail.empty}</p>}
    </section>
  )
}

function Postmark() {
  return (
    <svg className="postmark deco" viewBox="0 0 96 44" aria-hidden="true">
      <circle cx="22" cy="22" r="18" fill="none" stroke="#173b27" strokeWidth="1.6" /><circle cx="22" cy="22" r="13" fill="none" stroke="#173b27" strokeWidth="1" />
      <text x="22" y="25" textAnchor="middle" fontSize="8" fontWeight="800" fill="#173b27" fontFamily="Pretendard Variable, sans-serif">OBT</text>
      <path d="M44 12 q6 -4 12 0 t12 0 t12 0 t12 0 M44 22 q6 -4 12 0 t12 0 t12 0 t12 0 M44 32 q6 -4 12 0 t12 0 t12 0 t12 0" fill="none" stroke="#173b27" strokeWidth="1.5" />
    </svg>
  )
}
