export function Beads({ children }: { children: string }) {
  return (
    <span className="beads deco" aria-hidden="true">
      {[...children].map((character, index) => (
        <span
          className="bead"
          key={`${character}-${index}`}
          style={{ backgroundImage: `url(/assets/cut/b2-${character}.webp)` }}
        />
      ))}
    </span>
  )
}
