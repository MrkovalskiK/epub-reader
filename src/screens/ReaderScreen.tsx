import { useEffect, useCallback, useRef, useState } from 'react';
import { Preloader } from 'konsta/react';
import { EpubViewer } from '~/components/EpubViewer';
import type { EpubViewerHandle } from '~/components/EpubViewer';
import { ReaderTopNav, ReaderBottomNav } from '~/components/ReaderNav';
import { useReaderStore } from '~/store/readerStore';
import { saveProgress, loadProgress, saveBookSettings, loadBookSettings } from '~/services/storageService';
import type { Book, TOCItem } from '~/types/book';

interface Props {
  book: Book;
  onClose: () => void;
}

export function ReaderScreen({ book, onClose }: Props) {
  const { setCfi, setToc, setLoading, reset, readingMode, bookSettings, setBookSettings, isLoading } = useReaderStore();
  const [initialCfi, setInitialCfi] = useState<string | null | undefined>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const tocOpenRef = useRef(false);
  const settingsOpenRef = useRef(false);
  const epubRef = useRef<EpubViewerHandle>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const setTocOpenSync = useCallback((v: boolean) => { tocOpenRef.current = v; setTocOpen(v); }, []);
  const setSettingsOpenSync = useCallback((v: boolean) => { settingsOpenRef.current = v; setSettingsOpen(v); }, []);

  useEffect(() => {
    reset();
    loadProgress(book.id).then(cfi => setInitialCfi(cfi ?? undefined));
    loadBookSettings(book.id).then(setBookSettings);
    return () => clearTimeout(saveTimer.current);
  }, [book.id, reset, setBookSettings]);

  useEffect(() => {
    window.history.pushState({ reader: true }, '');
    const handlePop = () => {
      if (settingsOpenRef.current) {
        setSettingsOpenSync(false);
        window.history.pushState({ reader: true }, '');
      } else if (tocOpenRef.current) {
        setTocOpenSync(false);
        window.history.pushState({ reader: true }, '');
      } else {
        onClose();
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [onClose, setTocOpenSync, setSettingsOpenSync]);

  useEffect(() => {
    saveBookSettings(book.id, bookSettings);
  }, [book.id, bookSettings]);

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
      <div className="flex h-[100dvh] items-center justify-center bg-white">
        <span className="text-gray-400">Открытие…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh]">
      <ReaderTopNav
        book={book}
        epubRef={epubRef}
        onClose={onClose}
        tocOpen={tocOpen}
        setTocOpen={setTocOpenSync}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpenSync}
      />
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <EpubViewer
          ref={epubRef}
          localPath={book.localPath}
          initialCfi={initialCfi ?? undefined}
          readingMode={readingMode}
          settings={bookSettings}
          onRelocate={handleRelocate}
          onTocLoad={handleTocLoad}
          onReady={handleReady}
        />
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
            <Preloader />
          </div>
        )}
      </div>
      <ReaderBottomNav epubRef={epubRef} />
    </div>
  );
}
