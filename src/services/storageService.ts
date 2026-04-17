import { LazyStore } from '@tauri-apps/plugin-store';
import type { Book, ReadingProgress } from '~/types/book';

const progressStore = new LazyStore('reading-progress.json');
const libraryStore  = new LazyStore('library.json');

export async function saveProgress(
  bookId: string, cfi: string, fraction: number
): Promise<void> {
  await progressStore.set(bookId, { bookId, cfi, fraction, updatedAt: Date.now() });
  await progressStore.save();
}

export async function loadProgress(bookId: string): Promise<string | null> {
  const data = await progressStore.get<ReadingProgress>(bookId);
  return data?.cfi ?? null;
}

export async function saveLibrary(books: Book[]): Promise<void> {
  await libraryStore.set('books', books);
  await libraryStore.save();
}

export async function loadLibrary(): Promise<Book[]> {
  return (await libraryStore.get<Book[]>('books')) ?? [];
}
