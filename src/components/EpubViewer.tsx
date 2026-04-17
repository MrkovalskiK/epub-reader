import { useEffect, useRef } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { TOCItem } from '~/types/book';

interface RelocateDetail {
  cfi: string;
  fraction: number;
  location?: { current: number; next: number; total: number };
  tocItem?: { label: string; href: string };
}

interface Props {
  localPath: string;
  initialCfi: string | undefined;
  viewRef: React.RefObject<HTMLElement | null>;
  onRelocate: (cfi: string, fraction: number) => void;
  onTocLoad: (toc: TOCItem[]) => void;
  onReady: () => void;
}

export function EpubViewer({ localPath, initialCfi, viewRef, onRelocate, onTocLoad, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isCreated = useRef(false);
  const onRelocateRef = useRef(onRelocate);
  const onTocLoadRef = useRef(onTocLoad);
  const onReadyRef = useRef(onReady);

  // Keep refs up to date without triggering the effect
  onRelocateRef.current = onRelocate;
  onTocLoadRef.current = onTocLoad;
  onReadyRef.current = onReady;

  useEffect(() => {
    if (isCreated.current) return;
    isCreated.current = true;

    const openBook = async () => {
      const { makeBook } = await import('foliate-js/view.js');

      const view = document.createElement('foliate-view');
      view.style.cssText = 'display:block;width:100%;height:100%;';
      containerRef.current?.appendChild(view);
      viewRef.current = view;

      view.addEventListener('relocate', (e: Event) => {
        const { cfi, fraction } = (e as CustomEvent<RelocateDetail>).detail;
        onRelocateRef.current(cfi, fraction ?? 0);
      });

      const fileUrl = convertFileSrc(localPath);
      const book = await makeBook(fileUrl);
      // @ts-expect-error — foliate-view is a custom element, not typed
      await view.open(book);

      // @ts-expect-error
      onTocLoadRef.current(view.book?.toc ?? []);
      onReadyRef.current();

      if (initialCfi) {
        // @ts-expect-error
        view.goTo(initialCfi);
      }
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
