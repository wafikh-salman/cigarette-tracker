import { useTheme } from '../context/ThemeContext';

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="settings-page">
      <main className="settings-content">
        <div className="editorial-stack">
          {/* Header */}
          <header className="editorial-header">
            <span className="editorial-kicker">Preferences</span>
            <h1 className="editorial-title">Settings</h1>
            <p className="editorial-description">
              Manage your display theme, regional preferences, and application settings.
            </p>
          </header>

          {/* Section 1: Appearance */}
          <section className="settings-group" aria-labelledby="heading-appearance">
            <h2 id="heading-appearance" className="settings-group-heading">
              Appearance
            </h2>
            <div className="settings-card">
              <div className="settings-row">
                <div className="settings-row-text">
                  <span className="settings-row-title">Color Theme</span>
                  <span className="settings-row-desc">
                    Switch between Apple Light and Dark modes.
                  </span>
                </div>
                <div className="settings-segmented-theme" role="radiogroup" aria-label="Theme mode">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={theme === 'light'}
                    className={`settings-theme-btn ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => theme === 'dark' && toggleTheme()}
                  >
                    ☀️ Light
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={theme === 'dark'}
                    className={`settings-theme-btn ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => theme === 'light' && toggleTheme()}
                  >
                    🌙 Dark
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Regional & Units */}
          <section className="settings-group" aria-labelledby="heading-regional">
            <h2 id="heading-regional" className="settings-group-heading">
              Regional & Units
            </h2>
            <div className="settings-card">
              <div className="settings-row">
                <span className="settings-row-title">Currency</span>
                <span className="settings-row-value">Indian Rupee (₹ INR)</span>
              </div>
              <div className="settings-row-divider" />
              <div className="settings-row">
                <span className="settings-row-title">Timezone</span>
                <span className="settings-row-value">IST (UTC+5:30)</span>
              </div>
              <div className="settings-row-divider" />
              <div className="settings-row">
                <span className="settings-row-title">Unit of Measure</span>
                <span className="settings-row-value">Cigarettes (Count)</span>
              </div>
            </div>
          </section>

          {/* Section 3: System Status & Info */}
          <section className="settings-group" aria-labelledby="heading-system">
            <h2 id="heading-system" className="settings-group-heading">
              System & About
            </h2>
            <div className="settings-card">
              <div className="settings-row">
                <span className="settings-row-title">Service Status</span>
                <div className="settings-status-badge">
                  <span className="status-indicator-dot" aria-hidden="true" />
                  <span>Online & Synced</span>
                </div>
              </div>
              <div className="settings-row-divider" />
              <div className="settings-row">
                <span className="settings-row-title">Application</span>
                <span className="settings-row-value">Aura — Personal Tracker</span>
              </div>
              <div className="settings-row-divider" />
              <div className="settings-row">
                <span className="settings-row-title">Mode</span>
                <span className="settings-row-value">Personal Single-User Utility</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
