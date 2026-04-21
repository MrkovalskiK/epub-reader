interface SpinnerProps {
  label?: string;
  background?: string;
}

export function Spinner({ label, background }: SpinnerProps) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      background: background ?? 'var(--theme-bg-color, #fff)',
    }}>
      <svg
        aria-hidden="true"
        width="36"
        height="36"
        viewBox="0 0 36 36"
        style={{ animation: 'epub-spin 0.8s linear infinite' }}
      >
        <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" stroke="#e0e0e0" />
        <path d="M18 4 a14 14 0 0 1 14 14" fill="none" strokeWidth="3" stroke="#555" strokeLinecap="round" />
        <style>{`@keyframes epub-spin{to{transform:rotate(360deg);transform-origin:18px 18px}}`}</style>
      </svg>
      {label && <p style={{ margin: 0, fontSize: 14, color: '#49454f' }}>{label}</p>}
    </div>
  );
}
