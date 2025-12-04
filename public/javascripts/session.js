// SECURE: Session based authentication helper
// Uses backend session validation (httpOnly cookies) - NO localStorage!

const Session = {
    // Check if user is authenticated via backend session
    async checkAuth() {
        try {
            const response = await fetch('/api/session', {
                method: 'GET',
                credentials: 'include' // Include session cookie
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return data.authenticated ? data.user : null;
        } catch (error) {
            console.error('Session check failed:', error);
            return null;
        }
    },

    // Check if current user is admin
    async isAdmin() {
        const user = await this.checkAuth();
        return user && user.is_admin === 1;
    }
};
