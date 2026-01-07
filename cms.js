/**
 * Enhanced CMS JavaScript
 * Features: Drag & Drop Upload, Image Reordering, Bulk Operations, Search & Sort
 */

// =====================
// STATE MANAGEMENT
// =====================

const cmsState = {
    authenticated: false,
    password: null,
    selectedImages: new Set(),
    images: [],
    filesToUpload: [],
    draggedElement: null,
    searchQuery: '',
    sortOrder: 'newest'
};

// =====================
// DOM ELEMENTS
// =====================

const elements = {
    // Auth
    authSection: document.getElementById('auth-section'),
    cmsDashboard: document.getElementById('cms-dashboard'),
    authForm: document.getElementById('auth-form'),
    authError: document.getElementById('auth-error'),
    passwordInput: document.getElementById('password'),
    logoutBtn: document.getElementById('logout-btn'),

    // Stats
    totalImages: document.getElementById('total-images'),
    totalStorage: document.getElementById('total-storage'),
    selectedCount: document.getElementById('selected-count'),

    // Upload
    dropZone: document.getElementById('drop-zone'),
    imageFilesInput: document.getElementById('image-files'),
    browseBtn: document.getElementById('browse-btn'),
    filePreviewContainer: document.getElementById('file-preview-container'),
    filePreviewGrid: document.getElementById('file-preview-grid'),
    fileCount: document.getElementById('file-count'),
    uploadCount: document.getElementById('upload-count'),
    clearFilesBtn: document.getElementById('clear-files-btn'),
    uploadBtn: document.getElementById('upload-btn'),
    captionInput: document.getElementById('caption'),
    uploadMessage: document.getElementById('upload-message'),

    // Gallery
    galleryGrid: document.getElementById('gallery-grid'),
    galleryMessage: document.getElementById('gallery-message'),
    galleryCountBadge: document.getElementById('gallery-count-badge'),
    searchInput: document.getElementById('search-input'),
    sortSelect: document.getElementById('sort-select'),
    refreshBtn: document.getElementById('refresh-btn'),
    emptyState: document.getElementById('empty-state'),

    // Bulk Operations
    bulkToolbar: document.getElementById('bulk-toolbar'),
    bulkCount: document.getElementById('bulk-count'),
    selectAllBtn: document.getElementById('select-all-btn'),
    deselectAllBtn: document.getElementById('deselect-all-btn'),
    deleteSelectedBtn: document.getElementById('delete-selected-btn')
};

// =====================
// AUTHENTICATION
// =====================

function checkAuth() {
    const savedPassword = sessionStorage.getItem('cms_password');
    if (savedPassword) {
        cmsState.password = savedPassword;
        cmsState.authenticated = true;
        showDashboard();
        loadGalleryImages();
    }
}

function showAuth() {
    elements.authSection.classList.remove('hidden');
    elements.cmsDashboard.classList.add('hidden');
    cmsState.authenticated = false;
    cmsState.password = null;
    sessionStorage.removeItem('cms_password');
}

function showDashboard() {
    elements.authSection.classList.add('hidden');
    elements.cmsDashboard.classList.remove('hidden');
}

elements.authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = elements.passwordInput.value.trim();

    if (!password) {
        showError(elements.authError, 'Please enter a password');
        return;
    }

    try {
        const response = await fetch(API_ENDPOINTS.CMS_GALLERY_IMAGES, {
            method: 'GET',
            headers: {
                'X-CMS-Password': password,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            cmsState.password = password;
            cmsState.authenticated = true;
            sessionStorage.setItem('cms_password', password);
            showDashboard();
            loadGalleryImages();
            elements.passwordInput.value = '';
            hideError(elements.authError);
        } else {
            const errorData = await response.json();
            showError(elements.authError, errorData.detail?.message || 'Invalid password');
        }
    } catch (error) {
        console.error('Authentication error:', error);
        showError(elements.authError, 'Failed to connect to server');
    }
});

elements.logoutBtn.addEventListener('click', () => {
    showAuth();
    cmsState.selectedImages.clear();
    cmsState.images = [];
});

