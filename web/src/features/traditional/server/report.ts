import {
  analyzeChart,
  type PillarFact,
  type PillarKey,
  type SajuAnalysis,
  type StemFact,
  type TenGod,
} from "../../../lib/saju-analysis";
import {
  ELEMENTS,
  type BirthInput,
  type Chapter,
  type ChapterSection,
  type Chart,
  type Element,
  type ReadingEvidence,
} from "../../../types/reading";
import { TRADITIONAL_STEM_PORTRAITS } from "./stem-portraits";
import { TRADITIONAL_GOD_READINGS } from "./ten-god-readings";

export const TRADITIONAL_VERSION = "traditional-0.1.0";

const PILLAR_LABELS: Record<PillarKey, string> = {
  year: "년주",
  month: "월주",
  day: "일주",
  hour: "시주",
};

const GOD_FAMILY: Record<TenGod, string> = {
  비견: "비겁",
  겁재: "비겁",
  식신: "식상",
  상관: "식상",
  편재: "재성",
  정재: "재성",
  편관: "관성",
  정관: "관성",
  편인: "인성",
  정인: "인성",
};

const FAMILY_ROLES: Record<string, string> = {
  비겁: "자기 기준을 세우고 다른 사람과 힘을 나누는 일",
  식상: "가진 생각과 솜씨를 밖으로 표현하고 만드는 일",
  재성: "실제 자원과 결과를 구체적으로 다루는 일",
  관성: "기준과 책임을 정해 일의 질서를 세우는 일",
  인성: "필요한 지식과 경험을 받아들여 바탕을 만드는 일",
};

// Authored relationships between two selected symbolic roles, not strength scores.
const FAMILY_CONNECTIONS: { pair: [string, string]; text: string }[] = [
  {
    pair: ["비겁", "식상"],
    text: "자기 생각이 분명한 것과 그 생각이 다른 사람에게 이해되는 것은 서로 다른 능력입니다. 내 기준을 세우는 힘이 표현과 만날 때 자기 색깔을 가진 결과가 나올 수 있습니다. 반대로 내게 당연한 순서를 상대도 알 것이라 여기면 좋은 생각이 설명에서 막힐 여지도 있습니다.",
  },
  {
    pair: ["비겁", "재성"],
    text: "내가 주도하고 싶은 방향과 현실에서 감당할 수 있는 조건이 함께 놓입니다. 자기 이름으로 책임지는 일에 구체적인 자원 관리가 더해지는 모습입니다. 혼자 해내려는 마음이 커질 때에도 시간과 역할을 나누어 맡길 수 있는지가 일의 규모를 조절하는 지점이 됩니다.",
  },
  {
    pair: ["비겁", "관성"],
    text: "내 방식대로 판단하려는 면과 정해진 역할을 충실히 해내려는 면이 함께 놓입니다. 규칙 안에서도 스스로 결정할 영역이 보이면 독립성과 책임이 함께 쓰일 수 있습니다. 기준에 납득하지 못한 채 의무만 맡으면, 일을 수행하는 능력과 별개로 답답함이 쌓이는 장면으로 읽을 수 있습니다.",
  },
  {
    pair: ["비겁", "인성"],
    text: "스스로 판단하는 힘과 충분히 이해한 뒤 움직이려는 면이 만납니다. 배운 것을 그대로 따르기보다 자기 기준으로 다시 정리하는 모습으로 풀 수 있습니다. 다만 모든 근거를 혼자 납득하려다 시작이 늦어지는 장면에서는, 이미 아는 부분을 작은 행동으로 확인하는 과정이 의미를 갖습니다.",
  },
  {
    pair: ["식상", "재성"],
    text: "만들고 표현하는 역할과 결과를 현실의 쓰임으로 연결하는 역할이 함께 놓입니다. 아이디어를 내는 데서 그치지 않고 누구에게 어떤 도움이 되는지 이어 생각하는 장면입니다. 흥미로운 결과물을 많이 만드는 일과 지속할 수 있는 일 하나를 남기는 일의 차이가 읽어볼 지점입니다.",
  },
  {
    pair: ["식상", "관성"],
    text: "새로운 표현을 꺼내는 면과 일정한 기준을 지키려는 면이 함께 놓입니다. 틀의 불편한 부분을 발견하면서도 결과에 대한 책임을 놓지 않는 이야기입니다. 규칙에 맞추느라 생각을 모두 줄이거나, 바꾸고 싶은 마음 때문에 필요한 절차까지 밀어내지 않을 때 두 역할이 함께 쓰일 여지가 생깁니다.",
  },
  {
    pair: ["식상", "인성"],
    text: "안으로 받아들인 것을 밖으로 만들어내는 두 방향이 함께 놓입니다. 깊이 이해한 내용이 설명이나 결과물로 이어질 때 배움과 표현이 순환하는 모습입니다. 더 배워야 한다는 마음과 일단 내놓고 싶다는 마음 사이에서, 작은 결과를 만들고 다시 보완하는 리듬을 찾는 이야기가 됩니다.",
  },
  {
    pair: ["재성", "관성"],
    text: "실제 결과를 다루는 면과 그 결과를 책임질 기준이 함께 놓입니다. 눈앞의 성과만큼 이후에도 유지할 수 있는 구조가 중요해지는 이야기입니다. 조건이 달라졌을 때 약속을 무조건 유지하는 것과 책임 있게 새로 조율하는 것은 다를 수 있다는 점이 이 조합의 긴장을 풀어줍니다.",
  },
  {
    pair: ["재성", "인성"],
    text: "배우고 이해하는 면과 그것을 현실에 쓰려는 면이 함께 놓입니다. 지식을 충분히 쌓는 시간과 그 지식이 어디에 필요한지 확인하는 시간이 이어지는 이야기입니다. 효율만 따지면 탐구의 여지가 줄고 준비만 길어지면 실제 쓰임을 놓칠 수 있어, 두 역할을 번갈아 쓰는 리듬이 중요해집니다.",
  },
  {
    pair: ["관성", "인성"],
    text: "역할을 충실히 해내는 면과 그 역할의 이유를 이해하려는 면이 함께 놓입니다. 기준을 단순히 외우기보다 왜 필요한지 설명할 수 있을 때 신뢰를 쌓는 모습입니다. 이미 익힌 절차가 상황과 맞지 않는 날에도, 목적을 이해한 바탕이 있으면 책임을 버리지 않고 방법을 바꿀 여지가 생깁니다.",
  },
];

