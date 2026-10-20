import { describe, expect, it } from 'vitest'
import { getKstDay } from './kstDate'

describe('KST day', () => {
  it('changes at midnight in Seoul rather than UTC', () => {
    expect(getKstDay(new Date('2026-10-19T14:59:59Z'))).toBe('2026-10-19')
    expect(getKstDay(new Date('2026-10-19T15:00:00Z'))).toBe('2026-10-20')
  })
})
