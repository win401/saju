import type {
  BirthInput,
  Chart,
  Chapter,
  Element,
} from "../../../types/reading";

// Editorial prompts for reflection, not personality or relationship predictions.
// The day element supplies a metaphor; the user's lived experience remains the test.
type RelationshipLens = {
  image: string;
  theme: string;
  scene: string;
  pace: string;
  expression: string;
  friction: string;
  repair: string;
  phrase: string;
  experiment: string;
  openingQuestion: string;
};

const lenses: Record<Element, RelationshipLens> = {
  목: {
    image: "자라는 나무",
    theme: "함께 자라는 관계",
    scene: "함께 해보고 싶은 일을 떠올렸을 때, 상대에게 먼저 제안하는 장면",
    pace: "새로운 계획이 반가워도 두 사람이 같은 속도로 움직이는지는 따로 확인해야 해요.",
    expression:
      "하고 싶은 일을 말할 때는 그 계획이 나에게 왜 소중한지도 덧붙여보세요.",
    friction:
      "계획이 미뤄졌을 때 관심이 식었다고 느꼈는지, 단지 일정이 달랐는지 구분해보세요.",
    repair: "다음에 함께할 수 있는 작은 일 하나를 다시 정해보세요.",
    phrase: "나는 같이 해보고 싶은 게 있어. 너는 어떤 속도가 편해?",
    experiment: "함께할 일을 하나 제안하고, 상대가 원하는 시점도 들어보세요.",
    openingQuestion: "내가 원하는 변화와 상대가 편안한 속도는 얼마나 다른가요?",
  },
  화: {
    image: "빛을 나누는 불",
    theme: "표현을 주고받는 관계",
    scene: "반가운 마음을 표현했는데 상대의 반응이 예상보다 조용했던 장면",
    pace: "표현의 크기와 관계의 깊이를 같은 것으로 보지 않아도 돼요.",
    expression:
      "내가 건넨 말보다 상대가 편안하게 받는 방식이 무엇인지 물어볼 수 있어요.",
    friction:
      "반응이 늦거나 작을 때 마음이 없는 것으로 단정하기 전에 상황을 확인해보세요.",
    repair: "서로 고마움을 느꼈던 행동을 하나씩 짚어보세요.",
    phrase: "나는 이렇게 표현할 때 마음이 전해진다고 느껴. 너는 어때?",
    experiment:
      "최근 고마웠던 행동 하나를 구체적으로 말하고, 상대의 표현 방식도 물어보세요.",
    openingQuestion: "내가 표현한 마음과 상대가 받아들인 마음은 같았을까요?",
  },
  토: {
    image: "받쳐주는 땅",
    theme: "안정감을 쌓는 관계",
    scene: "약속을 지키려 애쓰다가 정작 내 일정은 뒤로 밀린 장면",
    pace: "꾸준함이 편안함을 만들지만, 나의 여유도 관계의 일부예요.",
    expression: "괜찮다고 말하기 전에 실제로 가능한 범위를 먼저 확인해보세요.",
    friction:
      "배려가 반복해서 부담이 된다면 누가 더 잘못했는지보다 약속의 크기를 살펴보세요.",
    repair: "지킬 수 있는 약속과 조정이 필요한 약속을 나눠 말해보세요.",
    phrase: "그 약속은 지키고 싶어. 다만 이 시간은 내게 필요해.",
    experiment:
      "이번 주에 지킬 수 있는 약속 하나와 조정하고 싶은 약속 하나를 적어보세요.",
    openingQuestion: "안정감을 만들면서도 내 시간을 지키고 있나요?",
  },
  금: {
    image: "다듬어진 금속",
    theme: "서로의 기준을 존중하는 관계",
    scene: "서로 다른 기준 때문에 작은 약속 하나가 어긋났던 장면",
    pace: "기준을 분명히 하는 일과 상대의 다른 방식을 듣는 일은 함께할 수 있어요.",
    expression: "내가 중요하게 여기는 기준을 비난이 아닌 설명으로 전해보세요.",
    friction:
      "한 번의 실수와 반복해서 지켜지지 않는 약속을 같은 문제로 묶지 마세요.",
    repair: "꼭 필요한 기준 하나와 조정할 수 있는 기준 하나를 구분해보세요.",
    phrase: "이 약속은 내게 중요해. 서로 지킬 수 있는 방식으로 정해볼까?",
    experiment:
      "중요한 기준 하나를 말하고, 상대에게도 양보하기 어려운 기준을 물어보세요.",
    openingQuestion: "내 기준을 말할 때 상대의 기준도 들을 자리를 남기나요?",
  },
  수: {
    image: "흐르는 물",
    theme: "생각을 나누는 관계",
    scene: "생각을 정리하느라 답을 미뤘는데 상대는 이유를 몰랐던 장면",
    pace: "혼자 생각할 시간이 필요하다면 다시 이야기할 시점도 함께 전할 수 있어요.",
    expression: "마음이 정리되지 않았다는 사실 자체를 짧게 말해도 괜찮아요.",
    friction:
      "침묵이 나에게는 정리의 시간이지만 상대에게는 거리감으로 느껴질 수 있는지 확인해보세요.",
    repair: "지금 답할 수 있는 것과 더 생각할 것을 나눠 이야기해보세요.",
    phrase: "조금 생각할 시간이 필요해. 오늘 저녁에 다시 이야기할게.",
    experiment: "생각할 시간이 필요한 순간에 돌아올 시간을 함께 알려보세요.",
    openingQuestion: "생각할 시간을 지키면서도 마음의 거리를 설명하고 있나요?",
  },
};

