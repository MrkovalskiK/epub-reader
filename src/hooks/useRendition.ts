import { useState, useEffect, useRef, RefObject } from 'react';
import { Book, Rendition } from 'epubjs';
import { ReaderSettings } from '../store/index';

interface UseRenditionOptions {
  book: Book | null;
  containerRef: RefObject<HTMLDivElement | null>;
  settings: ReaderSettings;
  initialCfi: string | null;
  onRelocated: (cfi: string, index: number) => void;
}

interface UseRenditionResult {
  next: () => void;
  prev: () => void;
  displayHref: (href: string) => void;
}

const THEMES = {
  light: { body: { background: '#ffffff', color: '#1a1a1a' } },
  sepia: { body: { background: '#f4ecd8', color: '#3b2f1e' } },
  dark: { body: { background: '#1a1a1a', color: '#e0e0e0' } },
};

export function useRendition({
  book,
  containerRef,
  settings,
  initialCfi,
  onRelocated,
}: UseRenditionOptions): UseRenditionResult {
  const renditionRef = useRef<Rendition | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!book || !containerRef.current) return;

    const rendition = book.renderTo(containerRef.current, {
      flow: 'scrolled-doc',
      width: '100%',
      height: '100%',
    });

    renditionRef.current = rendition;

    Object.entries(THEMES).forEach(([name, styles]) => {
      rendition.themes.register(name, styles);
    });
    rendition.themes.select(settings.theme);
    rendition.themes.fontSize(settings.fontSize + 'px');

    rendition.on('relocated', (loc: { start: { cfi: string; index: number } }) => {
      onRelocated(loc.start.cfi, loc.start.index);
    });

    (async () => {
      try {
        await rendition.display(initialCfi ?? undefined);
      } catch {
        await rendition.display();
      }
    })();

    forceUpdate((n) => n + 1);

    return () => {
      rendition.destroy();
      renditionRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book]);

  useEffect(() => {
    const r = renditionRef.current;
    if (!r) return;
    r.themes.select(settings.theme);
    r.themes.fontSize(settings.fontSize + 'px');
  }, [settings.theme, settings.fontSize]);

  return {
    next: () => renditionRef.current?.next(),
    prev: () => renditionRef.current?.prev(),
    displayHref: (href) => renditionRef.current?.display(href),
  };
}
