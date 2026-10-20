export type Location = 'room' | 'ride' | null

export interface MemberStatus {
  planned: boolean
  location: Location
}

export interface BoardMember extends MemberStatus {
  id: string
  name: string
}

export const EMPTY_STATUS: MemberStatus = {
  planned: false,
  location: null,
}

export function togglePlanned(status: MemberStatus): MemberStatus {
  return { ...status, planned: !status.planned }
}

export function toggleLocation(
  status: MemberStatus,
  location: Exclude<Location, null>,
): MemberStatus {
  return {
    ...status,
    location: status.location === location ? null : location,
  }
}

export function clearListStatus(
  status: MemberStatus,
  list: 'plan' | 'room' | 'ride',
): MemberStatus {
  return list === 'plan' ? { ...status, planned: false } : { ...status, location: null }
}
