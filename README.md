# OBT — 보드 동아리 오늘 현황판

동아리원이 **오늘 보드를 탈 사람**, **동방에 있는 사람**, **지금 보드를 타는 사람**을 한 화면에서 확인하고 자신의 상태를 공유하는 모바일 우선 웹 앱. 회원가입이나 계정 로그인 없이 동아리 명단에 등록된 이름만 입력해 사용함

## 특징

- **이름 확인 후 입장**: 입력한 이름을 동아리 명단과 대조함
- **관전 모드**: 상태를 등록하기 전에는 이름이 공개되지 않음
- **오늘 보드 탈 예정**: 위치와 별개로 켜고 끄는 독립 토글
- **동방에 있음 / 보드 타는 중**: 둘 중 하나만 선택되는 위치 전환
- **상태 해제**: 상단 상태 버튼 또는 본인 이름 스티커의 `×`로 해제
- **동명이인 지원**: 같은 이름의 동아리원을 각각 표시
- **자동 갱신**: 10초 간격으로 현황을 불러옴
- **날짜 초기화**: KST 날짜가 바뀌면 입장과 상태를 새로 시작
- **관리자 화면(`/admin`)**: 비밀번호로 들어가 명단과 오늘의 입장자를 관리함
- **자체 제작 폰트**: 이름 스티커에 보드마카 느낌의 직접 만든 한글 폰트를 사용

## 화면 콘셉트

교실 뒤편의 **알록달록한 코르크 핀보드**가 모티프. 상태별 메모지와 자동 생성되는 이름 스티커로 단순한 명단을 친근하고 재미있게 표현함

## 상태 모델

탑승 계획과 현재 위치를 독립적으로 관리함

```text
탑승 계획
- planned: true / false

현재 위치
- location: null / in_room / riding
```

`오늘 보드 탈 예정 + 동방에 있음`, `오늘 보드 탈 예정 + 보드 타는 중`처럼 계획과 위치를 동시에 표시할 수 있음. `동방에 있음`과 `보드 타는 중`은 서로 중복되지 않음

## 관리자 화면

- 관리자 비밀번호로 로그인함. 비밀번호는 현재 탭의 `sessionStorage`에만 두고 영구 저장하지 않음
- **명단 추가**: 한 줄에 한 명씩 `학번 이름` 또는 `이름 학번`을 띄어쓰기로 구분해 입력함
  - 학번은 필수이며, 같은 학번은 같은 사람으로 보고 한 번만 등록함. 학번이 다르면 같은 이름도 동명이인으로 추가함
  - 형식이 맞지 않는 줄이 있으면 추가할 수 없고 다시 입력하도록 안내함
  - 이미 명단에 있는 이름은 추가 전에 인원수와 이름을 먼저 보여 줌
- 명단과 오늘의 입장자는 가나다순으로 정렬하며, 명단은 이름이나 학번으로 실시간 검색함
- 명단 한 자리 삭제, 오늘의 입장자 한 명 삭제, 명단과 입장자 전체 초기화(확인 문구 입력 후 확인 창)를 지원함
- 학번은 관리자 화면에서만 보이며 사용자 화면과 공개 API 응답에는 포함되지 않음

## 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 언어 | TypeScript | 상태 조합(`planned`, `location`)을 타입으로 제한하고, 서버 응답 형태도 같은 타입으로 맞추기 위함 |
| UI | React | 서비스 규모만 보면 바닐라 JS로도 가능했음. 화면을 컴포넌트로 나누면 관리와 가독성이 좋고, 사용자 화면과 관리자 화면이 컴포넌트와 타입을 공유하기 쉬운 구조가 유리하다고 판단함. 평소 가장 익숙한 스택이라 개발 속도도 고려함 |
| 빌드 | Vite | 설정이 적고 개발 서버가 빠름 |
| 테스트 | Vitest | Vite와 설정을 공유함. 상태 규칙, KST 날짜 계산, 로컬 저장 만료, 명단 입력 형식, 서버 응답 변환을 단위 테스트함 |
| 스타일 | 전역 CSS | 코르크, 종이, 마스킹테이프 같은 질감 표현이 중심이라 UI 라이브러리를 쓰지 않음 |
| 백엔드 | Supabase (Postgres + RPC) | 서버를 직접 운영하지 않고 무료로 DB를 쓰기 위함. 로그인이 없고 "명단 자리 수 초과 입장 방지"가 핵심이라 제약조건과 트랜잭션이 강한 Postgres가 적합함 |
| 갱신 | 10초 폴링 | 실시간성이 중요하지 않고 WebSocket보다 구현과 오류 복구가 단순함 |
| 에셋 | WebP, woff2 | 이미지 약 11MB와 폰트 643KB를 변환해 배포 크기를 약 12.5MB에서 2.3MB로 줄임. 원본은 `assets-src/`에 보관함 |
| 배포 | Vercel | 정적 사이트라 무료 호스팅으로 충분하고, GitHub 연결만으로 자동 배포됨 |
| 개발 환경 | VS Code | 프론트와 `supabase/`의 SQL 파일을 한 저장소에서 같이 편집함. 백엔드는 별도 서버 코드가 없고 SQL Editor에서 실행하는 SQL로 관리함 |

