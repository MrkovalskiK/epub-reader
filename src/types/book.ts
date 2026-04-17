export interface Book {
  id: string
  title: string
  author: string
  localPath: string
  coverPath?: string
  coverImageUrl?: string | null
  addedAt: number
}

export interface ReadingProgress {
  bookId: string
  cfi: string
  fraction: number
  updatedAt: number
}

export interface TOCItem {
  label: string
  href: string
  subitems?: TOCItem[]
}
