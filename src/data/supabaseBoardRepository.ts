import type { Location, MemberStatus } from '../domain/member'
import { parseBoard, parseStatus, toServerLocation } from './boardMapper'
import {
  RepositoryError,
  type BoardRepository,
  type BoardSnapshot,
  type NameCheck,
  type Registration,
} from './boardRepository'
import { callRpc as call } from './rpc'

export class SupabaseBoardRepository implements BoardRepository {
  async checkName(name: string): Promise<NameCheck> {
    const data = (await call('check_name', { p_name: name })) as { found?: unknown; day?: unknown; empty?: unknown } | null
    if (typeof data?.found !== 'boolean' || typeof data.day !== 'string') {
      throw new RepositoryError('UNKNOWN', 'Unexpected response shape')
    }
    return { found: data.found, day: data.day, rosterEmpty: data.empty === true }
  }

  async getBoard(memberId: string | null): Promise<BoardSnapshot> {
    return parseBoard(await call('get_board', { p_member_id: memberId }))
  }

  async register(name: string, clientNonce: string): Promise<Registration> {
    const data = (await call('register', { p_name: name, p_client_nonce: clientNonce })) as
      | { member_id?: unknown; day?: unknown }
      | null
    if (typeof data?.member_id !== 'string' || typeof data.day !== 'string') {
      throw new RepositoryError('UNKNOWN', 'Unexpected response shape')
    }
    return { memberId: data.member_id, day: data.day }
  }

  async setPlanned(memberId: string, planned: boolean): Promise<MemberStatus> {
    return parseStatus(await call('set_planned', { p_member_id: memberId, p_on: planned }))
  }

  async setLocation(memberId: string, location: Location): Promise<MemberStatus> {
    return parseStatus(
      await call('set_location', { p_member_id: memberId, p_location: toServerLocation(location) }),
    )
  }

  async leaveToday(memberId: string): Promise<void> {
    await call('leave_today', { p_member_id: memberId })
  }
}
