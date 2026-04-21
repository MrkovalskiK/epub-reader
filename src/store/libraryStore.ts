import { create } from 'zustand';
import type { Book } from '~/types/book';
import { saveLibrary, loadLibrary } from '~/services/storageService';
import { generateCoverImageUrl } from '~/services/epubService';

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
    const chunkSize = 20;
    for (let i = 0; i < books.length; i += chunkSize) {
      const batch = books.slice(i, i + chunkSize);
      await Promise.all(batch.map(async (book) => {
        book.coverImageUrl = await generateCoverImageUrl(book);
      }));
    }
    set({ books, initialized: true });
  },
  addBook: async (book) => {
    const exists = get().books.find(b => b.id === book.id);
    if (exists) return;
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
