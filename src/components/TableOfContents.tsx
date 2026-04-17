import type { TOCItem } from '~/types/book';

interface Props {
  toc: TOCItem[];
  onSelect: (href: string) => void;
  onClose: () => void;
}

function TocEntry({ item, onSelect, isSubItem = false }: { item: TOCItem; onSelect: (href: string) => void; isSubItem?: boolean }) {
  return (
    <li>
      <button
        onClick={() => onSelect(item.href)}
        className={`w-full text-left px-6 py-3 text-[14px] active:bg-[#6750a4]/8 ${isSubItem ? 'text-[#49454f]' : 'text-[#1c1b1f]'}`}
      >
        {item.label}
      </button>
      {item.subitems && item.subitems.length > 0 && (
        <ul className="pl-4">
          {item.subitems.map((sub, i) => (
            <TocEntry key={i} item={sub} onSelect={onSelect} isSubItem />
          ))}
        </ul>
      )}
    </li>
  );
}

export function TableOfContents({ toc, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} onKeyDown={(e) => e.key === 'Escape' && onClose()} aria-label="Close" />
      <div className="relative w-[85vw] max-w-xs h-full bg-[#fffbfe] shadow-2xl flex flex-col">
        <div className="h-16 flex items-center px-6 flex-shrink-0">
          <span className="text-lg font-medium text-[#1c1b1f] flex-1">Содержание</span>
          <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-black/8 text-[#1c1b1f] text-2xl">×</button>
        </div>
        <ul className="flex-1 overflow-y-auto py-2">
          {toc.map((item, i) => (
            <TocEntry key={i} item={item} onSelect={onSelect} />
          ))}
        </ul>
      </div>
    </div>
  );
}
