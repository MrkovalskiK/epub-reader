import { useEffect, useState } from "react";
import { Page, Navbar, Fab, Preloader } from "konsta/react";
import { PlusIcon } from "lucide-react";
import { useLibraryStore } from "~/store/libraryStore";
import { BookCard } from "~/components/BookCard";
import { BookActionSheet } from "~/components/BookActionSheet";
import { importEpub } from "~/services/epubService";
import type { Book } from "~/types/book";

interface Props {
	onOpenBook: (book: Book) => void;
}

export function LibraryScreen({ onOpenBook }: Props) {
	const { books, initialized, init, addBook } = useLibraryStore();
	const [selectedBook, setSelectedBook] = useState<Book | null>(null);

	useEffect(() => {
		if (!initialized) init();
	}, [initialized, init]);

	const handleAdd = async () => {
		const { open } = await import("@tauri-apps/plugin-dialog");
		const selected = await open({
			multiple: false,
			filters: [{ name: "EPUB", extensions: ["epub"] }],
		});
		if (!selected) return;
		try {
			const book = await importEpub(selected as string);
			await addBook(book);
		} catch (err) {
			alert(
				`Ошибка импорта: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	};

	return (
		<Page>
			<Navbar title="Моя библиотека" />
			{!initialized ? (
				<div className="flex flex-col items-center justify-center h-64 gap-4">
					<Preloader />
					<p className="text-sm text-[#49454f]">Загрузка...</p>
				</div>
			) : books.length === 0 ? (
				<div className="flex flex-col items-center justify-center h-64 text-[#49454f]">
					<p>Нет книг.</p>
					<p className="text-sm">Нажмите «+», чтобы импортировать EPUB.</p>
				</div>
			) : (
				<div className="flex flex-col pb-20">
					{books.map((book) => (
						<BookCard
							key={book.id}
							book={book}
							onOpen={() => onOpenBook(book)}
							onLongPress={() => setSelectedBook(book)}
						/>
					))}
				</div>
			)}
			<Fab
				className="fixed bottom-6 right-4 z-10"
				icon={<PlusIcon />}
				onClick={handleAdd}
			/>
			{selectedBook && (
				<BookActionSheet
					book={selectedBook}
					onClose={() => setSelectedBook(null)}
				/>
			)}
		</Page>
	);
}
