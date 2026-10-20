import { parseAddResult, parseOverview } from './adminMapper'
import type { AddResult, AdminOverview, AdminRepository, NewRosterEntry } from './adminRepository'
import { callRpc as call } from './rpc'

export class SupabaseAdminRepository implements AdminRepository {
  async list(password: string): Promise<AdminOverview> {
    return parseOverview(await call('admin_list', { p_pw: password }))
  }

  async add(password: string, entries: NewRosterEntry[]): Promise<AddResult> {
    const p_entries = entries.map((entry) => ({ name: entry.name, student_id: entry.studentId }))
    return parseAddResult(await call('admin_add', { p_pw: password, p_entries }))
  }

  async remove(password: string, rosterId: string): Promise<number> {
    return Number(await call('admin_remove', { p_pw: password, p_roster_id: rosterId }))
  }

  async removeMember(password: string, memberId: string): Promise<number> {
    return Number(await call('admin_remove_member', { p_pw: password, p_member_id: memberId }))
  }

  async reset(password: string): Promise<void> {
    await call('admin_reset', { p_pw: password })
  }
}
