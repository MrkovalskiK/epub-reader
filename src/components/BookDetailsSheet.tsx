import { useState } from 'react';
import { BottomSheet } from '~/components/BottomSheet';
import type { Book } from '~/types/book';
import './BookDetailsSheet.css';

interface Props {
  book: Book;
  onClose: () => void;
}

export function BookDetailsSheet({ book, onClose }: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <BottomSheet title="Детали книги" onClose={onClose}>
      <div className="bds-header-row">
        <div className="bds-cover">
          {book.coverImageUrl && !imgFailed ? (
            <img
              src={book.coverImageUrl}
              alt={book.title}
              className="bds-cover-img"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span className="bds-cover-fallback">📖</span>
          )}
        </div>
        <div className="bds-meta">
          <p className="bds-title">{book.title}</p>
          <p className="bds-author">{book.author}</p>
        </div>
      </div>

      {book.description && (
        <div className="bds-section">
          <p className="bds-section-label">Описание</p>
          <p className="bds-description">{book.description}</p>
        </div>
      )}

      {book.genres && book.genres.length > 0 && (
        <div className="bds-section">
          <p className="bds-section-label">Жанры</p>
          <div className="bds-genres">
            {book.genres.map((genre) => (
              <span key={genre} className="bds-genre-chip">{genre}</span>
            ))}
          </div>
        </div>
      )}

      {(book.publisher || book.publishDate) && (
        <div className="bds-section">
          {book.publisher && (
            <div className="bds-info-row">
              <span className="bds-section-label">Издатель</span>
              <span className="bds-info-value">{book.publisher}</span>
            </div>
          )}
          {book.publishDate && (
            <div className="bds-info-row">
              <span className="bds-section-label">Дата</span>
              <span className="bds-info-value">{book.publishDate}</span>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
