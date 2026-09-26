import { apiClient } from './api';

/**
 * Fetch insights data from the backend.
 * Calls GET /api/insights/
 * @returns {Promise<Object>} Insights data including current_week, previous_week, comparison, and daily_usage
 */
export async function getInsightsData() {
  return await apiClient('/api/insights/');
}
