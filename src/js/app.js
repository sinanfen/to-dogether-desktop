// Main Application
class App {
  constructor() {
    this.currentUser = null;
    this.todoLists = [];
    this.partnerTodoLists = [];
    this.currentTodoList = null;
    this.currentTodoItems = [];
    this.allTodoItems = [];
    this.currentView = 'dashboard';
    this.couple = null;
    this.partners = [];
  }

  async init() {
    try {
      console.log('App initialization started...');
      
      // Get current user
      this.currentUser = await window.authService.getCurrentUser();
      console.log('Current user loaded:', this.currentUser);
      
      // Load couple info
      await this.loadCoupleInfo();
      console.log('Couple info loaded');
      
      // Load todo lists
      await this.loadTodoLists();
      console.log('Todo lists loaded');
      
      // Setup event listeners
      this.setupEventListeners();
      console.log('Event listeners setup complete');
      
      // Show dashboard
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
      // For now, we'll create a simple couple structure based on current user
      // In the future, this should come from a /couples/me endpoint
      this.couple = {
        id: this.currentUser.coupleId || 1,
        partners: [this.currentUser]
      };
      
      // If we have a coupleId, we should load the partner info
      if (this.currentUser.coupleId) {
        // TODO: Load partner info from API
        // For now, we'll simulate it based on coupleId
        if (this.currentUser.coupleId === 2) {
          // Simulate couple with Sinan and Gülşen
          if (this.currentUser.id === 2) {
            // Current user is Sinan, add Gülşen as partner
            this.partners = [
              this.currentUser,
              {
                id: 3,
                username: "Gülşen",
                colorCode: "#EF4444",
                coupleId: 2,
                createdAt: "2025-07-07T01:56:21.246+03:00"
              }
            ];
          } else if (this.currentUser.id === 3) {
            // Current user is Gülşen, add Sinan as partner
            this.partners = [
              {
                id: 2,
                username: "Sinan",
                colorCode: "#3B82F6",
                coupleId: 2,
                createdAt: "2025-07-07T01:44:30.733+03:00"
              },
              this.currentUser
            ];
          }
        } else {
          this.partners = [this.currentUser];
        }
      } else {
        this.partners = [this.currentUser];
      }
      
      console.log('Couple info loaded:', this.couple);
      console.log('Partners:', this.partners);
    } catch (error) {
      console.error('Error loading couple info:', error);
      // Fallback to current user only
      this.couple = { id: 1, partners: [this.currentUser] };
      this.partners = [this.currentUser];
    }
  }