const FAMILY_SOCIAL: Record<string, string> = {
  비겁: "이 자리의 비겁은 사람 사이에서도 자기 목소리를 유지하는 주제로 읽을 수 있습니다. 같이 일한다는 이유로 생각까지 같아야 하는 것은 아니며, 독립적으로 맡은 몫을 서로 연결할 때 협력이 생깁니다. 대등함은 모든 일을 똑같이 나누는 것보다 각자가 책임질 수 있는 범위를 존중하는 데 가까운 모습입니다.",
  식상: "이 자리의 식상은 자신의 생각을 밖으로 내놓으며 사람과 연결되는 주제로 읽을 수 있습니다. 만든 결과나 솔직한 반응이 대화의 출발점이 되지만 표현의 양만큼 받아들이는 공간도 필요합니다. 내 설명이 끝난 뒤 상대의 해석이 더해질 때, 일방적인 전달이 아니라 함께 의미를 만드는 교류가 됩니다.",
  재성: "이 자리의 재성은 말뿐 아니라 실제로 도움이 되는 일을 통해 관계를 만드는 주제로 읽을 수 있습니다. 필요한 것을 챙기고 사람과 자원을 이어 주는 모습입니다. 다만 도움을 주는 사람이 관계의 방향까지 정하는 것은 아니므로, 상대가 원하는 몫과 거절할 수 있는 몫이 함께 있을 때 실질적인 배려가 됩니다.",
  관성: "이 자리의 관성은 서로 기대할 수 있는 역할과 약속으로 관계를 안정시키는 주제로 읽을 수 있습니다. 책임의 기준이 명료하면 불필요한 오해가 줄어듭니다. 다만 역할이 다른 만큼 필요한 기준도 달라질 수 있어, 한 가지 원칙을 모두에게 그대로 적용하기보다 함께 일하는 이유와 상황을 공유하는 과정이 중요합니다.",
  인성: "이 자리의 인성은 이야기를 받아들이고 맥락을 이해하며 관계를 만드는 주제로 읽을 수 있습니다. 설명을 충분히 듣고 이전의 경험을 기억하는 힘입니다. 이해하는 일과 무조건 동의하는 일은 같지 않으므로, 상대의 사정을 알고도 내 의견을 말할 수 있을 때 포용이 자기 자리를 지우는 일이 되지 않습니다.",
};

const FAMILY_OUTLOOK: Record<string, string> = {
  비겁: "이어 갈 일의 방향을 정할 때 자기 기준과 공동의 목표가 만나는 지점에 주목하는 관점입니다. 혼자 완성할 영역과 다른 사람의 힘을 빌릴 영역이 나뉘면 선택이 더 구체적이 됩니다. 여기서 중요한 것은 누구보다 앞서는 결말이 아니라 자기 이름으로 맡을 수 있는 일이 무엇인지 분명해지는 과정입니다.",
  식상: "다음 단계의 일은 생각을 충분히 설명하는 것에서 실제 형태로 내놓는 과정과 연결해 읽을 수 있습니다. 완성된 결과만 기다리기보다 작은 형태를 만들어 다른 사람의 반응을 받는 흐름입니다. 표현과 생산이라는 관점을 적용한 이야기이며, 어느 시기에 어떤 성과를 거둔다고 정해 놓은 미래는 아닙니다.",
  재성: "이어 갈 일을 생각할 때는 가능성의 크기와 별개로 필요한 사람, 시간, 도구가 실제로 어떻게 연결되는지 주목하는 관점입니다. 막연한 바람에 구체적인 조건을 붙이는 과정입니다. 자원을 다룬다는 십성의 의미를 적용한 것이며, 재물이 늘어나는 시기나 금액을 알려 주는 해석과는 구분됩니다.",
  관성: "다음 단계의 일을 정할 때 목표뿐 아니라 감당할 책임과 유지할 기준을 함께 보는 관점입니다. 결과를 얻은 뒤에도 이어 갈 수 있는 방식인지 생각하는 과정입니다. 역할과 질서를 다룬다는 상징에서 나온 설명으로, 특정 지위에 오르거나 정해진 직업을 가져야 한다는 뜻은 아닙니다.",
  인성: "이어 갈 일의 기반을 이미 쌓은 지식과 경험에서 찾는 관점입니다. 새로운 것을 계속 더하는 것만큼 지금 가진 이해를 실제로 쓸 자리를 발견하는 과정도 중요해집니다. 배움의 상징을 삶의 방향에 적용한 것이며, 준비가 모두 끝난 뒤에야 움직일 수 있다거나 미래가 이미 정해졌다는 뜻은 아닙니다.",
};

const ELEMENT_VIEW: Record<Element, string> = {
  목: "목은 뻗고 시작하는 움직임의 상징입니다. 계획의 출발점을 세우고 아직 자라지 않은 가능성을 길러 내는 이미지로 읽습니다. 같은 목이라도 갑과 을은 큰 방향을 세우는 모습과 조건에 맞춰 길을 만드는 모습으로 표현이 달라집니다.",
  화: "화는 드러내고 밝히는 움직임의 상징입니다. 안에 있던 생각을 밖으로 보여 주고 사람과 경험 사이에 온도를 만드는 이미지로 읽습니다. 같은 화라도 병과 정은 넓게 비추는 모습과 한곳을 집중해 밝히는 모습으로 표현이 달라집니다.",
  토: "토는 받아들이고 잇는 움직임의 상징입니다. 서로 다른 것을 한자리에 머물게 하고 현실에서 계속 쓸 수 있는 바탕을 만드는 이미지로 읽습니다. 같은 토라도 무와 기는 큰 자리를 지탱하는 모습과 구체적인 필요를 기르는 모습으로 표현이 달라집니다.",
  금: "금은 구분하고 다듬는 움직임의 상징입니다. 무엇을 남기고 덜어낼지 정해 아직 거친 것을 쓰임 있는 형태로 바꾸는 이미지로 읽습니다. 같은 금이라도 경과 신은 틀을 정하는 모습과 작은 차이를 정교하게 다루는 모습으로 표현이 달라집니다.",
  수: "수는 흐르고 저장하는 움직임의 상징입니다. 바로 드러나지 않는 가능성을 품고 길을 찾아 이어 가는 이미지로 읽습니다. 같은 수라도 임과 계는 넓은 흐름을 연결하는 모습과 작은 단서를 모아 스며드는 모습으로 표현이 달라집니다.",
};

