import { useState } from 'react';
import type { Book } from '~/types/book';
import { TableOfContents } from '~/components/TableOfContents';
import { useReaderStore } from '~/store/readerStore';

function callView(viewRef: React.RefObject<HTMLElement | null>, method: string, ...args: unknown[]) {
  // @ts-expect-error — foliate-view custom element
  viewRef.current?.[method]?.(...args);
}

interface TopNavProps {
  book: Book;
  viewRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}

export function ReaderTopNav({ book, viewRef, onClose }: TopNavProps) {
  const { toc } = useReaderStore();
  const [tocOpen, setTocOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
        <button type="button" onClick={onClose} className="text-blue-600 font-medium">← Back</button>
        <span className="text-sm font-medium truncate max-w-[60%]">{book.title}</span>
        <button type="button" onClick={() => setTocOpen(true)} className="text-gray-600">☰</button>
      </div>
      {tocOpen && (
        <TableOfContents
          toc={toc}
          onSelect={(href) => { callView(viewRef, 'goTo', href); setTocOpen(false); }}
          onClose={() => setTocOpen(false)}
        />
      )}
    </>
  );
}

interface BottomNavProps {
  viewRef: React.RefObject<HTMLElement | null>;
}

export function ReaderBottomNav({ viewRef }: BottomNavProps) {
  const { fraction } = useReaderStore();

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-t">
      <button type="button" onClick={() => callView(viewRef, 'prev')} className="px-4 py-2 text-blue-600">‹ Prev</button>
      <span className="text-xs text-gray-400">{Math.round(fraction * 100)}%</span>
      <button type="button" onClick={() => callView(viewRef, 'next')} className="px-4 py-2 text-blue-600">Next ›</button>
    </div>
  );
}
