"use client";

import { useEffect, useRef, useState } from "react";
import type { SwitchEvent } from "@/types";

interface Options {
  graceSeconds: number;
  onTerminate: () => void;
  onSwitch: (ev: SwitchEvent) => void;
  enabled: boolean;
}

export function useProctor({ graceSeconds, onTerminate, onSwitch, enabled }: Options) {
  const [focused, setFocused] = useState(true);
  const [timeLeft, setTimeLeft] = useState(graceSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blurredAtRef = useRef<number | null>(null);
  const warningCountRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  useEffect(() => {
    if (!enabled) return;

    const onFocus = () => {
      if (blurredAtRef.current !== null) {
        const away = Math.round((Date.now() - blurredAtRef.current) / 1000);
        onSwitch({ event: "focus", timestamp: new Date().toISOString(), timeAway: away });
        blurredAtRef.current = null;
      }
      setFocused(true);
      setTimeLeft(graceSeconds);
      clearTimer();
    };

    const onBlur = () => {
      if (blurredAtRef.current !== null) return;
      blurredAtRef.current = Date.now();
      warningCountRef.current += 1;
      const ev: SwitchEvent = {
        event: "blur",
        timestamp: new Date().toISOString(),
        warningNumber: warningCountRef.current,
      };
      onSwitch(ev);
      setFocused(false);
      setTimeLeft(graceSeconds);
      clearTimer();
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            onSwitch({ event: "terminated", timestamp: new Date().toISOString(), reason: `Exceeded ${graceSeconds}s away` });
            onTerminate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const onVisibility = () => {
      if (document.hidden) onBlur();
      else onFocus();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "C" || e.key === "J")) ||
        (e.ctrlKey && (e.key === "u" || e.key === "r")) ||
        e.key === "F5") {
        e.preventDefault();
      }
    };
    const onCtx = (e: MouseEvent) => e.preventDefault();

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("keydown", onKey);
    document.addEventListener("contextmenu", onCtx);

    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("contextmenu", onCtx);
      clearTimer();
    };
  }, [enabled, graceSeconds, onTerminate, onSwitch]);

  return { focused, timeLeft, warnings: warningCountRef.current };
}
