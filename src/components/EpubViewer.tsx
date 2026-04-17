import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Preloader } from 'konsta/react';
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
  const [isChapterLoading, setIsChapterLoading] = useState(false);
  const viewRef = useRef<HTMLElement | null>(null);
  const onRelocateRef = useRef(onRelocate);
  const onTocLoadRef = useRef(onTocLoad);
  const onReadyRef = useRef(onReady);
  const readingModeRef = useRef(readingMode);
  const settingsRef = useRef(settings);
  const spineIndexRef = useRef(-1);
  const spineSizeRef = useRef(0);
  const emptySpineIndicesRef = useRef(new Set<number>());

  onRelocateRef.current = onRelocate;
  onTocLoadRef.current = onTocLoad;
  onReadyRef.current = onReady;
  readingModeRef.current = readingMode;
  settingsRef.current = settings;

  useImperativeHandle(ref, () => ({
    goTo: (href) => foliate(viewRef.current)?.goTo(href).catch(console.error),
    prev: () => {
      let prevIdx = spineIndexRef.current - 1;
      while (prevIdx >= 0 && emptySpineIndicesRef.current.has(prevIdx)) prevIdx--;
      if (prevIdx < 0) return;
      if (prevIdx === spineIndexRef.current - 1) {
        foliate(viewRef.current)?.renderer.prev();
      } else {
        const href = foliate(viewRef.current)?.book?.sections?.[prevIdx]?.href;
        if (href) foliate(viewRef.current)?.goTo(href).catch(console.error);
        else foliate(viewRef.current)?.renderer.prev();
      }
    },
    next: () => {
      let nextIdx = spineIndexRef.current + 1;
      while (nextIdx < spineSizeRef.current && emptySpineIndicesRef.current.has(nextIdx)) nextIdx++;
      if (nextIdx >= spineSizeRef.current) return;
      if (nextIdx === spineIndexRef.current + 1) {
        foliate(viewRef.current)?.renderer.next();
      } else {
        const href = foliate(viewRef.current)?.book?.sections?.[nextIdx]?.href;
        if (href) foliate(viewRef.current)?.goTo(href).catch(console.error);
        else foliate(viewRef.current)?.renderer.next();
      }
    },
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

      spineSizeRef.current = foliate(view).book?.sections?.length ?? 0;
      emptySpineIndicesRef.current = new Set<number>();

      foliate(view).renderer.setAttribute('max-column-count', '1');
      foliate(view).renderer.setAttribute(
        'flow',
        readingModeRef.current === 'scrolled' ? 'scrolled' : 'paginated',
      );
      foliate(view).renderer.setStyles?.(getStyles(settingsRef.current));

      view.addEventListener('relocate', (e: Event) => {
        const { cfi, fraction } = (e as CustomEvent<RelocateDetail>).detail;
        const match = cfi.match(/^epubcfi\(\/6\/(\d+)/);
        const cfiSection = match ? parseInt(match[1], 10) / 2 - 1 : -1;
        if (cfiSection !== spineIndexRef.current) return;
        if (emptySpineIndicesRef.current.has(cfiSection)) return;
        onRelocateRef.current(cfi, Number.isFinite(fraction) ? fraction : 0);
      });

      view.addEventListener('index-change', () => {
        setIsChapterLoading(true);
      });

      view.addEventListener('load', (e: Event) => {
        const { doc, index } = (e as CustomEvent<{ doc: Document; index: number }>).detail;
        const textLen = doc?.body?.textContent?.trim().length ?? 0;
        const hasMedia = doc?.body?.querySelector('img, svg, video, audio') != null;
        const empty = !textLen && !hasMedia;

        if (empty) {
          emptySpineIndicesRef.current.add(index);
          if (doc?.body) {
            const el = doc.createElement('div');
            el.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;';
            el.textContent = '\u00a0';
            doc.body.appendChild(el);
          }
        }

        spineIndexRef.current = index;

        setIsChapterLoading(false);
      });

      onTocLoadRef.current(foliate(view).book?.toc ?? []);

      if (initialCfi) {
        await foliate(view).goTo(initialCfi);
      } else {
        foliate(view).renderer.next();
      }

      // Re-sync in case settings/mode changed while the book was opening
      foliate(view).renderer.setAttribute('max-column-count', '1');
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

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      {isChapterLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
          <Preloader />
        </div>
      )}
    </div>
  );
});
