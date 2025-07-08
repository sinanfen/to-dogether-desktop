// Partner Card Component
class PartnerCard {
  constructor(partner, onClick) {
    this.partner = partner;
    this.onClick = onClick;
    this.element = null;
  }

  // Create partner card element
  create() {
    const cardElement = document.createElement("div");
    cardElement.className = `transition-all duration-300 transform cursor-pointer card hover:scale-105 group`;
    cardElement.dataset.partnerId = this.partner.id;

    const colorClass = this.getColorClass();
    const gradientClass = this.getGradientClass();

    cardElement.innerHTML = `
      <div class="space-y-4 text-center">
        <div class="w-20 h-20 ${gradientClass} rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:shadow-xl transition-shadow">
          ${this.partner.initial}
        </div>
        <div>
          <div class="flex justify-center items-center space-x-2">
            <h3 class="text-xl font-semibold text-gray-900 partner-name" data-partner-id="${
              this.partner.id
            }">${this.escapeHtml(this.partner.name)}</h3>
            <button class="p-1 text-gray-400 rounded-md opacity-0 transition-opacity duration-200 edit-name-btn group-hover:opacity-100 hover:text-primary-600 hover:bg-primary-50">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
          </div>
          <p class="text-sm text-gray-500">Partner ${
            this.partner.id === "partner1" ? "1" : "2"
          }</p>
        </div>
        <div class="flex justify-center space-x-2">
          ${this.getStatsBadges()}
        </div>
      </div>
    `;

    this.element = cardElement;
    this.attachEventListeners();
    return cardElement;
  }

  // Attach event listeners
  attachEventListeners() {
    this.element.addEventListener("click", (e) => {
      // Don't trigger card click if clicking on edit button
      if (e.target.closest(".edit-name-btn")) {
        return;
      }
      this.onClick(this.partner.id);
    });

    // Edit name button
    const editNameBtn = this.element.querySelector(".edit-name-btn");
    if (editNameBtn) {
      editNameBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showEditNameModal();
      });
    }

    // Hover effects
    this.element.addEventListener("mouseenter", () => {
      this.element.classList.add("ring-2", "ring-primary-200");
    });

    this.element.addEventListener("mouseleave", () => {
      this.element.classList.remove("ring-2", "ring-primary-200");
    });
  }

  // Update stats
  updateStats(stats) {
    const statsContainer = this.element.querySelector(
      ".flex.justify-center.space-x-2"
    );
    if (statsContainer) {
      statsContainer.innerHTML = this.getStatsBadges(stats);
    }
  }

  // Get color class based on partner
  getColorClass() {
    const colors = {
      primary: "bg-primary-600",
      secondary: "bg-secondary-600",
      success: "bg-success-600",
      warning: "bg-warning-600",
      danger: "bg-danger-600",
    };

    return colors[this.partner.color] || colors.primary;
  }

  // Get gradient class based on partner
  getGradientClass() {
    const gradients = {
      primary: "bg-gradient-to-br from-primary-400 to-primary-600",
      secondary: "bg-gradient-to-br from-secondary-400 to-secondary-600",
      success: "bg-gradient-to-br from-success-400 to-success-600",
      warning: "bg-gradient-to-br from-warning-400 to-warning-600",
      danger: "bg-gradient-to-br from-danger-400 to-danger-600",
    };

    return gradients[this.partner.color] || gradients.primary;
  }

  // Get stats badges
  getStatsBadges(stats = null) {
    if (!stats) {
      // Get stats from storage
      const todos = window.storageManager.getTodos(this.partner.id);
      const activeCount = todos.filter((todo) => !todo.completed).length;
      const completedCount = todos.filter((todo) => todo.completed).length;

      return `
        <span class="badge-success">${activeCount} Aktif</span>
        <span class="badge-secondary">${completedCount} Tamamlandı</span>
      `;
    }

    return `
      <span class="badge-success">${stats.active} Aktif</span>
      <span class="badge-secondary">${stats.completed} Tamamlandı</span>
    `;
  }

  // Update partner name
  updateName(newName) {
    this.partner.name = newName;
    this.partner.initial = newName.charAt(0).toUpperCase();

    const nameElement = this.element.querySelector("h3");
    const initialElement = this.element.querySelector(".w-20.h-20");

    if (nameElement) {
      nameElement.textContent = newName;
    }

    if (initialElement) {
      initialElement.textContent = this.partner.initial;
    }
  }

  // Show edit name modal
  showEditNameModal() {
    const modal = document.createElement("div");
    modal.className =
      "flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50";

    modal.innerHTML = `
      <div class="p-6 mx-4 w-full max-w-md bg-white rounded-lg">
        <h3 class="mb-4 text-lg font-semibold text-gray-900">İsim Düzenle</h3>
        
        <form id="editNameForm" class="space-y-4">
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">İsim</label>
            <input type="text" id="editPartnerName" value="${this.escapeHtml(
              this.partner.name
            )}" class="input" required>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button type="button" id="cancelEditName" class="btn-secondary">İptal</button>
            <button type="submit" class="btn-primary">Kaydet</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    const form = modal.querySelector("#editNameForm");
    const cancelBtn = modal.querySelector("#cancelEditName");

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const newName = modal.querySelector("#editPartnerName").value.trim();
      if (newName) {
        this.updateName(newName);
        // Update in storage
        window.storageManager.savePartnerData(this.partner.id, {
          name: newName,
          initial: newName.charAt(0).toUpperCase(),
        });
      }

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

  // Add context menu for editing
  addContextMenu() {
    this.element.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      const contextMenu = document.createElement("div");
      contextMenu.className =
        "fixed z-50 py-1 bg-white rounded-lg border border-gray-200 shadow-lg";
      contextMenu.style.left = e.pageX + "px";
      contextMenu.style.top = e.pageY + "px";

      contextMenu.innerHTML = `
        <button class="flex items-center px-4 py-2 w-full text-sm text-left text-gray-700 hover:bg-gray-100">
          <svg class="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
          İsim Düzenle
        </button>
      `;

      document.body.appendChild(contextMenu);

      // Event listener for edit name
      const editBtn = contextMenu.querySelector("button");
      editBtn.addEventListener("click", () => {
        this.showEditNameModal();
        document.body.removeChild(contextMenu);
      });

      // Close context menu when clicking outside
      const closeContextMenu = (e) => {
        if (!contextMenu.contains(e.target)) {
          document.body.removeChild(contextMenu);
          document.removeEventListener("click", closeContextMenu);
        }
      };

      setTimeout(() => {
        document.addEventListener("click", closeContextMenu);
      }, 0);
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
window.PartnerCard = PartnerCard;
