import {
  analyzeChart,
  type PillarFact,
  type SajuAnalysis,
  type TenGod,
} from "../../../lib/saju-analysis";
import type { Chart, ReadingEvidence } from "../../../types/reading";

export const RULESET_VERSION = "relationship-0.2.0";

// These are authored reading lenses, not validated personality predictions.
// Conditions use chart facts; prose and selection priorities require editorial review.
export const RULE_CATALOG = {
  "intro.day": "확정된 일간의 음양·오행과 일주를 첫 읽기의 기준으로 사용",
  "pace.month-root": "확정된 월지의 첫 지장간 십성을 속도 질문의 단서로 선택",
  "pace.day-root": "월주 미확정이면 일지의 첫 지장간으로만 속도 질문 구성",
  "expression.pair":
    "일간을 제외한 확인된 천간에 두 십성 계열이 함께 있는 경우",
  "expression.single":
    "두 계열 조합 미선택 시 월간·년간·시간 순으로 확인된 천간 선택",
  "expression.day-root": "다른 천간을 확인할 수 없으면 일지 지장간만 사용",
  "boundary.mixed": "선택한 지지 관계 안에 육합과 충이 함께 확인됨",
  "boundary.clash": "확인된 지지 사이의 육충 쌍을 질문의 단서로 선택",
  "boundary.combination": "확인된 지지 사이의 육합 쌍을 질문의 단서로 선택",
  "boundary.day-root":
    "육합·충을 선택하지 않은 경우 일지 첫 지장간으로 기준 질문 구성",
  "context.focus": "사용자가 직접 선택한 관심 장면으로 질문과 행동 과제 구성",
  "context.default": "관심 장면 미선택 시 월지/일지 단서의 행동 과제 사용",
  "comparison.mbti": "사용자가 입력한 유형의 네 선호를 사주 단서와 별도로 비교",
  "comparison.no-mbti": "유형 미입력 시 사주 단서와 실제 경험만 비교",
  "context.mbti": "사용자가 입력한 유형 중 해당 장의 선호만 문장에 반영",
} as const;

