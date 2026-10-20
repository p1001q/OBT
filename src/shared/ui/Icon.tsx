import type { ReactNode } from 'react'

export function Icon({ name, color = '#ffcf3a', size = 20 }: { name: 'star' | 'wheel' | 'bubbles' | 'x'; color?: string; size?: number }) {
  const common = { stroke: '#3b2a22', strokeWidth: 1.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  let content: ReactNode
  if (name === 'star') content = <polygon points="12,2.5 14.9,8.7 21.6,9.4 16.6,13.9 18,20.6 12,17.2 6,20.6 7.4,13.9 2.4,9.4 9.1,8.7" fill={color} {...common} />
  else if (name === 'wheel') content = <><circle cx="12" cy="12" r="9" fill={color} {...common} /><circle cx="12" cy="12" r="3.2" fill="#fff" {...common} /></>
  else if (name === 'bubbles') content = <><circle cx="9" cy="14" r="6" fill={color} {...common} /><circle cx="17.5" cy="7" r="3.5" fill={color} {...common} /><circle cx="19" cy="16" r="2" fill={color} {...common} /></>
  else content = <path d="M7 7l10 10M17 7L7 17" stroke="#3b2a22" strokeWidth="2.8" strokeLinecap="round" />
  return <svg className="i" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{content}</svg>
}
