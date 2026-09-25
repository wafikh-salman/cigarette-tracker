/**
 * Base API client
 * Communicates with the Django REST Framework backend.
 * Uses relative path '/api' by default to leverage the Vite proxy during development.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function apiClient(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `HTTP error! Status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData && (errorData.detail || errorData.error || errorData.message)) {
          errorMessage = errorData.detail || errorData.error || errorData.message;
        }
      } catch {
        // Response wasn't json, use status text
        if (response.statusText) {
          errorMessage = `${response.status} ${response.statusText}`;
        }
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (err) {
    // Distinguish network failures from application errors
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to the backend server. Please verify the Django API is running.');
    }
    throw err;
  }
}
