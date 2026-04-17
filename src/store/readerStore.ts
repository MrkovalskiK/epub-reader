import { create } from 'zustand';
import type { TOCItem } from '~/types/book';
import type { BookSettings } from '~/types/bookSettings';
import { DEFAULT_BOOK_SETTINGS } from '~/bookDefaults';

export type ReadingMode = 'paginated' | 'scrolled';

interface ReaderState {
  currentCfi: string | null;
  fraction: number;
  toc: TOCItem[];
  isLoading: boolean;
  readingMode: ReadingMode;
  bookSettings: BookSettings;
  setCfi: (cfi: string, fraction: number) => void;
  setToc: (toc: TOCItem[]) => void;
  setLoading: (v: boolean) => void;
  setReadingMode: (mode: ReadingMode) => void;
  setBookSettings: (settings: BookSettings) => void;
  reset: () => void;
}

const savedMode = localStorage.getItem('readingMode') as ReadingMode | null;

export const useReaderStore = create<ReaderState>((set) => ({
  currentCfi: null,
  fraction: 0,
  toc: [],
  isLoading: true,
  readingMode: savedMode ?? 'paginated',
  bookSettings: { ...DEFAULT_BOOK_SETTINGS },
  setCfi:     (cfi, fraction) => set({ currentCfi: cfi, fraction }),
  setToc:     (toc) => set({ toc }),
  setLoading: (isLoading) => set({ isLoading }),
  setReadingMode: (readingMode) => {
    localStorage.setItem('readingMode', readingMode);
    set({ readingMode });
  },
  setBookSettings: (bookSettings) => set({ bookSettings }),
  reset:      () => set({ currentCfi: null, fraction: 0, toc: [], isLoading: true, bookSettings: { ...DEFAULT_BOOK_SETTINGS } }),
}));
