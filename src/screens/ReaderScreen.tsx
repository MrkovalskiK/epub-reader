import { useState, useEffect, useRef, useCallback } from 'react';
import { Page, Navbar, Link, Toolbar } from 'konsta/react';
import { EpubViewer, EpubViewerHandle } from '../components/EpubViewer';
import { TocSheet } from '../components/TocSheet';
import { SettingsSheet } from '../components/SettingsSheet';
import { ErrorBlock } from '../components/ErrorBlock';
import { useStore } from '../store/index';
import { useEpub } from '../hooks/useEpub';
import { pickEpubFile, readEpubFile } from '../services/tauri';

export function ReaderScreen() {
  const { library, currentBookId, readerSettings, closeBook, updateProgress, updateSettings, removeBook, relinkBook } = useStore();
  const book = library.find((b) => b.id === currentBookId);

  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(true);
  const [isViewerReady, setIsViewerReady] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');

  const [isRelinking, setIsRelinking] = useState(false);
  const viewerRef = useRef<EpubViewerHandle>(null);
  const progressRef = useRef(0);

  const { book: epubBook, toc, status } = useEpub(buffer);

  const handleRelink = async () => {
    if (!book) return;
    setIsRelinking(true);
    try {
      const newPath = await pickEpubFile();
      if (newPath) {
        relinkBook(book.id, newPath);
        setFileError(null);
      }
    } catch (e) {
      console.error('relink failed:', e);
    } finally {
      setIsRelinking(false);
    }
  };

  // Load file when the opened book path changes (not on every store update)
  useEffect(() => {
    if (!book?.path) return;
    setIsLoadingFile(true);
    setIsViewerReady(false);
    setFileError(null);
    readEpubFile(book.path)
      .then((buf) => {
        if (buf.byteLength > 50 * 1024 * 1024) {
          console.warn('Large EPUB file');
        }
        setBuffer(buf);
      })
      .catch((e) => {
        setFileError(e instanceof Error ? e.message : 'Файл недоступен');
      })
      .finally(() => setIsLoadingFile(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.path]);

  // Android back button
  useEffect(() => {
    const handler = () => closeBook();
    document.addEventListener('backbutton', handler);
    return () => document.removeEventListener('backbutton', handler);
  }, [closeBook]);

  // Update chapter title when toc changes
  useEffect(() => {
    if (!book) return;
    if (toc.length > 0 && book.lastChapterIndex < toc.length) {
      setChapterTitle(toc[book.lastChapterIndex]?.label?.trim() || '');
    }
  }, [toc, book]);

  const handleRelocated = useCallback(
    (cfi: string, index: number, skipTitleUpdate = false) => {
      if (!book) return;
      setIsViewerReady(true);
      progressRef.current = index;
      if (!skipTitleUpdate && toc.length > 0) {
        // match by href — spine index ≠ TOC index in most epubs
        const spineItem = (epubBook?.spine as any)?.get(index);
        const spineHref = spineItem?.href?.split('#')[0];
        const tocItem = spineHref
          ? toc.find((t) => t.href.split('#')[0] === spineHref)
          : toc[index];
        setChapterTitle(tocItem?.label?.trim() || '');
      }
      // spine items count is the correct denominator — loc.start.index is the spine index
      const spineTotal = (epubBook?.spine as any)?.items?.length;
      const total = spineTotal || toc.length || 1;
      updateProgress(book.id, cfi, index, total);
    },
    [book, toc, updateProgress, epubBook]
  );

  if (!book) { closeBook(); return null; }

  if (fileError) {
    return (
      <Page>
        <Navbar
          left={
            <Link navbar onClick={closeBook}>
              ←
            </Link>
          }
          title="Ошибка"
        />
        <ErrorBlock
          message={isRelinking ? 'Выбор файла...' : 'Файл недоступен. Выберите файл заново или удалите книгу.'}
          onBack={closeBook}
          onRelink={handleRelink}
          onRemove={() => {
            removeBook(book.id);
            closeBook();
          }}
        />
      </Page>
    );
  }

  const isLoading = isLoadingFile || status === 'loading' || status === 'idle' || !isViewerReady;

  return (
    <Page>
      <Navbar
        left={
          <Link navbar onClick={closeBook}>
            ←
          </Link>
        }
        title={chapterTitle || book.title}
        right={
          <div className="flex gap-2">
            <Link navbar onClick={() => setTocOpen(true)}>☰</Link>
            <Link navbar onClick={() => setSettingsOpen(true)}>⚙</Link>
          </div>
        }
      />

      <div className="flex-1 relative overflow-hidden">
        {status === 'error' && (
          <ErrorBlock
            message="Не удалось открыть книгу"
            onBack={closeBook}
          />
        )}

        {status === 'ready' && epubBook && (
          <EpubViewer
            ref={viewerRef}
            book={epubBook}
            savedCfi={book.lastCfi}
            settings={readerSettings}
            chapterTitle={chapterTitle}
            onRelocated={handleRelocated}
          />
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white dark:bg-gray-900">
            <div className="text-gray-400">Загрузка...</div>
          </div>
        )}
      </div>

      <Toolbar>
        <Link toolbar onClick={() => viewerRef.current?.prev()}>‹ Назад</Link>
        <span className="text-sm text-gray-500">{book.progressPercent}%</span>
        <Link toolbar onClick={() => viewerRef.current?.next()}>Далее ›</Link>
      </Toolbar>

      <TocSheet
        open={tocOpen}
        toc={toc}
        onClose={() => setTocOpen(false)}
        onNavigate={(href) => viewerRef.current?.displayHref(href)}
      />

      <SettingsSheet
        open={settingsOpen}
        settings={readerSettings}
        onClose={() => setSettingsOpen(false)}
        onUpdate={updateSettings}
      />
    </Page>
  );
}
