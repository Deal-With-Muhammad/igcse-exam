"use client";

import { Chip } from "@heroui/react";
import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  questionId: string;
  seconds: number;
  onTimeUp: () => void;
}

/**
 * Per-question timer. Resets every time `questionId` changes. When the
 * countdown reaches zero, calls onTimeUp() once. The timer is informational —
 * answers stay editable; the parent decides what "time up" should do (we just
 * auto-advance the student to the next question).
 */
export function QuestionTimer({ questionId, seconds, onTimeUp }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    setRemaining(seconds);
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (!firedRef.current) { firedRef.current = true; onTimeUp(); }
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId, seconds]);

  const isLow = remaining < 10;
  return (
    <Chip
      size="sm"
      variant="flat"
      color={isLow ? "danger" : "warning"}
      startContent={<Clock size={12} />}
      className="font-mono"
    >
      {remaining}s
    </Chip>
  );
}
