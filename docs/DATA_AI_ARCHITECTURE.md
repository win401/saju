# 이용 데이터·분석·AI 설계 제안

상태: 제안 · 2026-09-25. 현재 코드는 운영용 데이터베이스를 사용하지 않는다. [`report-store.ts`](../web/src/features/relationship/server/report-store.ts)는 출생 입력과 결과를 서버 메모리에 최대 1시간 보관하는 시제품용 구현이다.

## 원칙과 데이터 구분

- 출생일시, 선택한 성별, MBTI, 리포트와 구매 내역을 한곳에 모아 무기한 보관하지 않는다. 출생일시는 사주 계산에 필요하지만, 분석을 위해 별도로 정확한 나이나 생년월일을 받을 필요는 없다.
- **계산용 입력:** 생년월일·출생시간·양력/음력·선택 MBTI·선택 성별. 무료 체험은 짧게 보관하고 자동 삭제한다. 구매 후 재열람에 원본 입력이 꼭 필요한지 검토한다. 결과만으로 충분하다면 원본 입력은 지운다.
- **구매·재열람:** 주문번호, 상품, 금액, 결제 상태, 생성된 리포트와 재열람 인증 정보를 보관한다. 법에 따라 보존할 거래 기록은 리포트·분석 데이터와 분리한다. PG의 카드번호나 인증정보는 우리 DB에 저장하지 않는다.
- **분석 이벤트:** `landing_view`, `input_start`, `preview_complete`, `paywall_view`, `payment_success`, `refund`처럼 단계별 이벤트를 기록한다. 정확한 출생일시·리포트 전문·자유입력 고민을 이벤트나 로그에 넣지 않는다. 연령은 생년월일에서 이벤트 시점의 넓은 연령대로 계산해 집계한다. 무작위 ID라도 다른 정보와 연결해 개인을 식별할 수 있다면 개인정보로 관리한다.
- **추후 추가 데이터:** 얼굴 사진, 건강 관련 자유입력, 상대방 출생정보 등은 V1에 넣지 않는다. 도입 시 별도의 필요성·처리 근거·보관 정책을 검토한다.

출시 전에 처리 목적, 수집 항목, 적법 근거, 보유 기간, 삭제·열람 방법, 위탁·국외 이전 여부를 **실제 구현 기준**으로 정하고 개인정보 처리방침에 공개한다. 이용에 필요한 정보와 선택적인 광고·연구 목적은 구분한다. 계약 이행에 필요한 정보는 동의 외의 법적 근거가 가능하지만, 모든 정보가 자동으로 그 범위에 포함되는 것은 아니다. 목적에 필요한 최소한만 수집하고, 목적 종료나 기간 만료 시 파기한다. 보안은 접근 제한, 암호화, 접속 기록, 백업·삭제 절차까지 설계한다. [개인정보 보호법 제15조](https://law.go.kr/LSW/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=1006184341), [제16조](https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029335669), [제21조](https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029335627), [제29조](https://www.law.go.kr/LSW/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=900079357), [개인정보위 2026 처리방침 안내](https://pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS074&nttId=12021)를 참고한다.

## V1 분석 구성

`Next.js API → PostgreSQL(주문·리포트·이벤트 분리) → 집계 뷰 → 내부 Metabase 대시보드`를 제안한다. Metabase에는 개인정보 원본 테이블 대신 집계 뷰만 읽는 계정을 연결하고 공개 공유를 막는다. 대시보드에는 광고 캠페인별 유입, 입력 완료, 무료 결과 완독, 결제 진입·성공, 환불, 테마별 구매, 넓은 연령대별 차이를 표시한다. [Metabase의 PostgreSQL 연결](https://www.metabase.com/docs/latest/databases/connections/postgresql), [대시보드 문서](https://www.metabase.com/docs/latest/dashboards/introduction).

## AI와 RAG 도입 순서

1. **V1:** 검증 가능한 사주 계산 → 구조화된 원국·MBTI → 검수한 규칙/문안으로 결과 생성. 현재 방향을 유지한다. 사용자 데이터를 따로 학습시키거나 복잡한 에이전트를 운영하지 않는다.
2. **문안 품질이 확인된 뒤:** 서버에서 일반 LLM API로 일부 문장을 다듬거나 개인화한다. 정확한 사주 계산값과 주제별 제약을 입력하고, 출력 구조·금지 표현·실패 시 대체 문안을 검증한다. 원본 출생일시 대신 필요한 계산 결과만 전달하는 방안을 우선 검토한다.
3. **해설 자료가 많아졌을 때:** 검수한 명리 해설·편집 가이드에서 관련 근거를 찾는 RAG를 시험한다. 처음에는 `일간/오행/테마/MBTI` 태그로 문서를 고르는 방식이 더 단순하다. 검색 품질이 부족할 때만 벡터 검색([pgvector](https://github.com/pgvector/pgvector))을 추가한다. 사용자 개인 기록을 통째로 임베딩해 지식베이스로 만들지 않는다. [LangChain의 검색 설명](https://docs.langchain.com/oss/javascript/deepagents/retrieval).
4. **단계가 복잡해졌을 때:** LangChain은 모델·검색 도구 연결의 선택지, LangGraph는 긴 상태 저장·분기·사람 검토가 필요한 워크플로의 선택지다. V1의 단순한 생성 경로에는 둘 다 필수는 아니다. [LangGraph 개요](https://docs.langchain.com/oss/javascript/langgraph/overview).

LLM이나 분석 서비스를 외부 업체에 연결할 때는 입력·출력 보관과 학습 사용 여부, 처리위탁, 국외 이전을 실제 계약·설정별로 확인한다. 고객 정보를 서비스 개선이나 모델 학습에 재사용하는 것은 기존 리포트 제공 목적과 구분해 적법 근거를 검토한다. [개인정보 보호법 제28조의8](https://law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029331979), [개인정보위 2026 처리방침 안내](https://pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS074&nttId=12021).

## 출시 전 결정할 항목

- 무료 체험, 구매 리포트, 주문 기록, 분석 이벤트 각각의 보관 기간과 삭제 흐름
- 구매 후 재열람 방식과 본인 확인 수준
- DB·AI·분석 업체의 실제 처리 위치와 위탁·국외 이전 조건
- 연령대와 성별을 분석 화면에 노출할 범위 및 소수 집단의 재식별 방지 기준
