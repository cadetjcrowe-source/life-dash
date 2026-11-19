"use client";

import { useEffect, useState } from "react";
import { today } from "./dates";

/** London "today", updating automatically after midnight. */
export function useToday(): string {
  const [d, setD] = useState(() => today());
  useEffect(() => {
    const id = setInterval(() => setD(today()), 30_000);
    const onVis = () => document.visibilityState === "visible" && setD(today());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return d;
}
