import { apiClient } from './api';

/**
 * Service for fetching dashboard summary metrics from the backend.
 */
export async function getDashboardData() {
  return await apiClient('/api/dashboard/');
}
