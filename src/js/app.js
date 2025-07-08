// Main Application
class App {
  constructor() {
    this.currentUser = null;
    this.todoLists = [];
    this.partnerTodoLists = [];
    this.currentTodoList = null;
    this.currentEditingTodoList = null;
    this.currentTodoItems = [];
    this.allTodoItems = [];
    this.currentView = 'dashboard';
    this.couple = null;
    this.partners = [];
    this.eventListenersSetup = false; // Flag to track if event listeners are already attached
  }

  async init() {
    try {
      console.log('App initialization started...');
      
      // Get current user
      // Prefer authGuard's currentUser if available, otherwise get from service
      if (window.authGuard && window.authGuard.currentUser) {
        this.currentUser = window.authGuard.currentUser;
        console.log('Using current user from authGuard:', this.currentUser);
      } else {
        this.currentUser = await window.authService.getCurrentUser();
        console.log('Getting current user from authService:', this.currentUser);
      }
      
      console.log('Current user loaded:', this.currentUser);
      
      // Add detailed debugging
      console.log('AuthService isAuthenticated:', window.authService.isAuthenticated);
      console.log('AuthService accessToken exists:', !!window.authService.accessToken);
      console.log('AuthService endpoints:', window.authService.endpoints);
      
      // Load couple info
      console.log('Starting to load couple info...');
      await this.loadCoupleInfo();
      console.log('Couple info loaded');
      
      // Load todo lists
      console.log('Starting to load todo lists...');
      await this.loadTodoLists();
      console.log('Todo lists loaded');
      
      // Setup event listeners
      console.log('Setting up event listeners...');
      this.setupEventListeners();
      console.log('Event listeners setup complete');
      
      // Show dashboard
      console.log('Showing dashboard...');
      this.showDashboard();
      console.log('Dashboard shown');
      
      console.log('App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      
      // Don't redirect to login if it's an API error
      // Just show error notification and continue
      if (error.message.includes('Failed to load') || error.message.includes('Failed to get')) {
        showNotification('Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.', 'error');
      } else {
        // Only redirect to login for authentication errors
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          window.authGuard.showLogin();
        } else {
          showNotification('Uygulama başlatılırken bir hata oluştu', 'error');
        }
      }
    }
  }

  async loadCoupleInfo() {
    try {
      console.log('Loading couple and partner info...');
      console.log('AuthService headers:', window.authService.getAuthHeader());
      
      // Try to get partner overview
      try {
        const partnerOverviewUrl = window.authService.endpoints.baseUrl + 'partner/overview';
        console.log('Partner overview URL:', partnerOverviewUrl);
        console.log('Making partner overview request...');
        
        const response = await fetch(window.authService.endpoints.baseUrl + 'partner/overview', {
          headers: window.authService.getAuthHeader()
        });
        
        console.log('Partner overview response status:', response.status);
        console.log('Partner overview response headers:', [...response.headers.entries()]);
        
        if (response.ok) {
          const partnerInfo = await response.json();
          console.log('Partner overview loaded:', partnerInfo);
          
          // Set up partners array with current user and partner
          this.partners = [this.currentUser, partnerInfo];
          
          // Store partner's todo lists
          this.partnerTodoLists = partnerInfo.todoLists || [];
          
          // Create couple structure
          this.couple = {
            id: this.currentUser.coupleId || 1,
            partners: this.partners
          };
          
          console.log('Partner found:', partnerInfo.username, 'with', this.partnerTodoLists.length, 'todo lists');
        } else {
          console.log('No partner found or partner overview not available. Status:', response.status);
          const errorText = await response.text();
          console.log('Partner overview error response:', errorText);
          // No partner case
          this.partners = [this.currentUser];
          this.partnerTodoLists = [];
          this.couple = {
            id: this.currentUser.coupleId || 1,
            partners: [this.currentUser]
          };
        }
      } catch (error) {
        console.error('Error fetching partner overview:', error);
        // Fallback to no partner
        this.partners = [this.currentUser];
        this.partnerTodoLists = [];
        this.couple = {
          id: this.currentUser.coupleId || 1,
          partners: [this.currentUser]
        };
      }
      
      console.log('Current user in loadCoupleInfo:', this.currentUser);
      console.log('Couple info loaded:', this.couple);
      console.log('Partners:', this.partners);
      console.log('Partner todo lists:', this.partnerTodoLists.length);
    } catch (error) {
      console.error('Error loading couple info:', error);
      // Fallback to current user only
      this.couple = { id: 1, partners: [this.currentUser] };
      this.partners = [this.currentUser];
      this.partnerTodoLists = [];
    }
  }

