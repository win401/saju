"use client";

import { useEffect, useState } from "react";
import type { BirthInput, ReadingTheme } from "@/types/reading";
import {
  BIRTH_PROFILE_STORAGE_KEY,
  clearBirthProfile,
  loadBirthProfile,
  saveBirthProfile,
  type StoredBirthProfile,
} from "./birth-profile-storage";

// Accessing localStorage itself can throw when a browser blocks storage.
function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export default function useBirthProfile(
  theme: ReadingTheme,
  initial: BirthInput,
) {
  const [input, setInput] = useState<BirthInput>({ ...initial, theme });
  const [ready, setReady] = useState(false);
  const [remember, setRemember] = useState(true);
  const [savedProfile, setSavedProfile] = useState<StoredBirthProfile | null>(
    null,
  );
  const [storageMessage, setStorageMessage] = useState("");

  useEffect(() => {
    const storage = browserStorage();
    const saved = storage ? loadBirthProfile(storage) : null;
    if (saved) {
      setInput({ ...initial, ...saved.profile, theme });
      setSavedProfile(saved);
    }
    setReady(true);
  }, [initial, theme]);

  useEffect(() => {
    if (!savedProfile) return;
    function checkStoredProfile() {
      const storage = browserStorage();
      const current = storage ? loadBirthProfile(storage) : null;
      setSavedProfile(current);
    }
    function onStorage(event: StorageEvent) {
      if (event.key === BIRTH_PROFILE_STORAGE_KEY || event.key === null)
        checkStoredProfile();
    }
    function onVisible() {
      if (document.visibilityState === "visible") checkStoredProfile();
    }
    const timer = window.setTimeout(
      checkStoredProfile,
      Math.max(0, savedProfile.expiresAt - Date.now()),
    );
    window.addEventListener("focus", checkStoredProfile);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", checkStoredProfile);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [savedProfile]);

  function forget() {
    const storage = browserStorage();
    const cleared = storage ? clearBirthProfile(storage) : false;
    setRemember(false);
    setSavedProfile(null);
    setStorageMessage(
      cleared
        ? "저장된 정보를 삭제했어요. 지금 입력한 정보는 이번 화면에서만 사용해요."
        : "브라우저 저장소에 접근할 수 없어요. 저장된 정보가 있다면 브라우저의 사이트 데이터 설정에서 삭제해주세요.",
    );
  }

  function changeRemember(value: boolean) {
    if (!value) {
      forget();
      return;
    }
    setRemember(true);
    setStorageMessage("");
  }

  function save() {
    if (!remember) return;
    const storage = browserStorage();
    // Keep the shared MBTI even when this report doesn't use it.
    const saved = storage ? saveBirthProfile(storage, input) : null;
    setSavedProfile(saved);
    setStorageMessage(
      saved
        ? "내 정보를 24시간 기억해요. 다른 콘텐츠에서도 바로 불러올게요."
        : "이 브라우저에서는 정보를 저장하지 못했어요. 결과는 계속 읽을 수 있어요.",
    );
  }

  function clear() {
    forget();
    setInput({ ...initial, theme });
  }

  return {
    input,
    setInput,
    ready,
    remember,
    changeRemember,
    savedProfile,
    storageMessage,
    save,
    clear,
  };
}
