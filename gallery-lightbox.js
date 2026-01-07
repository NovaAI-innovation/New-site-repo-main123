/**
 * Lightbox functionality for gallery grid
 * Handles opening, closing, and navigation of images in lightbox
 */

// Initialize lightbox when DOM is ready
function initializeLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxImage = document.getElementById('lightbox-image');

    if (!lightbox || !lightboxImage) {
        console.warn('Lightbox elements not found');
        return;
    }

    // Close lightbox
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Navigate to previous image
    function showPreviousImage() {
        const currentIndex = parseInt(lightbox.dataset.currentIndex || '0');
        if (typeof galleryState !== 'undefined' && galleryState.allImages.length > 0) {
            const prevIndex = (currentIndex - 1 + galleryState.allImages.length) % galleryState.allImages.length;
            openLightbox(galleryState.allImages[prevIndex].cloudinary_url, prevIndex);
        }
    }

    // Navigate to next image
    function showNextImage() {
        const currentIndex = parseInt(lightbox.dataset.currentIndex || '0');
        if (typeof galleryState !== 'undefined' && galleryState.allImages.length > 0) {
            const nextIndex = (currentIndex + 1) % galleryState.allImages.length;
            openLightbox(galleryState.allImages[nextIndex].cloudinary_url, nextIndex);
        }
    }

    // Close button
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    // Previous button
    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', showPreviousImage);
    }

    // Next button
    if (lightboxNext) {
        lightboxNext.addEventListener('click', showNextImage);
    }

    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('active')) {
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                showPreviousImage();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                showNextImage();
            }
        }
    });
}

// Make openLightbox function available globally (defined in gallery-api.js)
// This file just handles the lightbox controls

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLightbox);
} else {
    initializeLightbox();
}



