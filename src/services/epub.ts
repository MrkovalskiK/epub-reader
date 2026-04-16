import ePub, { Book } from 'epubjs';

export function openBookFromBuffer(buffer: ArrayBuffer): Book {
  return ePub(buffer);
}
