// User data management
class UserManager {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.loadUsers();
    }

    // Load users from localStorage
    async loadUsers() {
        try {
            // Try to load from localStorage first
            const storedUsers = localStorage.getItem('users');
            if (storedUsers) {
                this.users = JSON.parse(storedUsers);
            } else {
                // If no users in localStorage, load from JSON file
                const response = await fetch('data/users.json');
                const data = await response.json();
                this.users = data.users;
                // Save to localStorage for future use
                localStorage.setItem('users', JSON.stringify(this.users));
            }

            // Check if user is logged in
            const currentUserData = localStorage.getItem('currentUser');
            if (currentUserData) {
                this.currentUser = JSON.parse(currentUserData);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    // Save users to JSON file via PHP
    async saveUsers() {
        try {
            // Update the current user in the users array
            if (this.currentUser) {
                const index = this.users.findIndex(user => user.id === this.currentUser.id);
                if (index !== -1) {
                    this.users[index] = this.currentUser;
                }
            }

            // Save to localStorage for immediate access
            localStorage.setItem('users', JSON.stringify(this.users));
            if (this.currentUser) {
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            }

            // Try to save to server via PHP, but don't fail if it doesn't work
            try {
                const response = await fetch('save_users.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ users: this.users })
                });

                if (!response.ok) {
                    console.warn('Failed to save users to server, but data is saved in localStorage');
                }
            } catch (serverError) {
                console.warn('Server save failed, but data is saved in localStorage:', serverError);
            }

            return true;
        } catch (error) {
            console.error('Error saving users:', error);
            throw error;
        }
    }

    // Register new user
    async register(userData) {
        // Check if email already exists
        if (this.users.some(user => user.email === userData.email)) {
            throw new Error('Email already registered');
        }

        const newUser = {
            id: this.users.length + 1,
            ...userData,
            orders: [],
            cart: [],
            favorites: [],
            createdAt: new Date().toISOString().split('T')[0]
        };

        this.users.push(newUser);
        await this.saveUsers();
        return newUser;
    }

    // Login user
    login(email, password) {
        console.log('Attempting login for email:', email);
        console.log('Available users:', this.users);

        const user = this.users.find(u => u.email === email);
        console.log('Found user:', user);

        if (user && user.password === password) {
            console.log('Login successful for user:', user.name);
            this.currentUser = user;
            // Save full user data to localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));
            return user;
        }

        console.log('Login failed - invalid credentials');
        return null;
    }

    // Logout user
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    // Add item to cart
    async addToCart(productId, quantity = 1) {
        if (!this.currentUser) return false;

        const existingItem = this.currentUser.cart.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.currentUser.cart.push({
                productId,
                quantity
            });
        }

        await this.saveUsers();
        return true;
    }

    // Remove item from cart
    async removeFromCart(productId) {
        if (!this.currentUser) return false;

        this.currentUser.cart = this.currentUser.cart.filter(item => item.productId !== productId);
        await this.saveUsers();
        return true;
    }

    // Add to favorites
    async addToFavorites(productId) {
        if (!this.currentUser) return false;

        if (!this.currentUser.favorites.includes(productId)) {
            this.currentUser.favorites.push(productId);
            await this.saveUsers();
        }
        return true;
    }

    // Remove from favorites
    async removeFromFavorites(productId) {
        if (!this.currentUser) return false;

        this.currentUser.favorites = this.currentUser.favorites.filter(id => id !== productId);
        await this.saveUsers();
        return true;
    }

    // Create new order
    async createOrder(cartItems, total) {
        if (!this.currentUser) return false;

        const newOrder = {
            id: this.currentUser.orders.length + 1,
            date: new Date().toISOString().split('T')[0],
            status: 'pending',
            items: cartItems,
            total
        };

        this.currentUser.orders.push(newOrder);
        this.currentUser.cart = []; // Clear cart after order
        await this.saveUsers();
        return newOrder;
    }

    // Update user profile
    async updateProfile(profileData) {
        const user = this.getCurrentUser();
        if (!user) return false;

        try {
            // Check if email is being changed and if it's already taken
            if (profileData.email !== user.email &&
                this.users.some(u => u.email === profileData.email)) {
                throw new Error('Email jest już zajęty');
            }

            // Update user data
            user.name = profileData.name;
            user.email = profileData.email;
            user.phone = profileData.phone;
            user.address = profileData.address;

            // Update currentUser
            this.currentUser = user;

            // Update localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('users', JSON.stringify(this.users));

            // Save to server
            await this.saveUsers();

            return true;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    // Update password
    async updatePassword(currentPassword, newPassword) {
        if (!this.currentUser) return false;

        if (this.currentUser.password !== currentPassword) {
            throw new Error('Current password is incorrect');
        }

        this.currentUser.password = newPassword;
        await this.saveUsers();
        return true;
    }

    // Get user orders
    getOrders() {
        if (!this.currentUser) return [];
        return this.currentUser.orders;
    }

    // Get user cart
    getCart() {
        if (!this.currentUser) return [];
        return this.currentUser.cart;
    }

    // Get user favorites
    getFavorites() {
        if (!this.currentUser) return [];
        return this.currentUser.favorites;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        if (!this.currentUser) {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                this.currentUser = JSON.parse(storedUser);
            }
        }
        return this.currentUser;
    }

    async updateAvatar(avatarUrl) {
        const user = this.getCurrentUser();
        if (!user) return false;

        user.avatar = avatarUrl;

        // Update localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));

        // Update users array
        const userIndex = this.users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            this.users[userIndex] = user;
            await this.saveUsers();
        }

        return true;
    }
}

// Create global user manager instance
const userManager = new UserManager();