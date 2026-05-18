"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  startedAt: number;
  totalMinutes: number | null;
  onTimeUp: () => void;
}

export function ExamTimer({ startedAt, totalMinutes, onTimeUp }: Props) {
  const enabled = totalMinutes != null && totalMinutes > 0;
  const totalSeconds = (totalMinutes ?? 0) * 60;
  const calcRemaining = () => Math.max(0, totalSeconds - Math.floor((Date.now() - startedAt) / 1000));
  const [remaining, setRemaining] = useState(enabled ? calcRemaining() : 0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      const r = calcRemaining();
      setRemaining(r);
      if (r <= 0 && !done) {
        setDone(true);
        clearInterval(id);
        onTimeUp();
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  if (!enabled) {
    return (
      <div className="flex items-center gap-1 text-xs text-default-500 px-2 py-1">
        <Clock size={14} />
        <span className="hidden sm:inline">No time limit</span>
      </div>
    );
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isLow = remaining < 300;
  return (
    <div className={`flex items-center gap-1 text-sm font-mono px-2 py-1 rounded ${isLow ? "bg-danger-50 text-danger-700" : "bg-default-100 dark:bg-default-100/30"}`}>
      <Clock size={14} />
      <span>{mins}:{String(secs).padStart(2, "0")}</span>
    </div>
  );
}
