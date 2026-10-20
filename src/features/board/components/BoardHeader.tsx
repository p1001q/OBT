import { formatBoardDate } from '../../../domain/kstDate'
import { RansomText } from '../../../shared/ui/RansomText'

export function BoardHeader() {
  return (
    <header className="head">
      <h1 className="title" aria-label="OBT — today's board"><RansomText text="OBT" wordIndex={1} /><img className="t-star deco" src="/assets/cut/star-holo.webp" alt="" aria-hidden="true" /></h1>
      <div className="sub-row"><span className="dymo" aria-hidden="true">TODAY'S BOARD</span><div className="date-tag">{formatBoardDate()}</div></div>
      <div className="badges deco" aria-hidden="true"><span className="logo-st" /><span className="mini m1" /><span className="mini m2" /><span className="mini m3" /></div>
    </header>
  )
}
