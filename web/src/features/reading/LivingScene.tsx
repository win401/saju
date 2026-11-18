"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/** Shared illustration layers; motion never triggers an API request. */
export default function LivingScene() {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [paused, setPaused] = useState<boolean | null>(null);
  const [roomLoaded, setRoomLoaded] = useState(false);
  const [characterLoaded, setCharacterLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const ready = roomLoaded && characterLoaded && !failed;
  const stopped = paused ?? reduced;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => {
      setReduced(media.matches);
      setPaused(null);
    };
    let inView = false;
    const syncVisibility = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncVisibility();
    });
    syncPreference();
    if (root.current) observer.observe(root.current);
    media.addEventListener("change", syncPreference);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", syncPreference);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  return (
    <div
      ref={root}
      className="living-scene"
      data-ready={ready}
      data-running={ready && visible && !stopped}
      data-motion-allowed={!stopped}
    >
      <div className="living-scene-art" aria-hidden="true">
        <Image
          src="/images/yeoul-thread-room.png"
          alt=""
          fill
          sizes="(max-width: 480px) 100vw, 480px"
          className="living-scene-fallback"
        />
        <div className="living-scene-layers">
          <Image
            src="/images/yeoul-room-layer-v1.png"
            alt=""
            fill
            preload
            sizes="(max-width: 480px) 100vw, 480px"
            className="living-scene-room"
            onLoad={() => setRoomLoaded(true)}
            onError={() => setFailed(true)}
          />
          <div className="living-scene-lamplight" />
          <div className="living-scene-character">
            <Image
              src="/images/yeoul-character-layer-v1.png"
              alt=""
              fill
              preload
              sizes="(max-width: 480px) 100vw, 480px"
              onLoad={() => setCharacterLoaded(true)}
              onError={() => setFailed(true)}
            />
            <svg
              className="living-scene-threads"
              viewBox="0 0 1086 1448"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <path d="M 474 719 C 435 907, 799 1014, 1070 1220" />
              <path d="M 474 719 C 559 1000, 185 1080, -80 1230" />
              <path d="M 474 719 C 568 1010, 774 1125, 620 1500" />
            </svg>
          </div>
          <Image
            src="/images/yeoul-room-layer-v1.png"
            alt=""
            fill
            sizes="(max-width: 480px) 100vw, 480px"
            className="living-scene-foreground"
          />
          <div className="living-scene-dust">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>
      {ready && (
        <button
          type="button"
          className="living-scene-toggle"
          aria-label={stopped ? "그림 움직임 켜기" : "그림 움직임 멈추기"}
          aria-pressed={!stopped}
          onClick={() => setPaused(!stopped)}
        >
          <span aria-hidden="true">{stopped ? "▷" : "Ⅱ"}</span>
          {stopped ? "움직임 켜기" : "움직임 멈춤"}
        </button>
      )}
    </div>
  );
}