const SEASON_CONTEXT: Record<
  NonNullable<SajuAnalysis["season"]>["name"],
  string
> = {
  봄: "봄이라는 계절 이미지는 밖으로 자라나기 시작하는 움직임을 배경에 놓습니다. 이미 완성된 답을 유지하는 일보다 가능성을 열고 방향을 정하는 장면에 빗대어 읽을 수 있습니다. 다만 이 배경만으로 어떤 오행이 충분하다거나 일간이 강하다고 정하지는 않습니다.",
  여름: "여름이라는 계절 이미지는 움직임이 밖으로 드러나는 때를 배경에 놓습니다. 안에서 준비한 것을 펼치고 사람이나 경험과 활발히 접촉하는 장면에 빗대어 읽을 수 있습니다. 계절의 이미지는 원국을 읽는 한 단서이며, 이를 곧바로 활발한 성격이나 일간의 강도로 바꾸지는 않습니다.",
  가을: "가을이라는 계절 이미지는 자란 것을 구분하고 형태를 정하는 때를 배경에 놓습니다. 여러 가능성 중 남길 것을 선택하고 결과를 정리하는 장면에 빗대어 읽을 수 있습니다. 이것이 곧 냉정한 성격이나 금의 힘이 충분하다는 뜻은 아니며, 다른 글자의 자리와 함께 읽을 배경입니다.",
  겨울: "겨울이라는 계절 이미지는 밖으로 드러난 움직임보다 안에 모으고 준비하는 때를 배경에 놓습니다. 바로 보이는 결과 아래의 이해와 축적에 빗대어 읽을 수 있습니다. 계절을 안다고 해서 내향적인 사람으로 정하거나 수의 힘이 강하다고 결론낼 수는 없습니다.",
  "계절 전환":
    "진·술·축·미는 이 리포트에서 계절이 바뀌는 구간으로 묶어 설명합니다. 이전의 흐름을 정리하면서 다음 흐름의 바탕을 마련하는 이미지입니다. 네 지지를 같은 계절이나 같은 온도로 취급하는 뜻은 아니며, 정확한 월지와 안에 들어 있는 지장간은 각각 구분해 읽습니다.",
};

const SEASON_SYNTHESIS: Record<
  NonNullable<SajuAnalysis["season"]>["name"],
  string
> = {
  봄: "새로운 방향을 여는 계절의 이미지와 실제 원국의 십성을 함께 놓으면, 시작의 의욕을 어떤 방식으로 이어 가는지가 이야기의 연결점이 됩니다. 같은 봄의 배경이라도 자기 기준을 세우는 글자와 결과를 관리하는 글자는 서로 다른 역할을 합니다. 계절 하나로 모두 같은 사람이 되는 것은 아닙니다.",
  여름: "밖으로 드러나는 계절의 이미지에 원국의 십성을 겹치면, 무엇을 표현하고 무엇으로 그 움직임을 받치는지가 이야기의 연결점이 됩니다. 펼치는 힘만 있는 것이 아니라 받아들이고 정리하는 글자도 각자의 자리를 가집니다. 밝은 계절 이미지와 실제 사람이 느끼는 기분은 같은 자료가 아닙니다.",
  가을: "구분하고 형태를 정하는 계절의 이미지에 원국의 십성을 겹치면, 어떤 기준으로 결과를 남기고 그 결과를 어디에 쓰는지가 이야기의 연결점이 됩니다. 정리한다는 배경 속에도 새롭게 배우거나 표현하는 글자가 함께 놓일 수 있습니다. 원국은 한 방향의 기운만으로 쓰인 이야기가 아닙니다.",
  겨울: "안으로 모으는 계절의 이미지에 원국의 십성을 겹치면, 쌓은 것을 언제 어떤 형태로 바깥과 연결할지가 이야기의 연결점이 됩니다. 저장의 배경 속에서도 표현이나 책임을 다루는 글자가 각자의 역할을 할 수 있습니다. 계절과 십성을 함께 읽는 이유는 하나의 이미지로 사람을 닫지 않기 위해서입니다.",
  "계절 전환":
    "전환 구간이라는 배경에 실제 월지의 지장간을 겹치면, 여러 흐름을 어떻게 이어 가는지가 이야기의 연결점이 됩니다. 같은 전환 구간으로 묶었더라도 진·술·축·미의 내용은 서로 다르므로 월지 이름과 그 안의 글자가 중요합니다. 큰 계절 이름은 길잡이이고 실제 원국의 구성이 해석의 구체적인 재료입니다.",
};

function makeChapter(
  data: Omit<Chapter, "body"> & { lead: string; sections: ChapterSection[] },
): Chapter {
  return {
    ...data,
    body: [data.lead, ...data.sections.map((section) => section.body)].join(
      "\n\n",
    ),
  };
}

function uniqueEvidence(items: ReadingEvidence[]): ReadingEvidence[] {
  return items.filter(
    (item, index) =>
      items.findIndex(
        (other) => other.label === item.label && other.detail === item.detail,
      ) === index,
  );
}

function stemText(stem: StemFact): string {
  return `${stem.hanja}(${stem.korean}, ${stem.tenGod})`;
}

