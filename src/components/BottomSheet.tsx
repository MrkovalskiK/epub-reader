import type { ReactNode } from "react";
import { X } from "lucide-react";
import "./BottomSheet.css";

interface Props {
	onClose: () => void;
	title?: string;
	closeLabel?: string;
	children: ReactNode;
	maxHeight?: string;
}

export function BottomSheet({ onClose, title, closeLabel, children, maxHeight = "70vh" }: Props) {
	return (
		<>
			<div className="bs-backdrop" onClick={onClose} />
			<div className="bs-panel" style={{ maxHeight }}>
				<div className="bs-toolbar">
					<span className="bs-title">{title}</span>
					<button type="button" className="bs-close" onClick={onClose}>
						{closeLabel ?? <X size={20} />}
					</button>
				</div>
				<div className="bs-content">{children}</div>
			</div>
		</>
	);
}
