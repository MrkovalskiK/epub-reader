import { useEffect } from "react";
import { Page, Navbar, Fab } from "konsta/react";
import { PlusIcon } from "lucide-react";
import { useLibraryStore } from "~/store/libraryStore";
import { BookCard } from "~/components/BookCard";
import { importEpub } from "~/services/epubService";
import type { Book } from "~/types/book";

interface Props {
	onOpenBook: (book: Book) => void;
}

export function LibraryScreen({ onOpenBook }: Props) {
	const { books, initialized, init, addBook } = useLibraryStore();

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
				`Import failed: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	};

	return (
		<Page>
			<Navbar title="My Library" />
			{books.length === 0 ? (
				<div className="flex flex-col items-center justify-center h-64 text-[#49454f]">
					<p>No books yet.</p>
					<p className="text-sm">Tap &quot;Add Book&quot; to import an EPUB.</p>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-3 p-4 pb-20">
					{books.map((book) => (
						<BookCard
							key={book.id}
							book={book}
							onOpen={() => onOpenBook(book)}
						/>
					))}
				</div>
			)}
			<Fab
				className="fixed bottom-6 right-4 z-10"
				icon={<PlusIcon />}
				onClick={handleAdd}
			/>
		</Page>
	);
}
