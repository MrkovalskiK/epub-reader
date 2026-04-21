import { useEffect, useRef, useState } from "react";
import { Info, Trash2 } from "lucide-react";
import { loadFraction } from "~/services/storageService";
import type { Book } from "~/types/book";
import "./BookCard.css";

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

  const percent = fraction !== null ? Math.round(fraction * 100) : null;

  return (
    <div className="bk-card">
      <button type="button" className="bk-cover-btn" onClick={onOpen}>
        <div className="bk-cover-wrap">
          <div className="bk-cover-inner">
            {book.coverImageUrl && !imgFailed ? (
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="bk-cover-img"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span className="bk-cover-fallback">📖</span>
            )}
          </div>
        </div>
      </button>

      <div className="bk-actions">
        <button type="button" className="bk-action-btn" onClick={onShowDetails}>
          <Info size={14} />
        </button>
        <button type="button" className="bk-action-btn bk-action-btn--delete" onClick={onDelete}>
          <Trash2 size={14} />
        </button>
      </div>

      <div className="bk-info">
        <p className="bk-title">{book.title}</p>
        <p className="bk-author">{book.author}</p>
        {percent !== null && (
          <div className="bk-progress-row">
            <div className="bk-progress-bar">
              <div className="bk-progress-fill" style={{ width: `${percent}%` }} />
            </div>
            <span className="bk-progress-label">{percent}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
