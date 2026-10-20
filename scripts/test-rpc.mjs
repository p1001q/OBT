// 배포된 Supabase RPC를 실제로 호출하는 수동 검증 스크립트.
// 사용: ADMIN_PW=비밀번호 node --env-file=.env scripts/test-rpc.mjs
// 테스트용 이름(__test_*)을 만들고 끝나면 삭제한다.
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const pw = process.env.ADMIN_PW
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY)
const rpc = (fn, args) => db.rpc(fn, args)
const name = `__test_${Math.random().toString(36).slice(2, 8)}`
let failed = 0

function check(label, ok, detail = '') {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  ${detail}`}`)
}

async function cleanup() {
  const { data } = await rpc('admin_list', { p_pw: pw })
  for (const r of data?.roster ?? []) {
    if (r.name.startsWith('__test_')) await rpc('admin_remove', { p_pw: pw, p_roster_id: r.id })
  }
}

try {
  const unauth = await rpc('admin_list', { p_pw: 'wrong' })
  check('잘못된 비밀번호는 ADMIN_UNAUTHORIZED', unauth.error?.message === 'ADMIN_UNAUTHORIZED', JSON.stringify(unauth.error))

  const added = await rpc('admin_add', { p_pw: pw, p_names: [name, name, '', '  '] })
  check('동명이인 2명 추가, 빈 줄 제외', added.data === 2, JSON.stringify(added))

  const none = await rpc('register', { p_name: '__test_없는이름', p_client_nonce: randomUUID() })
  check('명단에 없는 이름은 NAME_NOT_FOUND', none.error?.message === 'NAME_NOT_FOUND', JSON.stringify(none.error))

  // 동시 등록: 자리는 2개, 요청은 6개
  const results = await Promise.all(
    Array.from({ length: 6 }, () => rpc('register', { p_name: name, p_client_nonce: randomUUID() })),
  )
  const ok = results.filter((r) => r.data?.member_id)
  const full = results.filter((r) => r.error?.message === 'NAME_SLOTS_FULL')
  check('동시 6건 중 입장자는 정확히 2명', ok.length === 2 && new Set(ok.map((r) => r.data.member_id)).size === 2, `ok=${ok.length}`)
  check('나머지 4건은 NAME_SLOTS_FULL', full.length === 4, `full=${full.length}`)

  await cleanup()
  await rpc('admin_add', { p_pw: pw, p_names: [name, name] })

  // 같은 nonce 동시 재시도: 입장자 1명
  const nonce = randomUUID()
  const retries = await Promise.all(
    Array.from({ length: 5 }, () => rpc('register', { p_name: name, p_client_nonce: nonce })),
  )
  const ids = new Set(retries.map((r) => r.data?.member_id))
  check('같은 nonce 재시도는 같은 입장자 ID', ids.size === 1 && !ids.has(undefined), JSON.stringify([...ids]))

  const id = [...ids][0]
  const p = await rpc('set_planned', { p_member_id: id, p_on: true })
  const l = await rpc('set_location', { p_member_id: id, p_location: 'in_room' })
  check('예정과 동방 동시 선택', p.data?.planned === true && l.data?.location === 'in_room' && l.data?.planned === true, JSON.stringify(l))
  const r2 = await rpc('set_location', { p_member_id: id, p_location: 'riding' })
  check('위치를 타는 중으로 전환하면 동방 해제', r2.data?.location === 'riding' && r2.data?.planned === true, JSON.stringify(r2))
  const bad = await rpc('set_location', { p_member_id: id, p_location: 'nowhere' })
  check('허용하지 않은 위치는 INVALID_STATUS', bad.error?.message === 'INVALID_STATUS', JSON.stringify(bad.error))

  const board = await rpc('get_board', { p_member_id: id })
  const mine = board.data?.riding?.filter((x) => x.is_me) ?? []
  check('get_board에 본인이 is_me로 표시', mine.length === 1, JSON.stringify(board.data))
  check('get_board 응답에 member_id 미포함', !JSON.stringify(board.data).includes(id))

  const off = await rpc('set_location', { p_member_id: id, p_location: null })
  const off2 = await rpc('set_planned', { p_member_id: id, p_on: false })
  const board2 = await rpc('get_board')
  const still = [...(board2.data?.planned ?? []), ...(board2.data?.riding ?? []), ...(board2.data?.in_room ?? [])].filter((x) => x.name === name)
  check('상태를 모두 끄면 현황판에서 사라짐', off.error == null && off2.error == null && still.length === 0, JSON.stringify(still))

  const nf = await rpc('set_planned', { p_member_id: randomUUID(), p_on: true })
  check('없는 입장자는 MEMBER_NOT_FOUND', nf.error?.message === 'MEMBER_NOT_FOUND', JSON.stringify(nf.error))

  const direct = await db.from('roster').select('*')
  check('테이블 직접 조회는 거부', direct.error != null || (direct.data ?? []).length === 0, JSON.stringify(direct.data))
} finally {
  await cleanup()
}

console.log(failed === 0 ? '\n전체 통과' : `\n실패 ${failed}건`)
process.exit(failed === 0 ? 0 : 1)
