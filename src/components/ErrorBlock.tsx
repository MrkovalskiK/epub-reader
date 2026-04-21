import './ErrorBlock.css';

interface ErrorBlockProps {
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
  onRemove?: () => void;
  onRelink?: () => void;
}

export function ErrorBlock({ message, onRetry, onBack, onRemove, onRelink }: ErrorBlockProps) {
  return (
    <div className="eb-root">
      <div className="eb-icon">📄</div>
      <p className="eb-message">{message}</p>
      <div className="eb-actions">
        {onRelink && <button type="button" className="eb-btn eb-btn--primary" onClick={onRelink}>Выбрать файл заново</button>}
        {onRetry && <button type="button" className="eb-btn eb-btn--primary" onClick={onRetry}>Повторить</button>}
        {onRemove && <button type="button" className="eb-btn eb-btn--danger" onClick={onRemove}>Удалить из библиотеки</button>}
        {onBack && <button type="button" className="eb-btn eb-btn--secondary" onClick={onBack}>В библиотеку</button>}
      </div>
    </div>
  );
}