  async loadTodoLists() {
    try {
      console.log('Loading todo lists...');
      
      // Load user's own todo lists
      const userResponse = await fetch(window.authService.endpoints.todoLists, {
        headers: window.authService.getAuthHeader()
      });

      if (userResponse.ok) {
        this.todoLists = await userResponse.json();
        console.log('User todo lists loaded:', this.todoLists.length);
      } else {
        console.error('Failed to load user todo lists:', userResponse.status);
        this.todoLists = [];
        // Don't throw error, just continue with empty list
      }

      // Load partner's todo lists
      const partnerResponse = await fetch(window.authService.endpoints.partnerTodoLists, {
        headers: window.authService.getAuthHeader()
      });

      if (partnerResponse.ok) {
        this.partnerTodoLists = await partnerResponse.json();
        console.log('Partner todo lists loaded:', this.partnerTodoLists.length);
      } else {
        console.error('Failed to load partner todo lists:', partnerResponse.status);
        this.partnerTodoLists = [];
        // Don't throw error, just continue with empty list
      }
      
      // Load todo items for all lists to calculate stats
      await this.loadAllTodoItems();
      
      console.log('Todo lists loading complete:', { user: this.todoLists.length, partner: this.partnerTodoLists.length });
    } catch (error) {
      console.error('Error loading todo lists:', error);
      this.todoLists = [];
      this.partnerTodoLists = [];
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

    // Todo list detail modal
    const closeTodoListDetailModal = document.getElementById('closeTodoListDetailModal');
    const editTodoListBtn = document.getElementById('editTodoListBtn');
    const addTodoItemForm = document.getElementById('addTodoItemForm');
    
    if (closeTodoListDetailModal) {
      closeTodoListDetailModal.addEventListener('click', () => this.closeTodoListDetailModal());
    }
    
    if (editTodoListBtn) {
      editTodoListBtn.addEventListener('click', () => this.editCurrentTodoList());
    }
    
    if (addTodoItemForm) {
      addTodoItemForm.addEventListener('submit', (e) => this.handleAddTodoItem(e));
    }
  }

  showDashboard() {
    this.currentView = 'dashboard';
    document.getElementById('dashboardView').classList.remove('hidden');
    this.updateDashboard();
  }

  async showTodoListDetail(todoList) {
    this.currentTodoList = todoList;
    this.currentView = 'todoListDetail';
    
    // Load todo items
    await this.loadTodoItems(todoList.id);
    
    // Update modal content
    document.getElementById('todoListDetailTitle').textContent = todoList.title;
    document.getElementById('todoListDetailDescription').textContent = todoList.description || 'Açıklama yok';
    
    // Show modal
    document.getElementById('todoListDetailModal').classList.remove('hidden');
    
    // Update todo items display
    this.updateTodoItemsDisplay();
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
      
      // Calculate todo counts for partner 1
      const partner1TodoLists = this.todoLists.filter(list => list.ownerId === partner1.id);
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
      
      // Calculate todo counts for partner 2
      const partner2TodoLists = this.todoLists.filter(list => list.ownerId === partner2.id);
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

  updateTodoItemsDisplay() {
    const container = document.getElementById('todoItemsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!this.currentTodoItems || this.currentTodoItems.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <p>Henüz görev eklenmemiş</p>
        </div>
      `;
      return;
    }
    
    this.currentTodoItems.forEach(item => {
      const itemElement = this.createTodoItemElement(item);
      container.appendChild(itemElement);
    });
  }

  getSeverityBadge(severity) {
    const badges = {
      0: '<span class="badge-secondary text-xs">Düşük</span>',
      1: '<span class="badge-warning text-xs">Orta</span>',
      2: '<span class="badge-danger text-xs">Yüksek</span>'
    };
    return badges[severity] || badges[1];
  }

  createTodoItemElement(item) {
    const div = document.createElement('div');
    div.className = 'card p-4';
    div.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center space-x-2 mb-2">
            <input type="checkbox" 
                   ${item.status === 1 ? 'checked' : ''} 
                   class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                   onchange="window.app.toggleTodoItem(${item.id}, this.checked)">
            <h3 class="font-medium ${item.status === 1 ? 'line-through text-gray-500' : 'text-gray-900'}">${item.title}</h3>
            ${this.getSeverityBadge(item.severity)}
          </div>
          ${item.description ? `<p class="text-sm text-gray-600 ml-6">${item.description}</p>` : ''}
        </div>
        <button onclick="window.app.deleteTodoItem(${this.currentTodoList.id}, ${item.id})" class="text-red-400 hover:text-red-600 ml-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    `;
    return div;
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

  closeTodoListDetailModal() {
    document.getElementById('todoListDetailModal').classList.add('hidden');
    this.currentTodoList = null;
    this.currentTodoItems = [];
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

  async handleAddTodoItem(e) {
    e.preventDefault();
    
    const title = document.getElementById('todoItemTitle').value.trim();
    const description = document.getElementById('todoItemDescription').value.trim();
    const severity = parseInt(document.getElementById('todoItemSeverity').value);
    
    if (!title || !this.currentTodoList) return;
    
    try {
      const itemData = { title, description, severity };
      await this.addTodoItem(this.currentTodoList.id, itemData);
      
      // Clear form
      document.getElementById('todoItemTitle').value = '';
      document.getElementById('todoItemDescription').value = '';
      document.getElementById('todoItemSeverity').value = '1';
      
      // Refresh display
      this.updateTodoItemsDisplay();
      
      showNotification('Görev başarıyla eklendi!', 'success');
    } catch (error) {
      console.error('Error adding todo item:', error);
      showNotification('Görev eklenirken bir hata oluştu', 'error');
    }
  }

  async toggleTodoItem(itemId, isCompleted) {
    if (!this.currentTodoList) return;
    
    try {
      await this.updateTodoItem(this.currentTodoList.id, itemId, { 
        status: isCompleted ? 1 : 0 
      });
      this.updateTodoItemsDisplay();
    } catch (error) {
      console.error('Error toggling todo item:', error);
      showNotification('Görev güncellenirken bir hata oluştu', 'error');
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
    // TODO: Implement edit todo list functionality
    console.log('Edit todo list:', todoListId);
  }

  editCurrentTodoList() {
    if (this.currentTodoList) {
      this.editTodoList(this.currentTodoList.id);
    }
  }
}

// Global app instance
window.app = new App(); 