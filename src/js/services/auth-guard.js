// Authentication Guard Service
class AuthGuard {
  constructor(authService) {
    this.authService = authService;
    this.isAuthenticated = false;
    this.currentUser = null;
  }

  // Initialize auth guard
  async init() {
    try {
      console.log('Auth guard init started...');
      
      // Check if auth service is available
      if (!this.authService) {
        console.error('Auth service not available');
        this.showLogin();
        return false;
      }

      // Check if user has tokens
      if (!this.authService.isAuthenticated) {
        console.log('No tokens found, showing login');
        this.showLogin();
        return false;
      }

      console.log('User has tokens, validating...');
      
      // Set timeout for the entire validation process
      const validationPromise = this.validateTokens();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Authentication timeout')), 10000);
      });

      try {
        await Promise.race([validationPromise, timeoutPromise]);
        console.log('Auth successful, showing app');
        return true;
      } catch (error) {
        console.warn('Token validation failed or timeout:', error.message);
        this.authService.clearTokens();
        this.showLogin();
        return false;
      }
    } catch (error) {
      console.error('Auth guard initialization failed:', error);
      this.showLogin();
      return false;
    }
  }

  // Validate tokens with timeout
  async validateTokens() {
    try {
      await this.authService.ensureValidToken();
      this.currentUser = await this.authService.getCurrentUser();
      this.isAuthenticated = true;
      this.showApp();
    } catch (error) {
      throw error;
    }
  }

  // Show login screen
  showLogin() {
    console.log('Showing login screen...');
    this.hideAllScreens();
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
      loginScreen.classList.remove('hidden');
    }
    // Form handlers are set up in index.html
  }

  // Show main app
  showApp() {
    console.log('Showing main app...');
    this.hideAllScreens();
    const app = document.getElementById('app');
    if (app) {
      app.classList.remove('hidden');
    }
    this.updateUserInfo();
  }

  // Hide all screens
  hideAllScreens() {
    console.log('Hiding all screens...');
    const loginScreen = document.getElementById('loginScreen');
    const registerScreen = document.getElementById('registerScreen');
    const app = document.getElementById('app');
    const welcomePage = document.getElementById('welcomePage');
    const loadingScreen = document.getElementById('loadingScreen');
    
    if (loginScreen) loginScreen.classList.add('hidden');
    if (registerScreen) registerScreen.classList.add('hidden');
    if (app) app.classList.add('hidden');
    if (welcomePage) welcomePage.classList.add('hidden');
    if (loadingScreen) loadingScreen.classList.add('hidden');
  }





  // Toggle between login and register screens
  toggleLoginRegister() {
    const loginScreen = document.getElementById('loginScreen');
    const registerScreen = document.getElementById('registerScreen');
    
    if (loginScreen.classList.contains('hidden')) {
      loginScreen.classList.remove('hidden');
      registerScreen.classList.add('hidden');
    } else {
      loginScreen.classList.add('hidden');
      registerScreen.classList.remove('hidden');
    }
  }

  // Handle login
  async handleLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    const buttonText = document.getElementById('loginButtonText');
    const spinner = document.getElementById('loginSpinner');

    if (!username || !password) {
      this.showError(errorDiv, 'Lütfen tüm alanları doldurun');
      return;
    }

    try {
      this.setLoading(true, buttonText, spinner);
      this.hideError(errorDiv);

      const result = await this.authService.login(username, password);
      
      if (result.success) {
        this.currentUser = result.user;
        this.isAuthenticated = true;
        console.log('Login successful, user:', this.currentUser);
        this.showApp();
        
        // Initialize app after successful login
        if (window.app && typeof window.app.init === 'function') {
          await window.app.init();
        }
      } else {
        console.log('Login failed:', result.message);
        this.showError(errorDiv, result.message);
      }
    } catch (error) {
      console.error('Login failed:', error);
      this.showError(errorDiv, 'Giriş başarısız. Kullanıcı adı veya şifre hatalı.');
    } finally {
      this.setLoading(false, buttonText, spinner);
    }
  }

  // Handle register
  async handleRegister() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const hasInviteCode = document.getElementById('hasInviteCode')?.checked || false;
    const inviteCode = hasInviteCode ? document.getElementById('registerInviteCode')?.value : null;
    const errorDiv = document.getElementById('registerError');
    const buttonText = document.getElementById('registerButtonText');
    const spinner = document.getElementById('registerSpinner');

    if (!username || !password || !passwordConfirm) {
      this.showError(errorDiv, 'Lütfen tüm alanları doldurun');
      return;
    }

    if (password !== passwordConfirm) {
      this.showError(errorDiv, 'Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 6) {
      this.showError(errorDiv, 'Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (hasInviteCode && !inviteCode) {
      this.showError(errorDiv, 'Davet kodu gereklidir');
      return;
    }

    try {
      this.setLoading(true, buttonText, spinner);
      this.hideError(errorDiv);

      const registerData = {
        username,
        password,
        ...(hasInviteCode && { inviteToken: inviteCode })
      };

      const result = await this.authService.register(registerData);
      
      if (result.success) {
        this.currentUser = result.user;
        this.isAuthenticated = true;
        console.log('Registration successful, user:', this.currentUser);
        this.showApp();
        
        // Initialize app after successful registration
        if (window.app && typeof window.app.init === 'function') {
          await window.app.init();
        }
      } else {
        console.log('Registration failed:', result.message);
        this.showError(errorDiv, result.message);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      this.showError(errorDiv, 'Kayıt başarısız. Kullanıcı adı zaten kullanılıyor olabilir.');
    } finally {
      this.setLoading(false, buttonText, spinner);
    }
  }

  // Show error message
  showError(errorDiv, message) {
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
    }
  }

  // Hide error message
  hideError(errorDiv) {
    if (errorDiv) {
      errorDiv.classList.add('hidden');
    }
  }

  // Set loading state
  setLoading(loading, buttonText, spinner) {
    if (loading) {
      buttonText.style.display = 'none';
      spinner.classList.remove('hidden');
    } else {
      buttonText.style.display = 'inline';
      spinner.classList.add('hidden');
    }
  }

  // Update user info in UI
  updateUserInfo() {
    if (this.currentUser) {
      // Update header with user info
      const header = document.querySelector('header');
      if (header) {
        const userInfo = header.querySelector('.user-info');
        if (!userInfo) {
          const userInfoDiv = document.createElement('div');
          userInfoDiv.className = 'flex items-center space-x-2 text-sm text-gray-600';
          userInfoDiv.innerHTML = `
            <span>Hoş geldin, ${this.currentUser.username}</span>
          `;
          header.querySelector('.flex.justify-between').appendChild(userInfoDiv);
        }
      }
    }
  }

  // Logout
  async logout() {
    try {
      await this.authService.logout();
      this.isAuthenticated = false;
      this.currentUser = null;
      this.showLogin();
      
      // Clear any app data
      if (window.app) {
        window.app.cleanup();
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      this.authService.clearTokens();
      this.isAuthenticated = false;
      this.currentUser = null;
      this.showLogin();
    }
  }

  // Check if user is authenticated
  isUserAuthenticated() {
    return this.isAuthenticated && this.authService.isAuthenticated;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check authentication status
  async checkAuth() {
    return await this.init();
  }

  // Initialize app after authentication
  async initializeApp() {
    this.showApp();
    // Initialize app after successful login
    if (window.app) {
      window.app.init();
    }
  }
}

// Export AuthGuard class
window.AuthGuard = AuthGuard;

// Also create a default instance for backward compatibility
if (!window.authGuard) {
  window.authGuard = new AuthGuard(window.AuthService);
} 