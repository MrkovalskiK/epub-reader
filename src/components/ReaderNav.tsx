import { useState } from 'react';
import { Navbar } from 'konsta/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
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
      <Navbar
        title={book.title}
        titleClassName="truncate"
        left={
          <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/8">
            <ArrowLeft size={20} />
          </button>
        }
        right={
          <button type="button" onClick={() => setTocOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/8">
            <Menu size={20} />
          </button>
        }
      />
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
    <div className="flex items-center min-h-16 px-2 bg-white border-t border-gray-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <button type="button" onClick={() => callView(viewRef, 'prev')} className="w-12 h-12 flex items-center justify-center rounded-full active:bg-black/8 text-[#1c1b1f]">
        <ChevronLeft size={24} />
      </button>
      <span className="flex-1 text-center text-sm text-[#49454f] font-medium">{Math.round(fraction * 100)}%</span>
      <button type="button" onClick={() => callView(viewRef, 'next')} className="w-12 h-12 flex items-center justify-center rounded-full active:bg-black/8 text-[#1c1b1f]">
        <ChevronRight size={24} />
      </button>
    </div>
  );
}
