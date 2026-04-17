import { useEffect, useCallback, useRef, useState } from 'react';
import { EpubViewer } from '~/components/EpubViewer';
import { ReaderTopNav, ReaderBottomNav } from '~/components/ReaderNav';
import { useReaderStore } from '~/store/readerStore';
import { saveProgress, loadProgress } from '~/services/storageService';
import type { Book, TOCItem } from '~/types/book';

interface Props {
  book: Book;
  onClose: () => void;
}

export function ReaderScreen({ book, onClose }: Props) {
  const { setCfi, setToc, setLoading, reset } = useReaderStore();
  const [initialCfi, setInitialCfi] = useState<string | null | undefined>(null);
  const viewRef = useRef<HTMLElement | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    reset();
    loadProgress(book.id).then(cfi => setInitialCfi(cfi ?? undefined));
    return () => clearTimeout(saveTimer.current);
  }, [book.id, reset]);

  const handleRelocate = useCallback((cfi: string, fraction: number) => {
    setCfi(cfi, fraction);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProgress(book.id, cfi, fraction);
    }, 500);
  }, [book.id, setCfi]);

  const handleTocLoad = useCallback((toc: TOCItem[]) => setToc(toc), [setToc]);
  const handleReady   = useCallback(() => setLoading(false), [setLoading]);

  if (initialCfi === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <span className="text-gray-400">Opening…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <ReaderTopNav book={book} viewRef={viewRef} onClose={onClose} />
      <div className="flex-1 overflow-hidden">
        <EpubViewer
          localPath={book.localPath}
          initialCfi={initialCfi ?? undefined}
          viewRef={viewRef}
          onRelocate={handleRelocate}
          onTocLoad={handleTocLoad}
          onReady={handleReady}
        />
      </div>
      <ReaderBottomNav viewRef={viewRef} />
    </div>
  );
}
