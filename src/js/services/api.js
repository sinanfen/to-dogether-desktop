// API Service for backend communication
class ApiService {
  constructor() {
    // Use AppConfig for environment-based configuration
    this.config = window.AppConfig;
    this.endpoints = this.config.getApiEndpoints();
    this.settings = this.config.getAppSettings();
    this.authService = window.AuthService;
    this.syncInterval = null;
  }

  // Get headers for API requests
  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
      "X-App-Version": this.settings.version,
      "X-Environment": this.config.isDevelopment ? "development" : "production",
    };

    // Add auth header if available
    const authHeader = this.authService.getAuthHeader();
    Object.assign(headers, authHeader);

    return headers;
  }

  // Generic API request method with retry logic and auth
  async request(endpoint, options = {}) {
    const maxRetries = this.settings.retryAttempts;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Ensure valid token before request
        if (this.authService.isAuthenticated) {
          await this.authService.ensureValidToken();
        }

        const config = {
          method: options.method || "GET",
          headers: this.getHeaders(),
          timeout: this.settings.timeout,
          ...options,
        };

        if (options.body) {
          config.body = JSON.stringify(options.body);
        }

        const response = await fetch(endpoint, config);

        // Handle 401 Unauthorized
        if (response.status === 401 && attempt < maxRetries) {
          try {
            await this.authService.refreshAccessToken();
            continue; // Retry with new token
          } catch (refreshError) {
            // Refresh failed, clear tokens and throw
            this.authService.clearTokens();
            throw new Error("Authentication failed");
          }
        }

        if (!response.ok) {
          throw new Error(
            `API Error: ${response.status} ${response.statusText}`
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error;

        if (this.config.isDevelopment) {
          console.warn(`API Request attempt ${attempt} failed:`, error);
        }

        // Don't retry on 4xx errors (except 401 which we handle above)
        if (error.message.includes("4") && !error.message.includes("401")) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    throw lastError;
  }

  // Get my todos
  async getMyTodos() {
    try {
      return await this.request(this.endpoints.todos);
    } catch (error) {
      console.error("Get my todos error:", error);
      throw error;
    }
  }

  // Get partner todos
  async getPartnerTodos() {
    try {
      return await this.request(this.endpoints.partnerTodos);
    } catch (error) {
      console.error("Get partner todos error:", error);
      throw error;
    }
  }

  // Get partner overview (partner info + their todo lists)
  async getPartnerOverview() {
    try {
      return await this.request(this.endpoints.baseUrl + '/partner/overview');
    } catch (error) {
      console.error("Get partner overview error:", error);
      throw error;
    }
  }

  // Create new todo
  async createTodo(todo) {
    try {
      // Convert frontend format to API format
      const apiTodo = {
        title: todo.title,
        description: todo.description || null,
        severity: this.convertPriorityToSeverity(todo.priority),
      };

      return await this.request(this.endpoints.todos, {
        method: "POST",
        body: apiTodo,
      });
    } catch (error) {
      console.error("Create todo error:", error);
      throw error;
    }
  }

  // Update todo
  async updateTodo(todoId, updates) {
    try {
      // Convert frontend format to API format
      const apiUpdates = {};

      if (updates.title !== undefined) apiUpdates.title = updates.title;
      if (updates.description !== undefined)
        apiUpdates.description = updates.description;
      if (updates.priority !== undefined)
        apiUpdates.severity = this.convertPriorityToSeverity(updates.priority);
      if (updates.status !== undefined)
        apiUpdates.status = this.convertStatusToApi(updates.status);
      if (updates.order !== undefined) apiUpdates.order = updates.order;

      return await this.request(this.endpoints.todo(todoId), {
        method: "PUT",
        body: apiUpdates,
      });
    } catch (error) {
      console.error("Update todo error:", error);
      throw error;
    }
  }

  // Delete todo
  async deleteTodo(todoId) {
    try {
      return await this.request(this.endpoints.todo(todoId), {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Delete todo error:", error);
      throw error;
    }
  }

  // Convert priority to API severity
  convertPriorityToSeverity(priority) {
    const mapping = {
      low: 0,
      medium: 1,
      high: 2,
      urgent: 2,
    };
    return mapping[priority] || 1;
  }

  // Convert API severity to priority
  convertSeverityToPriority(severity) {
    const mapping = {
      0: "low",
      1: "medium",
      2: "high",
    };
    return mapping[severity] || "medium";
  }

  // Convert status to API format
  convertStatusToApi(status) {
    const mapping = {
      pending: 0,
      "in-progress": 0,
      completed: 1,
      cancelled: 0,
    };
    return mapping[status] || 0;
  }

  // Convert API status to frontend format
  convertApiStatusToFrontend(status) {
    const mapping = {
      0: "pending",
      1: "completed",
    };
    return mapping[status] || "pending";
  }

  // Check if API is available
  async checkApiHealth() {
    try {
      await this.request(this.endpoints.health);
      return true;
    } catch (error) {
      console.warn("API not available, using local storage only");
      return false;
    }
  }

  // Real-time sync (polling)
  async startRealTimeSync(callback) {
    // Use configurable sync interval
    this.syncInterval = setInterval(async () => {
      try {
        // Get both my todos and partner todos
        const [myTodos, partnerTodos] = await Promise.all([
          this.getMyTodos(),
          this.getPartnerTodos(),
        ]);

        if (callback && typeof callback === "function") {
          callback({ myTodos, partnerTodos });
        }
      } catch (error) {
        console.error("Real-time sync error:", error);
      }
    }, this.settings.syncInterval);
  }

  // Stop real-time sync
  stopRealTimeSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Export for use in other files
window.ApiService = ApiService;
