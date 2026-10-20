import type { BoardMember, Location, MemberStatus } from '../domain/member'
import { RepositoryError, type BoardSnapshot, type RepositoryErrorCode } from './boardRepository'

const ERROR_CODES: readonly RepositoryErrorCode[] = [
  'NAME_NOT_FOUND',
  'NAME_SLOTS_FULL',
  'MEMBER_NOT_FOUND',
  'MEMBER_EXPIRED',
  'INVALID_STATUS',
  'INVALID_REQUEST',
]

export function parseRepositoryError(message: string): RepositoryErrorCode {
  return ERROR_CODES.find((code) => code === message) ?? 'UNKNOWN'
}

export function toServerLocation(location: Location): 'in_room' | 'riding' | null {
  if (location === 'room') return 'in_room'
  if (location === 'ride') return 'riding'
  return null
}

function fromServerLocation(value: unknown): Location {
  if (value === 'in_room') return 'room'
  if (value === 'riding') return 'ride'
  return null
}

function malformed(): never {
  throw new RepositoryError('UNKNOWN', 'Unexpected response shape')
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return malformed()
  return value as Record<string, unknown>
}

export function parseStatus(raw: unknown): MemberStatus {
  const data = asRecord(raw)
  return { planned: data.planned === true, location: fromServerLocation(data.location) }
}

interface RawItem {
  name: string
  seed: string
  is_me: boolean
}

function asItems(value: unknown): RawItem[] {
  if (!Array.isArray(value)) return malformed()
  return value.map((item) => {
    const data = asRecord(item)
    if (typeof data.name !== 'string' || typeof data.seed !== 'string') return malformed()
    return { name: data.name, seed: data.seed, is_me: data.is_me === true }
  })
}

/** get_board 응답을 화면용 스냅샷으로 바꾼다. 세 목록의 같은 seed를 한 사람으로 합친다. */
export function parseBoard(raw: unknown): BoardSnapshot {
  const data = asRecord(raw)
  if (typeof data.day !== 'string') return malformed()

  const members = new Map<string, BoardMember>()
  const collect = (items: RawItem[], apply: (member: BoardMember) => void) => {
    for (const item of items) {
      if (item.is_me) continue
      const member = members.get(item.seed) ?? { id: item.seed, name: item.name, planned: false, location: null }
      apply(member)
      members.set(item.seed, member)
    }
  }
  collect(asItems(data.planned), (member) => { member.planned = true })
  collect(asItems(data.in_room), (member) => { member.location = 'room' })
  collect(asItems(data.riding), (member) => { member.location = 'ride' })

  return {
    day: data.day,
    members: [...members.values()],
    me: data.me == null ? null : parseStatus(data.me),
  }
}
