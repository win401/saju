# 결 프로젝트

[공개 무료 체험](https://gyeol-saju-two.vercel.app/)에서 휴대폰으로 세 콘텐츠를 테스트할 수 있습니다. 실제 PG 결제는 없습니다. 최신 코드에는 기본 출생정보를 같은 브라우저에 24시간 기억해 세 콘텐츠에서 다시 쓰는 기능이 있으며, 결과는 새로고침하면 초기화됩니다. 이 변경의 배포·검증 상태는 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)에 정리했습니다.

```text
saju/
├── web/                       Next.js 웹앱과 API, 테스트
│   ├── src/app/               공개 화면과 서버 라우트
│   ├── src/features/home/     세 콘텐츠를 고르는 메인
│   ├── src/features/reading/  공용 입력·리더·상품 목차·서버 저장
│   ├── src/features/traditional/ 정통 사주 전용 해석
│   ├── src/features/relationship/ 연애 사주 전용 해석
│   ├── src/features/mbti/      사주×MBTI 전용 비교 해석
│   ├── src/lib/               공통 사주 계산, 입력 검증, HTTP 도구
│   ├── src/styles/            공통 CSS와 디자인 변수
│   ├── src/types/             공통 자료형
│   ├── public/                실제 서비스에 노출할 확정 정적 파일
│   └── tests/                 계산 및 브라우저 흐름 검증
├── design/characters/         확정 전 캐릭터 시안과 비교 페이지
├── docs/                      제품 계획, 할 일, 결정 기록, 조사 메모
└── archive/static-prototype/  초기 정적 시안 보관본
```

제품 방향과 진행 현황은 [docs/README.md](docs/README.md)에서 시작하세요. 실행 및 개발 안내는 [web/README.md](web/README.md)를 확인하세요. 저장소 루트에서는 `npm --prefix web run dev`로 개발 서버를 켤 수 있습니다. 캐릭터 비교 페이지는 개발 모드에서만 `http://127.0.0.1:4173/character-concepts`로 열립니다.
