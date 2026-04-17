import { useEffect, useRef, useState } from 'react';
import { Info, Trash2 } from 'lucide-react';
import { loadFraction } from '~/services/storageService';
import type { Book } from '~/types/book';

interface Props {
  book: Book;
  onOpen: () => void;
  onDelete: () => void;
  onShowDetails: () => void;
}

export function BookCard({ book, onOpen, onDelete, onShowDetails }: Props) {
  const [fraction, setFraction] = useState<number | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const prevIdRef = useRef(book.id);
  if (prevIdRef.current !== book.id) {
    prevIdRef.current = book.id;
    setImgFailed(false);
  }

  useEffect(() => {
    loadFraction(book.id).then(setFraction);
  }, [book.id]);

  const percent = fraction !== null ? Math.min(100, Math.max(0, Math.round(fraction * 100))) : null;

  return (
    <div className="w-full flex items-center gap-3 px-3 py-2 active:bg-black/5 transition-colors">
      <button
        type="button"
        onClick={onOpen}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <div className="w-[72px] shrink-0 aspect-[2/3] bg-[#d0bcff]/30 rounded-xl overflow-hidden flex items-center justify-center">
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
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[14px] text-[#1c1b1f] leading-tight line-clamp-2">{book.title}</p>
          <p className="text-[12px] text-[#49454f] mt-0.5 truncate">{book.author}</p>
          {percent !== null && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-[#d0bcff]/30 rounded-full overflow-hidden">
                <div className="h-full bg-[#6750a4] rounded-full" style={{ width: `${percent}%` }} />
              </div>
              <span className="text-[11px] text-[#49454f] shrink-0">{percent}%</span>
            </div>
          )}
        </div>
      </button>
      <button
        type="button"
        onClick={onShowDetails}
        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-[#49454f] active:bg-black/8"
      >
        <Info size={18} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-[#49454f] active:bg-black/8"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
