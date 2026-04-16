import { Sheet, Toolbar, Link, List, ListItem, Block } from 'konsta/react';
import type { NavItem } from 'epubjs/types/navigation';

interface TocSheetProps {
  open: boolean;
  toc: NavItem[];
  onClose: () => void;
  onNavigate: (href: string) => void;
}

function TocItem({
  item,
  depth,
  onNavigate,
  onClose,
}: {
  item: NavItem;
  depth: number;
  onNavigate: (href: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <ListItem
        link
        title={item.label.trim()}
        style={{ paddingLeft: `${16 + depth * 16}px` }}
        onClick={() => {
          onNavigate(item.href);
          onClose();
        }}
      />
      {depth < 3 &&
        item.subitems?.map((sub) => (
          <TocItem
            key={sub.id}
            item={sub}
            depth={depth + 1}
            onNavigate={onNavigate}
            onClose={onClose}
          />
        ))}
    </>
  );
}

export function TocSheet({ open, toc, onClose, onNavigate }: TocSheetProps) {
  return (
    <Sheet opened={open} onBackdropClick={onClose}>
      <Toolbar top>
        <div className="left" />
        <div className="title font-semibold">Оглавление</div>
        <div className="right">
          <Link toolbar onClick={onClose}>
            Закрыть
          </Link>
        </div>
      </Toolbar>
      <div className="overflow-y-auto" style={{ maxHeight: '70vh', paddingTop: '44px' }}>
        {toc.length === 0 ? (
          <Block>
            <p className="text-center text-gray-500">Оглавление недоступно</p>
          </Block>
        ) : (
          <List>
            {toc.map((item) => (
              <TocItem
                key={item.id}
                item={item}
                depth={0}
                onNavigate={onNavigate}
                onClose={onClose}
              />
            ))}
          </List>
        )}
      </div>
    </Sheet>
  );
}
