import type { TOCItem } from '~/types/book';

interface Props {
  toc: TOCItem[];
  onSelect: (href: string) => void;
  onClose: () => void;
}

function TocEntry({ item, onSelect }: { item: TOCItem; onSelect: (href: string) => void }) {
  return (
    <li>
      <button
        onClick={() => onSelect(item.href)}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-100"
      >
        {item.label}
      </button>
      {item.subitems && item.subitems.length > 0 && (
        <ul className="pl-4">
          {item.subitems.map((sub, i) => (
            <TocEntry key={i} item={sub} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function TableOfContents({ toc, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-72 bg-white h-full overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b font-medium">
          <span>Contents</span>
          <button onClick={onClose} className="text-gray-500 text-xl">×</button>
        </div>
        <ul>
          {toc.map((item, i) => (
            <TocEntry key={i} item={item} onSelect={onSelect} />
          ))}
        </ul>
      </div>
    </div>
  );
}
