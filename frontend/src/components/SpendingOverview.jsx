import { useState } from 'react';

function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function SpendingOverview({ data }) {
  const [activeSegment, setActiveSegment] = useState(null);

  if (!data) return null;

  const todaySpending = Number(data.total_spending) || 0;
  const weekSpending = Number(data.week_spending) || 0;
  const monthSpending = Number(data.month_spending) || 0;

  // Compute 7-day average pace
  const dailyAverage7d = weekSpending > 0 ? weekSpending / 7 : 0;
  const priorDaysSpending = Math.max(0, weekSpending - todaySpending);

  // Today's share of weekly spending
  const todaySharePercent =
    weekSpending > 0 ? Math.min(100, Math.round((todaySpending / weekSpending) * 100)) : 0;
  const priorSharePercent = Math.max(0, 100 - todaySharePercent);

  // Subtle pace comparison: today vs daily average
  const paceDiff = todaySpending - dailyAverage7d;
  const paceText =
    Math.abs(paceDiff) < 0.5
      ? 'Even with 7-day average'
      : paceDiff > 0
      ? `${formatCurrency(paceDiff)} above daily avg`
      : `${formatCurrency(Math.abs(paceDiff))} below daily avg`;

  return (
    <section className="surface-group apple-chart-section" aria-labelledby="spending-overview-heading">
      <div className="apple-chart-header">
        <div className="apple-chart-title-wrap">
          <span className="apple-chart-kicker">Expenditure</span>
          <h2 id="spending-overview-heading" className="apple-chart-title">Spending Overview</h2>
        </div>
        <div className="apple-chart-meta">
          <span className="apple-chart-stat-number">{formatCurrency(weekSpending)}</span>
          <span className="apple-chart-stat-unit">7-day total</span>
        </div>
      </div>

      <div className="spending-body">
        {/* Minimalist proportional pace track */}
        <div className="spending-pace-wrap">
          <div
            className="spending-pace-bar"
            role="meter"
            aria-label="7-day spending allocation: today vs prior days"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={todaySharePercent}
          >
            {/* Today segment */}
            <div
              className={`spending-segment spending-segment-today ${
                activeSegment === 'today' ? 'active' : ''
              } ${activeSegment === 'prior' ? 'dimmed' : ''}`}
              style={{ width: `${todaySharePercent}%` }}
              onMouseEnter={() => setActiveSegment('today')}
              onMouseLeave={() => setActiveSegment(null)}
              onTouchStart={() => setActiveSegment('today')}
              title={`Today: ${formatCurrency(todaySpending)} (${todaySharePercent}%)`}
            />

            {/* Prior days segment */}
            <div
              className={`spending-segment spending-segment-prior ${
                activeSegment === 'prior' ? 'active' : ''
              } ${activeSegment === 'today' ? 'dimmed' : ''}`}
              style={{ width: `${priorSharePercent}%` }}
              onMouseEnter={() => setActiveSegment('prior')}
              onMouseLeave={() => setActiveSegment(null)}
              onTouchStart={() => setActiveSegment('prior')}
              title={`Prior 6 Days: ${formatCurrency(priorDaysSpending)} (${priorSharePercent}%)`}
            />
          </div>

          {/* Interactive detail pill */}
          <div className="spending-interactive-hint">
            {activeSegment === 'today' ? (
              <div className="brand-detail-pill" role="status">
                <span className="pill-brand">Today</span>
                <span className="pill-dot" aria-hidden="true">·</span>
                <span className="pill-stat">{formatCurrency(todaySpending)}</span>
                <span className="pill-dot" aria-hidden="true">·</span>
                <span className="pill-share">{todaySharePercent}% of 7-day</span>
              </div>
            ) : activeSegment === 'prior' ? (
              <div className="brand-detail-pill" role="status">
                <span className="pill-brand">Prior 6 Days</span>
                <span className="pill-dot" aria-hidden="true">·</span>
                <span className="pill-stat">{formatCurrency(priorDaysSpending)}</span>
                <span className="pill-dot" aria-hidden="true">·</span>
                <span className="pill-share">{priorSharePercent}% of 7-day</span>
              </div>
            ) : (
              <span className="spending-ambient-caption">{paceText}</span>
            )}
          </div>
        </div>

        {/* Apple-style 3-pillar breakdown row */}
        <div className="spending-pillars-container">
          {/* Pillar 1: Today */}
          <div
            className={`spending-pillar ${activeSegment === 'today' ? 'active' : ''}`}
            onMouseEnter={() => setActiveSegment('today')}
            onMouseLeave={() => setActiveSegment(null)}
            onTouchStart={() => setActiveSegment('today')}
            tabIndex={0}
            role="button"
            aria-label={`Today's spending: ${formatCurrency(todaySpending)}`}
          >
            <div className="spending-pillar-top">
              <span className="spending-pillar-dot today-dot" aria-hidden="true" />
              <span className="spending-pillar-label">Today</span>
            </div>
            <span className="spending-pillar-value">{formatCurrency(todaySpending)}</span>
            <span className="spending-pillar-note">{todaySharePercent}% of weekly</span>
          </div>

          <div className="spending-pillar-separator" aria-hidden="true" />

          {/* Pillar 2: 7-Day Average Pace */}
          <div
            className="spending-pillar"
            tabIndex={0}
            role="region"
            aria-label={`7-day daily average: ${formatCurrency(dailyAverage7d)} per day`}
          >
            <div className="spending-pillar-top">
              <span className="spending-pillar-dot avg-dot" aria-hidden="true" />
              <span className="spending-pillar-label">Daily Average</span>
            </div>
            <span className="spending-pillar-value">{formatCurrency(dailyAverage7d)}</span>
            <span className="spending-pillar-note">Past 7 days pace</span>
          </div>

          <div className="spending-pillar-separator" aria-hidden="true" />

          {/* Pillar 3: 30-Day Cumulative */}
          <div
            className="spending-pillar"
            tabIndex={0}
            role="region"
            aria-label={`Monthly spending: ${formatCurrency(monthSpending)}`}
          >
            <div className="spending-pillar-top">
              <span className="spending-pillar-dot month-dot" aria-hidden="true" />
              <span className="spending-pillar-label">30-Day Total</span>
            </div>
            <span className="spending-pillar-value">{formatCurrency(monthSpending)}</span>
            <span className="spending-pillar-note">Past 30 days</span>
          </div>
        </div>
      </div>
    </section>
  );
}
