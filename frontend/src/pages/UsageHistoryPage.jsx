import { useState, useEffect, useCallback } from 'react';
import { getEntries, updateEntry, deleteEntry, createEntry } from '../services/entriesService';
import { getBrands } from '../services/brandService';
import { LoadingState, ErrorState } from '../components/StatusMessage';

const PAGE_SIZE = 10;

/**
 * Formats ISO date string to user-friendly "MMM D, YYYY" format.
 * Example: 2026-09-25T11:09:27+05:30 -> Sep 25, 2026
 */
function formatEntryDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats ISO date string to user-friendly "h:mm A" format.
 * Example: 2026-09-25T11:09:27+05:30 -> 11:09 AM
 */
function formatEntryTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Formats a currency amount into Indian Rupees (INR).
 * Example: 25.0 -> ₹25.00
 */
function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formats quantity with singular/plural suffix.
 * Example: 1 -> "1 cigarette", 2 -> "2 cigarettes"
 */
function formatQuantity(qty) {
  const count = typeof qty === 'number' ? qty : Number(qty) || 0;
  return `${count} ${count === 1 ? 'cigarette' : 'cigarettes'}`;
}

export function UsageHistoryPage() {
  const [entries, setEntries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [error, setError] = useState(null);
  const [pageError, setPageError] = useState(null);

  // Add entry modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [addQuantity, setAddQuantity] = useState('1');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  // Edit entry state
  const [editingEntry, setEditingEntry] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  // Delete entry state
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchEntries = useCallback(async (page = 1, isPageChange = false) => {
    if (isPageChange) {
      setIsPaginating(true);
      setPageError(null);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const data = await getEntries(page);
      if (data && Array.isArray(data.results)) {
        setEntries(data.results);
        setTotalCount(data.count ?? data.results.length);
        setHasNext(Boolean(data.next));
        setHasPrevious(Boolean(data.previous));
      } else if (Array.isArray(data)) {
        setEntries(data);
        setTotalCount(data.length);
        setHasNext(false);
        setHasPrevious(false);
      } else {
        setEntries([]);
        setTotalCount(0);
        setHasNext(false);
        setHasPrevious(false);
      }
      setCurrentPage(page);
    } catch (err) {
      if (isPageChange) {
        setPageError(err.message || 'Failed to load page. Please retry.');
      } else {
        setError(err.message || 'Failed to retrieve usage history.');
      }
    } finally {
      if (isPageChange) {
        setIsPaginating(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchEntries(1, false);
  }, [fetchEntries]);

  const handlePageChange = (newPage) => {
    if (isPaginating || newPage === currentPage || newPage < 1) return;
    fetchEntries(newPage, true);
  };

  // Open Add modal and fetch brands if not already loaded
  const handleOpenAddModal = async () => {
    setIsAddModalOpen(true);
    setAddQuantity('1');
    setAddError(null);

    if (availableBrands.length === 0) {
      setLoadingBrands(true);
      try {
        const brands = await getBrands();
        const brandList = Array.isArray(brands) ? brands : [];
        setAvailableBrands(brandList);
        if (brandList.length > 0) {
          setSelectedBrandId(String(brandList[0].id));
        }
      } catch (err) {
        setAddError('Failed to load brands. Please check your connection.');
      } finally {
        setLoadingBrands(false);
      }
    } else if (!selectedBrandId && availableBrands.length > 0) {
      setSelectedBrandId(String(availableBrands[0].id));
    }
  };

  const handleCloseAddModal = () => {
    if (isAdding) return;
    setIsAddModalOpen(false);
    setAddError(null);
  };

  // Save new usage entry
  const handleSaveAddEntry = async (e) => {
    if (e) e.preventDefault();

    if (!selectedBrandId) {
      setAddError('Please select a brand.');
      return;
    }

    const trimmed = String(addQuantity).trim();
    if (!trimmed) {
      setAddError('Quantity is required.');
      return;
    }

    const num = Number(trimmed);
    if (isNaN(num) || !Number.isInteger(num)) {
      setAddError('Quantity must be a valid whole number.');
      return;
    }

    if (num <= 0) {
      setAddError('Quantity must be a positive integer (at least 1).');
      return;
    }

    setIsAdding(true);
    setAddError(null);

    try {
      await createEntry(Number(selectedBrandId), num);

      // Close modal
      setIsAddModalOpen(false);
      setAddQuantity('1');

      // Refresh page 1 to maintain newest-first ordering and correct pagination state
      fetchEntries(1, false);
    } catch (err) {
      setAddError(err.message || 'Failed to create usage entry. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  // Open edit modal for a selected entry
  const handleOpenEditModal = (entry) => {
    setEditingEntry(entry);
    setEditQuantity(String(entry.quantity ?? ''));
    setEditError(null);
  };

  // Close edit modal safely
  const handleCloseEditModal = () => {
    if (isSaving) return;
    setEditingEntry(null);
    setEditQuantity('');
    setEditError(null);
  };

  // Open delete confirmation modal
  const handleOpenDeleteConfirm = (entry) => {
    setEntryToDelete(entry);
    setDeleteError(null);
  };

  // Close delete confirmation modal safely
  const handleCloseDeleteConfirm = () => {
    if (isDeleting) return;
    setEntryToDelete(null);
    setDeleteError(null);
  };

  // Close active modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isAddModalOpen && !isAdding) {
          handleCloseAddModal();
        } else if (entryToDelete && !isDeleting) {
          handleCloseDeleteConfirm();
        } else if (editingEntry && !isSaving) {
          handleCloseEditModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen, isAdding, editingEntry, isSaving, entryToDelete, isDeleting]);

  // Save updated quantity
  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editingEntry) return;

    const trimmed = String(editQuantity).trim();
    if (!trimmed) {
      setEditError('Quantity is required.');
      return;
    }

    const num = Number(trimmed);
    if (isNaN(num) || !Number.isInteger(num)) {
      setEditError('Quantity must be a valid whole number.');
      return;
    }

    if (num <= 0) {
      setEditError('Quantity must be a positive integer (at least 1).');
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const updated = await updateEntry(editingEntry.id, num);

      // Update that entry in the local list using the API response
      setEntries((prev) =>
        prev.map((item) =>
          item.id === editingEntry.id ? { ...item, ...updated } : item
        )
      );

      // Close editor on success
      setEditingEntry(null);
      setEditQuantity('');
    } catch (err) {
      // Keep editor open, keep user's quantity, show clean error message
      setEditError(err.message || 'Failed to update entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm delete entry
  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteEntry(entryToDelete.id);

      const remainingEntries = entries.filter((item) => item.id !== entryToDelete.id);
      const newTotal = Math.max(0, totalCount - 1);

      setEntries(remainingEntries);
      setTotalCount(newTotal);

      // Close confirmation modal
      setEntryToDelete(null);

      // If the current page becomes empty and it is not page 1, automatically move to previous page
      if (remainingEntries.length === 0 && currentPage > 1) {
        fetchEntries(currentPage - 1, true);
      }
    } catch (err) {
      // Keep modal open, show clean error message, allow retry
      setDeleteError(err.message || 'Failed to delete entry. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="usage-history-page">
      <main className="usage-history-content">
        <div className="editorial-stack">
          {/* 1. Page Header */}
          <header className="editorial-header">
            <span className="editorial-kicker">Activity</span>
            <h1 className="editorial-title">Usage History</h1>
            <p className="editorial-description">
              A chronological record of your cigarette consumption and spending.
            </p>
          </header>

          {/* 2. Metadata & Action Strip */}
          {!loading && !error && (
            <div className="editorial-action-strip">
              <span className="editorial-count-text">
                {totalCount} {totalCount === 1 ? 'entry' : 'entries'} recorded
              </span>

              <button
                type="button"
                className="editorial-add-trigger-btn"
                onClick={handleOpenAddModal}
                aria-label="Add a new usage entry"
              >
                <span className="add-plus" aria-hidden="true">+</span>
                <span>Add Entry</span>
              </button>
            </div>
          )}

          {/* 3. Loading State (Initial load only) */}
          {loading && <LoadingState message="Retrieving usage history..." />}

          {/* 4. Error State (Initial load only) */}
          {!loading && error && (
            <ErrorState
              title="Unable to load usage history"
              message={error}
              onRetry={() => fetchEntries(currentPage, false)}
            />
          )}

          {/* 5. Empty State */}
          {!loading && !error && totalCount === 0 && (
            <div className="history-empty-state" role="status">
              <div className="history-empty-icon" aria-hidden="true">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <p className="history-empty-title">Your usage history is empty.</p>
              <p className="history-empty-subtitle">
                Recorded cigarette consumption entries will appear here.
              </p>
            </div>
          )}

          {/* 6. Real Usage Entries List */}
          {!loading && !error && entries.length > 0 && (
            <section
              className="history-collection-panel"
              aria-label="Usage history entries"
            >
              <div
                className={`history-list ${isPaginating ? 'history-list--paginating' : ''}`}
                role="feed"
                aria-label="Usage entries feed"
              >
                {entries.map((entry) => (
                  <article
                    key={entry.id}
                    className="history-entry-row"
                    tabIndex={0}
                    aria-label={`${entry.brand_name || 'Brand'}, ${formatQuantity(entry.quantity)}, ${formatCurrency(entry.amount)}, on ${formatEntryDate(entry.created_at)} at ${formatEntryTime(entry.created_at)}`}
                  >
                    {/* Date & Time Column */}
                    <div className="history-col-datetime">
                      <span className="history-date-text">
                        {formatEntryDate(entry.created_at)}
                      </span>
                      <span className="history-time-text">
                        {formatEntryTime(entry.created_at)}
                      </span>
                    </div>

                    {/* Brand & Quantity Column */}
                    <div className="history-col-main">
                      <h2 className="history-brand-name">
                        {entry.brand_name || 'Unnamed Brand'}
                      </h2>
                      <span className="history-quantity-text">
                        {formatQuantity(entry.quantity)}
                      </span>
                    </div>

                    {/* Financial Amount & Actions Column */}
                    <div className="history-col-financial">
                      <span className="history-amount-text">
                        {formatCurrency(entry.amount)}
                      </span>
                      <div className="history-row-actions">
                        <button
                          type="button"
                          className="history-entry-edit-btn"
                          onClick={() => handleOpenEditModal(entry)}
                          aria-label={`Edit ${entry.brand_name || 'brand'} entry`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="history-entry-delete-btn"
                          onClick={() => handleOpenDeleteConfirm(entry)}
                          aria-label={`Delete ${entry.brand_name || 'brand'} entry`}
                          title="Delete entry"
                        >
                          <svg
                            className="delete-trash-icon"
                            viewBox="0 0 16 16"
                            width="14"
                            height="14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M2.5 4h11" />
                            <path d="M5.5 4V2.5A1 1 0 0 1 6.5 1.5h3a1 1 0 0 1 1 1.5V4" />
                            <path d="M12.5 4.5v8.5a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 3.5 13V4.5" />
                            <path d="M6.5 7.5v4" />
                            <path d="M9.5 7.5v4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* 7. Apple-inspired Pagination Controls (Only shown when totalCount > PAGE_SIZE) */}
          {!loading && !error && totalCount > PAGE_SIZE && (
            <div className="history-pagination-container">
              {pageError && (
                <div className="history-page-error" role="alert">
                  <span>{pageError}</span>
                  <button
                    type="button"
                    className="history-page-error-retry"
                    onClick={() => handlePageChange(currentPage)}
                  >
                    Retry
                  </button>
                </div>
              )}

              <nav className="history-pagination-nav" aria-label="Usage history pagination">
                <button
                  type="button"
                  className="history-page-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || !hasPrevious || isPaginating}
                  aria-label="Go to previous page"
                >
                  <span className="history-page-arrow" aria-hidden="true">‹</span>
                  <span>Previous</span>
                </button>

                <div className="history-page-indicator" aria-live="polite">
                  {isPaginating ? (
                    <span className="history-page-loading-text">Loading...</span>
                  ) : (
                    <span className="history-page-numbers">
                      {currentPage} <span className="history-page-slash">/</span> {totalPages}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="history-page-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || !hasNext || isPaginating}
                  aria-label="Go to next page"
                >
                  <span>Next</span>
                  <span className="history-page-arrow" aria-hidden="true">›</span>
                </button>
              </nav>
            </div>
          )}
        </div>
      </main>

      {/* 8. Add Usage Entry Modal */}
      {isAddModalOpen && (
        <div
          className="history-modal-backdrop"
          onClick={(e) => {
            if (!isAdding && e.target === e.currentTarget) {
              handleCloseAddModal();
            }
          }}
          role="presentation"
        >
          <div
            className="history-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-entry-modal-title"
          >
            <div className="history-modal-header">
              <div className="history-modal-titles">
                <span className="history-modal-kicker">New Entry</span>
                <h2 id="add-entry-modal-title" className="history-modal-title">
                  Record Usage
                </h2>
              </div>
              <button
                type="button"
                className="history-modal-close-btn"
                onClick={handleCloseAddModal}
                disabled={isAdding}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {addError && (
              <div className="history-modal-error" role="alert">
                {addError}
              </div>
            )}

            {loadingBrands ? (
              <div className="history-modal-loading-brands">
                <div className="loading-spinner" aria-hidden="true" style={{ width: 22, height: 22 }}></div>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Loading brands...</span>
              </div>
            ) : availableBrands.length === 0 ? (
              <div className="history-modal-no-brands">
                <p className="history-no-brands-msg">No brands available. Add a brand first.</p>
                <div className="history-modal-actions">
                  <button
                    type="button"
                    className="history-btn-cancel"
                    onClick={handleCloseAddModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveAddEntry} className="history-modal-form" noValidate>
                {/* Brand Selector */}
                <div className="history-field">
                  <label htmlFor="add-entry-brand-select" className="history-label">
                    Brand
                  </label>
                  <div className="history-select-wrap">
                    <select
                      id="add-entry-brand-select"
                      className="history-select"
                      value={selectedBrandId}
                      onChange={(e) => {
                        setSelectedBrandId(e.target.value);
                        if (addError) setAddError(null);
                      }}
                      disabled={isAdding}
                      autoFocus
                    >
                      {availableBrands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({formatCurrency(b.price)})
                        </option>
                      ))}
                    </select>
                    <span className="history-select-arrow" aria-hidden="true">▾</span>
                  </div>
                </div>

                {/* Quantity Input */}
                <div className="history-field">
                  <label htmlFor="add-entry-quantity-input" className="history-label">
                    Quantity
                  </label>
                  <div className="history-input-wrap">
                    <input
                      id="add-entry-quantity-input"
                      type="number"
                      min="1"
                      step="1"
                      className="history-input"
                      value={addQuantity}
                      onChange={(e) => {
                        setAddQuantity(e.target.value);
                        if (addError) setAddError(null);
                      }}
                      disabled={isAdding}
                      placeholder="1"
                    />
                    <span className="history-input-unit">
                      {Number(addQuantity) === 1 ? 'cigarette' : 'cigarettes'}
                    </span>
                  </div>
                </div>

                <div className="history-modal-actions">
                  <button
                    type="button"
                    className="history-btn-cancel"
                    onClick={handleCloseAddModal}
                    disabled={isAdding}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="history-btn-save"
                    disabled={isAdding}
                  >
                    {isAdding ? 'Adding...' : 'Add Entry'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 9. Premium Apple-style Edit Entry Modal */}
      {editingEntry && (
        <div
          className="history-modal-backdrop"
          onClick={(e) => {
            if (!isSaving && e.target === e.currentTarget) {
              handleCloseEditModal();
            }
          }}
          role="presentation"
        >
          <div
            className="history-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-entry-modal-title"
          >
            <div className="history-modal-header">
              <div className="history-modal-titles">
                <span className="history-modal-kicker">Update Record</span>
                <h2 id="edit-entry-modal-title" className="history-modal-title">
                  Edit Usage Entry
                </h2>
              </div>
              <button
                type="button"
                className="history-modal-close-btn"
                onClick={handleCloseEditModal}
                disabled={isSaving}
                aria-label="Close edit dialog"
              >
                ✕
              </button>
            </div>

            <div className="history-modal-meta">
              <div className="history-modal-meta-item">
                <span className="history-modal-meta-label">Brand</span>
                <span className="history-modal-meta-val">
                  {editingEntry.brand_name || 'Unnamed Brand'}
                </span>
              </div>
              <div className="history-modal-meta-item">
                <span className="history-modal-meta-label">Current Quantity</span>
                <span className="history-modal-meta-val">
                  {formatQuantity(editingEntry.quantity)}
                </span>
              </div>
            </div>

            {editError && (
              <div className="history-modal-error" role="alert">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="history-modal-form" noValidate>
              <div className="history-field">
                <label htmlFor="edit-quantity-input" className="history-label">
                  New Quantity
                </label>
                <div className="history-input-wrap">
                  <input
                    id="edit-quantity-input"
                    type="number"
                    min="1"
                    step="1"
                    className="history-input"
                    value={editQuantity}
                    onChange={(e) => {
                      setEditQuantity(e.target.value);
                      if (editError) setEditError(null);
                    }}
                    disabled={isSaving}
                    placeholder="e.g. 1"
                    autoFocus
                  />
                  <span className="history-input-unit">
                    {Number(editQuantity) === 1 ? 'cigarette' : 'cigarettes'}
                  </span>
                </div>
              </div>

              <div className="history-modal-actions">
                <button
                  type="button"
                  className="history-btn-cancel"
                  onClick={handleCloseEditModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="history-btn-save"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Premium Apple-style Delete Entry Confirmation Modal */}
      {entryToDelete && (
        <div
          className="history-modal-backdrop"
          onClick={(e) => {
            if (!isDeleting && e.target === e.currentTarget) {
              handleCloseDeleteConfirm();
            }
          }}
          role="presentation"
        >
          <div
            className="history-modal-card history-delete-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-entry-modal-title"
            aria-describedby="delete-entry-modal-desc"
          >
            <div className="history-modal-header">
              <div className="history-modal-titles">
                <span className="history-modal-kicker history-modal-kicker-destructive">
                  Delete Entry
                </span>
                <h2 id="delete-entry-modal-title" className="history-modal-title">
                  Delete Usage Entry?
                </h2>
              </div>
              <button
                type="button"
                className="history-modal-close-btn"
                onClick={handleCloseDeleteConfirm}
                disabled={isDeleting}
                aria-label="Close delete confirmation"
              >
                ✕
              </button>
            </div>

            <div id="delete-entry-modal-desc" className="history-delete-modal-body">
              <p className="history-delete-modal-prompt">
                Are you sure you want to delete this recorded entry?
              </p>

              <div className="history-delete-entry-summary">
                <div className="history-delete-summary-row">
                  <span className="history-delete-label">Brand</span>
                  <span className="history-delete-val">
                    {entryToDelete.brand_name || 'Unnamed Brand'}
                  </span>
                </div>
                <div className="history-delete-summary-row">
                  <span className="history-delete-label">Quantity</span>
                  <span className="history-delete-val">
                    {formatQuantity(entryToDelete.quantity)}
                  </span>
                </div>
                <div className="history-delete-summary-row">
                  <span className="history-delete-label">Amount</span>
                  <span className="history-delete-val">
                    {formatCurrency(entryToDelete.amount)}
                  </span>
                </div>
                <div className="history-delete-summary-row">
                  <span className="history-delete-label">Date & Time</span>
                  <span className="history-delete-val">
                    {formatEntryDate(entryToDelete.created_at)} at {formatEntryTime(entryToDelete.created_at)}
                  </span>
                </div>
              </div>

              <p className="history-delete-undone-note">
                This action cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div className="history-modal-error" role="alert">
                {deleteError}
              </div>
            )}

            <div className="history-modal-actions">
              <button
                type="button"
                className="history-btn-cancel"
                onClick={handleCloseDeleteConfirm}
                disabled={isDeleting}
                autoFocus
              >
                Cancel
              </button>
              <button
                type="button"
                className="history-btn-delete-confirm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
