# 공개 무료 체험 배포

기준일: 2026-09-26. 목적은 개발 중인 콘텐츠를 휴대폰에서 직접 읽고 검토하는 것이다. 유료 서비스 출시는 아니다. 기본 리포트는 외부 AI 없이 동작한다. 선택 기능인 AI 연애 상담은 연동 코드를 구현했으며 배포 후 실호출 검증은 대기 중이다. 실제 PG·운영 DB는 연결하지 않았다.

## 배포 대상과 실행 위치

| 항목 | 설정 |
| --- | --- |
| Vercel 프로젝트 | `gyeol-saju` |
| Vercel scope | `401s-projects-3a87049c` |
| Git 저장소 | `win401/saju` |
| Framework | Next.js |
| 프로젝트 Root Directory | `web` |
| CLI 실행 위치 | Git 저장소 루트 `saju` |

Vercel CLI는 `web` 안이 아닌 저장소 루트에서 실행한다. 프로젝트의 Root Directory가 이미 `web`이므로 실행 위치까지 `web`으로 옮겨 이중으로 적용하지 않는다. 프로젝트를 연결할 때는 위 프로젝트와 scope를 확인하고, production 배포에도 같은 연결을 사용한다. 로컬 `.vercel` 연결 정보는 커밋하지 않는다.

저장소 루트의 `.vercelignore`는 환경 파일, 미확정 시안, 로컬 실행 산출물을 CLI 업로드에서 제외한다. 배포 대상 코드와 공개 이미지 자산은 유지한다.

## 환경 변수

| 변수 | 공개 무료 체험 설정 | 의미 |
| --- | --- | --- |
| `SAJU_PUBLIC_DEMO` | production에 `1` | 정확히 `1`일 때만 미리보기·전체 체험을 저장 없는 무료 경로로 처리 |
| `APP_ORIGIN` | 선택 | 명시적으로 허용할 사이트 origin. 별도 도메인 사용 시 지정 |

`APP_ORIGIN`이 없어도 `VERCEL=1`이면 Vercel이 제공하는 `VERCEL_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_BRANCH_URL`의 HTTPS origin을 허용한다. 요청자가 보낸 `Host`나 `X-Forwarded-Host`를 신뢰 목록으로 쓰지 않는다. Vercel 시스템 변수도 없고 개발 모드도 아니라면 브라우저 요청을 위해 명시적 `APP_ORIGIN`이 필요하다.

환경 변수는 빌드와 서버 실행에 적용되도록 배포 전에 설정한다. 변경 후에는 재배포하고 미리보기·전체 체험의 동작을 함께 확인한다. 공개 무료 체험에 API 키·DB 접속 정보·암호화 비밀키는 필요하지 않다.

## 선택 기능: OpenAI 연애 상담 설정

기본 규칙 기반 체험과 `SAJU_AI_ENABLED`는 독립적이다. 아래 설정은 별도 AI 상담에만 적용하며, 미설정 시 기본 리포트가 외부 AI를 호출하지 않는다.

| 변수 | 기본값·요건 | 용도 |
| --- | --- | --- |
| `SAJU_AI_ENABLED` | `0`; 정확히 `1`일 때만 활성화 | AI 호출을 명시적으로 허용 |
| `OPENAI_API_KEY` | 빈 값; 서버 전용 | OpenAI 프로젝트 API 키 |
| `OPENAI_MODEL` | `gpt-6-sol` | Responses API 모델 ID |
| `SAJU_AI_ACCESS_CODE` | production에서 최소 16자 필수 | API 키와 구분되는 비공개 체험 접근 코드 |

로컬 개발은 접근 코드를 생략할 수 있다. 로컬에서도 코드를 설정했다면 최소 16자 조건을 만족해야 한다. production은 플래그·키·유효한 코드가 모두 있어야 사용 가능 상태가 된다. 코드를 모르는 요청은 제공사 호출 전에 차단한다. 앱의 코드·키를 `NEXT_PUBLIC_` 환경 변수나 클라이언트 코드로 옮기지 않는다.

