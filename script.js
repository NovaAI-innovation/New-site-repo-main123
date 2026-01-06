// ===========================
// Age Verification
// ===========================

const ageModal = document.getElementById('age-modal');
const ageConfirm = document.getElementById('age-confirm');
const ageDecline = document.getElementById('age-decline');

if (ageModal && ageConfirm && ageDecline) {
    // Check if user has already verified age
    const hasVerifiedAge = localStorage.getItem('ageVerified');

    if (hasVerifiedAge === 'true') {
        ageModal.classList.add('hidden');
    } else {
        ageModal.classList.remove('hidden');
    }

    ageConfirm.addEventListener('click', () => {
        localStorage.setItem('ageVerified', 'true');
        ageModal.classList.add('hidden');
    });

    ageDecline.addEventListener('click', () => {
        window.location.href = 'https://www.google.com';
    });
}

// ===========================
// Navigation
// ===========================

const nav = document.getElementById('nav');
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

// Sticky navigation on scroll
if (nav) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

// Mobile menu toggle
if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
}

// ===========================
// Scroll Reveal Animation
// ===========================

const revealElements = document.querySelectorAll('.reveal, .reveal-delay, .reveal-delay-2');

const revealOnScroll = () => {
    const triggerBottom = window.innerHeight * 0.85;
    
    revealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        
        if (elementTop < triggerBottom) {
            element.classList.add('active');
        }
    });
};

// Initial check on page load
revealOnScroll();

// Check on scroll
window.addEventListener('scroll', revealOnScroll);

// ===========================
// Gallery Carousel
// ===========================

// Global carousel state
let carouselState = {
    currentSlideIndex: 0,
    totalSlides: 0,
    initialized: false
};

// Initialize gallery carousel (can be called after images are dynamically loaded)
function initializeGalleryCarousel() {
    const carouselSlides = document.querySelectorAll('.gallery-slide');
    const carouselPrevBtn = document.getElementById('carousel-prev');
    const carouselNextBtn = document.getElementById('carousel-next');
    const carouselIndicatorsContainer = document.getElementById('carousel-indicators');

    if (!carouselIndicatorsContainer) {
        console.warn('Carousel indicators container not found');
        return;
    }

    // Only initialize if gallery elements exist
    if (carouselSlides.length > 0) {
        // Reset state
        carouselState.totalSlides = carouselSlides.length;
        carouselState.currentSlideIndex = 0;
        carouselState.initialized = true;

        // Ensure first slide is active
        carouselSlides.forEach((slide, index) => {
            slide.classList.remove('active');
            if (index === 0) {
                slide.classList.add('active');
            }
        });

        // Clear existing indicators
        carouselIndicatorsContainer.innerHTML = '';

        // Create carousel indicators
        function createIndicators() {
            for (let i = 0; i < carouselState.totalSlides; i++) {
                const indicator = document.createElement('div');
                indicator.classList.add('carousel-indicator');
                if (i === 0) indicator.classList.add('active');
                indicator.addEventListener('click', () => goToSlide(i));
                carouselIndicatorsContainer.appendChild(indicator);
            }
        }

        // Update carousel display
        function updateCarousel() {
            const carouselSlides = document.querySelectorAll('.gallery-slide');
            // Remove active class from all slides
            carouselSlides.forEach(slide => slide.classList.remove('active'));
            
            // Add active class to current slide
            if (carouselSlides[carouselState.currentSlideIndex]) {
                carouselSlides[carouselState.currentSlideIndex].classList.add('active');
            }
            
            // Update indicators
            const indicators = document.querySelectorAll('.carousel-indicator');
            indicators.forEach((indicator, index) => {
                if (index === carouselState.currentSlideIndex) {
                    indicator.classList.add('active');
                } else {
                    indicator.classList.remove('active');
                }
            });
        }

        // Go to specific slide
        function goToSlide(index) {
            if (index >= 0 && index < carouselState.totalSlides) {
                carouselState.currentSlideIndex = index;
                updateCarousel();
            }
        }

        // Navigate to previous slide
        function prevSlide() {
            carouselState.currentSlideIndex = (carouselState.currentSlideIndex - 1 + carouselState.totalSlides) % carouselState.totalSlides;
            updateCarousel();
        }

        // Navigate to next slide
        function nextSlide() {
            carouselState.currentSlideIndex = (carouselState.currentSlideIndex + 1) % carouselState.totalSlides;
            updateCarousel();
        }

        // Event listeners for carousel buttons (remove old listeners first)
        if (carouselPrevBtn) {
            carouselPrevBtn.onclick = null; // Clear old handler
            carouselPrevBtn.onclick = prevSlide;
        }

        if (carouselNextBtn) {
            carouselNextBtn.onclick = null; // Clear old handler
            carouselNextBtn.onclick = nextSlide;
        }

        // Keyboard navigation for carousel
        document.addEventListener('keydown', (e) => {
            // Only navigate if we're in the gallery section
            const gallerySection = document.getElementById('gallery');
            if (!gallerySection) return;
            
            const rect = gallerySection.getBoundingClientRect();
            const isInView = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isInView && carouselState.initialized) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    prevSlide();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    nextSlide();
                }
            }
        });

        // Initialize carousel
        createIndicators();
        updateCarousel();

        // Touch/Swipe support for mobile
        let touchStartX = 0;
        let touchEndX = 0;

        const gallerySlides = document.querySelector('.gallery-slides');
        if (gallerySlides) {
            gallerySlides.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            });
            
            gallerySlides.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            });
        }

        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold && carouselState.initialized) {
                if (diff > 0) {
                    // Swipe left - next slide
                    nextSlide();
                } else {
                    // Swipe right - previous slide
                    prevSlide();
                }
            }
        }
    }
}

