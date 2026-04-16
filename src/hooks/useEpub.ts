import { useState, useEffect } from 'react';
import { Book } from 'epubjs';
import type { NavItem } from 'epubjs/types/navigation';
import { openBookFromBuffer } from '../services/epub';

type EpubStatus = 'idle' | 'loading' | 'ready' | 'error';

interface UseEpubResult {
  book: Book | null;
  toc: NavItem[];
  status: EpubStatus;
  error: string | null;
}

export function useEpub(buffer: ArrayBuffer | null): UseEpubResult {
  const [book, setBook] = useState<Book | null>(null);
  const [toc, setToc] = useState<NavItem[]>([]);
  const [status, setStatus] = useState<EpubStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!buffer) return;

    let cancelled = false;
    const bookInstance = openBookFromBuffer(buffer);
    setStatus('loading');
    setError(null);

    (async () => {
      try {
        await bookInstance.ready;
        if (cancelled) { bookInstance.destroy(); return; }
        const navigation = await bookInstance.loaded.navigation;
        if (cancelled) { bookInstance.destroy(); return; }
        setToc(navigation.toc || []);
        setBook(bookInstance);
        setStatus('ready');
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Ошибка загрузки книги');
          setStatus('error');
        }
        bookInstance.destroy();
      }
    })();

    return () => {
      cancelled = true;
      bookInstance.destroy();
    };
  }, [buffer]);

  return { book, toc, status, error };
}