function mbtiPreferences(mbti: string | null) {
  if (!mbti) return null;
  return {
    energy:
      mbti[0] === "E"
        ? "대화 속에서 생각이 정리되는 편인지"
        : "혼자 돌아본 뒤 이야기하는 편인지",
    perception:
      mbti[1] === "N"
        ? "말 뒤의 의미와 가능성을 먼저 보는 편인지"
        : "그때 있었던 구체적인 일을 먼저 보는 편인지",
    decision:
      mbti[2] === "F"
        ? "감정에 미친 영향을 먼저 확인하고 싶은지"
        : "문제를 푸는 방법을 먼저 정하고 싶은지",
    structure:
      mbti[3] === "J"
        ? "만날 시간과 약속을 미리 정할 때 편한지"
        : "그때의 여건에 맞춰 선택할 때 편한지",
  };
}

export function createReport(
  input: BirthInput,
  chart: Chart,
): { intro: Chapter; comparison: Chapter; chapters: Chapter[] } {
  const lens = lenses[chart.dayElement];
  const mbti = input.mbti;
  const preference = mbtiPreferences(mbti);

  return {
    intro: {
      title: `${chart.pillars.day.korean}일주, ${lens.image}의 이미지`,
      body: `입력한 날짜의 일주는 ${chart.pillars.day.hanja}(${chart.pillars.day.korean})이고, 일간의 오행은 ${chart.dayElement}입니다. 전통 명리에서 이 오행을 '${lens.image}'에 비유해볼 수 있어요.\n\n오늘은 그 이미지를 ${lens.theme}라는 질문의 출발점으로 삼습니다. 예를 들면 ${lens.scene}을 떠올려보세요. 이런 경험이 없다면 나에게 맞는 다른 장면으로 바꿔 읽어도 좋아요. 오행 하나로 성격이나 연애의 결과를 정할 수는 없습니다.`,
      question: lens.openingQuestion,
    },
    comparison: preference
      ? {
          title: `${mbti}와 ${chart.pillars.day.korean}일주를 나란히 읽으면`,
          body: `사주의 '${lens.image}'는 관계를 돌아보기 위한 상징입니다. 내가 선택한 ${mbti}는 ${preference.energy}, ${preference.perception}, ${preference.decision}, ${preference.structure} 같은 선호를 확인하는 언어로 써볼 수 있어요.\n\n둘을 더해 새로운 성격 점수를 만들지는 않습니다. '${lens.scene}'에서 실제 나는 어떻게 반응했는지 떠올려보세요. 유형의 설명과 다르게 행동했다면 그 경험이 더 중요한 단서예요.`,
          question:
            "이 장면에서 내가 실제로 한 행동은 사주 비유와 MBTI 설명 중 어디에 가깝고, 어디가 달랐나요?",
        }
      : {
          title: "유형을 몰라도, 나의 이야기는 계속됩니다",
          body: `MBTI를 선택하지 않아 유형 비교는 생략했어요. ${chart.pillars.day.korean}일주의 '${lens.image}'라는 비유와 '${lens.scene}'을 나의 실제 경험에 비춰보세요. 생년월일로 MBTI를 추측하거나 새로운 유형을 부여하지 않습니다.`,
          question: "최근 관계에서 나는 실제로 어떤 선택을 했나요?",
        },
    chapters: [
      {
        title: "가까워지는 나만의 속도",
        body: `무료 요약에서 떠올린 장면으로 돌아가볼까요. 나는 언제 마음이 가까워졌고, 상대에게는 선택할 시간이 얼마나 있었나요? ${lens.pace}\n\n${preference ? `선택한 MBTI를 참고한다면, ${preference.energy}와 ${preference.structure}를 각각 확인해볼 수 있어요.` : "유형을 몰라도 괜찮아요. 만나기 전과 후에 혼자 쉴 시간이 얼마나 필요한지, 약속을 얼마나 미리 정하고 싶은지 살펴보세요."} 상대의 선호는 입력 정보로 알 수 없으니 직접 물어보세요.`,
        question:
          "다음 만남에서 연락 간격, 만나는 시간, 혼자 있는 시간 중 무엇을 먼저 조율하고 싶나요?",
      },
      {
        title: "마음을 전하는 방법",
        body: `${lens.expression}\n\n${preference ? `대화가 어긋났다면 ${preference.perception}, ${preference.decision}를 돌아보세요. 유형은 내가 선호할 수 있는 출발점일 뿐, 그날의 실제 필요를 대신하지 않아요.` : "대화가 어긋났다면 서로 기억하는 사실, 그때 느낀 감정, 지금 원하는 도움을 나눠 말해보세요."}\n\n바로 쓸 수 있는 문장: “${lens.phrase}”`,
        question:
          mbti?.[2] === "F"
            ? "내가 느낀 감정과 상대에게 바라는 구체적인 행동을 각각 한 문장으로 말할 수 있나요?"
            : mbti?.[2] === "T"
              ? "해결책을 이야기하기 전에 서로 어떤 마음이었는지도 물어볼 수 있나요?"
              : "내가 듣고 싶은 말과 상대에게 전하고 싶은 요청을 각각 한 문장으로 말할 수 있나요?",
      },
      {
        title: "다를 때 지키는 기준",
        body: `관계가 불편했던 장면을 떠올려보세요. ${lens.friction}\n\n상대의 속마음이나 미래를 ${mbti ? "사주와 MBTI" : "사주"}로 알아낼 수는 없어요. 확인할 수 있는 것은 실제로 있었던 행동과 두 사람이 나눈 말입니다. ${lens.repair}`,
        question:
          "이 상황에서 내가 꼭 지키고 싶은 것 하나와 조정할 수 있는 것 하나는 무엇인가요?",
      },
      {
        title: "이번 주의 관계 실험",
        body: `이번 주에는 한 번에 모든 것을 바꾸려 하지 말고 행동 하나만 골라보세요. ${lens.experiment}\n\n대화를 나눈 뒤에는 세 가지만 적어보세요. 내가 예상한 반응, 실제로 들은 말, 다음에 다르게 해볼 점. 예상과 실제가 다르면 ${mbti ? "사주 비유나 MBTI 설명" : "사주 비유"}보다 그 경험을 우선하세요.`,
        question: "언제, 누구에게, 어떤 한 문장을 먼저 건네볼까요?",
      },
    ],
  };
}
