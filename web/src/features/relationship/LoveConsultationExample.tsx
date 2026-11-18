/** Authored editorial sample, never an AI or user-specific analysis result. */
export default function LoveConsultationExample() {
  return (
    <section
      className="ai-love ai-love--sample"
      aria-labelledby="love-example-title"
    >
      <header className="ai-love-sample-header">
        <span className="ai-love-kicker">여울의 상담실 · 사전 작성 예시</span>
        <h2 id="love-example-title">고민을 함께 풀어가는 방식</h2>
        <p>
          가상의 고민으로 만든 상담 예시예요. 입력한 사주를 분석한 결과나 실시간
          AI 응답이 아니며, 예시를 읽는 동안 외부 AI에 정보를 보내지 않아요.
        </p>
      </header>
      <details className="ai-love-sample-reading">
        <summary>상담 예시 읽기</summary>
        <div className="ai-love-result" data-testid="love-consultation-example">
          <div className="ai-love-my-question">
            <span>예시 속 고민 · 서로 알아가는 사이</span>
            <p>
              연락은 매일 하는데 만나자는 말은 늘 제가 먼저 해요. 답장이
              다정해서 기다리게 되는데, 계속 다가가도 괜찮을까요?
            </p>
          </div>
          <div className="ai-love-answer">
            <span className="ai-love-answer-label">
              여울 · 사전 작성한 상담 예시
            </span>
            <h3>답장의 온도보다, 함께 내는 시간을 봐요</h3>
            <p className="ai-love-opening">
              다정한 연락이 이어지면 기대하는 마음도 커지죠. 지금은 답장이
              얼마나 빠른지보다, 두 사람이 실제로 시간을 내고 있는지 살펴볼
              때예요. 대화를 이어가는 일과 관계를 앞으로 움직이는 일을 모두 혼자
              맡고 있지는 않은지부터 확인해보세요.
            </p>
            <section className="ai-love-answer-section">
              <h4>
                <span aria-hidden="true">01</span>기다림이 불안해지는 지점
              </h4>
              <p>
                먼저 연락하는 게 늘 싫은 것은 아닐 거예요. 내가 다가가면 상대도
                반겨준다는 느낌이 있다면 기꺼이 먼저 손을 내밀 수 있죠.
                힘들어지는 순간은 ‘내가 멈추면 이 관계도 끝날까?’라는 생각이 들
                때예요. 이때 필요한 건 더 매력적인 답장을 고민하는 일보다,
                상대도 관계를 이어갈 의지가 있는지 확인할 기회예요.
              </p>
            </section>
            <section className="ai-love-answer-section">
              <h4>
                <span aria-hidden="true">02</span>한 번은 구체적으로 제안해봐요
              </h4>
              <p>
                “언제 한번 보자” 대신 “나는 이번 토요일 오후가 괜찮은데, 같이
                커피 마실래?”라고 말해보세요. 그날이 안 된다는 답만으로 마음이
                없다고 결론 내릴 필요는 없어요. 상대가 다른 날짜를 제안하는지,
                바쁜 일정이 끝난 뒤 먼저 이야기를 꺼내는지가 더 도움이 되는
                단서예요.
              </p>
              <p>
                반대로 구체적인 제안을 계속 피하고 대안도 내놓지 않는다면,
                지금은 내가 원하는 만큼 가까워질 준비가 서로 다를 수 있어요.
                다정한 말 한 번보다 반복되는 행동을 기준으로 보세요.
              </p>
            </section>
            <section className="ai-love-answer-section">
              <h4>
                <span aria-hidden="true">03</span>내 마음에도 기준을 만들어줘요
              </h4>
              <p>
                상대의 속도를 존중하는 것과 끝없이 기다리는 것은 달라요. 한 번
                분명하게 제안한 뒤에는 답을 대신 만들어내려 애쓰지 않아도 돼요.
                대화가 즐거운지, 내가 편하게 원하는 것을 말할 수 있는지, 서로
                실제 시간을 내는지 함께 살펴보세요. 관계를 이어가는 동안 내
                생활과 약속도 그대로 지켜주세요.
              </p>
            </section>
            <blockquote className="ai-love-takeaway">
              <span>이 예시에서 가져갈 한 가지</span>
              <p>
                이번에는 구체적인 만남을 한 번 제안하고, 상대도 다음 걸음을 함께
                만드는지 확인해보세요.
              </p>
            </blockquote>
          </div>
        </div>
      </details>
    </section>
  );
}
