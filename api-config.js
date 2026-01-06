/**
 * API Configuration
 * Centralized configuration for API endpoints
 * Automatically detects development vs production environment
 */

/**
 * Determine the API base URL based on environment
 * - Local development: Uses localhost:8000
 * - Production: Uses your deployed API URL
 *
 * To override for testing, set: localStorage.setItem('API_BASE_URL', 'your-url')
 */
function getApiBaseUrl() {
    // Check for manual override in localStorage (useful for testing)
    if (typeof localStorage !== 'undefined') {
        const override = localStorage.getItem('API_BASE_URL');
        if (override) {
            console.log('Using API_BASE_URL override from localStorage:', override);
            return override;
        }
    }

    // Auto-detect environment
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // Local development environments (HTTP server on localhost)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8000';
    }

    // File protocol (opening HTML directly) or Production
    // Both use the cloud-hosted API
    return 'https://backend-drab-alpha-85.vercel.app';
}

// Initialize API Base URL
const API_BASE_URL = getApiBaseUrl();

// Log the configuration for debugging
console.log('API Configuration:', {
    baseUrl: API_BASE_URL,
    hostname: window.location.hostname,
    protocol: window.location.protocol
});

// API Endpoints
const API_ENDPOINTS = {
    // Public gallery endpoints
    GALLERY_IMAGES: `${API_BASE_URL}/api/gallery-images`,

    // CMS endpoints (require authentication)
    CMS_GALLERY_IMAGES: `${API_BASE_URL}/api/cms/gallery-images`,
    CMS_GALLERY_IMAGE: (id) => `${API_BASE_URL}/api/cms/gallery-images/${id}`,
    CMS_BULK_DELETE: `${API_BASE_URL}/api/cms/gallery-images/bulk`,
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_BASE_URL, API_ENDPOINTS };
}

