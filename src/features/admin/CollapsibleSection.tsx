import { useState, type ReactNode } from 'react'

export function CollapsibleSection({
  id,
  title,
  meta,
  actions,
  children,
}: {
  id: string
  title: string
  meta: string
  /** 제목 오른쪽에 두는 요소. 접으면 함께 숨긴다. */
  actions?: ReactNode
  children: ReactNode
}) {
  const [open, setOpen] = useState(true)
  const bodyId = `${id}-body`

  return (
    <section className="admin-card" aria-labelledby={`${id}-title`}>
      <div className={`admin-section-head ${open ? '' : 'closed'}`}>
        <button className="admin-toggle" type="button" aria-expanded={open} aria-controls={bodyId} aria-label={`${title} ${open ? '접기' : '펼치기'}`} onClick={() => setOpen((value) => !value)}>
          <svg className={open ? '' : 'down'} width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <polyline points="5,15 12,8 19,15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 id={`${id}-title`}>{title} <span>{meta}</span></h2>
        {actions && <div className="admin-section-actions" inert={!open}>{actions}</div>}
      </div>
      {/* 접어도 DOM은 유지하고 높이만 줄여 부드럽게 접는다. inert로 접힌 내용에 포커스가 가지 않게 한다. */}
      <div id={bodyId} className={`admin-collapse ${open ? 'open' : ''}`} inert={!open}>
        <div className="admin-collapse-inner">{children}</div>
      </div>
    </section>
  )
}