// Listen for gallery loaded event
window.addEventListener('galleryLoaded', () => {
    // Only initialize carousel if carousel elements exist
    const hasCarousel = document.querySelector('.gallery-slide') || document.getElementById('carousel-indicators');
    if (hasCarousel) {
        initializeGalleryCarousel();
    }
});

// Initialize on page load if slides already exist (fallback for non-API gallery)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const hasCarousel = document.querySelector('.gallery-slide') || document.getElementById('carousel-indicators');
            if (hasCarousel) {
                initializeGalleryCarousel();
            }
        }, 100);
    });
} else {
    setTimeout(() => {
        const hasCarousel = document.querySelector('.gallery-slide') || document.getElementById('carousel-indicators');
        if (hasCarousel) {
            initializeGalleryCarousel();
        }
    }, 100);
}

// ===========================
// EmailJS Configuration
// ===========================

// Initialize EmailJS with your public key
// IMPORTANT: Replace 'YOUR_PUBLIC_KEY' with your actual EmailJS public key
// Get it from: https://dashboard.emailjs.com/admin/account
const EMAILJS_PUBLIC_KEY = 'tB3W_IO_tAM6wSXw-';
const EMAILJS_SERVICE_ID = 'service_42we7vj';
const EMAILJS_TEMPLATE_ID = 'template_kgkgtf8';

// Initialize EmailJS
if (typeof emailjs !== 'undefined') {
    (function() {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    })();
}

// ===========================
// Booking Form Handler
// ===========================

const bookingForm = document.getElementById('booking-form');

