import { useState } from 'react';
import { App as KonstaApp } from 'konsta/react';
import { AppErrorBoundary } from '~/components/AppErrorBoundary';
import { LibraryScreen } from '~/screens/LibraryScreen';
import { ReaderScreen } from '~/screens/ReaderScreen';
import type { Book } from '~/types/book';

export function App() {
  const [openBook, setOpenBook] = useState<Book | null>(null);

  return (
    <KonstaApp theme="material">
      <AppErrorBoundary>
        {openBook
          ? <ReaderScreen book={openBook} onClose={() => setOpenBook(null)} />
          : <LibraryScreen onOpenBook={setOpenBook} />
        }
      </AppErrorBoundary>
    </KonstaApp>
  );
}
