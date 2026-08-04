/* ===== imSept2 数据存储层 ===== */

const Storage = {
  KEY: 'imSept2_data',

  data: null,

  init() {
    this.load();
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        this.data = JSON.parse(raw);
      } else {
        this.data = this.getDefault();
        this.save();
      }
    } catch (e) {
      this.data = this.getDefault();
      this.save();
    }
  },

  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('保存失败:', e);
    }
  },

  getDefault() {
    return {
      notes: [],
      plans: {
        daily: {},
        weekly: {},
        summaries: []
      },
      life: {
        diet: [],
        sleep: [],
        exercise: [],
        period: []
      },
      work: {
        marketing: [],
        video: []
      },
      study: {
        english: [],
        korean: [],
        reading: []
      },
      accounting: {
        transactions: [],
        categories: {
          income: ['工资', '奖金', '兼职', '理财', '红包', '其他'],
          expense: ['餐饮', '交通', '购物', '娱乐', '住房', '医疗', '教育', '通讯', '美容', '其他']
        }
      }
    };
  },

  // ===== Notes (微博随手记) =====
  getNotes() {
    return (this.data.notes || []).sort((a, b) => (b.publishTime || b.timestamp) - (a.publishTime || a.timestamp));
  },

  getNotesByDate(dateStr) {
    return this.getNotes().filter(n => {
      const d = new Date(n.publishTime || n.timestamp);
      return this.dateToStr(d) === dateStr;
    });
  },

  getNoteDatesInMonth(year, month) {
    const notes = this.data.notes || [];
    const dates = new Set();
    notes.forEach(n => {
      const d = new Date(n.publishTime || n.timestamp);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        dates.add(d.getDate());
      }
    });
    return dates;
  },

  addNote(data) {
    const note = {
      id: Date.now().toString(),
      content: (data.content || '').trim(),
      timestamp: Date.now(),
      publishTime: data.publishTime || Date.now(),
      images: data.images || [],
      comments: data.comments || [],
      likes: data.likes || 0,
      likedByMe: data.likedByMe || false,
      avatarId: data.avatarId || 'default',
      nickname: data.nickname || '主人',
      ip: data.ip || '',
      device: data.device || '',
      location: data.location || '',
      views: data.views || 0,
      reposts: data.reposts || 0
    };
    this.data.notes.unshift(note);
    this.save();
    return note;
  },

  updateNote(id, data) {
    const note = this.data.notes.find(n => n.id === id);
    if (note) {
      Object.assign(note, data);
      this.save();
    }
  },

  deleteNote(id) {
    this.data.notes = this.data.notes.filter(n => n.id !== id);
    this.save();
  },

  toggleNoteLike(id) {
    const note = this.data.notes.find(n => n.id === id);
    if (note) {
      note.likedByMe = !note.likedByMe;
      note.likes += note.likedByMe ? 1 : -1;
      if (note.likes < 0) note.likes = 0;
      this.save();
    }
  },

  addNoteComment(noteId, data) {
    const note = this.data.notes.find(n => n.id === noteId);
    if (note) {
      if (!note.comments) note.comments = [];
      const text = typeof data === 'string' ? data : (data.text || '');
      if (!text.trim()) return;
      note.comments.push({
        id: Date.now().toString() + '_' + Math.floor(Math.random() * 1000),
        text: text.trim(),
        timestamp: Date.now(),
        nickname: (typeof data === 'object' && data.nickname) ? data.nickname : '主人',
        color: (typeof data === 'object' && data.color) ? data.color : '#666'
      });
      this.save();
    }
  },

  updateNoteComment(noteId, commentId, data) {
    const note = this.data.notes.find(n => n.id === noteId);
    if (note && note.comments) {
      const c = note.comments.find(c => c.id === commentId);
      if (c) {
        Object.assign(c, data);
        this.save();
      }
    }
  },

  deleteNoteComment(noteId, commentId) {
    const note = this.data.notes.find(n => n.id === noteId);
    if (note && note.comments) {
      note.comments = note.comments.filter(c => c.id !== commentId);
      this.save();
    }
  },

  incrementNoteViews(id) {
    const note = this.data.notes.find(n => n.id === id);
    if (note) {
      note.views = (note.views || 0) + 1;
      this.save();
    }
  },

  // ===== Plans - Daily =====
  getDailyPlan(dateStr) {
    return this.data.plans.daily[dateStr] || { tasks: [] };
  },

  saveDailyPlan(dateStr, tasks) {
    this.data.plans.daily[dateStr] = { tasks };
    this.save();
  },

  addDailyTask(dateStr, text) {
    if (!this.data.plans.daily[dateStr]) {
      this.data.plans.daily[dateStr] = { tasks: [] };
    }
    this.data.plans.daily[dateStr].tasks.push({
      id: Date.now().toString(),
      text: text.trim(),
      done: false
    });
    this.save();
  },

  toggleDailyTask(dateStr, taskId) {
    const plan = this.data.plans.daily[dateStr];
    if (plan) {
      const task = plan.tasks.find(t => t.id === taskId);
      if (task) {
        task.done = !task.done;
        this.save();
      }
    }
  },

  deleteDailyTask(dateStr, taskId) {
    const plan = this.data.plans.daily[dateStr];
    if (plan) {
      plan.tasks = plan.tasks.filter(t => t.id !== taskId);
      this.save();
    }
  },

  // ===== Plans - Weekly =====
  getWeeklyPlan(weekKey) {
    return this.data.plans.weekly[weekKey] || { tasks: [] };
  },

  addWeeklyTask(weekKey, text, day) {
    if (!this.data.plans.weekly[weekKey]) {
      this.data.plans.weekly[weekKey] = { tasks: [] };
    }
    this.data.plans.weekly[weekKey].tasks.push({
      id: Date.now().toString(),
      text: text.trim(),
      day: day || 0,
      done: false
    });
    this.save();
  },

  toggleWeeklyTask(weekKey, taskId) {
    const plan = this.data.plans.weekly[weekKey];
    if (plan) {
      const task = plan.tasks.find(t => t.id === taskId);
      if (task) {
        task.done = !task.done;
        this.save();
      }
    }
  },

  deleteWeeklyTask(weekKey, taskId) {
    const plan = this.data.plans.weekly[weekKey];
    if (plan) {
      plan.tasks = plan.tasks.filter(t => t.id !== taskId);
      this.save();
    }
  },

  // ===== Plans - Summaries =====
  getSummaries() {
    return (this.data.plans.summaries || []).sort((a, b) => b.date - a.date);
  },

  getSummary(id) {
    return this.data.plans.summaries.find(s => s.id === id);
  },

  addSummary(title, content, type) {
    const summary = {
      id: Date.now().toString(),
      title: title.trim() || '未命名总结',
      content: content,
      type: type || 'daily',
      date: Date.now()
    };
    this.data.plans.summaries.unshift(summary);
    this.save();
    return summary;
  },

  updateSummary(id, title, content) {
    const summary = this.data.plans.summaries.find(s => s.id === id);
    if (summary) {
      summary.title = title;
      summary.content = content;
      this.save();
    }
  },

  deleteSummary(id) {
    this.data.plans.summaries = this.data.plans.summaries.filter(s => s.id !== id);
    this.save();
  },

  // ===== Life - Diet =====
  getDietRecords() {
    return (this.data.life.diet || []).sort((a, b) => b.date - a.date);
  },

  addDietRecord(record) {
    record.id = Date.now().toString();
    record.date = Date.now();
    this.data.life.diet.unshift(record);
    this.save();
  },

  deleteDietRecord(id) {
    this.data.life.diet = this.data.life.diet.filter(r => r.id !== id);
    this.save();
  },

  // ===== Life - Sleep =====
  getSleepRecords() {
    return (this.data.life.sleep || []).sort((a, b) => b.date - a.date);
  },

  addSleepRecord(record) {
    record.id = Date.now().toString();
    record.date = Date.now();
    this.data.life.sleep.unshift(record);
    this.save();
  },

  deleteSleepRecord(id) {
    this.data.life.sleep = this.data.life.sleep.filter(r => r.id !== id);
    this.save();
  },

  // ===== Life - Exercise =====
  getExerciseRecords() {
    return (this.data.life.exercise || []).sort((a, b) => b.date - a.date);
  },

  addExerciseRecord(record) {
    record.id = Date.now().toString();
    record.date = Date.now();
    this.data.life.exercise.unshift(record);
    this.save();
  },

  deleteExerciseRecord(id) {
    this.data.life.exercise = this.data.life.exercise.filter(r => r.id !== id);
    this.save();
  },

  // ===== Life - Period =====
  getPeriodRecords() {
    return (this.data.life.period || []).sort((a, b) => b.date - a.date);
  },

  addPeriodRecord(record) {
    record.id = Date.now().toString();
    record.date = Date.now();
    this.data.life.period.unshift(record);
    this.save();
  },

  deletePeriodRecord(id) {
    this.data.life.period = this.data.life.period.filter(r => r.id !== id);
    this.save();
  },

  // ===== Work - Marketing =====
  getMarketingProjects() {
    return this.data.work.marketing || [];
  },

  addMarketingProject(project) {
    project.id = Date.now().toString();
    project.createdAt = Date.now();
    this.data.work.marketing.unshift(project);
    this.save();
  },

  updateMarketingProject(id, updates) {
    const proj = this.data.work.marketing.find(p => p.id === id);
    if (proj) {
      Object.assign(proj, updates);
      this.save();
    }
  },

  deleteMarketingProject(id) {
    this.data.work.marketing = this.data.work.marketing.filter(p => p.id !== id);
    this.save();
  },

  addMarketingTask(projectId, text) {
    const proj = this.data.work.marketing.find(p => p.id === projectId);
    if (proj) {
      if (!proj.tasks) proj.tasks = [];
      proj.tasks.push({ id: Date.now().toString(), text: text.trim(), done: false });
      this.save();
    }
  },

  toggleMarketingTask(projectId, taskId) {
    const proj = this.data.work.marketing.find(p => p.id === projectId);
    if (proj && proj.tasks) {
      const task = proj.tasks.find(t => t.id === taskId);
      if (task) { task.done = !task.done; this.save(); }
    }
  },

  // ===== Work - Video =====
  getVideoProjects() {
    return this.data.work.video || [];
  },

  addVideoProject(project) {
    project.id = Date.now().toString();
    project.createdAt = Date.now();
    this.data.work.video.unshift(project);
    this.save();
  },

  updateVideoProject(id, updates) {
    const proj = this.data.work.video.find(p => p.id === id);
    if (proj) {
      Object.assign(proj, updates);
      this.save();
    }
  },

  deleteVideoProject(id) {
    this.data.work.video = this.data.work.video.filter(p => p.id !== id);
    this.save();
  },

  // ===== Study - English =====
  getEnglishLogs() {
    return (this.data.study.english || []).sort((a, b) => b.date - a.date);
  },

  addEnglishLog(log) {
    log.id = Date.now().toString();
    log.date = Date.now();
    this.data.study.english.unshift(log);
    this.save();
  },

  deleteEnglishLog(id) {
    this.data.study.english = this.data.study.english.filter(l => l.id !== id);
    this.save();
  },

  // ===== Study - Korean =====
  getKoreanLogs() {
    return (this.data.study.korean || []).sort((a, b) => b.date - a.date);
  },

  addKoreanLog(log) {
    log.id = Date.now().toString();
    log.date = Date.now();
    this.data.study.korean.unshift(log);
    this.save();
  },

  deleteKoreanLog(id) {
    this.data.study.korean = this.data.study.korean.filter(l => l.id !== id);
    this.save();
  },

  // ===== Study - Reading =====
  getBooks() {
    return this.data.study.reading || [];
  },

  addBook(book) {
    book.id = Date.now().toString();
    book.createdAt = Date.now();
    this.data.study.reading.unshift(book);
    this.save();
  },

  updateBook(id, updates) {
    const book = this.data.study.reading.find(b => b.id === id);
    if (book) {
      Object.assign(book, updates);
      this.save();
    }
  },

  deleteBook(id) {
    this.data.study.reading = this.data.study.reading.filter(b => b.id !== id);
    this.save();
  },

  // ===== Stats =====
  getStats() {
    const notes = this.data.notes || [];
    const today = new Date();
    const todayStr = this.dateToStr(today);
    const todayNotes = notes.filter(n => this.dateToStr(new Date(n.timestamp)) === todayStr);

    const dailyPlan = this.getDailyPlan(todayStr);
    const todayTasks = dailyPlan.tasks || [];
    const doneTasks = todayTasks.filter(t => t.done).length;

    const allLife = (this.data.life.diet || []).length +
      (this.data.life.sleep || []).length +
      (this.data.life.exercise || []).length +
      (this.data.life.period || []).length;

    const allWork = (this.data.work.marketing || []).length +
      (this.data.work.video || []).length;

    const allStudy = (this.data.study.english || []).length +
      (this.data.study.korean || []).length +
      (this.data.study.reading || []).length;

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekNotes = notes.filter(n => n.timestamp >= weekAgo);

    return {
      todayNotes: todayNotes.length,
      todayTasks: todayTasks.length,
      todayTasksDone: doneTasks,
      todayProgress: todayTasks.length > 0 ? Math.round(doneTasks / todayTasks.length * 100) : 0,
      totalNotes: notes.length,
      weekNotes: weekNotes.length,
      totalLife: allLife,
      totalWork: allWork,
      totalStudy: allStudy
    };
  },

  // ===== Date Helpers =====
  dateToStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  getWeekKey(date) {
    const d = new Date(date);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return this.dateToStr(d);
  },

  formatDate(ts) {
    const date = new Date(ts);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    if (y === now.getFullYear()) return `${m}/${d} ${h}:${min}`;
    return `${y}/${m}/${d} ${h}:${min}`;
  },

  formatDateLong(ts) {
    const date = new Date(ts);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}年${m}月${d}日`;
  },

  // ===== Accounting (记账) =====
  getTransactions() {
    return (this.data.accounting?.transactions || []).sort((a, b) => b.date - a.date);
  },

  getTransactionsByDate(dateStr) {
    const all = this.getTransactions();
    return all.filter(t => this.dateToStr(new Date(t.date)) === dateStr);
  },

  getTransactionsByMonth(yearMonth) {
    const all = this.getTransactions();
    return all.filter(t => {
      const d = new Date(t.date);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return ym === yearMonth;
    });
  },

  addTransaction(record) {
    record.id = Date.now().toString();
    if (!this.data.accounting) this.data.accounting = { transactions: [] };
    if (!this.data.accounting.transactions) this.data.accounting.transactions = [];
    this.data.accounting.transactions.unshift(record);
    this.save();
  },

  deleteTransaction(id) {
    if (this.data.accounting?.transactions) {
      this.data.accounting.transactions = this.data.accounting.transactions.filter(t => t.id !== id);
      this.save();
    }
  },

  getAccountingStats(dateStr) {
    const txs = dateStr ? this.getTransactionsByDate(dateStr) : this.getTransactions();
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    const incomeCount = txs.filter(t => t.type === 'income').length;
    const expenseCount = txs.filter(t => t.type === 'expense').length;
    return {
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      savings: Math.round((income - expense) * 100) / 100,
      incomeCount,
      expenseCount,
      totalCount: txs.length
    };
  }
};
