import type { ReadingTheme } from "@/types/reading";
import { product as relationshipProduct } from "../relationship/product";

const traditionalChapters = [
  {
    title: "내 사주의 기본 구성",
    detail: "일간과 일주로 읽는 타고난 바탕",
    free: true,
  },
  {
    title: "내 사주에 담긴 다섯 기운",
    detail: "오행의 구성과 태어난 계절",
    free: true,
  },
  {
    title: "십성으로 읽는 나의 재능",
    detail: "나와 다른 글자들이 맺는 관계",
    free: false,
  },
  {
    title: "일과 재물을 대하는 방식",
    detail: "능력을 쓰는 환경과 현실을 다루는 태도",
    free: false,
  },
  {
    title: "사람 사이에서 드러나는 나",
    detail: "겉의 태도와 가까운 관계의 모습",
    free: false,
  },
  {
    title: "내 사주를 하나의 이야기로",
    detail: "흩어진 단서를 연결한 종합 해설",
    free: false,
  },
];
const mbtiChapters = [
  {
    title: "내 사주의 기본 구성",
    detail: "출생정보로 계산한 원국",
    free: true,
  },
  {
    title: "사주와 MBTI, 두 가지 시선",
    detail: "내가 아는 나와 전통의 이미지",
    free: true,
  },
  {
    title: "에너지가 향하는 곳",
    detail: "E·I 선호와 나의 표현 방식",
    free: false,
  },
  {
    title: "같은 장면을 읽는 다른 방식",
    detail: "S·N 선호와 관찰의 초점",
    free: false,
  },
  {
    title: "마음과 판단 사이의 기준",
    detail: "T·F 선호와 선택의 언어",
    free: false,
  },
  {
    title: "나만의 리듬으로 살아가기",
    detail: "J·P 선호와 일상의 균형",
    free: false,
  },
];
type ReadingProduct = {
  name: string;
  title: string;
  heroTitle: [string, string];
  subtitle: string;
  intro: string;
  symbol: string;
  fullTitle: string;
  price: number;
  chapters: readonly { title: string; detail: string; free: boolean }[];
};
export const READING_PRODUCTS: Record<ReadingTheme, ReadingProduct> = {
  traditional: {
    name: "정통 사주",
    title: "태어난 여덟 글자, 나의 사주",
    heroTitle: ["태어난 여덟 글자,", "나를 풀어내는 이야기."],
    subtitle: "기질부터 재능, 일과 재물, 사람 사이의 나까지.",
    intro:
      "복잡해 보이는 사주팔자를 하나씩 풀어, 내 삶의 여러 모습을 한 권의 이야기로 읽어요.",
    symbol: "命",
    fullTitle: "내 사주, 더 깊이 읽기",
    price: 12900,
    chapters: traditionalChapters,
  },
  love: {
    name: "연애 사주",
    title: "사랑할 때 드러나는 나",
    heroTitle: ["나는 어떤 순간에", "마음을 내어줄까."],
    subtitle: "끌리는 마음, 표현의 온도, 가까운 사이의 차이.",
    intro:
      "내 사주를 연애의 장면으로 풀어봐요. 설렘이 시작되는 순간부터 가까워진 뒤의 마음까지.",
    symbol: "緣",
    fullTitle: "관계의 결, 조금 더 깊이",
    price: 12900,
    chapters: relationshipProduct.chapters.map((chapter, index) =>
      index === 1
        ? {
            ...chapter,
            title: "겉으로 전하는 마음과 가까운 사이의 나",
            detail: "표현하는 애정과 바라는 애정의 차이",
          }
        : chapter,
    ),
  },
  mbti: {
    name: "사주×MBTI",
    title: "내가 아는 나, 사주가 그리는 나",
    heroTitle: ["내가 아는 나와", "타고난 나 사이."],
    subtitle: "내가 선택한 유형과 사주, 네 가지 주제로 나란히.",
    intro:
      "MBTI를 새로 검사하지 않아요. 알고 있는 유형을 입력하면 사주의 단서와 함께 성향을 비교해 읽습니다.",
    symbol: "我",
    fullTitle: "두 시선으로 읽는 나",
    price: 12900,
    chapters: mbtiChapters,
  },
};
export const formatPrice = (amount: number) =>
  `${amount.toLocaleString("ko-KR")}원`;
