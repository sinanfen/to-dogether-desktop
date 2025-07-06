// Authentication Service
class AuthService {
  constructor() {
    try {
      this.config = window.AppConfig;
      this.endpoints = this.config.getApiEndpoints();
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      this.isAuthenticated = false;
      
      // Load tokens from storage
      this.loadTokens();
      console.log('Auth service initialized, isAuthenticated:', this.isAuthenticated);
    } catch (error) {
      console.error('Auth service initialization failed:', error);
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      this.isAuthenticated = false;
    }
  }

  // Load tokens from localStorage
  loadTokens() {
    try {
      const tokens = localStorage.getItem('todogether_tokens');
      if (tokens) {
        const { accessToken, refreshToken } = JSON.parse(tokens);
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.isAuthenticated = !!accessToken;
        console.log('Tokens loaded from storage, isAuthenticated:', this.isAuthenticated);
      } else {
        console.log('No tokens found in storage');
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
      this.clearTokens();
    }
  }

  // Save tokens to localStorage
  saveTokens(accessToken, refreshToken) {
    try {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.isAuthenticated = !!accessToken;
      
      localStorage.setItem('todogether_tokens', JSON.stringify({
        accessToken,
        refreshToken
      }));
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  // Clear tokens
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    this.isAuthenticated = false;
    
    try {
      localStorage.removeItem('todogether_tokens');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Login
  async login(username, password) {
    try {
      const response = await fetch(this.endpoints.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          message: data.message || `Login failed: ${response.status}` 
        };
      }
      
      // API response format: { accessToken, refreshToken, username, userId }
      if (data.accessToken && data.refreshToken) {
        this.saveTokens(data.accessToken, data.refreshToken);
        this.user = { 
          username: data.username, 
          id: data.userId 
        };
        return { success: true, user: this.user };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: 'Giriş sırasında bir hata oluştu' 
      };
    }
  }

  // Register
  async register(registerData) {
    try {
      const response = await fetch(this.endpoints.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          message: data.message || `Registration failed: ${response.status}` 
        };
      }
      
      // API response format: { accessToken, refreshToken, username, userId, inviteToken? }
      if (data.accessToken && data.refreshToken) {
        this.saveTokens(data.accessToken, data.refreshToken);
        this.user = { 
          username: data.username, 
          id: data.userId 
        };
        return { 
          success: true, 
          user: this.user,
          inviteToken: data.inviteToken || null
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: 'Kayıt sırasında bir hata oluştu' 
      };
    }
  }

  // Refresh token
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(this.endpoints.refresh, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.accessToken) {
        this.saveTokens(data.accessToken, this.refreshToken);
        return data.accessToken;
      }
      
      throw new Error('Invalid refresh response');
    } catch (error) {
      console.error('Token refresh error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      this.clearTokens();
      throw error;
    }
  }

  // Logout
  async logout() {
    if (this.refreshToken) {
      try {
        await fetch(this.endpoints.logout, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken: this.refreshToken })
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    this.clearTokens();
  }

  // Get current user
  async getCurrentUser() {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(this.endpoints.currentUser, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          await this.refreshAccessToken();
          return this.getCurrentUser(); // Retry with new token
        }
        throw new Error(`Get user failed: ${response.status}`);
      }

      const user = await response.json();
      console.log('Current user response:', user);
      
      // Update local user data
      this.user = user;
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(this.endpoints.updateProfile, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          message: data.message || `Profile update failed: ${response.status}` 
        };
      }

      // Update local user data
      this.user = { ...this.user, ...data };
      return { success: true, user: this.user };
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        message: 'Profil güncellenirken bir hata oluştu' 
      };
    }
  }

  // Get authorization header
  getAuthHeader() {
    if (!this.accessToken) {
      return {};
    }
    return {
      'Authorization': `Bearer ${this.accessToken}`
    };
  }

  // Check if token is expired (simple check)
  isTokenExpired() {
    if (!this.accessToken) return true;
    
    try {
      const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expiry;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
  }

  // Auto-refresh token if needed
  async ensureValidToken() {
    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
    return this.accessToken;
  }
}

// Create and export auth service (singleton pattern)
if (!window.AuthService) {
  window.AuthService = new AuthService();
} else {
  console.log('AuthService already exists, reusing existing instance');
} 