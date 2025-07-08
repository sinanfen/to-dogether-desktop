// Todo Item Component
class TodoItem {
  constructor(todo, partnerId, onUpdate, onDelete) {
    this.todo = todo;
    this.partnerId = partnerId;
    this.onUpdate = onUpdate;
    this.onDelete = onDelete;
    this.element = null;
  }

  // Create todo item element
  create() {
    const todoElement = document.createElement("div");
    todoElement.className = `card todo-item ${
      this.todo.completed ? "opacity-75" : ""
    } cursor-move hover:shadow-lg transition-all duration-200`;
    todoElement.draggable = true;
    todoElement.dataset.todoId = this.todo.id;
    todoElement.dataset.priority = this.todo.priority;

    if (this.todo.completed) {
      todoElement.classList.add("completed");
    }

    todoElement.innerHTML = `
      <div class="flex items-start space-x-4">
        <!-- Checkbox -->
        <div class="flex-shrink-0 pt-1">
          <input type="checkbox" 
                 class="w-5 h-5 rounded border-gray-300 transition-colors text-primary-600 focus:ring-primary-500" 
                 ${this.todo.completed ? "checked" : ""}>
        </div>
        
        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center mb-1 space-x-2">
                <h3 class="text-sm font-semibold text-gray-900 ${
                  this.todo.completed ? "line-through" : ""
                }">
                  ${this.escapeHtml(this.todo.title)}
                </h3>
                ${this.getCategoryBadge()}
              </div>
              ${
                this.todo.description
                  ? `
                <p class="text-sm text-gray-600 mt-1 ${
                  this.todo.completed ? "line-through" : ""
                } leading-relaxed">
                  ${this.escapeHtml(this.todo.description)}
                </p>
              `
                  : ""
              }
            </div>
            
            <!-- Priority Badge -->
            <div class="flex-shrink-0 ml-3">
              ${this.getPriorityBadge()}
            </div>
          </div>
          
          <!-- Meta Info -->
          <div class="flex justify-between items-center mt-4">
            <div class="flex items-center space-x-3">
              <span class="text-xs text-gray-400">
                ${this.formatDate(this.todo.createdAt)}
              </span>
              ${
                this.todo.completed && this.todo.completedAt
                  ? `
                <span class="text-xs font-medium text-success-600">
                  ✓ ${this.formatDate(this.todo.completedAt)}
                </span>
              `
                  : ""
              }
            </div>
            
            <!-- Status Dropdown -->
            <div class="flex items-center space-x-2">
              <select class="px-2 py-1 text-xs bg-white rounded-md border border-gray-200 status-dropdown focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="0" ${
                  this.todo.status === 0 ? "selected" : ""
                }>Bekliyor</option>
                <option value="1" ${
                  this.todo.status === 1 ? "selected" : ""
                }>Tamamlandı</option>
              </select>
              
              <!-- Actions -->
              <div class="flex items-center space-x-1">
                <button class="p-1.5 text-gray-400 rounded-md transition-all duration-200 edit-todo-btn hover:text-primary-600 hover:bg-primary-50">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
                <button class="p-1.5 text-gray-400 rounded-md transition-all duration-200 delete-todo-btn hover:text-danger-600 hover:bg-danger-50">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.element = todoElement;
    this.attachEventListeners();
    return todoElement;
  }

  // Attach event listeners
  attachEventListeners() {
    const checkbox = this.element.querySelector('input[type="checkbox"]');
    const statusDropdown = this.element.querySelector(".status-dropdown");
    const editBtn = this.element.querySelector(".edit-todo-btn");
    const deleteBtn = this.element.querySelector(".delete-todo-btn");

    // Checkbox change
    checkbox.addEventListener("change", (e) => {
      const newStatus = e.target.checked ? 1 : 0;
      this.todo.status = newStatus;
      this.todo.completed = e.target.checked;

      if (e.target.checked) {
        this.todo.completedAt = new Date().toISOString();
      } else {
        delete this.todo.completedAt;
      }

      this.updateVisualState();
      this.onUpdate(this.todo.id, {
        status: newStatus,
        completed: this.todo.completed,
        completedAt: this.todo.completedAt,
      });
    });

    // Status dropdown change
    statusDropdown.addEventListener("change", (e) => {
      const newStatus = parseInt(e.target.value);
      this.todo.status = newStatus;
      this.todo.completed = newStatus === 1;

      if (newStatus === 1 && !this.todo.completedAt) {
        this.todo.completedAt = new Date().toISOString();
      } else if (newStatus !== 1) {
        delete this.todo.completedAt;
      }

      this.updateVisualState();
      this.onUpdate(this.todo.id, {
        status: newStatus,
        completed: this.todo.completed,
        completedAt: this.todo.completedAt,
      });
    });

    // Edit button
    editBtn.addEventListener("click", () => {
      this.showEditModal();
    });

    // Delete button
    deleteBtn.addEventListener("click", () => {
      this.showDeleteConfirmation();
    });

    // Drag events
    this.element.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", this.todo.id);
      this.element.classList.add("opacity-50", "scale-95");
    });

    this.element.addEventListener("dragend", () => {
      this.element.classList.remove("opacity-50", "scale-95");
    });
  }

  // Update visual state
  updateVisualState() {
    const title = this.element.querySelector("h3");
    const description = this.element.querySelector("p");

    // Update priority data attribute
    this.element.dataset.priority = this.todo.priority;

    if (this.todo.completed) {
      this.element.classList.add("opacity-75", "completed");
      title.classList.add("line-through");
      if (description) description.classList.add("line-through");
    } else {
      this.element.classList.remove("opacity-75", "completed");
      title.classList.remove("line-through");
      if (description) description.classList.remove("line-through");
    }
  }

  // Show edit modal
  showEditModal() {
    const modal = document.createElement("div");
    modal.className =
      "flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50";

    modal.innerHTML = `
      <div class="p-6 mx-4 w-full max-w-md bg-white rounded-lg">
        <h3 class="mb-4 text-lg font-semibold text-gray-900">Görevi Düzenle</h3>
        
