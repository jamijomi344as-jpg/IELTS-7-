'use client';

export function useWordCount(text: string) {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}