## 폴더 구조

```text
src/
  app/        진입점과 경로 분기 (`/`, `/admin`)
  pages/      사용자 화면과 관리자 화면
  features/   입장, 현황판, 관리자 기능과 전용 컴포넌트
  domain/     상태 규칙, KST 날짜, 명단 입력 해석 등 화면과 무관한 로직
  data/       Supabase RPC 호출과 응답 변환 (Repository 계층)
  hooks/      화면 상태와 데이터 접근을 잇는 훅
  storage/    브라우저 저장소 (오늘의 입장 정보, 관리자 세션)
supabase/     schema.sql, functions.sql, seed-admin.sql.example
scripts/      RPC 검증 스크립트, 에셋 변환 스크립트
assets-src/   변환 전 원본 이미지와 참고 시트
font-proto/   마커 폰트 제작 스크립트와 원본 TTF
docs/         기획 문서와 구현 기록
public/       배포되는 WebP 이미지와 woff2 폰트
```

## 문서

- [제품 기획](./docs/기획.md)
- [프론트엔드 1단계 구현 기록](./docs/프론트엔드-1단계.md): 프로토타입을 React로 옮기던 시점의 기록으로, 이후 Supabase 연동 전의 구조를 설명함

## 로컬 실행

```bash
npm install
cp .env.example .env
npm run dev
```

`.env`에 Supabase 프로젝트 URL과 Publishable key를 채움. Secret key는 넣지 않음

| 변수 | 값 |
|---|---|
| `VITE_SUPABASE_URL` | 프로젝트 URL (`https://xxxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_...`) |

타입 검사, 단위 테스트, 프로덕션 빌드는 각각 다음 명령으로 확인함

```bash
npm run typecheck
npm test
npm run build
```

## Supabase 설정

1. Supabase 프로젝트를 만들고 SQL Editor에서 `supabase/schema.sql`, `supabase/functions.sql` 순서로 실행함. 두 파일 모두 여러 번 실행해도 안전함
2. `supabase/seed-admin.sql.example`을 `supabase/seed-admin.sql`로 복사해 비밀번호를 채우고 실행함. 이 파일은 git에 올리지 않음

## 배포

Vercel에 GitHub 저장소를 연결해 배포함. 빌드 설정은 Vite 프리셋이 자동으로 잡으며(`npm run build`, 출력 `dist`), `vercel.json`은 `/admin` 직접 접속과 새로고침이 404가 되지 않도록 모든 경로를 `index.html`로 보내는 rewrite만 담음

1. [vercel.com](https://vercel.com)에서 GitHub 계정으로 로그인함
2. **Add New → Project**에서 `p1001q/OBT` 저장소를 **Import**함
3. **Framework Preset**이 `Vite`, **Build Command**가 `npm run build`, **Output Directory**가 `dist`인지 확인함
4. **Environment Variables**에 아래 두 값을 추가함. Secret key는 넣지 않음

   | 변수 | 값 |
   |---|---|
   | `VITE_SUPABASE_URL` | 프로젝트 URL (`https://xxxx.supabase.co`) |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_...`) |

5. **Deploy**를 누름. 이후 `develop`을 포함한 브랜치 푸시마다 미리보기 배포가 생기고, Production Branch로 지정한 브랜치에 푸시하면 운영 배포가 갱신됨
6. 환경변수는 빌드 시점에 코드에 삽입되므로 값을 바꾸면 **Deployments**에서 **Redeploy**해야 반영됨

배포 후 확인 항목

- `/`에서 이름 입력 후 입장하고 현황판이 표시됨
- `/admin`을 주소창으로 직접 열거나 새로고침해도 404 없이 로그인 화면이 나옴
- 관리자 로그인 후 명단 조회와 추가가 동작함
- 브라우저 개발자 도구 Network 탭에서 Supabase 요청이 성공하고, 요청 헤더나 번들에 Secret key가 없음
- 이미지와 폰트가 정상 로딩됨

## 라이선스

라이선스는 추후 결정함
