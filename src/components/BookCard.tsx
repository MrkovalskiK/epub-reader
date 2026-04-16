import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';
import { ListItem } from 'konsta/react';
import { BookRecord } from '../store/index';

dayjs.extend(relativeTime);
dayjs.locale('ru');

interface BookCardProps {
  book: BookRecord;
  onOpen: () => void;
}

export function BookCard({ book, onOpen }: BookCardProps) {
  const subtitle = [
    book.author,
    book.lastReadAt ? dayjs(book.lastReadAt).locale('ru').fromNow() : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div>
      <ListItem
        link
        title={book.title || 'Без названия'}
        subtitle={subtitle || undefined}
        after={`${book.progressPercent}%`}
        onClick={onOpen}
      />
      <div className="h-1 bg-gray-200 mx-4 mb-2 rounded-full">
        <div
          style={{ width: `${book.progressPercent}%` }}
          className="h-full bg-blue-500 rounded-full transition-all"
        />
      </div>
    </div>
  );
}
