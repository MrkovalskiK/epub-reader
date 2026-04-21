import { useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";
import { open, ask } from "@tauri-apps/plugin-dialog";
import { Spinner } from "~/components/Spinner";
import { ScreenHeader } from "~/components/ScreenHeader";
import { useLibraryStore } from "~/store/libraryStore";
import { BookCard } from "~/components/BookCard";
import { BookDetailsSheet } from "~/components/BookDetailsSheet";
import { importEpub, deleteBookFiles, DuplicateBookError } from "~/services/epubService";
import { deleteBookProgress } from "~/services/storageService";
import { snackbars } from "~/store/snackbarStore";
import type { Book } from "~/types/book";
import "./LibraryScreen.css";

interface Props {
	onOpenBook: (book: Book) => void;
}

export function LibraryScreen({ onOpenBook }: Props) {
	const { books, initialized, init, addBook, removeBook } = useLibraryStore();
	const [detailsBook, setDetailsBook] = useState<Book | null>(null);
	const [isImporting, setIsImporting] = useState(false);

	useEffect(() => {
		if (!initialized) init();
	}, [initialized, init]);

	const handleDelete = async (book: Book) => {
		const confirmed = await ask(`Удалить «${book.title}»?`, { title: "Удаление книги", kind: "warning" });
		if (!confirmed) return;
		await deleteBookFiles(book);
		await deleteBookProgress(book.id);
		await removeBook(book.id);
	};

	const handleAdd = async () => {
		const selected = await open({
			multiple: false,
			filters: [{ name: "EPUB", extensions: ["epub"] }],
		});
		if (!selected) return;
		setIsImporting(true);
		try {
			const book = await importEpub(selected as string);
			await addBook(book);
		} catch (err) {
			if (err instanceof DuplicateBookError) {
				snackbars.getState().open("This book is already in your library");
			} else {
				console.error('[import]', err);
				snackbars.getState().open(`Import failed: ${err instanceof Error ? err.message : String(err)}`, 5000);
			}
		} finally {
			setIsImporting(false);
		}
	};

	return (
		<div className="lib-root">
			<ScreenHeader title="Моя библиотека" />

			<div className="lib-scroll">
				{!initialized ? (
					<Spinner />
				) : books.length === 0 ? (
					<div className="lib-state-center">
						<p className="lib-state-empty-icon">📚</p>
						<p className="lib-state-text">Нет книг</p>
						<p className="lib-state-hint">Нажмите «+», чтобы импортировать EPUB</p>
					</div>
				) : (
					<div className="lib-grid">
						{books.map((book) => (
							<BookCard
								key={book.id}
								book={book}
								onOpen={() => onOpenBook(book)}
								onDelete={() => handleDelete(book)}
								onShowDetails={() => setDetailsBook(book)}
							/>
						))}
					</div>
				)}
			</div>

			{isImporting && <Spinner label="Импортирование..." background="rgba(243,239,248,0.92)" />}

			<button
				type="button"
				className="lib-fab"
				onClick={handleAdd}
				disabled={isImporting}
			>
				<PlusIcon size={24} />
			</button>

			{detailsBook && <BookDetailsSheet book={detailsBook} onClose={() => setDetailsBook(null)} />}
		</div>
	);
}
