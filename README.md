# 결 프로젝트

```text
saju/
├── web/                       Next.js 웹앱과 API, 테스트
│   ├── src/app/               공개 화면과 서버 라우트
│   ├── src/features/relationship/ 현재 관계 리포트 화면·콘텐츠·스타일·서버 생성
│   ├── src/lib/               공통 사주 계산, 입력 검증, HTTP 도구
│   ├── src/styles/            공통 CSS와 디자인 변수
│   ├── src/types/             공통 자료형
│   ├── public/                실제 서비스에 노출할 확정 정적 파일
│   └── tests/                 계산 및 브라우저 흐름 검증
├── design/characters/         확정 전 캐릭터 시안과 비교 페이지
└── archive/static-prototype/  초기 정적 시안 보관본
```

실행 및 개발 안내는 [web/README.md](web/README.md)를 확인하세요. 저장소 루트에서는 `npm --prefix web run dev`로 개발 서버를 켤 수 있습니다. 캐릭터 비교 페이지는 개발 모드에서만 `http://127.0.0.1:4173/character-concepts`로 열립니다.