type GodLens = {
  topic: string;
  pace: string;
  expression: string;
  boundary: string;
  action: string;
  phrase: string;
};
const GOD_LENSES: Record<TenGod, GodLens> = {
  비견: {
    topic: "서로의 페이스",
    pace: "친해진 뒤에도 내 방식이 남아 있는 관계를 떠올려봐요. 함께 있는 시간과 각자 보내는 시간 중 어느 쪽이 줄어들 때 불편해지는지 살펴볼 수 있어요.",
    expression:
      "생각이 같기를 기다리기보다 각자의 취향을 먼저 말해보는 장면을 읽어요. 다른 대답이 나와도 관계가 멀어졌다는 뜻으로 바로 연결할 필요는 없어요.",
    boundary:
      "서로에게 같은 선택을 요구하는 순간이 있는지 돌아봐요. 같이 할 일과 각자 결정할 일을 나누면 기준이 더 분명해집니다.",
    action:
      "다음 만남에서 함께 하고 싶은 일 하나와 혼자 하고 싶은 일 하나를 각각 말해보세요.",
    phrase: "나는 이렇게 하고 싶어. 너에게 편한 방식도 듣고 싶어.",
  },
  겁재: {
    topic: "친밀함과 내 몫",
    pace: "금방 가까워질 때 나의 시간과 에너지도 같은 속도로 내어주는지 떠올려봐요. 상대와 나란히 가는 일과 상대의 속도를 그대로 따르는 일을 구분하는 질문이에요.",
    expression:
      "상대의 반응과 내 마음을 비교하느라 원래 전하려던 말이 바뀌는 장면을 살펴봐요. 누가 더 많이 표현했는지보다 지금 내가 원하는 것을 말해볼 수 있어요.",
    boundary:
      "친하다는 이유로 시간이나 비용의 분담을 말하기 어려웠던 적이 있나요? 공평함이 서로에게 어떤 뜻인지 확인해봐요.",
    action:
      "함께 쓰는 시간이나 비용 중 조정하고 싶은 한 가지를 구체적으로 제안해보세요.",
    phrase: "같이하고 싶어. 이번에는 이 정도까지가 나에게 편해.",
  },
  식신: {
    topic: "편안하게 드러내는 마음",
    pace: "큰 이벤트보다 함께 밥을 먹고 안부를 나누는 시간이 편했는지 떠올려봐요. 작은 일상이 쌓이는 속도가 두 사람에게 비슷했는지 살펴보는 장면이에요.",
    expression:
      "마음을 말로 설명한 순간과 작은 행동으로 전한 순간을 나란히 놓아봐요. 내가 자연스럽게 한 행동을 상대도 애정 표현으로 알아들었는지 확인할 수 있어요.",
    boundary:
      "편안함 때문에 불편한 부탁까지 습관적으로 받아주지는 않았는지 돌아봐요. 늘 해오던 일도 새로 조율할 수 있어요.",
    action:
      "최근 고마웠던 일상 속 행동 하나를 짚어 말하고, 내 행동 중 어떤 것이 좋았는지도 물어보세요.",
    phrase: "그때 네가 해준 작은 일이 오래 마음에 남았어.",
  },
  상관: {
    topic: "솔직함의 온도",
    pace: "마음이 움직이면 바로 말하고 싶었던 순간을 떠올려봐요. 내가 준비된 시점과 상대가 들을 여유가 있는 시점이 달랐는지 확인해볼 수 있어요.",
    expression:
      "정확하게 말하려던 의도와 상대에게 들린 말투를 나눠봐요. 솔직한 내용은 유지하면서도 상대가 받아들일 여지를 남기는 표현을 찾아보는 장면이에요.",
    boundary:
      "불편함을 참는 것과 한 번에 모두 쏟는 것 사이에 다른 방법이 있었을까요? 한 번의 대화에서는 조정할 문제 하나만 고를 수 있어요.",
    action:
      "하고 싶은 말을 먼저 적고, 비난처럼 들릴 부분을 구체적인 요청으로 한 번 바꿔보세요.",
    phrase: "내 의도는 이랬어. 너에게는 어떻게 들렸는지 알고 싶어.",
  },
  편재: {
    topic: "함께하는 경험과 여유",
    pace: "함께 해보고 싶은 일이 많아질 때 실제 일정과 여유도 따라오는지 살펴봐요. 즐거운 제안을 하는 일과 모두 해내야 하는 부담은 나눠 생각할 수 있어요.",
    expression:
      "함께할 경험을 제안하는 방식이 나에게는 마음의 표현이었는지 돌아봐요. 상대가 기대하는 것은 새로운 계획인지, 조용히 들어주는 시간인지 물어볼 수 있어요.",
    boundary:
      "좋은 시간을 만들려고 내가 감당할 범위를 넓혔던 적이 있나요? 시간·돈·노력 중 한 가지부터 가능한 범위를 말해봐요.",
    action:
      "함께하고 싶은 활동 하나를 제안하되 시간과 비용의 범위도 함께 정해보세요.",
    phrase: "이걸 같이 해보고 싶어. 우리 둘에게 무리 없는 방식으로 정해볼까?",
  },
  정재: {
    topic: "작은 약속이 만드는 신뢰",
    pace: "관계의 이름보다 지켜지는 연락과 약속에서 안심했던 순간을 떠올려봐요. 꾸준함을 바라는 마음이 구체적으로 어떤 행동을 뜻하는지 짚어볼 수 있어요.",
    expression:
      "묵묵히 해온 일을 상대가 이미 알고 있으리라 생각한 적이 있나요? 행동에 담긴 이유를 한 문장 보태면 내가 건넨 마음을 함께 확인하기 쉬워져요.",
    boundary:
      "한 번 정한 약속을 계속 유지해야 한다고 느끼는지 살펴봐요. 약속을 소중히 여기는 것과 바뀐 사정을 설명하는 일은 함께할 수 있어요.",
    action:
      "서로 중요하게 여기는 작은 약속 하나를 고르고, 지키기 어려울 때 알리는 방법도 정해보세요.",
    phrase: "이 약속이 내게 안심이 돼. 어려운 날에는 먼저 알려줄 수 있을까?",
  },
  편관: {
    topic: "긴장할 때의 거리",
    pace: "관계가 불확실할 때 빨리 답을 얻고 싶어지는지 떠올려봐요. 지금 결정해야 하는 문제와 조금 더 관찰해도 되는 문제를 나눠볼 수 있어요.",
    expression:
      "중요한 대화에서 결론부터 말했던 장면을 살펴봐요. 요청을 분명히 하면서도 상대가 설명할 시간을 남기면 서두른 결론을 다시 확인할 수 있어요.",
    boundary:
      "갈등을 빨리 해결하려다가 내 한계를 지나친 적이 있나요? 대화를 이어갈 수 있는 상태인지 먼저 확인하고 중단 시점도 정해봐요.",
    action:
      "급하게 결론 내리고 싶은 문제 하나를 적고, 지금 확인할 사실과 나중에 정할 일을 나눠보세요.",
    phrase: "이 문제는 중요해. 서두르기 전에 서로 확인한 사실부터 이야기하자.",
  },
  정관: {
    topic: "서로 합의한 기준",
    pace: "관계에서 어느 정도의 약속이 있어야 편안한지 떠올려봐요. 내가 당연하다고 생각한 기준이 상대에게도 같은지 확인하는 질문이에요.",
    expression:
      "예의를 지키려다 내 불편함을 너무 늦게 말한 적이 있는지 살펴봐요. 잘 정리된 말이 아니어도 필요한 부탁을 먼저 꺼낼 수 있어요.",
    boundary:
      "좋은 관계라면 지켜야 한다고 여긴 기준을 적어봐요. 두 사람이 실제로 합의한 것과 혼자 기대했던 것을 나누면 조율할 지점이 보입니다.",
    action:
      "연락·시간·약속 중 당연하게 여겼던 기준 하나를 상대의 생각과 비교해보세요.",
    phrase:
      "나는 이렇게 생각했는데, 우리가 같은 기준을 정한 건지 확인하고 싶어.",
  },
  편인: {
    topic: "혼자 이해하는 시간",
    pace: "마음이 복잡할 때 혼자 정리할 시간이 필요했던 장면을 떠올려봐요. 나에게 필요한 거리와 상대에게 설명해줄 수 있는 거리를 함께 살펴볼 수 있어요.",
    expression:
      "말 뒤의 뜻을 여러 번 생각하다 답을 미뤘던 적이 있나요? 내가 해석한 의도와 상대가 실제로 한 말을 구분해 물어볼 수 있어요.",
    boundary:
      "상대를 이해하려는 생각이 길어질수록 내 감정은 뒤로 밀리지 않았는지 돌아봐요. 이유를 모두 이해해야만 내 한계를 말할 수 있는 것은 아니에요.",
    action:
      "혼자 해석한 말 하나를 골라, 상대의 뜻을 직접 확인하는 짧은 질문으로 바꿔보세요.",
    phrase: "나는 이렇게 이해했어. 네가 전하고 싶었던 뜻도 그랬을까?",
  },
  정인: {
    topic: "받아들이는 마음의 자리",
    pace: "충분히 이해받았다고 느꼈을 때 마음이 열렸던 순간을 떠올려봐요. 조언이 필요했던 때와 그저 들어주길 바랐던 때를 나누는 질문이에요.",
    expression:
      "상대를 위로하려고 한 말이 정작 내가 듣고 싶은 말은 아니었는지 살펴봐요. 내가 필요한 도움을 구체적으로 요청할 수 있어요.",
    boundary:
      "이해하는 역할을 오래 맡을수록 나도 기대고 싶다는 말을 아끼지는 않았나요? 배려를 주는 일과 받는 일 모두 관계의 일부예요.",
    action:
      "지금 필요한 도움이 경청인지 조언인지 먼저 정하고, 상대에게 한 문장으로 요청해보세요.",
    phrase: "지금은 해결책보다 내 이야기를 잠깐 들어주면 좋겠어.",
  },
};

