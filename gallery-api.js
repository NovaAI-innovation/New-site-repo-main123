/**
 * Gallery API Integration
 * Fetches gallery images from the backend API and renders them dynamically
 */

// Check if API configuration is loaded
if (typeof API_BASE_URL === 'undefined') {
    console.error('API_BASE_URL is not defined! Make sure api-config.js is loaded before gallery-api.js');
}

if (typeof API_ENDPOINTS === 'undefined') {
    console.error('API_ENDPOINTS is not defined! Make sure api-config.js is loaded before gallery-api.js');
}

// Cache configuration
let CACHE_VERSION = 'v2';  // Mutable version that can be incremented
const CACHE_CONFIG = {
    KEY: 'gallery_cache',
    get VERSION() { return CACHE_VERSION; },  // Dynamic version getter
    TTL: 15 * 60 * 1000  // 15 minutes
};

// Track when images were last reordered to prevent stale caching
const REORDER_TIMESTAMP_KEY = 'gallery_last_reorder_timestamp';

// Increment cache version to invalidate all cached data
// This is called when images are reordered to force fresh data fetch
window.invalidateGalleryCache = function() {
    // Store timestamp FIRST - this prevents any subsequent cache operations
    // This timestamp persists to invalidate any cache created before the reorder
    const now = Date.now();
    localStorage.setItem(REORDER_TIMESTAMP_KEY, now.toString());
    
    // Increment version to invalidate all cached data
    const currentVersion = parseInt(CACHE_VERSION.replace('v', ''));
    CACHE_VERSION = 'v' + (currentVersion + 1);
    
    // Clear existing cache
    localStorage.removeItem(CACHE_CONFIG.KEY);
    
    console.log('Gallery cache invalidated and version bumped to:', CACHE_VERSION);
    console.log('Cache writes disabled for 60 seconds to prevent stale data');
    console.log('Reorder timestamp set to:', new Date(now).toISOString());
    console.log('Note: Reorder timestamp persists to invalidate old caches on future page loads');
};

// Gallery state
let galleryState = {
    allImages: [],
    nextCursor: null,
    hasMore: true,
    isLoading: false
};

/**
 * Get cached gallery data from localStorage
 * Returns object with data and cache metadata, or null if no valid cache
 */
function getCachedData() {
    try {
        const lastReorderTimestamp = localStorage.getItem(REORDER_TIMESTAMP_KEY);
        
        // If a reorder happened recently (within 60 seconds), always skip cache
        // This ensures backend has time to update
        if (lastReorderTimestamp) {
            const reorderAge = Date.now() - parseInt(lastReorderTimestamp);
            if (reorderAge < 60000) {
                console.log(`Recent reorder detected (${Math.round(reorderAge / 1000)}s ago), skipping cache to get fresh data`);
                console.log('This prevents stale cached order from being used');
                return null;
            }
        }

        const cached = localStorage.getItem(CACHE_CONFIG.KEY);
        if (!cached) return null;

        const parsed = JSON.parse(cached);

        // Check version
        if (parsed.version !== CACHE_CONFIG.VERSION) {
            console.log('Cache version mismatch, invalidating');
            localStorage.removeItem(CACHE_CONFIG.KEY);
            return null;
        }

        // CRITICAL: Always check if cache is older than last reorder (even after 60 seconds)
        // This prevents using stale cache that was created before a reorder
        if (lastReorderTimestamp && parsed.timestamp < parseInt(lastReorderTimestamp)) {
            console.log('Cache is older than last reorder, invalidating stale cache');
            console.log(`Cache timestamp: ${new Date(parsed.timestamp).toISOString()}`);
            console.log(`Last reorder: ${new Date(parseInt(lastReorderTimestamp)).toISOString()}`);
            localStorage.removeItem(CACHE_CONFIG.KEY);
            return null;
        }

        // Check TTL
        const age = Date.now() - parsed.timestamp;
        if (age > CACHE_CONFIG.TTL) {
            console.log('Cache expired, invalidating');
            localStorage.removeItem(CACHE_CONFIG.KEY);
            return null;
        }

        console.log(`Using cached data (age: ${Math.round(age / 1000)}s)`);
        return {
            data: parsed.data,
            timestamp: parsed.timestamp,
            age: age
        };

    } catch (error) {
        console.error('Error reading cache:', error);
        localStorage.removeItem(CACHE_CONFIG.KEY);
        return null;
    }
}

/**
 * Save gallery data to localStorage cache
 * This function will NOT cache if a reorder happened in the last 60 seconds
 * to prevent stale order data from being cached
 */
