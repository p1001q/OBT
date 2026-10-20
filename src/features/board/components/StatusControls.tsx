import type { DailyEntry } from '../../../storage/dailyEntryStorage'
import { Beads } from '../../../shared/ui/Beads'

export function StatusControls({
  entry,
  onTogglePlanned,
  onToggleRoom,
  onToggleRide,
}: {
  entry: DailyEntry
  onTogglePlanned: () => void
  onToggleRoom: () => void
  onToggleRide: () => void
}) {
  const nameLength = [...entry.name].length
  const nameSize = nameLength <= 3 ? 30 : nameLength <= 5 ? 24 : nameLength <= 8 ? 18 : 15

  return (
    <div className="ctrl-wrap">
      <img className="patch patch-h deco" src="/assets/cut/patch-heart.png" alt="" aria-hidden="true" />
      <img className="patch patch-s deco" src="/assets/cut/patch-star.png" alt="" aria-hidden="true" />
      <section className="ctrl" aria-labelledby="ctrlTitle">
        <img className="paper deco" src="/assets/cut/note-gray-pk.png" alt="" aria-hidden="true" />
        <div className="nametag" aria-hidden="true"><img src="/assets/cut/nametag.png" alt="" /><span className="nt-name" style={{ fontSize: nameSize }}>{entry.name}</span></div>
        <h2 id="ctrlTitle" className="sr">My status</h2>
        <div className="btns">
          <button className="sbtn plan" type="button" aria-pressed={entry.planned} onClick={onTogglePlanned}>
            <img className="slip" src="/assets/cut/card-s.png" alt="" aria-hidden="true" /><span className="tint" aria-hidden="true" />
            <img className="pclip" src="/assets/cut/paperclip.png" alt="" aria-hidden="true" />
            <img className="cut nob ico i-star1" src="/assets/cut/star-gold-t.png" alt="" aria-hidden="true" />
            <img className="cut nob ico i-star2" src="/assets/cut/star-holo-t.png" alt="" aria-hidden="true" />
            <span className="lbl">Riding today</span>
            <span className="sw" aria-hidden="true"><span className="swt">{entry.planned ? 'ON' : 'OFF'}</span><span className="trk" /></span>
          </button>
          <p className="loc-label" id="locLabel">NOW · Where are you? <em>(pick one)</em></p>
          <div className="locs" role="group" aria-labelledby="locLabel">
            <LocationButton kind="room" active={entry.location === 'room'} onClick={onToggleRoom} />
            <LocationButton kind="ride" active={entry.location === 'ride'} onClick={onToggleRide} />
          </div>
        </div>
        <div className="ctrl-foot"><span className="hint">tap again to peel it off</span><Beads>OBT</Beads></div>
      </section>
    </div>
  )
}

function LocationButton({ kind, active, onClick }: { kind: 'room' | 'ride'; active: boolean; onClick: () => void }) {
  const isRoom = kind === 'room'
  return (
    <button className={`sbtn ${kind}`} type="button" aria-pressed={active} onClick={onClick}>
      <img className="slip" src="/assets/cut/card-s.png" alt="" aria-hidden="true" /><span className="tint" aria-hidden="true" />
      <img className="pclip" src="/assets/cut/paperclip.png" alt="" aria-hidden="true" />
      <img className={`cut ico ${isRoom ? 'i-sofa' : 'i-sign'}`} src={isRoom ? '/assets/cut/sofa.png' : '/assets/cut/skatesign.png'} alt="" aria-hidden="true" />
      <span className="lbl">{isRoom ? 'In the club room' : 'Out riding'}<span className="state-word">{active ? '✓ Here now!' : 'Tap to mark'}</span></span>
      <span className="tick" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24"><polyline points="4,12 10,18 20,6" fill="none" stroke="#f6f2ea" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
    </button>
  )
}
