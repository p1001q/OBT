import { describe, expect, it } from 'vitest'
import { parseBoard, parseRepositoryError, toServerLocation } from './boardMapper'

const item = (name: string, seed: string, is_me = false) => ({ name, seed, is_me })

describe('board mapper', () => {
  it('merges one person across lists and maps server locations', () => {
    const snapshot = parseBoard({
      day: '2026-10-20',
      planned: [item('김민서', 'aaaa1111'), item('박지훈', 'bbbb2222')],
      in_room: [item('김민서', 'aaaa1111')],
      riding: [item('최유진', 'cccc3333')],
      me: null,
    })
    expect(snapshot.day).toBe('2026-10-20')
    expect(snapshot.me).toBeNull()
    expect(snapshot.members).toEqual([
      { id: 'aaaa1111', name: '김민서', planned: true, location: 'room' },
      { id: 'bbbb2222', name: '박지훈', planned: true, location: null },
      { id: 'cccc3333', name: '최유진', planned: false, location: 'ride' },
    ])
  })

  it('keeps same-name members apart by seed and excludes the caller', () => {
    const snapshot = parseBoard({
      day: '2026-10-20',
      planned: [item('김민서', 'aaaa1111'), item('김민서', 'dddd4444', true)],
      in_room: [],
      riding: [],
      me: { planned: true, location: 'riding' },
    })
    expect(snapshot.members).toHaveLength(1)
    expect(snapshot.members[0].id).toBe('aaaa1111')
    expect(snapshot.me).toEqual({ planned: true, location: 'ride' })
  })

  it('rejects malformed responses', () => {
    expect(() => parseBoard(null)).toThrow()
    expect(() => parseBoard({ day: '2026-10-20', planned: 'x', in_room: [], riding: [] })).toThrow()
  })

  it('translates locations and error codes', () => {
    expect(toServerLocation('room')).toBe('in_room')
    expect(toServerLocation('ride')).toBe('riding')
    expect(toServerLocation(null)).toBeNull()
    expect(parseRepositoryError('NAME_SLOTS_FULL')).toBe('NAME_SLOTS_FULL')
    expect(parseRepositoryError('TypeError: Failed to fetch')).toBe('UNKNOWN')
  })
})
