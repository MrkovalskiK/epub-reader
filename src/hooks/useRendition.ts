import { useState, useEffect, useRef, type RefObject } from "react";
import type { Book, Rendition } from "epubjs";
import type { ReaderSettings } from "../store/index";

interface UseRenditionOptions {
	book: Book | null;
	containerRef: RefObject<HTMLDivElement | null>;
	settings: ReaderSettings;
	initialCfi: string | null;
	onRelocated: (cfi: string, index: number, skipTitleUpdate?: boolean) => void;
}

interface UseRenditionResult {
	next: () => void;
	prev: () => void;
	displayHref: (href: string) => void;
	isEmpty: boolean;
}

const THEMES = {
	light: { body: { background: "#ffffff", color: "#1a1a1a" } },
	sepia: { body: { background: "#f4ecd8", color: "#3b2f1e" } },
	dark: { body: { background: "#1a1a1a", color: "#e0e0e0" } },
};

export function useRendition({
	book,
	containerRef,
	settings,
	initialCfi,
	onRelocated,
}: UseRenditionOptions): UseRenditionResult {
	const renditionRef = useRef<Rendition | null>(null);
	const [isEmpty, setIsEmpty] = useState(false);
	const onRelocatedRef = useRef(onRelocated);

	useEffect(() => {
		onRelocatedRef.current = onRelocated;
	}, [onRelocated]);

	useEffect(() => {
		setIsEmpty(false);
		if (!book || !containerRef.current) return;

		const rendition = book.renderTo(containerRef.current, {
			flow: "scrolled-doc",
			width: "100%",
			height: "100%",
		});

		renditionRef.current = rendition;

		Object.entries(THEMES).forEach(([name, styles]) => {
			rendition.themes.register(name, styles);
		});
		rendition.themes.select(settings.theme);
		rendition.themes.fontSize(settings.fontSize + "px");

		const spineLength: number =
			(book.spine as any)?.items?.length ?? 0;

		rendition.on(
			"relocated",
			(loc: { start: { cfi: string; index: number } }) => {
				const contents = (rendition as any).getContents?.() ?? [];
				const body: HTMLBodyElement | undefined =
					contents[0]?.document?.body;
				const hasContent = !body || (body.textContent ?? '').trim().length > 50;

				if (!hasContent) {
					if (loc.start.index < spineLength - 1) {
						// more spine items ahead — skip this empty one
						rendition.next();
					} else {
						// last spine item and it's empty — show overlay and report 100% progress
						setIsEmpty(true);
						onRelocatedRef.current(loc.start.cfi, loc.start.index, true);
					}
					return;
				}

				setIsEmpty(false);
				onRelocatedRef.current(loc.start.cfi, loc.start.index);
			},
		);

		(async () => {
			try {
				await rendition.display(initialCfi ?? undefined);
			} catch (e) {
				console.warn(
					"[useRendition] display(initialCfi) failed, falling back to start:",
					e,
				);
				await rendition.display();
			}
		})();

		return () => {
			rendition.destroy();
			renditionRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [book]);

	useEffect(() => {
		const r = renditionRef.current;
		if (!r) return;
		r.themes.select(settings.theme);
		r.themes.fontSize(settings.fontSize + "px");
	}, [settings.theme, settings.fontSize]);

	return {
		next: () => renditionRef.current?.next(),
		prev: () => renditionRef.current?.prev(),
		displayHref: (href) => renditionRef.current?.display(href),
		isEmpty,
	};
}
