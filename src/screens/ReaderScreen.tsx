import { useCallback, useEffect, useRef, useState } from 'react';
import type { Book, TOCItem } from '~/types/book';
import type { EpubViewerHandle } from '~/components/EpubViewerV2';
import { EpubViewerV2 } from '~/components/EpubViewerV2';
import { Spinner } from '~/components/Spinner';
import { ReaderBottomNav, ReaderTopNav } from '~/components/ReaderNav';
import { useReaderStore } from '~/store/readerStore';
import { loadBookSettings, loadProgress, saveBookSettings, saveProgress } from '~/services/storageService';

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
  const pendingSave = useRef<{ cfi: string; fraction: number } | null>(null);

  const setTocOpenSync = useCallback((v: boolean) => { tocOpenRef.current = v; setTocOpen(v); }, []);
  const setSettingsOpenSync = useCallback((v: boolean) => { settingsOpenRef.current = v; setSettingsOpen(v); }, []);

  useEffect(() => {
    reset();
    loadProgress(book.id).then(cfi => setInitialCfi(cfi ?? undefined));
    loadBookSettings(book.id).then(setBookSettings);
    return () => {
      clearTimeout(saveTimer.current);
      const p = pendingSave.current;
      if (p) saveProgress(book.id, p.cfi, p.fraction);
    };
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

  const handleRelocate = useCallback((cfi: string, fraction: number, currentPage: number, totalPages: number) => {
    setCfi(cfi, fraction, currentPage, totalPages);
    pendingSave.current = { cfi, fraction };
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      pendingSave.current = null;
      saveProgress(book.id, cfi, fraction);
    }, 500);
  }, [book.id, setCfi]);

  const handleTocLoad = useCallback((toc: TOCItem[]) => setToc(toc), [setToc]);
  const handleReady = useCallback(() => setLoading(false), [setLoading]);

  if (initialCfi === null) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', marginLeft: 'calc(-1 * var(--sal))', marginRight: 'calc(-1 * var(--sar))' }}>
      <ReaderTopNav
        book={book}
        epubRef={epubRef}
        onClose={onClose}
        tocOpen={tocOpen}
        setTocOpen={setTocOpenSync}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpenSync}
      />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        <EpubViewerV2
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
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
            <Spinner />
          </div>
        )}
      </div>
      <ReaderBottomNav epubRef={epubRef} />
    </div>
  );
}
