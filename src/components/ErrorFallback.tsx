interface Props {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#18181b',
        color: '#fafafa',
        fontFamily: 'system-ui, sans-serif',
        gap: '16px',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: '40px' }}>💥</span>
      <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Something went wrong</h1>
      <p style={{ color: '#a1a1aa', fontSize: '14px', maxWidth: '400px', margin: 0 }}>
        {error?.message || 'An unexpected error occurred. It has been reported automatically.'}
      </p>
      <button
        onClick={resetError}
        style={{
          marginTop: '8px',
          padding: '8px 20px',
          borderRadius: '8px',
          border: 'none',
          background: 'linear-gradient(135deg,#e8823c,#d4600a)',
          color: '#fff',
          fontWeight: 600,
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}
