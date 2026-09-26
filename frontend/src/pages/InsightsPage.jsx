import { useState, useEffect, useCallback } from 'react';
import { getInsightsData } from '../services/insightsService';
import { InsightsTrendChart } from '../components/InsightsTrendChart';

/**
 * Format currency in Indian Rupees (₹)
 */
function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format comparison direction arrows and absolute text
 * negative → ↓
 * positive → ↑
 * zero → —
 */
function formatComparison(val, isCurrency = false) {
  const num = Number(val) || 0;
  if (num === 0) {
    return {
      arrow: '—',
      text: isCurrency ? '₹0' : '0%',
      signClass: 'neutral',
    };
  }
  const abs = Math.abs(num);
  const arrow = num > 0 ? '↑' : '↓';
  const text = isCurrency ? formatCurrency(abs) : `${abs.toFixed(2).replace(/\.00$/, '')}%`;
  return {
    arrow,
    text,
    signClass: num > 0 ? 'up' : 'down',
  };
}

/**
 * Skeleton loader representing the shape of the insights page.
 */
function InsightsSkeleton() {
  return (
    <div className="insights-skeleton-wrapper" aria-busy="true" aria-label="Loading insights">
      <div className="skeleton-header">
        <div className="skeleton-shimmer skeleton-kicker" />
        <div className="skeleton-shimmer skeleton-title" />
        <div className="skeleton-shimmer skeleton-subtitle" />
      </div>

      <div className="skeleton-metrics-surface">
        <div className="skeleton-shimmer skeleton-section-header" />
        <div className="skeleton-metrics-grid">
          <div className="skeleton-shimmer skeleton-metric-card" />
          <div className="skeleton-shimmer skeleton-metric-card" />
          <div className="skeleton-shimmer skeleton-metric-card" />
        </div>
      </div>

      <div className="skeleton-comparison-row">
        <div className="skeleton-shimmer skeleton-comparison-card" />
        <div className="skeleton-shimmer skeleton-comparison-card" />
      </div>

      <div className="skeleton-shimmer skeleton-chart-card" />

      <div className="skeleton-shimmer skeleton-secondary-card" />
    </div>
  );
}

export function InsightsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getInsightsData();
      setData(response);
    } catch (err) {
      setError(err.message || 'Unable to load insights.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (loading) {
    return (
      <div className="insights-page">
        <main className="insights-content">
          <InsightsSkeleton />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="insights-page">
        <main className="insights-content">
          <div className="insights-error-card" role="alert">
            <h2 className="insights-error-title">Unable to load insights.</h2>
            <p className="insights-error-msg">{error}</p>
            <button
              type="button"
              className="insights-retry-btn"
              onClick={fetchInsights}
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  const currentWeek = data?.current_week || { usage: 0, spending: 0, average_per_day: 0 };
  const previousWeek = data?.previous_week || { usage: 0, spending: 0, average_per_day: 0 };
  const comparison = data?.comparison || { usage_change_percent: 0, spending_change: 0 };
  const dailyUsage = data?.daily_usage || [];

  const usageChange = formatComparison(comparison.usage_change_percent, false);
  const spendingChange = formatComparison(comparison.spending_change, true);

  return (
    <div className="insights-page">
      <main className="insights-content">
        <div className="insights-stack">
          {/* 1. Page Header */}
          <header className="insights-header">
            <span className="insights-kicker">Analytics & Trends</span>
            <h1 className="insights-title">Insights</h1>
            <p className="insights-subtitle">Understand your usage and spending patterns.</p>
          </header>

          {/* 2. Current Week Overview */}
          <section className="insights-metrics-surface" aria-labelledby="current-week-heading">
            <div className="insights-section-header">
              <span className="insights-section-kicker">Active Period</span>
              <h2 id="current-week-heading" className="insights-section-title">Current Week Overview</h2>
            </div>

            <div className="insights-primary-grid">
              <div className="insights-metric-cell">
                <span className="insights-metric-label">Usage</span>
                <div className="insights-metric-value-wrap">
                  <span className="insights-metric-val">{currentWeek.usage}</span>
                  <span className="insights-metric-unit">cigarettes</span>
                </div>
              </div>

              <div className="insights-metric-divider" aria-hidden="true" />

              <div className="insights-metric-cell">
                <span className="insights-metric-label">Spending</span>
                <div className="insights-metric-value-wrap">
                  <span className="insights-metric-val">{formatCurrency(currentWeek.spending)}</span>
                  <span className="insights-metric-unit">expenditure</span>
                </div>
              </div>

              <div className="insights-metric-divider" aria-hidden="true" />

              <div className="insights-metric-cell">
                <span className="insights-metric-label">Average / Day</span>
                <div className="insights-metric-value-wrap">
                  <span className="insights-metric-val">{currentWeek.average_per_day}</span>
                  <span className="insights-metric-unit">daily avg</span>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Week-Over-Week Comparison */}
          <section className="insights-comparison-section" aria-labelledby="comparison-heading">
            <div className="insights-section-header">
              <span className="insights-section-kicker">Performance</span>
              <h2 id="comparison-heading" className="insights-section-title">Week-over-Week</h2>
            </div>

            <div className="insights-comparison-grid">
              <div className="insights-comparison-card">
                <div className="insights-comparison-meta">
                  <span className="insights-comparison-label">Usage Change</span>
                  <span className="insights-comparison-sub">vs previous week</span>
                </div>
                <div className="insights-comparison-indicator">
                  <span className="insights-comparison-arrow">{usageChange.arrow}</span>
                  <span className="insights-comparison-value">{usageChange.text}</span>
                </div>
              </div>

              <div className="insights-comparison-card">
                <div className="insights-comparison-meta">
                  <span className="insights-comparison-label">Spending Change</span>
                  <span className="insights-comparison-sub">vs previous week</span>
                </div>
                <div className="insights-comparison-indicator">
                  <span className="insights-comparison-arrow">{spendingChange.arrow}</span>
                  <span className="insights-comparison-value">{spendingChange.text}</span>
                </div>
              </div>
            </div>
          </section>

          {/* 4. 7-Day Usage Trend */}
          <InsightsTrendChart dailyUsage={dailyUsage} />

          {/* 5. Previous Week Summary */}
          <section className="insights-secondary-surface" aria-labelledby="previous-week-heading">
            <div className="insights-secondary-header">
              <span className="insights-section-kicker">Prior Completed Cycle</span>
              <h3 id="previous-week-heading" className="insights-secondary-title">Previous Week Summary</h3>
            </div>

            <div className="insights-secondary-grid">
              <div className="insights-secondary-item">
                <span className="insights-secondary-label">Total Usage</span>
                <span className="insights-secondary-value">{previousWeek.usage} cigarettes</span>
              </div>
              <div className="insights-secondary-item">
                <span className="insights-secondary-label">Total Spent</span>
                <span className="insights-secondary-value">{formatCurrency(previousWeek.spending)}</span>
              </div>
              <div className="insights-secondary-item">
                <span className="insights-secondary-label">Daily Average</span>
                <span className="insights-secondary-value">{previousWeek.average_per_day} / day</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
