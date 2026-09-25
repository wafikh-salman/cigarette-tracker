import { apiClient } from './api';

/**
 * Fetch paginated usage entries.
 * Calls GET /api/entries/?page=<page>
 * @param {number} [page=1] - The page number
 * @returns {Promise<Object>} DRF paginated response: { count, next, previous, results }
 */
export async function getEntries(page = 1) {
  return await apiClient(`/api/entries/?page=${page}`);
}

/**
 * Patch a cigarette entry quantity.
 * @param {number} entryId - The entry ID
 * @param {'increase' | 'decrease'} action - The action to perform
 */
export async function updateEntryQuantity(entryId, action) {
  const result = await apiClient(`/api/entries/${entryId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });

  if (result && result.error) {
    throw new Error(result.error);
  }

  return result;
}

/**
 * Update a cigarette entry quantity.
 * Calls PATCH /api/entries/<id>/ with { action: 'update', quantity }
 * @param {number} id - The entry ID
 * @param {number} quantity - The new quantity
 * @returns {Promise<Object>} Updated entry data
 */
export async function updateEntry(id, quantity) {
  const result = await apiClient(`/api/entries/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({
      action: 'update',
      quantity,
    }),
  });

  if (result && result.error) {
    throw new Error(result.error);
  }

  return result;
}

/**
 * Delete a cigarette entry by ID.
 * Calls DELETE /api/entries/<id>/
 * @param {number} id - The entry ID
 * @returns {Promise<Object>} API response
 */
export async function deleteEntry(id) {
  const result = await apiClient(`/api/entries/${id}/`, {
    method: 'DELETE',
  });

  if (result && result.error) {
    throw new Error(result.error);
  }

  return result;
}

/**
 * Create a new usage entry.
 * Calls POST /api/entries/
 * @param {number} brandId - The selected brand ID
 * @param {number} quantity - The quantity consumed
 * @returns {Promise<Object>} Created entry data
 */
export async function createEntry(brandId, quantity) {
  const result = await apiClient('/api/entries/', {
    method: 'POST',
    body: JSON.stringify({
      brand: brandId,
      quantity,
    }),
  });

  if (result && result.error) {
    throw new Error(result.error);
  }

  return result;
}



