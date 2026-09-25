import type {
  BirthInput,
  Chart,
  Chapter,
  Element,
  ReadingEvidence,
  RelationshipFocus,
} from "../../../types/reading";
import {
  buildRelationshipPlan,
  RULE_CATALOG,
  RULESET_VERSION,
  type Finding,
} from "./interpretation";

const IMAGES: Record<Element, string> = {
  목: "자라는 나무",
  화: "빛을 나누는 불",
  토: "받쳐주는 땅",
  금: "다듬어진 금속",
  수: "흐르는 물",
};
const CONCERNS: Record<
  RelationshipFocus,
  {
    title: string;
    scene: string;
    action: string;
    phrase: string;
    question: string;
  }
> = {
  distance: {
    title: "가까워지는 속도",
    scene: "다가가고 싶지만 한 발 늦추게 되는 순간",
    action:
      "연락·만남·혼자 있는 시간 중 하나만 골라 내가 편한 간격을 적어보세요. 다음 대화에서 그 간격을 제안하고 상대가 편한 간격도 물어봐요.",
    phrase: "나는 이 정도 속도면 편안해. 너는 어떤 간격이 좋아?",
    question:
      "내가 기다리고 싶은 것과 지금 먼저 제안할 수 있는 것은 각각 무엇인가요?",
  },
  expression: {
    title: "마음을 전하는 말",
    scene: "마음은 있는데 적절한 말이 떠오르지 않는 순간",
    action:
      "미뤄둔 말 하나를 ‘실제로 있었던 일 → 내가 느낀 마음 → 구체적인 부탁’ 세 문장으로 적어보세요. 상대에게 말한 뒤 어떤 부분이 잘 전해졌는지 확인해요.",
    phrase:
      "그 일이 있었을 때 나는 이런 마음이었어. 다음에는 이렇게 해줄 수 있을까?",
    question:
      "상대가 알아주길 기다리는 마음 중 직접 말할 수 있는 한 문장은 무엇인가요?",
  },
  boundary: {
    title: "나를 지키는 기준",
    scene: "상대에게 맞추다가 내 마음을 놓치는 순간",
    action:
      "최근 부담을 느낀 부탁 하나를 골라 ‘할 수 있는 범위’와 ‘어려운 범위’를 나눠 적어보세요. 거절의 이유를 길게 증명하기보다 가능한 대안을 한 가지 말해봐요.",
    phrase: "그 부분은 지금 어렵지만, 여기까지는 함께할 수 있어.",
    question: "관계를 이어가면서도 내가 지키고 싶은 한 가지는 무엇인가요?",
  },
};

