function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function QuickAddSection({ entries, onUpdateQuantity, updatingId, actionError }) {
  if (!entries || entries.length === 0) {
    return (
      <section className="surface-group quick-add-group" aria-labelledby="quick-add-heading">
        <div className="group-header">
          <h2 id="quick-add-heading" className="group-title">Today's Log</h2>
          <span className="group-badge">Quick Add</span>
        </div>
        <p className="empty-entries-message">No entries recorded for today yet.</p>
      </section>
    );
  }

  return (
    <section className="surface-group quick-add-group" aria-labelledby="quick-add-heading">
      <div className="group-header">
        <h2 id="quick-add-heading" className="group-title">Today's Log</h2>
        <span className="group-badge">Quick Adjust</span>
      </div>

      {actionError && (
        <div className="inline-action-error" role="alert">
          {actionError}
        </div>
      )}

      <div className="quick-entries-list">
        {entries.map((entry, index) => {
          const isUpdating = updatingId === entry.id;
          const isMinQuantity = entry.quantity <= 1;

          return (
            <div key={entry.id} className="entry-item-container">
              {index > 0 && <div className="entry-separator" aria-hidden="true"></div>}

              <div className="entry-row">
                <div className="entry-info">
                  <span className="entry-brand-name">{entry.brand_name || 'Brand'}</span>
                  <span className="entry-amount">{formatCurrency(entry.amount)}</span>
                </div>

                <div className="entry-stepper" aria-label={`Adjust count for ${entry.brand_name}`}>
                  <button
                    type="button"
                    className="stepper-btn stepper-btn-decrease"
                    aria-label={`Decrease ${entry.brand_name} count`}
                    disabled={isUpdating || isMinQuantity}
                    onClick={() => onUpdateQuantity(entry.id, 'decrease')}
                  >
                    −
                  </button>

                  <span className="stepper-quantity" aria-live="polite">
                    {isUpdating ? <span className="stepper-mini-loader">...</span> : entry.quantity}
                  </span>

                  <button
                    type="button"
                    className="stepper-btn stepper-btn-increase"
                    aria-label={`Increase ${entry.brand_name} count`}
                    disabled={isUpdating}
                    onClick={() => onUpdateQuantity(entry.id, 'increase')}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
