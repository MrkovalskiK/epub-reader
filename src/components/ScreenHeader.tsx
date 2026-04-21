import type { ReactNode } from "react";
import "./ScreenHeader.css";

interface Props {
	title: string;
	rightAction?: ReactNode;
}

export function ScreenHeader({ title, rightAction }: Props) {
	return (
		<div className="screen-header">
			<span className="screen-header-title">{title}</span>
			{rightAction && <div className="screen-header-right">{rightAction}</div>}
		</div>
	);
}
