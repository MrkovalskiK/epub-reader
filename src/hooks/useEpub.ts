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

    let current: Book | null = null;
    setStatus('loading');
    setError(null);

    (async () => {
      try {
        current = openBookFromBuffer(buffer);
        await current.ready;
        const navigation = await current.loaded.navigation;
        setToc(navigation.toc || []);
        setBook(current);
        setStatus('ready');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки книги');
        setStatus('error');
        current?.destroy();
      }
    })();

    return () => {
      current?.destroy();
    };
  }, [buffer]);

  return { book, toc, status, error };
}
