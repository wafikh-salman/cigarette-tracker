import { useState, useEffect, useCallback } from 'react';
import { getDashboardData } from '../services/dashboardService';
import { updateEntryQuantity } from '../services/entriesService';
import { MetricSection } from '../components/MetricSection';
import { WeeklyUsageChart } from '../components/WeeklyUsageChart';
import { BrandShareSection } from '../components/BrandShareSection';
import { SpendingOverview } from '../components/SpendingOverview';
import { QuickAddSection } from '../components/QuickAddSection';
import { LoadingState, ErrorState } from '../components/StatusMessage';

export function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardData();
      setDashboardData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleUpdateQuantity = async (entryId, action) => {
    setUpdatingId(entryId);
    setActionError(null);
    try {
      const updatedEntry = await updateEntryQuantity(entryId, action);

      setDashboardData((prev) => {
        if (!prev) return prev;

        const currentEntries = prev.today_entries || [];
        const oldEntry = currentEntries.find((e) => e.id === entryId);

        const qDelta = updatedEntry.quantity - (oldEntry ? oldEntry.quantity : 0);
        const aDelta = updatedEntry.amount - (oldEntry ? oldEntry.amount : 0);

        const entryDate = updatedEntry.created_at ? updatedEntry.created_at.slice(0, 10) : null;

        const updatedWeeklyUsage = (prev.weekly_usage || []).map((dayItem) => {
          if (entryDate && dayItem.date === entryDate) {
            return {
              ...dayItem,
              quantity: Math.max(0, (dayItem.quantity || 0) + qDelta),
            };
          }
          return dayItem;
        });

        const updatedBrandUsage = (prev.brand_usage || []).map((b) => {
          if (updatedEntry.brand_name && b.brand === updatedEntry.brand_name) {
            return {
              ...b,
              quantity: Math.max(0, (b.quantity || 0) + qDelta),
            };
          }
          return b;
        });

        return {
          ...prev,
          total_quantity: Math.max(0, (prev.total_quantity || 0) + qDelta),
          total_spending: Math.max(0, (prev.total_spending || 0) + aDelta),
          week_quantity: Math.max(0, (prev.week_quantity || 0) + qDelta),
          week_spending: Math.max(0, (prev.week_spending || 0) + aDelta),
          month_quantity: Math.max(0, (prev.month_quantity || 0) + qDelta),
          month_spending: Math.max(0, (prev.month_spending || 0) + aDelta),
          today_entries: currentEntries.map((e) =>
            e.id === entryId ? { ...e, ...updatedEntry } : e
          ),
          weekly_usage: updatedWeeklyUsage,
          brand_usage: updatedBrandUsage,
        };
      });
    } catch (err) {
      setActionError(err.message || 'Failed to update entry.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="dashboard-page">
      <main className="dashboard-content">
        {loading && <LoadingState />}

        {!loading && error && (
          <ErrorState message={error} onRetry={fetchDashboard} />
        )}

        {!loading && !error && dashboardData && (
          <div className="dashboard-sections">
            <MetricSection data={dashboardData} />
            <WeeklyUsageChart weeklyUsage={dashboardData.weekly_usage} />
            <BrandShareSection brandUsage={dashboardData.brand_usage} />
            <SpendingOverview data={dashboardData} />
            <QuickAddSection
              entries={dashboardData.today_entries}
              onUpdateQuantity={handleUpdateQuantity}
              updatingId={updatingId}
              actionError={actionError}
            />
          </div>
        )}
      </main>
    </div>
  );
}