  async loadTodoLists() {
    try {
      console.log('Loading todo lists...');
      console.log('Todo lists endpoint:', window.authService.endpoints.todoLists);
      
      // Load user's own todo lists
      console.log('Making user todo lists request...');
      const userResponse = await fetch(window.authService.endpoints.todoLists, {
        headers: window.authService.getAuthHeader()
      });

      console.log('User todo lists response status:', userResponse.status);
      if (userResponse.ok) {
        this.todoLists = await userResponse.json();
        console.log('User todo lists loaded:', this.todoLists.length);
        console.log('User todo lists data:', this.todoLists);
      } else {
        const errorText = await userResponse.text();
        console.error('Failed to load user todo lists. Status:', userResponse.status, 'Response:', errorText);
        this.todoLists = [];
        // Don't throw error, just continue with empty list
      }

      // Partner todo lists are already loaded in loadCoupleInfo()
      console.log('Partner todo lists already loaded:', this.partnerTodoLists.length);
      
      // Load todo items for all lists to calculate stats
      console.log('Loading all todo items...');
      await this.loadAllTodoItems();
      
      console.log('Todo lists loading complete:', { user: this.todoLists.length, partner: this.partnerTodoLists.length });
    } catch (error) {
      console.error('Error loading todo lists:', error);
      this.todoLists = [];
      // Don't reset partnerTodoLists here since they're loaded in loadCoupleInfo
      // Don't throw error, just continue with empty lists
    }
  }

  async loadAllTodoItems() {
    try {
      const allTodoLists = [...this.todoLists, ...this.partnerTodoLists];
      this.allTodoItems = [];
      
      for (const todoList of allTodoLists) {
        try {
          const response = await fetch(window.authService.endpoints.todoItems(todoList.id), {
            headers: window.authService.getAuthHeader()
          });
          
          if (response.ok) {
            const items = await response.json();
            // Add todoListId to each item for reference
            items.forEach(item => {
              item.todoListId = todoList.id;
              item.ownerId = todoList.ownerId;
            });
            this.allTodoItems.push(...items);
          }
        } catch (error) {
          console.error(`Failed to load items for todo list ${todoList.id}:`, error);
        }
      }
      
      console.log('All todo items loaded:', this.allTodoItems.length);
    } catch (error) {
      console.error('Error loading all todo items:', error);
      this.allTodoItems = [];
    }
  }

