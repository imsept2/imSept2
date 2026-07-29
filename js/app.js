/* ===== imSept2 主应用逻辑 ===== */

const App = {
  init() {
    Storage.init();
    Pages.init(document.getElementById('pageContainer'));

    this.bindEvents();
    this.updateDate();
    this.navigate('home');

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('SW registration failed:', err);
      });
    }

    // Handle iOS PWA standalone mode
    if (window.navigator.standalone) {
      document.body.classList.add('pwa-standalone');
    }
  },

  bindEvents() {
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.navigate(page);
      });
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
      });
    }

    // Modal close
    document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'modalOverlay') this.closeModal();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });

    // Close dropdowns on click outside
    document.addEventListener('click', () => {
      if (typeof Pages !== 'undefined' && Pages.closeAllDropdowns) {
        Pages.closeAllDropdowns();
      }
    });

    // FAB
    const fab = document.getElementById('fab');
    if (fab) {
      fab.addEventListener('click', () => this.handleFab());
    }
  },

  navigate(page) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Update mobile title
    const activeItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeItem) {
      document.getElementById('mobileTitle').textContent = activeItem.dataset.label || '';
    }

    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');

    // Render page
    Pages.render(page);

    // Update FAB visibility
    this.updateFab(page);

    // Scroll to top
    window.scrollTo(0, 0);
  },

  navigateToSubTab(page, subTab) {
    Pages.currentSubTab[page] = subTab;
    this.navigate(page);
  },

  updateFab(page) {
    const fab = document.getElementById('fab');
    const pagesWithFab = ['notes', 'plans', 'life', 'work', 'study', 'accounting'];
    if (pagesWithFab.includes(page) && window.innerWidth <= 768) {
      fab.style.display = 'flex';
    } else {
      fab.style.display = 'none';
    }
  },

  handleFab() {
    const page = Pages.currentPage;
    const subTab = Pages.currentSubTab;

    if (page === 'notes') {
      Pages.openNoteModal();
    } else if (page === 'plans') {
      const tab = subTab.plans || 'daily';
      if (tab === 'daily') {
        document.getElementById('dailyTaskInput')?.focus();
      } else if (tab === 'weekly') {
        document.getElementById('weeklyTaskInput')?.focus();
      } else if (tab === 'summary') {
        Pages.openSummaryEditor();
      }
    } else if (page === 'life') {
      const tab = subTab.life || 'diet';
      if (tab === 'diet') Pages.openDietModal();
      else if (tab === 'sleep') Pages.openSleepModal();
      else if (tab === 'exercise') Pages.openExerciseModal();
      else if (tab === 'period') Pages.openPeriodModal();
    } else if (page === 'work') {
      const tab = subTab.work || 'marketing';
      if (tab === 'marketing') Pages.openMarketingModal();
      else Pages.openVideoModal();
    } else if (page === 'study') {
      const tab = subTab.study || 'english';
      if (tab === 'english') Pages.openEnglishModal();
      else if (tab === 'korean') Pages.openKoreanModal();
      else Pages.openBookModal();
    } else if (page === 'accounting') {
      const tab = subTab.accounting || 'today';
      if (tab === 'today') {
        document.getElementById('accAmount')?.focus();
      } else {
        Pages.switchAccountingTab('today');
      }
    }
  },

  updateDate() {
    const dateEl = document.getElementById('sidebarDate');
    if (dateEl) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      dateEl.textContent = `${y}-${m}-${d} 星期${weekdays[now.getDay()]}`;
    }
  },

  showModal(title, bodyHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalFooter').style.display = 'none';
    document.getElementById('modalOverlay').classList.add('show');
  },

  openModal(title, bodyHtml, onConfirm) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    const footer = document.getElementById('modalFooter');
    const confirmBtn = document.getElementById('modalConfirm');
    if (onConfirm) {
      footer.style.display = 'flex';
      confirmBtn.onclick = () => onConfirm();
    } else {
      footer.style.display = 'none';
    }
    document.getElementById('modalOverlay').classList.add('show');
  },

  closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
  },

  toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      el.classList.remove('show');
    }, 2000);
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
