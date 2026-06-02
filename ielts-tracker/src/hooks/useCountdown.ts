'use client';

import { useCallback, useEffect, useState } from 'react';

export function useCountdown(initialSeconds: number, autoStart = false) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(autoStart);

  useEffect(() => {
    if (!isActive) return;
    if (timeLeft <= 0) {
      setIsActive(false);
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isActive, timeLeft]);

  useEffect(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  const start = useCallback(() => setIsActive(true), []);
  const pause = useCallback(() => setIsActive(false), []);
  const reset = useCallback(() => {
    setTimeLeft(initialSeconds);
    setIsActive(autoStart);
  }, [initialSeconds, autoStart]);

  const formattedTime = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`;

  return { timeLeft, formattedTime, isActive, start, pause, reset };
}