        <form id="editTodoForm" class="space-y-4">
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Başlık</label>
            <input type="text" id="editTodoTitle" value="${this.escapeHtml(
              this.todo.title
            )}" class="input" required>
          </div>
          
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Açıklama</label>
            <textarea id="editTodoDescription" class="h-20 resize-none input">${this.escapeHtml(
              this.todo.description || ""
            )}</textarea>
          </div>
          
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Öncelik</label>
            <select id="editTodoPriority" class="input">
              <option value="0" ${
                this.todo.severity === 0 ? "selected" : ""
              }>Düşük</option>
              <option value="1" ${
                this.todo.severity === 1 ? "selected" : ""
              }>Orta</option>
              <option value="2" ${
                this.todo.severity === 2 ? "selected" : ""
              }>Yüksek</option>
            </select>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button type="button" id="cancelEdit" class="btn-secondary">İptal</button>
            <button type="submit" class="btn-primary">Kaydet</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    const form = modal.querySelector("#editTodoForm");
    const cancelBtn = modal.querySelector("#cancelEdit");

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const updates = {
        title: modal.querySelector("#editTodoTitle").value.trim(),
        description: modal.querySelector("#editTodoDescription").value.trim(),
        severity: parseInt(modal.querySelector("#editTodoPriority").value),
      };

      this.todo = { ...this.todo, ...updates };
      this.onUpdate(this.todo.id, updates);
      this.updateElement();
      document.body.removeChild(modal);
    });

    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    // Close on outside click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // Show delete confirmation
  showDeleteConfirmation() {
    const modal = document.createElement("div");
    modal.className =
      "flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50";

    modal.innerHTML = `
      <div class="p-6 mx-4 w-full max-w-md bg-white rounded-lg">
        <h3 class="mb-4 text-lg font-semibold text-gray-900">Görevi Sil</h3>
        <p class="mb-6 text-gray-600">"${this.escapeHtml(
          this.todo.title
        )}" görevini silmek istediğinizden emin misiniz?</p>
        
        <div class="flex justify-end space-x-3">
          <button id="cancelDelete" class="btn-secondary">İptal</button>
          <button id="confirmDelete" class="btn-danger">Sil</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    const cancelBtn = modal.querySelector("#cancelDelete");
    const confirmBtn = modal.querySelector("#confirmDelete");

    confirmBtn.addEventListener("click", () => {
      this.onDelete(this.todo.id);
      document.body.removeChild(modal);
    });

    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    // Close on outside click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // Update element content
  updateElement() {
    const newElement = this.create();
    if (this.element.parentNode) {
      this.element.parentNode.replaceChild(newElement, this.element);
    }
    this.element = newElement;
  }

  // Get priority badge
  getPriorityBadge() {
    const config = window.AppConfig;
    const severityMapping = config.getSeverityMapping();
    const severity =
      this.todo.severity || this.convertPriorityToSeverity(this.todo.priority);
    const mapping = severityMapping[severity] || severityMapping[1];

    return `<span class="badge ${mapping.class} text-xs px-2 py-1 rounded-full font-medium">${mapping.name}</span>`;
  }

  // Convert priority to severity (for backward compatibility)
  convertPriorityToSeverity(priority) {
    const mapping = {
      low: 0,
      medium: 1,
      high: 2,
      urgent: 2,
    };
    return mapping[priority] || 1;
  }

  // Convert severity to priority (for backward compatibility)
  convertSeverityToPriority(severity) {
    const mapping = {
      0: "low",
      1: "medium",
      2: "high",
    };
    return mapping[severity] || "medium";
  }

  // Get category badge
  getCategoryBadge() {
    const categories = {
      wedding: "Düğün",
      electronics: "Elektronik",
      furniture: "Mobilya",
      household: "Ev",
      maintenance: "Bakım",
      shopping: "Alışveriş",
      work: "İş",
      personal: "Kişisel",
    };

    const categoryName = categories[this.todo.category] || "Diğer";
    const colors = {
      wedding: "bg-pink-100 text-pink-700",
      electronics: "bg-purple-100 text-purple-700",
      furniture: "bg-amber-100 text-amber-700",
      household: "bg-green-100 text-green-700",
      maintenance: "bg-blue-100 text-blue-700",
      shopping: "bg-indigo-100 text-indigo-700",
      work: "bg-gray-100 text-gray-700",
      personal: "bg-teal-100 text-teal-700",
    };

    const colorClass =
      colors[this.todo.category] || "bg-gray-100 text-gray-700";

    return `<span class="badge ${colorClass} text-xs px-2 py-0.5 rounded-full font-medium">${categoryName}</span>`;
  }

  // Format date
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Escape HTML
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Remove element
  remove() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

// Export for use in other files
window.TodoItem = TodoItem;
