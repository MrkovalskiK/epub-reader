import { useEffect, useRef } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { TOCItem } from '~/types/book';
import type { ReadingMode } from '~/store/readerStore';

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
  viewRef: React.RefObject<HTMLElement | null>;
  onRelocate: (cfi: string, fraction: number) => void;
  onTocLoad: (toc: TOCItem[]) => void;
  onReady: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const foliate = (el: HTMLElement | null): any => el;

export function EpubViewer({ localPath, initialCfi, readingMode, viewRef, onRelocate, onTocLoad, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isCreated = useRef(false);
  const onRelocateRef = useRef(onRelocate);
  const onTocLoadRef = useRef(onTocLoad);
  const onReadyRef = useRef(onReady);
  const readingModeRef = useRef(readingMode);

  onRelocateRef.current = onRelocate;
  onTocLoadRef.current = onTocLoad;
  onReadyRef.current = onReady;
  readingModeRef.current = readingMode;

  // Dynamically switch reading mode on an already-open view
  useEffect(() => {
    const view = foliate(viewRef.current);
    if (!view?.renderer) return;
    const flowValue = readingMode === 'scrolled' ? 'scrolled' : 'paginated';
    view.renderer.setAttribute('flow', flowValue);
    // Re-navigate to current position so the new layout renders immediately
    if (view.lastLocation?.cfi) {
      view.goTo(view.lastLocation.cfi).catch(console.error);
    } else {
      view.renderer.next();
    }
  }, [readingMode, viewRef]);

  useEffect(() => {
    if (isCreated.current) return;
    isCreated.current = true;

    const openBook = async () => {
      const { makeBook } = await import('foliate-js/view.js');

      const view = document.createElement('foliate-view');
      view.style.cssText = 'display:block;width:100%;height:100%;';
      containerRef.current?.appendChild(view);
      viewRef.current = view;

      await foliate(view).open(await makeBook(convertFileSrc(localPath)));

      // Apply reading mode before first navigation (mirrors reader.js pattern)
      foliate(view).renderer.setAttribute(
        'flow',
        readingModeRef.current === 'scrolled' ? 'scrolled' : 'paginated',
      );

      view.addEventListener('relocate', (e: Event) => {
        const { cfi, fraction } = (e as CustomEvent<RelocateDetail>).detail;
        onRelocateRef.current(cfi, fraction ?? 0);
      });

      onTocLoadRef.current(foliate(view).book?.toc ?? []);

      if (initialCfi) {
        await foliate(view).goTo(initialCfi);
      } else {
        // Official reader.js pattern: call renderer.next() to load first page
        foliate(view).renderer.next();
      }

      onReadyRef.current();
    };

    openBook().catch(console.error);

    return () => {
      viewRef.current?.remove();
      viewRef.current = null;
      isCreated.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localPath]);

  return <div ref={containerRef} className="w-full h-full" />;
}
