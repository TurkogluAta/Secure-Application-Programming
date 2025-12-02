// Simple localStorage-based authentication utility
const Auth = {
    // Save user data to localStorage after successful login
    login(userData) {
        localStorage.setItem('currentUser', JSON.stringify(userData));
    },

    // Remove user data from localStorage on logout
    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
    },

    // Check if user is logged in
    isLoggedIn() {
        return localStorage.getItem('currentUser') !== null;
    },

    // Get current user data
    getCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    },

    // Get auth token if exists
    getToken() {
        return localStorage.getItem('authToken');
    }
};
