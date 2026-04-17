import type { Book } from '~/types/book'

export const getCoverFilename = (book: Book) => `${book.id}/cover.png`