// =====================
// DRAG & DROP UPLOAD
// =====================

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    elements.dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop zone when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    elements.dropZone.addEventListener(eventName, () => {
        elements.dropZone.classList.add('drag-over');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    elements.dropZone.addEventListener(eventName, () => {
        elements.dropZone.classList.remove('drag-over');
    }, false);
});

// Handle dropped files
elements.dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
});

// Click to browse
elements.dropZone.addEventListener('click', () => {
    elements.imageFilesInput.click();
});

elements.browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.imageFilesInput.click();
});

elements.imageFilesInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            console.warn(`Skipping non-image file: ${file.name}`);
            return false;
        }
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            console.warn(`File too large: ${file.name}`);
            return false;
        }
        return true;
    });

    cmsState.filesToUpload = [...cmsState.filesToUpload, ...validFiles];
    displayFilePreview();
}

function displayFilePreview() {
    if (cmsState.filesToUpload.length === 0) {
        elements.filePreviewContainer.style.display = 'none';
        return;
    }

    elements.filePreviewContainer.style.display = 'block';
    elements.fileCount.textContent = cmsState.filesToUpload.length;
    elements.uploadCount.textContent = cmsState.filesToUpload.length;
    elements.filePreviewGrid.innerHTML = '';

    cmsState.filesToUpload.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-preview-item';

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.onload = () => URL.revokeObjectURL(img.src);

        const overlay = document.createElement('div');
        overlay.className = 'file-preview-overlay';
        overlay.textContent = formatFileSize(file.size);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'file-remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeFile(index);
        };

        fileItem.appendChild(img);
        fileItem.appendChild(overlay);
        fileItem.appendChild(removeBtn);
        elements.filePreviewGrid.appendChild(fileItem);
    });
}

function removeFile(index) {
    cmsState.filesToUpload.splice(index, 1);
    displayFilePreview();
}

elements.clearFilesBtn.addEventListener('click', () => {
    cmsState.filesToUpload = [];
    displayFilePreview();
    elements.imageFilesInput.value = '';
});

