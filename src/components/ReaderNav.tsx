import { Navbar } from 'konsta/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Menu, Settings } from 'lucide-react';
import type { Book, TOCItem } from '~/types/book';
import { TableOfContents } from '~/components/TableOfContents';
import { useReaderStore } from '~/store/readerStore';
import type { ReadingMode } from '~/store/readerStore';
import type { ReadingTheme } from '~/types/bookSettings';
import { themes } from '~/styles/themes';
import type { EpubViewerHandle } from '~/components/EpubViewer';

interface TopNavProps {
  book: Book;
  epubRef: React.RefObject<EpubViewerHandle | null>;
  onClose: () => void;
  tocOpen: boolean;
  setTocOpen: (v: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
}

const READING_MODES: { value: ReadingMode; label: string; description: string }[] = [
  { value: 'paginated', label: 'Постраничный', description: 'Перелистывание страниц' },
  { value: 'scrolled',  label: 'Прокрутка',    description: 'Непрерывная прокрутка'  },
];

const THEMES: { value: ReadingTheme; label: string }[] = [
  { value: 'light', label: 'Светлая' },
  { value: 'dark',  label: 'Тёмная'  },
  { value: 'sepia', label: 'Сепия'   },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium uppercase tracking-wider text-[#49454f] mb-3">{children}</p>;
}

function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { readingMode, setReadingMode, bookSettings, setBookSettings } = useReaderStore();
  const s = bookSettings;
  const update = (patch: Partial<typeof s>) => setBookSettings({ ...s, ...patch });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <div className="relative w-[85vw] max-w-xs h-full bg-[#fffbfe] shadow-2xl flex flex-col">
        <div className="h-16 flex items-center px-6 flex-shrink-0">
          <span className="text-lg font-medium text-[#1c1b1f] flex-1">Настройки</span>
          <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/8 text-[#1c1b1f] text-2xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 space-y-6">

          {/* Theme */}
          <div className="px-6">
            <SectionLabel>Тема</SectionLabel>
            <div className="flex gap-2">
              {THEMES.map(({ value, label }) => {
                const palette = themes[value];
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update({ theme: value })}
                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                      s.theme === value ? 'border-[#6750a4]' : 'border-transparent'
                    }`}
                    style={{ background: palette.bg, color: palette.fg }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font */}
          <div className="px-6">
            <SectionLabel>Шрифт</SectionLabel>
            <div className="flex gap-2 mb-4">
              {(['Serif', 'Sans-serif'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => update({ defaultFont: f })}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    s.defaultFont === f ? 'border-[#6750a4] bg-[#6750a4]/8 text-[#6750a4]' : 'border-transparent bg-[#f3edf7] text-[#1c1b1f]'
                  }`}
                  style={{ fontFamily: f === 'Serif' ? 'Georgia, serif' : 'Arial, sans-serif' }}
                >
                  {f === 'Serif' ? 'С засечками' : 'Без засечек'}
                </button>
              ))}
            </div>
            <SectionLabel>Размер шрифта</SectionLabel>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => update({ defaultFontSize: Math.max(10, s.defaultFontSize - 1) })} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f3edf7] text-[#1c1b1f] text-lg font-bold active:bg-[#6750a4]/8">−</button>
              <span className="flex-1 text-center text-sm font-medium text-[#1c1b1f]">{s.defaultFontSize}px</span>
              <button type="button" onClick={() => update({ defaultFontSize: Math.min(32, s.defaultFontSize + 1) })} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f3edf7] text-[#1c1b1f] text-lg font-bold active:bg-[#6750a4]/8">+</button>
            </div>
          </div>

          {/* Text */}
          <div className="px-6">
            <SectionLabel>Межстрочный интервал</SectionLabel>
            <div className="flex items-center gap-3 mb-4">
              <button type="button" onClick={() => update({ lineHeight: Math.max(1, +(s.lineHeight - 0.1).toFixed(1)) })} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f3edf7] text-[#1c1b1f] text-lg font-bold active:bg-[#6750a4]/8">−</button>
              <span className="flex-1 text-center text-sm font-medium text-[#1c1b1f]">{s.lineHeight.toFixed(1)}</span>
              <button type="button" onClick={() => update({ lineHeight: Math.min(3, +(s.lineHeight + 0.1).toFixed(1)) })} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f3edf7] text-[#1c1b1f] text-lg font-bold active:bg-[#6750a4]/8">+</button>
            </div>
            <SectionLabel>Отступ абзаца</SectionLabel>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => update({ paragraphMargin: Math.max(0, +(s.paragraphMargin - 0.1).toFixed(1)) })} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f3edf7] text-[#1c1b1f] text-lg font-bold active:bg-[#6750a4]/8">−</button>
              <span className="flex-1 text-center text-sm font-medium text-[#1c1b1f]">{s.paragraphMargin.toFixed(1)}em</span>
              <button type="button" onClick={() => update({ paragraphMargin: Math.min(2, +(s.paragraphMargin + 0.1).toFixed(1)) })} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f3edf7] text-[#1c1b1f] text-lg font-bold active:bg-[#6750a4]/8">+</button>
            </div>
          </div>

          {/* Reading Mode */}
          <div className="px-6 pb-4">
            <SectionLabel>Режим чтения</SectionLabel>
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

function findDuplicateHrefs(toc: TOCItem[]): Set<string> {
  const counts = new Map<string, number>();
  const walk = (items: TOCItem[]) => {
    for (const item of items) {
      counts.set(item.href, (counts.get(item.href) ?? 0) + 1);
      if (item.subitems) walk(item.subitems);
    }
  };
  walk(toc);
  const dupes = new Set<string>();
  for (const [href, count] of counts) if (count > 1) dupes.add(href);
  return dupes;
}

export function ReaderTopNav({ book, epubRef, onClose, tocOpen, setTocOpen, settingsOpen, setSettingsOpen }: TopNavProps) {
  const { toc } = useReaderStore();
  const stubHrefs = findDuplicateHrefs(toc);

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
          stubHrefs={stubHrefs}
          onSelect={(href) => { epubRef.current?.goTo(href); setTocOpen(false); }}
          onClose={() => setTocOpen(false)}
        />
      )}
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </>
  );
}

interface BottomNavProps {
  epubRef: React.RefObject<EpubViewerHandle | null>;
}

export function ReaderBottomNav({ epubRef }: BottomNavProps) {
  const { fraction } = useReaderStore();

  return (
    <div className="flex items-center min-h-16 px-2 bg-white border-t border-gray-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <button type="button" onClick={() => epubRef.current?.prev()} className="w-12 h-12 flex items-center justify-center rounded-full active:bg-black/8 text-[#1c1b1f]">
        <ChevronLeft size={24} />
      </button>
      <span className="flex-1 text-center text-sm text-[#49454f] font-medium">{Math.round(fraction * 100)}%</span>
      <button type="button" onClick={() => epubRef.current?.next()} className="w-12 h-12 flex items-center justify-center rounded-full active:bg-black/8 text-[#1c1b1f]">
        <ChevronRight size={24} />
      </button>
    </div>
  );
}
