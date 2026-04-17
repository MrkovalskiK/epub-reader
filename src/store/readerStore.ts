import { create } from 'zustand';
import type { TOCItem } from '~/types/book';

interface ReaderState {
  currentCfi: string | null;
  fraction: number;
  toc: TOCItem[];
  isLoading: boolean;
  setCfi: (cfi: string, fraction: number) => void;
  setToc: (toc: TOCItem[]) => void;
  setLoading: (v: boolean) => void;
  reset: () => void;
}

export const useReaderStore = create<ReaderState>((set) => ({
  currentCfi: null,
  fraction: 0,
  toc: [],
  isLoading: true,
  setCfi:     (cfi, fraction) => set({ currentCfi: cfi, fraction }),
  setToc:     (toc) => set({ toc }),
  setLoading: (isLoading) => set({ isLoading }),
  reset:      () => set({ currentCfi: null, fraction: 0, toc: [], isLoading: true }),
}));
