import './TableOfContents.css';
import { BottomSheet } from '~/components/BottomSheet';
import type { TOCItem } from '~/types/book';

interface Props {
  toc: TOCItem[];
  stubHrefs: Set<string>;
  onSelect: (href: string) => void;
  onClose: () => void;
}

function TocEntry({ item, stubHrefs, onSelect, isSubItem = false }: { item: TOCItem; stubHrefs: Set<string>; onSelect: (href: string) => void; isSubItem?: boolean }) {
  const isStub = stubHrefs.has(item.href);
  const btnClass = isStub
    ? 'toc-entry-btn toc-entry-btn--stub'
    : isSubItem
    ? 'toc-entry-btn toc-entry-btn--sub'
    : 'toc-entry-btn toc-entry-btn--top';
  return (
    <li>
      <button type="button" onClick={() => !isStub && onSelect(item.href)} disabled={isStub} className={btnClass}>
        {item.label}
      </button>
      {item.subitems && item.subitems.length > 0 && (
        <ul className="toc-subitems">
          {item.subitems.map((sub) => (
            <TocEntry key={sub.href} item={sub} stubHrefs={stubHrefs} onSelect={onSelect} isSubItem />
          ))}
        </ul>
      )}
    </li>
  );
}

export function TableOfContents({ toc, stubHrefs, onSelect, onClose }: Props) {
  return (
    <BottomSheet onClose={onClose} title="Содержание" maxHeight="80vh">
      <ul className="toc-list">
        {toc.map((item) => (
          <TocEntry key={item.href} item={item} stubHrefs={stubHrefs} onSelect={onSelect} />
        ))}
      </ul>
    </BottomSheet>
  );
}
