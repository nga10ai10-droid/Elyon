/**
 * ELYON - Professional Gym Website
 * JavaScript Application Logic - VERSIÓN CORREGIDA
 * Version: 3.1.0 - Todos los fallos arreglados
 */

'use strict';

// ========================================
// GLOBAL ERROR HANDLING
// ========================================
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

// ========================================
// APPLICATION DATA
// ========================================
const ELYON_APP = {
    products: [
        {
            id: 1,
            name: "Elite Performance Tank",
            price: 34.99,
            currency: "€",
            category: "tank-tops",
            image: "elite-tank.jpg",
            sizes: ["XS", "S", "M", "L", "XL", "XXL"],
            colors: ["Negro", "Azul Marino", "Gris Carbón"],
            description: "Tank top premium con tecnología de absorción y máxima transpirabilidad."
        },
        {
            id: 2,
            name: "Pro Muscle Hoodie",
            price: 64.99,
            currency: "€",
            category: "hoodies",
            image: "pro-hoodie.jpg",
            sizes: ["S", "M", "L", "XL", "XXL"],
            colors: ["Negro", "Azul Oscuro", "Gris Medio"],
            description: "Sudadera profesional con corte atlético y materiales premium."
        },
        {
            id: 3,
            name: "Beast Mode Shorts",
            price: 39.99,
            currency: "€",
            category: "shorts",
            image: "beast-shorts.jpg",
            sizes: ["XS", "S", "M", "L", "XL"],
            colors: ["Negro", "Azul Marino", "Gris Oscuro"],
            description: "Shorts de entrenamiento con tecnología de compresión."
        },
        {
            id: 4,
            name: "Victory Pro T-Shirt",
            price: 29.99,
            currency: "€",
            category: "t-shirts",
            image: "victory-tshirt.jpg",
            sizes: ["XS", "S", "M", "L", "XL", "XXL"],
            colors: ["Blanco", "Negro", "Azul Marino", "Gris"],
            description: "Camiseta técnica con fibras de alto rendimiento."
        },
        {
            id: 5,
            name: "Power Compression Leggings",
            price: 49.99,
            currency: "€",
            category: "leggings",
            image: "power-leggings.jpg",
            sizes: ["XS", "S", "M", "L", "XL"],
            colors: ["Negro", "Azul Profundo", "Gris Carbón"],
            description: "Leggings de compresión profesional con soporte muscular."
        },
        {
            id: 6,
            name: "Alpha Stringer",
            price: 24.99,
            currency: "€",
            category: "tank-tops",
            image: "alpha-stringer.jpg",
            sizes: ["S", "M", "L", "XL", "XXL"],
            colors: ["Negro", "Blanco", "Azul Marino"],
            description: "Stringer ultra-ligero para máxima ventilación."
        }
    ],

    cart: [],

    settings: {
        currency: "€",
        language: "es",
        animations: true,
        notifications: true,
        debug: false
    },

    state: {
        isLoading: false,
        currentFilter: 'all',
        cartOpen: false,
        mobileMenuOpen: false
    }
};

// ========================================
// DOM ELEMENTS MANAGER
// ========================================
const DOM = {
    elements: {},

    init() {
        // Navigation elements
        this.elements.navToggle = document.getElementById('nav-toggle');
        this.elements.navMenu = document.getElementById('nav-menu');
        this.elements.navLinks = document.querySelectorAll('.nav-link');
        this.elements.header = document.getElementById('header');

        // Cart elements
        this.elements.cartButton = document.getElementById('cart-button');
        this.elements.cartCount = document.getElementById('cart-count');
        this.elements.cartModal = document.getElementById('cart-modal');
        this.elements.modalOverlay = document.getElementById('modal-overlay');
        this.elements.modalClose = document.getElementById('modal-close');
        this.elements.cartItems = document.getElementById('cart-items');
        this.elements.cartTotal = document.getElementById('cart-total');
        this.elements.closeCartBtn = document.getElementById('close-cart');
        this.elements.checkoutBtn = document.getElementById('checkout-btn');

        // Product elements
        this.elements.productsGrid = document.getElementById('products-grid');
        this.elements.filterBtns = document.querySelectorAll('.filter-btn');

        // Form elements
        this.elements.contactForm = document.getElementById('contact-form');
        this.elements.newsletterForm = document.getElementById('newsletter-form');

        // Utility elements
        this.elements.loadingScreen = document.getElementById('loading-screen');
        this.elements.backToTop = document.getElementById('back-to-top');
        this.elements.searchBtn = document.getElementById('search-btn');
        this.elements.scrollIndicator = document.querySelector('.hero-scroll-indicator');

        return this;
    },

    get(key) {
        return this.elements[key] || null;
    },

    getAll(selector) {
        return document.querySelectorAll(selector);
    }
};

