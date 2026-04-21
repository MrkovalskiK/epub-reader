import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { readFile } from '@tauri-apps/plugin-fs';
import type { BookSettings } from '~/types/bookSettings';
import type { TOCItem } from '~/types/book';
import type { ReadingMode } from '~/store/readerStore';
import { Spinner } from '~/components/Spinner';
import {
  getStyles,
  transformStylesheet,
  applyThemeModeClass,
  applyScrollModeClass,
  applyImageStyle,
  applyTableStyle,
  keepTextAlignment,
} from '~/utils/style';
import {
  handleKeydown,
  handleKeyup,
  handleMousedown,
  handleMouseup,
  handleWheel,
  handleClick,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  addLongPressListeners,
} from '~/utils/iframeEventHandlers';

interface RelocateDetail {
  cfi: string;
  fraction: number;
  location?: { current: number; next: number; total: number };
}

interface Props {
  localPath: string;
  initialCfi: string | undefined;
  readingMode: ReadingMode;
  settings: BookSettings;
  onRelocate: (cfi: string, fraction: number, currentPage: number, totalPages: number) => void;
  onTocLoad: (toc: TOCItem[]) => void;
  onReady: () => void;
}

export interface EpubViewerHandle {
  goTo: (href: string) => void;
  prev: () => void;
  next: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fv = (el: HTMLElement | null): any => el;

type DocWithFlag = Document & { _listenersAdded?: boolean };

const BOOK_KEY = 'reader';

export const EpubViewerV2 = forwardRef<EpubViewerHandle, Props>(function EpubViewerV2(
  { localPath, initialCfi, readingMode, settings, onRelocate, onTocLoad, onReady },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const viewRef = useRef<HTMLElement | null>(null);
  const isViewCreated = useRef(false);

  const onRelocateRef = useRef(onRelocate);
  const onTocLoadRef = useRef(onTocLoad);
  const onReadyRef = useRef(onReady);
  const readingModeRef = useRef(readingMode);
  const settingsRef = useRef(settings);
  const initialCfiRef = useRef(initialCfi);

  onRelocateRef.current = onRelocate;
  onTocLoadRef.current = onTocLoad;
  onReadyRef.current = onReady;
  readingModeRef.current = readingMode;
  settingsRef.current = settings;

  useImperativeHandle(ref, () => ({
    goTo: (href) => fv(viewRef.current)?.goTo(href).catch(console.error),
    prev: () => {
      const r = fv(viewRef.current)?.renderer;
      if (!r) return;
      r.scrolled ? fv(viewRef.current)?.prev(r.size - 40) : fv(viewRef.current)?.prev();
    },
    next: () => {
      const r = fv(viewRef.current)?.renderer;
      if (!r) return;
      r.scrolled ? fv(viewRef.current)?.next(r.size - 40) : fv(viewRef.current)?.next();
    },
  }));

  useEffect(() => {
    const r = fv(viewRef.current)?.renderer;
    if (!r) return;
    r.setAttribute('flow', readingMode === 'scrolled' ? 'scrolled' : 'paginated');
  }, [readingMode]);

  useEffect(() => {
    const r = fv(viewRef.current)?.renderer;
    if (!r) return;
    r.setStyles?.(getStyles(settings));
  }, [settings]);

  // Swipe detection via iframe postMessage events
  useEffect(() => {
    let touchStart: { x: number; y: number; t: number } | null = null;
    const handler = (msg: MessageEvent) => {
      if (msg.data?.bookKey !== BOOK_KEY) return;
      if (msg.data?.type === 'iframe-touchstart') {
        const t = msg.data.targetTouches?.[0];
        if (t) touchStart = { x: t.screenX, y: t.screenY, t: msg.data.timeStamp };
        return;
      }
      if (msg.data?.type === 'iframe-touchend' && touchStart) {
        const t = msg.data.targetTouches?.[0];
        if (!t) { touchStart = null; return; }
        const dx = t.screenX - touchStart.x;
        const dy = t.screenY - touchStart.y;
        const dt = msg.data.timeStamp - touchStart.t;
        const vx = Math.abs(dx / (dt || 1));
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30 && vx > 0.2) {
          const r = fv(viewRef.current)?.renderer;
          if (r?.scrolled) {
            dx > 0 ? fv(viewRef.current)?.prev(r.size - 40) : fv(viewRef.current)?.next(r.size - 40);
          } else {
            dx > 0 ? fv(viewRef.current)?.prev() : fv(viewRef.current)?.next();
          }
        }
        touchStart = null;
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (isViewCreated.current) return;
    isViewCreated.current = true;

    const openBook = async () => {
      const { makeBook } = await import('foliate-js/view.js');

      const bytes = await readFile(localPath);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const file = new File([bytes], 'book.epub', { type: 'application/epub+zip' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const book = await makeBook(file as any);

      const view = document.createElement('foliate-view');
      view.style.cssText = 'display:block;width:100%;height:100%;';
      containerRef.current?.appendChild(view);

      await fv(view).open(book);
      viewRef.current = view;

      // CSS transform hook — runs per chapter stylesheet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (book as any).transformTarget?.addEventListener('data', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail.type === 'text/css') {
          const { innerWidth: vw, innerHeight: vh } = window;
          detail.data = Promise.resolve(detail.data).then((css: string) =>
            transformStylesheet(css, vw, vh, false),
          );
        }
      });

      // load fires for each chapter — apply readest-style utilities and register all events
      view.addEventListener('load', (e: Event) => {
        const { doc } = (e as CustomEvent<{ doc: Document; index: number }>).detail;

        // Fix empty chapters so foliate-js doesn't skip them
        const textLen = doc?.body?.textContent?.trim().length ?? 0;
        const hasMedia = doc?.body?.querySelector('img, svg, video, audio') != null;
        if (!textLen && !hasMedia && doc?.body) {
          const el = doc.createElement('div');
          el.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;';
          el.textContent = '\u00a0';
          doc.body.appendChild(el);
        }

        const isDarkMode = settingsRef.current.theme === 'dark';
        const isScrolled = readingModeRef.current === 'scrolled';

        keepTextAlignment(doc);
        applyThemeModeClass(doc, isDarkMode);
        applyScrollModeClass(doc, isScrolled);
        applyImageStyle(doc);
        applyTableStyle(doc);

        if (!(doc as DocWithFlag)._listenersAdded) {
          (doc as DocWithFlag)._listenersAdded = true;
          doc.addEventListener('keydown', (ev) => handleKeydown(BOOK_KEY, ev as KeyboardEvent));
          doc.addEventListener('keyup', (ev) => handleKeyup(BOOK_KEY, ev as KeyboardEvent));
          doc.addEventListener('mousedown', (ev) => handleMousedown(BOOK_KEY, ev as MouseEvent));
          doc.addEventListener('mouseup', (ev) => handleMouseup(BOOK_KEY, ev as MouseEvent));
          doc.addEventListener('click', (ev) => handleClick(BOOK_KEY, ev as MouseEvent));
          doc.addEventListener('wheel', (ev) => handleWheel(BOOK_KEY, ev as WheelEvent));
          doc.addEventListener('touchstart', (ev) => handleTouchStart(BOOK_KEY, ev as TouchEvent));
          doc.addEventListener('touchmove', (ev) => handleTouchMove(BOOK_KEY, ev as TouchEvent));
          doc.addEventListener('touchend', (ev) => handleTouchEnd(BOOK_KEY, ev as TouchEvent));
          addLongPressListeners(BOOK_KEY, doc);
        }
      });

      // relocate fires after every navigation — first occurrence signals ready
      let readyFired = false;
      view.addEventListener('relocate', (e: Event) => {
        const { cfi, fraction } = (e as CustomEvent<RelocateDetail>).detail;
        if (!readyFired) {
          readyFired = true;
          setIsLoading(false);
          onReadyRef.current();
        }
        const r = fv(view).renderer;
        onRelocateRef.current(
          cfi,
          Number.isFinite(fraction) ? fraction : 0,
          r?.page ?? 0,
          r?.pages ?? 0,
        );
      });

      onTocLoadRef.current(fv(view).book?.toc ?? []);

      fv(view).renderer.setAttribute('max-column-count', '1');
      fv(view).renderer.setAttribute('flow', readingModeRef.current === 'scrolled' ? 'scrolled' : 'paginated');
      fv(view).renderer.setAttribute('margin-top', '40px');
      fv(view).renderer.setAttribute('margin-bottom', '40px');
      fv(view).renderer.setStyles?.(getStyles(settingsRef.current));

      if (initialCfiRef.current) {
        await fv(view).init({ lastLocation: initialCfiRef.current });
      } else {
        await fv(view).goToFraction(0);
      }
    };

    openBook().catch(console.error);

    return () => {
      viewRef.current?.remove();
      viewRef.current = null;
      isViewCreated.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localPath]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {isLoading && <Spinner />}
    </div>
  );
});
