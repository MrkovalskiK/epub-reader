import type { Book } from '~/types/book';

interface Props {
  book: Book;
  onOpen: () => void;
}

export function BookCard({ book, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="bg-white rounded-xl shadow-sm p-4 text-left w-full hover:shadow-md transition-shadow"
    >
      <div className="aspect-[2/3] bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
        <span className="text-4xl">📖</span>
      </div>
      <p className="font-medium text-sm leading-tight line-clamp-2">{book.title}</p>
      <p className="text-xs text-gray-400 mt-1 truncate">{book.author}</p>
    </button>
  );
}
