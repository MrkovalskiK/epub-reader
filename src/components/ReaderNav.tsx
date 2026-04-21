import './ReaderNav.css';
import { ArrowLeft, ChevronLeft, ChevronRight, Menu, Settings } from 'lucide-react';
import type { Book, TOCItem } from '~/types/book';
import { TableOfContents } from '~/components/TableOfContents';
import { BottomSheet } from '~/components/BottomSheet';
import { useReaderStore } from '~/store/readerStore';
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="rn-section-label">{children}</p>;
}

function SettingsContent() {
  const { bookSettings, setBookSettings } = useReaderStore();
  const s = bookSettings;
  const update = (patch: Partial<typeof s>) => setBookSettings({ ...s, ...patch });

  return (
    <div className="rn-settings-section">
      <SectionLabel>Размер шрифта</SectionLabel>
      <div className="rn-stepper">
        <button type="button" onClick={() => update({ defaultFontSize: Math.max(10, s.defaultFontSize - 1) })} className="rn-stepper-btn">−</button>
        <span className="rn-stepper-value">{s.defaultFontSize}px</span>
        <button type="button" onClick={() => update({ defaultFontSize: Math.min(32, s.defaultFontSize + 1) })} className="rn-stepper-btn">+</button>
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
      <div className="rn-top-nav">
        <button type="button" onClick={onClose} className="rn-icon-btn">
          <ArrowLeft size={20} />
        </button>
        <span className="rn-top-nav-title">{book.title}</span>
        <div className="rn-nav-actions">
          <button type="button" onClick={() => setSettingsOpen(true)} className="rn-icon-btn">
            <Settings size={20} />
          </button>
          <button type="button" onClick={() => setTocOpen(true)} className="rn-icon-btn">
            <Menu size={20} />
          </button>
        </div>
      </div>
      {tocOpen && (
        <TableOfContents
          toc={toc}
          stubHrefs={stubHrefs}
          onSelect={(href) => { epubRef.current?.goTo(href); setTocOpen(false); }}
          onClose={() => setTocOpen(false)}
        />
      )}
      {settingsOpen && (
        <BottomSheet onClose={() => setSettingsOpen(false)} title="Настройки" maxHeight="85vh">
          <SettingsContent />
        </BottomSheet>
      )}
    </>
  );
}

interface BottomNavProps {
  epubRef: React.RefObject<EpubViewerHandle | null>;
}

export function ReaderBottomNav({ epubRef }: BottomNavProps) {
  const { fraction } = useReaderStore();

  return (
    <div className="rn-bottom-nav">
      <button type="button" onClick={() => epubRef.current?.prev()} className="rn-nav-btn">
        <ChevronLeft size={24} />
      </button>
      <span className="rn-progress-label">
        {`${Math.round(fraction * 100)}%`}
      </span>
      <button type="button" onClick={() => epubRef.current?.next()} className="rn-nav-btn">
        <ChevronRight size={24} />
      </button>
    </div>
  );
}
