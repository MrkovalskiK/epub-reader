import { Card } from 'konsta/react';
import type { Book } from '~/types/book';

interface Props {
  book: Book;
  onOpen: () => void;
}

export function BookCard({ book, onOpen }: Props) {
  return (
    <button type="button" onClick={onOpen} className="text-left w-full active:opacity-80 transition-opacity">
      <Card
        raised
        contentWrap={false}
        className="w-full"
      >
        <div className="p-3">
          <div className="aspect-[2/3] bg-[#d0bcff]/30 rounded-2xl mb-3 flex items-center justify-center">
            <span className="text-4xl">📖</span>
          </div>
          <p className="font-medium text-[13px] text-[#1c1b1f] leading-tight line-clamp-2">{book.title}</p>
          <p className="text-[11px] text-[#49454f] mt-1 truncate">{book.author}</p>
        </div>
      </Card>
    </button>
  );
}
