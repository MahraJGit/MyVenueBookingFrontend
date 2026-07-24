"use client";

import { cn } from "@/lib/utils";

/** Theater-style seat with a dark open cushion for a clear seat number. */
export function SeatIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {/* Backrest */}
      <path
        d="M6 4.5c0-1.4 1.1-2.5 2.5-2.5h15c1.4 0 2.5 1.1 2.5 2.5V9H6V4.5Z"
        fill="currentColor"
      />
      {/* Left arm */}
      <rect x="2" y="10" width="5" height="18" rx="2" fill="currentColor" />
      {/* Right arm */}
      <rect x="25" y="10" width="5" height="18" rx="2" fill="currentColor" />
      {/* Seat outer frame */}
      <path
        d="M8 10h16a1.5 1.5 0 0 1 1.5 1.5v14A3.5 3.5 0 0 1 22 29H10a3.5 3.5 0 0 1-3.5-3.5v-14A1.5 1.5 0 0 1 8 10Z"
        fill="currentColor"
      />
      {/* Dark cushion — empty space for the number */}
      <path
        d="M9.5 12.25h13a1 1 0 0 1 1 1V24.5A2.25 2.25 0 0 1 21.25 26.75h-10.5A2.25 2.25 0 0 1 8.5 24.5V13.25a1 1 0 0 1 1-1Z"
        fill="#0a0a0a"
      />
    </svg>
  );
}
