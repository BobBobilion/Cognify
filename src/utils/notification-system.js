// Custom Notification System
// A comprehensive notification system with toast notifications and modal dialogs

console.log('🔔 NOTIFICATION SYSTEM SCRIPT LOADING FROM:', window.location.href);
console.log('🔔 Loading notification system...');

class NotificationSystem {
    constructor() {
        console.log('🔔 Initializing NotificationSystem...');
        this.notifications = [];
        this.activeModal = null;
        this.initialized = false;
        this.injectCSS();
        this.initialized = true;
        console.log('✅ NotificationSystem initialized successfully');
    }

    // Inject CSS styles for the notification system
    injectCSS() {
        console.log('🎨 Injecting CSS styles...');
        const style = document.createElement('style');
        style.id = 'notification-system-styles';
        style.textContent = `
            /* Notification System Styles */
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                pointer-events: none;
            }

            .notification {
                background: var(--bg-primary, #ffffff);
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 12px;
                box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
                pointer-events: auto;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s ease;
                display: flex;
                align-items: flex-start;
                gap: 12px;
                max-width: 380px;
                word-wrap: break-word;
            }

            .notification.show {
                transform: translateX(0);
                opacity: 1;
            }

            .notification.success {
                border-left: 4px solid var(--accent-green, #10b981);
            }

            .notification.error {
                border-left: 4px solid var(--danger-color, #ef4444);
            }

            .notification.warning {
                border-left: 4px solid var(--accent-orange, #f59e0b);
            }

            .notification.info {
                border-left: 4px solid var(--accent-blue, #3b82f6);
            }

            .notification-icon {
                width: 20px;
                height: 20px;
                flex-shrink: 0;
                margin-top: 2px;
            }

            .notification-content {
                flex: 1;
                min-width: 0;
            }

            .notification-title {
                font-size: 0.875rem;
                font-weight: 600;
                color: var(--text-primary, #1e293b);
                margin: 0 0 4px 0;
                line-height: 1.4;
            }

            .notification-message {
                font-size: 0.8rem;
                color: var(--text-secondary, #64748b);
                margin: 0;
                line-height: 1.4;
                white-space: pre-wrap;
            }

            .notification-close {
                background: none;
                border: none;
                color: var(--text-tertiary, #94a3b8);
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }

            .notification-close:hover {
                background: var(--bg-secondary, #f8fafc);
                color: var(--text-primary, #1e293b);
            }

            /* Modal Overlay */
            .modal-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: rgba(0, 0, 0, 0.5) !important;
                backdrop-filter: blur(4px);
                z-index: 50000 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 20px;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
                pointer-events: none;
            }

            .modal-overlay.show {
                opacity: 1 !important;
                visibility: visible !important;
                pointer-events: auto !important;
            }

            .modal-content {
                background: var(--bg-primary, #ffffff);
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 16px;
                padding: 0;
                max-width: 500px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }

            .modal-overlay.show .modal-content {
                transform: scale(1);
            }

            .modal-header {
                padding: 24px 24px 16px;
                border-bottom: 1px solid var(--border-color, #e2e8f0);
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .modal-header-icon {
                width: 24px;
                height: 24px;
                flex-shrink: 0;
            }

            .modal-title {
                font-size: 1.125rem;
                font-weight: 600;
                color: var(--text-primary, #1e293b);
                margin: 0;
                flex: 1;
            }

            .modal-body {
                padding: 16px 24px;
            }

            .modal-message {
                font-size: 0.875rem;
                color: var(--text-secondary, #64748b);
                line-height: 1.5;
                margin: 0;
                white-space: pre-wrap;
            }

            .modal-footer {
                padding: 16px 24px 24px;
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            }

            .modal-btn {
                padding: 8px 16px;
                font-size: 0.875rem;
                font-weight: 500;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 1px solid var(--border-color, #e2e8f0);
                background: var(--bg-secondary, #f8fafc);
                color: var(--text-primary, #1e293b);
            }

            .modal-btn:hover {
                background: var(--bg-tertiary, #f1f5f9);
                transform: translateY(-1px);
            }

            .modal-btn.primary {
                background: var(--accent-blue, #3b82f6);
                border-color: var(--accent-blue, #3b82f6);
                color: white;
            }

            .modal-btn.primary:hover {
                background: var(--accent-blue-hover, #2563eb);
                border-color: var(--accent-blue-hover, #2563eb);
            }

            .modal-btn.danger {
                background: var(--danger-color, #ef4444);
                border-color: var(--danger-color, #ef4444);
                color: white;
            }

            .modal-btn.danger:hover {
                background: var(--danger-hover, #dc2626);
                border-color: var(--danger-hover, #dc2626);
            }

            .modal-btn.success {
                background: var(--success-color, #10b981);
                border-color: var(--success-color, #10b981);
                color: white;
            }

            .modal-btn.success:hover {
                background: var(--success-hover, #059669);
                border-color: var(--success-hover, #059669);
            }

            /* Dark theme adjustments */
            [data-theme="dark"] .modal-overlay {
                background: rgba(0, 0, 0, 0.7);
            }

            /* Animations */
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes fadeOut {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }

            @keyframes scaleIn {
                from {
                    transform: scale(0.9);
                    opacity: 0;
                }
                to {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            @keyframes scaleOut {
                from {
                    transform: scale(1);
                    opacity: 1;
                }
                to {
                    transform: scale(0.9);
                    opacity: 0;
                }
            }
        `;
        
        document.head.appendChild(style);
        console.log('✅ CSS styles injected successfully');
    }

