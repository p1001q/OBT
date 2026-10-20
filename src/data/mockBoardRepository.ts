import type { BoardRepository, BoardSnapshot } from './boardRepository'

const MOCK_MEMBERS = [
  { id: 'u1', name: '김민서', planned: true, location: 'room' },
  { id: 'u2', name: '박지훈', planned: true, location: 'room' },
  { id: 'u3', name: '이서연', planned: true, location: 'room' },
  { id: 'u4', name: '정민수', planned: true, location: 'ride' },
  { id: 'u5', name: '최유진', planned: true, location: null },
  { id: 'u6', name: '한지우', planned: true, location: 'ride' },
  { id: 'u7', name: '오세훈', planned: true, location: 'room' },
  { id: 'u8', name: '윤하늘', planned: true, location: null },
  { id: 'u9', name: '임도현', planned: true, location: 'ride' },
  { id: 'u10', name: '송예린', planned: true, location: 'room' },
  { id: 'u11', name: '강서준', planned: false, location: 'ride' },
  { id: 'u12', name: '배수아', planned: false, location: 'room' },
] as const

export class MockBoardRepository implements BoardRepository {
  async getBoard(): Promise<BoardSnapshot> {
    return { members: MOCK_MEMBERS.map((member) => ({ ...member })) }
  }
}