// Upload files
elements.uploadBtn.addEventListener('click', async () => {
    if (cmsState.filesToUpload.length === 0) {
        showError(elements.uploadMessage, 'No files selected');
        return;
    }

    elements.uploadBtn.disabled = true;
    elements.uploadBtn.innerHTML = '<span>Uploading...</span>';

    const formData = new FormData();
    cmsState.filesToUpload.forEach(file => {
        formData.append('files', file);
    });

    const caption = elements.captionInput.value.trim();
    if (caption) {
        formData.append('caption', caption);
    }

    try {
        const response = await fetch(API_ENDPOINTS.CMS_GALLERY_IMAGES, {
            method: 'POST',
            headers: {
                'X-CMS-Password': cmsState.password
            },
            body: formData
        });

        if (response.ok) {
            showSuccess(elements.uploadMessage, `Successfully uploaded ${cmsState.filesToUpload.length} image(s)!`);
            cmsState.filesToUpload = [];
            elements.captionInput.value = '';
            elements.imageFilesInput.value = '';
            displayFilePreview();
            loadGalleryImages();
        } else {
            const error = await response.json();
            showError(elements.uploadMessage, error.detail || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showError(elements.uploadMessage, 'Failed to upload images');
    } finally {
        elements.uploadBtn.disabled = false;
        elements.uploadBtn.innerHTML = '<span class="btn-icon">⬆️</span><span>Upload <span id="upload-count">0</span> Images</span>';
    }
});

// =====================
// GALLERY MANAGEMENT
// =====================

async function loadGalleryImages() {
    elements.galleryGrid.innerHTML = '<div class="gallery-loading"><div class="loading-spinner"></div><p>Loading gallery images...</p></div>';

    try {
        const response = await fetch(API_ENDPOINTS.CMS_GALLERY_IMAGES, {
            method: 'GET',
            headers: {
                'X-CMS-Password': cmsState.password,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            cmsState.images = await response.json();
            updateStatistics();
            renderGallery();
        } else {
            throw new Error('Failed to load images');
        }
    } catch (error) {
        console.error('Error loading gallery:', error);
        elements.galleryGrid.innerHTML = '<div class="gallery-loading"><p style="color: #ff6b6b;">Failed to load images</p></div>';
    }
}

function renderGallery() {
    let filteredImages = [...cmsState.images];

    // Apply search filter
    if (cmsState.searchQuery) {
        const query = cmsState.searchQuery.toLowerCase();
        filteredImages = filteredImages.filter(img =>
            (img.caption && img.caption.toLowerCase().includes(query)) ||
            (img.cloudinary_url && img.cloudinary_url.toLowerCase().includes(query))
        );
    }

    // Apply sort
    filteredImages.sort((a, b) => {
        switch (cmsState.sortOrder) {
            case 'newest':
                return new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0);
            case 'oldest':
                return new Date(a.uploaded_at || 0) - new Date(b.uploaded_at || 0);
            case 'name-az':
                return (a.caption || '').localeCompare(b.caption || '');
            case 'name-za':
                return (b.caption || '').localeCompare(a.caption || '');
            default:
                return 0;
        }
    });

    elements.galleryCountBadge.textContent = filteredImages.length;

    if (filteredImages.length === 0) {
        elements.galleryGrid.style.display = 'none';
        elements.emptyState.style.display = 'block';
        return;
    }

    elements.galleryGrid.style.display = 'grid';
    elements.emptyState.style.display = 'none';
    elements.galleryGrid.innerHTML = '';

    filteredImages.forEach((image, index) => {
        const card = createImageCard(image, index);
        elements.galleryGrid.appendChild(card);
    });
}

function createImageCard(image, index) {
    const card = document.createElement('div');
    card.className = 'cms-image-card';
    card.dataset.imageId = image.id;
    card.draggable = true;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'image-card-checkbox';
    checkbox.checked = cmsState.selectedImages.has(image.id);
    checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleImageSelection(image.id);
    });

    // Drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'image-card-drag-handle';
    dragHandle.innerHTML = '⋮⋮';

    // Preview
    const preview = document.createElement('div');
    preview.className = 'image-card-preview';
    const img = document.createElement('img');
    img.src = image.cloudinary_url;
    img.alt = image.caption || 'Gallery image';
    img.loading = 'lazy';
    preview.appendChild(img);

    // Info section
    const info = document.createElement('div');
    info.className = 'image-card-info';

    const name = document.createElement('div');
    name.className = 'image-card-name';
    name.textContent = image.caption || 'Untitled';

    const meta = document.createElement('div');
    meta.className = 'image-card-meta';
    meta.innerHTML = `
        <span>${formatDate(image.uploaded_at)}</span>
        <span>ID: ${image.id}</span>
    `;

    const actions = document.createElement('div');
    actions.className = 'image-card-actions';

    const editCaptionBtn = document.createElement('button');
    editCaptionBtn.className = 'btn btn-secondary btn-small';
    editCaptionBtn.innerHTML = '<span>✏️</span> Edit Caption';
    editCaptionBtn.onclick = (e) => {
        e.stopPropagation();
        openCaptionEditor(image.id, image.caption, image.cloudinary_url);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-small';
    deleteBtn.innerHTML = '<span>🗑️</span> Delete';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteImage(image.id);
    };

    actions.appendChild(editCaptionBtn);
    actions.appendChild(deleteBtn);
    info.appendChild(name);
    info.appendChild(meta);
    info.appendChild(actions);

    card.appendChild(checkbox);
    card.appendChild(dragHandle);
    card.appendChild(preview);
    card.appendChild(info);

    // Drag events for reordering
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);

    return card;
}

// =====================
// DRAG TO REORDER (OPTIMIZED FOR GRID LAYOUT)
// =====================

let dragOverElement = null;

