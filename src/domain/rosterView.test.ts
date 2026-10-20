import { describe, expect, it } from 'vitest'
import type { AdminMember, AdminRosterEntry } from '../data/adminRepository'
import { filterRoster, sortMembers, sortRoster } from './rosterView'

const entry = (id: string, name: string, studentId: string | null): AdminRosterEntry => ({ id, name, studentId, memberId: null })
const roster = [entry('1', '박혜현', '2026132010'), entry('2', '강한결', '2026103002'), entry('3', '김민서', '2025000002'), entry('4', '김민서', '2024000001')]

describe('roster view', () => {
  it('sorts names in Korean alphabetical order, then by student id', () => {
    expect(sortRoster(roster).map((item) => `${item.name}${item.studentId}`)).toEqual([
      '강한결2026103002', '김민서2024000001', '김민서2025000002', '박혜현2026132010',
    ])
  })

  it('sorts members by name and breaks ties with the roster student id', () => {
    const member = (id: string, rosterId: string, name: string): AdminMember => ({ id, rosterId, name, planned: true, location: null })
    const sorted = sortMembers([member('a', '3', '김민서'), member('b', '1', '박혜현'), member('c', '4', '김민서')], roster)
    expect(sorted.map((item) => item.id)).toEqual(['c', 'a', 'b'])
  })

  it('filters by partial name or student id while typing', () => {
    expect(filterRoster(roster, '민').map((item) => item.id)).toEqual(['3', '4'])
    expect(filterRoster(roster, '0261').map((item) => item.id)).toEqual(['1', '2'])
    expect(filterRoster(roster, '  ')).toHaveLength(4)
    expect(filterRoster(roster, '없는사람')).toEqual([])
  })
})
