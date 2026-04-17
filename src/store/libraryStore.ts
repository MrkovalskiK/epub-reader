import { create } from 'zustand';
import type { Book } from '~/types/book';
import { saveLibrary, loadLibrary } from '~/services/storageService';

interface LibraryState {
  books: Book[];
  initialized: boolean;
  init: () => Promise<void>;
  addBook: (book: Book) => Promise<void>;
  removeBook: (id: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  initialized: false,
  init: async () => {
    const books = await loadLibrary();
    set({ books, initialized: true });
  },
  addBook: async (book) => {
    const books = [...get().books, book];
    set({ books });
    await saveLibrary(books);
  },
  removeBook: async (id) => {
    const books = get().books.filter(b => b.id !== id);
    set({ books });
    await saveLibrary(books);
  },
}));
