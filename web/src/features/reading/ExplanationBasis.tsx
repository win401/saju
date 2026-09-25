import type { ReadingEvidence } from "@/types/reading";

const kinds = {
  chart: "사주 구성",
  mbti: "내가 입력한 유형",
  focus: "내가 고른 장면",
};

export default function ExplanationBasis({
  evidence,
}: {
  evidence: ReadingEvidence[];
}) {
  // A dev hot reload can retain a preview generated before evidence was added.
  if (!evidence?.length) return null;
  return (
    <details className="reading-evidence">
      <summary>
        이렇게 읽은 이유 <span>{evidence.length}가지 단서</span>
      </summary>
      <p className="evidence-intro">
        계산으로 확인한 구성과 직접 입력한 정보를 구분해 볼 수 있어요. 생활의
        언어로 풀어쓴 해석 문안은 검수 중입니다.
      </p>
      <ul>
        {evidence.map((item) => (
          <li key={`${item.kind}-${item.label}-${item.detail}`}>
            <span className="evidence-kind">{kinds[item.kind]}</span>
            <strong>{item.label}</strong>
            <p>{item.detail}</p>
          </li>
        ))}
      </ul>
    </details>
  );
}
