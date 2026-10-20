import type { BoardMember } from '../domain/member'

export interface BoardSnapshot {
  members: BoardMember[]
}

export interface BoardRepository {
  getBoard(): Promise<BoardSnapshot>
}
