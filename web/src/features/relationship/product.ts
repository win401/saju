// Change product copy, preview price, and narrator independently of the UI.
export const product = {
  brand: "결",
  title: "나의 관계를 읽는 사주",
  subtitle: "사주와 내가 아는 성격, 두 시선으로 읽는 나.",
  price: 12900,
  currency: "KRW",
  narrator: { name: "결의 해설자", tagline: "당신의 이야기를 함께 읽습니다." },
  chapters: [
    {
      title: "내 사주의 기본 구성",
      detail: "태어난 날에서 시작하는 이야기",
      free: true,
    },
    {
      title: "사주와 성격 유형, 두 가지 시선",
      detail: "내가 선택한 유형과 나란히 읽기",
      free: true,
    },
    {
      title: "가까워지는 나만의 속도",
      detail: "만남과 연락의 속도를 조율하는 질문",
      free: false,
    },
    {
      title: "마음을 전하는 방법",
      detail: "내 표현 선호와 바로 써볼 대화 문장",
      free: false,
    },
    {
      title: "다를 때 지키는 기준",
      detail: "엇갈린 순간에 확인할 기준과 경계",
      free: false,
    },
    {
      title: "이번 주의 관계 실험",
      detail: "이번 주에 해볼 한 문장과 돌아볼 기록",
      free: false,
    },
  ],
} as const;
export const formatPrice = (amount: number) =>
  `${amount.toLocaleString("ko-KR")}원`;
