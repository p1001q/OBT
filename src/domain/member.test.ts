import { describe, expect, it } from 'vitest'
import { clearListStatus, toggleLocation, togglePlanned } from './member'

describe('member status rules', () => {
  it('toggles planned without changing location', () => {
    expect(togglePlanned({ planned: false, location: 'room' })).toEqual({ planned: true, location: 'room' })
  })

  it('makes room and riding mutually exclusive and toggles the active location off', () => {
    expect(toggleLocation({ planned: true, location: 'room' }, 'ride')).toEqual({ planned: true, location: 'ride' })
    expect(toggleLocation({ planned: true, location: 'ride' }, 'ride')).toEqual({ planned: true, location: null })
  })

  it('clears only the status represented by a personal sticker', () => {
    expect(clearListStatus({ planned: true, location: 'room' }, 'plan')).toEqual({ planned: false, location: 'room' })
    expect(clearListStatus({ planned: true, location: 'room' }, 'room')).toEqual({ planned: true, location: null })
  })
})