// ========================================
// UTILITIES
// ========================================
const Utils = {
    formatPrice(price, currency = ELYON_APP.settings.currency) {
        if (typeof price !== 'number') {
            price = parseFloat(price) || 0;
        }
        return `${currency}${price.toFixed(2)}`;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, wait) {
        let timeout;
        let previous = 0;

        return function executedFunction(...args) {
            const now = Date.now();
            const remaining = wait - (now - previous);

            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                func.apply(this, args);
            } else if (!timeout) {
                timeout = setTimeout(() => {
                    previous = Date.now();
                    timeout = null;
                    func.apply(this, args);
                }, remaining);
            }
        };
    },

    // SCROLL FUNCTION COMPLETAMENTE ARREGLADO
    scrollTo(target, offset = 80) {
        return new Promise((resolve, reject) => {
            try {
                let targetElement = null;

                // Handle different input types
                if (typeof target === 'string') {
                    // Try ID first (without #)
                    targetElement = document.getElementById(target);

                    // If not found, try with # selector
                    if (!targetElement) {
                        const selector = target.startsWith('#') ? target : `#${target}`;
                        targetElement = document.querySelector(selector);
                    }
                } else if (target instanceof HTMLElement) {
                    targetElement = target;
                }

                if (!targetElement) {
                    console.warn('Scroll target not found:', target);
                    reject(new Error('Target not found'));
                    return;
                }

                // Calculate position
                const elementPosition = targetElement.offsetTop - offset;

                // Smooth scroll with native API
                window.scrollTo({
                    top: Math.max(0, elementPosition),
                    behavior: 'smooth'
                });

                // Resolve after scroll animation completes
                setTimeout(() => {
                    resolve(targetElement);
                }, 800);

                if (ELYON_APP.settings.debug) {
                    console.log('Scrolling to:', target, 'Position:', elementPosition);
                }

            } catch (error) {
                console.error('Scroll error:', error);

                // Fallback scroll method
                try {
                    const element = typeof target === 'string' 
                        ? document.getElementById(target.replace('#', ''))
                        : target;

                    if (element) {
                        element.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start',
                            inline: 'nearest'
                        });
                        setTimeout(() => resolve(element), 800);
                    } else {
                        reject(error);
                    }
                } catch (fallbackError) {
                    console.error('Fallback scroll error:', fallbackError);
                    reject(fallbackError);
                }
            }
        });
    },

    showNotification(message, type = 'success', duration = 3000) {
        if (!ELYON_APP.settings.notifications) return;

        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="font-size: 1.2rem; flex-shrink: 0;">${icons[type] || icons.info}</span>
                <span style="flex: 1;">${this.sanitizeHTML(message)}</span>
            </div>
        `;

        const colors = {
            success: { border: 'rgba(34, 197, 94, 0.3)', text: '#16a34a' },
            error: { border: 'rgba(239, 68, 68, 0.3)', text: '#dc2626' },
            info: { border: 'rgba(59, 130, 246, 0.3)', text: '#1e40af' },
            warning: { border: 'rgba(245, 158, 11, 0.3)', text: '#d97706' }
        };

        const colorScheme = colors[type] || colors.info;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '100px',
            right: '20px',
            padding: '1rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: `1px solid ${colorScheme.border}`,
            borderRadius: '12px',
            color: colorScheme.text,
            zIndex: '3000',
            transform: 'translateX(120%)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: '500',
            fontSize: '0.95rem',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
            minWidth: '280px',
            maxWidth: '400px',
            wordWrap: 'break-word'
        });

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // Remove after duration
        setTimeout(() => {
            notification.style.transform = 'translateX(120%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, Math.max(duration, 1000));
    },

    sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    // Local storage helpers with error handling
    storage: {
        set(key, value) {
            try {
                const serializedValue = JSON.stringify(value);
                localStorage.setItem(`elyon_${key}`, serializedValue);
                return true;
            } catch (error) {
                console.error('LocalStorage set error:', error);
                return false;
            }
        },

        get(key) {
            try {
                const item = localStorage.getItem(`elyon_${key}`);
                return item ? JSON.parse(item) : null;
            } catch (error) {
                console.error('LocalStorage get error:', error);
                return null;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(`elyon_${key}`);
                return true;
            } catch (error) {
                console.error('LocalStorage remove error:', error);
                return false;
            }
        }
    }
};

// ========================================
// CART FUNCTIONALITY - ARREGLADO
// ========================================
const Cart = {
    add(productId, size = 'M', color = 'Negro', quantity = 1) {
        try {
            const product = ELYON_APP.products.find(p => p.id === parseInt(productId));
            if (!product) {
                Utils.showNotification('Producto no encontrado', 'error');
                return false;
            }

            quantity = Math.max(1, parseInt(quantity) || 1);

            const existingItem = ELYON_APP.cart.find(item => 
                item.id === product.id && item.size === size && item.color === color
            );

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                ELYON_APP.cart.push({
                    ...product,
                    size,
                    color,
                    quantity,
                    cartId: Utils.generateId(),
                    addedAt: Date.now()
                });
            }

            this.update();
            this.save();
            this.animateCartIcon();
            Utils.showNotification(`${product.name} añadido al carrito`);

            return true;
        } catch (error) {
            console.error('Cart add error:', error);
            Utils.showNotification('Error al añadir producto', 'error');
            return false;
        }
    },

    animateCartIcon() {
        const cartButton = DOM.get('cartButton');
        const cartCount = DOM.get('cartCount');

        if (cartButton) {
            cartButton.style.transform = 'scale(1.15)';
            setTimeout(() => {
                if (cartButton) {
                    cartButton.style.transform = '';
                }
            }, 200);
        }

        if (cartCount) {
            cartCount.style.animation = 'none';
            requestAnimationFrame(() => {
                if (cartCount) {
                    cartCount.style.animation = 'pulse 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                }
            });
        }
    },

    remove(cartId) {
        try {
            const index = ELYON_APP.cart.findIndex(item => item.cartId === cartId);
            if (index > -1) {
                const item = ELYON_APP.cart[index];
                ELYON_APP.cart.splice(index, 1);
                this.update();
                this.save();
                Utils.showNotification(`${item.name} eliminado del carrito`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Cart remove error:', error);
            return false;
        }
    },

    updateQuantity(cartId, quantity) {
        try {
            const item = ELYON_APP.cart.find(item => item.cartId === cartId);
            if (!item) return false;

            quantity = parseInt(quantity) || 0;

            if (quantity <= 0) {
                return this.remove(cartId);
            } else {
                item.quantity = Math.min(quantity, 99);
                this.update();
                this.save();
                return true;
            }
        } catch (error) {
            console.error('Cart update error:', error);
            return false;
        }
    },

    clear() {
        try {
            ELYON_APP.cart = [];
            this.update();
            this.save();
            Utils.showNotification('Carrito vaciado', 'info');
            return true;
        } catch (error) {
            console.error('Cart clear error:', error);
            return false;
        }
    },

    getTotal() {
        return ELYON_APP.cart.reduce((total, item) => {
            return total + (parseFloat(item.price) * parseInt(item.quantity));
        }, 0);
    },

    getCount() {
        return ELYON_APP.cart.reduce((count, item) => {
            return count + parseInt(item.quantity);
        }, 0);
    },

    update() {
        try {
            const count = this.getCount();
            const total = this.getTotal();

            const cartCount = DOM.get('cartCount');
            const cartTotal = DOM.get('cartTotal');

            if (cartCount) {
                cartCount.textContent = count;
                cartCount.style.display = count > 0 ? 'flex' : 'none';
            }

            if (cartTotal) {
                cartTotal.textContent = Utils.formatPrice(total);
            }

            this.renderItems();

        } catch (error) {
            console.error('Cart update error:', error);
        }
    },

    renderItems() {
        const cartItems = DOM.get('cartItems');
        if (!cartItems) return;

        try {
            if (ELYON_APP.cart.length === 0) {
                cartItems.innerHTML = `
                    <div class="cart-empty">
                        <div style="font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.5;">🛒</div>
                        <p>Tu carrito está vacío</p>
                        <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 2rem;">Descubre nuestra colección profesional</p>
                        <button class="btn btn--primary" onclick="Cart.close(); Utils.scrollTo('productos')">
                            VER PRODUCTOS
                        </button>
                    </div>
                `;
                return;
            }

            cartItems.innerHTML = ELYON_APP.cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${Utils.sanitizeHTML(item.name)}</h4>
                        <p>Talla: ${Utils.sanitizeHTML(item.size)} | Color: ${Utils.sanitizeHTML(item.color)}</p>
                        <span class="cart-item-price">${Utils.formatPrice(item.price)}</span>
                    </div>
                    <div class="cart-item-controls">
                        <div class="quantity-controls">
                            <button onclick="Cart.updateQuantity('${item.cartId}', ${item.quantity - 1})" 
                                    class="quantity-btn" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button onclick="Cart.updateQuantity('${item.cartId}', ${item.quantity + 1})" 
                                    class="quantity-btn">+</button>
                        </div>
                        <button onclick="Cart.remove('${item.cartId}')" 
                                class="remove-btn" 
                                title="Eliminar producto">&times;</button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Cart render error:', error);
            cartItems.innerHTML = '<div class="cart-empty"><p>Error al cargar el carrito</p></div>';
        }
    },

    save() {
        return Utils.storage.set('cart', ELYON_APP.cart);
    },

    load() {
        try {
            const savedCart = Utils.storage.get('cart');
            if (savedCart && Array.isArray(savedCart)) {
                ELYON_APP.cart = savedCart.filter(item => {
                    return item && item.id && item.name && item.price && item.quantity > 0;
                });
                this.update();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Cart load error:', error);
            return false;
        }
    },

    open() {
        const cartModal = DOM.get('cartModal');
        const modalOverlay = DOM.get('modalOverlay');

        if (!cartModal || !modalOverlay) return;

        try {
            ELYON_APP.state.cartOpen = true;
            modalOverlay.classList.add('active');
            cartModal.classList.add('active');
            document.body.classList.add('modal-open');

            const modalClose = DOM.get('modalClose');
            if (modalClose) {
                setTimeout(() => modalClose.focus(), 100);
            }

        } catch (error) {
            console.error('Cart open error:', error);
        }
    },

    close() {
        const cartModal = DOM.get('cartModal');
        const modalOverlay = DOM.get('modalOverlay');

        if (!cartModal || !modalOverlay) return;

        try {
            ELYON_APP.state.cartOpen = false;
            modalOverlay.classList.remove('active');
            cartModal.classList.remove('active');
            document.body.classList.remove('modal-open');

            const cartButton = DOM.get('cartButton');
            if (cartButton) {
                cartButton.focus();
            }

        } catch (error) {
            console.error('Cart close error:', error);
        }
    }
};

// ========================================
// PRODUCTS FUNCTIONALITY - ARREGLADO
// ========================================
const Products = {
    renderAll() {
        ELYON_APP.state.currentFilter = 'all';
        this.render(ELYON_APP.products);
    },

    renderByCategory(category) {
        ELYON_APP.state.currentFilter = category;
        if (category === 'all') {
            this.renderAll();
        } else {
            const filtered = ELYON_APP.products.filter(product => product.category === category);
            this.render(filtered);
        }
    },

    render(products) {
        const productsGrid = DOM.get('productsGrid');
        if (!productsGrid) return;

        try {
            if (!Array.isArray(products) || products.length === 0) {
                productsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                        <p style="color: #64748b; font-size: 1.1rem;">No se encontraron productos</p>
                    </div>
                `;
                return;
            }

            productsGrid.innerHTML = products.map(product => `
                <div class="product-card glass-card" data-category="${product.category}">
                    <div class="product-image">
                        <div class="product-badge">ELYON</div>
                        <div class="product-pro-badge" style="position: absolute; top: 1rem; right: 1rem; background: rgba(59, 130, 246, 0.1); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 8px; padding: 0.4rem 0.8rem; font-size: 0.75rem; color: #1e40af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">PRO</div>
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${Utils.sanitizeHTML(product.name)}</h3>
                        <p class="product-category">${this.getCategoryName(product.category)}</p>
                        <div class="product-price">${Utils.formatPrice(product.price)}</div>
                        <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.5;">${Utils.sanitizeHTML(product.description)}</p>
                        <div class="product-options">
                            <select class="size-select" id="size-${product.id}">
                                ${product.sizes.map(size => 
                                    `<option value="${Utils.sanitizeHTML(size)}">${Utils.sanitizeHTML(size)}</option>`
                                ).join('')}
                            </select>
                            <select class="color-select" id="color-${product.id}">
                                ${product.colors.map(color => 
                                    `<option value="${Utils.sanitizeHTML(color)}">${Utils.sanitizeHTML(color)}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <button class="add-to-cart" onclick="Products.addToCart(${product.id})" data-product-id="${product.id}">
                            AÑADIR AL CARRITO
                        </button>
                    </div>
                </div>
            `).join('');

            // Add staggered animation
            if (ELYON_APP.settings.animations) {
                const cards = productsGrid.querySelectorAll('.product-card');
                cards.forEach((card, index) => {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(30px)';
                    setTimeout(() => {
                        card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, index * 100);
                });
            }

        } catch (error) {
            console.error('Products render error:', error);
            productsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem;"><p style="color: #dc2626;">Error al cargar productos</p></div>';
        }
    },

    getCategoryName(category) {
        const categoryNames = {
            'tank-tops': 'Tank Tops Profesionales',
            'hoodies': 'Sudaderas Premium',
            'shorts': 'Shorts de Entrenamiento',
            't-shirts': 'Camisetas Técnicas',
            'leggings': 'Leggings de Compresión'
        };
        return categoryNames[category] || category;
    },

    addToCart(productId) {
        try {
            const sizeSelect = document.getElementById(`size-${productId}`);
            const colorSelect = document.getElementById(`color-${productId}`);
            const button = document.querySelector(`button[data-product-id="${productId}"]`);

            if (!button) {
                console.error('Button not found for product:', productId);
                return false;
            }

            const size = sizeSelect ? sizeSelect.value : 'M';
            const color = colorSelect ? colorSelect.value : 'Negro';

            const originalText = button.innerHTML;
            button.innerHTML = 'AÑADIENDO...';
            button.disabled = true;

            const success = Cart.add(productId, size, color);

            if (success) {
                button.innerHTML = '✓ AÑADIDO';
                button.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';

                setTimeout(() => {
                    if (button) {
                        button.innerHTML = originalText;
                        button.style.background = '';
                        button.disabled = false;
                    }
                }, 2000);
            } else {
                button.innerHTML = originalText;
                button.disabled = false;
            }

            return success;

        } catch (error) {
            console.error('Add to cart error:', error);
            return false;
        }
    }
};

// ========================================
// NAVIGATION - ARREGLADO
// ========================================
const Navigation = {
    init() {
        this.bindEvents();
        this.initScrollEffects();
        this.updateActiveLink();
    },

    bindEvents() {
        try {
            const navToggle = DOM.get('navToggle');
            const navMenu = DOM.get('navMenu');
            const navLinks = DOM.get('navLinks');
            const scrollIndicator = DOM.get('scrollIndicator');

            // Mobile menu toggle
            if (navToggle && navMenu) {
                navToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
            }

            // Navigation links
            if (navLinks) {
                navLinks.forEach(link => {
                    link.addEventListener('click', this.handleNavClick.bind(this));
                });
            }

            // Scroll indicator
            if (scrollIndicator) {
                scrollIndicator.addEventListener('click', () => {
                    Utils.scrollTo('caracteristicas').catch(console.error);
                });
            }

            // Close mobile menu on outside click
            document.addEventListener('click', (e) => {
                if (ELYON_APP.state.mobileMenuOpen && 
                    !navMenu?.contains(e.target) && 
                    !navToggle?.contains(e.target)) {
                    this.closeMobileMenu();
                }
            });

            // Keyboard handlers
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (ELYON_APP.state.mobileMenuOpen) {
                        this.closeMobileMenu();
                    }
                    if (ELYON_APP.state.cartOpen) {
                        Cart.close();
                    }
                }
            });

        } catch (error) {
            console.error('Navigation bind error:', error);
        }
    },

    toggleMobileMenu() {
        if (ELYON_APP.state.mobileMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    },

    openMobileMenu() {
        const navToggle = DOM.get('navToggle');
        const navMenu = DOM.get('navMenu');

        if (!navToggle || !navMenu) return;

        ELYON_APP.state.mobileMenuOpen = true;
        navToggle.classList.add('active');
        navMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeMobileMenu() {
        const navToggle = DOM.get('navToggle');
        const navMenu = DOM.get('navMenu');

        if (!navToggle || !navMenu) return;

        ELYON_APP.state.mobileMenuOpen = false;
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
    },

    handleNavClick(e) {
        const link = e.currentTarget;
        const href = link.getAttribute('href');

        if (href && href.startsWith('#')) {
            e.preventDefault();

            this.closeMobileMenu();

            const sectionId = href.substring(1);
            Utils.scrollTo(sectionId)
                .then(() => {
                    if (history.pushState) {
                        history.pushState(null, null, href);
                    }
                })
                .catch(console.error);
        }
    },

    initScrollEffects() {
        const handleScroll = Utils.throttle(this.handleScroll.bind(this), 16);
        window.addEventListener('scroll', handleScroll, { passive: true });
        this.handleScroll();
    },

    handleScroll() {
        try {
            const scrollY = window.scrollY;
            const header = DOM.get('header');
            const backToTop = DOM.get('backToTop');

            // Header scroll effect
            if (header) {
                if (scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            }

            // Back to top button
            if (backToTop) {
                if (scrollY > 300) {
                    backToTop.classList.add('visible');
                } else {
                    backToTop.classList.remove('visible');
                }
            }

            this.updateActiveLink();

        } catch (error) {
            console.error('Scroll handler error:', error);
        }
    },

    updateActiveLink: Utils.debounce(function() {
        const navLinks = DOM.get('navLinks');
        if (!navLinks) return;

        try {
            const sections = document.querySelectorAll('section[id]');
            let current = '';

            sections.forEach(section => {
                if (!section.id) return;

                const rect = section.getBoundingClientRect();
                const sectionTop = rect.top + window.scrollY - 150;
                const sectionHeight = section.offsetHeight;

                if (window.scrollY >= sectionTop && 
                    window.scrollY < sectionTop + sectionHeight) {
                    current = section.id;
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                const href = link.getAttribute('href');
                if (href === `#${current}`) {
                    link.classList.add('active');
                }
            });

        } catch (error) {
            console.error('Update active link error:', error);
        }
    }, 100)
};