type Family = "self" | "output" | "care" | "standard" | "reflection";
const FAMILY: Record<TenGod, Family> = {
  비견: "self",
  겁재: "self",
  식신: "output",
  상관: "output",
  편재: "care",
  정재: "care",
  편관: "standard",
  정관: "standard",
  편인: "reflection",
  정인: "reflection",
};
const PAIRS: { keys: [Family, Family]; name: string; body: string }[] = [
  {
    keys: ["output", "standard"],
    name: "솔직한 표현과 함께 정한 약속",
    body: "하고 싶은 말을 전하는 일과 관계의 약속을 지키는 일을 함께 읽어요. 불편함을 말하면 관계가 흔들릴까 조심스러웠던 장면이 있다면, 약속을 지키기 위해 필요한 대화였는지도 돌아봐요.",
  },
  {
    keys: ["output", "reflection"],
    name: "말하고 싶은 마음과 이해받고 싶은 마음",
    body: "말을 꺼낼 준비와 상대의 이야기를 받아들일 준비가 동시에 되었는지 살펴봐요. 충분히 이해받기 전에는 표현을 미루게 되는지, 먼저 말한 뒤 이해받기를 기다리는지 비교해볼 수 있어요.",
  },
  {
    keys: ["self", "standard"],
    name: "나의 방식과 둘의 기준",
    body: "내가 편한 방식과 함께 정한 규칙을 나란히 놓아봐요. 양보가 필요한 문제인지, 서로 달라도 되는 취향인지 구분하면 대화의 목표가 달라져요.",
  },
  {
    keys: ["care", "reflection"],
    name: "돌봄을 주는 일과 받는 일",
    body: "상대를 위해 움직이는 순간과 나도 기대고 싶은 순간을 함께 읽어요. 해준 일의 크기와 이해받았다는 느낌은 다를 수 있으니, 어떤 도움이 필요한지 구체적으로 말해봐요.",
  },
  {
    keys: ["self", "output"],
    name: "내 생각과 전해지는 방식",
    body: "내 생각을 분명히 아는 일과 상대에게 잘 전달하는 일을 나눠봐요. 서로 동의하지 않아도 내 말을 이해했는지 먼저 확인하면 같은 설명을 되풀이하는 대화를 줄일 수 있어요.",
  },
  {
    keys: ["care", "standard"],
    name: "해주고 싶은 일과 지킬 수 있는 약속",
    body: "잘해주고 싶은 마음이 커질수록 약속도 커지지는 않았는지 살펴봐요. 마음의 크기를 증명하는 약속보다 실제로 지속할 수 있는 방식을 둘이 정하는 장면을 읽어요.",
  },
  {
    keys: ["output", "care"],
    name: "말로 전하는 마음과 행동으로 전하는 마음",
    body: "내가 건넨 말과 실제로 해준 행동 중 무엇이 상대에게 더 잘 전해졌는지 돌아봐요. 어느 한쪽이 부족하다고 결론 내리기 전에 서로 기억하는 장면을 하나씩 말해볼 수 있어요.",
  },
  {
    keys: ["self", "reflection"],
    name: "혼자 정하는 시간과 함께 이해하는 시간",
    body: "혼자 생각할 권리와 상대에게 설명할 필요를 함께 읽어요. 내 마음을 모두 정리할 때까지 침묵하기보다, 아직 생각 중이라는 사실을 먼저 알려볼 수 있어요.",
  },
  {
    keys: ["self", "care"],
    name: "나의 여유와 상대에게 내어주는 마음",
    body: "상대를 위해 선택한 일이 내게도 편안했는지 살펴봐요. 친밀함을 지키려고 필요한 것까지 미뤘다면, 함께할 수 있는 범위를 다시 제안하는 장면을 떠올려봐요.",
  },
  {
    keys: ["standard", "reflection"],
    name: "필요한 기준과 서로의 사정",
    body: "이해해주고 싶은 마음과 꼭 지키고 싶은 기준이 만나는 장면을 읽어요. 상대의 사정을 듣는 일과 같은 일이 반복되지 않도록 요청하는 일은 함께할 수 있어요.",
  },
];

