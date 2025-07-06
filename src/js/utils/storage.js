// Local Storage Utility
class StorageManager {
  constructor() {
    this.storageKey = 'todogether_data';
  }

  // Save data to local storage
  saveData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }

  // Load data from local storage
  loadData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : this.getDefaultData();
    } catch (error) {
      console.error('Error loading data:', error);
      return this.getDefaultData();
    }
  }

  // Get default data structure
  getDefaultData() {
    return {
      partners: {
        partner1: {
          id: 'partner1',
          name: 'Sinan',
          initial: 'S',
          color: 'primary',
          todos: [
            {
              id: '1',
              title: 'Televizyon Alınacak',
              description: '75" TCL Marka Smart TV - 4K Ultra HD',
              priority: 'high',
              status: 'pending',
              completed: false,
              createdAt: '2024-01-15T10:30:00.000Z',
              category: 'electronics'
            },
            {
              id: '2',
              title: 'Mobilya Mağazalarını Araştır',
              description: 'Yatak odası takımı için fiyat karşılaştırması yap',
              priority: 'medium',
              status: 'in-progress',
              completed: false,
              createdAt: '2024-01-14T14:20:00.000Z',
              category: 'furniture'
            },
            {
              id: '3',
              title: 'Düğün Davetiyelerini Hazırla',
              description: 'Tasarımı onayla ve baskı için gönder',
              priority: 'urgent',
              status: 'pending',
              completed: false,
              createdAt: '2024-01-13T09:15:00.000Z',
              category: 'wedding'
            },
            {
              id: '4',
              title: 'Araba Bakımı',
              description: 'Lastik değişimi ve yağ değişimi yaptır',
              priority: 'low',
              status: 'completed',
              completed: true,
              createdAt: '2024-01-10T16:45:00.000Z',
              completedAt: '2024-01-12T11:30:00.000Z',
              category: 'maintenance'
            }
          ]
        },
        partner2: {
          id: 'partner2',
          name: 'Gülşen',
          initial: 'G',
          color: 'secondary',
          todos: [
            {
              id: '5',
              title: 'Çeyiz Listesi Hazırla',
              description: 'Eksik olan eşyaları not et ve alışveriş planı yap',
              priority: 'high',
              status: 'in-progress',
              completed: false,
              createdAt: '2024-01-15T11:00:00.000Z',
              category: 'wedding'
            },
            {
              id: '6',
              title: 'Düğün Mekanı Görüşmesi',
              description: 'Salon sahibi ile detayları konuş ve sözleşme imzala',
              priority: 'urgent',
              status: 'pending',
              completed: false,
              createdAt: '2024-01-14T13:30:00.000Z',
              category: 'wedding'
            },
            {
              id: '7',
              title: 'Gelinlik Denemesi',
              description: 'Randevu al ve 3 farklı model dene',
              priority: 'medium',
              status: 'pending',
              completed: false,
              createdAt: '2024-01-13T15:20:00.000Z',
              category: 'wedding'
            },
            {
              id: '8',
              title: 'Ev Temizliği',
              description: 'Haftalık temizlik rutini - banyo ve mutfak',
              priority: 'low',
              status: 'completed',
              completed: true,
              createdAt: '2024-01-11T08:00:00.000Z',
              completedAt: '2024-01-11T12:00:00.000Z',
              category: 'household'
            },
            {
              id: '9',
              title: 'Fotoğrafçı Seçimi',
              description: 'Portfolio incele ve fiyat teklifleri al',
              priority: 'medium',
              status: 'completed',
              completed: true,
              createdAt: '2024-01-09T10:15:00.000Z',
              completedAt: '2024-01-12T14:30:00.000Z',
              category: 'wedding'
            }
          ]
        }
      },
      settings: {
        theme: 'light',
        notifications: true,
        autoSync: true,
        partnerNames: {
          partner1: 'Sinan',
          partner2: 'Gülşen'
        }
      },
      lastSync: null
    };
  }

  // Save partner data
  savePartnerData(partnerId, data) {
    const allData = this.loadData();
    allData.partners[partnerId] = { ...allData.partners[partnerId], ...data };
    return this.saveData(allData);
  }

  // Get partner data
  getPartnerData(partnerId) {
    const allData = this.loadData();
    return allData.partners[partnerId] || null;
  }

  // Add todo to partner
  addTodo(partnerId, todo) {
    const allData = this.loadData();
    if (!allData.partners[partnerId]) return false;
    
    todo.id = this.generateId();
    todo.createdAt = new Date().toISOString();
    todo.completed = false;
    todo.status = 'pending';
    
    allData.partners[partnerId].todos.push(todo);
    return this.saveData(allData);
  }

  // Update todo
  updateTodo(partnerId, todoId, updates) {
    const allData = this.loadData();
    if (!allData.partners[partnerId]) return false;
    
    const todoIndex = allData.partners[partnerId].todos.findIndex(t => t.id === todoId);
    if (todoIndex === -1) return false;
    
    allData.partners[partnerId].todos[todoIndex] = {
      ...allData.partners[partnerId].todos[todoIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.saveData(allData);
  }

  // Delete todo
  deleteTodo(partnerId, todoId) {
    const allData = this.loadData();
    if (!allData.partners[partnerId]) return false;
    
    allData.partners[partnerId].todos = allData.partners[partnerId].todos.filter(t => t.id !== todoId);
    return this.saveData(allData);
  }

  // Get todos for partner
  getTodos(partnerId) {
    const allData = this.loadData();
    return allData.partners[partnerId]?.todos || [];
  }

  // Get statistics
  getStats() {
    const allData = this.loadData();
    let totalTodos = 0;
    let completedTodos = 0;
    let pendingTodos = 0;

    Object.values(allData.partners).forEach(partner => {
      totalTodos += partner.todos.length;
      partner.todos.forEach(todo => {
        if (todo.completed) {
          completedTodos++;
        } else {
          pendingTodos++;
        }
      });
    });

    return {
      total: totalTodos,
      completed: completedTodos,
      pending: pendingTodos
    };
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Clear all data
  clearData() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }
}

// Export for use in other files
window.StorageManager = StorageManager; 