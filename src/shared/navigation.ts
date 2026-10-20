import type { MouseEvent } from 'react'

// 뒤로 가기로 돌아왔을 때(bfcache) 페이드 아웃 상태가 남지 않게 한다.
window.addEventListener('pageshow', () => document.body.classList.remove('page-leaving'))

/** 화면을 페이드 아웃한 뒤 이동한다. 동작 줄이기 설정에서는 바로 이동한다. */
export function navigateWithFade(url: string): void {
  const go = () => window.location.assign(url)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    go()
    return
  }
  document.body.classList.add('page-leaving')
  window.setTimeout(go, 240)
}

/** 링크 클릭을 가로채 페이드 이동으로 바꾼다. 새 탭 열기 같은 보조 키 클릭은 그대로 둔다. */
export function fadeLinkClick(event: MouseEvent<HTMLAnchorElement>, url: string): void {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  navigateWithFade(url)
}
