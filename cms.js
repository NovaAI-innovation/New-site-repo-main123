/**
 * CMS JavaScript
 * Handles authentication, image upload, deletion, and management
 */

// CMS State
let cmsState = {
    authenticated: false,
    password: null,
    selectedImages: new Set(),
    images: []
};

// DOM Elements
const authSection = document.getElementById('auth-section');
const cmsDashboard = document.getElementById('cms-dashboard');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const passwordInput = document.getElementById('password');
const logoutBtn = document.getElementById('logout-btn');
const uploadForm = document.getElementById('upload-form');
const imageFilesInput = document.getElementById('image-files');
const fileList = document.getElementById('file-list');
const uploadMessage = document.getElementById('upload-message');
const galleryGrid = document.getElementById('gallery-grid');
const galleryMessage = document.getElementById('gallery-message');
const selectAllBtn = document.getElementById('select-all-btn');
const deselectAllBtn = document.getElementById('deselect-all-btn');
const deleteSelectedBtn = document.getElementById('delete-selected-btn');
const refreshBtn = document.getElementById('refresh-btn');

// Check if already authenticated (from sessionStorage)
function checkAuth() {
    const savedPassword = sessionStorage.getItem('cms_password');
    if (savedPassword) {
        cmsState.password = savedPassword;
        cmsState.authenticated = true;
        showDashboard();
        loadGalleryImages();
    }
}

// Show authentication section
function showAuth() {
    authSection.classList.remove('hidden');
    cmsDashboard.classList.add('hidden');
    cmsState.authenticated = false;
    cmsState.password = null;
    sessionStorage.removeItem('cms_password');
}

// Show dashboard
function showDashboard() {
    authSection.classList.add('hidden');
    cmsDashboard.classList.remove('hidden');
}

// Handle authentication
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = passwordInput.value.trim();
    if (!password) {
        showError(authError, 'Please enter a password');
        return;
    }

    // Test authentication by making a request to CMS endpoint
    try {
        const response = await fetch(API_ENDPOINTS.CMS_GALLERY_IMAGES, {
            method: 'GET',
            headers: {
                'X-CMS-Password': password,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // Authentication successful
            cmsState.password = password;
            cmsState.authenticated = true;
            sessionStorage.setItem('cms_password', password);
            showDashboard();
            loadGalleryImages();
            passwordInput.value = '';
            hideError(authError);
        } else {
            const errorData = await response.json();
            showError(authError, errorData.detail?.message || errorData.detail?.error || 'Invalid password');
        }
    } catch (error) {
        console.error('Authentication error:', error);
        showError(authError, 'Failed to connect to server. Please check your connection and API configuration.');
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    cmsState.authenticated = false;
    cmsState.password = null;
    cmsState.selectedImages.clear();
    sessionStorage.removeItem('cms_password');
    showAuth();
});

// File input change handler
imageFilesInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        fileList.innerHTML = `<strong>Selected ${files.length} file(s):</strong><br>${files.map(f => f.name).join('<br>')}`;
    } else {
        fileList.innerHTML = '';
    }
});

// Upload form handler
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!cmsState.authenticated) {
        showError(uploadMessage, 'Please login first');
        return;
    }

    const files = Array.from(imageFilesInput.files);
    if (files.length === 0) {
        showError(uploadMessage, 'Please select at least one image');
        return;
    }

    const caption = document.getElementById('caption').value.trim();
    const uploadBtn = document.getElementById('upload-btn');
    
    // Disable upload button
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    hideMessage(uploadMessage);

    try {
        const formData = new FormData();
        
        // Add all files
        files.forEach(file => {
            formData.append('files', file);
        });
        
        // Add caption if provided
        if (caption) {
            formData.append('captions', caption);
        }

        const response = await fetch(API_ENDPOINTS.CMS_GALLERY_IMAGES, {
            method: 'POST',
            headers: {
                'X-CMS-Password': cmsState.password
            },
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            showSuccess(uploadMessage, `Successfully uploaded ${result.length} image(s)`);
            uploadForm.reset();
            fileList.innerHTML = '';
            // Reload gallery
            loadGalleryImages();
        } else {
            const errorData = await response.json();
            showError(uploadMessage, errorData.detail?.error || errorData.detail || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showError(uploadMessage, 'Failed to upload images. Please check your connection.');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload Images';
    }
});

// Load gallery images
async function loadGalleryImages() {
    if (!cmsState.authenticated) return;

    galleryGrid.innerHTML = '<div class="loading">Loading gallery images...</div>';
    hideMessage(galleryMessage);

    try {
        const response = await fetch(API_ENDPOINTS.CMS_GALLERY_IMAGES, {
            method: 'GET',
            headers: {
                'X-CMS-Password': cmsState.password,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const images = await response.json();
            cmsState.images = images;
            renderGallery(images);
        } else {
            if (response.status === 401) {
                showError(galleryMessage, 'Authentication failed. Please login again.');
                showAuth();
            } else {
                const errorData = await response.json();
                showError(galleryMessage, errorData.detail?.error || 'Failed to load images');
            }
            galleryGrid.innerHTML = '';
        }
    } catch (error) {
        console.error('Load gallery error:', error);
        showError(galleryMessage, 'Failed to load gallery. Please check your connection.');
        galleryGrid.innerHTML = '';
    }
}

// Render gallery grid
function renderGallery(images) {
    if (images.length === 0) {
        galleryGrid.innerHTML = '<div class="loading">No images in gallery</div>';
        return;
    }

    galleryGrid.innerHTML = images.map(image => `
        <div class="gallery-item" data-image-id="${image.id}">
            <input type="checkbox" class="gallery-item-checkbox" data-image-id="${image.id}">
            <img src="${image.cloudinary_url}" alt="${image.caption || 'Gallery image'}" loading="lazy">
            <div class="gallery-item-info">
                <p><strong>ID:</strong> ${image.id}</p>
                <p><strong>Caption:</strong> <span id="caption-${image.id}">${image.caption || 'No caption'}</span></p>
                <p><strong>Uploaded:</strong> ${new Date(image.created_at).toLocaleDateString()}</p>
                <div class="gallery-item-actions">
                    <button class="btn btn-secondary edit-caption-btn" data-image-id="${image.id}">Edit Caption</button>
                    <button class="btn btn-danger delete-btn" data-image-id="${image.id}">Delete</button>
                </div>
            </div>
        </div>
    `).join('');

    // Attach event listeners
    attachGalleryEventListeners();
}

// Attach event listeners to gallery items
function attachGalleryEventListeners() {
    // Checkbox handlers
    document.querySelectorAll('.gallery-item-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const imageId = parseInt(e.target.dataset.imageId);
            if (e.target.checked) {
                cmsState.selectedImages.add(imageId);
            } else {
                cmsState.selectedImages.delete(imageId);
            }
            updateDeleteButton();
        });
    });

    // Edit caption handlers
    document.querySelectorAll('.edit-caption-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const imageId = parseInt(e.target.dataset.imageId);
            editCaption(imageId);
        });
    });

    // Delete button handlers
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const imageId = parseInt(e.target.dataset.imageId);
            deleteImage(imageId);
        });
    });
}