function setCachedData(data) {
    try {
        // CRITICAL: Check if a reorder happened recently - if so, don't cache yet
        const lastReorderTimestamp = localStorage.getItem(REORDER_TIMESTAMP_KEY);
        if (lastReorderTimestamp) {
            const now = Date.now();
            const reorderAge = now - parseInt(lastReorderTimestamp);
            
            // Don't cache if reorder happened in last 60 seconds (allows backend to update)
            if (reorderAge < 60000) {
                const remainingSeconds = Math.round((60000 - reorderAge) / 1000);
                console.warn(`⚠️ CACHE WRITE BLOCKED: Recent reorder detected (${Math.round(reorderAge / 1000)}s ago)`);
                console.warn(`⚠️ Skipping cache write to prevent stale image order data`);
                console.warn(`⚠️ Cache writes will be allowed after ${remainingSeconds} more seconds`);
                console.warn(`⚠️ Reorder timestamp: ${new Date(parseInt(lastReorderTimestamp)).toISOString()}`);
                console.warn(`⚠️ Current time: ${new Date(now).toISOString()}`);
                return; // Exit early - DO NOT CACHE
            }
            // NOTE: We keep the reorder timestamp even after 60 seconds
            // This allows getCachedData() to invalidate old caches that predate the reorder
            // The timestamp is only cleared when a new reorder happens (in invalidateGalleryCache)
        }

        // Safe to cache - no recent reorder detected (or reorder was > 60s ago)
        const cacheObject = {
            data: data,
            timestamp: Date.now(),
            version: CACHE_CONFIG.VERSION
        };
        localStorage.setItem(CACHE_CONFIG.KEY, JSON.stringify(cacheObject));
        console.log('✅ Saved data to cache');
    } catch (error) {
        console.error('Error saving to cache:', error);
        // Cache failure shouldn't break the app
    }
}

/**
 * Clear gallery cache (useful for CMS updates)
 */
window.clearGalleryCache = function() {
    localStorage.removeItem(CACHE_CONFIG.KEY);
    console.log('Gallery cache cleared');
};

/**
 * Cloudinary transformation configurations
 */
const CLOUDINARY_TRANSFORMS = {
    thumbnail: 'c_fill,w_400,h_400,q_auto,f_auto',
    medium: 'c_fill,w_800,h_800,q_auto,f_auto',
    full: 'c_fill,w_1600,h_1600,q_auto,f_auto'
};

/**
 * Generate optimized Cloudinary URL with transformations
 *
 * @param {string} originalUrl - Original Cloudinary URL
 * @param {string} size - Size preset (thumbnail, medium, full)
 * @returns {string} Transformed URL
 */
function generateCloudinaryUrl(originalUrl, size = 'thumbnail') {
    if (!originalUrl) return '';

    // Cloudinary URL pattern: https://res.cloudinary.com/{cloud}/image/upload/{public_id}
    const uploadPattern = /\/upload\//;

    if (!uploadPattern.test(originalUrl)) {
        console.warn('Not a Cloudinary URL, returning original:', originalUrl);
        return originalUrl;
    }

    const transformation = CLOUDINARY_TRANSFORMS[size] || CLOUDINARY_TRANSFORMS.thumbnail;

    // Insert transformations after /upload/
    return originalUrl.replace('/upload/', `/upload/${transformation}/`);
}

/**
 * Generate srcset for responsive images
 *
 * @param {string} originalUrl - Original Cloudinary URL
 * @returns {string} srcset attribute value
 */
function generateSrcset(originalUrl) {
    return `${generateCloudinaryUrl(originalUrl, 'thumbnail')} 400w, ${generateCloudinaryUrl(originalUrl, 'medium')} 800w`;
}

/**
 * Fetch gallery images from the API with pagination
 * Returns object with { data, fromCache, cacheAge } where:
 * - data: the gallery data
 * - fromCache: boolean indicating if data came from cache
 * - cacheAge: age of cache in milliseconds (if fromCache is true), or null
 */