function pillarEvidence(pillar: PillarFact): ReadingEvidence {
  return {
    kind: "chart",
    label: `${pillar.label}의 확정된 구성`,
    detail: `${pillar.hanja} — 천간 ${stemText(pillar.stem)}, 지지 ${pillar.branch}, 지장간 ${pillar.hiddenStems.map(stemText).join("·")}. 십성은 일간을 기준으로 계산합니다.`,
  };
}

function rootEvidence(pillar: PillarFact): ReadingEvidence {
  return {
    kind: "chart",
    label: `${pillar.label}의 지장간 해석 단서`,
    detail: `${pillar.branch}의 지장간 ${pillar.hiddenStems.map(stemText).join("·")} 중 표의 첫 글자 ${stemText(pillar.hiddenStems[0])}를 이번 문안의 출발점으로 사용합니다. 이 순서로 개인 원국의 강약을 정한 것은 아닙니다.`,
  };
}

function rootSource(pillar: PillarFact): string {
  const root = pillar.hiddenStems[0];
  return `${pillar.label} ${pillar.hanja}의 지지 ${pillar.branch}에는 ${root.hanja}(${root.korean})가 담겨 있고, 일간과의 관계는 ${root.tenGod}입니다.`;
}

type GodOccurrence = {
  god: TenGod;
  source: string;
};

function occurrences(facts: SajuAnalysis): GodOccurrence[] {
  return facts.pillars.flatMap((pillar) => [
    ...(pillar.key === "day"
      ? []
      : [
          {
            god: pillar.stem.tenGod,
            source: `${pillar.label} 천간 ${pillar.stem.hanja}`,
          },
        ]),
    ...pillar.hiddenStems.map((stem) => ({
      god: stem.tenGod,
      source: `${pillar.label} ${pillar.branch}의 지장간 ${stem.hanja}`,
    })),
  ]);
}

function relationText(relation: SajuAnalysis["relations"][number]): string {
  return `${PILLAR_LABELS[relation.pillars[0]]} ${relation.branches[0]}와 ${PILLAR_LABELS[relation.pillars[1]]} ${relation.branches[1]}의 ${relation.kind === "six-combination" ? "육합" : "충"}`;
}

function relationsNarrative(facts: SajuAnalysis): string {
  const combinations = facts.relations.filter(
    (item) => item.kind === "six-combination",
  );
  const clashes = facts.relations.filter((item) => item.kind === "clash");
  const observed = facts.relations.length
    ? `확정된 지지 사이에는 ${facts.relations.map(relationText).join(", ")}이 표시됩니다.`
    : "이번에 확정된 지지 사이에서는 이 리포트가 확인하는 육합과 충의 짝이 관측되지 않았습니다.";
  const reading =
    combinations.length && clashes.length
      ? "합과 충이 함께 있다는 것은 같은 원국 안에 연결과 차이라는 두 종류의 관계가 있다는 뜻입니다. 이를 생활의 상징으로 옮기면 함께 묶어 갈 부분과 서로 구분해야 할 부분을 동시에 읽는 관점이 됩니다. 한 종류를 골라 다른 종류를 지우거나, 합이 충을 모두 없앤다고 계산하지 않습니다."
      : combinations.length
        ? "육합은 두 지지가 서로 짝을 이루는 관계입니다. 사람과 역할이 연결되는 장면의 상징으로 풀 수 있지만 무조건 잘 맞는다는 판정은 아닙니다. 연결이 장점으로 쓰이는 경우와 서로 다른 몫을 구분할 필요가 있는 경우를 함께 생각할 수 있는 단서입니다."
        : clashes.length
          ? "충은 마주 놓인 두 지지의 관계입니다. 서로 다른 방향이나 변화의 필요를 읽는 상징으로 사용할 수 있지만 실제 다툼이나 이별의 예고는 아닙니다. 차이가 있다는 사실과 그 차이를 어떻게 다루는가는 다른 층위이므로, 글자의 관계를 특정 사건으로 바꾸어 단정하지 않습니다."
          : "이 결과가 사람 사이의 갈등이 없다거나 관계가 단조롭다는 뜻은 아닙니다. 육합과 충은 지지 관계의 일부만 확인하는 항목이기 때문입니다. 이 경우에는 없는 관계를 만들어 설명하지 않고 확정된 일지와 천간의 십성으로 사람을 대하는 관점을 이어갑니다.";
  return `${observed}\n\n${reading}`;
}

/**
 * Traditional general reading: calendar facts → explicit editorial anchors → text.
 * MBTI, gender, nickname and relationship concern never select these passages.
 * Month/year/hour are used only when calculateChart has resolved those pillars.
 */