1. [OpenAI API 키 관리 화면](https://platform.openai.com/api-keys)에서 프로젝트용 키를 준비한다. API 호출은 ChatGPT/Codex 구독 한도와 별도 API 사용량으로 관리한다. [공식 시작 안내](https://developers.openai.com/api/docs/quickstart), [API 요금](https://developers.openai.com/api/docs/pricing), [구독·API 키 사용 구분](https://learn.chatgpt.com/docs/pricing) 참고.
2. 로컬은 Git에서 제외된 `web/.env.local`에, 배포는 Vercel 프로젝트의 서버 환경 변수에 직접 넣는다. 키 원문을 채팅이나 문서에 남기지 않는다. production 접근 코드도 별도로 준비한다.
3. 서버 재시작 또는 재배포 후 `GET /api/ai/love`의 사용 가능 여부와 `/readings/love` 결과 화면의 상담 패널을 확인한다. 상태 확인 API는 모델 호출을 하지 않는다. 패널에서 연애 상태·질문·체험 코드를 입력하고 전송 동의를 받아야 상담을 요청한다.
4. 실제 키가 설정된 뒤 가상 입력으로 소수의 요청을 보내 응답 품질·근거·지연시간·실제 사용량을 확인한다. 검증 결과를 기록하기 전에는 정상 실호출이나 품질 검수가 완료됐다고 표시하지 않는다.

현재 로컬 키는 미설정이고 Vercel production에는 사용자가 키를 등록했다. 키 값은 문서에 기록하지 않는다. 기본 모델의 기능은 [GPT-6 Sol 공식 문서](https://developers.openai.com/api/docs/models/gpt-6-sol)를 참고한다. 다른 모델로 바꿀 때는 계정 접근 가능 여부와 구조화 출력·요청 설정을 다시 검증한다.

### 2026-09-26 AI 연결 검증

- 구현 커밋 `90bbc45`, Vercel 배포 `dpl_W6E8yYAKeg5KT8cnYhBwmZgNNTvZ` Ready. 대표 주소는 기존과 같다.
- Production에 `OPENAI_API_KEY`, `SAJU_AI_ENABLED=1`, 별도 무작위 `SAJU_AI_ACCESS_CODE`가 설정됐다. 접근 코드의 소유자용 사본은 커밋에서 제외한 `web/.env.ai-access.local`에 보관한다. API 키와 다른 값이다.
- `/api/ai/love` 상태 조회에서 `available: true`, `requiresAccessCode: true` 확인. 소유자 접근 코드가 없는 요청은 유료 호출 전에 거절된다.
- 타입 검사, 단위 테스트 204개, 기존 E2E 12개, AI UI 모의 E2E 6개, production 빌드 통과. 모의 E2E 결과는 실제 AI 답변 품질 검증이 아니다.
- 실제 배포의 모바일 화면에서 가상 입력으로 상담 요청 **1회** 실행. OpenAI 사용량·크레딧 한도 오류를 앱이 `quota_exceeded` / HTTP 503으로 반환했다. 아직 실제 상담 결과 생성·모델 품질·정상 지연시간은 검증하지 못했다.
- 요청 당시 JS 오류·가로 넘침·앱 세션 쿠키 없음. 반복 호출하지 않고 API 계정의 결제 잔액·조직/프로젝트 사용 한도 확인을 요청했다. [공식 한도 안내](https://developers.openai.com/api/docs/guides/spend-limits)에 따라 원인이 해소된 뒤 다시 검증한다.

### AI로 전달하는 데이터와 제한

`POST /api/ai/love`는 사용자의 명시적 동의 뒤 출생정보·연애 상태·질문을 우리 서버로 받는다. 서버가 원국을 다시 계산해 OpenAI에는 계산된 단서, 편집 해석 예시, 상태와 질문만 보낸다. 원본 생년월일·시간·별명·성별을 별도 필드로 보내지 않는다. 사용자가 자유 질문에 직접 적은 정보는 전송되므로 질문에서 이름·연락처 등 불필요한 식별정보를 빼도록 안내한다.

OpenAI Responses API의 구조화 JSON 출력을 받고 형식·분량·근거 ID를 검증한다. 제한은 45초 타임아웃, SDK 자동 재시도 0회, 최대 출력 6,000토큰이다. 앱은 상담 입력·출력을 DB·리포트 Map·쿠키에 저장하지 않고 SDK 내용 로그도 끈다. `store: false`는 제공사의 모든 보관을 없애는 설정이 아니다. 보안·악용 방지 로그 등의 보관과 Zero Data Retention 조건은 [OpenAI 데이터 처리 안내](https://developers.openai.com/api/docs/guides/your-data)를 따른다.

프로세스별 10분당 8회 시도·동시 2회 제한은 순간 요청을 줄이는 장치다. 서버리스 인스턴스가 늘거나 재시작하면 별도 카운터가 생기므로 전체 서비스의 확정 한도·월 비용 상한이 아니다. 접근 코드는 익명 호출을 막는 시험용 장치이며 코드 공유 후의 남용까지 막지는 못한다. 공개 확대 전에 공유 저장소 기반 요청 제한과 제공사 사용량 관리·인증을 별도로 마련한다.

## 공개 체험의 데이터 흐름

1. 사용자가 출생정보를 입력하면 `POST /api/reports`로 전송한다. 서버가 입력을 검증하고 원국·해설을 계산해 미리보기 2장을 반환한다.
2. 전체 무료 체험 안내를 확인하면 화면에 잡아 둔 같은 입력을 `POST /api/demo/readings`로 한 번 더 전송한다. 서버는 확인 값과 입력을 다시 검증하고 상세 4장을 재계산한다.
3. 결과는 현재 화면의 React 메모리에 표시한다. 새로고침하거나 페이지를 닫으면 입력과 결과 화면이 초기화되며, 재열람하려면 다시 입력해야 한다.

공개 모드는 입력·리포트를 앱 DB, 서버의 리포트 `Map`, 쿠키, localStorage/sessionStorage에 보관하지 않는다. 서버 요청 동안 계산에 사용하는 메모리는 필요하며, 앱에서 요청 본문·원본 입력·리포트를 별도 로그하지 않는다. 계산된 내부 `audit`는 클라이언트에 반환하지 않는다. 각 요청이 독립적이므로 서버리스 인스턴스가 달라져도 이전 요청의 메모리 저장소를 찾을 필요가 없다.

호스팅의 접속·오류 메타데이터와 앱의 출생정보 보관은 구분한다. 이 문서의 ‘저장 없음’은 앱에서 출생정보와 리포트를 지속 보관하지 않는다는 뜻이다. 무료 체험은 결제·구매 권한을 만들지 않으며 상세 콘텐츠도 누구나 같은 절차로 무료 이용할 수 있다.

## 로컬 개발과의 차이

`SAJU_PUBLIC_DEMO`를 끈 로컬 개발은 기존 흐름을 유지한다. 서버 메모리에 세션당 리포트 1개를 최대 1시간 보관하고 임의 세션 쿠키로 소유권을 확인하며, `/api/reports/:id/demo-checkout`에서 0원 모의 주문을 진행한다. 이 기존 주문 경로는 production에서 차단된다.

공개 체험을 끈 production에서는 `/api/demo/readings`도 차단된다. 이 설정만으로 유료 서비스가 완성되는 것은 아니다. 정식 유료 출시 전에는 공개 무료 체험을 끄고 실제 PG 승인·주문 권한 확인·영속 저장·구매자 재열람·삭제 정책을 별도로 구현해야 한다.

## 배포 확인과 기록

2026-09-26 배포 전 검증: 전체 단위 테스트 140개와 배포용 빌드 통과. 저장소 루트의 Vercel 연결 및 프로젝트 Root Directory `web` 설정을 확인했다.

배포가 완료되면 실제 주소를 열어 다음을 확인하고 이 문서에 결과를 기록한다.

- production 대표 주소와 검증 시각, 배포한 Git 커밋
- 메인과 정통 사주·연애 사주·사주×MBTI의 휴대폰 진입
- 각 상품의 입력, 무료 미리보기, 확인 후 상세 4장 읽기
- 새로고침·초기화 때 화면의 입력과 결과가 사라지는 동작
- 공개 API의 `Cache-Control: no-store`, `Set-Cookie` 없음, 미리보기의 상세 장·전체 `audit` 미포함
- 별도 세션이나 이전 요청 없이 같은 입력으로 전체 무료 체험이 가능한 동작
- 외부 Origin과 잘못된 입력·확인하지 않은 요청의 거절
- 실제 카드 정보나 결제 청구가 없다는 표시

### 2026-09-26 배포 결과

- 대표 주소: https://gyeol-saju-two.vercel.app/
- 배포 소스: `60eedea` (`main`), GitHub push로 Vercel production 자동 배포 확인
- 배포 ID: `dpl_2MVPaG3wZrRfmP148TTWj7s5Gg9Z`, 01:29 KST Ready
- 대표 주소는 인증 없는 요청에 HTTP 200. `X-Robots-Tag: noindex, nofollow, noarchive` 확인
- 로컬 단위 140개, 기존 모바일·데스크톱 E2E 12개, production 빌드 통과
- 실제 대표 주소 대상 모바일 Chromium(iPhone 13 화면)·데스크톱 E2E 8개 통과: 세 테마의 입력 → 무료 해설 → 상세 4장 → 초기화, 가로 넘침·JS 오류 없음
- 공개 API의 같은 Origin 요청 성공·외부 Origin 403, 기존 모의 결제 경로 403, 캐릭터 시안 경로 404 확인
- 공개 결과의 쿠키/브라우저 저장소 비저장, preview의 상세 장·audit 미포함, 초기화 시 저장소 삭제 요청이 불필요한 동작 확인
- 정통 사주 모바일 추가 확인: 새로고침 후 별명·생일과 결과 초기화, 390px 화면 가로 넘침 없음. 챕터·화면 캡처로 글자와 레이아웃 확인

원격 E2E 재실행은 `web`에서 다음과 같이 한다. 실제 출생정보 대신 테스트 입력을 사용한다.

```sh
PUBLIC_DEMO_URL=https://gyeol-saju-two.vercel.app npm run test:e2e:public
```

브라우저 자동 검증은 통과했다. 사용자의 실제 휴대폰(iOS Safari/Android Chrome) 사용 확인은 별도로 진행한다.
