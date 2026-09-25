import type {
  BirthInput,
  Chart,
  Chapter,
  Element,
} from "../../../types/reading";

// Editorial templates, not an AI or clinically validated assessment.
// Keep these separate so a reviewed server-side generator can replace them later.
const themes: Record<
  Element,
  { image: string; theme: string; question: string; practice: string }
> = {
  목: {
    image: "자라는 나무",
    theme: "관계를 함께 키워가는 과정",
    question:
      "나는 상대와 함께 시도해보고 싶은 일을 구체적으로 이야기하고 있나요?",
    practice:
      "함께 해보고 싶은 작은 일을 하나 제안해보세요. 나의 계획과 상대의 속도가 같은지도 물어보세요.",
  },
  화: {
    image: "빛을 나누는 불",
    theme: "마음을 표현하고 반응을 주고받는 순간",
    question: "내가 표현한 마음과 상대가 편안하게 받아들이는 방식은 같을까요?",
    practice:
      "최근 고마웠던 행동 하나를 구체적으로 말해보세요. 큰 표현보다 상대에게 편안한 표현이 무엇인지 들어보세요.",
  },
  토: {
    image: "받쳐주는 땅",
    theme: "신뢰와 일상의 안정감을 만드는 과정",
    question: "관계를 지키려는 마음 때문에 나의 필요를 미루고 있지는 않나요?",
    practice:
      "서로 편안하게 지킬 수 있는 작은 약속을 하나 정해보세요. 자신이 원하는 것도 함께 말해보세요.",
  },
  금: {
    image: "다듬어진 금속",
    theme: "관계의 기준과 서로 존중할 경계",
    question: "내가 중요하게 생각하는 기준을 상대도 알고 있나요?",
    practice:
      "나에게 중요한 기준 하나와 유연하게 조정할 수 있는 부분 하나를 나눠서 적어보세요.",
  },
  수: {
    image: "흐르는 물",
    theme: "상대의 이야기를 듣고 생각을 정리하는 시간",
    question: "충분히 생각하는 시간과 마음을 전할 시간을 어떻게 나누고 있나요?",
    practice:
      "혼자 정리할 시간이 필요하다면 언제 다시 이야기할 수 있는지도 함께 알려주세요.",
  },
};

export function createReport(
  input: BirthInput,
  chart: Chart,
): { intro: Chapter; comparison: Chapter; chapters: Chapter[] } {
  const theme = themes[chart.dayElement];
  const mbti = input.mbti;
  const energy =
    mbti?.[0] === "E"
      ? "다른 사람과 교류하며 생각을 풀어가는 선호"
      : "혼자 돌아보며 생각을 정리하는 선호";
  const decision =
    mbti?.[2] === "F"
      ? "관계와 가치에 무게를 두고 판단하는 관점"
      : "일관성과 논리에 무게를 두고 판단하는 관점";
  const structure =
    mbti?.[3] === "J"
      ? "미리 일정을 조율하는 방법"
      : "선택의 여지를 남겨두는 방법";
  const perception =
    mbti?.[1] === "N"
      ? "가능성과 연결점을 살피는 관점"
      : "구체적인 경험과 사실을 살피는 관점";
  return {
    intro: {
      title: `${chart.pillars.day.korean}일주, ${theme.image}의 이미지`,
      body: `입력한 날짜의 일주는 ${chart.pillars.day.hanja}(${chart.pillars.day.korean})이고, 일간의 오행은 ${chart.dayElement}입니다. 전통 명리의 상징에서 ${chart.dayElement}은 '${theme.image}'에 비유됩니다.\n\n이 비유를 ${theme.theme}에 관한 질문으로 읽어볼 수 있어요. 이것은 오행 하나로 성격을 확정하는 진단이 아니라, 계산된 일간을 출발점으로 삼는 자기성찰용 해설 초안입니다.`,
      question: theme.question,
    },
    comparison: mbti
      ? {
          title: `${mbti}와 ${chart.pillars.day.korean}일주를 나란히 읽으면`,
          body: `선택하신 ${mbti}는 ${energy}, ${perception}, ${decision}, ${structure}이라는 설명으로 살펴볼 수 있습니다.\n\n사주 쪽에서는 '${theme.image}'라는 상징을 읽었어요. 두 설명이 같은 사람을 같은 방식으로 측정하는 것은 아닙니다. 실제 경험에서 닮은 점과 다른 점을 찾아보세요. 두 결과를 합산한 성격 점수는 만들지 않습니다.`,
          question:
            "두 설명 중 가까운 관계에서의 나와 더 닮은 쪽은 무엇인가요?",
        }
      : {
          title: "유형을 몰라도, 나의 이야기는 계속됩니다",
          body: `성격 유형을 선택하지 않아 유형 비교는 생략했어요. ${chart.pillars.day.korean}일주의 '${theme.image}'라는 상징과 자신의 실제 경험을 비교하며 읽어보세요. 생년월일에서 MBTI를 추측하거나 새 유형을 부여하지 않습니다.`,
          question: "최근의 관계에서 나답다고 느꼈던 순간은 언제였나요?",
        },
    chapters: [
      {
        title: "가까워지는 나만의 속도",
        body: `${theme.theme}을 떠올려보세요. 관계가 편안했던 순간에는 어떤 행동과 약속이 있었나요? '${theme.image}'라는 비유가 내 경험에 맞는 부분만 골라 읽어도 괜찮습니다.\n\n${mbti ? `${mbti}의 설명 중 ${energy}가 자신에게 맞는다면, 그 시간을 관계 안에서도 존중받을 방법을 이야기해보세요.` : "유형을 정하기보다 만남 전후에 내가 어떻게 쉬고 싶은지부터 관찰해보세요."}`,
        question:
          "나는 연락의 빈도, 만나는 시간, 혼자 있는 시간 중 무엇을 먼저 조율하고 싶나요?",
      },
      {
        title: "마음을 전하는 방법",
        body: `${mbti ? `선택한 유형의 ${decision}을 참고해보세요. ` : ""}대화에서는 해결책을 원하는지, 우선 들어주기를 원하는지 서로 확인하는 것이 도움이 될 수 있어요.\n\n“지금은 내 이야기를 먼저 들어줬으면 해” 또는 “같이 방법을 찾아보고 싶어”처럼 필요한 것을 직접 말하는 문장을 연습해보세요. 상대의 생각은 유형이나 사주로 단정하지 않고 직접 물어봅니다.`,
        question:
          mbti?.[2] === "F"
            ? "공감받고 싶은 마음과 내가 바라는 구체적인 행동을 각각 한 문장으로 말할 수 있나요?"
            : "해결책을 제안하기 전에 상대가 어떤 도움을 원하는지 물어본 적 있나요?",
      },
      {
        title: "관계를 위한 작은 실천",
        body: `첫째, ${theme.practice}\n\n둘째, ${mbti ? `${structure}이 나에게 편한지 확인하고` : "약속을 정하는 방식에 대한 내 선호를 돌아보고"}, 상대의 선호도 물어보세요.\n\n셋째, 일주일 뒤 편했던 순간과 어려웠던 순간을 하나씩 적어보세요. 사주 해석이나 유형 설명보다 자신의 실제 경험을 기준으로 다음 행동을 선택하세요.`,
        question:
          "이번 주에 시도할 수 있는 가장 작은 행동 한 가지는 무엇인가요?",
      },
    ],
  };
}
