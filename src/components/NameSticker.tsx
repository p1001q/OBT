import { useMemo } from 'react'
import type { BoardMember } from '../domain/member'
import { Icon, type CssVars } from './visuals'

const TAPE_DESIGNS = [
  'mint-stripe',
  'red-grid',
  'gray-grid',
  'ivory-check',
  'yellow-blue-stripe',
  'pastel-vertical',
  'blue-hand-lines',
  'pale-pink-gingham',
  'pale-yellow-gingham',
]

function hash(value: string): number {
  let result = 0
  for (const character of value) result = (result * 31 + character.charCodeAt(0)) | 0
  return Math.abs(result)
}

function rotationFor(id: string, list: string): string {
  return `${((hash(id + list) % 90) / 10 - 4.5).toFixed(1)}deg`
}

export function NameSticker({
  member,
  list,
  isMe = false,
  removing = false,
  onRemove,
}: {
  member: Pick<BoardMember, 'id' | 'name'>
  list: 'plan' | 'room' | 'ride'
  isMe?: boolean
  removing?: boolean
  onRemove?: () => void
}) {
  const tape = useMemo(() => TAPE_DESIGNS[hash(member.id) % TAPE_DESIGNS.length], [member.id])
  const style = { '--rot': rotationFor(member.id, list), '--bg': '#efe6d3', '--rad': '10px' } as CssVars
  const removeLabel = list === 'plan'
    ? 'Remove my name from Riding today'
    : list === 'room'
      ? 'Remove my name from Club room'
      : 'Remove my name from Out riding'

  return (
    <div className={`sticker ${isMe ? `me ${removing ? 'out' : 'in'}` : `tape-photo tape-${tape}`} ${hash(member.id + list) % 2 ? 'tr-a' : 'tr-b'}`} role="listitem" style={style}>
      <img className={`tex ${isMe ? '' : 'tape-design'}`} src={isMe ? '/assets/cut/tape-gold.png' : `/assets/tape/tape-${tape}.png`} alt="" aria-hidden="true" />
      {isMe && <img className="me-star" src="/assets/cut/star-red.png" alt="" aria-hidden="true" />}
      <span className="nm">{member.name}</span>
      {isMe && !removing && (
        <button className="x" type="button" aria-label={removeLabel} onClick={onRemove}>
          <span><Icon name="x" size={14} /></span>
        </button>
      )}
    </div>
  )
}
