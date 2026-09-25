import { apiClient } from './api';

/**
 * Fetch all brands from backend.
 */
export async function getBrands() {
  return await apiClient('/api/brand/');
}

/**
 * Create a new brand.
 * @param {{ name: string, price: number }} brandData
 */
export async function createBrand(brandData) {
  return await apiClient('/api/brand/', {
    method: 'POST',
    body: JSON.stringify(brandData),
  });
}

/**
 * Update an existing brand.
 * @param {number} brandId
 * @param {{ name?: string, price?: number }} brandData
 */
export async function updateBrand(brandId, brandData) {
  return await apiClient(`/api/brand/${brandId}/`, {
    method: 'PATCH',
    body: JSON.stringify(brandData),
  });
}

/**
 * Fetch statistics for a specific brand.
 * @param {number} brandId
 */
export async function getBrandStats(brandId) {
  return await apiClient(`/api/brand/${brandId}/stats/`);
}

/**
 * Delete a brand by ID.
 * @param {number} brandId
 */
export async function deleteBrand(brandId) {
  return await apiClient(`/api/brand/${brandId}/`, {
    method: 'DELETE',
  });
}

/**
 * Fetch daily usage trend for a specific brand.
 * @param {number} brandId
 * @returns {Promise<Array<{ date: string, quantity: number }>>}
 */
export async function getBrandUsage(brandId) {
  return await apiClient(`/api/brand/${brandId}/usage/`);
}
