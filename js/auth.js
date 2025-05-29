// Check authentication status on page load
document.addEventListener('DOMContentLoaded', function() {
    const userManager = new UserManager();

    // Get current page path
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('login.html') ||
        currentPath.includes('register.html');
    const isAccountPage = currentPath.includes('account.html');

    // Check if user is logged in
    const user = userManager.getCurrentUser();

    // Handle protected pages
    if (isAccountPage && !user) {
        // Redirect to login if trying to access account page without being logged in
        window.location.href = 'login.html';
        return;
    }

    // Handle auth pages
    if (isAuthPage && user) {
        // Redirect to account if trying to access login/register while logged in
        window.location.href = 'account.html';
        return;
    }

    // Update UI elements based on auth status
    updateAuthUI(user);
});

// Update UI elements based on authentication status
function updateAuthUI(user) {
    const authLinks = document.querySelectorAll('.auth-link');
    const userLinks = document.querySelectorAll('.user-link');
    const accountLink = document.querySelector('.account-link');

    if (user) {
        // User is logged in
        authLinks.forEach(link => link.style.display = 'none');
        userLinks.forEach(link => link.style.display = 'block');
        if (accountLink) {
            accountLink.style.display = 'block';
            accountLink.href = 'account.html';
        }
    } else {
        // User is not logged in
        authLinks.forEach(link => link.style.display = 'block');
        userLinks.forEach(link => link.style.display = 'none');
        if (accountLink) {
            accountLink.style.display = 'none';
        }
    }
}