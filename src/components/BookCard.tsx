import { useEffect, useRef, useState } from 'react';
import { loadFraction } from '~/services/storageService';
import type { Book } from '~/types/book';

interface Props {
  book: Book;
  onOpen: () => void;
  onLongPress: () => void;
}

export function BookCard({ book, onOpen, onLongPress }: Props) {
  const [fraction, setFraction] = useState<number | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const prevIdRef = useRef(book.id);
  if (prevIdRef.current !== book.id) {
    prevIdRef.current = book.id;
    setImgFailed(false);
  }
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadFraction(book.id).then(setFraction);
  }, [book.id]);

  const startLongPress = () => {
    longPressTimer.current = setTimeout(() => {
      onLongPress();
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const percent = fraction !== null ? Math.round(fraction * 100) : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onContextMenu={(e) => { e.preventDefault(); cancelLongPress(); onLongPress(); }}
      className="w-full flex items-center gap-3 px-3 py-2 text-left active:bg-black/5 transition-colors"
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
  );
}
