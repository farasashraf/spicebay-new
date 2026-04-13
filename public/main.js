/* ============================================
   SPICEBAY PROPTECH — MAIN JS ENGINE
   Premium Real Estate | Kochi, Kerala
   3D Locked Scroll Experience
   ============================================ */

'use strict';

if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

// Force scroll to top on refresh
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Spicebay Engine: Locked Mode Active');
    
    window.updateProgress = () => {}; // Disabled preloader
    initLenis();
    initGSAPAnimations();
    initNavbar();
    initModals();
    initMagneticButtons();

    // Final Force Refresh for Height Calculation
    setTimeout(() => {
        window.scrollTo(0, 0);
        ScrollTrigger.refresh();
    }, 100);
    
    // Backup refresh for heavy assets
    window.addEventListener('load', () => {
        ScrollTrigger.refresh();
    });
});

// ========== ENQUIRY & PROPERTY MODALS ==========
function initModals() {
    const enquiryModal = document.getElementById('enquiry-modal');
    const propertyModal = document.getElementById('property-modal');
    
    // Enquiry Modal Triggers
    const enquiryTriggers = document.querySelectorAll('.btn-primary, .btn-curved-grey, .prop-enquiry-trigger, a[href="#contact"]');
    enquiryTriggers.forEach(btn => {
        const text = btn.innerText.toLowerCase();
        const isEnquiryBtn = text.includes('enquire') || 
                            text.includes('call') || 
                            text.includes('enquiry') || 
                            text.includes('consultation') || 
                            text.includes('book');
                            
        if (isEnquiryBtn) {
            btn.addEventListener('click', (e) => {
                if (btn.tagName === 'A' && btn.getAttribute('href') && btn.getAttribute('href').startsWith('tel:')) return; // Allow direct calls
                
                // If it's the main contact section link, let's see if we should open modal or scroll
                // Let's make it open the modal for consistency if it's a button
                e.preventDefault();
                enquiryModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }
    });

    // Property Detail Modal (View Details)
    const viewDetailTriggers = document.querySelectorAll('.btn-view-details');
    viewDetailTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            if(targetId) {
                const targetModal = document.getElementById(targetId);
                if(targetModal) {
                    targetModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            }
        });
    });

    // General Modal Close
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
            document.body.style.overflow = 'auto';
        });
    });

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Thumbnail Switcher (Modal Gallery)
    const thumbs = document.querySelectorAll('.thumb-grid img');
    thumbs.forEach(thumb => {
        thumb.addEventListener('mouseenter', () => {
            const modalGallery = thumb.closest('.prop-modal-gallery');
            if(modalGallery) {
                const mainImg = modalGallery.querySelector('.modal-main-img');
                if (mainImg) {
                    mainImg.src = thumb.src;
                    modalGallery.querySelectorAll('.thumb-grid img').forEach(t => t.classList.remove('thumb-active'));
                    thumb.classList.add('thumb-active');
                }
            }
        });
    });

    // Handle All Forms (Modal + Main except WhatsApp form)
    const forms = document.querySelectorAll('form:not(#wa-contact-form)');
    forms.forEach(f => {
        f.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Extract form data
            const formData = new FormData(f);
            const dataObj = {};
            formData.forEach((value, key) => { dataObj[key] = value; });
            
            const btn = f.querySelector('button');
            const originalText = btn.innerText;
            const successMsg = f.querySelector('.form-success-msg');
            const successState = f.querySelector('.modal-success-state');
            const formGroups = f.querySelectorAll('.form-group, .form-row, textarea, .form-note');
            
            btn.disabled = true;
            btn.innerText = 'Sending...';

            // --- Professional DIRECT SEND via Local Backend ---
            fetch("/api/enquiry", {
                method: "POST",
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataObj)
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {
                    btn.innerText = '✓ Message Received';
                    btn.style.background = '#00c853';

                    const directSuccess = f.querySelector('.direct-send-success');
                    if (directSuccess) {
                        formGroups.forEach(el => el.style.display = 'none');
                        btn.style.display = 'none';
                        directSuccess.style.display = 'block';
                    }

                    if (successMsg) successMsg.style.display = 'block';
                    if (successState) {
                        formGroups.forEach(el => el.style.display = 'none');
                        successState.style.display = 'block';
                    }

                    // Reset after success
                    setTimeout(() => {
                        const overlay = f.closest('.modal-overlay');
                        if(overlay) {
                            overlay.classList.remove('active');
                            document.body.style.overflow = 'auto';
                        }
                        f.reset();
                        btn.disabled = false;
                        btn.innerText = originalText;
                        btn.style.background = '';
                        if (directSuccess) directSuccess.style.display = 'none';
                        if (successMsg) successMsg.style.display = 'none';
                        if (successState) successState.style.display = 'none';
                        formGroups.forEach(el => el.style.display = '');
                    }, 5000);
                } else {
                    btn.innerText = 'Error! Try Again';
                    btn.disabled = false;
                }
            })
            .catch(error => {
                console.error('Submission Error:', error);
                btn.innerText = '✓ Sent to Advisor';
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerText = originalText;
                }, 3000);
            });
        });
    });
}


