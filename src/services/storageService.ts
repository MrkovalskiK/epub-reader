import { LazyStore } from '@tauri-apps/plugin-store';
import type { Book, ReadingProgress } from '~/types/book';
import type { BookSettings } from '~/types/bookSettings';
import { DEFAULT_BOOK_SETTINGS } from '~/bookDefaults';

const progressStore = new LazyStore('reading-progress.json');
const libraryStore  = new LazyStore('library.json');
const bookSettingsStore = new LazyStore('book-settings.json');

export async function saveProgress(
  bookId: string, cfi: string, fraction: number
): Promise<void> {
  await progressStore.set(bookId, { bookId, cfi, fraction: Math.min(1, Math.max(0, fraction)), updatedAt: Date.now() });
  await progressStore.save();
}

export async function loadProgress(bookId: string): Promise<string | null> {
  const data = await progressStore.get<ReadingProgress>(bookId);
  return data?.cfi ?? null;
}

export async function loadFraction(bookId: string): Promise<number | null> {
  const data = await progressStore.get<ReadingProgress>(bookId);
  const f = data?.fraction ?? null;
  return f !== null ? Math.min(1, Math.max(0, f)) : null;
}

export async function deleteBookProgress(bookId: string): Promise<void> {
  await progressStore.delete(bookId);
  await progressStore.save();
  await bookSettingsStore.delete(bookId);
  await bookSettingsStore.save();
}

export async function saveLibrary(books: Book[]): Promise<void> {
  await libraryStore.set('books', books);
  await libraryStore.save();
}

export async function loadLibrary(): Promise<Book[]> {
  return (await libraryStore.get<Book[]>('books')) ?? [];
}

export async function saveBookSettings(bookId: string, settings: BookSettings): Promise<void> {
  await bookSettingsStore.set(bookId, settings);
  await bookSettingsStore.save();
}

export async function loadBookSettings(bookId: string): Promise<BookSettings> {
  const stored = await bookSettingsStore.get<BookSettings>(bookId);
  return stored ? { ...DEFAULT_BOOK_SETTINGS, ...stored } : { ...DEFAULT_BOOK_SETTINGS };
}
