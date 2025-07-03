// Simple notification test to debug issues
console.log('Notification test script loaded');

// Test function that can be called from console
window.testSimpleNotification = function() {
    console.log('Testing simple notification...');
    
    // Create a basic notification without dependencies
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
    `;
    notification.textContent = '✅ Test notification working!';
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
    
    console.log('Simple notification created');
};

// Test if notification system is available
window.testNotificationSystem = function() {
    console.log('Testing notification system availability...');
    console.log('window.notificationSystem:', window.notificationSystem);
    console.log('window.showSuccess:', window.showSuccess);
    console.log('window.showError:', window.showError);
    console.log('window.showWarning:', window.showWarning);
    console.log('window.showInfo:', window.showInfo);
    console.log('window.showConfirm:', window.showConfirm);
    
    if (window.notificationSystem) {
        console.log('Notification system is available!');
        try {
            window.notificationSystem.showNotification('Test from console', 'success');
            console.log('showNotification method called successfully');
        } catch (error) {
            console.error('Error calling showNotification:', error);
        }
    } else {
        console.error('Notification system is NOT available');
    }
};

console.log('Notification test functions available: testSimpleNotification(), testNotificationSystem()'); 