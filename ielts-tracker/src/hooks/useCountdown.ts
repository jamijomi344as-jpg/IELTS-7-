'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useCountdown(initialSecs: number, autoStart = false) {
  const [secs, setSecs]       = useState(initialSecs);
  const [running, setRunning] = useState(autoStart);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSecs(initialSecs);
    setRunning(autoStart);
  }, [initialSecs, autoStart]);

  useEffect(() => {
    if (!running) { interval.current && clearInterval(interval.current); return; }
    if (secs <= 0) { setRunning(false); return; }
    interval.current = setInterval(() => {
      setSecs(p => {
        if (p <= 1) { setRunning(false); clearInterval(interval.current!); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => { interval.current && clearInterval(interval.current); };
  }, [running]);

  const start  = useCallback(() => setRunning(true), []);
  const pause  = useCallback(() => setRunning(false), []);
  const reset  = useCallback((n?: number) => {
    setSecs(n ?? initialSecs);
    setRunning(false);
  }, [initialSecs]);

  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const fmt = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const pct = initialSecs > 0 ? Math.round(((initialSecs - secs) / initialSecs) * 100) : 0;

  return { secs, fmt, running, pct, start, pause, reset };
}