// ========================================
// FORMS FUNCTIONALITY
// ========================================
const Forms = {
    init() {
        this.bindContactForm();
        this.bindNewsletterForm();
        this.initInputEffects();
    },

    initInputEffects() {
        const inputs = document.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            input.addEventListener('focus', (e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            });

            input.addEventListener('blur', (e) => {
                e.target.style.borderColor = 'rgba(203, 213, 225, 0.5)';
                e.target.style.boxShadow = '';
            });
        });
    },

    bindContactForm() {
        const contactForm = DOM.get('contactForm');
        if (!contactForm) return;

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);

            if (!data.name || !data.email || !data.message) {
                Utils.showNotification('Por favor, completa todos los campos requeridos', 'error');
                return;
            }

            if (!this.validateEmail(data.email)) {
                Utils.showNotification('Por favor, introduce un email válido', 'error');
                return;
            }

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            if (!submitBtn) return;

            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = 'ENVIANDO...';
            submitBtn.disabled = true;

            setTimeout(() => {
                Utils.showNotification('Mensaje enviado correctamente. Te contactaremos pronto.', 'success');
                contactForm.reset();

                submitBtn.innerHTML = '✓ ENVIADO';

                setTimeout(() => {
                    if (submitBtn) {
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }
                }, 2000);
            }, 1500);
        });
    },

    bindNewsletterForm() {
        const newsletterForm = DOM.get('newsletterForm');
        if (!newsletterForm) return;

        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const emailInput = newsletterForm.querySelector('input[type="email"]');
            if (!emailInput) return;

            const email = emailInput.value.trim();

            if (!email) {
                Utils.showNotification('Por favor, introduce tu email', 'error');
                return;
            }

            if (!this.validateEmail(email)) {
                Utils.showNotification('Por favor, introduce un email válido', 'error');
                return;
            }

            const submitBtn = newsletterForm.querySelector('button[type="submit"]');
            if (!submitBtn) return;

            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = 'SUSCRIBIENDO...';
            submitBtn.disabled = true;

            setTimeout(() => {
                Utils.showNotification('¡Gracias por suscribirte a nuestro newsletter!', 'success');
                newsletterForm.reset();

                submitBtn.innerHTML = '✓ SUSCRITO';

                setTimeout(() => {
                    if (submitBtn) {
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }
                }, 2000);
            }, 1000);
        });
    },

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email.toLowerCase().trim());
    }
};

