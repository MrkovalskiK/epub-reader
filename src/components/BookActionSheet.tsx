import { Sheet, Toolbar, List, ListItem, BlockTitle } from 'konsta/react';
import { Trash2Icon } from 'lucide-react';
import { useLibraryStore } from '~/store/libraryStore';
import type { Book } from '~/types/book';

interface Props {
  book: Book;
  onClose: () => void;
}

export function BookActionSheet({ book, onClose }: Props) {
  const { removeBook } = useLibraryStore();

  const handleDelete = async () => {
    await removeBook(book.id);
    onClose();
  };

  return (
    <Sheet opened onBackdropClick={onClose}>
      <Toolbar top>
        <div className="left" />
        <div className="right">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[#6750a4] font-medium">
            Закрыть
          </button>
        </div>
      </Toolbar>
      <div className="pb-safe">
        <BlockTitle>{book.title}</BlockTitle>
        <List>
          <ListItem
            title="Удалить книгу"
            media={<Trash2Icon size={20} className="text-red-500" />}
            onClick={handleDelete}
            className="[&_.k-list-item-title]:text-red-500"
          />
        </List>
      </div>
    </Sheet>
  );
}