    // Create notification container if it doesn't exist
    ensureContainer() {
        let container = document.querySelector('.notification-container');
        if (!container) {
            console.log('📦 Creating notification container...');
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
            console.log('✅ Notification container created');
        }
        return container;
    }

    // Show toast notification
    showNotification(message, type = 'info', options = {}) {
        console.log(`🔔 Showing ${type} notification:`, message);
        
        if (!this.initialized) {
            console.error('❌ Notification system not initialized');
            return null;
        }

        const {
            title = this.getDefaultTitle(type),
            duration = 5000,
            closable = true
        } = options;

        const container = this.ensureContainer();
        const notificationId = Date.now().toString();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.dataset.id = notificationId;
        
        notification.innerHTML = `
            <div class="notification-icon">
                ${this.getIcon(type)}
            </div>
            <div class="notification-content">
                ${title ? `<div class="notification-title">${title}</div>` : ''}
                <div class="notification-message">${message}</div>
            </div>
            ${closable ? `
                <button class="notification-close" onclick="window.notificationSystem.closeNotification('${notificationId}')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            ` : ''}
        `;

        container.appendChild(notification);
        console.log('📝 Notification element created and added to DOM');
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
            console.log('✨ Notification animation triggered');
        }, 10);

        // Auto-close after duration
        if (duration > 0) {
            setTimeout(() => {
                this.closeNotification(notificationId);
            }, duration);
        }

        this.notifications.push({
            id: notificationId,
            element: notification,
            type,
            message,
            title
        });

        console.log(`✅ Notification created with ID: ${notificationId}`);
        return notificationId;
    }

    // Close specific notification
    closeNotification(id) {
        console.log(`🗑️ Closing notification: ${id}`);
        const notification = document.querySelector(`[data-id="${id}"]`);
        if (notification) {
            notification.classList.remove('show');
            setTimeout(() => {
                // Check if notification still exists before removing
                if (notification && notification.parentNode) {
                    notification.remove();
                }
                this.notifications = this.notifications.filter(n => n.id !== id);
                console.log(`✅ Notification ${id} removed`);
            }, 300);
        } else {
            // Silently handle already-closed notifications
            console.log(`💭 Notification ${id} already closed or doesn't exist`);
            // Still clean up the notifications array
            this.notifications = this.notifications.filter(n => n.id !== id);
        }
    }

    // Show confirmation dialog
    showConfirmDialog(message, options = {}) {
        console.log('💬 Showing confirmation dialog:', message);
        
        return new Promise((resolve) => {
            try {
                const {
                    title = 'Confirm Action',
                    confirmText = 'Confirm',
                    cancelText = 'Cancel',
                    type = 'warning',
                    confirmType = 'danger'
                } = options;

                // Close existing modal if any
                if (this.activeModal) {
                    this.closeModal();
                }

                const overlay = document.createElement('div');
                overlay.className = 'modal-overlay';
                overlay.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <div class="modal-header-icon">
                                ${this.getIcon(type)}
                            </div>
                            <div class="modal-title">${title}</div>
                        </div>
                        <div class="modal-body">
                            <div class="modal-message">${message}</div>
                        </div>
                        <div class="modal-footer">
                            <button class="modal-btn" onclick="window.notificationSystem.resolveModal(false)">
                                ${cancelText}
                            </button>
                            <button class="modal-btn ${confirmType}" onclick="window.notificationSystem.resolveModal(true)">
                                ${confirmText}
                            </button>
                        </div>
                    </div>
                `;

                console.log('📄 Appending modal to body...');
                document.body.appendChild(overlay);
                console.log('✅ Modal appended to DOM, overlay element:', overlay);
                console.log('📍 Body children count:', document.body.children.length);
                
                this.activeModal = { overlay, resolve };
                console.log('💾 Active modal stored:', this.activeModal);

                // Show modal with animation - delay to prevent immediate closure
                setTimeout(() => {
                    console.log('🎬 Starting modal animation...');
                    if (overlay && overlay.parentNode) {
                        overlay.classList.add('show');
                        console.log('✨ Modal animation triggered, classes:', overlay.className);
                    } else {
                        console.error('❌ Overlay element missing from DOM during animation!');
                    }
                    
                    // Add event listeners AFTER animation starts to prevent immediate closure
                    setTimeout(() => {
                        // Close on backdrop click
                        overlay.addEventListener('click', (e) => {
                            console.log('🖱️ Modal backdrop clicked, target:', e.target.className);
                            if (e.target === overlay) {
                                console.log('🚪 Closing modal via backdrop click');
                                this.resolveModal(false);
                            }
                        });

                        // Close on Escape key
                        const handleEscape = (e) => {
                            if (e.key === 'Escape' && this.activeModal) {
                                console.log('⌨️ Escape key pressed, closing modal');
                                this.resolveModal(false);
                                document.removeEventListener('keydown', handleEscape);
                            }
                        };
                        document.addEventListener('keydown', handleEscape);
                        
                        console.log('📌 Modal event listeners attached after delay');
                    }, 100);
                }, 10);

                console.log('✅ Confirmation dialog created');
                
            } catch (error) {
                console.error('❌ Error creating confirmation dialog:', error);
                // Fallback to browser confirm
                const result = confirm(message);
                resolve(result);
            }
        });
    }

    // Resolve modal promise
    resolveModal(result) {
        console.log(`💬 Modal resolved with result: ${result}`);
        console.log('🔍 Stack trace for modal resolution:', new Error().stack);
        try {
            if (this.activeModal) {
                this.activeModal.resolve(result);
                this.closeModal();
            } else {
                console.warn('⚠️ No active modal to resolve');
            }
        } catch (error) {
            console.error('❌ Error resolving modal:', error);
            // Force close modal even if there's an error
            if (this.activeModal) {
                this.activeModal = null;
            }
        }
    }

    // Close active modal
    closeModal() {
        console.log('🗑️ Closing modal...');
        try {
            if (this.activeModal) {
                const overlay = this.activeModal.overlay;
                if (overlay && overlay.classList) {
                    overlay.classList.remove('show');
                }
                setTimeout(() => {
                    try {
                        if (overlay && overlay.parentNode) {
                            overlay.remove();
                        }
                        this.activeModal = null;
                        console.log('✅ Modal removed');
                    } catch (removeError) {
                        console.error('Error removing modal:', removeError);
                        this.activeModal = null;
                    }
                }, 300);
            }
        } catch (error) {
            console.error('❌ Error closing modal:', error);
            this.activeModal = null;
        }
    }

    // Get default title for notification type
    getDefaultTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        return titles[type] || 'Notification';
    }

    // Get icon for notification type
    getIcon(type) {
        const icons = {
            success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-green, #10b981);">
                <path d="M9 12l2 2 4-4"></path>
                <circle cx="12" cy="12" r="10"></circle>
            </svg>`,
            error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--danger-color, #ef4444);">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>`,
            warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-orange, #f59e0b);">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>`,
            info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-blue, #3b82f6);">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>`
        };
        return icons[type] || icons.info;
    }

    // Convenience methods
    success(message, options = {}) {
        return this.showNotification(message, 'success', options);
    }

    error(message, options = {}) {
        return this.showNotification(message, 'error', options);
    }

    warning(message, options = {}) {
        return this.showNotification(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.showNotification(message, 'info', options);
    }

    // Custom alert replacement
    alert(message, type = 'info', options = {}) {
        return this.showNotification(message, type, { ...options, duration: 0 });
    }

    // Custom confirm replacement
    confirm(message, options = {}) {
        return this.showConfirmDialog(message, options);
    }
}

// Initialize immediately - don't wait for DOM
console.log('🚀 Initializing notification system immediately...');

// Create fallback functions first
window.showSuccess = function(message, options = {}) {
    console.log('SUCCESS (fallback):', message);
    alert('✅ ' + message);
};

window.showError = function(message, options = {}) {
    console.error('ERROR (fallback):', message);
    alert('❌ ' + message);
};

window.showWarning = function(message, options = {}) {
    console.warn('WARNING (fallback):', message);
    alert('⚠️ ' + message);
};

window.showInfo = function(message, options = {}) {
    console.log('INFO (fallback):', message);
    alert('ℹ️ ' + message);
};

window.showConfirm = function(message, options = {}) {
    console.log('CONFIRM (fallback):', message);
    return Promise.resolve(confirm(message));
};

window.showNotification = function(message, type, options) {
    console.log('NOTIFICATION (fallback):', type, message);
    alert(`${type.toUpperCase()}: ${message}`);
};

window.showAlert = function(message, type, options) {
    console.log('ALERT (fallback):', type, message);
    alert(message);
};

console.log('✅ Fallback notification functions ready');

// Try to initialize the full system
function initializeAdvancedNotificationSystem() {
    try {
        console.log('🚀 Initializing advanced notification system...');
        
        // Wait for DOM to be ready for the advanced system
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupAdvancedSystem);
        } else {
            setupAdvancedSystem();
        }
        
    } catch (error) {
        console.error('❌ Failed to initialize advanced notification system:', error);
        console.log('Using fallback functions instead');
    }
}

function setupAdvancedSystem() {
    try {
        console.log('🎨 Setting up advanced notification system...');
        
        // Global notification system instance
        window.notificationSystem = new NotificationSystem();

        // Replace fallback functions with advanced ones
        window.showNotification = (message, type, options) => window.notificationSystem.showNotification(message, type, options);
        window.showSuccess = (message, options) => window.notificationSystem.success(message, options);
        window.showError = (message, options) => window.notificationSystem.error(message, options);
        window.showWarning = (message, options) => window.notificationSystem.warning(message, options);
        window.showInfo = (message, options) => window.notificationSystem.info(message, options);
        window.showAlert = (message, type, options) => window.notificationSystem.alert(message, type, options);
        window.showConfirm = (message, options) => window.notificationSystem.confirm(message, options);
        
        console.log('✅ Advanced notification system initialized and functions replaced');
        
    } catch (error) {
        console.error('❌ Failed to setup advanced system, keeping fallbacks:', error);
    }
}

// Start initialization
initializeAdvancedNotificationSystem();

console.log('📄 Notification system script loaded completely'); 