import { useState } from 'react';
import { App as KonstaApp } from 'konsta/react';
import { AppErrorBoundary } from '~/components/AppErrorBoundary';
import { Snackbar } from '~/components/Snackbar';
import { LibraryScreen } from '~/screens/LibraryScreen';
import { ReaderScreen } from '~/screens/ReaderScreen';
import type { Book } from '~/types/book';
import { useSafeAreaInsets } from '~/hooks/useSafeAreaInsets';
import { snackbars } from '~/store/snackbarStore';

export function App() {
  useSafeAreaInsets()
  const [openBook, setOpenBook] = useState<Book | null>(null);
  const revision = snackbars(s => s.revision);

  return (
    <KonstaApp theme="material">
      <AppErrorBoundary>
        {openBook
          ? <ReaderScreen book={openBook} onClose={() => setOpenBook(null)} />
          : <LibraryScreen onOpenBook={setOpenBook} />
        }
      </AppErrorBoundary>
      <Snackbar key={revision} />
    </KonstaApp>
  );
}