  async createTodoList(todoListData) {
    try {
      const response = await fetch(window.authService.endpoints.todoLists, {
        method: 'POST',
        headers: {
          ...window.authService.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(todoListData)
      });

      if (!response.ok) {
        throw new Error('Failed to create todo list');
      }

      const newTodoList = await response.json();
      this.todoLists.push(newTodoList);
      
      console.log('Todo list created:', newTodoList);
      return newTodoList;
    } catch (error) {
      console.error('Error creating todo list:', error);
      throw error;
    }
  }

  async updateTodoList(todoListId, updates) {
    try {
      const response = await fetch(window.authService.endpoints.todoList(todoListId), {
        method: 'PUT',
        headers: {
          ...window.authService.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update todo list');
      }

      const updatedTodoList = await response.json();
      const index = this.todoLists.findIndex(list => list.id === todoListId);
      if (index !== -1) {
        this.todoLists[index] = updatedTodoList;
      }
      
      console.log('Todo list updated:', updatedTodoList);
      return updatedTodoList;
    } catch (error) {
      console.error('Error updating todo list:', error);
      throw error;
    }
  }

  async deleteTodoList(todoListId) {
    try {
      const response = await fetch(window.authService.endpoints.todoList(todoListId), {
        method: 'DELETE',
        headers: window.authService.getAuthHeader()
      });

      if (!response.ok) {
        throw new Error('Failed to delete todo list');
      }

      this.todoLists = this.todoLists.filter(list => list.id !== todoListId);
      
      console.log('Todo list deleted:', todoListId);
    } catch (error) {
      console.error('Error deleting todo list:', error);
      throw error;
    }
  }

  async loadTodoItems(todoListId) {
    try {
      const response = await fetch(window.authService.endpoints.todoItems(todoListId), {
        headers: window.authService.getAuthHeader()
      });

      if (!response.ok) {
        throw new Error('Failed to load todo items');
      }

      const items = await response.json();
      this.currentTodoItems = items;
      
      console.log('Todo items loaded:', items);
      return items;
    } catch (error) {
      console.error('Error loading todo items:', error);
      this.currentTodoItems = [];
      return [];
    }
  }

  async addTodoItem(todoListId, itemData) {
    try {
      const response = await fetch(window.authService.endpoints.todoItems(todoListId), {
        method: 'POST',
        headers: {
          ...window.authService.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
      });

      if (!response.ok) {
        throw new Error('Failed to add todo item');
      }

      const newItem = await response.json();
      this.currentTodoItems.push(newItem);
      
      console.log('Todo item added:', newItem);
      return newItem;
    } catch (error) {
      console.error('Error adding todo item:', error);
      throw error;
    }
  }

  async updateTodoItem(todoListId, itemId, updates) {
    try {
      const response = await fetch(window.authService.endpoints.todoItem(todoListId, itemId), {
        method: 'PUT',
        headers: {
          ...window.authService.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update todo item');
      }

      const updatedItem = await response.json();
      const index = this.currentTodoItems.findIndex(item => item.id === itemId);
      if (index !== -1) {
        this.currentTodoItems[index] = updatedItem;
      }
      
      console.log('Todo item updated:', updatedItem);
      return updatedItem;
    } catch (error) {
      console.error('Error updating todo item:', error);
      throw error;
    }
  }

  async deleteTodoItem(todoListId, itemId) {
    try {
      const response = await fetch(window.authService.endpoints.todoItem(todoListId, itemId), {
        method: 'DELETE',
        headers: window.authService.getAuthHeader()
      });

      if (!response.ok) {
        throw new Error('Failed to delete todo item');
      }

      this.currentTodoItems = this.currentTodoItems.filter(item => item.id !== itemId);
      
      console.log('Todo item deleted:', itemId);
    } catch (error) {
      console.error('Error deleting todo item:', error);
      throw error;
    }
  }

  setupEventListeners() {
    // Prevent multiple event listener attachments
    if (this.eventListenersSetup) {
      console.log('Event listeners already setup, skipping...');
      return;
    }
    
    console.log('Setting up event listeners...');
    
    // Todo list creation
    const createTodoListBtn = document.getElementById('createTodoListBtn');
    const createFirstTodoListBtn = document.getElementById('createFirstTodoListBtn');
    const closeTodoListCreateModal = document.getElementById('closeTodoListCreateModal');
    const cancelTodoListCreate = document.getElementById('cancelTodoListCreate');
    const todoListCreateForm = document.getElementById('todoListCreateForm');
    
    if (createTodoListBtn) {
      createTodoListBtn.addEventListener('click', () => this.openTodoListCreateModal());
    }
    
    if (createFirstTodoListBtn) {
      createFirstTodoListBtn.addEventListener('click', () => this.openTodoListCreateModal());
    }
    
    if (closeTodoListCreateModal) {
      closeTodoListCreateModal.addEventListener('click', () => this.closeTodoListCreateModal());
    }
    
    if (cancelTodoListCreate) {
      cancelTodoListCreate.addEventListener('click', () => this.closeTodoListCreateModal());
    }
    
    if (todoListCreateForm) {
      todoListCreateForm.addEventListener('submit', (e) => this.handleCreateTodoList(e));
    }

    // Todo list edit modal
    const closeTodoListEditModal = document.getElementById('closeTodoListEditModal');
    const todoListEditForm = document.getElementById('todoListEditForm');
    const cancelTodoListEdit = document.getElementById('cancelTodoListEdit');
    
    if (closeTodoListEditModal) {
      closeTodoListEditModal.addEventListener('click', () => this.closeTodoListEditModal());
    }
    
    if (cancelTodoListEdit) {
      cancelTodoListEdit.addEventListener('click', () => this.closeTodoListEditModal());
    }
    
    if (todoListEditForm) {
      todoListEditForm.addEventListener('submit', (e) => this.handleEditTodoList(e));
    }

    // Todo detail page navigation
    const backToDashboard = document.getElementById('backToDashboard');
    const editTodoDetailBtn = document.getElementById('editTodoDetailBtn');
    const addTodoItemDetailForm = document.getElementById('addTodoItemDetailForm');
    
    if (backToDashboard) {
      backToDashboard.addEventListener('click', () => this.showDashboardView());
    }
    
    if (editTodoDetailBtn) {
      editTodoDetailBtn.addEventListener('click', () => this.editCurrentTodoList());
    }
    
    if (addTodoItemDetailForm) {
      addTodoItemDetailForm.addEventListener('submit', (e) => this.handleAddTodoItemDetail(e));
    }

    // Todo detail filter buttons
    const filterAllTodos = document.getElementById('filterAllTodos');
    const filterPendingTodos = document.getElementById('filterPendingTodos');
    const filterCompletedTodos = document.getElementById('filterCompletedTodos');
    
    if (filterAllTodos) {
      filterAllTodos.addEventListener('click', () => this.filterTodoItems('all'));
    }
    
    if (filterPendingTodos) {
      filterPendingTodos.addEventListener('click', () => this.filterTodoItems('pending'));
    }
    
    if (filterCompletedTodos) {
      filterCompletedTodos.addEventListener('click', () => this.filterTodoItems('completed'));
    }
    
    // Mark event listeners as setup
    this.eventListenersSetup = true;
    console.log('Event listeners setup complete');
  }

  showDashboard() {
    this.currentView = 'dashboard';
    document.getElementById('dashboardView').classList.remove('hidden');
    this.updateDashboard();
  }

  async showTodoListDetail(todoList) {
    this.currentTodoList = todoList;
    this.currentView = 'todoDetail';
    
    // Load todo items
    await this.loadTodoItems(todoList.id);
    
    // Switch to todo detail view
    this.showTodoDetailView();
  }

  showTodoDetailView() {
    // Hide dashboard view and show todo detail view
    document.getElementById('dashboardView').classList.add('hidden');
    document.getElementById('todoDetailView').classList.remove('hidden');
    
    // Update todo detail view content
    this.updateTodoDetailViewContent();
    
    // Update todo items display in detail view
    this.updateTodoDetailItemsDisplay();
  }

  updateTodoDetailViewContent() {
    if (!this.currentTodoList) return;
    
    // Update header info
    document.getElementById('todoDetailTitle').textContent = this.currentTodoList.title;
    document.getElementById('todoDetailDescription').textContent = 
      this.currentTodoList.description || 'Açıklama yok';
    
    // Update stats
    const totalCount = this.currentTodoItems ? this.currentTodoItems.length : 0;
    const completedCount = this.currentTodoItems ? 
      this.currentTodoItems.filter(item => item.status === 1).length : 0;
    const pendingCount = totalCount - completedCount;
    
    document.getElementById('todoDetailTotalCount').textContent = totalCount;
    document.getElementById('todoDetailCompletedCount').textContent = completedCount;
    document.getElementById('todoDetailPendingCount').textContent = pendingCount;
  }

  updateTodoDetailItemsDisplay() {
    const container = document.getElementById('todoItemsDetailContainer');
    const emptyState = document.getElementById('emptyTodoItems');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!this.currentTodoItems || this.currentTodoItems.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }
    
    emptyState.classList.add('hidden');
    
    this.currentTodoItems.forEach(item => {
      const itemElement = this.createTodoDetailItemElement(item);
      container.appendChild(itemElement);
    });
  }

  createTodoDetailItemElement(item) {
    const div = document.createElement('div');
    div.className = 'card p-4 flex items-start space-x-4';
    
    const priorityColors = {
      0: 'text-gray-500',
      1: 'text-yellow-500', 
      2: 'text-red-500'
    };
    
    const priorityLabels = {
      0: 'Düşük',
      1: 'Orta',
      2: 'Yüksek'
    };
    
    div.innerHTML = `
      <div class="flex-shrink-0 pt-1">
        <input type="checkbox" 
               ${item.status === 1 ? 'checked' : ''} 
               class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
               onchange="window.app.toggleTodoItemDetail(${item.id}, this.checked)">
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-medium ${item.status === 1 ? 'line-through text-gray-500' : 'text-gray-900'}">${item.title}</h3>
          <div class="flex items-center space-x-2">
            <span class="text-xs px-2 py-1 rounded-full border ${priorityColors[item.severity]}">
              ${priorityLabels[item.severity]}
            </span>
            <button onclick="window.app.deleteTodoItemDetail(${item.id})" class="text-red-400 hover:text-red-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
        ${item.description ? `<p class="text-sm text-gray-600">${item.description}</p>` : ''}
        <div class="text-xs text-gray-400 mt-2">
          Oluşturulma: ${new Date(item.createdAt).toLocaleDateString('tr-TR')}
        </div>
      </div>
    `;
    return div;
  }

  showDashboardView() {
    // Hide todo detail view and show dashboard view
    document.getElementById('todoDetailView').classList.add('hidden');
    document.getElementById('dashboardView').classList.remove('hidden');
    
    // Reset current todo list
    this.currentTodoList = null;
    this.currentTodoItems = [];
    this.currentView = 'dashboard';
  }

  updateDashboard() {
    this.updatePartnerCards();
    this.updateTodoListsDisplay();
    this.updateStats();
  }

  updatePartnerCards() {
    const partner1Card = document.getElementById('partner1Card');
    const partner2Card = document.getElementById('partner2Card');
    
    if (!partner1Card || !partner2Card) return;
    
    // Partner 1 Card (Current User)
    if (this.partners.length > 0) {
      const partner1 = this.partners[0];
      const partner1Initial = partner1.username.charAt(0).toUpperCase();
      const partner1Color = partner1.colorCode || '#3B82F6';
      
      partner1Card.querySelector('.w-20').style.background = `linear-gradient(to bottom right, ${partner1Color}40, ${partner1Color})`;
      partner1Card.querySelector('.text-2xl').textContent = partner1Initial;
      partner1Card.querySelector('h3').textContent = partner1.username;
      partner1Card.querySelector('p').textContent = partner1.id === this.currentUser.id ? 'Ben' : 'Partner';
      
      // Calculate todo counts for partner 1 - include both user and partner todo lists
      const allTodoLists = [...this.todoLists, ...this.partnerTodoLists];
      const partner1TodoLists = allTodoLists.filter(list => list.ownerId === partner1.id);
      const partner1TotalItems = this.calculateTotalTodoItems(partner1TodoLists);
      const partner1CompletedItems = this.calculateCompletedTodoItems(partner1TodoLists);
      const partner1ActiveItems = partner1TotalItems - partner1CompletedItems;
      
      partner1Card.querySelector('.badge-success').textContent = `${partner1ActiveItems} Aktif`;
      partner1Card.querySelector('.badge-secondary').textContent = `${partner1CompletedItems} Tamamlandı`;
      
      // Enable partner 1 card
      partner1Card.classList.remove('opacity-50', 'cursor-not-allowed');
      partner1Card.classList.add('cursor-pointer');
    }
    
    // Partner 2 Card (Second Partner)
    if (this.partners.length > 1) {
      const partner2 = this.partners[1];
      const partner2Initial = partner2.username.charAt(0).toUpperCase();
      const partner2Color = partner2.colorCode || '#EF4444';
      
      partner2Card.querySelector('.w-20').style.background = `linear-gradient(to bottom right, ${partner2Color}40, ${partner2Color})`;
      partner2Card.querySelector('.text-2xl').textContent = partner2Initial;
      partner2Card.querySelector('h3').textContent = partner2.username;
      partner2Card.querySelector('p').textContent = partner2.id === this.currentUser.id ? 'Ben' : 'Partner';
      
      // Calculate todo counts for partner 2 - include both user and partner todo lists
      const allTodoLists = [...this.todoLists, ...this.partnerTodoLists];
      const partner2TodoLists = allTodoLists.filter(list => list.ownerId === partner2.id);
      const partner2TotalItems = this.calculateTotalTodoItems(partner2TodoLists);
      const partner2CompletedItems = this.calculateCompletedTodoItems(partner2TodoLists);
      const partner2ActiveItems = partner2TotalItems - partner2CompletedItems;
      
      partner2Card.querySelector('.badge-success').textContent = `${partner2ActiveItems} Aktif`;
      partner2Card.querySelector('.badge-secondary').textContent = `${partner2CompletedItems} Tamamlandı`;
      
      // Enable partner 2 card
      partner2Card.classList.remove('opacity-50', 'cursor-not-allowed');
      partner2Card.classList.add('cursor-pointer');
    } else {
      // Show placeholder for second partner
      partner2Card.querySelector('.w-20').style.background = 'linear-gradient(to bottom right, #E5E7EB40, #E5E7EB)';
      partner2Card.querySelector('.text-2xl').textContent = '?';
      partner2Card.querySelector('h3').textContent = 'Partner Bekleniyor';
      partner2Card.querySelector('p').textContent = 'Davet kodu ile katılım';
      
      partner2Card.querySelector('.badge-success').textContent = '0 Aktif';
      partner2Card.querySelector('.badge-secondary').textContent = '0 Tamamlandı';
      
      // Disable partner 2 card
      partner2Card.classList.add('opacity-50', 'cursor-not-allowed');
      partner2Card.classList.remove('cursor-pointer');
    }
  }

  calculateTotalTodoItems(todoLists) {
    if (!this.allTodoItems) return 0;
    
    const todoListIds = todoLists.map(list => list.id);
    return this.allTodoItems.filter(item => todoListIds.includes(item.todoListId)).length;
  }

  calculateCompletedTodoItems(todoLists) {
    if (!this.allTodoItems) return 0;
    
    const todoListIds = todoLists.map(list => list.id);
    return this.allTodoItems.filter(item => 
      todoListIds.includes(item.todoListId) && item.status === 1
    ).length;
  }

  updateTodoListsDisplay() {
    const container = document.getElementById('todoListsContainer');
    const emptyState = document.getElementById('emptyTodoLists');
    
    if (!container) return;
    
    const allTodoLists = [...this.todoLists, ...this.partnerTodoLists];
    
    if (allTodoLists.length === 0) {
      container.innerHTML = '';
      if (emptyState) {
        emptyState.classList.remove('hidden');
      }
      return;
    }
    
    if (emptyState) {
      emptyState.classList.add('hidden');
    }
    
    container.innerHTML = '';
    
    allTodoLists.forEach(todoList => {
      const todoListElement = this.createTodoListElement(todoList);
      container.appendChild(todoListElement);
    });
  }

  createTodoListElement(todoList) {
    const div = document.createElement('div');
    div.className = 'card cursor-pointer transform hover:scale-105 transition-all duration-300 group';
    div.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">${todoList.title}</h3>
            ${todoList.description ? `<p class="text-sm text-gray-600 mt-1">${todoList.description}</p>` : ''}
          </div>
          <div class="flex items-center space-x-2">
            ${todoList.ownerId === this.currentUser.id ? 
              '<span class="badge-primary text-xs">Benim</span>' : 
              '<span class="badge-secondary text-xs">Partner</span>'
            }
          </div>
        </div>
        
        <div class="flex items-center justify-between text-sm text-gray-500">
          <span>Oluşturulma: ${new Date(todoList.createdAt).toLocaleDateString('tr-TR')}</span>
          <span>Güncelleme: ${new Date(todoList.updatedAt).toLocaleDateString('tr-TR')}</span>
        </div>
        
        <div class="flex justify-end space-x-2">
          <button class="btn-secondary text-xs px-3 py-1" onclick="window.app.editTodoList(${todoList.id})">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
          <button class="btn-primary text-xs px-3 py-1" onclick="window.app.showTodoListDetailById(${todoList.id})">
            Aç
          </button>
        </div>
      </div>
    `;
    return div;
  }

  async showTodoListDetailById(todoListId) {
    const allTodoLists = [...this.todoLists, ...this.partnerTodoLists];
    const todoList = allTodoLists.find(list => list.id === todoListId);
    
    if (todoList) {
      await this.showTodoListDetail(todoList);
    } else {
      console.error('Todo list not found:', todoListId);
      showNotification('Todo listesi bulunamadı', 'error');
    }
  }

  getSeverityBadge(severity) {
    const badges = {
      0: '<span class="badge-secondary text-xs">Düşük</span>',
      1: '<span class="badge-warning text-xs">Orta</span>',
      2: '<span class="badge-danger text-xs">Yüksek</span>'
    };
    return badges[severity] || badges[1];
  }

  updateStats() {
    const allTodoLists = [...this.todoLists, ...this.partnerTodoLists];
    const totalLists = allTodoLists.length;
    
    const statsContainer = document.querySelector('#dashboardView .grid-cols-1.md\\:grid-cols-3');
    if (statsContainer) {
      const statElements = statsContainer.querySelectorAll('.card');
      if (statElements.length >= 3) {
        statElements[0].querySelector('.text-2xl').textContent = totalLists;
        statElements[1].querySelector('.text-2xl').textContent = this.todoLists.length;
        statElements[2].querySelector('.text-2xl').textContent = this.partnerTodoLists.length;
        
        statElements[0].querySelector('.text-sm').textContent = 'Toplam Liste';
        statElements[1].querySelector('.text-sm').textContent = 'Benim Listelerim';
        statElements[2].querySelector('.text-sm').textContent = 'Partner Listeleri';
      }
    }
  }

  // Modal handlers
  openTodoListCreateModal() {
    document.getElementById('todoListCreateModal').classList.remove('hidden');
    document.getElementById('todoListTitle').focus();
  }

  closeTodoListCreateModal() {
    document.getElementById('todoListCreateModal').classList.add('hidden');
    document.getElementById('todoListCreateForm').reset();
    document.getElementById('todoListCreateError').classList.add('hidden');
  }

  closeTodoListEditModal() {
    const modal = document.getElementById('todoListEditModal');
    const form = document.getElementById('todoListEditForm');
    const errorDiv = document.getElementById('todoListEditError');
    
    modal.classList.add('hidden');
    form.reset();
    errorDiv.classList.add('hidden');
    this.currentEditingTodoList = null;
  }

  async handleCreateTodoList(e) {
    e.preventDefault();
    
    const title = document.getElementById('todoListTitle').value.trim();
    const description = document.getElementById('todoListDescription').value.trim();
    
    if (!title) return;
    
    try {
      const todoListData = { title, description };
      await this.createTodoList(todoListData);
      
      this.closeTodoListCreateModal();
      this.updateDashboard();
      
      showNotification('Todo listesi başarıyla oluşturuldu!', 'success');
    } catch (error) {
      console.error('Error creating todo list:', error);
      const errorElement = document.getElementById('todoListCreateError');
      errorElement.textContent = 'Todo listesi oluşturulurken bir hata oluştu';
      errorElement.classList.remove('hidden');
    }
  }

  async deleteTodoItem(todoListId, itemId) {
    if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      await this.deleteTodoItem(todoListId, itemId);
      this.updateTodoItemsDisplay();
      showNotification('Görev başarıyla silindi!', 'success');
    } catch (error) {
      console.error('Error deleting todo item:', error);
      showNotification('Görev silinirken bir hata oluştu', 'error');
    }
  }

  editTodoList(todoListId) {
    const allTodoLists = [...this.todoLists, ...this.partnerTodoLists];
    const todoList = allTodoLists.find(list => list.id === todoListId);
    
    if (!todoList) {
      console.error('Todo list not found:', todoListId);
      showNotification('Todo listesi bulunamadı', 'error');
      return;
    }
    
    // Check if user owns this todo list
    if (todoList.ownerId !== this.currentUser.id) {
      showNotification('Bu listeyi düzenleme yetkiniz yok', 'error');
      return;
    }
    
    this.currentEditingTodoList = todoList;
    this.openTodoListEditModal();
  }

  openTodoListEditModal() {
    if (!this.currentEditingTodoList) return;
    
    const modal = document.getElementById('todoListEditModal');
    const titleInput = document.getElementById('todoListEditTitle');
    const descriptionInput = document.getElementById('todoListEditDescription');
    const errorDiv = document.getElementById('todoListEditError');
    
    // Populate form with current values
    titleInput.value = this.currentEditingTodoList.title;
    descriptionInput.value = this.currentEditingTodoList.description || '';
    
    // Hide error and show modal
    errorDiv.classList.add('hidden');
    modal.classList.remove('hidden');
    titleInput.focus();
  }

  async handleEditTodoList(e) {
    e.preventDefault();
    
    if (!this.currentEditingTodoList) return;
    
    const title = document.getElementById('todoListEditTitle').value.trim();
    const description = document.getElementById('todoListEditDescription').value.trim();
    const errorDiv = document.getElementById('todoListEditError');
    const buttonText = document.getElementById('todoListEditButtonText');
    const spinner = document.getElementById('todoListEditSpinner');
    
    if (!title) {
      errorDiv.textContent = 'Liste başlığı gereklidir';
      errorDiv.classList.remove('hidden');
      return;
    }
    
    try {
      // Set loading state
      buttonText.style.display = 'none';
      spinner.classList.remove('hidden');
      errorDiv.classList.add('hidden');
      
      const updates = { title, description };
      await this.updateTodoList(this.currentEditingTodoList.id, updates);
      
      this.closeTodoListEditModal();
      this.updateDashboard();
      
      showNotification('Todo listesi başarıyla güncellendi!', 'success');
    } catch (error) {
      console.error('Error updating todo list:', error);
      errorDiv.textContent = 'Todo listesi güncellenirken bir hata oluştu';
      errorDiv.classList.remove('hidden');
    } finally {
      // Reset loading state
      buttonText.style.display = 'inline';
      spinner.classList.add('hidden');
    }
  }

  editCurrentTodoList() {
    if (this.currentTodoList) {
      this.editTodoList(this.currentTodoList.id);
    }
  }

  async toggleTodoItemDetail(itemId, isCompleted) {
    if (!this.currentTodoList) return;
    
    try {
      await this.updateTodoItem(this.currentTodoList.id, itemId, { 
        status: isCompleted ? 1 : 0 
      });
      this.updateTodoDetailItemsDisplay();
      this.updateTodoDetailViewContent(); // Update stats
    } catch (error) {
      console.error('Error toggling todo item:', error);
      showNotification('Görev güncellenirken bir hata oluştu', 'error');
    }
  }

  async deleteTodoItemDetail(itemId) {
    if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      await this.deleteTodoItem(this.currentTodoList.id, itemId);
      this.updateTodoDetailItemsDisplay();
      this.updateTodoDetailViewContent(); // Update stats
      showNotification('Görev başarıyla silindi!', 'success');
    } catch (error) {
      console.error('Error deleting todo item:', error);
      showNotification('Görev silinirken bir hata oluştu', 'error');
    }
  }

  async handleAddTodoItemDetail(e) {
    e.preventDefault();
    
    const title = document.getElementById('todoItemDetailTitle').value.trim();
    const description = document.getElementById('todoItemDetailDescription').value.trim();
    const severity = parseInt(document.getElementById('todoItemDetailSeverity').value);
    
    if (!title || !this.currentTodoList) return;
    
    try {
      const itemData = { title, description, severity };
      await this.addTodoItem(this.currentTodoList.id, itemData);
      
      // Clear form
      document.getElementById('todoItemDetailTitle').value = '';
      document.getElementById('todoItemDetailDescription').value = '';
      document.getElementById('todoItemDetailSeverity').value = '1';
      
      // Refresh display
      this.updateTodoDetailItemsDisplay();
      this.updateTodoDetailViewContent(); // Update stats
      
      showNotification('Görev başarıyla eklendi!', 'success');
    } catch (error) {
      console.error('Error adding todo item:', error);
      showNotification('Görev eklenirken bir hata oluştu', 'error');
    }
  }

  filterTodoItems(filter) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}Todos`).classList.add('active');
    
    // Filter items
    let filteredItems = this.currentTodoItems || [];
    
    switch (filter) {
      case 'pending':
        filteredItems = filteredItems.filter(item => item.status === 0);
        break;
      case 'completed':
        filteredItems = filteredItems.filter(item => item.status === 1);
        break;
      case 'all':
      default:
        // Show all items
        break;
    }
    
    // Update display with filtered items
    this.updateTodoDetailItemsDisplayWithFilter(filteredItems);
  }

  updateTodoDetailItemsDisplayWithFilter(filteredItems) {
    const container = document.getElementById('todoItemsDetailContainer');
    const emptyState = document.getElementById('emptyTodoItems');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!filteredItems || filteredItems.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }
    
    emptyState.classList.add('hidden');
    
    filteredItems.forEach(item => {
      const itemElement = this.createTodoDetailItemElement(item);
      container.appendChild(itemElement);
    });
  }

  // Cleanup method for logout
  cleanup() {
    console.log('Cleaning up app data...');
    this.currentUser = null;
    this.todoLists = [];
    this.partnerTodoLists = [];
    this.currentTodoList = null;
    this.currentEditingTodoList = null;
    this.currentTodoItems = [];
    this.allTodoItems = [];
    this.currentView = 'dashboard';
    this.couple = null;
    this.partners = [];
    this.eventListenersSetup = false; // Reset event listeners flag
  }
}

// Global app instance
window.app = new App(); 