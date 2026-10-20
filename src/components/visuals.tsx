import type { CSSProperties, ReactNode } from 'react'

const LETTER_VARIANTS: Record<string, number> = {
  A: 3, B: 2, C: 2, D: 2, E: 3, F: 2, G: 2, H: 2, I: 2,
  K: 2, L: 2, M: 2, N: 3, O: 2, P: 2, R: 2, S: 2, T: 2,
  U: 1, V: 1, W: 1, X: 1, Y: 2, Z: 2,
}

export function RansomText({ text, wordIndex = 0 }: { text: string; wordIndex?: number }) {
  const used: Record<string, number> = {}
  return (
    <span className="ransom" aria-hidden="true">
      {[...text].map((character, index) => {
        if (character === ' ') return <span className="sp" key={index} />
        const variants = LETTER_VARIANTS[character]
        if (!variants) return null
        used[character] = (used[character] ?? wordIndex + index) + 1
        const variant = (used[character] % variants) + 1
        const rotation = (((wordIndex * 7 + index * 13) % 11) - 5) * 1.2
        const vertical = ((index * 5 + wordIndex) % 3) - 1
        return (
          <img
            key={`${character}-${index}`}
            src={`/assets/cut/L-${character}${variant}.png`}
            alt=""
            style={{ transform: `rotate(${rotation}deg) translateY(${vertical * 2}px)` }}
          />
        )
      })}
    </span>
  )
}

export function Beads({ children }: { children: string }) {
  return (
    <span className="beads deco" aria-hidden="true">
      {[...children].map((character, index) => (
        <span
          className="bead"
          key={`${character}-${index}`}
          style={{ backgroundImage: `url(/assets/cut/b2-${character}.png)` }}
        />
      ))}
    </span>
  )
}

export function Icon({ name, color = '#ffcf3a', size = 20 }: { name: 'star' | 'wheel' | 'bubbles' | 'x'; color?: string; size?: number }) {
  const common = { stroke: '#3b2a22', strokeWidth: 1.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  let content: ReactNode
  if (name === 'star') content = <polygon points="12,2.5 14.9,8.7 21.6,9.4 16.6,13.9 18,20.6 12,17.2 6,20.6 7.4,13.9 2.4,9.4 9.1,8.7" fill={color} {...common} />
  else if (name === 'wheel') content = <><circle cx="12" cy="12" r="9" fill={color} {...common} /><circle cx="12" cy="12" r="3.2" fill="#fff" {...common} /></>
  else if (name === 'bubbles') content = <><circle cx="9" cy="14" r="6" fill={color} {...common} /><circle cx="17.5" cy="7" r="3.5" fill={color} {...common} /><circle cx="19" cy="16" r="2" fill={color} {...common} /></>
  else content = <path d="M7 7l10 10M17 7L7 17" stroke="#3b2a22" strokeWidth="2.8" strokeLinecap="round" />
  return <svg className="i" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{content}</svg>
}

export type CssVars = CSSProperties & Record<`--${string}`, string | number>
