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
