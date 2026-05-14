"use client";

import { useEffect, useRef, useState } from "react";
import type { Answer, SwitchEvent } from "@/types";

export interface ExamState {
  examId: string;
  studentName: string;
  studentClass: string;
  branch: string;
  branchName: string;
  startedAt: number;
  answers: Answer[];
  currentQuestion: number;
  switchLog: SwitchEvent[];
  warnings: number;
  terminated: boolean;
}

const storageKey = (examId: string) => `exam:state:${examId}`;

export function loadExamState(examId: string): ExamState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(examId));
    return raw ? (JSON.parse(raw) as ExamState) : null;
  } catch {
    return null;
  }
}

export function saveExamState(state: ExamState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(state.examId), JSON.stringify(state));
  } catch {
    // quota / private mode — swallow but UI shouldn't lose data
  }
}

export function clearExamState(examId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(examId));
}

/**
 * Persist exam state automatically: every change is written to localStorage
 * on next animation frame. Answers SURVIVE page reload, accidental refresh,
 * react errors, focus loss — anything short of clearing browser storage.
 */
export function useExamStorage(initial: ExamState): [ExamState, (updater: (prev: ExamState) => ExamState) => void] {
  const [state, setState] = useState<ExamState>(initial);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const id = requestAnimationFrame(() => saveExamState(stateRef.current));
    return () => cancelAnimationFrame(id);
  }, [state]);

  useEffect(() => {
    const onUnload = () => saveExamState(stateRef.current);
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
    };
  }, []);

  const update = (updater: (prev: ExamState) => ExamState) => {
    setState((prev) => {
      const next = updater(prev);
      // synchronous write too, so even hard crashes don't lose this tick's answer
      saveExamState(next);
      return next;
    });
  };

  return [state, update];
}
