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

// Increment cache version to invalidate all cached data
// This is called when images are reordered to force fresh data fetch
window.invalidateGalleryCache = function() {
    // Increment version to invalidate all cached data
    const currentVersion = parseInt(CACHE_VERSION.replace('v', ''));
    CACHE_VERSION = 'v' + (currentVersion + 1);
    localStorage.removeItem(CACHE_CONFIG.KEY);
    console.log('Gallery cache invalidated and version bumped to:', CACHE_VERSION);
    console.log('Next gallery page load will fetch fresh data from API');
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
 */
function getCachedData() {
    try {
        const cached = localStorage.getItem(CACHE_CONFIG.KEY);
        if (!cached) return null;

        const parsed = JSON.parse(cached);

        // Check version
        if (parsed.version !== CACHE_CONFIG.VERSION) {
            console.log('Cache version mismatch, invalidating');
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
        return parsed.data;

    } catch (error) {
        console.error('Error reading cache:', error);
        localStorage.removeItem(CACHE_CONFIG.KEY);
        return null;
    }
}

/**
 * Save gallery data to localStorage cache
 */
function setCachedData(data) {
    try {
        const cacheObject = {
            data: data,
            timestamp: Date.now(),
            version: CACHE_CONFIG.VERSION
        };
        localStorage.setItem(CACHE_CONFIG.KEY, JSON.stringify(cacheObject));
        console.log('Saved data to cache');
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
 */
async function fetchGalleryImages(cursor = null, useCache = true) {
    try {
        // Try cache on initial load (no cursor)
        if (!cursor && useCache) {
            const cached = getCachedData();
            if (cached) {
                return cached;
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

        return data;

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
        const data = await fetchGalleryImages(null, true);

        if (!data || !data.images) {
            galleryGrid.innerHTML = '<div class="gallery-error">Failed to load gallery.</div>';
            return;
        }

        // Update state - handle both cache and API response formats
        galleryState.allImages = data.images;
        galleryState.nextCursor = data.pagination ? data.pagination.next_cursor : data.nextCursor;
        galleryState.hasMore = data.pagination ? data.pagination.has_more : data.hasMore;

        // Cache the initial data in API response format
        setCachedData({
            images: galleryState.allImages,
            pagination: {
                next_cursor: galleryState.nextCursor,
                has_more: galleryState.hasMore,
                total_count: data.pagination ? data.pagination.total_count : galleryState.allImages.length
            }
        });

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

        // Fetch next page
        const data = await fetchGalleryImages(galleryState.nextCursor, false);

        if (!data || !data.images) {
            throw new Error('Failed to load more images');
        }

        // Append new images to state
        galleryState.allImages = [...galleryState.allImages, ...data.images];
        galleryState.nextCursor = data.pagination.next_cursor;
        galleryState.hasMore = data.pagination.has_more;

        // Update cache with all images in API response format
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