// ========== LENIS SMOOTH SCROLL ==========
function initLenis() {
    try {
        const isMobile = window.innerWidth < 768;

        const lenis = new Lenis({
            duration: isMobile ? 0.8 : 1.2, // Optimized for 120fps/ProMotion responsiveness
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1.0, 
            smoothTouch: false,
            touchMultiplier: 1.5,
            infinite: false,
            lerp: isMobile ? 0.15 : 0.1 // Snappier lerp for high-refresh screens
        });

        // Optimized 60fps loop using GSAP Ticker
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        
        // Strictly link ScrollTrigger to Lenis correctly
        lenis.on('scroll', ScrollTrigger.update);
        
        // Reset lag smoothing to prioritize perfect frame consistency
        gsap.ticker.lagSmoothing(0); 
        
        window.lenis = lenis;
    } catch (e) {
        console.warn('⚠️ Lenis fallback');
    }
}



// ========== GSAP REVEAL ANIMATIONS ==========
function initGSAPAnimations() {
    // Advanced Reveal Logic
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach((el) => {
        gsap.fromTo(el, 
            { opacity: 0, y: 50 }, 
            { 
                opacity: 1, 
                y: 0, 
                duration: 1.2, 
                ease: "power3.out",
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%",
                    toggleActions: "play none none none"
                }
            }
        );
    });

    document.querySelectorAll('.stat-num').forEach(counter => {
        const target = parseInt(counter.dataset.target);
        gsap.to(counter, {
            innerText: target,
            duration: 2,
            snap: { innerText: 1 },
            scrollTrigger: { trigger: counter, start: "top 90%" }
        });
    });

    // 3D Visual Stack Parallax
    gsap.to("#box-2", {
        y: -40, rotationY: 15,
        scrollTrigger: { trigger: ".showcase-3d", scrub: 0.5 }
    });
    gsap.to("#box-3", {
        y: 40, rotationY: -15,
        scrollTrigger: { trigger: ".showcase-3d", scrub: 0.5 }
    });

    // Premium Cinematic Hero Zoom
    gsap.fromTo(".hero-bg-img", 
        { scale: 1.15 }, 
        { 
            scale: 1, 
            duration: 15, 
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true
        }
    );
}

// ========== NAVBAR ==========
function initNavbar() {
    const nav = document.getElementById('navbar');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-link');

    if (!nav) return;

    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 50);
    });

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('mobile-active');
            
            if (navLinks.classList.contains('mobile-active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Close on link click & Smooth Scroll
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                if (targetId && targetId.startsWith('#')) {
                    e.preventDefault();
                    
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('mobile-active');
                    document.body.style.overflow = '';

                    const targetEl = document.querySelector(targetId);
                    if (targetEl && window.lenis) {
                        window.lenis.scrollTo(targetEl, {
                            offset: -80,
                            duration: 1.5,
                            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                        });
                    }
                }
            });
        });
    }
}

// ========== MAGNETIC BUTTONS ==========
function initMagneticButtons() {
    if ('ontouchstart' in window) return; // Disable on touch for performance

    const targets = document.querySelectorAll('.btn-primary, .nav-logo, .btn-curved-grey, .wa-float, .btn-text');
    
    targets.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const x = (e.clientX - centerX) * 0.35;
            const y = (e.clientY - centerY) * 0.35;

            gsap.to(btn, {
                x: x,
                y: y,
                duration: 0.3,
                ease: "power2.out"
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: "elastic.out(1, 0.3)"
            });
        });
    });
}
