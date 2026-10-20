import type { RepositoryErrorCode } from './boardRepository'

export const ERROR_MESSAGES: Record<RepositoryErrorCode, string> = {
  NAME_NOT_FOUND: '명단에 없는 이름이에요. 회장에게 문의해 주세요.',
  NAME_SLOTS_FULL: '같은 이름의 자리가 모두 찼어요. 회장에게 문의해 주세요.',
  MEMBER_NOT_FOUND: '입장 정보를 찾지 못했어요. 다시 시도해 주세요.',
  MEMBER_EXPIRED: '날짜가 바뀌었어요. 이름을 다시 입력해 주세요.',
  INVALID_STATUS: '저장하지 못했어요. 다시 시도해 주세요.',
  INVALID_REQUEST: '요청을 처리하지 못했어요. 입력을 확인해 주세요. (이름은 30자 이하, 한 번에 500명까지)',
  ADMIN_UNAUTHORIZED: '관리자 비밀번호가 맞지 않아요.',
  UNKNOWN: '연결에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
}
