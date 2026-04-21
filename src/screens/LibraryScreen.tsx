import { useEffect, useState } from "react";
import { Preloader, Toast } from "konsta/react";
import { PlusIcon } from "lucide-react";
import { useLibraryStore } from "~/store/libraryStore";
import { BookCard } from "~/components/BookCard";
import { BookDetailsSheet } from "~/components/BookDetailsSheet";
import { importEpub, deleteBookFiles, DuplicateBookError } from "~/services/epubService";
import { deleteBookProgress } from "~/services/storageService";
import type { Book } from "~/types/book";
import "./LibraryScreen.css";

interface Props {
	onOpenBook: (book: Book) => void;
}

export function LibraryScreen({ onOpenBook }: Props) {
	const { books, initialized, init, addBook, removeBook } = useLibraryStore();
	const [detailsBook, setDetailsBook] = useState<Book | null>(null);
	const [isImporting, setIsImporting] = useState(false);
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!initialized) init();
	}, [initialized, init]);

	const handleDelete = async (book: Book) => {
		const { ask } = await import("@tauri-apps/plugin-dialog");
		const confirmed = await ask(`Удалить «${book.title}»?`, { title: "Удаление книги", kind: "warning" });
		if (!confirmed) return;
		await deleteBookFiles(book);
		await deleteBookProgress(book.id);
		await removeBook(book.id);
	};

	const handleAdd = async () => {
		const { open } = await import("@tauri-apps/plugin-dialog");
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
				setToastMessage("This book is already in your library");
			} else {
				setToastMessage(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
			}
		} finally {
			setIsImporting(false);
		}
	};

	return (
		<div className="lib-root">
			<div className="lib-header">
				<span className="lib-header-title">Моя библиотека</span>
			</div>

			<div className="lib-scroll">
				{!initialized ? (
					<div className="lib-state-center">
						<Preloader />
						<p className="lib-state-text">Загрузка...</p>
					</div>
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

			{isImporting && (
				<div className="lib-overlay">
					<Preloader />
					<p className="lib-state-text">Импорт книги…</p>
				</div>
			)}

			<button
				type="button"
				className="lib-fab"
				onClick={handleAdd}
				disabled={isImporting}
			>
				<PlusIcon size={24} />
			</button>

			{detailsBook && <BookDetailsSheet book={detailsBook} onClose={() => setDetailsBook(null)} />}

			<Toast
				opened={toastMessage !== null}
				button={
					<button type="button" onClick={() => setToastMessage(null)}>
						OK
					</button>
				}
			>
				{toastMessage}
			</Toast>
		</div>
	);
}
