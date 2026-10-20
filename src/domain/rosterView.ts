import type { AdminMember, AdminRosterEntry } from '../data/adminRepository'

const collator = new Intl.Collator('ko')

/** 이름 가나다순, 같은 이름이면 학번순 */
export function sortRoster(entries: readonly AdminRosterEntry[]): AdminRosterEntry[] {
  return [...entries].sort((a, b) => collator.compare(a.name, b.name) || (a.studentId ?? '').localeCompare(b.studentId ?? ''))
}

/** 이름 가나다순, 같은 이름이면 명단 쪽 학번순 */
export function sortMembers(members: readonly AdminMember[], roster: readonly AdminRosterEntry[]): AdminMember[] {
  const studentIdOf = new Map(roster.map((entry) => [entry.id, entry.studentId ?? '']))
  return [...members].sort(
    (a, b) => collator.compare(a.name, b.name) || (studentIdOf.get(a.rosterId) ?? '').localeCompare(studentIdOf.get(b.rosterId) ?? ''),
  )
}

/** 이름 또는 학번에 검색어가 들어 있는 항목만 남긴다. */
export function filterRoster(entries: readonly AdminRosterEntry[], query: string): AdminRosterEntry[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return [...entries]
  return entries.filter((entry) => entry.name.toLowerCase().includes(needle) || (entry.studentId ?? '').includes(needle))
}