// Edit caption
async function editCaption(imageId) {
    const image = cmsState.images.find(img => img.id === imageId);
    if (!image) return;

    const currentCaption = image.caption || '';
    const newCaption = prompt('Enter new caption (leave empty to remove):', currentCaption);
    
    if (newCaption === null) return; // User cancelled

    try {
        const response = await fetch(API_ENDPOINTS.CMS_GALLERY_IMAGE(imageId), {
            method: 'PUT',
            headers: {
                'X-CMS-Password': cmsState.password,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                caption: newCaption.trim() || null
            })
        });

        if (response.ok) {
            showSuccess(galleryMessage, 'Caption updated successfully');
            loadGalleryImages();
        } else {
            const errorData = await response.json();
            showError(galleryMessage, errorData.detail?.error || 'Failed to update caption');
        }
    } catch (error) {
        console.error('Update caption error:', error);
        showError(galleryMessage, 'Failed to update caption. Please check your connection.');
    }
}

// Delete single image
async function deleteImage(imageId) {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(API_ENDPOINTS.CMS_GALLERY_IMAGE(imageId), {
            method: 'DELETE',
            headers: {
                'X-CMS-Password': cmsState.password
            }
        });

        if (response.ok) {
            showSuccess(galleryMessage, 'Image deleted successfully');
            cmsState.selectedImages.delete(imageId);
            loadGalleryImages();
        } else {
            const errorData = await response.json();
            showError(galleryMessage, errorData.detail?.error || 'Failed to delete image');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showError(galleryMessage, 'Failed to delete image. Please check your connection.');
    }
}

// Select all images
selectAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.gallery-item-checkbox').forEach(checkbox => {
        checkbox.checked = true;
        const imageId = parseInt(checkbox.dataset.imageId);
        cmsState.selectedImages.add(imageId);
    });
    updateDeleteButton();
});

// Deselect all images
deselectAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.gallery-item-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    cmsState.selectedImages.clear();
    updateDeleteButton();
});

// Update delete button state
function updateDeleteButton() {
    deleteSelectedBtn.disabled = cmsState.selectedImages.size === 0;
    deleteSelectedBtn.textContent = `Delete Selected (${cmsState.selectedImages.size})`;
}

// Delete selected images
deleteSelectedBtn.addEventListener('click', async () => {
    if (cmsState.selectedImages.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${cmsState.selectedImages.size} image(s)? This action cannot be undone.`)) {
        return;
    }

    const imageIds = Array.from(cmsState.selectedImages);
    deleteSelectedBtn.disabled = true;
    deleteSelectedBtn.textContent = 'Deleting...';

    try {
        const response = await fetch(API_ENDPOINTS.CMS_BULK_DELETE, {
            method: 'DELETE',
            headers: {
                'X-CMS-Password': cmsState.password,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image_ids: imageIds
            })
        });

        if (response.ok) {
            const result = await response.json();
            showSuccess(galleryMessage, `Successfully deleted ${result.deleted_ids.length} image(s)`);
            cmsState.selectedImages.clear();
            loadGalleryImages();
        } else {
            const errorData = await response.json();
            showError(galleryMessage, errorData.detail?.error || 'Failed to delete images');
        }
    } catch (error) {
        console.error('Bulk delete error:', error);
        showError(galleryMessage, 'Failed to delete images. Please check your connection.');
    } finally {
        updateDeleteButton();
    }
});

// Refresh gallery
refreshBtn.addEventListener('click', () => {
    loadGalleryImages();
});

// Utility functions
function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

function showSuccess(element, message) {
    element.textContent = message;
    element.className = 'success';
    element.style.display = 'block';
    setTimeout(() => hideMessage(element), 5000);
}

function hideError(element) {
    element.style.display = 'none';
}

function hideMessage(element) {
    element.style.display = 'none';
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
} else {
    checkAuth();
}