export function createTraditionalReport(_input: BirthInput, chart: Chart) {
  const facts = analyzeChart(chart);
  const day = facts.pillars.find((pillar) => pillar.key === "day")!;
  const month = facts.pillars.find((pillar) => pillar.key === "month");
  const hour = facts.pillars.find((pillar) => pillar.key === "hour");
  const rootPillar = month ?? day;
  const rootGod = rootPillar.hiddenStems[0].tenGod;
  const innerGod = day.hiddenStems[0].tenGod;
  const visible = (["month", "year", "hour"] as const).flatMap((key) =>
    facts.pillars.filter((pillar) => pillar.key === key),
  );
  const visiblePillar = visible[0] ?? rootPillar;
  const expressionGod = visible[0]?.stem.tenGod ?? rootGod;
  const expressionSource = visible[0]
    ? `${visiblePillar.label} 천간 ${stemText(visiblePillar.stem)}`
    : `${rootPillar.label} ${rootPillar.branch}의 지장간 ${stemText(rootPillar.hiddenStems[0])}`;
  const rootReading = TRADITIONAL_GOD_READINGS[rootGod];
  const expressionReading = TRADITIONAL_GOD_READINGS[expressionGod];
  const innerReading = TRADITIONAL_GOD_READINGS[innerGod];
  const portrait = TRADITIONAL_STEM_PORTRAITS[facts.dayMaster.hanja];
  const known = facts.pillars
    .map((pillar) => `${pillar.label} ${pillar.hanja}`)
    .join(" · ");
  const missing = facts.missingPillars
    .map((key) => PILLAR_LABELS[key])
    .join("·");
  const countText = ELEMENTS.map(
    (element) => `${element} ${chart.counts[element]}개`,
  ).join(" · ");
  const surfaceTotal = ELEMENTS.reduce(
    (sum, element) => sum + chart.counts[element],
    0,
  );
  const absent = ELEMENTS.filter((element) => chart.counts[element] === 0);
  const godOccurrences = occurrences(facts);
  const godNames = [...new Set(godOccurrences.map((item) => item.god))];
  const familyNames = [...new Set(godNames.map((god) => GOD_FAMILY[god]))];
  const dayEvidence: ReadingEvidence = {
    kind: "chart",
    label: "나를 읽는 기준: 일간",
    detail: `일주 ${day.hanja}의 일간은 ${facts.dayMaster.hanja}(${facts.dayMaster.korean}), ${facts.dayMaster.polarity}·${facts.dayMaster.element}입니다.`,
  };
  const countEvidence: ReadingEvidence = {
    kind: "chart",
    label: "확정된 글자의 표면 오행 집계",
    detail: `${known}. 천간과 지지의 대표 오행 ${surfaceTotal}글자만 세면 ${countText}입니다. 지장간을 더하지 않았고 강약 가중치는 적용하지 않았습니다.`,
  };
  const scopeEvidence: ReadingEvidence = {
    kind: "chart",
    label: "이번 원국의 계산 범위",
    detail: missing
      ? `${missing}는 미확정이라 해석과 집계에서 제외했습니다. 확정된 기둥: ${known}.`
      : `년주·월주·일주·시주가 확정되어 네 기둥을 사용했습니다. ${known}.`,
  };
  const seasonEvidence: ReadingEvidence[] = facts.season
    ? [
        {
          kind: "chart",
          label: "월지의 계절 구분",
          detail: `확정된 월지 ${facts.season.monthBranch}(${facts.season.monthBranchKorean})를 ${facts.season.name} 구간으로 설명합니다. 월지 구분은 오행 강약 점수가 아닙니다.`,
        },
      ]
    : [];
  const relationEvidence: ReadingEvidence = {
    kind: "chart",
    label: "확정된 지지 사이의 육합·충",
    detail: facts.relations.length
      ? `${facts.relations.map(relationText).join(" · ")}. 확정된 기둥끼리만 비교했으며 합화·형·파·해 등은 계산하지 않았습니다.`
      : `${known}의 지지끼리 비교한 결과 육합·충의 짝이 없습니다. 다른 종류의 관계나 미확정 기둥까지 없다고 판정한 것은 아닙니다.`,
  };
  const allEvidence = facts.pillars.map(pillarEvidence);
  const visibleEvidence = visible.length
    ? visible.map(pillarEvidence)
    : [rootEvidence(rootPillar)];
  const rootBasis = rootEvidence(rootPillar);
  const innerBasis = rootEvidence(day);
  const visibleSummary = visible.length
    ? `일간을 제외한 천간에는 ${visible.map((pillar) => `${pillar.label} ${stemText(pillar.stem)}`).join(", ")}가 놓입니다. 이 중 ${expressionSource}의 표현을 먼저 풀어볼게요.`
    : `일간 외의 천간은 아직 확정되지 않았습니다. 없는 천간을 추정하지 않고 ${expressionSource}로 문안의 출발점을 옮겼습니다.`;
  const seasonBody = facts.season
    ? `월지 ${facts.season.monthBranch}(${facts.season.monthBranchKorean})는 ${facts.season.name} 구간으로 구분합니다. ${SEASON_CONTEXT[facts.season.name]}`
    : "월주가 확정되지 않아 태어난 달의 계절 배경은 붙이지 않았습니다. 절기가 바뀌는 날에 시각을 모르면 월지가 달라질 수 있으므로, 날짜만 보고 계절의 기둥을 하나로 고르지 않습니다. 현재 확정된 일간과 일지로 읽을 수 있는 내용은 이어지지만 계절을 사용하는 해석은 남겨 둡니다.";

  const intro = makeChapter({
    title: `${facts.dayMaster.korean}${facts.dayMaster.element} 일간, 나를 이루는 첫 번째 성향`,
    lead: `${day.hanja} 일주의 일간은 ${facts.dayMaster.hanja}(${facts.dayMaster.korean})입니다. ${portrait.opening}`,
    sections: [
      { title: "나를 읽는 첫 장면", body: portrait.nature },
      { title: "이 상징이 지닌 힘", body: portrait.strength },
      { title: "같은 힘이 부담이 될 때", body: portrait.tension },
      { title: "한 가지 성향 안의 균형", body: portrait.synthesis },
    ],
    question:
      "일간에서 시작해 오행의 구성과 십성의 역할을 차례로 이어 읽습니다.",
    evidence: [dayEvidence],
  });

  const comparison = makeChapter({
    title: "오행의 구성, 내 원국에 놓인 다섯 가지 움직임",
    lead: `이번 원국에서 확인된 표면 오행은 ${countText}입니다. ${surfaceTotal}글자의 구성을 먼저 본 뒤 일간과 계절의 맥락을 구분해 읽습니다.`,
    sections: [
      {
        title: "숫자가 보여 주는 것",
        body: `${known}에서 천간 한 글자와 지지의 대표 오행 한 글자를 각각 셌습니다. 지지 안의 지장간을 별도로 더한 숫자는 아닙니다. ${absent.length ? `${absent.join("·")}은 표면 집계에서 0개이지만 해당 성향이나 능력이 없다는 판정은 아닙니다.` : "다섯 오행이 모두 집계되지만 이것만으로 완벽하게 균형 잡힌 원국이라고 정하지는 않습니다."} 숫자가 많고 적은 사실과 실제 사주에서 어떤 역할을 하는가는 나누어 보아야 합니다.`,
      },
      {
        title: `일간의 ${facts.dayMaster.element}을 중심에 놓으면`,
        body: ELEMENT_VIEW[facts.dayMaster.element],
      },
      {
        title: facts.season
          ? "월지가 더하는 계절의 배경"
          : "아직 정하지 않은 계절의 자리",
        body: seasonBody,
      },
      {
        title: "구성에서 관계로 이어지는 읽기",
        body: "목·화·토·금·수는 각각 시작, 드러냄, 연결, 구분, 저장이라는 움직임에 빗대어 이해할 수 있습니다. 어느 하나만 많아야 좋다는 점수표는 아닙니다. 다음 장에서는 같은 오행이라도 나를 기준으로 돕는 관계인지, 표현하는 관계인지, 다루거나 조절하는 관계인지 구분합니다. 이때 사용하는 이름이 십성입니다.",
      },
    ],
    question:
      "오행 개수는 구성의 기록이며, 십성은 그 글자가 일간과 맺는 관계의 이름입니다.",
    evidence: uniqueEvidence([
      dayEvidence,
      countEvidence,
      scopeEvidence,
      ...seasonEvidence,
    ]),
  });

  const capacityEvidence = uniqueEvidence([
    dayEvidence,
    ...allEvidence,
    rootBasis,
    scopeEvidence,
  ]);
  const moneyOccurrences = godOccurrences.filter(
    (item) => GOD_FAMILY[item.god] === "재성",
  );
  const moneyDescription = moneyOccurrences.length
    ? `재성에 해당하는 글자는 ${moneyOccurrences.map((item) => `${item.source}의 ${item.god}`).join(", ")}입니다. 천간에 보이는 글자와 지장간에 들어 있는 글자는 자리를 구분해 표시했습니다.`
    : "확정된 천간과 지장간에서는 재성에 해당하는 글자가 관측되지 않았습니다. 이것이 재산이나 소득이 없다는 뜻은 아니며, 알려지지 않은 기둥까지 없다고 정할 수도 없습니다.";
  const productionFamilies = ["식상", "재성", "관성", "인성", "비겁"].filter(
    (family) => familyNames.includes(family),
  );
  const flowDescription = productionFamilies
    .map((family) => `${family}: ${FAMILY_ROLES[family]}`)
    .join("\n");
  const rootVersusExpression = !visible.length
    ? `다른 천간이 확정되지 않아 같은 일지의 ${rootGod} 단서를 재능과 배움이라는 두 문맥으로 읽었습니다. 무엇을 잘 표현하는지와 어떤 과정으로 익히는지를 나누어 보면, 하나의 키워드 안에서도 결과를 내는 순간과 준비하는 순간이 다른 모습으로 이어질 수 있습니다.`
    : rootGod === expressionGod
      ? `표현과 배움의 자리에서 모두 ${rootGod}를 만납니다. 같은 주제가 밖으로 보여주는 방식과 안에서 준비하는 방식에 이어지는 모습입니다. 잘하는 것을 더 익히며 안정감을 얻을 수 있지만, 익숙한 방식만으로 해결하기 어려운 상황에서는 다른 사람의 접근법을 받아들이는 여지가 새로운 시도를 도울 수 있습니다.`
      : `표출의 단서는 ${expressionGod}, 바탕의 단서는 ${rootGod}로 서로 다릅니다. ${FAMILY_ROLES[GOD_FAMILY[expressionGod]]}과 ${FAMILY_ROLES[GOD_FAMILY[rootGod]]}이 한 원국에 함께 있는 셈입니다. ${FAMILY_CONNECTIONS.find(({ pair }) => pair.includes(GOD_FAMILY[expressionGod]) && pair.includes(GOD_FAMILY[rootGod]) && GOD_FAMILY[expressionGod] !== GOD_FAMILY[rootGod])?.text ?? "같은 계열 안에서도 음양이 다른 두 십성은 표현의 결이 달라집니다. 밖으로 결과를 보여주는 방식과 안에서 충분히 익히는 방식이 꼭 같을 필요는 없어요. 그 차이가 내가 잘하는 일을 지속할 수 있는 조건을 찾는 실마리가 됩니다."}`;
  const hiddenDescription = day.hiddenStems.map(stemText).join(" · ");
  const innerLayers =
    day.hiddenStems.length > 1
      ? `일지 ${day.branch}의 지장간에는 ${hiddenDescription}가 함께 있습니다. 첫 글자로 ${innerGod}의 문안을 열었지만 나머지 글자가 사라지는 것은 아닙니다. ${[...new Set(day.hiddenStems.map((stem) => GOD_FAMILY[stem.tenGod]))].map((family) => FAMILY_ROLES[family]).join("과 ")}이라는 관점이 같은 자리의 다른 면으로 놓입니다.`
      : `일지 ${day.branch}의 지장간은 ${hiddenDescription} 한 글자로 구성됩니다. 이 표에서 내용이 한 가지라는 사실을 실제 성격이 단순하다는 뜻으로 바꾸지는 않습니다. 일지의 단서와 다른 기둥의 천간은 서로 다른 자리의 정보를 제공하므로, 같은 사람에게도 상황에 따라 드러나는 방식이 달라질 여지가 있습니다.`;

  const chapters = [
    makeChapter({
      title: "십성으로 읽는 나의 재능",
      lead: `십성은 열 가지 사람 유형이 아니라 일간 ${facts.dayMaster.hanja}를 기준으로 다른 천간이 맺는 열 가지 관계입니다. 이번에는 ${expressionGod}의 표출과 ${rootGod}의 바탕을 출발점으로 재능의 결을 읽습니다.`,
      sections: [
        {
          title: "십성의 이름이 붙는 원리",
          body: `같은 오행인지, 일간이 생하거나 극하는 오행인지, 반대로 일간을 생하거나 극하는 오행인지에 음양의 같고 다름을 더해 이름을 나눕니다. ${expressionReading.meaning} 이름 자체가 장점이나 결함의 판정은 아니며, 원국에서 어느 자리에 놓였는지와 함께 읽는 역할의 언어입니다.`,
        },
        {
          title: "밖으로 드러내는 재능의 단서",
          body: `${visibleSummary}\n\n${expressionReading.talent}`,
        },
        {
          title: "그 재능을 받치는 배움의 방식",
          body: `${rootSource(rootPillar)} ${rootReading.learning}`,
        },
        { title: "표출과 바탕을 함께 읽기", body: rootVersusExpression },
        {
          title: "원국에 함께 놓인 다른 역할",
          body: `확정된 천간과 지장간에서 읽히는 십성은 ${godNames.join("·")}입니다. 천간의 일간 자체는 비교의 기준이므로 여기서 다른 재능 한 개로 더 세지 않았습니다. 지장간은 지지 안에 들어 있는 천간의 구성표이며, 표에 있다는 이유만으로 모든 역할이 같은 크기로 드러난다고 보지 않습니다. 한 가지 이름으로 재능 전체를 닫지 않는 이유가 여기에 있습니다.`,
        },
      ],
      question: `${expressionGod}로 드러내고 ${rootGod}로 받치는 재능. 결과를 내는 방식과 그 결과를 준비하는 방식을 함께 읽어보세요.`,
      evidence: capacityEvidence,
    }),
    makeChapter({
      title: "일과 재물을 대하는 방식",
      lead: `일의 장에서는 ${rootPillar.label}의 ${rootGod}를 일하는 바탕으로, ${expressionSource}를 자원을 다루는 관점으로 읽습니다. 직업명이나 수입을 정하기보다 일을 만들고 유지하는 방식에 초점을 둡니다.`,
      sections: [
        {
          title: "일을 맡고 이어 가는 바탕",
          body: `${rootSource(rootPillar)}\n\n${rootReading.work}`,
        },
        {
          title: "시간과 자원을 보는 시선",
          body: `${expressionSource}의 상징을 자원이라는 주제로 옮기면 다음과 같습니다. ${expressionReading.resources}`,
        },
        {
          title: "내 원국의 재성은 어디에 있는가",
          body: `${moneyDescription}\n\n재성은 일간이 극하는 오행을 뜻하며, 밖의 대상을 다루고 실제 결과로 연결한다는 상징을 가집니다. 편재와 정재의 차이는 음양 관계의 차이입니다. 어느 이름이 더 큰 재산을 뜻하거나 천간에 하나 보인다는 이유로 돈을 잘 번다고 결론내릴 수는 없습니다. 원국에 있는 글자의 위치와 실제 경제적 결과는 구분합니다.`,
        },
        {
          title: "한 가지 역할만으로 일은 완성되지 않는다",
          body: `이번 원국에서 확인한 역할을 일의 흐름으로 배열하면 다음과 같습니다.\n\n${flowDescription}\n\n이는 글자가 서로 실제로 얼마나 힘을 주고받는지 계산한 순위가 아닙니다. 배우고 만들고 관리하고 책임지는 역할이 어떤 구성으로 놓였는지 보는 지도입니다. 특정 역할의 글자가 보이지 않더라도 경험으로 그 일을 할 수 없다는 뜻은 아니며, 실제 일은 환경과 훈련, 맡은 책임 속에서 구체화됩니다.`,
        },
      ],
      question:
        "잘해온 일을 오래 해낼 수 있는 일로, 그 일을 현실의 쓰임으로 이어가는 방식이 이 장의 중심입니다.",
      evidence: uniqueEvidence([
        ...allEvidence,
        rootBasis,
        ...visibleEvidence,
        scopeEvidence,
      ]),
    }),
    makeChapter({
      title: "사람 사이에서 드러나는 나",
      lead: `이번 장에서는 일지 ${day.branch}의 ${innerGod}와 ${expressionSource}를 서로 다른 대인관계의 단서로 읽습니다. 실제 주변 사람의 성격을 추정하는 대신 내 원국 안에 놓인 역할과 연결의 모양을 살펴봅니다.`,
      sections: [
        {
          title: "가까운 생활에서 사용하는 관계의 언어",
          body: `${rootSource(day)}\n\n${innerReading.social}`,
        },
        {
          title: "여럿이 함께할 때 더해지는 관점",
          body: `${expressionSource}는 ${GOD_FAMILY[expressionGod]}에 속합니다. ${FAMILY_SOCIAL[GOD_FAMILY[expressionGod]]}`,
        },
        { title: "지지에 놓인 연결과 차이", body: relationsNarrative(facts) },
        {
          title: "한 자리 안에도 여러 면이 있다",
          body: `${innerLayers}\n\n이 설명은 가족·동료·친구를 같은 방식으로 대한다는 뜻은 아닙니다. 실제 관계에서 맡은 역할과 쌓인 경험이 다르므로 같은 상징도 다르게 읽힐 수 있습니다. 원국에서는 글자의 자리를 구분하고 생활에서는 관계의 상황을 구분할 때, 한 문장으로 자신이나 상대를 판단하는 해석을 피할 수 있습니다.`,
        },
      ],
      question:
        "함께할 때 드러나는 나와 가까운 사이에서 필요한 나. 두 모습을 함께 놓으면 관계를 설명하는 말도 더 구체적이 됩니다.",
      evidence: uniqueEvidence([
        ...allEvidence,
        innerBasis,
        ...visibleEvidence,
        relationEvidence,
        scopeEvidence,
      ]),
    }),
    makeChapter({
      title: "내 사주를 하나의 이야기로",
      lead: `일간 ${facts.dayMaster.hanja}의 이미지에서 시작해 오행의 구성, 십성의 역할, 지지 사이의 관계까지 이어 읽었습니다. 마지막에는 서로 다른 이름을 모아 ${portrait.image}라는 첫 장면에 더 구체적인 맥락을 붙입니다.`,
      sections: [
        {
          title: "중심은 일간, 내용은 원국 전체",
          body: `일간은 ${facts.dayMaster.polarity}·${facts.dayMaster.element}인 ${facts.dayMaster.hanja}이고, 이를 기준으로 읽은 원국은 ${known}입니다. 같은 일간을 가진 사람이 모두 같은 결과를 받는 것은 아닙니다. 함께 놓인 천간의 십성, 지지 안의 구성, 월지의 배경이 달라지기 때문입니다. 첫 장의 성향은 출발점이고 이후의 기둥들이 그 성향을 어떤 관점으로 더 읽을지 알려 주는 재료가 됩니다.`,
        },
        {
          title: facts.season
            ? "계절과 역할이 만나는 지점"
            : "확정된 자리에서 이어 가는 해석",
          body: facts.season
            ? `월지 ${facts.season.monthBranch}의 ${facts.season.name} 배경을 다시 연결해 볼 수 있습니다. ${SEASON_SYNTHESIS[facts.season.name]}`
            : `월주가 확정되지 않은 현재는 ${day.hanja} 일주와 그 안의 ${hiddenDescription}를 중심으로 이야기의 연결점을 잡았습니다. 계절의 힘을 가정하거나 알려지지 않은 월간에 십성 이름을 붙이지 않았습니다. 같은 날짜라도 시각이 확인되면 원국의 다른 자리와 연결해 읽을 수 있으므로, 현재 문안은 알려진 부분에서만 완성한 해석입니다.`,
        },
        {
          title: `${rootGod}가 이야기의 바탕에 놓일 때`,
          body: `${rootSource(rootPillar)} ${rootReading.integration}`,
        },
        {
          title: hour ? "시주가 더하는 또 하나의 관점" : "남겨 둔 시주의 자리",
          body: hour
            ? `시주 ${hour.hanja}의 천간은 ${stemText(hour.stem)}이고 지장간은 ${hour.hiddenStems.map(stemText).join("·")}입니다. ${FAMILY_OUTLOOK[GOD_FAMILY[hour.stem.tenGod]]}`
            : "출생시간을 알지 못해 시주는 비워 두었습니다. 이 빈칸은 특정 성향이 없다는 뜻이 아니라 비교할 자료가 아직 없다는 뜻입니다. 시각을 추정해 글자를 채우면 새 십성이나 합·충을 사실처럼 만들 수 있으므로 지금은 그렇게 하지 않습니다. 이미 확정된 글자에서 읽은 내용은 유지하면서, 시주가 있을 때만 이어지는 관점을 별도로 남겨 두는 방식입니다.",
        },
        {
          title: "이 원국에서 가져갈 핵심",
          body: `${expressionGod}에서 읽은 ${FAMILY_ROLES[GOD_FAMILY[expressionGod]]}, ${rootGod}에서 읽은 ${FAMILY_ROLES[GOD_FAMILY[rootGod]]}, 일지 ${innerGod}에서 읽은 관계의 언어가 이번 이야기의 세 줄기입니다. ${expressionGod === rootGod && rootGod === innerGod ? "같은 이름으로 이어지는 부분도 재능·일·관계라는 서로 다른 주제로 읽었습니다." : "이름이 다른 부분은 한쪽이 진짜이고 다른 쪽이 틀린 것이 아니라 서로 다른 주제를 설명합니다."} 이 문안은 전통 분류를 생활의 언어로 풀어낸 해석 초안입니다. 실제 경험과 닮은 부분은 구체화하고 다른 부분은 남겨 두며 읽을 수 있습니다.`,
        },
      ],
      question: `${portrait.image}에서 시작한 이야기. 타고난 바탕 위에 무엇을 배우고 어떻게 쓰는지가 나의 다음 장을 만듭니다.`,
      evidence: uniqueEvidence([
        dayEvidence,
        ...allEvidence,
        rootBasis,
        innerBasis,
        scopeEvidence,
        ...seasonEvidence,
      ]),
    }),
  ];

  const rules = [
    {
      id: "traditional.day-portrait",
      section: "intro",
      condition: `확정된 일간 ${facts.dayMaster.hanja}에 대응하는 독립적인 십간 초상 문안`,
      evidence: intro.evidence,
    },
    {
      id: "traditional.surface-elements",
      section: "comparison",
      condition: `확정된 기둥의 대표 오행 ${surfaceTotal}글자, ${countText}; 지장간·강약 가중치 제외`,
      evidence: comparison.evidence,
    },
    {
      id: "traditional.talent-anchors",
      section: "talent",
      condition: `표출 단서는 확정된 월간→년간→시간 순서의 첫 천간, 없으면 확정 일지의 첫 지장간: ${expressionSource}. 바탕 단서는 확정 월지, 없으면 일지의 첫 지장간: ${rootPillar.label} ${rootGod}. 이 순서는 강약 판정이 아닌 문안 선택 순서.`,
      evidence: chapters[0].evidence,
    },
    {
      id: "traditional.work-and-resources",
      section: "resources",
      condition: `일: ${rootPillar.label} 첫 지장간 ${rootGod}; 자원: ${expressionSource}; 재성 위치: ${moneyOccurrences.map((item) => `${item.source} ${item.god}`).join(" · ") || "확정된 천간·지장간에 관측 없음"}. 직업·금액·재물 시점 예측 없음.`,
      evidence: chapters[1].evidence,
    },
    {
      id: "traditional.people-and-branches",
      section: "people",
      condition: `일지 첫 지장간 ${innerGod}, 표출 단서 ${expressionGod}, 확정 지지의 모든 육합·충 ${facts.relations.length}쌍을 누락 없이 설명.`,
      evidence: chapters[2].evidence,
    },
    {
      id: "traditional.synthesis",
      section: "synthesis",
      condition: `확정 일간·${rootPillar.label} 첫 지장간·일지 단서를 종합; 월지 ${facts.season?.monthBranch ?? "미확정"}, 시간 ${hour?.stem.hanja ?? "미확정"}은 확정된 경우에만 사용. MBTI·성별·고민 선택은 문안에 사용하지 않음.`,
      evidence: chapters[3].evidence,
    },
  ];

  return {
    intro,
    comparison,
    chapters,
    audit: {
      version: TRADITIONAL_VERSION,
      status: "editorial-draft" as const,
      facts,
      rules,
    },
  };
}
