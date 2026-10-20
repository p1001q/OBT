import { RansomText } from '../../../shared/ui/RansomText'

export function Notice() {
  return (
    <section className="notice" aria-labelledby="h-notice">
      <div className="nt-head"><div className="mega-wrap deco" aria-hidden="true"><img className="ahhh" src="/assets/cut/ahhh.webp" alt="" /><img className="mega cut" src="/assets/cut/p-mega.webp" alt="" /></div><h2 id="h-notice" className="nt-h" aria-label="Notice"><RansomText text="NOTICE" wordIndex={5} /></h2></div>
      <div className="nt nt-bubble">
        <img className="nt-img" src="/assets/cut/bubble.webp" alt="" aria-hidden="true" />
        <img className="cut deco" src="/assets/cut/tape-dots.webp" alt="" aria-hidden="true" style={{ width: 26, left: 20, top: -14, transform: 'rotate(-28deg)' }} />
        <div className="nt-txt b-txt"><b>자율 연습은<br />오후 6–7시까지!</b><span>공용장비는 보드 밑에 숫자 있음. 숫자 없는 건 남의 개인보드!</span></div>
      </div>
      <img className="cut deco" src="/assets/cut/star-gold.webp" alt="" aria-hidden="true" style={{ width: 34, left: 30, bottom: 60, transform: 'rotate(10deg)' }} />
      <img className="cut deco" src="/assets/cut/star-blue.webp" alt="" aria-hidden="true" style={{ width: 24, left: 74, bottom: 36, transform: 'rotate(-14deg)' }} />
      <div className="nt nt-sign" role="note" aria-label="Notice: 동방 깨끗이 사용!"><img className="nt-img" src="/assets/cut/sign.webp" alt="" aria-hidden="true" /><div className="nt-txt s-txt">동방<br />깨끗이<br />사용!</div></div>
    </section>
  )
}
