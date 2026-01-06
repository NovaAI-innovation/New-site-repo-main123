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

/**
 * Fetch gallery images from the API
 */
async function fetchGalleryImages() {
    try {
        const endpoint = API_ENDPOINTS.GALLERY_IMAGES;
        console.log('Fetching gallery images from:', endpoint);
        console.log('API_BASE_URL:', API_BASE_URL);

        const response = await fetch(endpoint, {
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

        const images = await response.json();
        console.log(`Successfully fetched ${images.length} gallery images`);
        return images;
    } catch (error) {
        console.error('Error fetching gallery images:', error);
        console.error('API endpoint:', API_ENDPOINTS?.GALLERY_IMAGES || 'Not defined');
        console.error('API_BASE_URL:', API_BASE_URL || 'Not defined');
        console.error('Make sure the backend API is running and accessible');
        console.error('Full error details:', error.message, error.stack);
        // Return empty array on error to prevent breaking the page
        return [];
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

    // Create image element
    const img = document.createElement('img');
    img.src = image.cloudinary_url;
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

    // Add click handler for lightbox
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

// Store images globally for lightbox navigation
let galleryImages = [];

/**
 * Open lightbox with image (global function)
 */
window.openLightbox = function(imageUrl, imageIndex) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    
    if (lightbox && lightboxImage) {
        lightboxImage.src = imageUrl;
        lightboxImage.alt = galleryImages[imageIndex]?.caption || `Gallery image ${imageIndex + 1}`;
        lightbox.classList.add('active');
        lightbox.dataset.currentIndex = imageIndex;
        
        // Prevent body scroll when lightbox is open
        document.body.style.overflow = 'hidden';
    }
};

/**
 * Render gallery images dynamically in grid layout
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
        // Fetch images from API
        const images = await fetchGalleryImages();
        galleryImages = images; // Store for lightbox navigation

        if (images.length === 0) {
            galleryGrid.innerHTML = '<div class="gallery-empty">No images available at this time.</div>';
            return;
        }

        // Clear loading state
        galleryGrid.innerHTML = '';

        // Create and append grid items
        images.forEach((image, index) => {
            const item = createGalleryItem(image, index);
            galleryGrid.appendChild(item);
        });

        console.log(`Successfully rendered ${images.length} images in grid layout`);

    } catch (error) {
        console.error('Error rendering gallery:', error);
        galleryGrid.innerHTML = '<div class="gallery-error">Failed to load gallery. Please try again later.</div>';
    }
}

// Initialize gallery when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderGallery);
} else {
    renderGallery();
}

