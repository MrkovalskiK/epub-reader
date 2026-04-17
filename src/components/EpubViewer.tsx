import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { TOCItem } from '~/types/book';
import type { ReadingMode } from '~/store/readerStore';
import type { BookSettings } from '~/types/bookSettings';
import { getStyles } from '~/utils/getStyles';

interface RelocateDetail {
  cfi: string;
  fraction: number;
  location?: { current: number; next: number; total: number };
  tocItem?: { label: string; href: string };
}

interface Props {
  localPath: string;
  initialCfi: string | undefined;
  readingMode: ReadingMode;
  settings: BookSettings;
  onRelocate: (cfi: string, fraction: number) => void;
  onTocLoad: (toc: TOCItem[]) => void;
  onReady: () => void;
}

export interface EpubViewerHandle {
  goTo: (href: string) => void;
  prev: () => void;
  next: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const foliate = (el: HTMLElement | null): any => el;

export const EpubViewer = forwardRef<EpubViewerHandle, Props>(function EpubViewer(
  { localPath, initialCfi, readingMode, settings, onRelocate, onTocLoad, onReady },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLElement | null>(null);
  const onRelocateRef = useRef(onRelocate);
  const onTocLoadRef = useRef(onTocLoad);
  const onReadyRef = useRef(onReady);
  const readingModeRef = useRef(readingMode);
  const settingsRef = useRef(settings);

  onRelocateRef.current = onRelocate;
  onTocLoadRef.current = onTocLoad;
  onReadyRef.current = onReady;
  readingModeRef.current = readingMode;
  settingsRef.current = settings;

  useImperativeHandle(ref, () => ({
    goTo: (href) => foliate(viewRef.current)?.goTo(href).catch(console.error),
    prev: () => foliate(viewRef.current)?.renderer.prev(),
    next: () => foliate(viewRef.current)?.renderer.next(),
  }));

  useEffect(() => {
    const view = foliate(viewRef.current);
    if (!view?.renderer) return;
    view.renderer.setAttribute('flow', readingMode === 'scrolled' ? 'scrolled' : 'paginated');
  }, [readingMode]);

  useEffect(() => {
    const view = foliate(viewRef.current);
    if (!view?.renderer) return;
    view.renderer.setStyles?.(getStyles(settings));
  }, [settings]);

  useEffect(() => {
    let cancelled = false;

    const openBook = async () => {
      const { makeBook } = await import('foliate-js/view.js');
      if (cancelled) return;

      const view = document.createElement('foliate-view');
      view.style.cssText = 'display:block;width:100%;height:100%;';
      containerRef.current?.appendChild(view);
      viewRef.current = view;

      await foliate(view).open(await makeBook(convertFileSrc(localPath)));
      if (cancelled) {
        view.remove();
        viewRef.current = null;
        return;
      }

      foliate(view).renderer.setAttribute(
        'flow',
        readingModeRef.current === 'scrolled' ? 'scrolled' : 'paginated',
      );
      foliate(view).renderer.setStyles?.(getStyles(settingsRef.current));

      view.addEventListener('relocate', (e: Event) => {
        const { cfi, fraction } = (e as CustomEvent<RelocateDetail>).detail;
        onRelocateRef.current(cfi, Number.isFinite(fraction) ? fraction : 0);
      });

      onTocLoadRef.current(foliate(view).book?.toc ?? []);

      if (initialCfi) {
        await foliate(view).goTo(initialCfi);
      } else {
        foliate(view).renderer.next();
      }

      // Re-sync in case settings/mode changed while the book was opening
      foliate(view).renderer.setStyles?.(getStyles(settingsRef.current));
      foliate(view).renderer.setAttribute(
        'flow',
        readingModeRef.current === 'scrolled' ? 'scrolled' : 'paginated',
      );

      onReadyRef.current();
    };

    openBook().catch(console.error);

    return () => {
      cancelled = true;
      viewRef.current?.remove();
      viewRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localPath]);

  return <div ref={containerRef} className="w-full h-full" />;
});