function handleDragStart(e) {
    cmsState.draggedElement = this;
    this.classList.add('dragging');
    this.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    this.style.opacity = '1';

    // Remove all drop indicators
    document.querySelectorAll('.cms-image-card').forEach(card => {
        card.classList.remove('drag-over-before', 'drag-over-after');
    });

    cmsState.draggedElement = null;
    dragOverElement = null;

    // Save the new order to the backend
    saveImageOrder();
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const draggingElement = document.querySelector('.dragging');
    if (!draggingElement || this === draggingElement) return false;

    // Remove previous indicators
    document.querySelectorAll('.cms-image-card').forEach(card => {
        card.classList.remove('drag-over-before', 'drag-over-after');
    });

    // Get the bounding box of the current element
    const rect = this.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const midY = rect.top + rect.height / 2;

    // Determine if we should insert before or after based on cursor position
    const shouldInsertBefore = isBeforeElement(e.clientX, e.clientY, rect);

    if (shouldInsertBefore) {
        this.classList.add('drag-over-before');
        elements.galleryGrid.insertBefore(draggingElement, this);
    } else {
        this.classList.add('drag-over-after');
        elements.galleryGrid.insertBefore(draggingElement, this.nextSibling);
    }

    dragOverElement = this;
    return false;
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    // Remove all drop indicators
    document.querySelectorAll('.cms-image-card').forEach(card => {
        card.classList.remove('drag-over-before', 'drag-over-after');
    });

    return false;
}

/**
 * Save the current visual order of images to the backend.
 * Collects image IDs in their current DOM order and sends to API.
 */
async function saveImageOrder() {
    try {
        // Get all image cards in their current DOM order
        const cards = Array.from(elements.galleryGrid.querySelectorAll('.cms-image-card'));

        // Extract image IDs in display order
        const orderedIds = cards.map(card => parseInt(card.dataset.imageId));

        // Validate we have IDs to save
        if (orderedIds.length === 0) {
            console.warn('No images to reorder');
            return;
        }

        console.log('Saving new image order:', orderedIds);
        console.log('API Endpoint:', API_ENDPOINTS.CMS_REORDER_IMAGES);
        console.log('Password present:', !!cmsState.password);

        // Call reorder API endpoint
        const response = await fetch(API_ENDPOINTS.CMS_REORDER_IMAGES, {
            method: 'PUT',
            headers: {
                'X-CMS-Password': cmsState.password,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image_ids: orderedIds
            })
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('Image order saved successfully:', result);

            // Optional: Show success message (subtle, not intrusive)
            showSuccess(elements.galleryMessage, 'Image order saved');
        } else {
            const errorText = await response.text();
            console.error('Failed to save image order. Status:', response.status);
            console.error('Error response:', errorText);

            let errorMessage = 'Failed to save image order';
            try {
                const error = JSON.parse(errorText);
                errorMessage = error.detail?.error || error.detail || errorMessage;
            } catch (e) {
                // Not JSON, use text as is
                errorMessage = errorText || errorMessage;
            }

            showError(elements.galleryMessage, errorMessage);

            // Reload to restore correct order
            loadGalleryImages();
        }
    } catch (error) {
        console.error('Error saving image order:', error);
        console.error('Error details:', error.message, error.stack);
        showError(elements.galleryMessage, 'Error saving image order: ' + error.message);

        // Reload to restore correct order
        loadGalleryImages();
    }
}

function isBeforeElement(mouseX, mouseY, rect) {
    // Calculate the center point of the element
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Get the grid's computed style to determine layout direction
    const gridStyle = window.getComputedStyle(elements.galleryGrid);
    const isRTL = gridStyle.direction === 'rtl';

    // For grid layouts, we need to consider both X and Y positions
    // First, check if we're on the same row (within vertical tolerance)
    const verticalTolerance = rect.height * 0.3;
    const onSameRow = Math.abs(mouseY - centerY) < verticalTolerance;

    if (onSameRow) {
        // If on same row, use horizontal position
        return isRTL ? mouseX > centerX : mouseX < centerX;
    } else {
        // If on different rows, use vertical position
        return mouseY < centerY;
    }
}

