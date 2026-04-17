import { create } from 'zustand';
import { persistStore } from './persistence';

export interface BookRecord {
  id: string;
  path: string;
  title: string;
  author: string;
  lastCfi: string | null;
  lastChapterIndex: number;
  totalChapters: number;
  progressPercent: number;
  lastReadAt: string | null;
  addedAt: string;
}

export interface ReaderSettings {
  fontSize: number;
  theme: 'light' | 'sepia' | 'dark';
}

export const defaultSettings: ReaderSettings = {
  fontSize: 16,
  theme: 'light',
};

interface AppStore {
  isHydrated: boolean;
  library: BookRecord[];
  currentBookId: string | null;
  readerSettings: ReaderSettings;

  setHydrated: () => void;
  addBook: (record: BookRecord) => void;
  openBook: (id: string) => void;
  closeBook: () => void;
  updateProgress: (id: string, cfi: string, index: number, total: number) => void;
  updateSettings: (patch: Partial<ReaderSettings>) => void;
  removeBook: (id: string) => void;
  relinkBook: (id: string, newPath: string) => void;
}

export function generateBookId(_path: string): string {
  return crypto.randomUUID();
}

export const useStore = create<AppStore>((set) => ({
  isHydrated: false,
  library: [],
  currentBookId: null,
  readerSettings: defaultSettings,

  setHydrated: () => set({ isHydrated: true }),

  addBook: (record) => {
    set((s) => ({ library: [...s.library, record] }));
    persistStore();
  },

  openBook: (id) => {
    set({ currentBookId: id });
    persistStore();
  },

  closeBook: () => {
    set({ currentBookId: null });
    persistStore();
  },

  updateProgress: (id, cfi, index, total) => {
    set((s) => ({
      library: s.library.map((b) =>
        b.id === id
          ? {
              ...b,
              lastCfi: /^epubcfi\(.+\)$/.test(cfi) ? cfi : b.lastCfi,
              lastChapterIndex: index,
              totalChapters: total,
              progressPercent: Math.round((index + 1) / Math.max(total, 1) * 100),
              lastReadAt: new Date().toISOString(),
            }
          : b
      ),
    }));
    persistStore();
  },

  updateSettings: (patch) => {
    set((s) => ({ readerSettings: { ...s.readerSettings, ...patch } }));
    persistStore();
  },

  removeBook: (id) => {
    set((s) => ({
      library: s.library.filter((b) => b.id !== id),
      currentBookId: s.currentBookId === id ? null : s.currentBookId,
    }));
    persistStore();
  },

  relinkBook: (id, newPath) => {
    set((s) => ({
      library: s.library.map((b) => b.id === id ? { ...b, path: newPath } : b),
    }));
    persistStore();
  },
}));
