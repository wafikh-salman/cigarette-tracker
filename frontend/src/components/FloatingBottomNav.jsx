export function FloatingBottomNav({ activeTab = 'overview', onSelectTab }) {
  const navItems = [
    {
      id: 'overview',
      label: 'Dashboard',
      renderIcon: (isActive) =>
        isActive ? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
            <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
            <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
            <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
            <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
            <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
          </svg>
        ),
    },
    {
      id: 'brands',
      label: 'Brands',
      renderIcon: (isActive) =>
        isActive ? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12.293 2.293A1 1 0 0 1 13 2h7a2 2 0 0 1 2 2v7a1 1 0 0 1-.293.707l-9.5 9.5a2 2 0 0 1-2.828 0l-6.086-6.086a2 2 0 0 1 0-2.828l9.5-9.5zM17 7.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <circle cx="7" cy="7" r="1.5" fill="currentColor" />
          </svg>
        ),
    },
    {
      id: 'history',
      label: 'History',
      renderIcon: (isActive) =>
        isActive ? (
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.35"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9.25" />
            <polyline points="12 7 12 12 15.5 14.2" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9.25" />
            <polyline points="12 7 12 12 15.5 14" />
          </svg>
        ),
    },
    {
      id: 'settings',
      label: 'Settings',
      renderIcon: (isActive) =>
        isActive ? (
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ),
    },
  ];

  return (
    <nav
      className="floating-bottom-nav"
      aria-label="Mobile Navigation"
      role="navigation"
    >
      <div className="floating-bottom-nav__pill" role="tablist">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={item.label}
              className={`floating-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab && onSelectTab(item.id)}
            >
              <span className="floating-nav-icon">
                {item.renderIcon(isActive)}
              </span>
              <span className="floating-nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
