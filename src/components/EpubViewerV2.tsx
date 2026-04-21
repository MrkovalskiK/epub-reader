import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { BookSettings } from '~/types/bookSettings';
import { EpubDocumentLoader } from '~/services/documentLoader';
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

const READY_TIMEOUT_MS = 30_000;

export const EpubViewerV2 = forwardRef<EpubViewerHandle, Props>(function EpubViewerV2(
  { localPath, initialCfi, readingMode, settings, onRelocate, onTocLoad, onReady },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewRef = useRef<HTMLElement | null>(null);
  const isViewCreated = useRef(false);
  const isReady = useRef(false);

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
      if (!isReady.current) return;
      const r = fv(viewRef.current)?.renderer;
      if (!r) return;
      try {
        r.scrolled ? fv(viewRef.current)?.prev(r.size - 40) : fv(viewRef.current)?.prev();
      } catch { /* snap() can fail if paginator views aren't ready */ }
    },
    next: () => {
      if (!isReady.current) return;
      const r = fv(viewRef.current)?.renderer;
      if (!r) return;
      try {
        r.scrolled ? fv(viewRef.current)?.next(r.size - 40) : fv(viewRef.current)?.next();
      } catch { /* snap() can fail if paginator views aren't ready */ }
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

  useEffect(() => {
    if (isViewCreated.current) return;
    isViewCreated.current = true;

    let currentCfi: string | null = null;

    const handleOrientationChange = () => {
      const cfi = currentCfi;
      if (!cfi || !isReady.current) return;
      setTimeout(() => {
        fv(viewRef.current)?.goTo(cfi).catch(console.error);
      }, 300);
    };

    const openBook = async () => {
      console.log('[EpubViewerV2] openBook start', { localPath });

      console.log('[EpubViewerV2] loading file bytes...');
      const loader = await EpubDocumentLoader.fromPath(localPath);
      console.log('[EpubViewerV2] parsing book...');
      const book = await loader.open();
      console.log('[EpubViewerV2] book parsed', book);

      const view = document.createElement('foliate-view');
      view.style.cssText = 'display:block;width:100%;height:100%;';
      containerRef.current?.appendChild(view);
      console.log('[EpubViewerV2] foliate-view created, opening...');

      await fv(view).open(book);
      viewRef.current = view;
      console.log('[EpubViewerV2] book opened in view');

      // CSS + HTML transform hook — runs per chapter resource
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (book as any).transformTarget?.addEventListener('data', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail.type === 'text/css') {
          const { innerWidth: vw, innerHeight: vh } = window;
          detail.data = Promise.resolve(detail.data).then((css: string) =>
            transformStylesheet(css, vw, vh, false),
          );
        } else if (detail.type === 'text/html' || detail.type === 'application/xhtml+xml') {
          // Strip javascript: image srcs before browser parses the srcdoc — avoids CSP violations
          detail.data = Promise.resolve(detail.data).then((html: string) =>
            html.replace(/(<img\b[^>]*?\bsrc\s*=\s*["'])javascript:[^"']*["']/gi, '$1'),
          );
        }
      });

      // load fires for each chapter — apply readest-style utilities and register all events
      view.addEventListener('load', (e: Event) => {
        const { doc, index } = (e as CustomEvent<{ doc: Document; index: number }>).detail;
        console.log('[EpubViewerV2] chapter loaded', { index });

        // Fix empty chapters so foliate-js doesn't skip them
        const textLen = doc?.body?.textContent?.trim().length ?? 0;
        const hasMedia = doc?.body?.querySelector('img, svg, video, audio') != null;
        if (!textLen && !hasMedia && doc?.body) {
          console.log('[EpubViewerV2] empty chapter detected, injecting placeholder', { index });
          const el = doc.createElement('div');
          el.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;';
          el.textContent = '\u00a0';
          doc.body.appendChild(el);
        }

        const isDarkMode = settingsRef.current.theme === 'dark';
        const isScrolled = readingModeRef.current === 'scrolled';

        // Strip javascript: src from images (common lazy-load placeholder pattern in EPUBs)
        doc.querySelectorAll('img[src^="javascript:"]').forEach((img) => {
          img.removeAttribute('src');
        });

        keepTextAlignment(doc);
        applyThemeModeClass(doc, isDarkMode);
        applyScrollModeClass(doc, isScrolled);
        applyImageStyle(doc);
        applyTableStyle(doc);

        doc.addEventListener('click', (ev) => {
          const a = (ev.target as HTMLElement)?.closest('a');
          if (!a) return;
          const href = a.getAttribute('href') ?? '';
          if (/^https?:\/\//i.test(href)) {
            ev.preventDefault();
            ev.stopPropagation();
            invoke('plugin:native-bridge|open_url', { url: href }).catch(console.error);
          }
        }, true);

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

      const toc = fv(view).book?.toc ?? [];
      console.log('[EpubViewerV2] TOC loaded', { items: toc.length });
      onTocLoadRef.current(toc);

      // Timeout guard: if ready never fires, show error instead of infinite spinner
      let readyFired = false;
      const readyTimeout = setTimeout(() => {
        if (!readyFired) {
          console.error('[EpubViewerV2] timeout: ready never fired after', READY_TIMEOUT_MS, 'ms', { localPath });
          setIsLoading(false);
          setError(`Book failed to render within ${READY_TIMEOUT_MS / 1000}s. The file may be corrupt or unsupported.`);
        }
      }, READY_TIMEOUT_MS);

      const markReady = () => {
        if (readyFired) return;
        readyFired = true;
        clearTimeout(readyTimeout);
        console.log('[EpubViewerV2] ready');
        isReady.current = true;
        setIsLoading(false);
        onReadyRef.current();
      };

      // stabilized fires when renderer finishes layout — more reliable than relocate for initial render
      view.addEventListener('stabilized', () => {
        console.log('[EpubViewerV2] stabilized');
        markReady();
      });

      // relocate fires after every navigation — also use as ready signal and for progress tracking
      view.addEventListener('relocate', (e: Event) => {
        const { cfi, fraction } = (e as CustomEvent<RelocateDetail>).detail;
        console.log('[EpubViewerV2] relocate', { cfi, fraction, readyFired });
        currentCfi = cfi;
        markReady();
        const r = fv(view).renderer;
        onRelocateRef.current(
          cfi,
          Number.isFinite(fraction) ? fraction : 0,
          r?.page ?? 0,
          r?.pages ?? 0,
        );
      });

      screen.orientation?.addEventListener('change', handleOrientationChange);

      fv(view).renderer.setAttribute('max-column-count', '1');
      fv(view).renderer.setAttribute('flow', readingModeRef.current === 'scrolled' ? 'scrolled' : 'paginated');
      fv(view).renderer.setAttribute('margin-top', '40px');
      fv(view).renderer.setAttribute('margin-bottom', '40px');
      fv(view).renderer.setStyles?.(getStyles(settingsRef.current));

      if (initialCfiRef.current) {
        console.log('[EpubViewerV2] restoring position', { cfi: initialCfiRef.current });
        await fv(view).init({ lastLocation: initialCfiRef.current });
        // fallback: if relocate/stabilized didn't fire, unblock loading after short grace period
        setTimeout(() => markReady(), 300);
      } else {
        // goToFraction(0) lands on the cover/spine[0] which is often a fixed-layout image
        // that the paginator silently fails to render — navigate to first TOC item instead
        const firstHref = toc[0]?.href;
        console.log('[EpubViewerV2] fresh book, navigating to start', { firstHref });
        if (firstHref) {
          await fv(view).goTo(firstHref);
        } else {
          await fv(view).goToFraction(0);
        }
        setTimeout(() => markReady(), 300);
      }
      console.log('[EpubViewerV2] navigation complete, waiting for stabilized/relocate...');
    };

    const iid = setInterval(() => invoke("noop"), 200);
    openBook().finally(() => clearInterval(iid)).catch((err) => {
      console.error('[EpubViewerV2] openBook failed', err);
      setIsLoading(false);
      setError(err instanceof Error ? err.message : String(err));
    });

    return () => {
      screen.orientation?.removeEventListener('change', handleOrientationChange);
      viewRef.current?.remove();
      viewRef.current = null;
      isViewCreated.current = false;
      isReady.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localPath]);

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px', gap: '12px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px' }}>⚠️</div>
        <div style={{ fontWeight: 600, fontSize: '16px' }}>Не удалось открыть книгу</div>
        <div style={{ fontSize: '13px', color: '#888', maxWidth: '320px', wordBreak: 'break-word' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {isLoading && <Spinner />}
    </div>
  );
});
