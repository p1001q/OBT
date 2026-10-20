import { describe, expect, it } from 'vitest'
import { canSubmit, parseRosterLine, planRosterInput, type ExistingRoster } from './rosterInput'

const none: ExistingRoster = { names: new Map(), studentIds: new Set() }

describe('parseRosterLine', () => {
  it('accepts either order with any amount of spaces or tabs', () => {
    expect(parseRosterLine('김민서 1010102')).toEqual({ name: '김민서', studentId: '1010102' })
    expect(parseRosterLine('김민서       43417923479')).toEqual({ name: '김민서', studentId: '43417923479' })
    expect(parseRosterLine('34617461796 김민서')).toEqual({ name: '김민서', studentId: '34617461796' })
    expect(parseRosterLine('2026132010\t박혜현')).toEqual({ name: '박혜현', studentId: '2026132010' })
  })

  it('rejects anything that is not exactly one student id and one name', () => {
    expect(parseRosterLine('김민서 465 237923')).toBeNull()
    expect(parseRosterLine('박수연')).toBeNull()
    expect(parseRosterLine('2026132010')).toBeNull()
    expect(parseRosterLine('2026132010 2026132011')).toBeNull()
    expect(parseRosterLine('김민서 이민서')).toBeNull()
    expect(parseRosterLine('김민서 1234')).toBeNull()
    expect(parseRosterLine('2026132010,박혜현')).toBeNull()
  })
})

describe('planRosterInput', () => {
  it('keeps one entry per student id', () => {
    const plan = planRosterInput('2023115076\t임정현\n2026132010\t박혜현\n임정현 2023115076\n', none)
    expect(plan.entries).toEqual([
      { name: '임정현', studentId: '2023115076' },
      { name: '박혜현', studentId: '2026132010' },
    ])
    expect(plan.duplicateIds).toEqual([{ studentId: '2023115076', name: '임정현' }])
    expect(plan.conflicts).toEqual([])
  })

  it('keeps different student ids with the same name as homonyms', () => {
    const plan = planRosterInput('2024000001 김민서\n김민서 2025000002', none)
    expect(plan.entries).toHaveLength(2)
    expect(plan.homonyms).toEqual([{ name: '김민서', count: 2 }])
  })

  it('reports a student id reused with another name', () => {
    const plan = planRosterInput('2024000001 김민서\n2024000001 김민수', none)
    expect(plan.entries).toEqual([{ name: '김민서', studentId: '2024000001' }])
    expect(plan.conflicts).toEqual([{ studentId: '2024000001', kept: '김민서', other: '김민수' }])
  })

  it('skips student ids already in the roster without a homonym warning', () => {
    const existing: ExistingRoster = { names: new Map([['박수연', 1]]), studentIds: new Set(['2022301032']) }
    const plan = planRosterInput('2022301032 박수연\n2026000009 박수연', existing)
    expect(plan.alreadyRegistered).toEqual([{ studentId: '2022301032', name: '박수연' }])
    expect(plan.entries).toEqual([{ name: '박수연', studentId: '2026000009' }])
    expect(plan.overlaps).toEqual([{ name: '박수연', existing: 1, adding: 1 }])
  })

  it('blocks submission when any line has a bad format', () => {
    const plan = planRosterInput('2026132010 박혜현\n김민서 465 237923\n\n박수연', none)
    expect(plan.entries).toHaveLength(1)
    expect(plan.invalid).toEqual(['김민서 465 237923', '박수연'])
    expect(canSubmit(plan)).toBe(false)
  })

  it('blocks submission for names over 30 characters', () => {
    const plan = planRosterInput(`2024000003 ${'가'.repeat(31)}`, none)
    expect(plan.tooLong).toHaveLength(1)
    expect(canSubmit(plan)).toBe(false)
  })
})
