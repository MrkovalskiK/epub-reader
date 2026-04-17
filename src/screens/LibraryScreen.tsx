import { useEffect } from 'react';
import { useLibraryStore } from '~/store/libraryStore';
import { BookCard } from '~/components/BookCard';
import { importEpub } from '~/services/epubService';
import type { Book } from '~/types/book';

interface Props { onOpenBook: (book: Book) => void }

export function LibraryScreen({ onOpenBook }: Props) {
  const { books, initialized, init, addBook } = useLibraryStore();

  useEffect(() => { if (!initialized) init(); }, [initialized, init]);

  const handleAdd = async () => {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({
      multiple: false,
      filters: [{ name: 'EPUB', extensions: ['epub'] }],
    });
    if (!selected) return;
    try {
      const book = await importEpub(selected as string);
      await addBook(book);
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex justify-between items-center p-4 border-b bg-white">
        <h1 className="text-xl font-bold">My Library</h1>
        <button type="button" onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
          + Add Book
        </button>
      </div>
      {books.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <p>No books yet.</p>
          <p className="text-sm">Tap &quot;Add Book&quot; to import an EPUB.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 p-4">
          {books.map(book => (
            <BookCard key={book.id} book={book} onOpen={() => onOpenBook(book)} />
          ))}
        </div>
      )}
    </div>
  );
}
