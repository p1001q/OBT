import type { Location } from '../domain/member'

export interface AdminRosterEntry {
  id: string
  name: string
  /** 관리자 화면에서만 쓰는 학번. 등록 때 입력하지 않았다면 null */
  studentId: string | null
  /** 오늘 이 자리에 입장한 입장자 ID. 없으면 null */
  memberId: string | null
}

export interface AdminMember {
  id: string
  rosterId: string
  name: string
  planned: boolean
  location: Location
}

export interface AdminNameSummary {
  name: string
  slots: number
  joined: number
}

export interface AdminOverview {
  day: string
  roster: AdminRosterEntry[]
  members: AdminMember[]
  summary: AdminNameSummary[]
}

export interface NewRosterEntry {
  name: string
  studentId: string | null
}

export interface AddResult {
  added: number
  /** 이미 등록된 학번이라 추가하지 않은 수 */
  skipped: number
}

export interface AdminRepository {
  list(password: string): Promise<AdminOverview>
  add(password: string, entries: NewRosterEntry[]): Promise<AddResult>
  remove(password: string, rosterId: string): Promise<number>
  removeMember(password: string, memberId: string): Promise<number>
  reset(password: string): Promise<void>
}
