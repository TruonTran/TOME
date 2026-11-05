'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** Thanh tiến độ kiểu bút dạ quang. value từ 0 đến 1. */
export function HighlightBar({ value, className = 'h-3', label }: { value: number; className?: string; label?: string }) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
      className={`relative w-full overflow-hidden rounded-sm bg-ink/10 ${className}`}
    >
      <motion.div
        className="mark-swipe absolute inset-y-0 left-0"
        initial={reduce ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
