import { create } from 'zustand';
import type { TOCItem } from '~/types/book';
import type { BookSettings } from '~/types/bookSettings';
import { DEFAULT_BOOK_SETTINGS } from '~/bookDefaults';

export type ReadingMode = 'paginated' | 'scrolled';

interface ReaderState {
  currentCfi: string | null;
  fraction: number;
  currentPage: number;
  totalPages: number;
  toc: TOCItem[];
  isLoading: boolean;
  readingMode: ReadingMode;
  bookSettings: BookSettings;
  setCfi: (cfi: string, fraction: number, currentPage: number, totalPages: number) => void;
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
  currentPage: 0,
  totalPages: 0,
  toc: [],
  isLoading: true,
  readingMode: savedMode ?? 'paginated',
  bookSettings: { ...DEFAULT_BOOK_SETTINGS },
  setCfi:     (cfi, fraction, currentPage, totalPages) => set({ currentCfi: cfi, fraction, currentPage, totalPages }),
  setToc:     (toc) => set({ toc }),
  setLoading: (isLoading) => set({ isLoading }),
  setReadingMode: (readingMode) => {
    localStorage.setItem('readingMode', readingMode);
    set({ readingMode });
  },
  setBookSettings: (bookSettings) => set({ bookSettings }),
  reset:      () => set({ currentCfi: null, fraction: 0, currentPage: 0, totalPages: 0, toc: [], isLoading: true, bookSettings: { ...DEFAULT_BOOK_SETTINGS } }),
}));
