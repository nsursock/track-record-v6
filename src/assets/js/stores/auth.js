// Create a store for authentication
export default {
    user: null,
    session: null,
    isLoading: false,
    error: null,

    async init() {
        try {
            // Initialize auth state from localStorage if available
            const storedSession = localStorage.getItem('session');
            if (storedSession) {
                try {
                    this.session = JSON.parse(storedSession);
                    // Validate session with backend
                    const response = await fetch('/api/credentials?action=validate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.session.access_token}`
                        },
                        body: JSON.stringify({ session: this.session })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        if (response.status === 401 || response.status === 403) {
                            // Try to refresh token on auth errors
                            const refreshed = await this.refreshToken();
                            if (!refreshed) {
                                this.logout();
                                return false;
                            }
                            // Retry the validation with new token
                            return this.init();
                        }
                        throw new Error(data.error || 'Session validation failed');
                    }

                    // Update session if refreshed
                    if (data.session) {
                        this.session = data.session;
                        localStorage.setItem('session', JSON.stringify(data.session));
                    }

                    // Start periodic session check
                    this.startSessionCheck();
                    return true;
                } catch (e) {
                    console.error('Failed to parse stored session:', e);
                    this.logout();
                    return false;
                }
            }
            return false;
        } catch (error) {
            console.error('Auth initialization error:', error);
            this.logout();
            return false;
        }
    },

    startSessionCheck() {
        // Check session every 15 minutes - less aggressive
        this.sessionCheckInterval = setInterval(async () => {
            if (this.session) {
                const isValid = await this.validateSession();
                if (!isValid) {
                    clearInterval(this.sessionCheckInterval);
                }
            } else {
                clearInterval(this.sessionCheckInterval);
            }
        }, 15 * 60 * 1000);
    },

    async validateSession() {
        if (!this.session) return false;

        try {
            // Check if token is expired
            const tokenExp = this.session.expires_at;
            const now = Math.floor(Date.now() / 1000);
            
            console.log('Session validation check:', {
                tokenExp,
                now,
                timeUntilExpiry: tokenExp ? (tokenExp - now) : 'unknown',
                timeUntilExpiryMinutes: tokenExp ? Math.round((tokenExp - now) / 60) : 'unknown'
            });
            
            // If token is expired or will expire in the next 5 minutes, try to refresh it
            if (!tokenExp || tokenExp < now + 300) {
                console.log('Token is expiring soon, attempting refresh...');
                const refreshed = await this.refreshToken();
                if (!refreshed) {
                    console.error('Token refresh failed, logging out...');
                    this.logout();
                    return false;
                }
                console.log('Token refreshed successfully');
                return true; // Return early since we've already refreshed
            }

            const response = await fetch('/api/credentials?action=validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.session.access_token}`
                },
                body: JSON.stringify({ session: this.session })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    console.log('Session validation failed, attempting token refresh...');
                    // Try to refresh token on auth errors
                    const refreshed = await this.refreshToken();
                    if (!refreshed) {
                        console.error('Token refresh failed after validation error, logging out...');
                        this.logout();
                        return false;
                    }
                    console.log('Token refreshed after validation error');
                    // Don't retry validation immediately, just return success since we refreshed
                    return true;
                }
                // Don't throw error for other status codes, just log and continue
                console.warn('Session validation warning:', data.error || 'Unknown error');
                return true;
            }

            // Update session if refreshed
            if (data.session) {
                console.log('Session updated with new data');
                this.session = data.session;
                localStorage.setItem('session', JSON.stringify(data.session));
            }

            return true;
        } catch (error) {
            console.error('Session validation error:', error);
            this.logout();
            return false;
        }
    },

    async refreshToken() {
        if (!this.session?.refresh_token) {
            console.error('No refresh token available');
            return false;
        }

        try {
            console.log('Attempting to refresh token...');
            const response = await fetch('/api/credentials?action=refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    refresh_token: this.session.refresh_token 
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Token refresh failed:', {
                    status: response.status,
                    error: data.error || 'Unknown error',
                    details: data.details || 'No details provided'
                });
                
                // If refresh token is invalid or expired, force logout
                if (response.status === 401 || response.status === 403) {
                    console.log('Refresh token is invalid or expired, logging out...');
                    this.logout();
                }
                throw new Error(data.error || 'Token refresh failed');
            }

            if (data.session) {
                console.log('Token refresh successful, updating session...');
                this.session = data.session;
                localStorage.setItem('session', JSON.stringify(data.session));
                return true;
            }

            console.error('No session data in refresh response');
            return false;
        } catch (error) {
            console.error('Token refresh error:', {
                message: error.message,
                stack: error.stack
            });
            // Force logout on refresh failure
            this.logout();
            return false;
        }
    },

    async login(email, password, rememberMe = false) {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await fetch('/api/credentials?action=login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, rememberMe })
            });

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('Failed to parse response:', jsonError);
                throw new Error('Server response was invalid');
            }

            if (!response.ok) {
                // Handle specific error cases
                if (response.status === 401) {
                    if (data.error === 'Invalid email') {
                        throw new Error('No account found with this email address');
                    } else if (data.error === 'Invalid password') {
                        throw new Error('The password you entered is incorrect');
                    }
                }
                throw new Error(data.details || data.error || 'Login failed');
            }

            // Store the session
            if (data.session) {
                this.session = data.session;
                localStorage.setItem('session', JSON.stringify(data.session));
            }

            // Redirect to profile page
            window.location.href = '/profile/';
        } catch (error) {
            this.error = error.message;
            throw error;
        } finally {
            this.isLoading = false;
        }
    },

    async signup(userData) {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await fetch('/api/credentials?action=signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            return data;
        } catch (error) {
            this.error = error.message;
            throw error;
        } finally {
            this.isLoading = false;
        }
    },

    async logout() {
        try {
            // Clear session check interval
            if (this.sessionCheckInterval) {
                clearInterval(this.sessionCheckInterval);
            }

            // Call logout endpoint if session exists
            if (this.session) {
                await fetch('/api/credentials?action=logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.session.access_token}`
                    },
                    body: JSON.stringify({ session: this.session })
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local state regardless of API call success
            this.session = null;
            this.user = null;
            localStorage.removeItem('session');
            window.location.href = '/login/';
        }
    },

    isAuthenticated() {
        return !!this.session;
    },

    // Helper method to get auth headers for API requests
    getAuthHeaders() {
        if (!this.session) return {};
        
        return {
            'Authorization': `Bearer ${this.session.access_token}`
        };
    },

    // Test method to simulate token expiration
    simulateTokenExpiration() {
        if (this.session) {
            // Set expiration to 1 hour ago
            this.session.expires_at = Math.floor(Date.now() / 1000) - 3600;
            localStorage.setItem('session', JSON.stringify(this.session));
            console.log('Token expiration simulated - expires_at set to 1 hour ago');
        }
    },

    // Test method to simulate invalid JWT
    simulateInvalidJWT() {
        if (this.session) {
            // Corrupt the access token
            this.session.access_token = 'invalid_token_that_will_cause_bad_jwt';
            localStorage.setItem('session', JSON.stringify(this.session));
            console.log('Invalid JWT simulated - access_token corrupted');
        }
    }
}; 