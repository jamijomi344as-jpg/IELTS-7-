'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useCountdown(initialSeconds: number, autoStart = false) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(autoStart);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setTimeLeft(initialSeconds);
    setIsActive(autoStart);
  }, [initialSeconds, autoStart]);

  useEffect(() => {
    if (!isActive) { if (ref.current) clearInterval(ref.current); return; }
    if (timeLeft <= 0) { setIsActive(false); return; }
    ref.current = setInterval(() => {
      setTimeLeft(p => { if (p <= 1) { setIsActive(false); clearInterval(ref.current!); return 0; } return p - 1; });
    }, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [isActive]);

  const start  = useCallback(() => setIsActive(true),  []);
  const pause  = useCallback(() => setIsActive(false), []);
  const reset  = useCallback((s?: number) => {
    setTimeLeft(s ?? initialSeconds);
    setIsActive(false);
  }, [initialSeconds]);

  const mm = Math.floor(timeLeft / 60);
  const ss = timeLeft % 60;
  const formattedTime = `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;

  return { timeLeft, formattedTime, isActive, start, pause, reset };
}
