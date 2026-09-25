import { useState, useEffect, useCallback } from 'react';
import { getBrands, createBrand, updateBrand, deleteBrand, getBrandStats, getBrandUsage } from '../services/brandService';
import { LoadingState, ErrorState } from '../components/StatusMessage';
import { BrandTrendChart } from '../components/BrandTrendChart';

function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatQuantity(qty) {
  const num = typeof qty === 'number' ? qty : Number(qty) || 0;
  return new Intl.NumberFormat('en-IN').format(num);
}

export function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection & Details state
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [brandStats, setBrandStats] = useState({});
  const [loadingStatsId, setLoadingStatsId] = useState(null);
  const [statsErrors, setStatsErrors] = useState({});

  // Usage trend state
  const [brandUsage, setBrandUsage] = useState({});
  const [loadingUsageId, setLoadingUsageId] = useState(null);
  const [brandUsageErrors, setBrandUsageErrors] = useState({});

  // Form states: mode = null | 'add' | 'edit'
  const [formMode, setFormMode] = useState(null);
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete confirmation state
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBrands();
      setBrands(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve brands.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Fetch statistics for a specific brand
  const handleFetchBrandStats = async (brandId) => {
    setLoadingStatsId(brandId);
    setStatsErrors((prev) => ({ ...prev, [brandId]: null }));
    try {
      const stats = await getBrandStats(brandId);
      setBrandStats((prev) => ({ ...prev, [brandId]: stats }));
    } catch (err) {
      setStatsErrors((prev) => ({
        ...prev,
        [brandId]: err.message || 'Unable to load statistics for this brand.',
      }));
    } finally {
      setLoadingStatsId(null);
    }
  };

  // Fetch daily usage trend for a specific brand
  const handleFetchBrandUsage = async (brandId) => {
    setLoadingUsageId(brandId);
    setBrandUsageErrors((prev) => ({ ...prev, [brandId]: null }));
    try {
      const data = await getBrandUsage(brandId);
      setBrandUsage((prev) => ({ ...prev, [brandId]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      setBrandUsageErrors((prev) => ({
        ...prev,
        [brandId]: err.message || 'Unable to load usage trend.',
      }));
    } finally {
      setLoadingUsageId(null);
    }
  };

  // Handle selecting a brand to view details & stats
  const handleSelectBrand = (brand) => {
    if (selectedBrandId === brand.id) {
      setSelectedBrandId(null);
      return;
    }

    setSelectedBrandId(brand.id);

    // Fetch stats if not already cached or if previous attempt failed
    if (!brandStats[brand.id]) {
      handleFetchBrandStats(brand.id);
    }

    // Fetch usage trend if not already cached
    if (!brandUsage[brand.id]) {
      handleFetchBrandUsage(brand.id);
    }
  };

  // Open Add Brand form
  const handleOpenAddForm = () => {
    setFormMode('add');
    setEditingBrandId(null);
    setFormName('');
    setFormPrice('');
    setFormError(null);
  };

  // Open Edit Brand form
  const handleOpenEditForm = (brand, e) => {
    if (e) e.stopPropagation();
    setFormMode('edit');
    setEditingBrandId(brand.id);
    setFormName(brand.name || '');
    setFormPrice(brand.price ? String(brand.price) : '');
    setFormError(null);
  };

  const handleCloseForm = () => {
    setFormMode(null);
    setEditingBrandId(null);
    setFormName('');
    setFormPrice('');
    setFormError(null);
  };

  // Close delete modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && brandToDelete && !isDeleting) {
        handleCloseDeleteConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [brandToDelete, isDeleting]);

  // Open Delete confirmation
  const handleOpenDeleteConfirm = (brand, e) => {
    if (e) e.stopPropagation();
    setBrandToDelete(brand);
    setDeleteError(null);
  };

  // Close Delete confirmation
  const handleCloseDeleteConfirm = () => {
    if (isDeleting) return;
    setBrandToDelete(null);
    setDeleteError(null);
  };

  // Confirm brand deletion
  const handleConfirmDelete = async () => {
    if (!brandToDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteBrand(brandToDelete.id);

      // Remove from displayed list immediately
      setBrands((prev) => prev.filter((b) => b.id !== brandToDelete.id));

      // Edge case: If the brand being deleted is currently selected/viewed, clear it
      if (selectedBrandId === brandToDelete.id) {
        setSelectedBrandId(null);
      }

      // Clear any cached stats, usage, and error records
      setBrandStats((prev) => { const n = { ...prev }; delete n[brandToDelete.id]; return n; });
      setStatsErrors((prev) => { const n = { ...prev }; delete n[brandToDelete.id]; return n; });
      setBrandUsage((prev) => { const n = { ...prev }; delete n[brandToDelete.id]; return n; });
      setBrandUsageErrors((prev) => { const n = { ...prev }; delete n[brandToDelete.id]; return n; });

      // Close confirmation dialog
      setBrandToDelete(null);
      setDeleteError(null);
    } catch (err) {
      // Keep brand in list, keep confirmation interface open, display error
      setDeleteError(err.message || 'Failed to delete brand. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Submit handler for both Add and Edit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError('Brand name is required.');
      return;
    }

    const parsedPrice = parseFloat(formPrice);
    if (!formPrice || isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError('Price must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (formMode === 'add') {
        const newBrand = await createBrand({
          name: trimmedName,
          price: parsedPrice,
        });
        setBrands((prev) => [...prev, newBrand]);
        handleCloseForm();
      } else if (formMode === 'edit' && editingBrandId) {
        const updated = await updateBrand(editingBrandId, {
          name: trimmedName,
          price: parsedPrice,
        });

        // Update list in state immediately
        setBrands((prev) =>
          prev.map((b) => (b.id === editingBrandId ? { ...b, ...updated } : b))
        );

        // Update stats cache if present
        if (brandStats[editingBrandId]) {
          setBrandStats((prev) => ({
            ...prev,
            [editingBrandId]: {
              ...prev[editingBrandId],
              brand_name: updated.name,
              brand_price: updated.price,
            },
          }));
        }

        handleCloseForm();
      }
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please verify inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="editorial-brands-layout">
      <div className="editorial-brands-container">
        {loading && <LoadingState />}

        {!loading && error && (
          <ErrorState message={error} onRetry={fetchBrands} />
        )}

        {!loading && !error && (
          <div className="editorial-stack">
            {/* 1. Page Introduction (Apple Editorial Style) */}
            <header className="editorial-header">
              <span className="editorial-kicker">Brands</span>
              <h1 className="editorial-title">Your cigarette brands</h1>
              <p className="editorial-description">
                Manage the brands you currently track.
              </p>
            </header>

            {/* 2. Metadata & Action Strip */}
            <div className="editorial-action-strip">
              <span className="editorial-count-text">
                {brands.length} {brands.length === 1 ? 'brand' : 'brands'} registered
              </span>

              {formMode !== 'add' && (
                <button
                  type="button"
                  className="editorial-add-trigger-btn"
                  onClick={handleOpenAddForm}
                  aria-label="Add a new brand"
                >
                  <span className="add-plus" aria-hidden="true">+</span>
                  <span>Add Brand</span>
                </button>
              )}
            </div>

            {/* 3. Add Brand Form (when mode === 'add') */}
            {formMode === 'add' && (
              <section className="editorial-form-panel" aria-labelledby="add-brand-panel-title">
                <div className="editorial-form-header">
                  <div className="form-header-text">
                    <span className="form-kicker">Create</span>
                    <h2 id="add-brand-panel-title" className="form-title">New Brand</h2>
                  </div>
                  <button
                    type="button"
                    className="editorial-form-cancel-btn"
                    onClick={handleCloseForm}
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="editorial-form" noValidate>
                  {formError && (
                    <div className="editorial-form-error" role="alert">
                      {formError}
                    </div>
                  )}

                  <div className="editorial-form-grid">
                    <div className="editorial-field">
                      <label htmlFor="add-name" className="editorial-label">
                        Brand Name
                      </label>
                      <input
                        id="add-name"
                        type="text"
                        className="editorial-input"
                        placeholder="e.g. Malbaros"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        disabled={isSubmitting}
                        autoFocus
                      />
                    </div>

                    <div className="editorial-field">
                      <label htmlFor="add-price" className="editorial-label">
                        Price (₹)
                      </label>
                      <input
                        id="add-price"
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="editorial-input"
                        placeholder="25.00"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="editorial-form-actions">
                    <button
                      type="submit"
                      className="editorial-submit-btn"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Adding...' : 'Add Brand'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* 4. Edit Brand Form (when mode === 'edit') */}
            {formMode === 'edit' && (
              <section className="editorial-form-panel" aria-labelledby="edit-brand-panel-title">
                <div className="editorial-form-header">
                  <div className="form-header-text">
                    <span className="form-kicker">Update</span>
                    <h2 id="edit-brand-panel-title" className="form-title">Edit Brand</h2>
                  </div>
                  <button
                    type="button"
                    className="editorial-form-cancel-btn"
                    onClick={handleCloseForm}
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="editorial-form" noValidate>
                  {formError && (
                    <div className="editorial-form-error" role="alert">
                      {formError}
                    </div>
                  )}

                  <div className="editorial-form-grid">
                    <div className="editorial-field">
                      <label htmlFor="edit-name" className="editorial-label">
                        Brand Name
                      </label>
                      <input
                        id="edit-name"
                        type="text"
                        className="editorial-input"
                        placeholder="Brand Name"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        disabled={isSubmitting}
                        autoFocus
                      />
                    </div>

                    <div className="editorial-field">
                      <label htmlFor="edit-price" className="editorial-label">
                        Price (₹)
                      </label>
                      <input
                        id="edit-price"
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="editorial-input"
                        placeholder="25.00"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="editorial-form-actions">
                    <button
                      type="submit"
                      className="editorial-submit-btn"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* 5. Brand Collection (Individual objects with refined vertical spacing) */}
            {brands.length === 0 ? (
              <div className="editorial-empty-state">
                <p className="editorial-empty-title">No Brands Tracked</p>
                <p className="editorial-empty-text">Add your first cigarette brand to begin tracking.</p>
              </div>
            ) : (
              <section className="editorial-brands-collection" aria-label="Brands collection">
                <div className="editorial-brands-list">
                  {brands.map((brand, idx) => {
                    const isSelected = selectedBrandId === brand.id;
                    const stats = brandStats[brand.id];
                    const isLoadingStats = loadingStatsId === brand.id;

                    return (
                      <div key={brand.id || idx} className="brand-item-wrapper">
                        {idx > 0 && <div className="brand-thin-separator" aria-hidden="true" />}

                        {/* Interactive Brand Row */}
                        <div
                          className={`brand-item-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectBrand(brand)}
                          tabIndex={0}
                          role="button"
                          aria-expanded={isSelected}
                          aria-label={`${brand.name}, ${formatCurrency(brand.price)}. Click for details and options.`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelectBrand(brand);
                            }
                          }}
                        >
                          <div className="brand-card-left">
                            <span className="brand-card-name">{brand.name}</span>
                            <span className="brand-card-price">{formatCurrency(brand.price)}</span>
                          </div>

                          <div className="brand-card-right">
                            <button
                              type="button"
                              className="brand-row-edit-action"
                              onClick={(e) => handleOpenEditForm(brand, e)}
                              aria-label={`Edit ${brand.name}`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="brand-row-delete-btn"
                              onClick={(e) => handleOpenDeleteConfirm(brand, e)}
                              aria-label={`Delete ${brand.name}`}
                              title={`Delete ${brand.name}`}
                            >
                              <svg
                                className="delete-trash-icon"
                                viewBox="0 0 16 16"
                                width="15"
                                height="15"
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
                            <span className={`brand-arrow-indicator ${isSelected ? 'expanded' : ''}`} aria-hidden="true">
                              →
                            </span>
                          </div>
                        </div>

                        {/* Selected Brand Details Area (Section 6) */}
                        {isSelected && (
                          <div className="brand-details-drawer">
                            {isLoadingStats && (
                              <div className="brand-details-loading-state" role="status" aria-live="polite">
                                <div className="brand-details-spinner" aria-hidden="true" />
                                <span className="brand-details-loading-text">
                                  Loading statistics for {brand.name}…
                                </span>
                              </div>
                            )}

                            {!isLoadingStats && statsErrors[brand.id] && (
                              <div className="brand-details-error-state" role="alert">
                                <span className="brand-details-error-text">
                                  {statsErrors[brand.id]}
                                </span>
                                <button
                                  type="button"
                                  className="brand-details-retry-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFetchBrandStats(brand.id);
                                  }}
                                >
                                  Try Again
                                </button>
                              </div>
                            )}

                            {!isLoadingStats && !statsErrors[brand.id] && (() => {
                                const isLoadingUsage = loadingUsageId === brand.id;
                                const usageError = brandUsageErrors[brand.id];
                                const usageData = brandUsage[brand.id];

                                return (
                                  <div className="brand-details-panel">
                                    <div className="brand-details-header">
                                      <div className="brand-details-meta">
                                        <span className="brand-details-kicker">Brand Overview</span>
                                        <h3 className="brand-details-name">{stats?.brand_name || brand.name}</h3>
                                      </div>
                                    </div>

                                    <div className="brand-details-metrics-grid">
                                      <div className="brand-detail-stat-card">
                                        <span className="stat-card-label">Current Price</span>
                                        <span className="stat-card-value">
                                          {formatCurrency(stats?.brand_price ?? brand.price)}
                                        </span>
                                        <span className="stat-card-subtext">per cigarette</span>
                                      </div>

                                      <div className="brand-detail-stat-card">
                                        <span className="stat-card-label">Total Cigarettes Used</span>
                                        <span className="stat-card-value">
                                          {formatQuantity(stats?.total_quantity ?? 0)}
                                        </span>
                                        <span className="stat-card-subtext">
                                          {(stats?.total_quantity || 0) === 1 ? 'cigarette' : 'cigarettes'} recorded
                                        </span>
                                      </div>

                                      <div className="brand-detail-stat-card">
                                        <span className="stat-card-label">Total Spending</span>
                                        <span className="stat-card-value">
                                          {formatCurrency(stats?.total_spending ?? 0)}
                                        </span>
                                        <span className="stat-card-subtext">cumulative expenditure</span>
                                      </div>
                                    </div>

                                    {/* Usage Trend Chart */}
                                    <div className="btc-section">
                                      {isLoadingUsage && (
                                        <div className="brand-details-loading-state" role="status" aria-live="polite">
                                          <div className="brand-details-spinner" aria-hidden="true" />
                                          <span className="brand-details-loading-text">Loading usage trend…</span>
                                        </div>
                                      )}

                                      {!isLoadingUsage && usageError && (
                                        <div className="brand-details-error-state" role="alert">
                                          <span className="brand-details-error-text">{usageError}</span>
                                          <button
                                            type="button"
                                            className="brand-details-retry-btn"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleFetchBrandUsage(brand.id);
                                            }}
                                          >
                                            Try Again
                                          </button>
                                        </div>
                                      )}

                                      {!isLoadingUsage && !usageError && usageData !== undefined && (
                                        <BrandTrendChart usageData={usageData} />
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        {/* 6. Delete Brand Confirmation Modal */}
        {brandToDelete && (
          <div
            className="delete-modal-backdrop"
            onClick={handleCloseDeleteConfirm}
            role="presentation"
          >
            <div
              className="delete-modal-dialog"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-dialog-title"
              aria-describedby="delete-dialog-desc"
            >
              <div className="delete-modal-header">
                <h2 id="delete-dialog-title" className="delete-modal-title">Delete Brand?</h2>
              </div>

              <div id="delete-dialog-desc" className="delete-modal-body">
                <p className="delete-modal-prompt">
                  Are you sure you want to delete <strong>“{brandToDelete.name}”</strong>?
                </p>
                <p className="delete-modal-undone">
                  This action cannot be undone.
                </p>
                <div className="delete-modal-cascade-callout">
                  <span className="cascade-warning-icon" aria-hidden="true">⚠️</span>
                  <p className="cascade-warning-text">
                    Deleting this brand will also remove its recorded usage entries.
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="delete-modal-error" role="alert">
                  {deleteError}
                </div>
              )}

              <div className="delete-modal-actions">
                <button
                  type="button"
                  className="delete-modal-cancel-btn"
                  onClick={handleCloseDeleteConfirm}
                  disabled={isDeleting}
                  autoFocus
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="delete-modal-confirm-btn"
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
    </div>
  );
}
