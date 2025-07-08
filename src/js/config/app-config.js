// Application Configuration
class AppConfig {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development' || 
                        process.argv.includes('--dev') || 
                        !process.env.NODE_ENV;
    
    this.isProduction = !this.isDevelopment;
  }

  // Get API base URL based on environment
  getApiBaseUrl() {
    if (this.isDevelopment) {
      return 'https://localhost:54696/';
    } else {
      return 'https://todogether.sinanfen.me/';
    }
  }

  // Get API endpoints
  getApiEndpoints() {
    const baseUrl = this.getApiBaseUrl();
    
    return {
      // Base URL for custom endpoints
      baseUrl: baseUrl,
      
      // Health check
      health: `${baseUrl}`,
      
      // Authentication
      login: `${baseUrl}auth/login`,
      register: `${baseUrl}auth/register`,
      refresh: `${baseUrl}auth/refresh`,
      logout: `${baseUrl}auth/logout`,
      
      // User Profile
      currentUser: `${baseUrl}users/me`,
      updateProfile: `${baseUrl}users/profile`,
      
      // Todo Lists
      todoLists: `${baseUrl}todolists`,
      partnerTodoLists: `${baseUrl}todolists/partner`,
      todoList: (id) => `${baseUrl}todolists/${id}`,
      
      // Todo Items
      todoItems: (todoListId) => `${baseUrl}todolists/${todoListId}/items`,
      todoItem: (todoListId, itemId) => `${baseUrl}todolists/${todoListId}/items/${itemId}`
    };
  }

  // Get enum mappings
  getEnums() {
    return {
      severity: {
        LOW: 0,
        MEDIUM: 1,
        HIGH: 2
      },
      status: {
        PENDING: 0,
        COMPLETED: 1
      }
    };
  }

  // Get severity mapping
  getSeverityMapping() {
    return {
      0: { name: 'Düşük', color: 'gray', class: 'bg-gray-100 text-gray-700' },
      1: { name: 'Orta', color: 'blue', class: 'bg-blue-100 text-blue-700' },
      2: { name: 'Yüksek', color: 'orange', class: 'bg-orange-100 text-orange-700' }
    };
  }

  // Get status mapping
  getStatusMapping() {
    return {
      0: { name: 'Bekliyor', color: 'gray', class: 'bg-gray-100 text-gray-700' },
      1: { name: 'Tamamlandı', color: 'green', class: 'bg-green-100 text-green-700' }
    };
  }

  // Get app settings
  getAppSettings() {
    return {
      appName: 'To-dogether',
      version: '1.0.0',
      isDevelopment: this.isDevelopment,
      isProduction: this.isProduction,
      syncInterval: this.isDevelopment ? 5000 : 10000, // 5s dev, 10s prod
      retryAttempts: 3,
      timeout: 10000
    };
  }

  // Get logging configuration
  getLoggingConfig() {
    return {
      level: this.isDevelopment ? 'debug' : 'info',
      enableConsole: this.isDevelopment,
      enableFile: this.isProduction
    };
  }

  // Get feature flags
  getFeatureFlags() {
    return {
      realtimeSync: true,
      offlineMode: true,
      autoBackup: this.isProduction,
      analytics: this.isProduction,
      debugMode: this.isDevelopment
    };
  }
}

// Create singleton instance
const appConfig = new AppConfig();

// Export for use in other files
window.AppConfig = appConfig; 