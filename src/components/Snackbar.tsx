import { snackbars } from "~/store/snackbarStore";
import "./Snackbar.css";

export function Snackbar() {
	const message = snackbars((s) => s.message);

	if (!message) return null;

	return (
		<div className="snackbar">
			<span className="snackbar-text">{message}</span>
		</div>
	);
}
