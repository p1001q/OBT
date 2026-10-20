export const MAX_NAME_LENGTH = 30

/** 서버(admin_add)의 학번 형식과 같다. */
const STUDENT_ID = /^\d{5,20}$/
const DIGITS_ONLY = /^\d+$/

export interface RosterEntryInput {
  name: string
  studentId: string
}

export interface ExistingRoster {
  /** 이름별 명단 자리 수 */
  names: ReadonlyMap<string, number>
  /** 이미 등록된 학번 */
  studentIds: ReadonlySet<string>
}

export interface RosterPlan {
  /** 서버로 보낼 항목. 입력 순서를 유지한다. */
  entries: RosterEntryInput[]
  /** 같은 입력 안에서 앞의 같은 학번이 있어 제외한 줄 */
  duplicateIds: { studentId: string; name: string }[]
  /** 이미 명단에 등록된 학번이라 제외한 줄 */
  alreadyRegistered: { studentId: string; name: string }[]
  /** 같은 학번인데 이름이 달라 앞의 줄만 남긴 경우 */
  conflicts: { studentId: string; kept: string; other: string }[]
  /** 형식이 맞지 않는 줄 */
  invalid: string[]
  /** 30자를 넘는 이름 */
  tooLong: string[]
  /** 입력 안에서 같은 이름이 여러 번 있는 경우(동명이인 자리로 추가됨) */
  homonyms: { name: string; count: number }[]
  /** 이미 명단에 같은 이름이 있는 경우 */
  overlaps: { name: string; existing: number; adding: number }[]
}

/**
 * 한 줄을 `학번 이름` 또는 `이름 학번`(공백·탭으로 구분)으로 해석한다.
 * 토큰이 정확히 둘이어야 하고, 하나는 5~20자리 숫자(학번), 다른 하나는 숫자만으로 된 값이 아닌 이름이어야 한다.
 */
export function parseRosterLine(line: string): RosterEntryInput | null {
  const tokens = line.trim().split(/\s+/)
  if (tokens.length !== 2) return null
  const [first, second] = tokens
  if (STUDENT_ID.test(first) && !DIGITS_ONLY.test(second)) return { studentId: first, name: second }
  if (STUDENT_ID.test(second) && !DIGITS_ONLY.test(first)) return { studentId: second, name: first }
  return null
}

/**
 * 붙여넣은 명단을 서버에 보낼 항목으로 바꾼다. 모든 줄에 학번이 있어야 한다.
 * 같은 학번은 같은 사람으로 보고 한 번만 남기며, 학번이 다르면 같은 이름도 동명이인으로 추가한다.
 */
export function planRosterInput(text: string, existing: ExistingRoster): RosterPlan {
  const plan: RosterPlan = {
    entries: [], duplicateIds: [], alreadyRegistered: [], conflicts: [], invalid: [], tooLong: [], homonyms: [], overlaps: [],
  }
  const seenIds = new Map<string, string>()

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const parsed = parseRosterLine(trimmed)
    if (!parsed) {
      plan.invalid.push(trimmed)
      continue
    }
    const { name, studentId } = parsed

    const kept = seenIds.get(studentId)
    if (kept !== undefined) {
      plan.duplicateIds.push({ studentId, name })
      if (kept !== name) plan.conflicts.push({ studentId, kept, other: name })
      continue
    }
    seenIds.set(studentId, name)
    if (existing.studentIds.has(studentId)) {
      plan.alreadyRegistered.push({ studentId, name })
      continue
    }
    if ([...name].length > MAX_NAME_LENGTH) {
      plan.tooLong.push(name)
      continue
    }
    plan.entries.push({ name, studentId })
  }

  const counts = new Map<string, number>()
  for (const { name } of plan.entries) counts.set(name, (counts.get(name) ?? 0) + 1)
  for (const [name, count] of counts) {
    if (count > 1) plan.homonyms.push({ name, count })
    const already = existing.names.get(name) ?? 0
    if (already > 0) plan.overlaps.push({ name, existing: already, adding: count })
  }
  return plan
}

export function canSubmit(plan: RosterPlan): boolean {
  return plan.entries.length > 0 && plan.invalid.length === 0 && plan.tooLong.length === 0
}