export type Finding = {
  ruleId: keyof typeof RULE_CATALOG;
  condition: string;
  title: string;
  body: string;
  action: string;
  phrase: string;
  evidence: ReadingEvidence[];
};

function stemEvidence(p: PillarFact, hidden = false): ReadingEvidence {
  const stem = hidden ? p.hiddenStems[0] : p.stem;
  return {
    kind: "chart",
    label: hidden ? `${p.label} 지장간` : `${p.label} 천간`,
    detail: hidden
      ? `${p.hanja[1]}의 지장간 ${p.hiddenStems.map((s) => `${s.hanja}(${s.korean})·${s.tenGod}`).join(", ")}. 이번 질문에는 첫 글자 ${stem.hanja}·${stem.tenGod}를 사용했어요. 개수나 강약 순위는 아닙니다.`
      : `${p.hanja[0]}(${stem.korean})는 일간을 기준으로 ${stem.tenGod}에 해당해요.`,
  };
}

function seasonSentence(facts: SajuAnalysis) {
  if (!facts.season)
    return "월주가 확정되지 않아 계절에 관한 해설은 보류하고, 확인된 일지에서 출발해요.";
  const images = {
    봄: "새로운 시작과 익숙한 리듬",
    여름: "드러내는 마음과 쉬어갈 여유",
    가을: "선택하는 기준과 남겨둘 여지",
    겨울: "충분히 머무는 시간과 다가갈 시점",
    "계절 전환": "이어가는 약속과 바꿔볼 방식",
  };
  return `월지 ${facts.season.monthBranch}(${facts.season.monthBranchKorean})는 ${facts.season.name}의 구분으로 읽어요. 이 계절의 이미지를 ‘${images[facts.season.name]}’이라는 질문으로 연결해볼게요.`;
}

