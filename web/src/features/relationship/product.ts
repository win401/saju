// Change product copy, preview price, and narrator independently of the UI.
export const product = {
  brand: "결",
  title: "나의 관계를 읽는 사주",
  subtitle: "사주와 내가 아는 성격, 두 시선으로 읽는 나.",
  price: 12900,
  currency: "KRW",
  narrator: { name: "여울", tagline: "당신의 이야기를 함께 읽습니다." },
  chapters: [
    {
      title: "내 사주의 기본 구성",
      detail: "내 일간의 이미지와 가까워진 뒤 드러나는 마음",
      free: true,
    },
    {
      title: "사주와 성격 유형, 두 가지 시선",
      detail: "겉으로 전하는 방식과 속으로 바라는 것",
      free: true,
    },
    {
      title: "가까워지는 나만의 속도",
      detail: "끌리는 순간부터 편안한 사이가 되기까지",
      free: false,
    },
    {
      title: "마음을 전하는 방법",
      detail: "내 진심이 다르게 들리는 이유와 대화 장면",
      free: false,
    },
    {
      title: "좋아하는데 자꾸 어긋나는 순간",
      detail: "합과 충으로 읽는 친밀함, 차이, 화해의 실마리",
      free: false,
    },
    {
      title: "나에게 맞는 사랑의 방식",
      detail: "나를 편하게 하는 관계와 마음이 전해지는 한 문장",
      free: false,
    },
  ],
} as const;
export const formatPrice = (amount: number) =>
  `${amount.toLocaleString("ko-KR")}원`;
