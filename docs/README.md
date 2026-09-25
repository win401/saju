# 프로젝트 문서

이 폴더는 `결`의 제품 방향과 진행 상황을 기록합니다. 실행 명령, 코드 구조, 계산 정책의 상세 설명은 [`web/README.md`](../web/README.md)를 기준으로 합니다.

| 문서 | 용도 |
| --- | --- |
| [PRODUCT_PLAN.md](PRODUCT_PLAN.md) | 고객, 핵심 경험, 콘텐츠·수익화 구상 |
| [EXPERIENCE_STORYBOARD.md](EXPERIENCE_STORYBOARD.md) | 웹툰형 리포트의 장면 구성과 화면 원칙 |
| [EXPERIENCE_IDEAS.md](EXPERIENCE_IDEAS.md) | 웹툰 외 몰입형 경험 아이디어와 첫 실험안 |
| [ROADMAP.md](ROADMAP.md) | 현재 상태, 우선순위, 할 일과 완료 기준 |
| [DECISIONS.md](DECISIONS.md) | 확정된 결정, 제안, 미결정 사항의 이유 |
| [RESEARCH_NOTES.md](RESEARCH_NOTES.md) | 경쟁 서비스 참고 사항, 지식재산권·사업 준비 확인 항목 |
| [DATA_AI_ARCHITECTURE.md](DATA_AI_ARCHITECTURE.md) | 이용 데이터 보관·분석 대시보드·AI 도입 순서 제안 |
| [INTERPRETATION_ENGINE.md](INTERPRETATION_ENGINE.md) | 관계 해석 엔진의 계산 특징·규칙·근거 표시·고정 검수 사례 |

## 기록 규칙

- `확정`, `제안`, `미결정`을 구분합니다. 대화 중 나온 아이디어를 곧바로 출시 사양으로 취급하지 않습니다.
- 작업을 시작하거나 마치면 `ROADMAP.md`의 체크박스와 날짜를 갱신합니다. 결정이 바뀌면 `DECISIONS.md`에 근거와 함께 남깁니다.
- 경쟁 서비스의 공개 정보와 우리의 추측을 구분하고 출처를 적습니다. 매출·전환율·법적 상태는 독립 검증 없이 확정 사실로 쓰지 않습니다.
- 생년월일 등 민감한 사용자 입력 예시는 문서에 기록하지 않습니다. 테스트에는 가상 데이터를 씁니다.

마지막 정리: 2026-09-26.

## 실험 브랜치

- `main`: 공통 기능과 검증된 변경의 기준 버전
- `prototype/webtoon`: 웹툰 장면형 리포트 시안
- `prototype/interactive`: 상황 카드형 리포트 시안

두 시안은 같은 기준에서 개발하고 직접 사용해 비교한다. 서로 다른 브랜치를 동시에 로컬에서 열어볼 때는 각 브랜치를 별도 작업 폴더(worktree)에 두고 개발 서버 포트를 달리한다. 어떤 시안을 최종 채택할지는 시범 사용 후 결정한다.

- [메인과 세 가지 콘텐츠](CONTENT_ARCHITECTURE.md): 정통 사주 우선순위, 상품별 경로·입력·해석 분리와 현재 한계.
