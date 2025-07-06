// Debug Utility for development
class DebugUtils {
  constructor() {
    this.config = window.AppConfig;
  }

  // Log current environment and configuration
  logEnvironment() {
    console.group('🔧 To-dogether Environment Info');
    console.log('Environment:', this.config.isDevelopment ? 'Development' : 'Production');
    console.log('API Base URL:', this.config.getApiBaseUrl());
    console.log('App Version:', this.config.getAppSettings().version);
    console.log('Sync Interval:', this.config.getAppSettings().syncInterval + 'ms');
    console.log('Feature Flags:', this.config.getFeatureFlags());
    console.groupEnd();
  }

  // Test API connectivity
  async testApiConnection() {
    console.group('🌐 API Connection Test');
    try {
      // Check if API service exists
      if (window.apiService && window.apiService.checkApiHealth) {
        const isHealthy = await window.apiService.checkApiHealth();
        console.log('API Health Check:', isHealthy ? '✅ Connected' : '❌ Not Available');
        
        if (isHealthy) {
          console.log('API Endpoints:');
          Object.entries(this.config.getApiEndpoints()).forEach(([key, value]) => {
            console.log(`  ${key}:`, typeof value === 'function' ? value('test') : value);
          });
        }
      } else {
        console.log('API Service not available');
      }
    } catch (error) {
      console.error('API Test Failed:', error);
    }
    console.groupEnd();
  }

  // Show storage info
  logStorageInfo() {
    console.group('💾 Storage Info');
    try {
      if (window.storageManager && window.storageManager.loadData) {
        const data = window.storageManager.loadData();
        console.log('Partners:', Object.keys(data.partners || {}));
        console.log('Settings:', data.settings || {});
      } else {
        console.log('Storage Manager not available');
      }
    } catch (error) {
      console.error('Storage Info Error:', error);
    }
    console.groupEnd();
  }

  // Show all debug info
  showAllDebugInfo() {
    this.logEnvironment();
    this.testApiConnection();
    this.logStorageInfo();
  }

  // Add debug info to UI (development only)
  addDebugInfoToUI() {
    if (!this.config.isDevelopment) return;

    const debugInfo = document.createElement('div');
    debugInfo.className = 'fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs z-50 max-w-xs';
    debugInfo.innerHTML = `
      <div class="font-bold mb-2">🔧 Debug Info</div>
      <div><strong>Env:</strong> ${this.config.isDevelopment ? 'DEV' : 'PROD'}</div>
      <div><strong>API:</strong> ${this.config.getApiBaseUrl()}</div>
      <div><strong>Version:</strong> ${this.config.getAppSettings().version}</div>
      <div><strong>Sync:</strong> ${this.config.getAppSettings().syncInterval}ms</div>
    `;

    document.body.appendChild(debugInfo);
  }
}

// Create and export debug utility
window.DebugUtils = new DebugUtils();

// Auto-show debug info in development
if (window.AppConfig && window.AppConfig.isDevelopment) {
  window.addEventListener('DOMContentLoaded', () => {
    window.DebugUtils.showAllDebugInfo();
    window.DebugUtils.addDebugInfoToUI();
  });
} 