// Format datetime for display
const formatDateTime = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Show loading state
        const submitButton = bookingForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;

        try {
            // Collect all form data
            const formData = new FormData(bookingForm);
            const bookingData = {};
            
            formData.forEach((value, key) => {
                bookingData[key] = value;
            });

            // Format the email parameters
            const emailParams = {
                to_email: 'casperigram@gmail.com',
                from_name: bookingData.name,
                from_email: bookingData.email,
                reply_to: bookingData.email,
                subject: `New Booking Request from ${bookingData.name}`,
                
                // Personal Information
                client_name: bookingData.name,
                client_email: bookingData.email,
                client_phone: bookingData.phone,
                client_pronouns: bookingData.pronouns,
                preferred_contact: bookingData.contact_method,
                
                // Booking Details
                desired_city: bookingData.city,
                date_length: bookingData.date_length.replace(/_/g, ' '),
                preferred_datetime: formatDateTime(bookingData.preferred_datetime),
                location_type: bookingData.location_preference.charAt(0).toUpperCase() + bookingData.location_preference.slice(1),
                additional_info: bookingData.additional_info || 'None provided',
                
                // Formatted message body
                message: `
═══════════════════════════════════════
         NEW BOOKING REQUEST
═══════════════════════════════════════

CLIENT INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${bookingData.name}
Email: ${bookingData.email}
Phone: ${bookingData.phone}
Pronouns: ${bookingData.pronouns}
Preferred Contact: ${bookingData.contact_method}

BOOKING DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Desired City: ${bookingData.city}
Date Length: ${bookingData.date_length.replace(/_/g, ' ')}
Preferred Date/Time: ${formatDateTime(bookingData.preferred_datetime)}
Location Preference: ${bookingData.location_preference.charAt(0).toUpperCase() + bookingData.location_preference.slice(1)}

ADDITIONAL INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${bookingData.additional_info || 'None provided'}

═══════════════════════════════════════
Submitted: ${new Date().toLocaleString('en-US')}
═══════════════════════════════════════
                `
            };

            // Send email via EmailJS
            const response = await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                emailParams
            );

            if (response.status === 200) {
                alert('✅ Thank you for your booking request!\n\nYour information has been received. You will receive a response within 24 hours via your preferred contact method.');
                bookingForm.reset();
            }

        } catch (error) {
            console.error('EmailJS Error:', error);
            
            // User-friendly error messages
            let errorMessage = '❌ Booking Submission Failed\n\n';
            
            if (error.text && error.text.includes('Invalid')) {
                errorMessage += 'EmailJS configuration error. Please contact the site administrator.\n\n';
                errorMessage += 'Alternative: Email your booking to casperigram@gmail.com';
            } else if (!navigator.onLine) {
                errorMessage += 'No internet connection detected.\n\n';
                errorMessage += 'Please check your connection and try again.';
            } else {
                errorMessage += 'Network or service error.\n\n';
                errorMessage += 'Please try again, or email directly to:\ncasperigram@gmail.com';
            }
            
            alert(errorMessage);
        } finally {
            // Restore button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    });
}

// ===========================
// Intersection Observer for Performance
// ===========================

// Lazy load images
const images = document.querySelectorAll('img[src]');

const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.classList.add('loaded');
            observer.unobserve(img);
        }
    });
}, {
    rootMargin: '50px'
});

images.forEach(img => imageObserver.observe(img));

// ===========================
// Parallax Effect on Hero
// ===========================

const hero = document.querySelector('.hero');

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxSpeed = 0.5;
    
    if (hero && scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
    }
});

// ===========================
// Smooth Scroll to Top
// ===========================

// Add a scroll to top button
const createScrollTopButton = () => {
    const button = document.createElement('button');
    button.innerHTML = '↑';
    button.className = 'scroll-top-btn';
    button.setAttribute('aria-label', 'Scroll to top');
    
    button.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: var(--text-light);
        font-size: 1.5rem;
        border: none;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 999;
        box-shadow: 0 4px 15px rgba(45, 27, 61, 0.3);
    `;
    
    document.body.appendChild(button);
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            button.style.opacity = '1';
            button.style.visibility = 'visible';
        } else {
            button.style.opacity = '0';
            button.style.visibility = 'hidden';
        }
    });
    
    // Scroll to top on click
    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
};

createScrollTopButton();

// ===========================
// Loading Animation
// ===========================

window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// ===========================
// Datetime Input Optimization
// ===========================

// Set minimum date to today for datetime-local inputs
const datetimeInput = document.getElementById('preferred_datetime');
if (datetimeInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    datetimeInput.min = minDateTime;
}

// ===========================
// Console Message
// ===========================

console.log('%c Makayla Moon Inc. ', 'background: #2d1b3d; color: #d4af37; font-size: 20px; font-weight: bold; padding: 10px;');
console.log('%c Website designed with ❤️ ', 'background: #f4e5d4; color: #2d1b3d; font-size: 14px; padding: 5px;');
console.log('%c Booking powered by JotForm ', 'background: #d4af37; color: #2d1b3d; font-size: 12px; padding: 5px;');