function mbtiPreferences(mbti: string | null) {
  if (!mbti) return null;
  return {
    energy:
      mbti[0] === "E"
        ? "대화하면서 생각을 정리하는 편인지"
        : "혼자 돌아본 뒤 이야기하는 편인지",
    perception:
      mbti[1] === "N"
        ? "말 뒤의 의미와 가능성을 먼저 보는 편인지"
        : "실제로 있었던 구체적인 일을 먼저 보는 편인지",
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

export function createReport(input: BirthInput, chart: Chart) {
  const plan = buildRelationshipPlan(chart);
  const { facts, pace, expression, boundary } = plan;
  const concern = input.focus ? CONCERNS[input.focus] : null;
  const preference = mbtiPreferences(input.mbti);
  const mbtiEvidence: ReadingEvidence[] = input.mbti
    ? [
        {
          kind: "mbti",
          label: "직접 선택한 성격 유형",
          detail: `${input.mbti}를 사용자가 입력했어요. 출생정보로 유형을 추정하거나 사주와 합산한 점수를 만들지 않았어요.`,
        },
      ]
    : [];
  const focusEvidence: ReadingEvidence[] = concern
    ? [
        {
          kind: "focus",
          label: "이번 이야기의 관심 장면",
          detail: `사용자가 ‘${concern.title}’을 선택했어요. 사주에서 알아낸 고민이 아니라 직접 고른 관심사예요.`,
        },
      ]
    : [];
  const dayEvidence: ReadingEvidence = {
    kind: "chart",
    label: "나를 읽는 기준: 일간",
    detail: `일주 ${chart.pillars.day.hanja}(${chart.pillars.day.korean}), 일간 ${facts.dayMaster.hanja}(${facts.dayMaster.korean})는 ${facts.dayMaster.polarity}·${facts.dayMaster.element}입니다.`,
  };
  const scope = facts.missingPillars.length
    ? "확인되지 않은 기둥은 이번 해설에서 제외했어요. "
    : "";
  const scene = concern
    ? `이번에는 ‘${concern.scene}’을 떠올리며 읽어봐요.`
    : "최근 관계에서 기억에 남는 장면 하나를 떠올리며 읽어봐요.";

  const intro: Chapter = {
    title: `${chart.pillars.day.korean}일주, ${IMAGES[chart.dayElement]}의 이미지`,
    body: `일간 ${facts.dayMaster.hanja}(${facts.dayMaster.korean})는 ${facts.dayMaster.polarity}의 ${chart.dayElement}이고, 일주는 ${chart.pillars.day.hanja}(${chart.pillars.day.korean})예요. ‘${IMAGES[chart.dayElement]}’라는 첫 이미지에 다른 글자들의 관계를 함께 놓아볼게요.\n\n이번 구성에서는 ‘${pace.title}’과 ‘${expression.title}’을 나란히 읽습니다. ${scene}\n\n${scope}먼저 스스로 확인할 질문은 ‘마음이 가까워지는 때와 내 마음을 표현하기 편한 때가 같은가?’예요. 실제로 편안했던 대화 하나와 어려웠던 대화 하나를 비교해보세요. 그 차이를 기억해두면 다음 장을 자신의 경험에 비춰 읽을 수 있어요.`,
    question:
      concern?.question ??
      "최근 편안했던 관계의 장면과 불편했던 장면에서 내 선택은 어떻게 달랐나요?",
    evidence: [
      dayEvidence,
      pace.evidence[0],
      ...expression.evidence,
      ...focusEvidence,
    ],
  };

  const comparison: Chapter = preference
    ? {
        title: `${input.mbti}와 ${chart.pillars.day.korean}일주를 나란히 읽으면`,
        body: `사주에서는 이번 구성을 ‘${expression.title}’이라는 질문으로 읽었어요. 서로 다른 단서를 한 가지 성격으로 묶기보다, 상황에 따라 어느 쪽을 더 의식하는지 살펴보는 출발점이에요.\n\n직접 선택한 ${input.mbti}에서는 ${preference.energy}, ${preference.perception}를 먼저 확인해볼 수 있어요. 또 ${preference.decision}, ${preference.structure}도 별도의 선호로 살펴봐요.\n\n사주의 해석과 유형 설명이 닮았다면 같은 행동을 말하는지 확인하고, 다르다면 상황에 따라 달라지는 내 모습을 찾아봐요. 두 설명을 더해 새로운 성격 점수나 정답을 만들지는 않아요.`,
        question:
          "같은 사람을 대할 때도 편안한 날과 긴장한 날의 표현 방식은 어떻게 달라지나요?",
        evidence: [...expression.evidence, ...mbtiEvidence],
      }
    : {
        title: "유형을 몰라도, 나의 이야기는 계속됩니다",
        body: `유형을 선택하지 않아 유형 비교는 생략했어요. 이번 사주에서 고른 질문은 ‘${expression.title}’이에요. 내가 말을 꺼내기 편했던 순간과 상대의 반응을 기다렸던 순간을 하나씩 떠올려봐요. 같은 관계에서도 상황에 따라 내 선택이 달라졌는지 비교할 수 있어요.\n\n이 질문과 최근 내 행동을 나란히 놓아보세요. 닮은 부분뿐 아니라 달랐던 부분도 기록하면 실제로 나에게 필요한 질문이 더 분명해져요. 생년월일로 유형을 추측하지 않습니다.`,
        question:
          "이 장면에서 내가 실제로 한 행동과 설명이 다른 부분은 무엇인가요?",
        evidence: expression.evidence,
      };

  const experimentSource =
    input.focus === "expression"
      ? expression
      : input.focus === "boundary"
        ? boundary
        : pace;
  const chapters: Chapter[] = [
    {
      title: "가까워지는 나만의 속도",
      body: `${pace.body}\n\n${preference ? `선택한 유형을 참고한다면 ${preference.energy}, ${preference.structure}를 따로 살펴봐요. 마음의 크기와 편한 연락 간격이 꼭 같지는 않을 수 있어요.` : "상대를 만나기 전과 후에 혼자 쉬고 싶은 시간이 얼마나 다른지 돌아봐요. 나와 상대에게 편한 간격이 같은지는 직접 확인해야 해요."}${input.focus === "distance" ? `\n\n${scene} 한 발 늦추고 싶은 이유가 더 알아볼 시간이 필요해서인지, 내 일정에 여유가 없어서인지 나눠봐요.` : ""}`,
      question:
        "연락의 빈도, 만나는 시간, 혼자 쉬는 시간 중 하나만 조율한다면 무엇부터 말하고 싶나요?",
      evidence: [
        ...pace.evidence,
        ...mbtiEvidence,
        ...(input.focus === "distance" ? focusEvidence : []),
      ],
    },
    {
      title: "마음을 전하는 방법",
      body: `${expression.body}\n\n${preference ? `대화가 어긋났을 때는 ${preference.perception}, ${preference.decision}를 나눠 살펴봐요. 내가 원하는 도움을 상대도 같은 것으로 이해했는지가 이번 대화의 확인점이에요.` : "대화가 어긋났을 때는 서로 기억하는 사실, 느낀 감정, 원하는 도움을 나눠 말해봐요. 같은 장면을 다르게 기억할 수도 있으니 결론보다 각자의 설명을 먼저 들어봐요."}\n\n이렇게 말을 시작해볼 수 있어요. “${expression.phrase}”${input.focus === "expression" ? `\n\n${scene} 모두 설명하려고 기다리기보다, 지금 전하고 싶은 마음 하나만 골라도 괜찮아요.` : ""}`,
      question:
        input.mbti?.[2] === "F"
          ? "내가 느낀 감정과 상대에게 바라는 행동을 각각 한 문장으로 말할 수 있나요?"
          : input.mbti?.[2] === "T"
            ? "해결책을 이야기하기 전에 서로 어떤 마음이었는지도 물어볼 수 있나요?"
            : "내가 듣고 싶은 말과 상대에게 전하고 싶은 요청을 각각 한 문장으로 말할 수 있나요?",
      evidence: [
        ...expression.evidence,
        ...mbtiEvidence,
        ...(input.focus === "expression" ? focusEvidence : []),
      ],
    },
    {
      title: "다를 때 지키는 기준",
      body: `${boundary.body}\n\n불편했던 대화를 하나 고르고 ‘실제로 있었던 행동 → 내가 기대했던 것 → 다음에 바라는 것’으로 나눠 적어봐요. 상대의 속마음은 이 입력으로 알 수 없으니, 짐작한 의도와 확인한 사실도 나눠두세요.${input.focus === "boundary" ? `\n\n${scene} 관계를 계속하고 싶은 마음과 어려운 부탁을 거절하는 마음이 동시에 있어도 괜찮아요.` : ""}`,
      question:
        "이 관계에서 함께 정하고 싶은 약속 하나와 각자 선택해도 되는 것 하나는 무엇인가요?",
      evidence: [
        ...boundary.evidence,
        ...(input.focus === "boundary" ? focusEvidence : []),
      ],
    },
    {
      title: "이번 주의 관계 실험",
      body: `앞에서 읽은 ‘${experimentSource.title}’을 이번 주의 작은 행동으로 옮겨봐요.${concern ? ` 직접 고른 ‘${concern.title}’ 장면에서 시작합니다.` : " 지금 떠오르는 장면에 맞지 않으면 더 가까운 상황으로 바꿔도 괜찮아요."}\n\n${concern?.action ?? experimentSource.action}\n\n시작할 때 쓸 한 문장: “${concern?.phrase ?? experimentSource.phrase}”\n\n대화 뒤에는 예상한 반응, 실제로 들은 말, 다음에 바꾸고 싶은 점을 하나씩 기록해봐요. 설명과 내 경험이 다르면 그 차이를 다음 선택의 단서로 삼아요.`,
      question:
        concern?.question ?? "언제, 누구에게, 어떤 한 문장을 먼저 건네볼까요?",
      evidence: [...experimentSource.evidence, ...focusEvidence],
    },
  ];

  const record = (finding: Finding, section: string) => ({
    id: finding.ruleId,
    section,
    condition: `${RULE_CATALOG[finding.ruleId]} — ${finding.condition}`,
    evidence: finding.evidence,
  });
  const focusRecord = (section: string) =>
    concern
      ? [
          {
            id: "context.focus",
            section,
            condition: `${RULE_CATALOG["context.focus"]} — ${input.focus}: ${concern.title}`,
            evidence: focusEvidence,
          },
        ]
      : [];
  const mbtiRecord = (section: string, axes: string) =>
    preference
      ? [
          {
            id: "context.mbti",
            section,
            condition: `${input.mbti}의 ${axes} 선호; 사주 사실과 독립된 자기보고 입력`,
            evidence: mbtiEvidence,
          },
        ]
      : [];
  const contextId = concern ? "context.focus" : "context.default";
  return {
    intro,
    comparison,
    chapters,
    // Stored on the server for reproducibility and future reviewed narrative input.
    // The preview route deliberately returns only the two public chapters.
    audit: {
      version: RULESET_VERSION,
      status: "editorial-draft" as const,
      facts,
      rules: [
        {
          id: "intro.day",
          section: "intro",
          condition: RULE_CATALOG["intro.day"],
          evidence: [dayEvidence],
        },
        record(pace, "intro"),
        record(expression, "intro"),
        ...focusRecord("intro"),
        record(expression, "comparison"),
        {
          id: preference ? "comparison.mbti" : "comparison.no-mbti",
          section: "comparison",
          condition: preference ? `사용자가 ${input.mbti} 입력` : "MBTI 미입력",
          evidence: preference ? mbtiEvidence : expression.evidence,
        },
        record(pace, "pace"),
        ...mbtiRecord("pace", "E/I·J/P"),
        ...(input.focus === "distance" ? focusRecord("pace") : []),
        record(expression, "expression"),
        ...mbtiRecord("expression", "S/N·T/F"),
        ...(input.focus === "expression" ? focusRecord("expression") : []),
        record(boundary, "boundary"),
        ...(input.focus === "boundary" ? focusRecord("boundary") : []),
        record(experimentSource, "experiment"),
        {
          id: contextId,
          section: "experiment",
          condition: `${RULE_CATALOG[contextId]} — ${concern?.title ?? experimentSource.title}`,
          evidence: concern ? focusEvidence : experimentSource.evidence,
        },
      ],
    },
  };
}