async function fetchGalleryImages(cursor = null, useCache = true) {
    try {
        // Try cache on initial load (no cursor)
        if (!cursor && useCache) {
            const cached = getCachedData();
            if (cached) {
                return {
                    data: cached.data,
                    fromCache: true,
                    cacheAge: cached.age
                };
            }
        }

        // Build API URL with pagination params
        const url = new URL(API_ENDPOINTS.GALLERY_IMAGES);
        url.searchParams.set('limit', '12');
        if (cursor) {
            url.searchParams.set('cursor', cursor);
        }

        console.log('Fetching gallery images from:', url.toString());

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error! status: ${response.status}`, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw API response:', data);

        // Validate response structure
        if (!data || typeof data !== 'object') {
            console.error('Invalid API response: data is not an object', data);
            throw new Error('Invalid API response format');
        }

        if (!data.images || !Array.isArray(data.images)) {
            console.error('Invalid API response: missing or invalid images array', data);
            throw new Error('API response missing images array');
        }

        if (!data.pagination || typeof data.pagination !== 'object') {
            console.error('Invalid API response: missing or invalid pagination', data);
            throw new Error('API response missing pagination metadata');
        }

        console.log(`Fetched ${data.images.length} images (has_more: ${data.pagination.has_more})`);

        return {
            data: data,
            fromCache: false,
            cacheAge: null
        };

    } catch (error) {
        console.error('Error fetching gallery images:', error);
        console.error('API endpoint:', API_ENDPOINTS?.GALLERY_IMAGES || 'Not defined');
        throw error;
    }
}

/**
 * Create a gallery grid item element from image data
 */
function createGalleryItem(image, index) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.imageIndex = index;

    // Create image wrapper
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'gallery-item-image';

    // Create optimized image element with responsive images
    const img = document.createElement('img');

    // Use thumbnail as primary src, with srcset for responsiveness
    img.src = generateCloudinaryUrl(image.cloudinary_url, 'thumbnail');
    img.srcset = generateSrcset(image.cloudinary_url);
    img.sizes = '(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw';
    img.alt = image.caption || `Makayla Moon Gallery ${index + 1}`;
    img.loading = 'lazy';

    // Add error handling for broken images
    img.onerror = function() {
        console.error(`Failed to load image: ${image.cloudinary_url}`);
        this.style.display = 'none';
        const errorMsg = document.createElement('div');
        errorMsg.className = 'gallery-item-error';
        errorMsg.textContent = 'Failed to load image';
        imageWrapper.appendChild(errorMsg);
    };

    // Add click handler for lightbox (pass original URL for full-size)
    img.addEventListener('click', () => {
        openLightbox(image.cloudinary_url, index);
    });

    // Create overlay on hover
    const overlay = document.createElement('div');
    overlay.className = 'gallery-item-overlay';
    const overlayIcon = document.createElement('span');
    overlayIcon.className = 'gallery-item-icon';
    overlayIcon.textContent = '👁️';
    overlay.appendChild(overlayIcon);

    // Add caption if available
    if (image.caption) {
        const caption = document.createElement('div');
        caption.className = 'gallery-item-caption';
        caption.textContent = image.caption;
        overlay.appendChild(caption);
    }

    // Assemble item
    imageWrapper.appendChild(img);
    imageWrapper.appendChild(overlay);
    item.appendChild(imageWrapper);

    return item;
}

/**
 * Open lightbox with image (global function)
 */
window.openLightbox = function(imageUrl, imageIndex) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCaption = document.getElementById('lightbox-caption');

    if (lightbox && lightboxImage) {
        // Use full-size transformation for lightbox
        const fullSizeUrl = generateCloudinaryUrl(imageUrl, 'full');

        lightboxImage.src = fullSizeUrl;
        lightboxImage.alt = galleryState.allImages[imageIndex]?.caption || `Gallery image ${imageIndex + 1}`;

        // Show caption if available
        if (lightboxCaption) {
            if (galleryState.allImages[imageIndex]?.caption) {
                lightboxCaption.textContent = galleryState.allImages[imageIndex].caption;
                lightboxCaption.style.display = 'block';
            } else {
                lightboxCaption.style.display = 'none';
            }
        }

        lightbox.classList.add('active');
        lightbox.dataset.currentIndex = imageIndex;

        // Prevent body scroll when lightbox is open
        document.body.style.overflow = 'hidden';
    }
};

/**
 * Render initial gallery images
 */
async function renderGallery() {
    const galleryGrid = document.getElementById('gallery-grid');

    if (!galleryGrid) {
        console.error('Gallery grid container not found');
        return;
    }

    // Show loading state
    galleryGrid.innerHTML = '<div class="gallery-loading">Loading gallery...</div>';

    try {
        // Fetch first page (with cache)
        const result = await fetchGalleryImages(null, true);

        if (!result || !result.data || !result.data.images) {
            galleryGrid.innerHTML = '<div class="gallery-error">Failed to load gallery.</div>';
            return;
        }

        const data = result.data;
        const fromCache = result.fromCache;
        const cacheAge = result.cacheAge;

        // Update state - handle both cache and API response formats
        galleryState.allImages = data.images;
        galleryState.nextCursor = data.pagination ? data.pagination.next_cursor : data.nextCursor;
        galleryState.hasMore = data.pagination ? data.pagination.has_more : data.hasMore;

        // Only recache if:
        // 1. Data came from API (not cache), OR
        // 2. Cache is older than 16 minutes (needs refresh)
        const shouldRecache = !fromCache || (cacheAge !== null && cacheAge > 16 * 60 * 1000);
        
        if (shouldRecache) {
            if (fromCache) {
                console.log(`Cache is ${Math.round(cacheAge / 1000 / 60)} minutes old, refreshing cache`);
            } else {
                console.log('Data fetched from API, caching fresh data');
            }
            // Cache the initial data in API response format (only if no recent reorder)
            // Note: setCachedData will check and prevent caching if reorder happened recently
            setCachedData({
                images: galleryState.allImages,
                pagination: {
                    next_cursor: galleryState.nextCursor,
                    has_more: galleryState.hasMore,
                    total_count: data.pagination ? data.pagination.total_count : galleryState.allImages.length
                }
            });
        } else {
            console.log(`Skipping recache - using fresh cached data (age: ${Math.round(cacheAge / 1000)}s)`);
        }

        if (galleryState.allImages.length === 0) {
            galleryGrid.innerHTML = '<div class="gallery-empty">No images available at this time.</div>';
            return;
        }

        // Render images
        renderImages();

        // Add "Load More" button if there are more images
        if (galleryState.hasMore) {
            addLoadMoreButton();
        }

        console.log(`Successfully rendered ${galleryState.allImages.length} images`);

    } catch (error) {
        console.error('Error rendering gallery:', error);
        galleryGrid.innerHTML = '<div class="gallery-error">Failed to load gallery. Please try again later.</div>';
    }
}

/**
 * Render images in the grid
 */
function renderImages() {
    const galleryGrid = document.getElementById('gallery-grid');

    // Clear grid completely (including load more button)
    galleryGrid.innerHTML = '';

    // Create and append grid items
    galleryState.allImages.forEach((image, index) => {
        const item = createGalleryItem(image, index);
        galleryGrid.appendChild(item);
    });
}

/**
 * Add "Load More" button to gallery
 */
function addLoadMoreButton() {
    const galleryGrid = document.getElementById('gallery-grid');

    // Remove existing button if present
    const existing = galleryGrid.querySelector('.load-more-container');
    if (existing) {
        existing.remove();
    }

    // Create load more container
    const container = document.createElement('div');
    container.className = 'load-more-container';

    const button = document.createElement('button');
    button.className = 'btn btn-primary load-more-btn';
    button.textContent = 'Load More';
    button.onclick = loadMoreImages;

    container.appendChild(button);
    galleryGrid.appendChild(container);
}

/**
 * Load more images (pagination)
 */
async function loadMoreImages() {
    if (galleryState.isLoading || !galleryState.hasMore) {
        return;
    }

    const button = document.querySelector('.load-more-btn');
    if (!button) return;

    try {
        galleryState.isLoading = true;
        button.textContent = 'Loading...';
        button.disabled = true;

        // Fetch next page (always from API, not cache)
        const result = await fetchGalleryImages(galleryState.nextCursor, false);

        if (!result || !result.data || !result.data.images) {
            throw new Error('Failed to load more images');
        }

        const data = result.data;

        // Append new images to state
        galleryState.allImages = [...galleryState.allImages, ...data.images];
        galleryState.nextCursor = data.pagination.next_cursor;
        galleryState.hasMore = data.pagination.has_more;

        // Always update cache when loading more images (new data from API)
        setCachedData({
            images: galleryState.allImages,
            pagination: {
                next_cursor: galleryState.nextCursor,
                has_more: galleryState.hasMore,
                total_count: data.pagination.total_count
            }
        });

        // Re-render images
        renderImages();

        // Update or remove button
        if (galleryState.hasMore) {
            addLoadMoreButton();
        }

        console.log(`Loaded ${data.images.length} more images (total: ${galleryState.allImages.length})`);

    } catch (error) {
        console.error('Error loading more images:', error);
        button.textContent = 'Load More';
        button.disabled = false;
        alert('Failed to load more images. Please try again.');
    } finally {
        galleryState.isLoading = false;
    }
}

// Make loadMoreImages available globally for debugging
window.loadMoreImages = loadMoreImages;

// Initialize gallery when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderGallery);
} else {
    renderGallery();
}