// Enhanced drag enter for grid container
elements.galleryGrid.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const draggingElement = document.querySelector('.dragging');
    if (!draggingElement) return;

    // Find the closest element to cursor position
    const afterElement = getClosestElement(elements.galleryGrid, e.clientX, e.clientY);

    if (afterElement && afterElement !== draggingElement) {
        const rect = afterElement.getBoundingClientRect();
        const shouldInsertBefore = isBeforeElement(e.clientX, e.clientY, rect);

        if (shouldInsertBefore) {
            elements.galleryGrid.insertBefore(draggingElement, afterElement);
        } else {
            elements.galleryGrid.insertBefore(draggingElement, afterElement.nextSibling);
        }
    }
});

function getClosestElement(container, x, y) {
    const draggableElements = [...container.querySelectorAll('.cms-image-card:not(.dragging)')];

    let closest = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    draggableElements.forEach(child => {
        const box = child.getBoundingClientRect();
        const centerX = box.left + box.width / 2;
        const centerY = box.top + box.height / 2;

        // Calculate Euclidean distance from cursor to element center
        const distance = Math.sqrt(
            Math.pow(x - centerX, 2) +
            Math.pow(y - centerY, 2)
        );

        if (distance < closestDistance) {
            closestDistance = distance;
            closest = child;
        }
    });

    return closest;
}

// =====================
// BULK OPERATIONS
// =====================

function toggleImageSelection(imageId) {
    if (cmsState.selectedImages.has(imageId)) {
        cmsState.selectedImages.delete(imageId);
    } else {
        cmsState.selectedImages.add(imageId);
    }
    updateSelectionUI();
}

function updateSelectionUI() {
    const count = cmsState.selectedImages.size;
    elements.selectedCount.textContent = count;
    elements.bulkCount.textContent = count;

    if (count > 0) {
        elements.bulkToolbar.style.display = 'flex';
        elements.deleteSelectedBtn.disabled = false;
    } else {
        elements.bulkToolbar.style.display = 'none';
        elements.deleteSelectedBtn.disabled = true;
    }

    // Update card selection visuals
    document.querySelectorAll('.cms-image-card').forEach(card => {
        const imageId = parseInt(card.dataset.imageId);
        const checkbox = card.querySelector('.image-card-checkbox');

        if (cmsState.selectedImages.has(imageId)) {
            card.classList.add('selected');
            if (checkbox) checkbox.checked = true;
        } else {
            card.classList.remove('selected');
            if (checkbox) checkbox.checked = false;
        }
    });
}

elements.selectAllBtn.addEventListener('click', () => {
    cmsState.images.forEach(img => cmsState.selectedImages.add(img.id));
    updateSelectionUI();
});

elements.deselectAllBtn.addEventListener('click', () => {
    cmsState.selectedImages.clear();
    updateSelectionUI();
});

elements.deleteSelectedBtn.addEventListener('click', async () => {
    const count = cmsState.selectedImages.size;
    if (!confirm(`Delete ${count} selected image(s)?`)) return;

    try {
        const response = await fetch(API_ENDPOINTS.CMS_BULK_DELETE, {
            method: 'DELETE',
            headers: {
                'X-CMS-Password': cmsState.password,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image_ids: Array.from(cmsState.selectedImages)
            })
        });

        if (response.ok) {
            showSuccess(elements.galleryMessage, `Deleted ${count} image(s)`);
            cmsState.selectedImages.clear();
            loadGalleryImages();
        } else {
            throw new Error('Bulk delete failed');
        }
    } catch (error) {
        console.error('Bulk delete error:', error);
        showError(elements.galleryMessage, 'Failed to delete images');
    }
});

// =====================
// SINGLE IMAGE DELETE
// =====================

