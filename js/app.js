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

    // Auto-check version after a short delay
    setTimeout(() => this.checkVersion(true), 2000);
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

    // Version check
    const checkBtn = document.getElementById('sidebarCheckUpdate');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => this.checkVersion(false));
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
  },

  async checkVersion(silent) {
    const btn = document.getElementById('sidebarCheckUpdate');
    if (btn) {
      btn.classList.add('checking');
      btn.querySelector('span:last-child').textContent = '检查中...';
    }

    try {
      const ts = Date.now();
      const resp = await fetch(`version.json?t=${ts}`, { cache: 'no-cache' });
      if (!resp.ok) throw new Error('fetch failed');
      const remote = await resp.json();
      const remoteVersion = remote.version;

      const localVersion = localStorage.getItem('imSept2_version') || '0';
      const isNew = remoteVersion !== localVersion;

      if (isNew) {
        if (silent) {
          // Auto-check: show subtle banner
          this._showUpdateBanner(remote);
        } else {
          // Manual check: show modal
          this._showUpdateModal(remote);
        }
      } else {
        if (!silent) {
          this.toast('已是最新版本 ✅');
        }
      }

      // Always update local version after manual check
      if (!silent) {
        localStorage.setItem('imSept2_version', remoteVersion);
      }
    } catch (err) {
      if (!silent) {
        this.toast('检查失败，请检查网络连接');
      }
    } finally {
      if (btn) {
        btn.classList.remove('checking');
        btn.querySelector('span:last-child').textContent = '检查更新';
      }
    }
  },

  _showUpdateBanner(remote) {
    // Remove existing banner
    const old = document.querySelector('.update-banner');
    if (old) old.remove();

    const banner = document.createElement('div');
    banner.className = 'update-banner';
    banner.innerHTML = `
      <span class="update-banner-text">🔔 发现新版本 (${remote.date})：${remote.changes}</span>
      <div class="update-banner-actions">
        <button class="update-banner-btn primary" onclick="App.doUpdate()">立即更新</button>
        <button class="update-banner-btn" onclick="this.parentElement.parentElement.remove()">稍后</button>
      </div>
    `;
    document.body.appendChild(banner);
  },

  _showUpdateModal(remote) {
    this.openModal('发现新版本', `
      <div style="text-align:center;padding:10px 0;">
        <div style="font-size:40px;margin-bottom:12px;">🎉</div>
        <div style="color:#694B40;margin-bottom:8px;"><strong>版本日期：${remote.date}</strong></div>
        <div style="color:#666;margin-bottom:16px;">${remote.changes || '优化和修复'}</div>
        <div style="font-size:13px;color:#999;">本地版本：${localStorage.getItem('imSept2_version') || '未知'}</div>
      </div>
    `, () => this.doUpdate());
  },

  async doUpdate() {
    try {
      // Clear all caches
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));

      // Unregister and re-register SW
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }

      localStorage.setItem('imSept2_needRefresh', '1');
      window.location.reload(true);
    } catch (e) {
      window.location.reload(true);
    }
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
