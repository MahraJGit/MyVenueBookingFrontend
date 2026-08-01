"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

type CountdownTimerProps = {
  expiresAt: string;
  onExpire?: () => void;
  className?: string;
};

export function CountdownTimer({ expiresAt, onExpire, className }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() =>
    new Date(expiresAt).getTime() - Date.now(),
  );

  useEffect(() => {
    const tick = () => {
      const next = new Date(expiresAt).getTime() - Date.now();
      setRemaining(next);
      if (next <= 0) {
        onExpire?.();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt, onExpire]);

  const expired = remaining <= 0;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border border-[#303030] bg-[#1B1B1B] px-3 py-2 text-sm ${className ?? ""}`}
    >
      <Clock className={`h-4 w-4 ${expired ? "text-destructive" : "text-primary"}`} />
      <span className={expired ? "text-destructive" : "text-white"}>
        {expired ? "Hold expired" : `Time left: ${formatRemaining(remaining)}`}
      </span>
    </div>
  );
}