async function deleteImage(imageId) {
    if (!confirm('Delete this image?')) return;

    try {
        const response = await fetch(API_ENDPOINTS.CMS_GALLERY_IMAGE(imageId), {
            method: 'DELETE',
            headers: {
                'X-CMS-Password': cmsState.password
            }
        });

        if (response.ok) {
            showSuccess(elements.galleryMessage, 'Image deleted');
            cmsState.selectedImages.delete(imageId);
            loadGalleryImages();
        } else {
            throw new Error('Delete failed');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showError(elements.galleryMessage, 'Failed to delete image');
    }
}

// =====================
// CAPTION EDITING
// =====================

let currentEditingImageId = null;

function openCaptionEditor(imageId, currentCaption, imageUrl) {
    const modal = document.getElementById('caption-edit-modal');
    const previewImg = document.getElementById('caption-edit-preview-img');
    const captionInput = document.getElementById('caption-edit-input');

    if (modal && previewImg && captionInput) {
        currentEditingImageId = imageId;
        previewImg.src = imageUrl;
        captionInput.value = currentCaption || '';
        modal.classList.remove('hidden');
        captionInput.focus();
    }
}

function closeCaptionEditor() {
    const modal = document.getElementById('caption-edit-modal');
    const captionInput = document.getElementById('caption-edit-input');

    if (modal) {
        modal.classList.add('hidden');
        currentEditingImageId = null;
        if (captionInput) {
            captionInput.value = '';
        }
    }
}

async function saveCaptionUpdate() {
    const captionInput = document.getElementById('caption-edit-input');

    if (!currentEditingImageId || !captionInput) {
        return;
    }

    const newCaption = captionInput.value.trim();

    try {
        const response = await fetch(API_ENDPOINTS.CMS_GALLERY_IMAGE(currentEditingImageId), {
            method: 'PUT',
            headers: {
                'X-CMS-Password': cmsState.password,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                caption: newCaption || null
            })
        });

        if (response.ok) {
            showSuccess(elements.galleryMessage, 'Caption updated successfully');
            closeCaptionEditor();
            loadGalleryImages(); // Reload to show updated caption
        } else {
            const error = await response.json();
            showError(elements.galleryMessage, error.detail?.error || 'Failed to update caption');
        }
    } catch (error) {
        console.error('Caption update error:', error);
        showError(elements.galleryMessage, 'Error updating caption');
    }
}

// Caption modal event listeners
const captionSaveBtn = document.getElementById('caption-save-btn');
const captionCancelBtn = document.getElementById('caption-cancel-btn');
const captionModal = document.getElementById('caption-edit-modal');

if (captionSaveBtn) {
    captionSaveBtn.addEventListener('click', saveCaptionUpdate);
}

if (captionCancelBtn) {
    captionCancelBtn.addEventListener('click', closeCaptionEditor);
}

// Close modal on overlay click
if (captionModal) {
    captionModal.addEventListener('click', (e) => {
        if (e.target === captionModal || e.target.classList.contains('modal-overlay')) {
            closeCaptionEditor();
        }
    });
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('caption-edit-modal');
        if (modal && !modal.classList.contains('hidden')) {
            closeCaptionEditor();
        }
    }
});

// =====================
// SEARCH & SORT
// =====================

elements.searchInput.addEventListener('input', (e) => {
    cmsState.searchQuery = e.target.value;
    renderGallery();
});

elements.sortSelect.addEventListener('change', (e) => {
    cmsState.sortOrder = e.target.value;
    renderGallery();
});

elements.refreshBtn.addEventListener('click', () => {
    loadGalleryImages();
});

// =====================
// STATISTICS
// =====================

function updateStatistics() {
    elements.totalImages.textContent = cmsState.images.length;

    // Calculate total storage (if available)
    const totalBytes = cmsState.images.reduce((sum, img) => sum + (img.file_size || 0), 0);
    elements.totalStorage.textContent = formatFileSize(totalBytes);
}

// =====================
// UTILITY FUNCTIONS
// =====================

function showError(element, message) {
    element.textContent = message;
    element.className = 'cms-message error';
    element.style.display = 'block';
}

function showSuccess(element, message) {
    element.textContent = message;
    element.className = 'cms-message success';
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

function hideError(element) {
    element.style.display = 'none';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// =====================
// INITIALIZATION
// =====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
} else {
    checkAuth();
}

