import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

// Monochromatic tonal scales optimized for each theme
const LIGHT_SHADES = [
  '#01285F', // Primary Navy
  '#2B4E80', // Deep Slate Navy
  '#5472A1', // Medium Navy Blue
  '#8098BF', // Muted Soft Navy
  '#AEC0DC', // Light Ice Navy
  '#C8D5EC', // Whisper Navy
];

const DARK_SHADES = [
  '#8FB7FF', // Luminous Primary Blue
  '#6A96E4', // Bright Slate Blue
  '#4E7BC8', // Medium Steel Blue
  '#3962A8', // Slate Navy
  '#2B4B82', // Deep Muted Indigo
  '#1F3762', // Night Navy
];

export function BrandShareSection({ brandUsage = [] }) {
  const [activeBrandIndex, setActiveBrandIndex] = useState(null);
  const { theme } = useTheme();

  const activePalette = theme === 'dark' ? DARK_SHADES : LIGHT_SHADES;

  if (!brandUsage || brandUsage.length === 0) {
    return (
      <section className="surface-group apple-chart-section" aria-labelledby="brand-share-heading">
        <div className="apple-chart-header">
          <div className="apple-chart-title-wrap">
            <span className="apple-chart-kicker">Distribution</span>
            <h2 id="brand-share-heading" className="apple-chart-title">Brand Share</h2>
          </div>
        </div>
        <div className="apple-chart-empty">
          <p className="apple-chart-empty-text">No brand activity recorded</p>
        </div>
      </section>
    );
  }

  // Calculate totals and percentages
  const totalQuantity = brandUsage.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const brandsWithShare = brandUsage.map((item, index) => {
    const qty = Number(item.quantity) || 0;
    const sharePercent = totalQuantity > 0 ? Math.round((qty / totalQuantity) * 100) : 0;
    const color = activePalette[index % activePalette.length];
    return {
      ...item,
      quantity: qty,
      sharePercent,
      color,
      index,
    };
  });

  const activeItem = activeBrandIndex !== null ? brandsWithShare[activeBrandIndex] : null;

  return (
    <section className="surface-group apple-chart-section" aria-labelledby="brand-share-heading">
      <div className="apple-chart-header">
        <div className="apple-chart-title-wrap">
          <span className="apple-chart-kicker">Distribution</span>
          <h2 id="brand-share-heading" className="apple-chart-title">Brand Share</h2>
        </div>
        <div className="apple-chart-meta">
          <span className="apple-chart-stat-number">{brandUsage.length}</span>
          <span className="apple-chart-stat-unit">
            {brandUsage.length === 1 ? 'brand' : 'brands'} · {totalQuantity} total
          </span>
        </div>
      </div>

      <div className="brand-share-body">
        {/* Apple-style segmented distribution bar */}
        <div
          className="brand-segmented-bar"
          role="meter"
          aria-label="Brand usage distribution bar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={100}
        >
          {brandsWithShare.map((b) => {
            const isHovered = activeBrandIndex === b.index;
            const isDimmed = activeBrandIndex !== null && !isHovered;

            return (
              <div
                key={b.brand}
                className={`brand-segment ${isHovered ? 'active' : ''} ${isDimmed ? 'dimmed' : ''}`}
                style={{
                  width: `${b.sharePercent}%`,
                  backgroundColor: b.color,
                }}
                onMouseEnter={() => setActiveBrandIndex(b.index)}
                onMouseLeave={() => setActiveBrandIndex(null)}
                onTouchStart={() => setActiveBrandIndex(b.index)}
                title={`${b.brand}: ${b.quantity} (${b.sharePercent}%)`}
              />
            );
          })}
        </div>

        {/* Floating subtle detail pill when interacting */}
        <div className="brand-interactive-hint">
          {activeItem ? (
            <div className="brand-detail-pill" role="status" aria-live="polite">
              <span className="pill-brand">{activeItem.brand}</span>
              <span className="pill-dot" aria-hidden="true">·</span>
              <span className="pill-stat">
                {activeItem.quantity} {activeItem.quantity === 1 ? 'cigarette' : 'cigarettes'}
              </span>
              <span className="pill-dot" aria-hidden="true">·</span>
              <span className="pill-share">{activeItem.sharePercent}%</span>
            </div>
          ) : (
            <span className="brand-ambient-label">Tap or hover any brand for breakdown</span>
          )}
        </div>

        {/* Clean, typography-first breakdown rows */}
        <div className="brand-items-list">
          {brandsWithShare.map((b, idx) => {
            const isHovered = activeBrandIndex === b.index;
            const isDimmed = activeBrandIndex !== null && !isHovered;

            return (
              <div key={b.brand}>
                {idx > 0 && <div className="brand-item-separator" aria-hidden="true" />}
                <div
                  className={`brand-item-row ${isHovered ? 'active' : ''} ${isDimmed ? 'dimmed' : ''}`}
                  onMouseEnter={() => setActiveBrandIndex(b.index)}
                  onMouseLeave={() => setActiveBrandIndex(null)}
                  onTouchStart={() => setActiveBrandIndex(b.index)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${b.brand}: ${b.quantity} cigarettes, ${b.sharePercent}%`}
                >
                  <div className="brand-item-left">
                    <span
                      className="brand-color-dot"
                      style={{ backgroundColor: b.color }}
                      aria-hidden="true"
                    />
                    <span className="brand-name">{b.brand}</span>
                  </div>

                  <div className="brand-item-right">
                    <span className="brand-quantity">
                      {b.quantity} {b.quantity === 1 ? 'unit' : 'units'}
                    </span>
                    <span className="brand-share-pct">{b.sharePercent}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
