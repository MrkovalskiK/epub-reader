import { useState } from 'react';
import { Navbar } from 'konsta/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Menu, Settings } from 'lucide-react';
import type { Book } from '~/types/book';
import { TableOfContents } from '~/components/TableOfContents';
import { useReaderStore } from '~/store/readerStore';
import type { ReadingMode } from '~/store/readerStore';

function callView(viewRef: React.RefObject<HTMLElement | null>, method: string, ...args: unknown[]) {
  // @ts-expect-error — foliate-view custom element
  viewRef.current?.[method]?.(...args);
}

interface TopNavProps {
  book: Book;
  viewRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}

const READING_MODES: { value: ReadingMode; label: string; description: string }[] = [
  { value: 'paginated', label: 'Paginated', description: 'Flip through pages' },
  { value: 'scrolled',  label: 'Scrolling', description: 'Continuous scroll' },
];

function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { readingMode, setReadingMode } = useReaderStore();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <div className="relative w-[85vw] max-w-xs h-full bg-[#fffbfe] shadow-2xl flex flex-col">
        <div className="h-16 flex items-center px-6 flex-shrink-0">
          <span className="text-lg font-medium text-[#1c1b1f] flex-1">Settings</span>
          <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/8 text-[#1c1b1f] text-2xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-6 pb-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[#49454f] mb-3">Reading Mode</p>
            {READING_MODES.map(({ value, label, description }) => (
              <button
                key={value}
                type="button"
                onClick={() => setReadingMode(value)}
                className={`w-full text-left px-4 py-3 mb-2 rounded-xl border-2 transition-colors ${
                  readingMode === value
                    ? 'border-[#6750a4] bg-[#6750a4]/8'
                    : 'border-transparent bg-[#f3edf7] active:bg-[#6750a4]/8'
                }`}
              >
                <span className={`block text-sm font-medium ${readingMode === value ? 'text-[#6750a4]' : 'text-[#1c1b1f]'}`}>{label}</span>
                <span className="block text-xs text-[#49454f] mt-0.5">{description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReaderTopNav({ book, viewRef, onClose }: TopNavProps) {
  const { toc } = useReaderStore();
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
          <div className="flex items-center">
            <button type="button" onClick={() => setSettingsOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/8">
              <Settings size={20} />
            </button>
            <button type="button" onClick={() => setTocOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/8">
              <Menu size={20} />
            </button>
          </div>
        }
      />
      {tocOpen && (
        <TableOfContents
          toc={toc}
          onSelect={(href) => { callView(viewRef, 'goTo', href); setTocOpen(false); }}
          onClose={() => setTocOpen(false)}
        />
      )}
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
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
