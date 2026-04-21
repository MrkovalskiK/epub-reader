import { Trash2Icon } from 'lucide-react';
import { BottomSheet } from '~/components/BottomSheet';
import { useLibraryStore } from '~/store/libraryStore';
import type { Book } from '~/types/book';
import './BookActionSheet.css';

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
    <BottomSheet closeLabel="Закрыть" onClose={onClose}>
      <p className="bas-title">{book.title}</p>
      <button type="button" className="bas-action bas-action--danger" onClick={handleDelete}>
        <Trash2Icon size={20} />
        <span>Удалить книгу</span>
      </button>
    </BottomSheet>
  );
}
