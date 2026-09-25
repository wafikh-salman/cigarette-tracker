function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatQuantity(quantity) {
  const num = typeof quantity === 'number' ? quantity : Number(quantity) || 0;
  return new Intl.NumberFormat('en-US').format(num);
}

export function MetricSection({ data }) {
  if (!data) return null;

  const {
    total_quantity = 0,
    total_spending = 0,
    week_quantity = 0,
    week_spending = 0,
    month_quantity = 0,
    month_spending = 0,
  } = data;

  return (
    <div className="metrics-wrapper">
      {/* Primary: Today's Metrics */}
      <section className="surface-group today-group" aria-labelledby="today-heading">
        <div className="group-header">
          <h2 id="today-heading" className="group-title">Today</h2>
          <span className="group-badge">Active Period</span>
        </div>

        <div className="metrics-grid primary-grid">
          <div className="metric-cell">
            <span className="metric-label">Cigarettes</span>
            <div className="metric-value-wrap">
              <span className="metric-value-primary">{formatQuantity(total_quantity)}</span>
              <span className="metric-unit">count</span>
            </div>
            <span className="metric-caption">Today's total usage</span>
          </div>

          <div className="cell-divider" aria-hidden="true"></div>

          <div className="metric-cell">
            <span className="metric-label">Spending</span>
            <div className="metric-value-wrap">
              <span className="metric-value-primary">{formatCurrency(total_spending)}</span>
            </div>
            <span className="metric-caption">Today's expenditure</span>
          </div>
        </div>
      </section>

      {/* Secondary: Weekly and Monthly Periods */}
      <section className="surface-group breakdown-group" aria-labelledby="periods-heading">
        <div className="group-header">
          <h2 id="periods-heading" className="group-title">Cumulative Periods</h2>
        </div>

        <div className="periods-container">
          {/* Weekly Period */}
          <div className="period-block">
            <div className="period-header">
              <span className="period-name">Past 7 Days</span>
            </div>
            <div className="period-metrics-row">
              <div className="sub-metric">
                <span className="sub-metric-label">Weekly Quantity</span>
                <span className="sub-metric-value">{formatQuantity(week_quantity)}</span>
                <span className="sub-metric-unit">cigarettes</span>
              </div>
              <div className="sub-divider" aria-hidden="true"></div>
              <div className="sub-metric">
                <span className="sub-metric-label">Weekly Spending</span>
                <span className="sub-metric-value">{formatCurrency(week_spending)}</span>
                <span className="sub-metric-unit">total cost</span>
              </div>
            </div>
          </div>

          <div className="horizontal-separator" aria-hidden="true"></div>

          {/* Monthly Period */}
          <div className="period-block">
            <div className="period-header">
              <span className="period-name">Past 30 Days</span>
            </div>
            <div className="period-metrics-row">
              <div className="sub-metric">
                <span className="sub-metric-label">Monthly Quantity</span>
                <span className="sub-metric-value">{formatQuantity(month_quantity)}</span>
                <span className="sub-metric-unit">cigarettes</span>
              </div>
              <div className="sub-divider" aria-hidden="true"></div>
              <div className="sub-metric">
                <span className="sub-metric-label">Monthly Spending</span>
                <span className="sub-metric-value">{formatCurrency(month_spending)}</span>
                <span className="sub-metric-unit">total cost</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
