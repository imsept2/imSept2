/* ===== imSept2 页面渲染逻辑 ===== */

const Pages = {
  container: null,
  currentPage: 'home',
  currentSubTab: {},

  init(container) {
    this.container = container;
  },

  render(page) {
    this.currentPage = page;
    const fn = this['page_' + page];
    if (fn) {
      fn.call(this);
    } else {
      this.container.innerHTML = '<div class="empty-state"><div class="empty-state-text">页面不存在</div></div>';
    }
  },

  // Helper: escape HTML
  esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  },

  // Helper: empty state
  emptyState(text) {
    return `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <div class="empty-state-text">${text}</div>
    </div>`;
  },

  // ========== 首页 ==========
  page_home() {
    const stats = Storage.getStats();
    const recentNotes = Storage.getNotes().slice(0, 3);
    const todayStr = Storage.dateToStr(new Date());
    const todayPlan = Storage.getDailyPlan(todayStr);
    const todayFinance = Storage.getAccountingStats(todayStr);
    const todayExercise = Storage.getExerciseRecords().filter(r => Storage.dateToStr(new Date(r.date)) === todayStr);

    const now = new Date();
    const weekday = ['日','一','二','三','四','五','六'][now.getDay()];
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const dateStr = `${month}月${date}日 星期${weekday}`;

    // Banner stats
    const bannerStats = [];
    if (stats.todayNotes > 0) bannerStats.push(`📝 ${stats.todayNotes}条随手记`);
    if (stats.todayTasks > 0) bannerStats.push(`📅 ${stats.todayTasks - stats.todayTasksDone}项待办`);
    if (todayFinance.expense > 0 || todayFinance.income > 0) bannerStats.push(`💰 今日收支`);
    if (todayExercise.length > 0) bannerStats.push(`🏃 今日已运动`);
    const bannerStatsHtml = bannerStats.length > 0 ? bannerStats.join(' · ') : '开始记录你的一天吧 ✨';

    // Quick entries
    const quickEntries = [
      { icon: '📝', label: '随手记', color: 'linear-gradient(135deg,#F4CFD6,#E8B4C0)', page: 'notes' },
      { icon: '📅', label: '日计划', color: 'linear-gradient(135deg,#A8D5BA,#8BC9A0)', page: 'plans', subTab: 'daily' },
      { icon: '💰', label: '记账', color: 'linear-gradient(135deg,#F0D5A8,#E8C088)', page: 'accounting', subTab: 'today' },
      { icon: '💪', label: '运动打卡', color: 'linear-gradient(135deg,#D5C8E8,#C5B8E0)', page: 'life', subTab: 'exercise' }
    ];

    let quickHtml = '';
    quickEntries.forEach(item => {
      const onclick = item.subTab
        ? `App.navigateToSubTab('${item.page}', '${item.subTab}')`
        : `App.navigate('${item.page}')`;
      quickHtml += `
        <div class="home-quick-card" onclick="${onclick}">
          <div class="home-quick-icon" style="background:${item.color}">${item.icon}</div>
          <div class="home-quick-label">${item.label}</div>
        </div>`;
    });

    // Overview data
    const overviewItems = [
      { icon: '📋', value: `${stats.todayTasksDone}/${stats.todayTasks}`, label: '今日待办', color: '#A8D5BA' },
      { icon: '💸', value: `¥${todayFinance.expense.toFixed(1)}`, label: '今日支出', color: '#F0D5A8' },
      { icon: '📝', value: `${stats.todayNotes}`, label: '随手记', color: '#F4CFD6' }
    ];

    let overviewHtml = '';
    overviewItems.forEach(item => {
      overviewHtml += `
        <div class="home-overview-card">
          <div class="home-overview-icon" style="background:${item.color}20;color:${item.color}">${item.icon}</div>
          <div class="home-overview-value">${item.value}</div>
          <div class="home-overview-label">${item.label}</div>
        </div>`;
    });

    // Recent activity
    let activityHtml = '';
    if (recentNotes.length === 0 && todayPlan.tasks.length === 0) {
      activityHtml = this.emptyState('暂无活动，开始记录吧');
    } else {
      let items = '';
      recentNotes.forEach(n => {
        const preview = n.content.substring(0, 40) + (n.content.length > 40 ? '...' : '');
        items += `<div class="activity-item">
          <div class="activity-dot" style="background:var(--primary-deep)"></div>
          <div class="activity-content">
            <div class="activity-text">${this.esc(preview)}</div>
            <div class="activity-time">${Storage.formatDate(n.timestamp)}</div>
          </div>
        </div>`;
      });
      todayPlan.tasks.slice(0, 3).forEach(t => {
        items += `<div class="activity-item">
          <div class="activity-dot" style="background:${t.done ? 'var(--green)' : 'var(--amber)'}"></div>
          <div class="activity-content">
            <div class="activity-text">${t.done ? '✓ ' : ''}${this.esc(t.text)}</div>
            <div class="activity-time">今日计划</div>
          </div>
        </div>`;
      });
      activityHtml = `<div class="activity-list">${items}</div>`;
    }

    this.container.innerHTML = `
      <!-- Banner -->
      <div class="home-banner">
        <div class="home-banner-greeting">👋 你好！</div>
        <div class="home-banner-date">今天是 ${dateStr}</div>
        <div class="home-banner-stats">${bannerStatsHtml}</div>
      </div>

      <!-- Quick Entries -->
      <div class="home-quick-grid">${quickHtml}</div>

      <!-- Today's Overview -->
      <div class="home-section-title">今日概览</div>
      <div class="home-overview-grid">${overviewHtml}</div>

      <!-- Recent Activity -->
      <div class="card">
        <div class="section-header"><h2>最近动态</h2></div>
        ${activityHtml}
      </div>
    `;
  },

  // ========== 随手记 (日历 + 微博流) ==========
  noteState: {
    currentMonth: new Date(),
    selectedDate: null,
    viewMode: 'all',
    editingId: null
  },

  AVATAR_PRESETS: [
    // 动物
    { id: 'cat', emoji: '🐱', cat: '动物' },
    { id: 'dog', emoji: '🐶', cat: '动物' },
    { id: 'bear', emoji: '🐻', cat: '动物' },
    { id: 'rabbit', emoji: '🐰', cat: '动物' },
    { id: 'fox', emoji: '🦊', cat: '动物' },
    { id: 'panda', emoji: '🐼', cat: '动物' },
    { id: 'tiger', emoji: '🐯', cat: '动物' },
    { id: 'penguin', emoji: '🐧', cat: '动物' },
    { id: 'koala', emoji: '🐨', cat: '动物' },
    { id: 'frog', emoji: '🐸', cat: '动物' },
    { id: 'monkey', emoji: '🐵', cat: '动物' },
    { id: 'lion', emoji: '🦁', cat: '动物' },
    { id: 'cow', emoji: '🐮', cat: '动物' },
    { id: 'pig', emoji: '🐷', cat: '动物' },
    { id: 'hamster', emoji: '🐹', cat: '动物' },
    // 人物
    { id: 'girl', emoji: '👩', cat: '人物' },
    { id: 'boy', emoji: '👨', cat: '人物' },
    { id: 'child', emoji: '👧', cat: '人物' },
    { id: 'baby', emoji: '👶', cat: '人物' },
    // 自然
    { id: 'flower1', emoji: '🌸', cat: '自然' },
    { id: 'flower2', emoji: '🌺', cat: '自然' },
    { id: 'sunflower', emoji: '🌻', cat: '自然' },
    { id: 'rose', emoji: '🌹', cat: '自然' },
    { id: 'clover', emoji: '🍀', cat: '自然' },
    { id: 'moon', emoji: '🌙', cat: '自然' },
    { id: 'star1', emoji: '⭐', cat: '自然' },
    { id: 'sun', emoji: '☀️', cat: '自然' },
    // 食物
    { id: 'apple', emoji: '🍎', cat: '食物' },
    { id: 'orange', emoji: '🍊', cat: '食物' },
    { id: 'lemon', emoji: '🍋', cat: '食物' },
    { id: 'grape', emoji: '🍇', cat: '食物' },
    { id: 'strawberry', emoji: '🍓', cat: '食物' },
    { id: 'peach', emoji: '🍑', cat: '食物' },
    // 趣味
    { id: 'gem', emoji: '💎', cat: '趣味' },
    { id: 'ribbon', emoji: '🎀', cat: '趣味' },
    { id: 'sparkle', emoji: '✨', cat: '趣味' },
    { id: 'star2', emoji: '💫', cat: '趣味' },
    { id: 'music', emoji: '🎵', cat: '趣味' },
    { id: 'robot', emoji: '🤖', cat: '趣味' },
    { id: 'ghost', emoji: '👻', cat: '趣味' },
    { id: 'poop', emoji: '💩', cat: '趣味' },
    { id: 'pumpkin', emoji: '🎃', cat: '趣味' },
  ],

  _findAvatar(avatarId) {
    if (!avatarId) return { emoji: '🐱' };
    if (avatarId.startsWith('custom:')) return { emoji: avatarId.replace('custom:', '') };
    if (avatarId.startsWith('photo:')) return { emoji: '🖼️', photoUrl: avatarId.replace('photo:', '') };
    return this.AVATAR_PRESETS.find(a => a.id === avatarId) || this.AVATAR_PRESETS[0];
  },

  DEVICES: ['iPhone', 'Android', 'iPad', 'MacBook', 'Windows PC', 'Web'],
  IPS: [
    '北京', '天津', '上海', '重庆',
    '河北', '山西', '辽宁', '吉林', '黑龙江',
    '江苏', '浙江', '安徽', '福建', '江西', '山东',
    '河南', '湖北', '湖南', '广东', '海南',
    '四川', '贵州', '云南', '陕西', '甘肃', '青海',
    '内蒙古', '广西', '西藏', '宁夏', '新疆',
    '香港', '澳门', '台湾',
    '韩国', '日本', '英国', '美国', '法国', '德国'
  ],

  page_notes() {
    const state = this.noteState;
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth() + 1;

    // Calendar
    const calHtml = this._renderNoteCalendar(year, month);

    // Selected date info
    let dateBtnHtml = '';
    if (state.selectedDate) {
      const d = state.selectedDate;
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      const dStr = String(d.getDate()).padStart(2, '0');
      dateBtnHtml = `<div class="note-date-btn" onclick="Pages.showAllNotes()">
        <span>查看 ${year}年${mStr}月${dStr}日 的记录</span>
        <span style="font-size:12px;color:#999">点击返回全部</span>
      </div>`;
    }

    // Feed
    let notes;
    if (state.selectedDate) {
      notes = Storage.getNotesByDate(Storage.dateToStr(state.selectedDate));
    } else {
      notes = Storage.getNotes();
    }

    const feedHtml = notes.length === 0
      ? this.emptyState(state.selectedDate ? '该日期暂无记录' : '还没有随手记，记录第一条吧')
      : this._renderNoteFeed(notes);

    this.container.innerHTML = `
      <div class="notes-page">
        <div class="notes-header">
          <h1 class="page-title" style="color:#111;margin-bottom:2px">我的日记本</h1>
          <p class="page-subtitle" style="color:#999;font-size:13px">记录生活的美好时光</p>
        </div>

        <div class="note-calendar-card">
          <div class="note-calendar-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>日历视图</span>
          </div>
          <div class="note-calendar-nav">
            <button class="note-cal-nav-btn" onclick="Pages.changeNoteMonth(-1)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="note-cal-month">${year} 年 ${month} 月</div>
            <button class="note-cal-nav-btn" onclick="Pages.changeNoteMonth(1)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div class="note-calendar-grid">
            <div class="note-cal-weekday">日</div>
            <div class="note-cal-weekday">一</div>
            <div class="note-cal-weekday">二</div>
            <div class="note-cal-weekday">三</div>
            <div class="note-cal-weekday">四</div>
            <div class="note-cal-weekday">五</div>
            <div class="note-cal-weekday">六</div>
            ${calHtml}
          </div>
          ${dateBtnHtml}
        </div>

        <div class="notes-feed">${feedHtml}</div>
      </div>
    `;
  },

  _renderNoteCalendar(year, month) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const hasDataDates = Storage.getNoteDatesInMonth(year, month);
    const today = new Date();
    const isTodayMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
    const sel = this.noteState.selectedDate;
    const isSelMonth = sel && sel.getFullYear() === year && sel.getMonth() + 1 === month;

    let html = '';
    for (let i = 0; i < startWeekday; i++) {
      html += '<div class="note-cal-day empty"></div>';
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const hasData = hasDataDates.has(d);
      const isToday = isTodayMonth && today.getDate() === d;
      const isSelected = isSelMonth && sel && sel.getDate() === d;
      const cls = ['note-cal-day'];
      if (isSelected) cls.push('selected');
      else if (isToday) cls.push('today');
      if (hasData) cls.push('has-data');
      html += `<div class="${cls.join(' ')}" onclick="Pages.selectNoteDate(${year}, ${month}, ${d})">
        <span class="note-cal-day-num">${d}</span>
        ${hasData ? '<span class="note-cal-dot"></span>' : ''}
      </div>`;
    }
    return html;
  },

  _renderNoteFeed(notes) {
    return notes.map(n => {
      const avatar = this._findAvatar(n.avatarId);
      const pubDate = new Date(n.publishTime || n.timestamp);
      const timeStr = this._formatWeiboTime(pubDate);
      const deviceStr = n.device ? `来自 ${n.device}` : '';
      const ipStr = n.ip ? `· ${n.ip}` : '';
      const locationStr = n.location ? `· ${n.location}` : '';

      let imagesHtml = '';
      if (n.images && n.images.length > 0) {
        const count = n.images.length;
        const imagesJson = JSON.stringify(n.images).replace(/"/g, '&quot;');
        let gridClass = 'note-img-grid';
        let imgsHtml = '';
        if (count === 1) {
          gridClass += ' one';
          imgsHtml = `<div class="note-img-wrap single" data-idx="0" data-images="${imagesJson}" onclick="Pages.openImgViewer(this)"><img src="${n.images[0]}" loading="lazy"></div>`;
        } else {
          // 2图及以上：1:1 比例
          if (count === 2) gridClass += ' two';
          else if (count === 4) gridClass += ' four';
          else if (count === 6 || count === 9) gridClass += (count === 9 ? ' nine' : ' six');
          else if (count <= 4) gridClass += ' two';
          else gridClass += ' three';
          imgsHtml = n.images.map((img, i) => `<div class="note-img-wrap" data-idx="${i}" data-images="${imagesJson}" onclick="Pages.openImgViewer(this)"><img src="${img}" loading="lazy"></div>`).join('');
        }
        imagesHtml = `<div class="${gridClass}">${imgsHtml}</div>`;
      }

      // 转发提示（原帖有转发时显示）
      let repostIndicator = '';
      if (n.repostedFrom) {
        const src = n.repostedFrom;
        const srcAvatar = this._findAvatar(src.avatarId);
        repostIndicator = `
          <div class="note-repost-quote">
            <div class="note-repost-header">
              <div class="note-repost-avatar">${srcAvatar.photoUrl ? `<img src="${srcAvatar.photoUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : srcAvatar.emoji}</div>
              <div class="note-repost-name">${this.esc(src.nickname || '主人')}</div>
              <div class="note-repost-time">${src.dateStr || ''}</div>
            </div>
            <div class="note-repost-content">${this.esc(src.content || '')}</div>
          </div>`;
      }

      let commentsHtml = '';
      if (n.comments && n.comments.length > 0) {
        commentsHtml = `<div class="note-comments">
          ${n.comments.map(c => {
            const color = c.color || '#666';
            return `<div class="note-comment-item">
              <div class="note-comment-body">
                <span class="note-comment-name" style="color:${this.esc(color)}">${this.esc(c.nickname || '主人')}</span>
                <span class="note-comment-colon">：</span>
                <span class="note-comment-text">${this.esc(c.text)}</span>
                <div class="note-comment-foot">
                  <span class="note-comment-time">${Storage.formatDate(c.timestamp)}</span>
                  <button class="note-comment-del" onclick="Pages.deleteComment('${n.id}', '${c.id}')">删除</button>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>`;
      }

      return `<div class="weibo-card" data-id="${n.id}">
        <div class="weibo-header">
          <div class="weibo-avatar">${avatar.photoUrl ? `<img src="${avatar.photoUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : avatar.emoji}</div>
          <div class="weibo-meta">
            <div class="weibo-name">${this.esc(n.nickname || '主人')}</div>
            <div class="weibo-sub">
              <span>${timeStr}</span>
              ${deviceStr ? `<span>· ${deviceStr}</span>` : ''}
              ${ipStr}
              ${locationStr}
            </div>
          </div>
          <div class="weibo-dropdown" id="dropdown-${n.id}">
            <button class="weibo-dropdown-btn" onclick="Pages.toggleDropdown('${n.id}', event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="weibo-dropdown-menu" id="dropdown-menu-${n.id}">
              <div class="weibo-dropdown-item" onclick="Pages.openNoteModal('${n.id}');Pages.closeDropdown('${n.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                编辑
              </div>
              <div class="weibo-dropdown-item delete" onclick="Pages.deleteNote('${n.id}');Pages.closeDropdown('${n.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                删除
              </div>
            </div>
          </div>
        </div>
        <div class="weibo-content">${this.esc(n.content)}</div>
        ${imagesHtml}
        ${repostIndicator}
        <div class="weibo-footer">
          <div class="weibo-action" onclick="Pages.openRepostModal('${n.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            <span>${n.reposts ? this._formatCount(n.reposts) : 'Repost'}</span>
          </div>
          <div class="weibo-action" onclick="Pages.toggleCommentBox('${n.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <span>${(n.comments?.length || 0) > 0 ? n.comments.length : 'Comment'}</span>
          </div>
          <div class="weibo-action ${n.likedByMe ? 'liked' : ''}" onclick="Pages.toggleLike('${n.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${n.likedByMe ? '#E6162D' : 'none'}" stroke="${n.likedByMe ? '#E6162D' : 'currentColor'}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span>${n.likes ? this._formatCount(n.likes) : 'Like'}</span>
          </div>
        </div>
        ${commentsHtml}
        <div class="note-comment-input-box" id="comment-box-${n.id}" style="display:none">
          <div class="note-comment-author-row">
            <input class="note-comment-author-name" id="comment-name-${n.id}" placeholder="昵称" maxlength="10" value="主人">
            <input type="color" class="note-comment-author-color" id="comment-color-${n.id}" value="#666666" title="昵称颜色">
          </div>
          <div class="note-comment-input-wrap">
            <input class="note-comment-input" id="comment-input-${n.id}" placeholder="写下你的评论..." onkeydown="if(event.key==='Enter')Pages.submitComment('${n.id}')">
            <button class="note-comment-send" onclick="Pages.submitComment('${n.id}')">发送</button>
          </div>
        </div>
      </div>`;
    }).join('');
  },

  _formatWeiboTime(date) {
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    if (date.getFullYear() === now.getFullYear()) return `${m}-${d} ${h}:${min}`;
    return `${date.getFullYear()}-${m}-${d}`;
  },

  _formatCount(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    return String(n);
  },

  changeNoteMonth(delta) {
    const d = new Date(this.noteState.currentMonth);
    d.setMonth(d.getMonth() + delta);
    this.noteState.currentMonth = d;
    this.render('notes');
  },

  selectNoteDate(year, month, day) {
    this.noteState.selectedDate = new Date(year, month - 1, day);
    this.render('notes');
  },

  showAllNotes() {
    this.noteState.selectedDate = null;
    this.render('notes');
  },

  deleteNote(id) {
    if (confirm('确定删除这条日记？')) {
      Storage.deleteNote(id);
      App.toast('已删除');
      this.render('notes');
    }
  },

  toggleDropdown(noteId, event) {
    event.stopPropagation();
    const menu = document.getElementById(`dropdown-menu-${noteId}`);
    const btn = document.querySelector(`#dropdown-${noteId} .weibo-dropdown-btn`);
    const isOpen = menu && menu.classList.contains('show');
    // Close all dropdowns first
    document.querySelectorAll('.weibo-dropdown-menu').forEach(m => m.classList.remove('show'));
    document.querySelectorAll('.weibo-dropdown-btn').forEach(b => b.classList.remove('active'));
    if (!isOpen && menu && btn) {
      menu.classList.add('show');
      btn.classList.add('active');
    }
  },

  closeDropdown(noteId) {
    const menu = document.getElementById(`dropdown-menu-${noteId}`);
    const btn = document.querySelector(`#dropdown-${noteId} .weibo-dropdown-btn`);
    if (menu) menu.classList.remove('show');
    if (btn) btn.classList.remove('active');
  },

  closeAllDropdowns() {
    document.querySelectorAll('.weibo-dropdown-menu').forEach(m => m.classList.remove('show'));
    document.querySelectorAll('.weibo-dropdown-btn').forEach(b => b.classList.remove('active'))
  },

  toggleLike(id) {
    Storage.toggleNoteLike(id);
    // Re-render only the card to avoid scroll jump
    const card = document.querySelector(`.weibo-card[data-id="${id}"]`);
    if (card) {
      const notes = Storage.getNotes();
      const note = notes.find(n => n.id === id);
      if (note) {
        const newHtml = this._renderNoteFeed([note]);
        card.outerHTML = newHtml;
      }
    } else {
      this.render('notes');
    }
  },

  // 旧接口保留（兼容）
  repostNote(id) {
    this.openRepostModal(id);
  },

  toggleCommentBox(noteId) {
    const box = document.getElementById(`comment-box-${noteId}`);
    if (box) {
      const visible = box.style.display !== 'none';
      box.style.display = visible ? 'none' : 'block';
      if (!visible) {
        setTimeout(() => {
          const input = document.getElementById(`comment-input-${noteId}`);
          if (input) input.focus();
        }, 50);
      }
    }
  },

  submitComment(noteId) {
    const input = document.getElementById(`comment-input-${noteId}`);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    const nameInput = document.getElementById(`comment-name-${noteId}`);
    const colorInput = document.getElementById(`comment-color-${noteId}`);
    Storage.addNoteComment(noteId, {
      text,
      nickname: nameInput ? nameInput.value.trim() || '主人' : '主人',
      color: colorInput ? colorInput.value : '#666666'
    });
    input.value = '';
    this.render('notes');
    // Re-open comment box after render
    setTimeout(() => {
      const box = document.getElementById(`comment-box-${noteId}`);
      if (box) box.style.display = 'block';
    }, 50);
  },

  deleteComment(noteId, commentId) {
    if (confirm('删除这条评论？')) {
      Storage.deleteNoteComment(noteId, commentId);
      this.render('notes');
    }
  },

  // 图片灯箱
  openImgViewer(el) {
    const imagesJson = el.dataset.images.replace(/&quot;/g, '"');
    const images = JSON.parse(imagesJson);
    const idx = parseInt(el.dataset.idx) || 0;
    let viewer = document.getElementById('imgViewer');
    if (!viewer) {
      viewer = document.createElement('div');
      viewer.id = 'imgViewer';
      viewer.className = 'img-viewer';
      viewer.innerHTML = `
        <button class="img-viewer-close">×</button>
        <button class="img-viewer-prev">‹</button>
        <button class="img-viewer-next">›</button>
        <div class="img-viewer-counter"></div>
        <div class="img-viewer-body"></div>
      `;
      document.body.appendChild(viewer);
      // Bind close
      viewer.querySelector('.img-viewer-close').onclick = () => viewer.classList.remove('show');
      viewer.onclick = (e) => {
        if (e.target === viewer || e.target.classList.contains('img-viewer-body')) {
          viewer.classList.remove('show');
        }
      };
      // Bind nav
      viewer.querySelector('.img-viewer-prev').onclick = () => this._imgViewerNav(-1);
      viewer.querySelector('.img-viewer-next').onclick = () => this._imgViewerNav(1);
    }
    viewer._images = images;
    viewer._idx = idx;
    this._imgViewerRender();
    viewer.classList.add('show');
  },

  _imgViewerRender() {
    const viewer = document.getElementById('imgViewer');
    if (!viewer || !viewer._images) return;
    const body = viewer.querySelector('.img-viewer-body');
    body.innerHTML = `<img src="${viewer._images[viewer._idx]}">`;
    viewer.querySelector('.img-viewer-counter').textContent =
      viewer._images.length > 1 ? `${viewer._idx + 1} / ${viewer._images.length}` : '';
    viewer.querySelector('.img-viewer-prev').style.display = viewer._images.length > 1 ? '' : 'none';
    viewer.querySelector('.img-viewer-next').style.display = viewer._images.length > 1 ? '' : 'none';
  },

  _imgViewerNav(delta) {
    const viewer = document.getElementById('imgViewer');
    if (!viewer || !viewer._images) return;
    viewer._idx = (viewer._idx + delta + viewer._images.length) % viewer._images.length;
    this._imgViewerRender();
  },

  // 转发弹窗（含原文预览）
  openRepostModal(noteId) {
    const note = Storage.data.notes.find(n => n.id === noteId);
    if (!note) return;
    const avatar = this._findAvatar(note.avatarId);
    const pubDate = new Date(note.publishTime || note.timestamp);
    const timeStr = this._formatWeiboTime(pubDate);

    let modal = document.getElementById('repostModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'repostModal';
      modal.className = 'modal-overlay repost-modal';
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <span>转发</span>
          <button class="modal-close" onclick="Pages.closeRepostModal()">×</button>
        </div>
        <div class="modal-body">
          <textarea class="repost-text" id="repostText" placeholder="说点什么吧（可选）..." rows="3"></textarea>
          <div class="repost-author-row">
            <input type="text" class="repost-author-name" id="repostName" placeholder="昵称" value="主人" maxlength="10">
            <input type="color" class="repost-author-color" id="repostColor" value="#666666">
            <select class="repost-author-device" id="repostDevice">
              <option value="">-- 设备 --</option>
              <option>iPhone 客户端</option>
              <option>iPad 客户端</option>
              <option>Android 客户端</option>
              <option>HUAWEI 客户端</option>
              <option>微博网页版</option>
              <option>HarmonyOS 客户端</option>
            </select>
          </div>
          <div class="repost-source" id="repostSource">
            <div class="repost-source-header">
              <div class="repost-source-avatar">${avatar.photoUrl ? `<img src="${avatar.photoUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : avatar.emoji}</div>
              <div class="repost-source-name">${this.esc(note.nickname || '主人')}</div>
              <div class="repost-source-time">${timeStr}</div>
            </div>
            <div class="repost-source-content">${this.esc(note.content)}</div>
            ${(note.images && note.images.length > 0)
              ? `<div class="repost-source-images">${(() => { const ij = JSON.stringify(note.images).replace(/"/g, '&quot;'); return note.images.map((img, i) => `<img src="${img}" data-idx="${i}" data-images="${ij}" onclick="Pages.openImgViewer(this)">`).join(''); })()}</div>`
              : ''}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" id="repostSubmitBtn">发送</button>
        </div>
      </div>
    `;
    modal.classList.add('show');
    modal.onclick = () => this.closeRepostModal();
    modal.querySelector('.modal').onclick = (e) => e.stopPropagation();
    modal.querySelector('#repostSubmitBtn').onclick = () => this.submitRepost(noteId);
    modal.querySelector('#repostText').focus();
  },

  closeRepostModal() {
    const modal = document.getElementById('repostModal');
    if (modal) modal.classList.remove('show');
  },

  submitRepost(noteId) {
    const srcNote = Storage.data.notes.find(n => n.id === noteId);
    if (!srcNote) return;
    const text = document.getElementById('repostText').value.trim();
    const nickname = document.getElementById('repostName').value.trim() || '主人';
    const color = document.getElementById('repostColor').value;
    const device = document.getElementById('repostDevice').value;
    const srcAvatar = this._findAvatar(srcNote.avatarId);
    const srcPubDate = new Date(srcNote.publishTime || srcNote.timestamp);
    const m = String(srcPubDate.getMonth() + 1).padStart(2, '0');
    const d = String(srcPubDate.getDate()).padStart(2, '0');
    const srcDateStr = `${srcPubDate.getFullYear()}-${m}-${d}`;
    const repostedFrom = {
      nickname: srcNote.nickname || '主人',
      avatarId: srcNote.avatarId,
      content: srcNote.content,
      images: srcNote.images || [],
      dateStr: srcDateStr
    };
    Storage.addNote({
      content: text || '转发',
      nickname,
      color,
      device,
      repostedFrom,
      avatarId: 'default'
    });
    srcNote.reposts = (srcNote.reposts || 0) + 1;
    Storage.save();
    this.closeRepostModal();
    App.toast('已转发');
    this.render('notes');
  },

  openNoteModal(id) {
    this.noteState.editingId = id || null;
    const note = id ? Storage.data.notes.find(n => n.id === id) : null;
    const isEdit = !!note;

    const pubDate = note ? new Date(note.publishTime || note.timestamp) : new Date();
    const dateVal = Storage.dateToStr(pubDate) + 'T' + String(pubDate.getHours()).padStart(2, '0') + ':' + String(pubDate.getMinutes()).padStart(2, '0');

    // Build emoji picker with categories
    const cats = [...new Set(this.AVATAR_PRESETS.map(a => a.cat))];
    const currentAvatarId = note?.avatarId || '';
    let isCustomEmoji = currentAvatarId.startsWith('custom:');
    let isPhoto = currentAvatarId.startsWith('photo:');
    let customEmoji = isCustomEmoji ? currentAvatarId.replace('custom:', '') : '';
    let photoPreview = isPhoto ? currentAvatarId.replace('photo:', '') : '';

    let emojiTabs = cats.map((cat, i) =>
      `<span class="note-emoji-tab ${i === 0 ? 'active' : ''}" onclick="Pages._switchEmojiTab(this, '${cat}')">${cat}</span>`
    ).join('');

    let emojiPanels = cats.map((cat, i) => {
      const items = this.AVATAR_PRESETS.filter(a => a.cat === cat).map(a => {
        const sel = currentAvatarId === a.id ? ' selected' : '';
        return `<span class="note-emoji-item${sel}" data-av="${a.id}" onclick="Pages._selectEmoji(this, '${a.id}')">${a.emoji}</span>`;
      }).join('');
      return `<div class="note-emoji-panel${i === 0 ? '' : ' hidden'}" data-cat="${cat}">${items}</div>`;
    }).join('');

    const deviceOptions = this.DEVICES.map(d =>
      `<option value="${d}" ${note?.device === d ? 'selected' : ''}>${d}</option>`
    ).join('');

    const ipOptions = this.IPS.map(ip =>
      `<option value="${ip}" ${note?.ip === ip ? 'selected' : ''}>${ip}</option>`
    ).join('');

    let imagesHtml = '';
    if (note?.images?.length) {
      imagesHtml = note.images.map((img, idx) => `
        <div class="note-img-preview-item" data-idx="${idx}">
          <img src="${img}">
          <button class="note-img-remove" onclick="this.parentElement.remove();Pages._syncNoteImages()">×</button>
        </div>
      `).join('');
    }

    App.openModal(isEdit ? '编辑日记' : '写日记', `
      <div class="note-modal-form">
        <textarea class="textarea note-modal-textarea" id="nmContent" placeholder="分享新鲜事..." rows="4">${note ? this.esc(note.content) : ''}</textarea>

        <div class="note-modal-section">
          <div class="note-modal-label">图片</div>
          <div class="note-img-preview" id="nmImgPreview">${imagesHtml}</div>
          <label class="note-img-upload-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <span>添加图片</span>
            <input type="file" accept="image/*" multiple style="display:none" onchange="Pages._handleNoteImages(this)">
          </label>
        </div>

        <div class="note-modal-section">
          <div class="note-modal-label">发布时间</div>
          <input type="datetime-local" class="input" id="nmPublishTime" value="${dateVal}">
        </div>

        <div class="note-modal-row">
          <div class="note-modal-section" style="flex:1">
            <div class="note-modal-label">设备</div>
            <select class="input" id="nmDevice">${deviceOptions}</select>
          </div>
          <div class="note-modal-section" style="flex:1">
            <div class="note-modal-label">IP定位</div>
            <select class="input" id="nmIp">${ipOptions}</select>
          </div>
        </div>

        <div class="note-modal-section">
          <div class="note-modal-label">头像</div>
          <div class="note-avatar-picker">
            <div class="note-emoji-tabs">${emojiTabs}</div>
            <div class="note-emoji-panels">${emojiPanels}</div>
            <div class="note-avatar-custom-row">
              <div class="note-custom-emoji-wrap">
                <input type="text" class="input note-custom-emoji-input" id="nmCustomEmoji" placeholder="自定义 emoji（如 🎭）" value="${customEmoji}" maxlength="4" oninput="Pages._onCustomEmoji(this)">
              </div>
              <label class="note-avatar-photo-btn" id="nmPhotoLabel">
                ${photoPreview ? `<img src="${photoPreview}" class="note-avatar-photo-preview">更换照片` : '📷 上传头像'}
                <input type="file" accept="image/*" style="display:none" onchange="Pages._handleAvatarPhoto(this)">
              </label>
            </div>
          </div>
          <input type="hidden" id="nmAvatarId" value="${this.esc(currentAvatarId)}">
        </div>

        <div class="note-modal-section">
          <div class="note-modal-label">昵称</div>
          <input type="text" class="input" id="nmNickname" value="${note ? this.esc(note.nickname || '主人') : '主人'}" placeholder="输入昵称">
        </div>
      </div>
    `, () => this.submitNoteModal());
  },

  _switchEmojiTab(el, cat) {
    document.querySelectorAll('.note-emoji-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.note-emoji-panel').forEach(p => p.classList.add('hidden'));
    const panel = document.querySelector(`.note-emoji-panel[data-cat="${cat}"]`);
    if (panel) panel.classList.remove('hidden');
  },

  _selectEmoji(el, avatarId) {
    document.querySelectorAll('.note-emoji-item').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('nmAvatarId').value = avatarId;
    // Clear custom emoji input
    const customInput = document.getElementById('nmCustomEmoji');
    if (customInput) customInput.value = '';
    // Clear photo
    const photoLabel = document.getElementById('nmPhotoLabel');
    if (photoLabel) {
      const existing = photoLabel.querySelector('.note-avatar-photo-preview');
      if (existing) existing.remove();
      const text = photoLabel.childNodes[photoLabel.childNodes.length - 1];
      if (text && text.nodeType === 3) text.textContent = '📷 上传头像';
    }
  },

  _onCustomEmoji(input) {
    const val = input.value.trim();
    if (val) {
      document.getElementById('nmAvatarId').value = 'custom:' + val;
      document.querySelectorAll('.note-emoji-item').forEach(i => i.classList.remove('selected'));
      // Clear photo
      const photoLabel = document.getElementById('nmPhotoLabel');
      if (photoLabel) {
        const existing = photoLabel.querySelector('.note-avatar-photo-preview');
        if (existing) existing.remove();
        const text = photoLabel.childNodes[photoLabel.childNodes.length - 1];
        if (text && text.nodeType === 3) text.textContent = '📷 上传头像';
      }
    }
  },

  _handleAvatarPhoto(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      document.getElementById('nmAvatarId').value = 'photo:' + dataUrl;
      document.querySelectorAll('.note-emoji-item').forEach(i => i.classList.remove('selected'));
      document.getElementById('nmCustomEmoji').value = '';
      const label = document.getElementById('nmPhotoLabel');
      if (label) {
        const existing = label.querySelector('.note-avatar-photo-preview');
        if (existing) existing.remove();
        const img = document.createElement('img');
        img.src = dataUrl;
        img.className = 'note-avatar-photo-preview';
        label.prepend(img);
        const text = label.childNodes[label.childNodes.length - 1];
        if (text && text.nodeType === 3) text.textContent = '更换照片';
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  },

  _handleNoteImages(input) {
    const files = Array.from(input.files);
    if (!files.length) return;
    const preview = document.getElementById('nmImgPreview');
    let loaded = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const div = document.createElement('div');
        div.className = 'note-img-preview-item';
        div.innerHTML = `<img src="${e.target.result}"><button class="note-img-remove" onclick="this.parentElement.remove();Pages._syncNoteImages()">×</button>`;
        preview.appendChild(div);
        loaded++;
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  },

  _syncNoteImages() {},

  _collectNoteImages() {
    const preview = document.getElementById('nmImgPreview');
    if (!preview) return [];
    return Array.from(preview.querySelectorAll('img')).map(img => img.src);
  },

  submitNoteModal() {
    const content = document.getElementById('nmContent').value.trim();
    if (!content) { App.toast('请输入内容'); return; }

    const publishTime = document.getElementById('nmPublishTime').value;
    const device = document.getElementById('nmDevice').value;
    const ip = document.getElementById('nmIp').value;
    const nickname = document.getElementById('nmNickname').value.trim() || '主人';
    const avatarId = document.getElementById('nmAvatarId').value || 'cat';
    const images = this._collectNoteImages();

    const data = {
      content,
      publishTime: publishTime ? new Date(publishTime).getTime() : Date.now(),
      device,
      ip,
      nickname,
      avatarId,
      images
    };

    if (this.noteState.editingId) {
      const note = Storage.data.notes.find(n => n.id === this.noteState.editingId);
      if (note) {
        Object.assign(note, data);
        Storage.save();
        App.toast('已保存');
      }
    } else {
      Storage.addNote(data);
      App.toast('发布成功');
    }

    App.closeModal();
    this.noteState.editingId = null;
    this.render('notes');
  },

  submitNote() {
    this.openNoteModal();
  },

  // ========== 计划复盘 ==========
  planState: { date: null, weekOffset: 0, summaryEditing: null },

  page_plans() {
    if (!this.planState.date) this.planState.date = new Date();
    const tab = this.currentSubTab.plans || 'daily';

    const tabs = [
      { key: 'daily', label: '日计划' },
      { key: 'weekly', label: '周计划' },
      { key: 'summary', label: '总结' }
    ];

    let tabHtml = tabs.map(t => 
      `<button class="tab ${tab === t.key ? 'active' : ''}" onclick="Pages.switchPlanTab('${t.key}')">${t.label}</button>`
    ).join('');

    let contentHtml = '';
    if (tab === 'daily') contentHtml = this.renderDailyPlan();
    else if (tab === 'weekly') contentHtml = this.renderWeeklyPlan();
    else contentHtml = this.renderSummaryList();

    this.container.innerHTML = `
      <h1 class="page-title">计划复盘</h1>
      <p class="page-subtitle">规划每日、每周任务，定期总结复盘</p>
      <div class="tabs">${tabHtml}</div>
      <div id="planContent">${contentHtml}</div>
    `;
  },

  switchPlanTab(tab) {
    this.currentSubTab.plans = tab;
    this.render('plans');
  },

  renderDailyPlan() {
    const date = new Date(this.planState.date);
    const dateStr = Storage.dateToStr(date);
    const plan = Storage.getDailyPlan(dateStr);
    const tasks = plan.tasks || [];
    const doneCount = tasks.filter(t => t.done).length;
    const progress = tasks.length > 0 ? Math.round(doneCount / tasks.length * 100) : 0;

    const weekday = ['日','一','二','三','四','五','六'][date.getDay()];

    let tasksHtml = '';
    if (tasks.length === 0) {
      tasksHtml = this.emptyState('今日暂无计划，添加第一个任务吧');
    } else {
      tasksHtml = tasks.map(t => `
        <div class="task-item ${t.done ? 'done' : ''}">
          <div class="task-checkbox ${t.done ? 'checked' : ''}" onclick="Pages.toggleDailyTask('${dateStr}','${t.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span class="task-text">${this.esc(t.text)}</span>
          <button class="task-delete" onclick="Pages.deleteDailyTask('${dateStr}','${t.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `).join('');
    }

    return `
      <div class="plan-date-bar">
        <button class="date-nav-btn" onclick="Pages.changePlanDate(-1)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="date-display">${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日 星期${weekday}</div>
        <button class="date-nav-btn" onclick="Pages.changePlanDate(1)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div class="card">
        <div class="progress-text"><span>完成进度</span><span>${doneCount}/${tasks.length} (${progress}%)</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        <div class="task-list">${tasksHtml}</div>
        <div class="task-add-row">
          <input class="task-add-input" id="dailyTaskInput" placeholder="添加任务..." onkeydown="if(event.key==='Enter')Pages.addDailyTask('${dateStr}')">
          <button class="btn btn-primary btn-sm" onclick="Pages.addDailyTask('${dateStr}')">添加</button>
        </div>
      </div>
    `;
  },

  changePlanDate(delta) {
    const d = new Date(this.planState.date);
    d.setDate(d.getDate() + delta);
    this.planState.date = d;
    document.getElementById('planContent').innerHTML = this.renderDailyPlan();
  },

  addDailyTask(dateStr) {
    const input = document.getElementById('dailyTaskInput');
    const text = input.value.trim();
    if (!text) return;
    Storage.addDailyTask(dateStr, text);
    document.getElementById('planContent').innerHTML = this.renderDailyPlan();
  },

  toggleDailyTask(dateStr, taskId) {
    Storage.toggleDailyTask(dateStr, taskId);
    document.getElementById('planContent').innerHTML = this.renderDailyPlan();
  },

  deleteDailyTask(dateStr, taskId) {
    Storage.deleteDailyTask(dateStr, taskId);
    document.getElementById('planContent').innerHTML = this.renderDailyPlan();
  },

  renderWeeklyPlan() {
    const baseDate = new Date(this.planState.date);
    const day = baseDate.getDay() || 7;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - day + 1);
    const weekKey = Storage.dateToStr(monday);
    const plan = Storage.getWeeklyPlan(weekKey);
    const tasks = plan.tasks || [];
    const doneCount = tasks.filter(t => t.done).length;

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const days = ['周一','周二','周三','周四','周五','周六','周日'];
    let tasksHtml = '';

    if (tasks.length === 0) {
      tasksHtml = this.emptyState('本周暂无计划');
    } else {
      for (let i = 0; i < 7; i++) {
        const dayTasks = tasks.filter(t => t.day === i);
        if (dayTasks.length === 0) continue;
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        tasksHtml += `<div style="margin-bottom:12px">
          <div style="font-size:13px;font-weight:600;color:var(--text-light);margin-bottom:6px;padding-left:4px">${days[i]} (${d.getMonth()+1}/${d.getDate()})</div>
          ${dayTasks.map(t => `
            <div class="task-item ${t.done ? 'done' : ''}">
              <div class="task-checkbox ${t.done ? 'checked' : ''}" onclick="Pages.toggleWeeklyTask('${weekKey}','${t.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span class="task-text">${this.esc(t.text)}</span>
              <button class="task-delete" onclick="Pages.deleteWeeklyTask('${weekKey}','${t.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          `).join('')}
        </div>`;
      }
    }

    return `
      <div class="plan-date-bar">
        <button class="date-nav-btn" onclick="Pages.changePlanWeek(-1)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="date-display">${monday.getMonth()+1}月${monday.getDate()}日 - ${sunday.getMonth()+1}月${sunday.getDate()}日</div>
        <button class="date-nav-btn" onclick="Pages.changePlanWeek(1)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div class="card">
        <div class="progress-text"><span>本周完成</span><span>${doneCount}/${tasks.length}</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${tasks.length > 0 ? doneCount/tasks.length*100 : 0}%"></div></div>
        <div class="task-list">${tasksHtml}</div>
        <div class="task-add-row">
          <select class="select" id="weeklyDaySelect" style="flex:0 0 90px">
            ${days.map((d,i) => `<option value="${i}">${d}</option>`).join('')}
          </select>
          <input class="task-add-input" id="weeklyTaskInput" placeholder="添加周计划任务..." onkeydown="if(event.key==='Enter')Pages.addWeeklyTask('${weekKey}')">
          <button class="btn btn-primary btn-sm" onclick="Pages.addWeeklyTask('${weekKey}')">添加</button>
        </div>
      </div>
    `;
  },

  changePlanWeek(delta) {
    const d = new Date(this.planState.date);
    d.setDate(d.getDate() + delta * 7);
    this.planState.date = d;
    document.getElementById('planContent').innerHTML = this.renderWeeklyPlan();
  },

  addWeeklyTask(weekKey) {
    const input = document.getElementById('weeklyTaskInput');
    const daySelect = document.getElementById('weeklyDaySelect');
    const text = input.value.trim();
    if (!text) return;
    Storage.addWeeklyTask(weekKey, text, parseInt(daySelect.value));
    document.getElementById('planContent').innerHTML = this.renderWeeklyPlan();
  },

  toggleWeeklyTask(weekKey, taskId) {
    Storage.toggleWeeklyTask(weekKey, taskId);
    document.getElementById('planContent').innerHTML = this.renderWeeklyPlan();
  },

  deleteWeeklyTask(weekKey, taskId) {
    Storage.deleteWeeklyTask(weekKey, taskId);
    document.getElementById('planContent').innerHTML = this.renderWeeklyPlan();
  },

  renderSummaryList() {
    const summaries = Storage.getSummaries();
    let html = `
      <div style="margin-bottom:16px">
        <button class="btn btn-primary" onclick="Pages.openSummaryEditor()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          写总结
        </button>
      </div>
    `;

    if (summaries.length === 0) {
      html += this.emptyState('还没有总结记录');
    } else {
      html += '<div class="summary-list">';
      summaries.forEach(s => {
        const typeLabel = s.type === 'weekly' ? '周总结' : s.type === 'monthly' ? '月总结' : '日总结';
        const preview = s.content.replace(/[#*`>\-]/g, '').substring(0, 100);
        html += `<div class="summary-card" onclick="Pages.openSummaryEditor('${s.id}')">
          <div class="summary-card-title">${this.esc(s.title)}</div>
          <div class="summary-card-date">${typeLabel} · ${Storage.formatDateLong(s.date)}</div>
          ${preview ? `<div class="summary-card-preview">${this.esc(preview)}</div>` : ''}
        </div>`;
      });
      html += '</div>';
    }
    return html;
  },

  openSummaryEditor(id) {
    let summary = null;
    if (id) summary = Storage.getSummary(id);

    App.showModal(summary ? '编辑总结' : '写总结', `
      <div class="input-group">
        <label class="input-label">标题</label>
        <input class="input" id="summaryTitle" value="${summary ? this.esc(summary.title) : ''}" placeholder="总结标题">
      </div>
      <div class="input-group">
        <label class="input-label">类型</label>
        <div class="chip-group" id="summaryTypeGroup">
          ${['daily','weekly','monthly'].map(t => {
            const labels = {daily:'日总结', weekly:'周总结', monthly:'月总结'};
            const active = (!summary && t === 'daily') || (summary && summary.type === t);
            return `<button class="chip ${active ? 'active' : ''}" data-type="${t}" onclick="Pages.selectSummaryType('${t}')">${labels[t]}</button>`;
          }).join('')}
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">内容</label>
        <textarea class="textarea" id="summaryContent" style="min-height:240px" placeholder="写下你的总结和思考...">${summary ? this.esc(summary.content) : ''}</textarea>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        ${summary ? `<button class="btn btn-danger" onclick="Pages.deleteSummary('${id}')">删除</button>` : ''}
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" onclick="Pages.saveSummary('${id || ''}')">保存</button>
      </div>
    `);

    this._summaryType = summary ? summary.type : 'daily';
  },

  selectSummaryType(type) {
    this._summaryType = type;
    document.querySelectorAll('#summaryTypeGroup .chip').forEach(c => {
      c.classList.toggle('active', c.dataset.type === type);
    });
  },

  saveSummary(id) {
    const title = document.getElementById('summaryTitle').value;
    const content = document.getElementById('summaryContent').value;
    if (!content.trim()) { App.toast('请输入内容'); return; }
    if (id) {
      Storage.updateSummary(id, title, content);
    } else {
      Storage.addSummary(title, content, this._summaryType || 'daily');
    }
    App.closeModal();
    App.toast('保存成功');
    this.render('plans');
  },

  deleteSummary(id) {
    if (confirm('确定删除这篇总结？')) {
      Storage.deleteSummary(id);
      App.closeModal();
      App.toast('已删除');
      this.render('plans');
    }
  },

  // ========== 生活相关 ==========
  page_life() {
    const tab = this.currentSubTab.life || 'diet';
    const tabs = [
      { key: 'diet', label: '饮食' },
      { key: 'sleep', label: '睡眠' },
      { key: 'exercise', label: '运动' },
      { key: 'period', label: '经期' }
    ];

    let tabHtml = tabs.map(t =>
      `<button class="tab ${tab === t.key ? 'active' : ''}" onclick="Pages.switchLifeTab('${t.key}')">${t.label}</button>`
    ).join('');

    let contentHtml = '';
    if (tab === 'diet') contentHtml = this.renderDiet();
    else if (tab === 'sleep') contentHtml = this.renderSleep();
    else if (tab === 'exercise') contentHtml = this.renderExercise();
    else contentHtml = this.renderPeriod();

    this.container.innerHTML = `
      <h1 class="page-title">生活相关</h1>
      <p class="page-subtitle">关注健康，记录生活中的每一刻</p>
      <div class="tabs">${tabHtml}</div>
      <div id="lifeContent">${contentHtml}</div>
    `;
  },

  switchLifeTab(tab) {
    this.currentSubTab.life = tab;
    this.render('life');
  },

  renderDiet() {
    const records = Storage.getDietRecords();
    const todayRecords = records.filter(r => Storage.dateToStr(new Date(r.date)) === Storage.dateToStr(new Date()));
    const mealLabels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };
    const mealColors = { breakfast: 'var(--amber-light)|#B8860B', lunch: 'var(--green-light)|#5A8F6E', dinner: 'var(--secondary)|var(--text)', snack: 'var(--purple-light)|#9B8EC7' };

    let listHtml = '';
    if (records.length === 0) {
      listHtml = this.emptyState('还没有饮食记录');
    } else {
      listHtml = '<div class="life-record-list">' + records.slice(0, 30).map(r => {
        const [bg, color] = (mealColors[r.meal] || 'var(--bg-light)|var(--text-light)').split('|');
        return `<div class="life-record">
          <div class="life-record-icon" style="background:${bg}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
          </div>
          <div class="life-record-content">
            <div class="life-record-title">${mealLabels[r.meal] || '饮食'} · ${this.esc(r.food)}</div>
            <div class="life-record-detail">${Storage.formatDate(r.date)}${r.calories ? ' · 约' + r.calories + 'kcal' : ''}</div>
          </div>
          <button class="btn-ghost btn-icon" onclick="Pages.deleteDiet('${r.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`;
      }).join('') + '</div>';
    }

    return `
      <div style="margin-bottom:16px">
        <button class="btn btn-primary" onclick="Pages.openDietModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          记录饮食
        </button>
      </div>
      ${todayRecords.length > 0 ? `<div class="card" style="margin-bottom:16px"><div style="font-size:13px;color:var(--text-light);margin-bottom:8px">今日已记录 ${todayRecords.length} 餐</div></div>` : ''}
      ${listHtml}
    `;
  },

  openDietModal() {
    App.showModal('记录饮食', `
      <div class="input-group">
        <label class="input-label">餐次</label>
        <div class="chip-group" id="dietMealGroup">
          ${['breakfast','lunch','dinner','snack'].map((m,i) => {
            const labels = {breakfast:'早餐', lunch:'午餐', dinner:'晚餐', snack:'加餐'};
            return `<button class="chip ${i===0?'active':''}" data-meal="${m}" onclick="Pages.selectChip(this,'dietMealGroup')">${labels[m]}</button>`;
          }).join('')}
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">食物</label>
        <input class="input" id="dietFood" placeholder="吃了什么？">
      </div>
      <div class="input-group">
        <label class="input-label">热量（可选）</label>
        <input class="input" id="dietCalories" type="number" placeholder="大约热量 kcal">
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" onclick="Pages.saveDiet()">保存</button>
      </div>
    `);
  },

  saveDiet() {
    const meal = document.querySelector('#dietMealGroup .chip.active').dataset.meal;
    const food = document.getElementById('dietFood').value.trim();
    const calories = document.getElementById('dietCalories').value;
    if (!food) { App.toast('请输入食物'); return; }
    Storage.addDietRecord({ meal, food, calories: calories ? parseInt(calories) : null });
    App.closeModal();
    App.toast('记录成功');
    document.getElementById('lifeContent').innerHTML = this.renderDiet();
  },

  deleteDiet(id) {
    Storage.deleteDietRecord(id);
    document.getElementById('lifeContent').innerHTML = this.renderDiet();
  },

  renderSleep() {
    const records = Storage.getSleepRecords();
    let listHtml = '';
    if (records.length === 0) {
      listHtml = this.emptyState('还没有睡眠记录');
    } else {
      listHtml = '<div class="life-record-list">' + records.slice(0, 30).map(r => {
        const qualityStars = '★'.repeat(r.quality || 3) + '☆'.repeat(5 - (r.quality || 3));
        return `<div class="life-record">
          <div class="life-record-icon" style="background:var(--secondary)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </div>
          <div class="life-record-content">
            <div class="life-record-title">${r.bedtime || '未知'} → ${r.wakeTime || '未知'}</div>
            <div class="life-record-detail">${Storage.formatDate(r.date)} · ${qualityStars}${r.duration ? ' · ' + r.duration + '小时' : ''}</div>
          </div>
          <button class="btn-ghost btn-icon" onclick="Pages.deleteSleep('${r.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`;
      }).join('') + '</div>';
    }

    return `
      <div style="margin-bottom:16px">
        <button class="btn btn-primary" onclick="Pages.openSleepModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          记录睡眠
        </button>
      </div>
      ${listHtml}
    `;
  },

  openSleepModal() {
    App.showModal('记录睡眠', `
      <div class="form-row">
        <div class="input-group">
          <label class="input-label">入睡时间</label>
          <input class="input" id="sleepBedtime" type="time" value="23:00">
        </div>
        <div class="input-group">
          <label class="input-label">起床时间</label>
          <input class="input" id="sleepWake" type="time" value="07:00">
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">睡眠质量</label>
        <div class="chip-group" id="sleepQualityGroup">
          ${[1,2,3,4,5].map((q,i) => `<button class="chip ${i===2?'active':''}" data-q="${q}" onclick="Pages.selectChip(this,'sleepQualityGroup')">${'★'.repeat(q)}</button>`).join('')}
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">备注（可选）</label>
        <input class="input" id="sleepNotes" placeholder="如：做梦、失眠等">
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" onclick="Pages.saveSleep()">保存</button>
      </div>
    `);
  },

  saveSleep() {
    const bedtime = document.getElementById('sleepBedtime').value;
    const wakeTime = document.getElementById('sleepWake').value;
    const quality = parseInt(document.querySelector('#sleepQualityGroup .chip.active').dataset.q);
    const notes = document.getElementById('sleepNotes').value;

    let duration = null;
    if (bedtime && wakeTime) {
      const [bh, bm] = bedtime.split(':').map(Number);
      const [wh, wm] = wakeTime.split(':').map(Number);
      let mins = (wh * 60 + wm) - (bh * 60 + bm);
      if (mins < 0) mins += 24 * 60;
      duration = Math.round(mins / 60 * 10) / 10;
    }

    Storage.addSleepRecord({ bedtime, wakeTime, quality, duration, notes });
    App.closeModal();
    App.toast('记录成功');
    document.getElementById('lifeContent').innerHTML = this.renderSleep();
  },

  deleteSleep(id) {
    Storage.deleteSleepRecord(id);
    document.getElementById('lifeContent').innerHTML = this.renderSleep();
  },

  renderExercise() {
    const records = Storage.getExerciseRecords();
    const typeLabels = { running: '跑步', walking: '步行', gym: '健身', yoga: '瑜伽', cycling: '骑行', other: '其他' };
    const typeColors = { running: 'var(--red-light)|var(--red)', walking: 'var(--green-light)|#5A8F6E', gym: 'var(--amber-light)|#B8860B', yoga: 'var(--purple-light)|#9B8EC7', cycling: 'var(--secondary)|var(--text)', other: 'var(--bg-light)|var(--text-light)' };

    let listHtml = '';
    if (records.length === 0) {
      listHtml = this.emptyState('还没有运动记录');
    } else {
      listHtml = '<div class="life-record-list">' + records.slice(0, 30).map(r => {
        const [bg, color] = (typeColors[r.type] || typeColors.other).split('|');
        return `<div class="life-record">
          <div class="life-record-icon" style="background:${bg}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M6.5 6.5h11M6.5 17.5h11M4 6.5v11M20 6.5v11M4 12h16"/></svg>
          </div>
          <div class="life-record-content">
            <div class="life-record-title">${typeLabels[r.type] || '运动'} · ${r.duration}分钟</div>
            <div class="life-record-detail">${Storage.formatDate(r.date)}${r.intensity ? ' · 强度：' + r.intensity : ''}</div>
          </div>
          <button class="btn-ghost btn-icon" onclick="Pages.deleteExercise('${r.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`;
      }).join('') + '</div>';
    }

    return `
      <div style="margin-bottom:16px">
        <button class="btn btn-primary" onclick="Pages.openExerciseModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          记录运动
        </button>
      </div>
      ${listHtml}
    `;
  },

  openExerciseModal() {
    App.showModal('记录运动', `
      <div class="input-group">
        <label class="input-label">运动类型</label>
        <div class="chip-group" id="exerciseTypeGroup">
          ${['running','walking','gym','yoga','cycling','other'].map((t,i) => {
            const labels = {running:'跑步', walking:'步行', gym:'健身', yoga:'瑜伽', cycling:'骑行', other:'其他'};
            return `<button class="chip ${i===0?'active':''}" data-type="${t}" onclick="Pages.selectChip(this,'exerciseTypeGroup')">${labels[t]}</button>`;
          }).join('')}
        </div>
      </div>
      <div class="form-row">
        <div class="input-group">
          <label class="input-label">时长（分钟）</label>
          <input class="input" id="exerciseDuration" type="number" value="30" min="1">
        </div>
        <div class="input-group">
          <label class="input-label">强度</label>
          <select class="select" id="exerciseIntensity">
            <option value="低">低</option>
            <option value="中" selected>中</option>
            <option value="高">高</option>
          </select>
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">备注（可选）</label>
        <input class="input" id="exerciseNotes" placeholder="如：跑了5公里">
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" onclick="Pages.saveExercise()">保存</button>
      </div>
    `);
  },

  saveExercise() {
    const type = document.querySelector('#exerciseTypeGroup .chip.active').dataset.type;
    const duration = parseInt(document.getElementById('exerciseDuration').value);
    const intensity = document.getElementById('exerciseIntensity').value;
    const notes = document.getElementById('exerciseNotes').value;
    if (!duration || duration < 1) { App.toast('请输入时长'); return; }
    Storage.addExerciseRecord({ type, duration, intensity, notes });
    App.closeModal();
    App.toast('记录成功');
    document.getElementById('lifeContent').innerHTML = this.renderExercise();
  },

  deleteExercise(id) {
    Storage.deleteExerciseRecord(id);
    document.getElementById('lifeContent').innerHTML = this.renderExercise();
  },

  renderPeriod() {
    const records = Storage.getPeriodRecords();
    const flowLabels = { light: '量少', medium: '正常', heavy: '量多' };
    const flowColors = { light: 'var(--primary)|var(--primary-deep)', medium: 'var(--red-light)|var(--red)', heavy: 'var(--purple-light)|#9B8EC7' };

    let listHtml = '';
    let cycleInfo = '';

    if (records.length > 0) {
      const latest = records[0];
      const latestDate = new Date(latest.date);
      const today = new Date();
      const daysSince = Math.floor((today - latestDate) / 86400000);

      if (records.length >= 2) {
        const prevDate = new Date(records[1].date);
        const cycle = Math.floor((latestDate - prevDate) / 86400000);
        cycleInfo = `<div class="card" style="margin-bottom:16px">
          <div style="font-size:13px;color:var(--text-light)">上次经期开始</div>
          <div style="font-size:18px;font-weight:600;color:var(--primary-deep);margin-top:4px">${Storage.formatDateLong(latest.date)}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">距今 ${daysSince} 天 · 上次周期 ${cycle} 天</div>
        </div>`;
      } else {
        cycleInfo = `<div class="card" style="margin-bottom:16px">
          <div style="font-size:13px;color:var(--text-light)">上次经期开始</div>
          <div style="font-size:18px;font-weight:600;color:var(--primary-deep);margin-top:4px">${Storage.formatDateLong(latest.date)}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">距今 ${daysSince} 天</div>
        </div>`;
      }
    }

    if (records.length === 0) {
      listHtml = this.emptyState('还没有经期记录');
    } else {
      listHtml = '<div class="life-record-list">' + records.slice(0, 30).map(r => {
        const [bg, color] = (flowColors[r.flow] || flowColors.medium).split('|');
        return `<div class="life-record">
          <div class="life-record-icon" style="background:${bg}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </div>
          <div class="life-record-content">
            <div class="life-record-title">${Storage.formatDateLong(r.date)} · ${flowLabels[r.flow] || '正常'}</div>
            <div class="life-record-detail">${Storage.formatDate(r.date)}${r.notes ? ' · ' + this.esc(r.notes) : ''}</div>
          </div>
          <button class="btn-ghost btn-icon" onclick="Pages.deletePeriod('${r.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`;
      }).join('') + '</div>';
    }

    return `
      <div style="margin-bottom:16px">
        <button class="btn btn-primary" onclick="Pages.openPeriodModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          记录经期
        </button>
      </div>
      ${cycleInfo}
      ${listHtml}
    `;
  },

  openPeriodModal() {
    const today = Storage.dateToStr(new Date());
    App.showModal('记录经期', `
      <div class="input-group">
        <label class="input-label">日期</label>
        <input class="input" id="periodDate" type="date" value="${today}">
      </div>
      <div class="input-group">
        <label class="input-label">经量</label>
        <div class="chip-group" id="periodFlowGroup">
          ${['light','medium','heavy'].map((f,i) => {
            const labels = {light:'量少', medium:'正常', heavy:'量多'};
            return `<button class="chip ${i===1?'active':''}" data-flow="${f}" onclick="Pages.selectChip(this,'periodFlowGroup')">${labels[f]}</button>`;
          }).join('')}
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">备注（可选）</label>
        <input class="input" id="periodNotes" placeholder="如：痛经、情绪变化等">
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" onclick="Pages.savePeriod()">保存</button>
      </div>
    `);
  },

  savePeriod() {
    const dateStr = document.getElementById('periodDate').value;
    const flow = document.querySelector('#periodFlowGroup .chip.active').dataset.flow;
    const notes = document.getElementById('periodNotes').value;
    if (!dateStr) { App.toast('请选择日期'); return; }
    const ts = new Date(dateStr + 'T00:00:00').getTime();
    Storage.addPeriodRecord({ date: ts, flow, notes });
    App.closeModal();
    App.toast('记录成功');
    document.getElementById('lifeContent').innerHTML = this.renderPeriod();
  },

  deletePeriod(id) {
    Storage.deletePeriodRecord(id);
    document.getElementById('lifeContent').innerHTML = this.renderPeriod();
  },

  // ========== 工作相关 ==========
  page_work() {
    const tab = this.currentSubTab.work || 'marketing';
    const tabs = [
      { key: 'marketing', label: '营销策划' },
      { key: 'video', label: '洗发水视频剪辑' }
    ];

    let tabHtml = tabs.map(t =>
      `<button class="tab ${tab === t.key ? 'active' : ''}" onclick="Pages.switchWorkTab('${t.key}')">${t.label}</button>`
    ).join('');

    let contentHtml = '';
    if (tab === 'marketing') contentHtml = this.renderMarketing();
    else contentHtml = this.renderVideo();

    this.container.innerHTML = `
      <h1 class="page-title">工作相关</h1>
      <p class="page-subtitle">营销策划与洗发水信息流视频剪辑</p>
      <div class="tabs">${tabHtml}</div>
      <div id="workContent">${contentHtml}</div>
    `;
  },

  switchWorkTab(tab) {
    this.currentSubTab.work = tab;
    this.render('work');
  },

  renderMarketing() {
    const projects = Storage.getMarketingProjects();
    let html = `
      <div style="margin-bottom:16px">
        <button class="btn btn-primary" onclick="Pages.openMarketingModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新建项目
        </button>
      </div>
    `;

    if (projects.length === 0) {
      html += this.emptyState('还没有营销策划项目');
    } else {
      html += '<div class="project-grid">';
      projects.forEach(p => {
        const statusLabels = { todo: '待启动', progress: '进行中', done: '已完成' };
        const statusBadges = { todo: 'badge-todo', progress: 'badge-progress', done: 'badge-done' };
        const tasks = p.tasks || [];
        const doneTasks = tasks.filter(t => t.done).length;
        const progress = tasks.length > 0 ? Math.round(doneTasks / tasks.length * 100) : 0;

        html += `<div class="project-card" onclick="Pages.openMarketingDetail('${p.id}')">
          <div class="project-card-header">
            <div class="project-title">${this.esc(p.title)}</div>
            <span class="project-badge ${statusBadges[p.status] || 'badge-todo'}">${statusLabels[p.status] || '待启动'}</span>
          </div>
          ${p.desc ? `<div class="project-desc">${this.esc(p.desc)}</div>` : ''}
          <div class="project-meta">
            <div class="project-progress">
              <div class="project-progress-bar"><div class="project-progress-fill" style="width:${progress}%"></div></div>
              <span>${doneTasks}/${tasks.length}</span>
            </div>
            ${p.deadline ? `<span>${Storage.formatDateLong(p.deadline)}</span>` : ''}
          </div>
        </div>`;
      });
      html += '</div>';
    }
    return html;
  },

  openMarketingModal() {
    App.showModal('新建营销策划项目', `
      <div class="input-group">
        <label class="input-label">项目名称</label>
        <input class="input" id="mkTitle" placeholder="如：618洗发水促销方案">
      </div>
      <div class="input-group">
        <label class="input-label">项目描述</label>
        <textarea class="textarea" id="mkDesc" placeholder="项目目标和概述..."></textarea>
      </div>
      <div class="form-row">
        <div class="input-group">
          <label class="input-label">截止日期</label>
          <input class="input" id="mkDeadline" type="date">
        </div>
        <div class="input-group">
          <label class="input-label">状态</label>
          <select class="select" id="mkStatus">
            <option value="todo">待启动</option>
            <option value="progress" selected>进行中</option>
            <option value="done">已完成</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" onclick="Pages.saveMarketing()">创建</button>
      </div>
    `);
  },

  saveMarketing() {
    const title = document.getElementById('mkTitle').value.trim();
    const desc = document.getElementById('mkDesc').value;
    const deadline = document.getElementById('mkDeadline').value;
    const status = document.getElementById('mkStatus').value;
    if (!title) { App.toast('请输入项目名称'); return; }
    Storage.addMarketingProject({
      title, desc,
      deadline: deadline ? new Date(deadline + 'T00:00:00').getTime() : null,
      status, tasks: []
    });
    App.closeModal();
    App.toast('创建成功');
    document.getElementById('workContent').innerHTML = this.renderMarketing();
  },

  openMarketingDetail(id) {
    const proj = Storage.getMarketingProjects().find(p => p.id === id);
    if (!proj) return;
    const statusLabels = { todo: '待启动', progress: '进行中', done: '已完成' };
    const tasks = proj.tasks || [];

    let tasksHtml = '';
    if (tasks.length === 0) {
      tasksHtml = this.emptyState('暂无任务');
    } else {
      tasksHtml = '<div class="task-list">' + tasks.map(t => `
        <div class="task-item ${t.done ? 'done' : ''}">
          <div class="task-checkbox ${t.done ? 'checked' : ''}" onclick="Pages.toggleMarketingTask('${id}','${t.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span class="task-text">${this.esc(t.text)}</span>
        </div>
      `).join('') + '</div>';
    }

    App.showModal(proj.title, `
      ${proj.desc ? `<p style="font-size:14px;color:var(--text-light);margin-bottom:16px">${this.esc(proj.desc)}</p>` : ''}
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <span class="project-badge ${proj.status === 'done' ? 'badge-done' : proj.status === 'progress' ? 'badge-progress' : 'badge-todo'}">${statusLabels[proj.status]}</span>
        ${proj.deadline ? `<span style="font-size:12px;color:var(--text-muted);align-self:center">截止：${Storage.formatDateLong(proj.deadline)}</span>` : ''}
      </div>
      <div class="section-header"><h2 style="font-size:16px">任务清单</h2></div>
      ${tasksHtml}
      <div class="task-add-row" style="margin-top:12px">
        <input class="task-add-input" id="mkTaskInput" placeholder="添加任务..." onkeydown="if(event.key==='Enter')Pages.addMarketingTaskFromModal('${id}')">
        <button class="btn btn-primary btn-sm" onclick="Pages.addMarketingTaskFromModal('${id}')">添加</button>
      </div>
      <div style="display:flex;gap:8px;justify-content:space-between;margin-top:20px">
        <button class="btn btn-danger" onclick="Pages.deleteMarketing('${id}')">删除项目</button>
        <button class="btn btn-secondary" onclick="App.closeModal()">关闭</button>
      </div>
    `);
  },

  addMarketingTaskFromModal(projectId) {
    const input = document.getElementById('mkTaskInput');
    const text = input.value.trim();
    if (!text) return;
    Storage.addMarketingTask(projectId, text);
    App.closeModal();
    this.openMarketingDetail(projectId);
    document.getElementById('workContent').innerHTML = this.renderMarketing();
  },

  toggleMarketingTask(projectId, taskId) {
    Storage.toggleMarketingTask(projectId, taskId);
    App.closeModal();
    this.openMarketingDetail(projectId);
    document.getElementById('workContent').innerHTML = this.renderMarketing();
  },

  deleteMarketing(id) {
    if (confirm('确定删除这个项目？')) {
      Storage.deleteMarketingProject(id);
      App.closeModal();
      App.toast('已删除');
      document.getElementById('workContent').innerHTML = this.renderMarketing();
    }
  },

  renderVideo() {
    const projects = Storage.getVideoProjects();
    let html = `
      <div style="margin-bottom:16px">
        <button class="btn btn-primary" onclick="Pages.openVideoModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新建视频项目
        </button>
      </div>
    `;

    if (projects.length === 0) {
      html += this.emptyState('还没有视频剪辑项目');
    } else {
      html += '<div class="project-grid">';
      const statusLabels = { draft: '草稿', editing: '剪辑中', review: '待审核', published: '已发布' };
      const statusBadges = { draft: 'badge-todo', editing: 'badge-progress', review: 'badge-progress', published: 'badge-done' };
      const platformLabels = { douyin: '抖音', kuaishou: '快手', xiaohongshu: '小红书', bilibili: 'B站', wechat: '微信视频号', other: '其他' };

      projects.forEach(p => {
        html += `<div class="project-card" onclick="Pages.openVideoDetail('${p.id}')">
          <div class="project-card-header">
            <div class="project-title">${this.esc(p.title)}</div>
            <span class="project-badge ${statusBadges[p.status] || 'badge-todo'}">${statusLabels[p.status] || '草稿'}</span>
          </div>
          ${p.desc ? `<div class="project-desc">${this.esc(p.desc)}</div>` : ''}
          <div class="project-meta">
            <span>${platformLabels[p.platform] || '未指定平台'}</span>
            <span>进度 ${p.progress || 0}%</span>
          </div>
        </div>`;
      });
      html += '</div>';
    }
    return html;
  },

  openVideoModal() {
    App.showModal('新建视频项目', `
      <div class="input-group">
        <label class="input-label">视频标题</label>
        <input class="input" id="vdTitle" placeholder="如：控油洗发水种草视频">
      </div>
      <div class="input-group">
        <label class="input-label">描述</label>
        <textarea class="textarea" id="vdDesc" placeholder="视频内容和目标..."></textarea>
      </div>
      <div class="form-row">
        <div class="input-group">
          <label class="input-label">发布平台</label>
          <select class="select" id="vdPlatform">
            <option value="douyin">抖音</option>
            <option value="kuaishou">快手</option>
            <option value="xiaohongshu">小红书</option>
            <option value="bilibili">B站</option>
            <option value="wechat">微信视频号</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">状态</label>
          <select class="select" id="vdStatus">
            <option value="draft">草稿</option>
            <option value="editing" selected>剪辑中</option>
            <option value="review">待审核</option>
            <option value="published">已发布</option>
          </select>
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">完成进度：${0}%</label>
        <input class="input" id="vdProgress" type="range" min="0" max="100" value="0" oninput="this.previousElementSibling.textContent='完成进度：'+this.value+'%'">
      </div>
      <div class="input-group">
        <label class="input-label">截止日期</label>
        <input class="input" id="vdDeadline" type="date">
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" onclick="Pages.saveVideo()">创建</button>
      </div>
    `);
  },

  saveVideo() {
    const title = document.getElementById('vdTitle').value.trim();
    const desc = document.getElementById('vdDesc').value;
    const platform = document.getElementById('vdPlatform').value;
    const status = document.getElementById('vdStatus').value;
    const progress = parseInt(document.getElementById('vdProgress').value);
    const deadline = document.getElementById('vdDeadline').value;
    if (!title) { App.toast('请输入视频标题'); return; }
    Storage.addVideoProject({
      title, desc, platform, status, progress,
      deadline: deadline ? new Date(deadline + 'T00:00:00').getTime() : null
    });
    App.closeModal();
    App.toast('创建成功');
    document.getElementById('workContent').innerHTML = this.renderVideo();
  },

  openVideoDetail(id) {
    const proj = Storage.getVideoProjects().find(p => p.id === id);
    if (!proj) return;
    const statusLabels = { draft: '草稿', editing: '剪辑中', review: '待审核', published: '已发布' };
    const platformLabels = { douyin: '抖音', kuaishou: '快手', xiaohongshu: '小红书', bilibili: 'B站', wechat: '微信视频号', other: '其他' };

    App.showModal(proj.title, `
      ${proj.desc ? `<p style="font-size:14px;color:var(--text-light);margin-bottom:16px">${this.esc(proj.desc)}</p>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        <span class="project-badge ${proj.status === 'published' ? 'badge-done' : 'badge-progress'}">${statusLabels[proj.status]}</span>
        <span class="project-badge badge-todo">${platformLabels[proj.platform]}</span>
        ${proj.deadline ? `<span style="font-size:12px;color:var(--text-muted);align-self:center">截止：${Storage.formatDateLong(proj.deadline)}</span>` : ''}
      </div>
      <div class="input-group">
        <label class="input-label">完成进度：${proj.progress || 0}%</label>
        <input type="range" min="0" max="100" value="${proj.progress || 0}" oninput="this.previousElementSibling.textContent='完成进度：'+this.value+'%';Pages._videoProgress=this.value" id="vdProgressSlider">
      </div>
      <div class="input-group">
        <label class="input-label">状态</label>
        <select class="select" id="vdStatusSelect" onchange="Pages._videoStatus=this.value">
          <option value="draft" ${proj.status==='draft'?'selected':''}>草稿</option>
          <option value="editing" ${proj.status==='editing'?'selected':''}>剪辑中</option>
          <option value="review" ${proj.status==='review'?'selected':''}>待审核</option>
          <option value="published" ${proj.status==='published'?'selected':''}>已发布</option>
        </select>
      </div>
      <div style="display:flex;gap:8px;justify-content:space-between;margin-top:20px">
        <button class="btn btn-danger" onclick="Pages.deleteVideo('${id}')">删除</button>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="App.closeModal()">关闭</button>
          <button class="btn btn-primary" onclick="Pages.updateVideo('${id}')">保存</button>
        </div>
      </div>
    `);
    this._videoProgress = proj.progress || 0;
    this._videoStatus = proj.status;
  },

  updateVideo(id) {
    Storage.updateVideoProject(id, {
      progress: parseInt(this._videoProgress) || 0,
      status: this._videoStatus || 'editing'
    });
    App.closeModal();
    App.toast('已更新');
    document.getElementById('workContent').innerHTML = this.renderVideo();
  },

  deleteVideo(id) {
    if (confirm('确定删除这个视频项目？')) {
      Storage.deleteVideoProject(id);
      App.closeModal();
      App.toast('已删除');
      document.getElementById('workContent').innerHTML = this.renderVideo();
    }
  },

  // ========== 学习相关 ==========
  page_study() {
    const tab = this.currentSubTab.study || 'english';
    const tabs = [
      { key: 'english', label: '英语学习' },
      { key: 'korean', label: '韩语学习' },
      { key: 'reading', label: '读书' }
    ];

    let tabHtml = tabs.map(t =>
      `<button class="tab ${tab === t.key ? 'active' : ''}" onclick="Pages.switchStudyTab('${t.key}')">${t.label}</button>`
    ).join('');

    let contentHtml = '';
    if (tab === 'english') contentHtml = this.renderEnglish();
    else if (tab === 'korean') contentHtml = this.renderKorean();
    else contentHtml = this.renderReading();

    this.container.innerHTML = `
      <h1 class="page-title">学习相关</h1>
      <p class="page-subtitle">持续学习，不断成长</p>
      <div class="tabs">${tabHtml}</div>
      <div id="studyContent">${contentHtml}</div>
    `;
  },

  switchStudyTab(tab) {
    this.currentSubTab.study = tab;
    this.render('study');
  },

  renderEnglish() {
    const logs = Storage.getEnglishLogs();
    const typeLabels = { vocab: '背单词', listening: '听力', reading: '阅读', speaking: '口语', grammar: '语法', writing: '写作' };
    const typeColors = { vocab: 'var(--secondary)|var(--text)', listening: 'var(--green-light)|#5A8F6E', reading: 'var(--amber-light)|#B8860B', speaking: 'var(--purple-light)|#9B8EC7', grammar: 'var(--secondary)|var(--secondary-dark)', writing: 'var(--primary)|var(--primary-deep)' };

    let listHtml = '';
    if (logs.length === 0) {
      listHtml = this.emptyState('还没有英语学习记录');
    } else {
      listHtml = '<div class="study-log-list">' + logs.slice(0, 50).map(l => {
        const [bg, color] = (typeColors[l.type] || typeColors.vocab).split('|');
        return `<div class="study-log">
          <span class="study-log-type" style="background:${bg};color:${color}">${typeLabels[l.type] || '学习'}</span>
          <div class="study-log-content">
            ${this.esc(l.content)}
            ${l.detail ? `<div class="study-log-detail">${this.esc(l.detail)}</div>` : ''}
          </div>
          <span class="study-log-date">${Storage.formatDate(l.date)}</span>
          <button class="btn-ghost btn-icon" onclick="Pages.deleteEnglish('${l.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`;
      }).join('') + '</div>';
    }

    return `
      <div style="margin-bottom:16px">
        <button class="btn btn-primary" onclick="Pages.openEnglishModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          记录学习
        </button>
      </div>
      ${listHtml}
    `;
  },

  openEnglishModal() {
    App.showModal('记录英语学习', `
      <div class="input-group">
        <label class="input-label">学习类型</label>
        <div class="chip-group" id="englishTypeGroup">
          ${['vocab','listening','reading','speaking','grammar','writing'].map((t,i) => {
            const labels = {vocab:'背单词', listening:'听力', reading:'阅读', speaking:'口语', grammar:'语法', writing:'写作'};
            return `<button class="chip ${i===0?'active':''}" data-type="${t}" onclick="Pages.selectChip(this,'englishTypeGroup')">${labels[t]}</button>`;
          }).join('')}
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">学习内容</label>
        <input class="input" id="enContent" placeholder="如：背诵50个四级词汇">
      </div>
      <div class="input-group">
        <label class="input-label">详细备注（可选）</label>
        <textarea class="textarea" id="enDetail" placeholder="学到的知识点、难点等"></textarea>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" onclick="Pages.saveEnglish()">保存</button>
      </div>
    `);
  },

  saveEnglish() {
    const type = document.querySelector('#englishTypeGroup .chip.active').dataset.type;
    const content = document.getElementById('enContent').value.trim();
    const detail = document.getElementById('enDetail').value;
    if (!content) { App.toast('请输入学习内容'); return; }
    Storage.addEnglishLog({ type, content, detail });
    App.closeModal();
    App.toast('记录成功');
    document.getElementById('studyContent').innerHTML = this.renderEnglish();
  },

  deleteEnglish(id) {
    Storage.deleteEnglishLog(id);
    document.getElementById('studyContent').innerHTML = this.renderEnglish();
  },

  renderKorean() {
    const logs = Storage.getKoreanLogs();
    const typeLabels = { vocab: '背单词', listening: '听力', reading: '阅读', speaking: '口语', grammar: '语法', writing: '写作' };
    const typeColors = { vocab: 'var(--secondary)|var(--text)', listening: 'var(--green-light)|#5A8F6E', reading: 'var(--amber-light)|#B8860B', speaking: 'var(--purple-light)|#9B8EC7', grammar: 'var(--secondary)|var(--secondary-dark)', writing: 'var(--primary)|var(--primary-deep)' };

    let listHtml = '';
    if (logs.length === 0) {
      listHtml = this.emptyState('还没有韩语学习记录');
    } else {
      listHtml = '<div class="study-log-list">' + logs.slice(0, 50).map(l => {
        const [bg, color] = (typeColors[l.type] || typeColors.vocab).split('|');
        return `<div class="study-log">
          <span class="study-log-type" style="background:${bg};color:${color}">${typeLabels[l.type] || '学习'}</span>
          <div class="study-log-content">
            ${this.esc(l.content)}
            ${l.detail ? `<div class="study-log-detail">${this.esc(l.detail)}</div>` : ''}
          </div>
          <span class="study-log-date">${Storage.formatDate(l.date)}</span>
          <button class="btn-ghost btn-icon" onclick="Pages.deleteKorean('${l.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`;
      }).join('') + '</div>';
    }

    return `
      <div style="margin-bottom:16px">
        <button class="btn btn-primary" onclick="Pages.openKoreanModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          记录学习
        </button>
      </div>
      ${listHtml}
    `;
  },

  openKoreanModal() {
    App.showModal('记录韩语学习', `
      <div class="input-group">
        <label class="input-label">学习类型</label>
        <div class="chip-group" id="koreanTypeGroup">
          ${['vocab','listening','reading','speaking','grammar','writing'].map((t,i) => {
            const labels = {vocab:'背单词', listening:'听力', reading:'阅读', speaking:'口语', grammar:'语法', writing:'写作'};
            return `<button class="chip ${i===0?'active':''}" data-type="${t}" onclick="Pages.selectChip(this,'koreanTypeGroup')">${labels[t]}</button>`;
          }).join('')}
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">学习内容</label>
        <input class="input" id="krContent" placeholder="如：学习韩语辅音">
      </div>
      <div class="input-group">
        <label class="input-label">详细备注（可选）</label>
        <textarea class="textarea" id="krDetail" placeholder="学到的知识点、难点等"></textarea>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" onclick="Pages.saveKorean()">保存</button>
      </div>
    `);
  },

  saveKorean() {
    const type = document.querySelector('#koreanTypeGroup .chip.active').dataset.type;
    const content = document.getElementById('krContent').value.trim();
    const detail = document.getElementById('krDetail').value;
    if (!content) { App.toast('请输入学习内容'); return; }
    Storage.addKoreanLog({ type, content, detail });
    App.closeModal();
    App.toast('记录成功');
    document.getElementById('studyContent').innerHTML = this.renderKorean();
  },

  deleteKorean(id) {
    Storage.deleteKoreanLog(id);
    document.getElementById('studyContent').innerHTML = this.renderKorean();
  },

  renderReading() {
    const books = Storage.getBooks();
    let html = `
      <div style="margin-bottom:16px">
        <button class="btn btn-primary" onclick="Pages.openBookModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          添加书目
        </button>
      </div>
    `;

    if (books.length === 0) {
      html += this.emptyState('还没有读书记录');
    } else {
      html += '<div class="book-list">';
      const statusLabels = { reading: '阅读中', finished: '已读完', planned: '计划读' };
      books.forEach(b => {
        const progress = b.totalPages > 0 ? Math.round((b.currentPage || 0) / b.totalPages * 100) : 0;
        html += `<div class="book-card">
          <div class="book-cover">${this.esc((b.title || '').substring(0, 6))}</div>
          <div class="book-info">
            <div class="book-title">${this.esc(b.title)}</div>
            <div class="book-author">${b.author ? this.esc(b.author) : '未知作者'}</div>
            <div class="book-progress-text">
              ${statusLabels[b.status] || '阅读中'} · 第${b.currentPage || 0}/${b.totalPages || '?'}页 · ${progress}%
            </div>
            <div class="progress-bar" style="margin-top:6px"><div class="progress-fill" style="width:${progress}%"></div></div>
            ${b.notes ? `<div style="font-size:12px;color:var(--text-muted);margin-top:8px">${this.esc(b.notes)}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <button class="btn btn-secondary btn-sm" onclick="Pages.openBookModal('${b.id}')">编辑</button>
            <button class="btn btn-ghost btn-sm" onclick="Pages.deleteBook('${b.id}')">删除</button>
          </div>
        </div>`;
      });
      html += '</div>';
    }
    return html;
  },

  openBookModal(id) {
    let book = null;
    if (id) book = Storage.getBooks().find(b => b.id === id);

    App.showModal(book ? '编辑书目' : '添加书目', `
      <div class="input-group">
        <label class="input-label">书名</label>
        <input class="input" id="bookTitle" value="${book ? this.esc(book.title) : ''}" placeholder="书名">
      </div>
      <div class="input-group">
        <label class="input-label">作者</label>
        <input class="input" id="bookAuthor" value="${book ? this.esc(book.author) : ''}" placeholder="作者">
      </div>
      <div class="form-row">
        <div class="input-group">
          <label class="input-label">当前页</label>
          <input class="input" id="bookCurrent" type="number" min="0" value="${book ? book.currentPage || 0 : 0}">
        </div>
        <div class="input-group">
          <label class="input-label">总页数</label>
          <input class="input" id="bookTotal" type="number" min="1" value="${book ? book.totalPages || '' : ''}">
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">状态</label>
        <select class="select" id="bookStatus">
          <option value="planned" ${book && book.status === 'planned' ? 'selected' : ''}>计划读</option>
          <option value="reading" ${(!book || book.status === 'reading') ? 'selected' : ''}>阅读中</option>
          <option value="finished" ${book && book.status === 'finished' ? 'selected' : ''}>已读完</option>
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">读书笔记（可选）</label>
        <textarea class="textarea" id="bookNotes" placeholder="记录读后感和重要内容...">${book ? this.esc(book.notes || '') : ''}</textarea>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" onclick="Pages.saveBook('${id || ''}')">保存</button>
      </div>
    `);
  },

  saveBook(id) {
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const currentPage = parseInt(document.getElementById('bookCurrent').value) || 0;
    const totalPages = parseInt(document.getElementById('bookTotal').value) || 0;
    const status = document.getElementById('bookStatus').value;
    const notes = document.getElementById('bookNotes').value;
    if (!title) { App.toast('请输入书名'); return; }

    if (status === 'finished') {
      // Auto-set current page to total if finished
      const finalPage = totalPages > 0 ? totalPages : currentPage;
      if (id) {
        Storage.updateBook(id, { title, author, currentPage: finalPage, totalPages, status, notes });
      } else {
        Storage.addBook({ title, author, currentPage: finalPage, totalPages, status, notes });
      }
    } else {
      if (id) {
        Storage.updateBook(id, { title, author, currentPage, totalPages, status, notes });
      } else {
        Storage.addBook({ title, author, currentPage, totalPages, status, notes });
      }
    }
    App.closeModal();
    App.toast('保存成功');
    document.getElementById('studyContent').innerHTML = this.renderReading();
  },

  deleteBook(id) {
    if (confirm('确定删除这本书？')) {
      Storage.deleteBook(id);
      App.toast('已删除');
      document.getElementById('studyContent').innerHTML = this.renderReading();
    }
  },

  // ========== 记账 ==========
  accountingState: { date: new Date(), tab: 'today' },

  page_accounting() {
    const tab = this.currentSubTab.accounting || 'today';
    this.accountingState.tab = tab;

    const dateStr = Storage.dateToStr(this.accountingState.date);
    const stats = Storage.getAccountingStats(dateStr);
    const weekday = ['日','一','二','三','四','五','六'][this.accountingState.date.getDay()];
    const dateDisplay = `${this.accountingState.date.getFullYear()}年${this.accountingState.date.getMonth()+1}月${this.accountingState.date.getDate()}日 星期${weekday}`;

    // Savings goal progress (mock: 30% of income as savings goal)
    const savingsGoal = stats.income > 0 ? stats.income * 0.3 : 0;
    const savingsProgress = savingsGoal > 0 ? Math.min(Math.round(stats.savings / savingsGoal * 100), 100) : 0;

    let contentHtml = '';
    if (tab === 'today') contentHtml = this.renderAccountingToday(dateStr, stats, dateDisplay, savingsProgress, savingsGoal);
    else if (tab === 'list') contentHtml = this.renderAccountingList();
    else if (tab === 'month') contentHtml = this.renderAccountingMonth();
    else if (tab === 'trend') contentHtml = this.renderAccountingTrend();
    else if (tab === 'savings') contentHtml = this.renderAccountingSavings();

    this.container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <h1 class="page-title">记账</h1>
          <p class="page-subtitle">记录每一天收入、消费、储蓄</p>
        </div>
        <button class="btn btn-primary" onclick="Pages.triggerWechatImport()" style="white-space:nowrap;font-size:13px;padding:8px 14px">
          📥 导入微信账单
        </button>
      </div>
      <input type="file" id="wechatCsvInput" accept=".csv,text/csv" style="display:none" onchange="Pages.handleWechatCsv(this)">
      ${contentHtml}
    `;
  },

  renderAccountingToday(dateStr, stats, dateDisplay, savingsProgress, savingsGoal) {
    const txs = Storage.getTransactionsByDate(dateStr);

    let listHtml = '';
    if (txs.length === 0) {
      listHtml = this.emptyState('今日还没有记账记录');
    } else {
      listHtml = '<div class="transaction-list">' + txs.map(t => {
        const isIncome = t.type === 'income';
        const emoji = isIncome ? '💰' : (this.getExpenseEmoji(t.category) || '💸');
        const sign = isIncome ? '+' : '-';
        return `<div class="transaction-item">
          <div class="transaction-emoji">${emoji}</div>
          <div class="transaction-content">
            <div class="transaction-title">${this.esc(t.category)}${t.location ? ' · ' + this.esc(t.location) : ''}</div>
            <div class="transaction-detail">${this.esc(t.payment || '现金')} · ${Storage.formatDate(t.date)}${t.notes ? ' · ' + this.esc(t.notes) : ''}${t.imported ? ' · 📥' : ''}</div>
          </div>
          <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">${sign}¥${this.esc(t.amount)}</div>
          <div class="transaction-actions">
            <button class="btn-ghost btn-icon" onclick="Pages.editTransaction('${t.id}')" title="编辑">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-ghost btn-icon" onclick="Pages.deleteTransaction('${t.id}')" title="删除">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>`;
      }).join('') + '</div>';
    }

    return `
      <div class="accounting-header">
        <h2>📓 今日记账小助手</h2>
        <p>记录每一天收入、消费、储蓄 🌿</p>
        <div class="accounting-date-bar">
          <button class="date-nav-btn" onclick="Pages.changeAccountingDate(-1)" style="background:rgba(255,255,255,0.5);border:none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <input type="date" value="${dateStr}" onchange="Pages.setAccountingDate(this.value)">
          <button class="date-nav-btn" onclick="Pages.changeAccountingDate(1)" style="background:rgba(255,255,255,0.5);border:none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div class="savings-progress">
          <div class="savings-progress-label"><span>本月储蓄进度</span><span>${savingsProgress}%</span></div>
          <div class="savings-progress-bar"><div class="savings-progress-fill" style="width:${savingsProgress}%"></div></div>
        </div>
      </div>

      <div class="accounting-stats">
        <div class="accounting-stat-card">
          <span class="accounting-stat-emoji">💰</span>
          <div>
            <div class="accounting-stat-label">今日收入</div>
            <div class="accounting-stat-value income">¥${stats.income.toFixed(2)}</div>
            <div class="accounting-stat-count">${stats.incomeCount}笔</div>
          </div>
        </div>
        <div class="accounting-stat-card">
          <span class="accounting-stat-emoji">🛒</span>
          <div>
            <div class="accounting-stat-label">今日消费</div>
            <div class="accounting-stat-value expense">¥${stats.expense.toFixed(2)}</div>
            <div class="accounting-stat-count">${stats.expenseCount}笔</div>
          </div>
        </div>
        <div class="accounting-stat-card">
          <span class="accounting-stat-emoji">🐷</span>
          <div>
            <div class="accounting-stat-label">今日储蓄</div>
            <div class="accounting-stat-value savings">¥${stats.savings.toFixed(2)}</div>
            <div class="accounting-stat-count">结余</div>
          </div>
        </div>
      </div>

      <div class="accounting-balance">
        今日净结余 = <strong>¥${stats.savings.toFixed(2)}</strong>
      </div>

      <div class="quick-accounting">
        <h3>📝 快速记账</h3>
        <div class="accounting-form-row">
          <div class="input-group">
            <label class="input-label">💰 金额 *</label>
            <input class="input" id="accAmount" type="number" step="0.01" placeholder="0.00">
          </div>
          <div class="input-group">
            <label class="input-label">🕐 时间</label>
            <input class="input" id="accTime" type="datetime-local" value="${dateStr}T${new Date().getHours().toString().padStart(2,'0')}:${new Date().getMinutes().toString().padStart(2,'0')}">
          </div>
        </div>
        <div class="accounting-form-row full">
          <div class="input-group">
            <label class="input-label">📍 地点 *</label>
            <input class="input" id="accLocation" placeholder="如：家里、公司、超市">
          </div>
        </div>
        <div class="accounting-form-row">
          <div class="input-group">
            <label class="input-label">📋 大类 *</label>
            <div class="chip-group" id="accTypeGroup">
              <button class="chip active" data-type="income" onclick="Pages.selectChip(this,'accTypeGroup');Pages.updateAccCategories()">💰 收入</button>
              <button class="chip" data-type="expense" onclick="Pages.selectChip(this,'accTypeGroup');Pages.updateAccCategories()">💸 支出</button>
            </div>
          </div>
        </div>
        <div class="accounting-form-row full">
          <div class="input-group">
            <label class="input-label">🏷️ 分类 *</label>
            <select class="select" id="accCategory">
              <option value="工资">工资</option>
              <option value="奖金">奖金</option>
              <option value="兼职">兼职</option>
              <option value="理财">理财</option>
              <option value="红包">红包</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>
        <div class="accounting-form-row full">
          <div class="input-group">
            <label class="input-label">💳 支付方式 *</label>
            <div class="chip-group" id="accPaymentGroup">
              ${['微信支付','支付宝','现金','银行卡','信用卡','其他'].map((p,i) => `<button class="chip ${i===0?'active':''}" data-payment="${p}" onclick="Pages.selectChip(this,'accPaymentGroup')">${p}</button>`).join('')}
            </div>
          </div>
        </div>
        <div class="accounting-form-row full">
          <div class="input-group">
            <label class="input-label">📝 备注（可选）</label>
            <input class="input" id="accNotes" placeholder="补充说明...">
          </div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-secondary" onclick="Pages.clearAccountingForm()">清空</button>
          <button class="btn btn-primary" onclick="Pages.saveTransaction()">保存记账</button>
        </div>
      </div>

      ${this.renderAccountingBottomNav('today')}

      <div class="section-header"><h2>今日明细</h2></div>
      ${listHtml}
    `;
  },

  renderAccountingList() {
    const txs = Storage.getTransactions().slice(0, 100);
    let listHtml = '';
    if (txs.length === 0) {
      listHtml = this.emptyState('还没有记账记录');
    } else {
      let currentDate = '';
      listHtml = '<div class="transaction-list">';
      txs.forEach(t => {
        const d = Storage.dateToStr(new Date(t.date));
        if (d !== currentDate) {
          currentDate = d;
          listHtml += `<div style="font-size:12px;font-weight:600;color:var(--text-muted);padding:8px 4px;margin-top:8px">${d}</div>`;
        }
        const isIncome = t.type === 'income';
        const emoji = isIncome ? '💰' : (this.getExpenseEmoji(t.category) || '💸');
        const sign = isIncome ? '+' : '-';
        listHtml += `<div class="transaction-item">
          <div class="transaction-emoji">${emoji}</div>
          <div class="transaction-content">
            <div class="transaction-title">${this.esc(t.category)}${t.location ? ' · ' + this.esc(t.location) : ''}</div>
            <div class="transaction-detail">${this.esc(t.payment || '现金')}${t.notes ? ' · ' + this.esc(t.notes) : ''}${t.imported ? ' · 📥' : ''}</div>
          </div>
          <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">${sign}¥${this.esc(t.amount)}</div>
          <div class="transaction-actions">
            <button class="btn-ghost btn-icon" onclick="Pages.editTransaction('${t.id}')" title="编辑">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-ghost btn-icon" onclick="Pages.deleteTransaction('${t.id}')" title="删除">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>`;
      });
      listHtml += '</div>';
    }

    return `
      ${this.renderAccountingBottomNav('list')}
      <div class="section-header"><h2>全部账单</h2></div>
      ${listHtml}
    `;
  },

  renderAccountingMonth() {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const monthTxs = Storage.getTransactionsByMonth(yearMonth);
    const stats = { income: 0, expense: 0 };
    monthTxs.forEach(t => {
      if (t.type === 'income') stats.income += parseFloat(t.amount) || 0;
      else stats.expense += parseFloat(t.amount) || 0;
    });

    // Category breakdown
    const catMap = {};
    monthTxs.forEach(t => {
      if (!catMap[t.category]) catMap[t.category] = 0;
      catMap[t.category] += parseFloat(t.amount) || 0;
    });
    const catItems = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

    let catHtml = '';
    if (catItems.length === 0) {
      catHtml = this.emptyState('本月暂无数据');
    } else {
      const maxVal = catItems[0][1];
      catHtml = '<div style="display:flex;flex-direction:column;gap:10px">' + catItems.map(([cat, amount]) => {
        const pct = Math.round(amount / maxVal * 100);
        return `<div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
            <span>${this.esc(cat)}</span>
            <span style="font-weight:600">¥${amount.toFixed(2)}</span>
          </div>
          <div class="progress-bar" style="margin-bottom:0;height:6px"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>`;
      }).join('') + '</div>';
    }

    return `
      ${this.renderAccountingBottomNav('month')}
      <div class="card" style="margin-bottom:16px">
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px">${now.getFullYear()}年${now.getMonth()+1}月</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px">
          <div>
            <div style="font-size:12px;color:var(--text-muted)">收入</div>
            <div style="font-size:22px;font-weight:700;color:#5A8F6E">¥${stats.income.toFixed(2)}</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--text-muted)">支出</div>
            <div style="font-size:22px;font-weight:700;color:#C08080">¥${stats.expense.toFixed(2)}</div>
          </div>
        </div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-light)">
          <div style="font-size:12px;color:var(--text-muted)">结余</div>
          <div style="font-size:18px;font-weight:700;color:var(--text)">¥${(stats.income - stats.expense).toFixed(2)}</div>
        </div>
      </div>
      <div class="section-header"><h2>分类统计</h2></div>
      <div class="card">${catHtml}</div>
    `;
  },

  renderAccountingTrend() {
    // Last 7 days trend
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(Storage.dateToStr(d));
    }

    const data = days.map(d => {
      const txs = Storage.getTransactionsByDate(d);
      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
      return { date: d.slice(5), income, expense };
    });

    const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1);

    const barsHtml = data.map(d => {
      const hIncome = Math.round(d.income / maxVal * 100);
      const hExpense = Math.round(d.expense / maxVal * 100);
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="display:flex;align-items:flex-end;gap:2px;height:120px">
          <div style="width:14px;background:linear-gradient(to top,var(--secondary),var(--secondary-dark));border-radius:4px 4px 0 0;height:${hIncome}%;min-height:2px" title="收入 ¥${d.income.toFixed(2)}"></div>
          <div style="width:14px;background:linear-gradient(to top,var(--primary),var(--primary-dark));border-radius:4px 4px 0 0;height:${hExpense}%;min-height:2px" title="支出 ¥${d.expense.toFixed(2)}"></div>
        </div>
        <span style="font-size:10px;color:var(--text-muted)">${d.date}</span>
      </div>`;
    }).join('');

    return `
      ${this.renderAccountingBottomNav('trend')}
      <div class="section-header"><h2>近7天收支趋势</h2></div>
      <div class="card">
        <div style="display:flex;gap:4px;margin-bottom:12px;justify-content:center">
          <span style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text-light)"><span style="width:10px;height:10px;border-radius:2px;background:linear-gradient(135deg,var(--secondary),var(--secondary-dark));display:inline-block"></span>收入</span>
          <span style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text-light)"><span style="width:10px;height:10px;border-radius:2px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));display:inline-block"></span>支出</span>
        </div>
        <div style="display:flex;gap:8px;align-items:flex-end;padding:8px 0">${barsHtml}</div>
      </div>
    `;
  },

  renderAccountingSavings() {
    const allTxs = Storage.getTransactions();
    const totalIncome = allTxs.filter(t => t.type === 'income').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    const totalExpense = allTxs.filter(t => t.type === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    const totalSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round(totalSavings / totalIncome * 100) : 0;

    return `
      ${this.renderAccountingBottomNav('savings')}
      <div class="section-header"><h2>储蓄概览</h2></div>
      <div class="card" style="text-align:center;padding:32px 20px">
        <div style="font-size:14px;color:var(--text-muted);margin-bottom:8px">累计储蓄</div>
        <div style="font-size:36px;font-weight:700;color:var(--text);margin-bottom:8px">¥${totalSavings.toFixed(2)}</div>
        <div style="font-size:13px;color:var(--text-light)">储蓄率 ${savingsRate}%</div>
        <div class="progress-bar" style="margin-top:16px;margin-bottom:0">
          <div class="progress-fill" style="width:${Math.max(0, Math.min(savingsRate, 100))}%"></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px">
        <div class="card" style="text-align:center">
          <div style="font-size:12px;color:var(--text-muted)">累计收入</div>
          <div style="font-size:20px;font-weight:700;color:#5A8F6E;margin-top:4px">¥${totalIncome.toFixed(2)}</div>
        </div>
        <div class="card" style="text-align:center">
          <div style="font-size:12px;color:var(--text-muted)">累计支出</div>
          <div style="font-size:20px;font-weight:700;color:#C08080;margin-top:4px">¥${totalExpense.toFixed(2)}</div>
        </div>
      </div>
    `;
  },

  renderAccountingBottomNav(activeTab) {
    const items = [
      { key: 'today', label: '首页', emoji: '🏠' },
      { key: 'list', label: '账单', emoji: '📅' },
      { key: 'month', label: '月度', emoji: '📊' },
      { key: 'trend', label: '趋势', emoji: '📈' },
      { key: 'savings', label: '储蓄', emoji: '💎' }
    ];
    return `<div class="accounting-bottom-nav">
      ${items.map(item => `<button class="accounting-nav-item ${activeTab === item.key ? 'active' : ''}" onclick="Pages.switchAccountingTab('${item.key}')">
        <span class="accounting-nav-emoji">${item.emoji}</span>
        <span>${item.label}</span>
      </button>`).join('')}
    </div>`;
  },

  switchAccountingTab(tab) {
    this.currentSubTab.accounting = tab;
    this.render('accounting');
  },

  changeAccountingDate(delta) {
    const d = new Date(this.accountingState.date);
    d.setDate(d.getDate() + delta);
    this.accountingState.date = d;
    this.render('accounting');
  },

  setAccountingDate(dateStr) {
    this.accountingState.date = new Date(dateStr + 'T00:00:00');
    this.render('accounting');
  },

  updateAccCategories() {
    const type = document.querySelector('#accTypeGroup .chip.active')?.dataset.type || 'income';
    const select = document.getElementById('accCategory');
    const cats = type === 'income'
      ? ['工资','奖金','兼职','理财','红包','其他']
      : ['餐饮','交通','购物','娱乐','住房','医疗','教育','通讯','美容','其他'];
    select.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
  },

  getExpenseEmoji(category) {
    const map = {
      '餐饮': '🍜', '交通': '🚗', '购物': '🛍️', '娱乐': '🎮',
      '住房': '🏠', '医疗': '💊', '教育': '📖', '通讯': '📱',
      '美容': '💄', '其他': '📦'
    };
    return map[category];
  },

  // ===== 微信账单导入 =====
  triggerWechatImport() {
    document.getElementById('wechatCsvInput').click();
  },

  handleWechatCsv(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      let text = e.target.result;
      // 尝试检测编码，如果乱码则用GBK重读
      if (text.includes('�')) {
        const reader2 = new FileReader();
        reader2.onload = (e2) => {
          this.parseWechatCSV(e2.target.result);
        };
        reader2.readAsText(file, 'GBK');
      } else {
        this.parseWechatCSV(text);
      }
    };
    reader.readAsText(file, 'UTF-8');
    input.value = '';
  },

  parseWechatCSV(text) {
    const lines = text.split(/\r?\n/);
    // 找到列头行（包含"交易时间"的行）
    let headerIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('交易时间') && lines[i].includes('收/支')) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) {
      App.toast('未识别到微信账单格式，请确认文件正确');
      return;
    }

    const headers = this._parseCsvLine(lines[headerIdx]);
    // 找到各列索引
    const colMap = {};
    headers.forEach((h, i) => {
      const h2 = h.trim();
      if (h2.includes('交易时间')) colMap.time = i;
      else if (h2.includes('交易类型')) colMap.type = i;
      else if (h2.includes('交易对方')) colMap.merchant = i;
      else if (h2.includes('商品')) colMap.goods = i;
      else if (h2.includes('收/支')) colMap.flow = i;
      else if (h2.includes('金额')) colMap.amount = i;
      else if (h2.includes('支付方式')) colMap.payment = i;
      else if (h2.includes('当前状态')) colMap.status = i;
      else if (h2.includes('交易单号')) colMap.tradeId = i;
      else if (h2.includes('备注')) colMap.remark = i;
    });

    const transactions = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('-') || line.includes('微信支付账单')) continue;
      const cols = this._parseCsvLine(line);
      if (cols.length < 5) continue;

      const flow = (cols[colMap.flow] || '').trim();
      const amountStr = (cols[colMap.amount] || '').replace(/[¥￥,，\s]/g, '').trim();
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount === 0) continue;
      // 只导入收入和支出，跳过"/"（转账等）
      if (flow !== '收入' && flow !== '支出') continue;

      const status = (cols[colMap.status] || '').trim();
      if (status && !status.includes('成功') && !status.includes('已完成')) continue;

      const timeStr = (cols[colMap.time] || '').trim();
      const date = this._parseWechatDate(timeStr);
      const goods = (cols[colMap.goods] || '').trim();
      const merchant = (cols[colMap.merchant] || '').trim();
      const typeStr = (cols[colMap.type] || '').trim();
      const category = this._mapWechatCategory(typeStr, goods, merchant);
      const payment = this._mapWechatPayment((cols[colMap.payment] || '').trim());

      transactions.push({
        amount: amount.toFixed(2),
        date,
        type: flow === '收入' ? 'income' : 'expense',
        category,
        payment,
        location: merchant || goods || '',
        notes: goods && merchant && goods !== merchant ? `${goods}` : (typeStr || ''),
        wxTradeId: (cols[colMap.tradeId] || '').trim() || undefined,
        imported: true
      });
    }

    if (transactions.length === 0) {
      App.toast('未找到可导入的账单记录');
      return;
    }

    this._showImportPreview(transactions);
  },

  _parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  },

  _parseWechatDate(timeStr) {
    // 格式: 2024-01-15 12:30:45
    const m = timeStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (m) return new Date(m[1], m[2]-1, m[3], m[4], m[5], m[6]).getTime();
    // 尝试 2024/01/15 12:30
    const m2 = timeStr.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{1,2})/);
    if (m2) return new Date(m2[1], m2[2]-1, m2[3], m2[4], m2[5]).getTime();
    return Date.now();
  },

  _mapWechatCategory(typeStr, goods, merchant) {
    const text = `${typeStr} ${goods} ${merchant}`;
    if (/餐饮|外卖|美食|餐厅|星巴克|麦当劳|肯德基|奶茶|咖啡|食品|超市|便利店/.test(text)) return '餐饮';
    if (/打车|滴滴|地铁|公交|高铁|火车|机票|加油|停车|出行|骑行|单车/.test(text)) return '交通';
    if (/淘宝|京东|拼多多|天猫|商城|购物|百货|服饰|数码|电器|化妆品/.test(text)) return '购物';
    if (/电影|游戏|门票|旅游|KTV|娱乐|视频|音乐|会员/.test(text)) return '娱乐';
    if (/房租|水电|物业|燃气|宽带|房贷/.test(text)) return '住房';
    if (/医院|药|诊所|健康|体检|医疗/.test(text)) return '医疗';
    if (/学费|培训|课程|书|教育|知识/.test(text)) return '教育';
    if (/话费|流量|充值|通讯|联通|移动|电信/.test(text)) return '通讯';
    if (/美容|理发|美甲|SPA|护肤/.test(text)) return '美容';
    if (/工资|薪资|转账|退款|红包|退款|理财|收益|利息/.test(text)) return '其他';
    return '其他';
  },

  _mapWechatPayment(paymentStr) {
    if (!paymentStr) return '微信支付';
    if (/零钱/.test(paymentStr)) return '微信支付';
    if (/储蓄卡|借记卡|银行卡/.test(paymentStr)) return '银行卡';
    if (/信用卡/.test(paymentStr)) return '信用卡';
    if (/余额|支付宝/.test(paymentStr)) return '支付宝';
    return '微信支付';
  },

  _showImportPreview(transactions) {
    this._importData = transactions;
    const incomeCount = transactions.filter(t => t.type === 'income').length;
    const expenseCount = transactions.filter(t => t.type === 'expense').length;
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);

    const rowsHtml = transactions.map((t, i) => {
      const isIncome = t.type === 'income';
      const expenseCats = ['餐饮','交通','购物','娱乐','住房','医疗','教育','通讯','美容','其他'];
      const incomeCats = ['工资','奖金','兼职','理财','红包','其他'];
      const cats = isIncome ? incomeCats : expenseCats;
      const emoji = isIncome ? '💰' : (this.getExpenseEmoji(t.category) || '💸');
      return `<tr class="import-row" data-idx="${i}">
        <td style="font-size:12px;color:var(--text-muted);white-space:nowrap">${Storage.formatDate(t.date)}</td>
        <td>${emoji}</td>
        <td><input class="import-edit-amount" type="number" step="0.01" value="${t.amount}" style="width:70px;font-size:13px"></td>
        <td>
          <select class="import-edit-category" style="font-size:12px;padding:2px 4px">
            ${cats.map(c => `<option value="${c}" ${c===t.category?'selected':''}>${c}</option>`).join('')}
          </select>
        </td>
        <td style="font-size:12px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${this.esc(t.location)}">${this.esc(t.location)}</td>
        <td>
          <span class="import-type-badge ${isIncome ? 'income' : 'expense'}">${isIncome ? '收入' : '支出'}</span>
        </td>
      </tr>`;
    }).join('');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'importPreviewModal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:680px;max-height:85vh;display:flex;flex-direction:column">
        <div class="modal-header">
          <h2>📥 微信账单导入预览</h2>
          <button class="modal-close" onclick="App.closeModal()">&times;</button>
        </div>
        <div style="padding:0 20px">
          <div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap">
            <div class="import-stat"><span class="import-stat-num income">+¥${totalIncome.toFixed(2)}</span><span class="import-stat-label">收入 ${incomeCount}笔</span></div>
            <div class="import-stat"><span class="import-stat-num expense">-¥${totalExpense.toFixed(2)}</span><span class="import-stat-label">支出 ${expenseCount}笔</span></div>
            <div class="import-stat"><span class="import-stat-num">${transactions.length}</span><span class="import-stat-label">总计</span></div>
          </div>
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">可编辑每条的金额和分类，确认后点击导入</p>
        </div>
        <div style="overflow-y:auto;flex:1;padding:0 20px 10px">
          <table class="import-table">
            <thead>
              <tr><th>时间</th><th></th><th>金额</th><th>分类</th><th>说明</th><th>类型</th></tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
        <div class="modal-footer" style="padding:16px 20px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
          <button class="btn btn-primary" onclick="Pages.confirmImport()">确认导入 (${transactions.length}条)</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  confirmImport() {
    if (!this._importData) return;
    // 读取编辑后的值
    const rows = document.querySelectorAll('#importPreviewModal .import-row');
    rows.forEach(row => {
      const idx = parseInt(row.dataset.idx);
      const amountInput = row.querySelector('.import-edit-amount');
      const categorySelect = row.querySelector('.import-edit-category');
      if (amountInput) this._importData[idx].amount = parseFloat(amountInput.value).toFixed(2);
      if (categorySelect) this._importData[idx].category = categorySelect.value;
    });

    const result = Storage.addTransactions(this._importData);
    App.closeModal();
    this._importData = null;
    App.toast(`导入成功 ${result.imported} 条${result.skipped > 0 ? `，跳过重复 ${result.skipped} 条` : ''}`);
    this.render('accounting');
  },

  saveTransaction() {
    const amount = document.getElementById('accAmount').value;
    const time = document.getElementById('accTime').value;
    const location = document.getElementById('accLocation').value.trim();
    const type = document.querySelector('#accTypeGroup .chip.active')?.dataset.type || 'expense';
    const category = document.getElementById('accCategory').value;
    const payment = document.querySelector('#accPaymentGroup .chip.active')?.dataset.payment || '微信支付';
    const notes = document.getElementById('accNotes').value.trim();

    if (!amount || parseFloat(amount) <= 0) { App.toast('请输入金额'); return; }
    if (!location) { App.toast('请输入地点'); return; }

    const date = time ? new Date(time).getTime() : Date.now();
    Storage.addTransaction({
      amount: parseFloat(amount).toFixed(2),
      date,
      location,
      type,
      category,
      payment,
      notes
    });
    App.toast('记账成功');
    this.render('accounting');
  },

  clearAccountingForm() {
    document.getElementById('accAmount').value = '';
    document.getElementById('accLocation').value = '';
    document.getElementById('accNotes').value = '';
  },

  deleteTransaction(id) {
    if (confirm('确定删除这条记账记录？')) {
      Storage.deleteTransaction(id);
      App.toast('已删除');
      this.render('accounting');
    }
  },

  editTransaction(id) {
    const txs = Storage.getTransactions();
    const tx = txs.find(t => t.id === id);
    if (!tx) return;
    const isIncome = tx.type === 'income';
    const expenseCats = ['餐饮','交通','购物','娱乐','住房','医疗','教育','通讯','美容','其他'];
    const incomeCats = ['工资','奖金','兼职','理财','红包','其他'];
    const cats = isIncome ? incomeCats : expenseCats;
    const dateObj = new Date(tx.date);
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
    const timeStr = `${String(dateObj.getHours()).padStart(2,'0')}:${String(dateObj.getMinutes()).padStart(2,'0')}`;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'editTxModal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:460px">
        <div class="modal-header">
          <h2>✏️ 编辑账单</h2>
          <button class="modal-close" onclick="App.closeModal()">&times;</button>
        </div>
        <div style="padding:0 20px 16px">
          <div style="display:flex;gap:8px;margin-bottom:12px">
            <button class="chip ${isIncome?'active':''}" data-type="income" onclick="Pages._editTxType('income')" id="editTypeIncome">💰 收入</button>
            <button class="chip ${!isIncome?'active':''}" data-type="expense" onclick="Pages._editTxType('expense')" id="editTypeExpense">💸 支出</button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
            <div>
              <label style="font-size:13px;color:var(--text-muted);margin-bottom:4px;display:block">💰 金额</label>
              <input class="input" id="editAmount" type="number" step="0.01" value="${tx.amount}" style="width:100%">
            </div>
            <div>
              <label style="font-size:13px;color:var(--text-muted);margin-bottom:4px;display:block">🏷️ 分类</label>
              <select class="select" id="editCategory" style="width:100%">
                ${cats.map(c => `<option value="${c}" ${c===tx.category?'selected':''}>${c}</option>`).join('')}
              </select>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
            <div>
              <label style="font-size:13px;color:var(--text-muted);margin-bottom:4px;display:block">🕐 日期</label>
              <input class="input" id="editDate" type="date" value="${dateStr}" style="width:100%">
            </div>
            <div>
              <label style="font-size:13px;color:var(--text-muted);margin-bottom:4px;display:block">⏰ 时间</label>
              <input class="input" id="editTime" type="time" value="${timeStr}" style="width:100%">
            </div>
          </div>
          <div style="margin-bottom:10px">
            <label style="font-size:13px;color:var(--text-muted);margin-bottom:4px;display:block">📍 地点/说明</label>
            <input class="input" id="editLocation" value="${this.esc(tx.location || '')}" style="width:100%">
          </div>
          <div style="display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:10px">
            <div>
              <label style="font-size:13px;color:var(--text-muted);margin-bottom:4px;display:block">💳 支付方式</label>
              <select class="select" id="editPayment" style="width:100%">
                ${['微信支付','支付宝','现金','银行卡','信用卡','其他'].map(p => `<option value="${p}" ${p===tx.payment?'selected':''}>${p}</option>`).join('')}
              </select>
            </div>
          </div>
          <div style="margin-bottom:10px">
            <label style="font-size:13px;color:var(--text-muted);margin-bottom:4px;display:block">📝 备注</label>
            <input class="input" id="editNotes" value="${this.esc(tx.notes || '')}" style="width:100%">
          </div>
        </div>
        <div class="modal-footer" style="padding:16px 20px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
          <button class="btn btn-primary" onclick="Pages.saveEditTransaction('${id}')">保存修改</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this._editTxId = id;
    this._editTxCurrentType = isIncome ? 'income' : 'expense';
  },

  _editTxType(type) {
    document.getElementById('editTypeIncome').classList.toggle('active', type === 'income');
    document.getElementById('editTypeExpense').classList.toggle('active', type === 'expense');
    this._editTxCurrentType = type;
    const cats = type === 'income'
      ? ['工资','奖金','兼职','理财','红包','其他']
      : ['餐饮','交通','购物','娱乐','住房','医疗','教育','通讯','美容','其他'];
    const select = document.getElementById('editCategory');
    const currentVal = select.value;
    select.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
    if (cats.includes(currentVal)) select.value = currentVal;
  },

  saveEditTransaction(id) {
    const amount = document.getElementById('editAmount').value;
    const category = document.getElementById('editCategory').value;
    const dateStr = document.getElementById('editDate').value;
    const timeStr = document.getElementById('editTime').value;
    const location = document.getElementById('editLocation').value.trim();
    const payment = document.getElementById('editPayment').value;
    const notes = document.getElementById('editNotes').value.trim();
    const type = this._editTxCurrentType || 'expense';

    if (!amount || parseFloat(amount) <= 0) { App.toast('请输入有效金额'); return; }
    const date = new Date(dateStr + 'T' + (timeStr || '00:00')).getTime();

    Storage.updateTransaction(id, {
      amount: parseFloat(amount).toFixed(2),
      category,
      date,
      location,
      payment,
      notes,
      type
    });
    App.closeModal();
    App.toast('修改成功');
    this.render('accounting');
  },

  // ===== Utility =====
  selectChip(el, groupId) {
    document.querySelectorAll('#' + groupId + ' .chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
  }
};
