# 살아 있는 만화 첫 장면

작업일: 2026-09-27. 상태: **로컬 시안 구현 / 사용자 시각 검토 대기**. production 배포는 이번 작업에서 변경하지 않았다.

후속 기록: 2026-11-18 포트폴리오 정리에서 이 모션 시안을 포함해 배포했다. 최신 상태는 [배포 기록](DEPLOYMENT.md)을 본다. 아래는 최초 시안 제작 당시의 범위다.

## 적용 범위

메인 첫 화면에 기존 여울의 인물과 서재를 분리한 장면을 적용했다. 인물은 약 7.6초 주기로 3px 이내 이동과 작은 회전·세로 배율 변화, 조명은 5.8초 주기, 빛의 실은 4.8초 주기, 먼지는 8초 주기로 움직인다. 일반 CSS로 실행하며 사용자별 이미지 생성이나 런타임 AI 요청은 없다. 눈 깜빡임·입 모양·머리카락 개별 리깅이나 생성 영상은 포함하지 않는다.

- 주요 구현: [LivingScene.tsx](../web/src/features/reading/LivingScene.tsx), [living-scene.css](../web/src/features/reading/living-scene.css).
- 움직임 정지/재생 버튼. 화면 밖과 숨겨진 탭에서는 일시 정지한다.
- 처음에는 정지 상태로 렌더링하고 시스템의 동작 줄이기 설정을 확인한다. 사용자가 버튼으로 직접 재생할 수 있다.
- 새 레이어가 모두 로드될 때까지 기존 그림을 유지한다. 레이어 로딩 오류가 나면 기존 그림에 머무른다.
- 메인의 그림 영역을 늘렸고 글자와 버튼은 움직이지 않는다. 나머지 상품 화면과 리포트는 유지했다.

## 이미지 자산과 제작 기록

내장 imagegen으로 기존 [여울 서재 원본](../web/public/images/yeoul-thread-room.png)을 편집했다. OpenAI API용 CLI는 사용하지 않았다. 원본은 보존했다.

- [빈 서재 배경](../web/public/images/yeoul-room-layer-v1.png): 1086×1448, 불투명 PNG.
- [여울 인물 레이어](../web/public/images/yeoul-character-layer-v1.png): 1086×1448, 알파 채널이 있는 PNG.
- 동일한 배경을 전경 책상에도 재사용해 인물이 책상 뒤에 서도록 합성했다. 웹 전송은 Next Image 최적화 경로를 사용한다.
- 생성 과정에서 원본의 세부 묘사와 비율이 조금 달라졌다. 화면에서 원본과 함께 비교해 최종 채택한다.

### 최종 배경 프롬프트

```text
Use case: precise-object-edit. Edit target: the supplied original illustration of Yeoul in a lantern-lit Korean study. Create the BACKGROUND PLATE for a layered living-comic animation. Remove the woman completely, including all hair, body, clothing, hands, ribbons and the magical light threads she holds. Fill those areas naturally with the existing empty traditional study, window, distant rooftops, desk and warm lamplight. Preserve the original exact camera framing, composition, colors, hand-painted Korean romantic comic style, left bookshelf, right lantern, moonlit sky, foreground desk and edge flowers. No people, no figures, no text, no floating ribbons. Output one portrait 3:4 illustration; same framing as source. This background will sit behind the original character, so don't redesign the room.
```

### 최종 인물 프롬프트

```text
Use case: background-extraction / identity-preserve. Edit target: the supplied original illustration of Yeoul. Extract ONLY the exact same illustrated woman onto a genuinely TRANSPARENT background (alpha), including her black bob hairstyle, exact face, ivory and deep-green embroidered hanbok, extended leftward/front hand, other hand at waist, orange sash and hanging ribbon. Preserve original pose, proportions, warm lighting and identity very closely. Preserve original placement and scale within the portrait 3:4 canvas with head near upper center and hem ending around 73 percent height. Keep the full original canvas with transparent empty margins, do not crop tight or enlarge her. Remove ALL room/background, desk, flowers, moon, lamps, particles and glowing threads. Crisp natural anti-aliased silhouette, no added shadow or halo, no checkerboard drawn in pixels, no text. Output one transparent PNG character layer ready to move subtly over a separate room background.
```

## 확인 기록

- TypeScript 검사와 production 빌드 통과.
- 실제 브라우저에서 레이어 로드, 인물 애니메이션 실행, 정지 버튼으로 모든 장면 애니메이션 정지, 다시 재생, 화면 밖에서 정지 확인.
- 390px 폭에서 가로 넘침 없음과 인물·본문·버튼 배치 확인.
- 시스템 동작 줄이기·탭 숨김·이미지 실패 분기는 코드 검토했으며, 해당 환경을 강제로 바꾸는 브라우저 검증은 하지 않았다.
