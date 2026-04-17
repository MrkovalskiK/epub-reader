import { Sheet, Toolbar } from 'konsta/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import type { Book } from '~/types/book';

interface Props {
  book: Book;
  onClose: () => void;
}

export function BookDetailsSheet({ book, onClose }: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <Sheet opened onBackdropClick={onClose}>
      <Toolbar top>
        <div className="left">
          <span className="font-medium text-[15px] text-[#1c1b1f] px-4">Детали книги</span>
        </div>
        <div className="right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[#6750a4] flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>
      </Toolbar>
      <div className="pb-safe px-4 overflow-y-auto max-h-[70vh]">
        {/* Cover + title + author */}
        <div className="flex gap-4 py-4">
          <div className="w-[80px] shrink-0 aspect-[2/3] bg-[#d0bcff]/30 rounded-xl overflow-hidden flex items-center justify-center">
            {book.coverImageUrl && !imgFailed ? (
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span className="text-3xl">📖</span>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
            <p className="font-semibold text-[15px] text-[#1c1b1f] leading-snug">{book.title}</p>
            <p className="text-[13px] text-[#49454f]">{book.author}</p>
          </div>
        </div>

        {/* Description */}
        {book.description && (
          <div className="py-3 border-t border-black/8">
            <p className="text-[12px] font-medium text-[#49454f] uppercase tracking-wide mb-2">Описание</p>
            <p className="text-[14px] text-[#1c1b1f] leading-relaxed">{book.description}</p>
          </div>
        )}

        {/* Genres */}
        {book.genres && book.genres.length > 0 && (
          <div className="py-3 border-t border-black/8">
            <p className="text-[12px] font-medium text-[#49454f] uppercase tracking-wide mb-2">Жанры</p>
            <div className="flex flex-wrap gap-2">
              {book.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-[#d0bcff]/30 text-[#6750a4] text-[12px] rounded-full"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Publisher / date */}
        {(book.publisher || book.publishDate) && (
          <div className="py-3 border-t border-black/8 flex flex-col gap-2">
            {book.publisher && (
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-medium text-[#49454f] uppercase tracking-wide">Издатель</span>
                <span className="text-[13px] text-[#1c1b1f]">{book.publisher}</span>
              </div>
            )}
            {book.publishDate && (
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-medium text-[#49454f] uppercase tracking-wide">Дата</span>
                <span className="text-[13px] text-[#1c1b1f]">{book.publishDate}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
