document.addEventListener('DOMContentLoaded', function() {
    // Load header
    fetch('./components/header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = data;
                console.log('Header loaded successfully');
                // Call the updateCartCounter function after the header is loaded
                if (window.updateCartCounter) {
                    window.updateCartCounter();
                }
            } else {
                console.error('Header placeholder not found');
            }
        })
        .catch(error => {
            console.error('Error loading header:', error);
        });

    // Load footer
    fetch('./components/footer.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            const footerPlaceholder = document.getElementById('footer-placeholder');
            if (footerPlaceholder) {
                footerPlaceholder.innerHTML = data;
                console.log('Footer loaded successfully');
            } else {
                console.error('Footer placeholder not found');
            }
        })
        .catch(error => {
            console.error('Error loading footer:', error);
        });
});