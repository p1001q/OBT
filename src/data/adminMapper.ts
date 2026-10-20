import { fromServerLocation } from './boardMapper'
import type { AddResult, AdminOverview } from './adminRepository'
import { RepositoryError } from './boardRepository'

function malformed(): never {
  throw new RepositoryError('UNKNOWN', 'Unexpected response shape')
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return malformed()
  return value as Record<string, unknown>
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : malformed()
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : malformed()
}

export function parseOverview(raw: unknown): AdminOverview {
  const data = asRecord(raw)
  return {
    day: str(data.day),
    roster: asArray(data.roster).map((item) => {
      const row = asRecord(item)
      return {
        id: str(row.id),
        name: str(row.name),
        studentId: typeof row.student_id === 'string' ? row.student_id : null,
        memberId: typeof row.member_id === 'string' ? row.member_id : null,
      }
    }),
    members: asArray(data.members).map((item) => {
      const row = asRecord(item)
      return {
        id: str(row.id),
        rosterId: str(row.roster_id),
        name: str(row.name),
        planned: row.planned === true,
        location: fromServerLocation(row.location),
      }
    }),
    summary: asArray(data.summary).map((item) => {
      const row = asRecord(item)
      return { name: str(row.name), slots: Number(row.slots), joined: Number(row.joined) }
    }),
  }
}

export function parseAddResult(raw: unknown): AddResult {
  const data = asRecord(raw)
  return { added: Number(data.added), skipped: Number(data.skipped) }
}