// ========================================
// GLOBAL FUNCTIONS
// ========================================
window.scrollToSection = function(sectionId) {
    Utils.scrollTo(sectionId).catch(console.error);
};

window.Cart = Cart;
window.Products = Products;
window.Utils = Utils;

// ========================================
// APPLICATION CLASS - ARREGLADO
// ========================================
class ElyonApp {
    constructor() {
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    start() {
        try {
            console.log('🏋️ ELYON Professional Gym App Starting...');

            // Initialize DOM
            DOM.init();

            // Hide loading screen
            this.hideLoadingScreen();

            // Initialize modules
            Navigation.init();
            Forms.init();

            // Load cart from storage
            Cart.load();

            // Render products
            Products.renderAll();

            // Bind global events
            this.bindGlobalEvents();

            // Initialize product filters
            this.initProductFilters();

            console.log('✅ ELYON Professional Gym App Ready!');

        } catch (error) {
            console.error('App initialization error:', error);
            Utils.showNotification('Error al inicializar la aplicación', 'error');
        }
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = DOM.get('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        }, 1500);
    }

    bindGlobalEvents() {
        try {
            // Cart events
            const cartButton = DOM.get('cartButton');
            const modalClose = DOM.get('modalClose');
            const closeCartBtn = DOM.get('closeCartBtn');
            const modalOverlay = DOM.get('modalOverlay');
            const backToTop = DOM.get('backToTop');
            const checkoutBtn = DOM.get('checkoutBtn');
            const searchBtn = DOM.get('searchBtn');

            if (cartButton) {
                cartButton.addEventListener('click', Cart.open.bind(Cart));
            }

            if (modalClose) {
                modalClose.addEventListener('click', Cart.close.bind(Cart));
            }

            if (closeCartBtn) {
                closeCartBtn.addEventListener('click', Cart.close.bind(Cart));
            }

            if (modalOverlay) {
                modalOverlay.addEventListener('click', (e) => {
                    if (e.target === modalOverlay) {
                        Cart.close();
                    }
                });
            }

            if (backToTop) {
                backToTop.addEventListener('click', () => {
                    window.scrollTo({ 
                        top: 0, 
                        behavior: 'smooth' 
                    });
                });
            }

            if (checkoutBtn) {
                checkoutBtn.addEventListener('click', this.handleCheckout.bind(this));
            }

            if (searchBtn) {
                searchBtn.addEventListener('click', this.handleSearch.bind(this));
            }

        } catch (error) {
            console.error('Global events bind error:', error);
        }
    }

    handleCheckout() {
        if (ELYON_APP.cart.length === 0) {
            Utils.showNotification('Tu carrito está vacío', 'error');
            return;
        }

        Utils.showNotification('Funcionalidad de checkout en desarrollo', 'info');
    }

    handleSearch() {
        Utils.showNotification('Función de búsqueda en desarrollo', 'info');
    }

    initProductFilters() {
        const filterBtns = DOM.get('filterBtns');
        if (!filterBtns) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                try {
                    // Update active filter button
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const filter = btn.getAttribute('data-filter');
                    const productsGrid = DOM.get('productsGrid');

                    if (productsGrid) {
                        productsGrid.style.opacity = '0.7';
                        productsGrid.style.pointerEvents = 'none';
                    }

                    setTimeout(() => {
                        Products.renderByCategory(filter);

                        if (productsGrid) {
                            productsGrid.style.opacity = '1';
                            productsGrid.style.pointerEvents = '';
                        }
                    }, 150);

                } catch (error) {
                    console.error('Filter error:', error);
                }
            });
        });
    }
}

// ========================================
// INITIALIZE APPLICATION
// ========================================
const app = new ElyonApp();

// Add required CSS for animations
const requiredStyles = document.createElement('style');
requiredStyles.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
    }

    .modal-open {
        overflow: hidden !important;
    }
`;
document.head.appendChild(requiredStyles);

// Export for debugging
if (ELYON_APP.settings.debug) {
    window.ELYON_DEBUG = {
        app: ELYON_APP,
        dom: DOM,
        utils: Utils,
        cart: Cart,
        products: Products,
        navigation: Navigation,
        forms: Forms
    };
}

console.log('✅ ELYON Professional Gym JavaScript loaded successfully!');