export function buildRelationshipPlan(chart: Chart) {
  const facts = analyzeChart(chart);
  const day = facts.pillars.find((p) => p.key === "day")!;
  const month = facts.pillars.find((p) => p.key === "month");
  const anchor = month ?? day;
  const paceLens = GOD_LENSES[anchor.hiddenStems[0].tenGod];
  const pace: Finding = {
    ruleId: month ? "pace.month-root" : "pace.day-root",
    condition: `${anchor.label} ${anchor.branch}의 첫 지장간 ${anchor.hiddenStems[0].hanja}: ${anchor.hiddenStems[0].tenGod}`,
    title: paceLens.topic,
    body: `${seasonSentence(facts)}\n\n${paceLens.pace}`,
    action: paceLens.action,
    phrase: paceLens.phrase,
    evidence: [
      stemEvidence(anchor, true),
      ...(facts.season
        ? [
            {
              kind: "chart" as const,
              label: "태어난 계절의 단서",
              detail: `확정된 월지 ${facts.season.monthBranch}(${facts.season.monthBranchKorean})를 ${facts.season.name}으로 구분했어요. 계절 가중치나 신강·신약 판정은 하지 않았어요.`,
            },
          ]
        : []),
    ],
  };

  // Order selects an editorial lens for this chapter, not the strongest ten-god.
  const visible = ["month", "year", "hour"].flatMap((key) =>
    facts.pillars.filter((p) => p.key === key),
  );
  const pair = PAIRS.find((candidate) =>
    candidate.keys.every((family) =>
      visible.some((p) => FAMILY[p.stem.tenGod] === family),
    ),
  );
  const expressionAnchor = visible[0] ?? day;
  const expressionGod = visible.length
    ? expressionAnchor.stem.tenGod
    : day.hiddenStems[0].tenGod;
  const expressionLens = GOD_LENSES[expressionGod];
  const expression: Finding = {
    ruleId: pair
      ? "expression.pair"
      : visible.length
        ? "expression.single"
        : "expression.day-root",
    condition: pair
      ? `천간 십성 계열 공존: ${pair.keys.join(" + ")}; PAIRS의 첫 일치 조합. 예시 문장 출처: ${expressionAnchor.key} ${expressionAnchor.stem.hanja}·${expressionGod} (월간·년간·시간 순)`
      : `${expressionAnchor.label} ${expressionGod}`,
    title: pair?.name ?? expressionLens.topic,
    body: pair?.body ?? expressionLens.expression,
    action: expressionLens.action,
    phrase: expressionLens.phrase,
    evidence: pair
      ? [
          ...new Set([
            ...pair.keys.map((family) =>
              visible.find((p) => FAMILY[p.stem.tenGod] === family)!,
            ),
            expressionAnchor,
          ]),
        ].map((p) => stemEvidence(p))
      : [stemEvidence(expressionAnchor, !visible.length)],
  };

  const dayRelations = facts.relations.filter((r) => r.pillars.includes("day"));
  // Prefer a day relation independently for each kind; never hide a known
  // clash just because the day participates only in a combination (or vice versa).
  const clash =
    dayRelations.find((r) => r.kind === "clash") ??
    facts.relations.find((r) => r.kind === "clash");
  const combination =
    dayRelations.find((r) => r.kind === "six-combination") ??
    facts.relations.find((r) => r.kind === "six-combination");
  const selectedRelations = [combination, clash].filter((r) => r !== undefined);
  const boundaryLens = GOD_LENSES[day.hiddenStems[0].tenGod];
  const relationEvidence: ReadingEvidence[] = selectedRelations.map((r) => ({
    kind: "chart",
    label: r.kind === "clash" ? "지지의 충" : "지지의 육합",
    detail:
      r.pillars
        .map(
          (key, i) =>
            `${facts.pillars.find((p) => p.key === key)!.label} ${r.branches[i]}`,
        )
        .join(" · ") +
      (r.kind === "clash"
        ? "의 충 관계를 확인했어요. 실제 갈등이나 이별을 뜻하는 판정은 아닙니다."
        : "의 육합 관계를 확인했어요. 합화나 두 사람의 궁합이 좋다는 판정은 아닙니다."),
  }));
  const boundary: Finding = {
    ruleId:
      clash && combination
        ? "boundary.mixed"
        : clash
          ? "boundary.clash"
          : combination
            ? "boundary.combination"
            : "boundary.day-root",
    condition: selectedRelations.length
      ? selectedRelations
          .map(
            (r) => `${r.pillars.join("·")}=${r.branches.join("·")} ${r.kind}`,
          )
          .join(", ") +
        "; 종류별 일지 포함 쌍 우선, 없으면 년·월·일·시 순 첫 쌍"
      : `일지 첫 지장간 ${day.hiddenStems[0].tenGod}`,
    title:
      clash && combination
        ? "가까워지고 싶어도 남겨둘 차이"
        : clash
          ? "엇갈리는 리듬을 설명하는 기준"
          : combination
            ? "가까워질수록 필요한 경계"
            : boundaryLens.topic,
    body:
      clash && combination
        ? "확인된 지지에는 육합과 충이 함께 있어요. 하나를 좋고 다른 하나를 나쁘다고 상쇄하지 않고, 가까워지고 싶은 마음과 서로 다른 방식이 함께 있는 장면으로 읽어봐요. 함께 지킬 약속과 각자 선택할 영역을 나누는 것이 이번 질문이에요."
        : clash
          ? "확인된 지지의 충을 서로 다른 리듬을 살펴보는 단서로 사용했어요. 관계에서 실제로 부딪힌 일이 있었다면 연락의 빈도, 약속의 시점, 말투 중 무엇이 달랐는지 구체적으로 짚어봐요. 한 번의 어긋남과 반복되는 문제는 나눠서 살펴볼 수 있어요."
          : combination
            ? "확인된 지지의 육합을 서로 연결되는 방식에 관한 질문으로 읽어요. 가까워진 뒤에도 내가 선택할 여지가 남아 있었는지 떠올려봐요. 마음이 잘 맞는다고 느낄수록 말하지 않은 기대가 생겼는지도 확인할 수 있어요."
            : boundaryLens.boundary,
    action: boundaryLens.action,
    phrase: boundaryLens.phrase,
    evidence: selectedRelations.length
      ? relationEvidence
      : [stemEvidence(day, true)],
  };
  return { facts, pace, expression, boundary };
}
