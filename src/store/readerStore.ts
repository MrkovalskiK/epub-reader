import { create } from 'zustand';
import type { TOCItem } from '~/types/book';

export type ReadingMode = 'paginated' | 'scrolled';

interface ReaderState {
  currentCfi: string | null;
  fraction: number;
  toc: TOCItem[];
  isLoading: boolean;
  readingMode: ReadingMode;
  setCfi: (cfi: string, fraction: number) => void;
  setToc: (toc: TOCItem[]) => void;
  setLoading: (v: boolean) => void;
  setReadingMode: (mode: ReadingMode) => void;
  reset: () => void;
}

const savedMode = localStorage.getItem('readingMode') as ReadingMode | null;

export const useReaderStore = create<ReaderState>((set) => ({
  currentCfi: null,
  fraction: 0,
  toc: [],
  isLoading: true,
  readingMode: savedMode ?? 'paginated',
  setCfi:     (cfi, fraction) => set({ currentCfi: cfi, fraction }),
  setToc:     (toc) => set({ toc }),
  setLoading: (isLoading) => set({ isLoading }),
  setReadingMode: (readingMode) => {
    localStorage.setItem('readingMode', readingMode);
    set({ readingMode });
  },
  reset:      () => set({ currentCfi: null, fraction: 0, toc: [], isLoading: true }),
}));
