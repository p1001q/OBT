import { useMemo, useState } from 'react'
import type { AdminNameSummary, AdminRosterEntry, NewRosterEntry } from '../../data/adminRepository'
import { canSubmit, planRosterInput } from '../../domain/rosterInput'

export function AddNamesForm({
  summary,
  roster,
  busy,
  onAdd,
}: {
  summary: AdminNameSummary[]
  roster: AdminRosterEntry[]
  busy: boolean
  onAdd: (entries: NewRosterEntry[]) => Promise<void>
}) {
  const [text, setText] = useState('')
  const existing = useMemo(() => ({
    names: new Map(summary.map((item) => [item.name, item.slots])),
    studentIds: new Set(roster.flatMap((entry) => (entry.studentId ? [entry.studentId] : []))),
  }), [summary, roster])
  const plan = useMemo(() => planRosterInput(text, existing), [text, existing])

  async function submit() {
    if (!canSubmit(plan)) return
    if (plan.overlaps.length > 0) {
      const list = plan.overlaps.map((item) => `${item.name}(기존 ${item.existing}명)`).join(', ')
      if (!window.confirm(`이미 명단에 같은 이름이 있어요: ${list}\n동명이인 자리로 추가할까요?`)) return
    }
    await onAdd(plan.entries)
    setText('')
  }

  const formatError = plan.invalid.length > 0
  const overlapPeople = plan.overlaps.reduce((sum, item) => sum + item.adding, 0)

  return (
    <section className="admin-card" aria-labelledby="addTitle">
      <h2 id="addTitle">명단 추가</h2>
      <p className="admin-hint">한 줄에 한 명씩 <code>학번 이름</code> 또는 <code>이름 학번</code>을 띄어쓰기로 구분해 적어 주세요. 학번은 필수예요. 같은 학번은 같은 사람으로 보고 한 번만 등록하며, 학번은 관리자 화면에서만 보여요.</p>
      <label className="sr" htmlFor="addNames">추가할 명단</label>
      <textarea id="addNames" rows={6} value={text} placeholder={'2026132010 박혜현\n김지호 2026102085'} onChange={(event) => setText(event.target.value)} />
      {text.trim() && (
        <div aria-live="polite">
          {formatError && (
            <div className="admin-error-box" role="alert">
              <p>형식이 맞지 않는 줄이 있어요. 한 줄에 <b>학번 이름</b> 또는 <b>이름 학번</b>(띄어쓰기로 구분) 형식으로 다시 입력해 주세요.</p>
              <ul>{plan.invalid.map((line, index) => <li key={`${index}-${line}`}>{line}</li>)}</ul>
            </div>
          )}
          <ul className="admin-plan">
            <li><b>{plan.entries.length}명</b> 추가돼요</li>
            {plan.alreadyRegistered.length > 0 && <li>이미 등록된 학번이라 제외: {plan.alreadyRegistered.map((item) => `${item.name}(${item.studentId})`).join(', ')}</li>}
            {plan.duplicateIds.length > 0 && <li>같은 학번이라 제외: {plan.duplicateIds.map((item) => `${item.name}(${item.studentId})`).join(', ')}</li>}
            {plan.conflicts.length > 0 && <li className="warn">같은 학번에 이름이 달라요: {plan.conflicts.map((item) => `${item.studentId} ${item.kept} / ${item.other}`).join(', ')} (앞의 이름만 추가)</li>}
            {plan.homonyms.length > 0 && <li className="warn">같은 이름이 여러 번 있어 동명이인으로 추가돼요: {plan.homonyms.map((item) => `${item.name} ×${item.count}`).join(', ')}</li>}
            {plan.overlaps.length > 0 && (
              <li className="warn">이미 명단에 있는 이름: <b>{overlapPeople}명</b>
                <ul>{plan.overlaps.map((item) => <li key={item.name}>{item.name} (기존 {item.existing}명)</li>)}</ul>
              </li>
            )}
            {plan.tooLong.length > 0 && <li className="bad">30자를 넘는 이름이 있어요.</li>}
          </ul>
        </div>
      )}
      <button className="admin-btn primary" type="button" disabled={busy || !canSubmit(plan)} onClick={submit}>
        {plan.entries.length > 0 ? `${plan.entries.length}명 추가` : '추가'}
      </button>
    </section>
  )
}
