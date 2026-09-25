export function LoadingState({ message = 'Retrieving data...' } = {}) {
  return (
    <div className="status-state loading-state">
      <div className="loading-spinner" aria-hidden="true"></div>
      <p className="status-text">{message}</p>
    </div>
  );
}

export function ErrorState({ title = 'Unable to load data', message, onRetry }) {
  return (
    <div className="status-state error-state">
      <div className="error-content">
        <p className="error-title">{title}</p>
        <p className="error-message">{message || 'An unexpected error occurred while communicating with the server.'}</p>
        {onRetry && (
          <button type="button" className="retry-button" onClick={onRetry}>
            Retry Connection
          </button>
        )}
      </div>
    </div>
  );
}
