import { koreanParticle } from "../../../lib/korean-particle";
import type {
  BirthInput,
  Chart,
  Chapter,
  ChapterSection,
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

import { GOD_STORIES } from "./god-stories";
import { STEM_PORTRAITS } from "./stem-portraits";

// Keep one canonical text representation for audits/exports; the UI renders sections.
function chapter(
  data: Omit<Chapter, "body"> & { lead: string; sections: ChapterSection[] },
): Chapter {
  return {
    ...data,
    body: [data.lead, ...data.sections.map((section) => section.body)].join(
      "\n\n",
    ),
  };
}

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
  const { facts, pace, expression, boundary, anchors } = plan;
  const concern = input.focus ? CONCERNS[input.focus] : null;
  const preference = mbtiPreferences(input.mbti);
  const mbtiEvidence: ReadingEvidence[] = input.mbti
    ? [
        {
          kind: "mbti",
          label: "직접 선택한 성격 유형",
          detail: `사용자가 입력한 유형은 ${input.mbti}입니다. 출생정보로 유형을 추정하거나 사주와 합산한 점수를 만들지 않았어요.`,
        },
      ]
    : [];
  const focusEvidence: ReadingEvidence[] = concern
    ? [
        {
          kind: "focus",
          label: "이번 이야기의 관심 장면",
          detail: `사용자가 ‘${concern.title}’${koreanParticle(concern.title, "을/를")} 선택했어요. 사주에서 알아낸 고민이 아니라 직접 고른 관심사예요.`,
        },
      ]
    : [];
  const dayEvidence: ReadingEvidence = {
    kind: "chart",
    label: "나를 읽는 기준: 일간",
    detail: `일주 ${chart.pillars.day.hanja}(${chart.pillars.day.korean}), 일간 ${facts.dayMaster.hanja}(${facts.dayMaster.korean})${koreanParticle(facts.dayMaster.korean, "은/는")} ${facts.dayMaster.polarity}·${facts.dayMaster.element}입니다.`,
  };
  const portrait = STEM_PORTRAITS[facts.dayMaster.hanja];
  const innerGod = anchors.day.hiddenStems[0].tenGod;
  const paceGod = anchors.pace.hiddenStems[0].tenGod;
  const outerGod = anchors.expressionGod;
  const inner = GOD_STORIES[innerGod];
  const rhythm = GOD_STORIES[paceGod];
  const voice = GOD_STORIES[outerGod];
  const innerEvidence: ReadingEvidence = {
    kind: "chart",
    label: "가까운 사이를 읽는 단서: 일지 지장간",
    detail: `일지 ${anchors.day.branch}의 첫 지장간 ${anchors.day.hiddenStems[0].hanja}(${anchors.day.hiddenStems[0].korean})${koreanParticle(anchors.day.hiddenStems[0].korean, "은/는")} ${innerGod}입니다. 이 글자를 친밀감 이야기의 편집 단서로 골랐어요. 배우자의 성격이나 궁합을 판정한 것은 아닙니다.`,
  };
  const scene = concern
    ? `이번에 고른 장면은 ‘${concern.scene}’${koreanParticle(concern.scene, "이에요/예요")}.`
    : "이번 이야기는 설렘이 시작되는 순간부터, 마음을 전하고 차이를 조율하는 순간까지 이어집니다.";
  const paceSource = `${anchors.pace.label} ${anchors.pace.hanja}의 지지 ${anchors.pace.branch} 안의 지장간은 ${anchors.pace.hiddenStems.map((stem) => `${stem.hanja}(${stem.tenGod})`).join("·")}입니다. 여기서는 첫 글자의 ${paceGod}${koreanParticle(paceGod, "을/를")} 관계가 가까워지는 방식으로 풀었습니다.`;
  const voiceSource =
    anchors.expression.key === "day"
      ? `다른 기둥이 확정되지 않아 일지의 지장간 ${outerGod}에서 표현의 단서를 읽어요.`
      : `${anchors.expression.label} ${anchors.expression.hanja}의 천간 ${anchors.expression.stem.hanja}${koreanParticle(anchors.expression.stem.korean, "은/는")} 일간을 기준으로 ${outerGod}에 해당해요.`;

  const intro = chapter({
    title: `${chart.pillars.day.korean} 일주, ${IMAGES[chart.dayElement]}의 이미지`,
    lead: portrait.headline,
    sections: [
      {
        title: `${facts.dayMaster.korean}(${facts.dayMaster.hanja}), ${portrait.image}`,
        body: `나를 읽는 기준인 일간은 ${facts.dayMaster.hanja}(${facts.dayMaster.korean}), ${facts.dayMaster.polarity}의 ${chart.dayElement}입니다. 태어난 날의 두 글자를 함께 부르면 ${chart.pillars.day.korean} 일주예요.\n\n${portrait.portrait}`,
      },
      { title: "관계 안에서 빛나는 매력", body: portrait.charm },
      {
        title: "겉으로 보이는 나, 가까워진 뒤의 나",
        body: `일간이 첫 이미지라면, 일지 ${anchors.day.branch} 속 첫 지장간 ${anchors.day.hiddenStems[0].hanja}의 ${innerGod}${koreanParticle(innerGod, "은/는")} 가까운 사이를 읽는 또 하나의 단서예요. ${inner.meaning}\n\n${portrait.tension}`,
      },
      {
        title: "여울이 건네는 첫 장의 말",
        kind: "voice",
        body: `${portrait.invitation}\n\n${scene}`,
      },
    ],
    question:
      concern?.question ??
      "마음이 끌리는 사람과 함께 있을 때 편안한 사람은 어떤 점이 같고, 어떤 점이 다른가요?",
    evidence: [dayEvidence, innerEvidence, ...focusEvidence],
  });

  const comparison = chapter(
    preference
      ? {
          title: `MBTI 유형 ${input.mbti}, ${chart.pillars.day.korean} 일주와 나란히 읽기`,
          lead: `보이는 표현과 속으로 바라는 것이 같을까요? ‘${expression.title}’${koreanParticle(expression.title, "을/를")} ${input.mbti}의 시선과 함께 읽어볼게요.`,
          sections: [
            {
              title: "사주가 붙여준 표현의 키워드",
              body: `${voiceSource} ${voice.meaning}\n\n이번 구성에서 고른 주제는 ‘${expression.title}’입니다. 마음을 어떻게 내보내는지와 상대가 어떻게 받아들이는지는 서로 다른 장면이 될 수 있어요. 같은 ‘좋아해’라는 말에도 확인받고 싶은 것과 건네고 싶은 것이 함께 담깁니다.`,
            },
            {
              title: "같은 마음도 밖으로 나오는 순서는 다르게",
              body:
                input.mbti?.[0] === "I"
                  ? `입력한 ${input.mbti}의 I 선호로 읽으면, 먼저 혼자 마음의 이름을 정한 뒤 상대에게 전하는 장면이 떠오릅니다. ${outerGod}의 표현 키워드가 있어도 실제 말은 늦게 나올 수 있어요. 예를 들어 만남이 즐거웠어도 집으로 돌아온 뒤에야 “오늘 좋았어”라는 문장이 완성되는 식이죠. 조용했던 시간과 마음이 없었던 시간은 같지 않습니다.`
                  : `입력한 ${input.mbti}의 E 선호로 읽으면, 대화를 주고받으며 마음의 모양이 선명해지는 장면이 떠오릅니다. ${outerGod}의 표현 키워드에 이런 소통 순서를 겹쳐 읽는 거예요. 예를 들어 “다음에 또 만나자”라는 말을 꺼낸 뒤 대화가 이어지면서 어떤 만남을 원하는지 더 구체적으로 알게 될 수 있죠. 말이 시작되었다고 마음의 결론까지 모두 정해진 것은 아닙니다.`,
            },
            {
              title: "서운한 날, 서로 다른 자막이 붙는다면",
              kind: "scene",
              body:
                input.mbti?.[2] === "F"
                  ? `예를 들어 “오늘 많이 힘들었어”라고 했는데 상대가 바로 해결책을 나열하는 장면이에요. F 선호의 관점에서는 도움의 정확성보다 내 마음이 먼저 받아들여졌는지가 크게 느껴질 수 있습니다. 사주에서 읽은 ‘${expression.title}’도 이 대화에서는 표현 방식의 차이로 나타날 여지가 있어요. 듣고 싶은 말이 “그랬구나”인지, “같이 해결해보자”인지 한마디를 더하면 같은 호의가 어긋나지 않을 틈이 생깁니다.`
                  : `예를 들어 상대가 같은 고민을 여러 번 이야기해서 바로 해결 방법을 제안한 장면이에요. T 선호의 관점에서는 문제를 줄여주는 것이 마음을 쓰는 방식일 수 있습니다. 사주에서 읽은 ‘${expression.title}’도 이 대화에서는 표현 방식의 차이로 나타날 여지가 있어요. 상대는 아직 상황을 설명하는 중일 수 있으니 “들어줬으면 해, 같이 방법을 찾았으면 해?”라는 한 문장으로 도움의 방향부터 맞출 수 있습니다.`,
            },
            {
              title: "둘을 함께 읽었을 때 남는 발견",
              body: `${input.mbti?.[1] === "N" ? "N 선호는 말 뒤의 의미와 앞으로의 가능성을 연결하는 쪽으로 읽습니다. 상대가 짧게 답한 날, 그 한마디가 관계 전체의 의미로 커지지는 않는지가 읽어볼 지점이에요." : "S 선호는 실제로 한 말과 구체적인 행동에서 의미를 확인하는 쪽으로 읽습니다. 상대의 추상적인 약속보다 어느 날 무엇을 함께했는지가 더 선명한 단서가 될 수 있어요."}\n\n${input.mbti?.[3] === "J" ? "J 선호의 계획과 약속은 애정을 눈에 보이게 만드는 도구가 될 수 있습니다. 다만 일정이 달라졌을 때 마음까지 바뀌었다고 해석하기 전에, 그 변화가 사정의 변화인지 관계의 변화인지 대화로 구분할 여지가 있어요." : "P 선호의 여지는 관계가 그날의 기분과 사정에 맞춰 움직이도록 도울 수 있습니다. 다만 열어둔 선택이 상대에게는 모호함으로 들릴 수 있으니, 자유롭게 바꿀 부분과 이미 약속한 부분을 구분하면 서로의 기대가 선명해집니다."}`,
            },
          ],
          question:
            "내가 마음을 전했다고 느낀 순간과 상대가 마음을 받았다고 느낀 순간은 같았나요?",
          evidence: [...expression.evidence, ...mbtiEvidence],
        }
      : {
          title:
            input.theme === "love"
              ? "겉으로 전하는 마음과 가까운 사이의 나"
              : "유형을 몰라도, 나의 이야기는 계속됩니다",
          lead: `첫인상만으로 다 설명되지 않는 마음. ${chart.pillars.day.korean} 일주 안쪽의 이야기를 한 겹 더 읽어볼게요.`,
          sections: [
            {
              title: "마음을 드러내는 쪽의 단서",
              body: `${input.theme === "love" ? "이번에는 마음을 드러내는 방식과 가까운 사이에서 바라는 것을 이어 읽어요." : "유형을 선택하지 않아 유형 비교는 생략하고, 사주의 두 층을 이어 읽어요."} ${voiceSource} ${voice.meaning} 이번 구성의 표현 주제는 ‘${expression.title}’입니다.`,
            },
            {
              title: "가까운 사이에서 바라는 것",
              body: `일지 ${anchors.day.branch}의 ${innerGod}${koreanParticle(innerGod, "을/를")} 친밀감의 관점으로 옮기면 다음과 같은 이야기가 됩니다. ${inner.need}`,
            },
            {
              title: "표현과 기대가 만나는 자리",
              body:
                outerGod === innerGod
                  ? `이번에 선택한 표현의 단서와 일지의 단서는 모두 ${innerGod}${koreanParticle(innerGod, "으로/로")} 만납니다. 같은 단어를 두 자리에서 읽지만, 하나는 마음을 건네는 방식이고 다른 하나는 관계에서 편안함을 찾는 질문이에요. 내가 좋아서 해준 방식을 상대도 좋아할 것이라 여기기 쉬운 장면을 생각할 수 있습니다. 닮은 표현에도 각자가 바라는 반응은 다를 수 있죠.`
                  : `표현에서는 ${outerGod}, 가까운 사이의 단서에서는 ${innerGod}${koreanParticle(innerGod, "을/를")} 골랐어요. 서로 다른 키워드를 가졌다는 것은 이 이야기 안에서 ‘내가 건네는 방식’과 ‘돌려받고 싶은 방식’을 구분해 읽을 기회가 됩니다. 먼저 약속을 잡는 행동이 내 표현이어도, 돌아오는 답에서는 일정의 확정보다 반가운 한마디를 기대하는 식의 차이예요.`,
            },
            {
              title: "둘 사이에 번역이 필요한 순간",
              kind: "scene",
              body: "예를 들어 상대를 위해 일정을 비워두었는데, 정작 상대는 만나서 더 많은 말을 나누고 싶어 했다고 해볼게요. 한쪽은 시간을 내는 것으로, 다른 쪽은 대화가 이어지는 것으로 애정을 확인한 셈입니다. 누가 덜 좋아했는지부터 따지면 서로의 표현을 놓치기 쉬워요. ‘나는 이 행동으로 마음을 전했어’와 ‘너는 어떤 순간에 느꼈어’를 나란히 말하면 보이지 않던 차이가 드러납니다.",
            },
          ],
          question: "내가 주기 쉬운 애정과 받고 싶은 애정은 어떻게 다른가요?",
          evidence: [...expression.evidence, innerEvidence],
        },
  );

  const season = facts.season
    ? `태어난 월지 ${facts.season.monthBranch}(${facts.season.monthBranchKorean})${koreanParticle(facts.season.monthBranchKorean, "은/는")} 이번 계절 구분에서 ${facts.season.name}에 놓입니다. 계절은 이 장의 배경으로 두고, 구체적인 관계 이야기는 지장간의 십성에서 이어갈게요.`
    : "출생시간이 알려지지 않은 절기 경계라 월주를 확정하지 못했어요. 계절을 추정하지 않고 확인된 일지의 단서로 이 장을 읽습니다.";
  const boundaryStories = {
    "boundary.mixed": {
      title: "붙잡고 싶은 마음과 지키고 싶은 차이가 함께 있을 때",
      scene:
        "예를 들어 만나면 즐겁고 자주 보고 싶은데, 만날 날짜를 정하는 순간마다 피곤해지는 관계를 생각해볼게요. 함께 있고 싶은 마음은 충분한데 한 사람은 미리 정해야 편하고 다른 사람은 여지를 두어야 편할 수 있죠. 이 장면에서 다툼의 주제는 애정의 크기보다 관계를 운영하는 방식에 가깝습니다. 가까움을 원하는 마음이 클수록 이런 차이를 더 빨리 없애고 싶어질 수도 있어요.",
      strength:
        "이 장에서 합은 연결되는 방향을, 충은 서로 다른 방향이 맞서는 모습을 읽는 상징입니다. 두 단서가 함께 있으면 친밀함을 위해 모든 차이를 지워야 한다는 결론 대신, 함께할 것과 달라도 되는 것을 구분하는 이야기가 됩니다. 좋아하는 이유가 있다는 것과 조율할 일이 있다는 것은 한 관계 안에서 동시에 성립할 수 있어요.",
      repair:
        "먼저 지키고 싶은 가까움을 말하고, 그다음 바꾸고 싶은 방식 하나를 붙여보세요. ‘너와 만나는 건 좋아. 다만 일정이 당일에 바뀌면 나는 지쳐. 바뀌는 날엔 언제쯤 알 수 있을까?’처럼요. 관계 전체를 평가하는 말보다 한 번의 약속을 다루는 말이 두 사람이 다시 합의할 자리를 만듭니다.",
    },
    "boundary.clash": {
      title: "마음보다 먼저, 서로의 리듬이 부딪힌다면",
      scene:
        "예를 들어 중요한 이야기를 지금 끝내고 싶은 사람과 잠깐 쉬고 돌아오고 싶은 사람이 있다고 해볼게요. 한쪽의 ‘지금 말하자’는 해결 의지인데, 다른 쪽에는 몰아붙이는 말로 들릴 수 있어요. 반대로 ‘나중에 말하자’는 생각할 시간을 달라는 말인데, 회피처럼 들릴 수 있죠. 같은 문제를 풀려는 마음이 있어도 대화의 시점에서 먼저 어긋나는 장면입니다.",
      strength:
        "충은 이 글에서 서로 다른 방향을 살피는 단서입니다. 차이가 눈에 잘 띄는 장면에는 오히려 무엇을 조율할지 구체화할 여지도 있어요. 연락의 횟수인지, 대화의 시점인지, 약속이 바뀌는 방식인지 이름을 붙이면 ‘우린 원래 안 맞아’라는 큰 결론에서 실제로 바꿀 수 있는 작은 행동으로 돌아올 수 있습니다.",
      repair:
        "잠깐 멈추는 쪽은 돌아올 시간을 함께 말하고, 바로 풀고 싶은 쪽은 기다릴 수 있는 범위를 말해보세요. ‘지금은 말이 날카로워질 것 같아. 오늘 저녁에 다시 이야기하자’처럼 중단과 복귀를 한 문장에 담는 방식입니다. 중요한 것은 누가 더 빨리 결론을 냈는지가 아니라, 정한 대화로 실제로 돌아오는지예요.",
    },
    "boundary.combination": {
      title: "잘 맞는다는 느낌 뒤에, 말하지 않은 기대가 쌓인다면",
      scene:
        "예를 들어 늘 주말을 함께 보내다가 어느 날 한 사람이 혼자 쉬고 싶다고 했다고 해볼게요. 한쪽에는 자연스러운 휴식이지만, 다른 쪽에는 약속이 깨진 느낌일 수 있어요. 늘 함께해왔다는 사실이 어느 순간 ‘앞으로도 그래야 한다’는 기대가 된 셈이죠. 편안한 사이일수록 새로 설명할 필요를 놓치기 쉬운 장면입니다.",
      strength:
        "합은 이 글에서 서로 이어지는 모습을 읽는 상징입니다. 연결되는 느낌을 소중히 여기면서도 그 연결을 유지하는 방식은 새로 정할 수 있어요. 말하지 않아도 통했던 순간은 좋은 기억이지만, 앞으로의 모든 부탁에 동의했다는 뜻까지 담고 있지는 않아요. 가까운 사이에서도 선택을 물어주는 태도가 친밀함에 여유를 만듭니다.",
      repair:
        "혼자만의 시간을 말할 때에는 관계를 밀어내는 설명보다 내 상태와 다음 만남을 함께 전해보세요. ‘오늘은 쉬고 싶어. 너와 보내는 시간이 싫어진 건 아니고, 다음 만남에는 더 여유 있게 있고 싶어’처럼요. 기다리는 쪽도 짐작한 결론을 먼저 말하기보다 무엇을 기대했는지 설명하면, 가까움을 지키면서 일상을 다시 조율할 수 있습니다.",
    },
    "boundary.day-root": {
      title: "마음의 기준을 읽는 또 하나의 단서",
      scene:
        "예를 들어 어디서 만날지 물을 때마다 ‘아무 데나 좋아’라고 답한 장면을 생각해볼게요. 상대는 선택을 존중받는다고 느끼고, 나는 언젠가 내 취향도 먼저 물어주기를 기다릴 수 있어요. 겉으로 다투지 않아도 말하지 않은 기대는 남습니다. 평온한 대화 안에서 누가 결정을 맡고 누가 따라가는지 살피면 다른 이야기가 보이기도 해요.",
      strength: `확인된 기둥에서 이번 엔진이 다루는 육합·충 쌍을 선택하지 못했어요. 그래서 관계가 순탄하다고 결론 내리지 않고, 일지의 ${innerGod}${koreanParticle(innerGod, "과/와")} ‘${boundary.title}’${koreanParticle(boundary.title, "이라는/라는")} 주제로 기준을 읽습니다. 원국에 특정 쌍이 없다는 사실보다 실제 관계에서 무엇을 원하고 어떻게 말하는지가 이 장의 중심이에요.`,
      repair:
        "양보를 그만두겠다는 큰 선언보다 다음 선택 하나에서 내 의견을 먼저 말해보세요. ‘지난번에는 네가 고른 곳에 갔으니, 이번에는 내가 가보고 싶었던 곳은 어때?’처럼 작고 분명한 제안이면 충분합니다. 상대에게 마음을 맞힐 숙제를 주는 대신, 함께 결정할 재료를 하나 건네는 방식이에요.",
    },
  };
  const boundaryStory =
    boundaryStories[boundary.ruleId as keyof typeof boundaryStories];
  const relationSource = boundary.evidence
    .map((item) => item.detail.split(". ")[0] + ".")
    .join(" ");
  const experimentSource =
    input.focus === "expression"
      ? expression
      : input.focus === "boundary"
        ? boundary
        : pace;
  const experimentGod =
    input.focus === "expression"
      ? outerGod
      : input.focus === "boundary"
        ? innerGod
        : paceGod;
  const experimentStory = GOD_STORIES[experimentGod];
  const experimentEvidence = [
    ...experimentSource.evidence,
    ...(input.focus === "boundary" ? [innerEvidence] : []),
    dayEvidence,
    ...focusEvidence,
  ];
  const chapters = [
    chapter({
      title: "가까워지는 나만의 속도",
      lead: `누군가에게 끌리는 순간과 내 사람이라고 느끼는 순간. 그 사이를 ‘${pace.title}’${koreanParticle(pace.title, "이라는/라는")} 주제로 읽습니다.`,
      sections: [
        {
          title: `${paceGod}${koreanParticle(paceGod, "으로/로")} 읽는 관계의 시작`,
          body: `${paceSource} ${rhythm.meaning}\n\n${season}`,
        },
        { title: "마음이 먼저 움직이는 순간", body: rhythm.attraction },
        { title: "호감이 편안한 사이로 바뀌기까지", body: rhythm.bond },
        { title: "만약, 이런 데이트라면", body: rhythm.scene, kind: "scene" },
        {
          title: "설렘 뒤에 필요한 안심",
          body: `${!preference && innerGod === paceGod ? `앞 장의 친밀감과 이 장의 속도에서 같은 ${paceGod}${koreanParticle(paceGod, "을/를")} 골랐어요. 앞에서는 내가 바라는 안심을 읽었다면, 여기서는 그 안심이 두 사람의 일상에 어떻게 자리 잡는지가 중요합니다. 첫 만남의 강렬함이 잦아든 뒤에도 작은 약속을 이어갈 수 있는지, 바쁜 날의 사정을 설명할 여지가 있는지가 다른 층의 이야기예요.` : rhythm.need}\n\n${preference ? `${preference.energy}, 그리고 ${preference.structure}를 떠올려 보세요. 이 두 질문이 연락과 약속의 간격을 정하는 데 도움이 될 수 있어요. 좋아하는 감정과 하루에 쓸 수 있는 시간은 다르기 때문에, 마음이 생긴 속도를 매일의 일정에 그대로 맞추지 않아도 괜찮아요.` : "처음 자주 만났다는 이유만으로 그 간격을 계속 유지해야 하는 것은 아니에요. 서로의 일정에 관계가 자리 잡는 과정에는 바쁜 날의 연락 방식처럼 작고 현실적인 합의도 필요합니다."}`,
        },
        {
          title: "여울의 한마디",
          kind: "voice",
          body: `${input.focus === "distance" ? `${scene} ` : ""}가까워지는 속도는 마음을 증명하는 시험이 아니에요. 누가 먼저 더 많이 내어주었는지보다, 둘 다 다음 만남을 기다릴 여유가 남는지에 이 장의 초점을 두어도 좋아요.`,
        },
      ],
      question:
        "설레는 만남이 오래 편안하려면, 두 사람 사이에 어떤 간격이 필요할까요?",
      evidence: [
        ...pace.evidence,
        ...mbtiEvidence,
        ...(input.focus === "distance" ? focusEvidence : []),
      ],
    }),
    chapter({
      title: "마음을 전하는 방법",
      lead: `마음은 분명한데, 상대에게는 다른 뜻으로 들리는 순간. ‘${expression.title}’의 이야기는 여기서 시작돼요.`,
      sections: [
        {
          title: "내 표현에 붙은 사주의 이름",
          body: `${voiceSource} 첫 비교 장에서 표현의 이름을 읽었다면, 여기서는 그 마음이 상대에게 닿는 순간까지 이어갑니다.\n\n${expression.body}`,
        },
        {
          title: "내 진심에 다른 자막이 붙는 이유",
          body: voice.misunderstanding,
        },
        {
          title: "말을 바꾸기 전에, 순서를 바꿔본다면",
          body: `${voice.repair}\n\n${preference ? `선택한 유형을 바탕으로 ${preference.perception}, 그리고 ${preference.decision}를 살펴봐요. 같은 사건을 이야기해도 한 사람은 상황 설명을, 다른 사람은 마음의 확인을 먼저 원할 수 있습니다. 대화의 시작 순서를 알려주면 상대가 무엇부터 들어야 하는지 이해하기 쉬워져요.` : "어떤 날에는 공감이 먼저, 어떤 날에는 방법을 함께 찾는 일이 먼저 필요할 수 있어요. 평소와 다른 도움이 필요한 날에는 그날의 요청을 새로 말해도 괜찮습니다."}`,
        },
        {
          title: "이렇게 대사가 달라질 수 있어요",
          kind: "scene",
          body: `뜻이 흐려지는 시작: “그걸 꼭 내가 말해야 알아?”\n\n마음이 보이는 시작: “${voice.phrase}”\n\n첫 문장은 상대에게 내가 서운하다는 사실은 전하지만, 무엇이 필요한지는 남겨둡니다. 두 번째 문장은 내 마음과 상대가 답할 자리를 함께 열어요. 실제 대화에서는 내 경험에 맞는 사건 하나를 앞에 붙여 말하면 추상적인 평가보다 이해하기 쉬운 요청이 됩니다.`,
        },
        {
          title: "말한 뒤의 반응까지 읽기",
          body: `${input.focus === "expression" ? `${scene} ` : ""}한 번의 대답만으로 진심이 전달되었는지 결정하기는 어려워요. 상대가 내 말을 자기 말로 어떻게 이해했는지, 이후 행동에서 무엇이 달라지는지를 함께 볼 수 있습니다. 바로 좋은 답이 나오지 않아도 대화로 이해가 달라지는 관계인지가 더 오래 남는 단서예요.`,
        },
      ],
      question:
        input.mbti?.[2] === "F"
          ? "내 마음을 알아달라는 말 뒤에, 사실은 어떤 한 가지 부탁이 있었나요?"
          : input.mbti?.[2] === "T"
            ? "방법을 제안하기 전에, 상대가 어떤 마음이었는지 듣는 한마디를 더할 수 있을까요?"
            : "내가 전하고 싶은 마음과 상대에게 바라는 행동을 각각 말할 수 있나요?",
      evidence: [
        ...expression.evidence,
        ...mbtiEvidence,
        ...(input.focus === "expression" ? focusEvidence : []),
      ],
    }),
    chapter({
      title: "좋아하는데 자꾸 어긋나는 순간",
      lead: boundaryStory.title,
      sections: [
        {
          title: "내 원국에서 확인한 연결과 차이",
          body: `${relationSource}\n\n${boundaryStory.strength}`,
        },
        {
          title: "좋아하는 사이에도 생길 수 있는 장면",
          kind: "scene",
          body: boundaryStory.scene,
        },
        {
          title: "갈등이 커지는 말, 작아지는 주제",
          body: "‘너는 항상 그래’라는 말이 나오면 대화의 주제는 이번 행동에서 상대의 사람됨으로 커집니다. 그러면 상대는 내 불편함을 듣기보다 자신을 방어하기 쉬워져요. 같은 일이 반복되어 지쳤더라도, 이번에 어떤 행동이 힘들었는지와 다음에 무엇이 달라지면 좋을지를 나누면 서로 답할 수 있는 질문이 남습니다.\n\n한 번의 실수와 반복되는 약속 위반도 같은 무게로 다루지 않아도 됩니다. 사과의 표현만큼 이후 행동이 달라졌는지가 중요하고, 내가 설명을 더 잘하면 모든 문제가 해결된다고 혼자 책임질 필요는 없어요.",
        },
        { title: "다시 가까워질 자리를 만드는 말", body: boundaryStory.repair },
        {
          title: "관계를 지키면서 나도 남겨두기",
          kind: "voice",
          body: `${input.focus === "boundary" ? `${scene} ` : ""}좋아한다는 이유로 불편함이 사라지지는 않아요. 이해해주는 일과 동의하는 일 사이에 여지를 남겨도 됩니다. 서로 다른 점을 꺼냈을 때 둘 다 설명할 기회를 갖는지, 정한 기준이 한쪽에만 적용되지는 않는지에서 그 관계의 실제 모습을 더 구체적으로 볼 수 있어요.`,
        },
      ],
      question:
        "내가 바라는 변화는 상대의 성격 전체인가요, 아니면 함께 정할 수 있는 행동 하나인가요?",
      evidence: [
        ...boundary.evidence,
        ...(input.focus === "boundary" ? focusEvidence : []),
      ],
    }),
    chapter({
      title: "나에게 맞는 사랑의 방식",
      lead: `누구를 만나야 하는가보다, 어떤 관계 안에서 내 마음이 편안히 드러나는가. ‘${experimentSource.title}’에서 마지막 이야기를 이어갑니다.`,
      sections: [
        {
          title: "내가 작아지지 않아도 이어지는 관계",
          body: `이번에는 ${experimentGod}의 키워드를 일상의 관계 방식으로 옮겨볼게요. ${experimentStory.fit}`,
        },
        {
          title: "내 쪽에서 바꿔볼 수 있는 한 가지",
          body: experimentStory.practice,
        },
        {
          title: concern
            ? `‘${concern.title}’ 장면에 적용한다면`
            : "다음 만남에 가져갈 작은 시도",
          kind: "practice",
          body: `${concern?.action ?? experimentSource.action}\n\n여기에 앞에서 읽은 ${experimentGod}의 방식을 더해보세요. 정해진 문장을 그대로 외우기보다, 내게 중요한 것을 한 가지 남기고 나머지는 상대가 답할 수 있는 여지로 두는 거예요. 같은 관심사를 골랐어도 어떤 마음을 먼저 설명할지는 각자의 이야기에서 달라집니다.`,
        },
        {
          title: "나의 말로 완성하는 대사",
          kind: "scene",
          body: `“${experimentStory.phrase}”\n\n${concern ? `고른 장면에 이어 붙일 말: “${concern.phrase}”` : "상대에게 이어서 물을 말: “너에게도 편한 방식인지 듣고 싶어.”"}\n\n말을 꺼내기 좋은 때는 상대를 시험하고 싶은 순간보다 서로 대답할 여유가 있는 때예요. 어색하다면 메시지로 먼저 대화할 시간을 정해도 좋습니다. 중요한 것은 완벽한 표현 한 번보다 말한 뒤에도 서로의 설명을 이어갈 수 있는가예요.`,
        },
        {
          title: "여울이 마지막으로 남기는 말",
          kind: "voice",
          body: `처음에는 ‘${portrait.image}’ 이미지로 당신의 이야기를 열었어요. 여기까지 읽고 나면 그 이미지에 실제로 중요하게 여기는 약속, 받고 싶은 말, 지키고 싶은 시간이 조금 더 구체적으로 붙어 있을 거예요.\n\n설명과 닮은 장면은 가져가고 다른 장면은 그대로 남겨두어도 괜찮아요. 이 리포트에서 가장 오래 남길 것은 누군가를 맞히는 문장이 아니라, 내 마음을 전보다 분명히 설명할 수 있는 나만의 말입니다.`,
        },
      ],
      question:
        concern?.question ??
        "다음 대화에서 나의 마음을 조금 더 정확히 전할 한 문장은 무엇인가요?",
      evidence: experimentEvidence,
    }),
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
        {
          id: "intimacy.day-root",
          section: "intro",
          condition: `${RULE_CATALOG["intimacy.day-root"]} — ${anchors.day.branch}의 ${innerGod}`,
          evidence: [innerEvidence],
        },
        ...focusRecord("intro"),
        record(expression, "comparison"),
        ...(!preference
          ? [
              {
                id: "intimacy.day-root",
                section: "comparison",
                condition: `일지 ${anchors.day.branch}의 ${innerGod}`,
                evidence: [innerEvidence],
              },
            ]
          : []),
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
          id: "intro.day",
          section: "experiment",
          condition: "확정된 일간의 이미지로 첫 장과 연결",
          evidence: [dayEvidence],
        },
        ...(input.focus === "boundary"
          ? [
              {
                id: "intimacy.day-root",
                section: "experiment",
                condition: `일지 ${anchors.day.branch}의 ${innerGod}${koreanParticle(innerGod, "을/를")} 마지막 장의 관계 방식·실천·대사에 사용`,
                evidence: [innerEvidence],
              },
            ]
          : []),
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
