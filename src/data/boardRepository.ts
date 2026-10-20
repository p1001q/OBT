import type { BoardMember, Location, MemberStatus } from '../domain/member'

export interface BoardSnapshot {
  day: string
  /** 본인을 제외한 오늘의 활성 입장자 */
  members: BoardMember[]
  /** 요청한 입장자 ID의 서버 상태. 오늘의 입장자가 아니면 null */
  me: MemberStatus | null
}

export interface NameCheck {
  found: boolean
  day: string
}

export interface Registration {
  memberId: string
  day: string
}

export type RepositoryErrorCode =
  | 'NAME_NOT_FOUND'
  | 'NAME_SLOTS_FULL'
  | 'MEMBER_NOT_FOUND'
  | 'MEMBER_EXPIRED'
  | 'INVALID_STATUS'
  | 'INVALID_REQUEST'
  | 'UNKNOWN'

export class RepositoryError extends Error {
  code: RepositoryErrorCode

  constructor(code: RepositoryErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'RepositoryError'
    this.code = code
  }
}

export interface BoardRepository {
  checkName(name: string): Promise<NameCheck>
  getBoard(memberId: string | null): Promise<BoardSnapshot>
  register(name: string, clientNonce: string): Promise<Registration>
  setPlanned(memberId: string, planned: boolean): Promise<MemberStatus>
  setLocation(memberId: string, location: Location): Promise<MemberStatus>
  leaveToday(memberId: string): Promise<void>
}
