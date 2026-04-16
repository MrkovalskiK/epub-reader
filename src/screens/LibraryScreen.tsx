import { useState } from 'react';
import { Page, Navbar, Link, List, Block, Button } from 'konsta/react';
import { BookCard } from '../components/BookCard';
import { ErrorBlock } from '../components/ErrorBlock';
import { useStore, generateBookId } from '../store/index';
import { pickEpubFile, readEpubFile } from '../services/tauri';
import { openBookFromBuffer } from '../services/epub';

export function LibraryScreen() {
  const { library, addBook, openBook } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function handleAdd() {
    setAddError(null);
    setIsAdding(true);
    try {
      const path = await pickEpubFile();
      if (!path) return;

      const buffer = await readEpubFile(path);

      if (buffer.byteLength > 50 * 1024 * 1024) {
        console.warn('Large file, loading may take a while');
      }

      const book = openBookFromBuffer(buffer);
      await book.ready;

      const meta = book.packaging.metadata;
      const nav = await book.loaded.navigation;
      const toc = nav.toc || [];

      const record = {
        id: generateBookId(path),
        path,
        title: (meta.title as string) || 'Без названия',
        author: (meta.creator as string) || '',
        lastCfi: null,
        lastChapterIndex: 0,
        totalChapters: toc.length || 1,
        progressPercent: 0,
        lastReadAt: null,
        addedAt: new Date().toISOString(),
      };

      book.destroy();
      addBook(record);
      openBook(record.id);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Не удалось открыть файл');
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <Page>
      <Navbar
        title="Библиотека"
        right={
          <Link navbar onClick={isAdding ? undefined : handleAdd}>
            {isAdding ? '...' : '+'}
          </Link>
        }
      />

      {addError && (
        <Block>
          <ErrorBlock
            message={addError}
            onRetry={() => { setAddError(null); handleAdd(); }}
          />
        </Block>
      )}

      {library.length === 0 ? (
        <Block className="text-center">
          <p className="text-gray-500 mb-4">Нет книг</p>
          <Button onClick={handleAdd} disabled={isAdding}>
            Открыть файл
          </Button>
        </Block>
      ) : (
        <List>
          {library.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onOpen={() => openBook(book.id)}
            />
          ))}
        </List>
      )}
    </Page>
  );
}
