import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useDrag } from '@use-gesture/react';
import { Book } from 'epubjs';
import { useRendition } from '../hooks/useRendition';
import { ReaderSettings } from '../store/index';

export interface EpubViewerHandle {
  next: () => void;
  prev: () => void;
  displayHref: (href: string) => void;
}

interface EpubViewerProps {
  book: Book;
  savedCfi: string | null;
  settings: ReaderSettings;
  onRelocated: (cfi: string, index: number) => void;
}

export const EpubViewer = forwardRef<EpubViewerHandle, EpubViewerProps>(
  ({ book, savedCfi, settings, onRelocated }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const { next, prev, displayHref, isEmpty } = useRendition({
      book,
      containerRef,
      settings,
      initialCfi: savedCfi,
      onRelocated,
    });

    useImperativeHandle(ref, () => ({ next, prev, displayHref }));

    const bind = useDrag(
      ({ swipe: [swipeX] }) => {
        if (swipeX === -1) next();
        if (swipeX === 1) prev();
      },
      {
        axis: 'x',
        filterTaps: true,
        swipe: { distance: 50, velocity: [0.3, 0.3] },
      }
    );

    return (
      <div className="flex-1 relative overflow-hidden">
        <div ref={containerRef} className="w-full h-full" />
        <div
          {...bind()}
          className="absolute inset-0"
          style={{ touchAction: 'pan-y' }}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 pointer-events-none">
            <p className="text-gray-400 text-sm text-center px-8">
              Эта глава недоступна в данном издании
            </p>
          </div>
        )}
      </div>
    );
  }
);

EpubViewer.displayName = 'EpubViewer';
