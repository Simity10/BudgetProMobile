/* ========================================================
   SAYTU XALIS - Application Web Complète
   ======================================================== */

// ==================== CONFIG ====================
const API_URL = 'http://localhost:5000/api';
const STORAGE_PREFIX = 'budgetpro';
const CATEGORY_ICONS = {
  Alimentation: '🍽️', Transport: '🚗', Logement: '🏠', 'Santé': '💊',
  Loisirs: '🎮', Shopping: '🛍️', 'Éducation': '📚', 'Vêtements': '👔',
  Factures: '📄', Autre: '📦', Salaire: '💼', Freelance: '💻',
  Commerce: '🏪', Investissement: '📈', Location: '🏘️', Bonus: '🎁',
  Cadeau: '🎀', Transfert: '↔️'
};
const EXPENSE_CATEGORIES = ['Alimentation','Transport','Logement','Santé','Loisirs','Shopping','Éducation','Vêtements','Factures','Autre'];
const THEMES = {
  violet: { name: 'Violet Pro', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  ocean:  { name: 'Ocean',      gradient: 'linear-gradient(135deg, #0077B6, #00B4D8)' },
  sunset: { name: 'Coucher de soleil', gradient: 'linear-gradient(135deg, #FF6B35, #F7931E)' },
  dark:   { name: 'Nuit sombre', gradient: 'linear-gradient(135deg, #1a1a2e, #16213e)' }
};

// ==================== STATE ====================
let currentUser = null;
let authToken = null;
let currentTheme = 'violet';
let chartInstances = {};
let confirmCallback = null;

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  setDefaultDates();
  const stored = localStorage.getItem('currentUser');
  const token = localStorage.getItem('auth_token');
  if (stored && token) {
    try {
      currentUser = JSON.parse(stored);
      authToken = token;
      showPage('app');
      initApp();
    } catch { showPage('landing'); }
  } else {
    showPage('landing');
  }
});

// ==================== NAVIGATION ====================
function showPage(page, subMode) {
  document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
  const el = document.getElementById(page === 'app' ? 'app' : `${page}-page`);
  if (el) el.classList.remove('hidden');
  if (page === 'auth' && subMode) switchAuthTab(subMode);
}

function navigate(pageName) {
  document.querySelectorAll('.app-page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`page-${pageName}`);
  if (page) page.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === pageName);
  });
  if (pageName === 'dashboard') refreshDashboard();
  else if (pageName === 'income') refreshTransactionList('income');
  else if (pageName === 'expense') refreshTransactionList('expense');
  else if (pageName === 'budget') refreshBudget();
  else if (pageName === 'predictions') refreshPredictions();
  else if (pageName === 'settings') refreshSettings();
  window.scrollTo(0, 0);
}

// ==================== AUTH ====================
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁️' : '🙈';
}

async function handleLogin(e) {
  e.preventDefault();
  const identifier = document.getElementById('login-identifier').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  setLoading(btn, true);
  try {
    const res = await apiCall('/auth/login', 'POST', { identifier, password });
    if (res && res.token) {
      authToken = res.token;
      localStorage.setItem('auth_token', res.token);
      currentUser = { _id: res._id, name: res.name, email: res.email, phone: res.phone, isPremium: res.isPremium, joinDate: res.joinDate };
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      showPage('app');
      initApp();
      toast('Connexion réussie !', 'success');
    } else {
      loginOffline(identifier);
    }
  } catch {
    loginOffline(identifier);
  }
  setLoading(btn, false);
}

function loginOffline(identifier) {
  currentUser = { name: identifier, isPremium: false, joinDate: new Date().toLocaleDateString('fr-FR') };
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  showPage('app');
  initApp();
  toast('Mode hors-ligne activé');
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const identifier = document.getElementById('register-identifier').value.trim();
  const password = document.getElementById('register-password').value;
  const confirm = document.getElementById('register-confirm').value;
  if (password !== confirm) return toast('Les mots de passe ne correspondent pas', 'error');
  if (password.length < 6) return toast('Mot de passe minimum 6 caractères', 'error');
  const btn = document.getElementById('register-btn');
  setLoading(btn, true);
  try {
    const res = await apiCall('/auth/register', 'POST', { name, identifier, password });
    if (res && res.token) {
      authToken = res.token;
      localStorage.setItem('auth_token', res.token);
      currentUser = { _id: res._id, name: res.name, email: res.email, phone: res.phone, isPremium: false, joinDate: new Date().toLocaleDateString('fr-FR') };
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      showPage('app');
      initApp();
      toast('Compte créé avec succès !', 'success');
    } else {
      toast(res?.message || 'Erreur de connexion au serveur', 'error');
    }
  } catch {
    toast('Impossible de se connecter au serveur', 'error');
  }
  setLoading(btn, false);
}

function logout() {
  showConfirm('Se déconnecter', 'Voulez-vous vraiment vous déconnecter ?', () => {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_token');
    destroyCharts();
    showPage('landing');
    toast('Déconnecté');
  });
}

// ==================== API ====================
async function apiCall(endpoint, method = 'GET', body = null) {
  try {
    const config = { method, headers: { 'Content-Type': 'application/json' } };
    if (authToken) config.headers['Authorization'] = `Bearer ${authToken}`;
    if (body) config.body = JSON.stringify(body);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    config.signal = controller.signal;
    const res = await fetch(`${API_URL}${endpoint}`, config);
    clearTimeout(timeoutId);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast(err.message || 'Erreur serveur', 'error');
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
}

// ==================== STORAGE ====================
function getKey(suffix) { return `${STORAGE_PREFIX}_${currentUser.name}${suffix ? '_' + suffix : ''}`; }

function getData() {
  try {
    const raw = localStorage.getItem(getKey());
    return raw ? JSON.parse(raw) : { transactions: [] };
  } catch { return { transactions: [] }; }
}

function saveData(data) {
  localStorage.setItem(getKey(), JSON.stringify(data));
}

function getBudgets() {
  try {
    const raw = localStorage.getItem(getKey('budgets'));
    return raw ? JSON.parse(raw) : { monthly: 0, annual: 0, categories: {} };
  } catch { return { monthly: 0, annual: 0, categories: {} }; }
}

function saveBudgetsData(budgets) {
  localStorage.setItem(getKey('budgets'), JSON.stringify(budgets));
  apiCall('/budgets', 'PUT', budgets).catch(() => {});
}

// ==================== APP INIT ====================
function initApp() {
  if (!currentUser) return;
  const avatar = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
  document.getElementById('header-avatar').textContent = avatar;
  navigate('dashboard');
}

function setDefaultDates() {
  const today = new Date().toISOString().split('T')[0];
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(input => { input.value = today; });
}

// ==================== FORMATTING ====================
function fmt(n) { return Number(n).toLocaleString('fr-FR') + ' F'; }
function fmtDate(d) { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }); }

// ==================== DASHBOARD ====================
function refreshDashboard() {
  const data = getData();
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const txThisMonth = data.transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const income = txThisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txThisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const savings = income > 0 ? Math.round((balance / income) * 100) : 0;

  document.getElementById('dashboard-greeting').textContent = `Bonjour, ${currentUser.name} 👋`;
  document.getElementById('dashboard-balance').textContent = fmt(balance);
  document.getElementById('dashboard-balance').style.color = balance >= 0 ? '#2ecc71' : '#e74c3c';
  document.getElementById('stat-income').textContent = fmt(income);
  document.getElementById('stat-expense').textContent = fmt(expense);
  document.getElementById('stat-balance').textContent = fmt(balance);
  document.getElementById('stat-savings').textContent = savings + '%';

  renderRecentTransactions(data.transactions);
  renderCategoryChart(txThisMonth);
}

function renderRecentTransactions(transactions) {
  const container = document.getElementById('recent-transactions');
  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  if (!sorted.length) {
    container.innerHTML = '<p class="empty-state">Aucune transaction ce mois-ci</p>';
    return;
  }
  container.innerHTML = sorted.map(t => `
    <div class="tx-item">
      <div class="tx-icon ${t.type}"> ${t.type === 'income' ? '💰' : '💸'}</div>
      <div class="tx-info">
        <div class="tx-desc">${esc(t.description || t.category)}</div>
        <div class="tx-meta">${esc(t.category)} &bull; ${fmtDate(t.date)}</div>
      </div>
      <div class="tx-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</div>
    </div>
  `).join('');
}

// ==================== CHARTS ====================
function switchChartTab(btn, type) {
  btn.parentElement.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('chart-categories').classList.toggle('hidden', type !== 'categories');
  document.getElementById('chart-monthly').classList.toggle('hidden', type !== 'monthly');
  document.getElementById('chart-comparison').classList.toggle('hidden', type !== 'comparison');
  const data = getData();
  const now = new Date();
  const txThisMonth = data.transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  if (type === 'categories') renderCategoryChart(txThisMonth);
  else if (type === 'monthly') renderMonthlyChart(data.transactions);
  else if (type === 'comparison') renderComparisonChart(data.transactions);
}

const CHART_COLORS = ['#667eea','#e74c3c','#2ecc71','#f39c12','#9b59b6','#00b4d8','#FF6B35','#1abc9c','#e91e63','#34495e'];

function renderCategoryChart(transactions) {
  const expenses = transactions.filter(t => t.type === 'expense');
  const empty = document.getElementById('chart-empty');
  if (!expenses.length) {
    empty.classList.remove('hidden');
    if (chartInstances.categories) { chartInstances.categories.destroy(); chartInstances.categories = null; }
    return;
  }
  empty.classList.add('hidden');
  const grouped = {};
  expenses.forEach(t => { grouped[t.category] = (grouped[t.category] || 0) + t.amount; });
  const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(e => e[0]);
  const values = sorted.map(e => e[1]);
  if (chartInstances.categories) chartInstances.categories.destroy();
  const ctx = document.getElementById('chart-categories').getContext('2d');
  chartInstances.categories = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: CHART_COLORS.slice(0, labels.length), borderWidth: 0 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, font: { size: 11 } } },
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${fmt(ctx.raw)}` } }
      }
    }
  });
}

function renderMonthlyChart(transactions) {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.getMonth(), year: d.getFullYear(), label: d.toLocaleDateString('fr-FR', { month: 'short' }) });
  }
  const values = months.map(m => {
    return transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === m.month && new Date(t.date).getFullYear() === m.year)
      .reduce((s, t) => s + t.amount, 0);
  });
  if (chartInstances.monthly) chartInstances.monthly.destroy();
  const ctx = document.getElementById('chart-monthly').getContext('2d');
  chartInstances.monthly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.map(m => m.label),
      datasets: [{ label: 'Dépenses', data: values, backgroundColor: '#e74c3c88', borderColor: '#e74c3c', borderWidth: 2, borderRadius: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { callback: v => fmt(v) } } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => fmt(ctx.raw) } } }
    }
  });
}

function renderComparisonChart(transactions) {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.getMonth(), year: d.getFullYear(), label: d.toLocaleDateString('fr-FR', { month: 'short' }) });
  }
  const incomes = months.map(m => transactions.filter(t => t.type === 'income' && new Date(t.date).getMonth() === m.month && new Date(t.date).getFullYear() === m.year).reduce((s, t) => s + t.amount, 0));
  const expenses = months.map(m => transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === m.month && new Date(t.date).getFullYear() === m.year).reduce((s, t) => s + t.amount, 0));
  if (chartInstances.comparison) chartInstances.comparison.destroy();
  const ctx = document.getElementById('chart-comparison').getContext('2d');
  chartInstances.comparison = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.map(m => m.label),
      datasets: [
        { label: 'Revenus', data: incomes, backgroundColor: '#2ecc7188', borderColor: '#2ecc71', borderWidth: 2, borderRadius: 6 },
        { label: 'Dépenses', data: expenses, backgroundColor: '#e74c3c88', borderColor: '#e74c3c', borderWidth: 2, borderRadius: 6 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { callback: v => fmt(v) } } },
      plugins: { tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${fmt(ctx.raw)}` } } }
    }
  });
}

function destroyCharts() {
  Object.values(chartInstances).forEach(c => { if (c) c.destroy(); });
  chartInstances = {};
}

// ==================== TRANSACTIONS ====================
function addTransaction(e, type) {
  e.preventDefault();
  const amount = Number(document.getElementById(`${type}-amount`).value);
  const date = document.getElementById(`${type}-date`).value || new Date().toISOString().split('T')[0];
  const category = document.getElementById(`${type}-category`).value;
  const description = document.getElementById(`${type}-description`).value.trim();
  if (!amount || amount <= 0) return toast('Montant invalide', 'error');

  const data = getData();
  const tx = { id: Date.now(), type, amount, category, description: description || category, date };
  data.transactions.push(tx);
  saveData(data);

  apiCall('/transactions', 'POST', { type, amount, category, description: tx.description, date, localId: String(tx.id) }).catch(() => {});

  document.getElementById(`${type}-form`).reset();
  setDefaultDates();
  toast(`${type === 'income' ? 'Revenu' : 'Dépense'} ajouté(e) !`, 'success');
  refreshTransactionList(type);
}

function deleteTransaction(id, type) {
  showConfirm('Supprimer', 'Voulez-vous vraiment supprimer cette transaction ?', () => {
    const data = getData();
    data.transactions = data.transactions.filter(t => t.id !== id);
    saveData(data);
    apiCall(`/transactions/${id}`, 'DELETE').catch(() => {});
    toast('Transaction supprimée');
    refreshTransactionList(type);
  });
}

function refreshTransactionList(type) {
  const data = getData();
  const now = new Date();
  const txAll = data.transactions.filter(t => t.type === type);
  const txMonth = txAll.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const total = txMonth.reduce((s, t) => s + t.amount, 0);
  const counter = document.getElementById(`${type}-counter`);
  if (counter) counter.textContent = `${txMonth.length}/50 ce mois`;
  const totalEl = document.getElementById(`${type}-total`);
  if (totalEl) totalEl.textContent = fmt(total);

  if (type === 'expense') renderExpenseFilters();
  renderTransactionItems(type, txAll);
}

function renderTransactionItems(type, transactions) {
  const container = document.getElementById(`${type}-list`);
  const search = document.getElementById(`${type}-search`)?.value.toLowerCase() || '';
  let filtered = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (search) {
    filtered = filtered.filter(t =>
      t.description.toLowerCase().includes(search) ||
      t.category.toLowerCase().includes(search) ||
      String(t.amount).includes(search)
    );
  }
  const activeFilter = document.querySelector(`#expense-filters .filter-chip.active`);
  if (type === 'expense' && activeFilter && activeFilter.dataset.cat !== 'all') {
    filtered = filtered.filter(t => t.category === activeFilter.dataset.cat);
  }
  if (!filtered.length) {
    container.innerHTML = `<p class="empty-state">Aucun${type === 'income' ? ' revenu' : 'e dépense'} trouvé(e)</p>`;
    return;
  }
  container.innerHTML = filtered.map(t => `
    <div class="tx-item">
      <div class="tx-icon ${t.type}">${CATEGORY_ICONS[t.category] || '📦'}</div>
      <div class="tx-info">
        <div class="tx-desc">${esc(t.description || t.category)}</div>
        <div class="tx-meta">${esc(t.category)} &bull; ${fmtDate(t.date)}</div>
      </div>
      <div class="tx-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</div>
      <button class="tx-delete" onclick="deleteTransaction(${t.id}, '${t.type}')">🗑️</button>
    </div>
  `).join('');
}

function filterTransactions(type) { refreshTransactionList(type); }

function renderExpenseFilters() {
  const container = document.getElementById('expense-filters');
  if (!container) return;
  const data = getData();
  const cats = [...new Set(data.transactions.filter(t => t.type === 'expense').map(t => t.category))];
  container.innerHTML = `<span class="filter-chip active" data-cat="all" onclick="setFilter(this)">Tout</span>` +
    cats.map(c => `<span class="filter-chip" data-cat="${esc(c)}" onclick="setFilter(this)">${esc(c)}</span>`).join('');
}

function setFilter(chip) {
  chip.parentElement.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  refreshTransactionList('expense');
}

// ==================== BUDGET ====================
let budgetEditing = false;

function refreshBudget() {
  const budgets = getBudgets();
  const data = getData();
  const now = new Date();
  const expensesMonth = data.transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalSpent = expensesMonth.reduce((s, t) => s + t.amount, 0);

  document.getElementById('budget-monthly-value').textContent = budgets.monthly ? fmt(budgets.monthly) : 'Non défini';
  document.getElementById('budget-annual-value').textContent = budgets.annual ? fmt(budgets.annual) : 'Non défini';

  if (budgets.monthly > 0) {
    const pct = Math.min(Math.round((totalSpent / budgets.monthly) * 100), 100);
    document.getElementById('budget-monthly-progress').style.display = '';
    const fill = document.getElementById('budget-monthly-fill');
    fill.style.width = pct + '%';
    fill.className = 'progress-fill' + (pct >= 100 ? ' danger' : pct >= 80 ? ' warning' : '');
    document.getElementById('budget-monthly-spent').textContent = `${fmt(totalSpent)} dépensé`;
    document.getElementById('budget-monthly-pct').textContent = pct + '%';
  } else {
    document.getElementById('budget-monthly-progress').style.display = 'none';
  }

  const catContainer = document.getElementById('category-budgets');
  const catSpending = {};
  expensesMonth.forEach(t => { catSpending[t.category] = (catSpending[t.category] || 0) + t.amount; });

  catContainer.innerHTML = EXPENSE_CATEGORIES.map(cat => {
    const icon = CATEGORY_ICONS[cat] || '📦';
    const budget = budgets.categories?.[cat] || 0;
    const spent = catSpending[cat] || 0;
    const pct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
    if (budgetEditing) {
      return `<div class="category-budget-item">
        <span class="cat-icon">${icon}</span>
        <div class="cat-info"><div class="cat-name">${esc(cat)}</div></div>
        <div class="cat-input"><input type="number" id="cat-budget-${cat}" value="${budget || ''}" placeholder="0" min="0"></div>
      </div>`;
    }
    return `<div class="category-budget-item">
      <span class="cat-icon">${icon}</span>
      <div class="cat-info">
        <div class="cat-name">${esc(cat)}</div>
        <div class="cat-budget-val">${budget ? fmt(budget) : '-'} ${spent > 0 ? `· Dépensé: ${fmt(spent)}` : ''}</div>
        ${budget > 0 ? `<div class="progress-container"><div class="progress-bar"><div class="progress-fill${pct >= 100 ? ' danger' : pct >= 80 ? ' warning' : ''}" style="width:${pct}%"></div></div></div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function toggleBudgetEdit() {
  budgetEditing = !budgetEditing;
  const budgets = getBudgets();
  document.getElementById('btn-edit-budget').textContent = budgetEditing ? 'Annuler' : 'Modifier';
  document.getElementById('budget-monthly-display').classList.toggle('hidden', budgetEditing);
  document.getElementById('budget-monthly-edit').classList.toggle('hidden', !budgetEditing);
  document.getElementById('budget-annual-display').classList.toggle('hidden', budgetEditing);
  document.getElementById('budget-annual-edit').classList.toggle('hidden', !budgetEditing);
  document.getElementById('budget-edit-actions').classList.toggle('hidden', !budgetEditing);
  if (budgetEditing) {
    document.getElementById('budget-monthly-input').value = budgets.monthly || '';
    document.getElementById('budget-annual-input').value = budgets.annual || '';
  }
  refreshBudget();
}

function saveBudgets() {
  const monthly = Number(document.getElementById('budget-monthly-input').value) || 0;
  const annual = Number(document.getElementById('budget-annual-input').value) || 0;
  const categories = {};
  EXPENSE_CATEGORIES.forEach(cat => {
    const input = document.getElementById(`cat-budget-${cat}`);
    if (input && Number(input.value) > 0) categories[cat] = Number(input.value);
  });
  saveBudgetsData({ monthly, annual, categories });
  budgetEditing = false;
  document.getElementById('btn-edit-budget').textContent = 'Modifier';
  document.getElementById('budget-monthly-display').classList.remove('hidden');
  document.getElementById('budget-monthly-edit').classList.add('hidden');
  document.getElementById('budget-annual-display').classList.remove('hidden');
  document.getElementById('budget-annual-edit').classList.add('hidden');
  document.getElementById('budget-edit-actions').classList.add('hidden');
  refreshBudget();
  toast('Budgets enregistrés !', 'success');
}

// ==================== PREDICTIONS ====================
function refreshPredictions() {
  const data = getData();
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const txMonth = data.transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const income = txMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const savings = income > 0 ? Math.round((balance / income) * 100) : 0;
  const daysLeft = new Date(year, month + 1, 0).getDate() - now.getDate();

  document.getElementById('pred-income').textContent = fmt(income);
  document.getElementById('pred-expense').textContent = fmt(expense);
  document.getElementById('pred-savings').textContent = savings + '%';
  document.getElementById('pred-days').textContent = daysLeft;
  document.getElementById('daily-budget').textContent = daysLeft > 0 && balance > 0 ? fmt(Math.round(balance / daysLeft)) + ' / jour' : '-- F / jour';

  const history = [];
  for (let i = 1; i <= 3; i++) {
    const m = new Date(year, month - i, 1);
    const total = data.transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
    }).reduce((s, t) => s + t.amount, 0);
    if (total > 0) history.push(total);
  }
  const prediction = history.length > 0 ? Math.round(history.reduce((s, v) => s + v, 0) / history.length) : 0;
  document.getElementById('prediction-amount').textContent = prediction > 0 ? fmt(prediction) : '-- F';

  let trend = '--';
  if (history.length >= 2) {
    const diff = history[0] - history[1];
    trend = diff > 0 ? '📈 Tendance à la hausse' : diff < 0 ? '📉 Tendance à la baisse' : '➡️ Stable';
  }
  document.getElementById('prediction-trend').textContent = trend;

  const adviceContainer = document.getElementById('advice-cards');
  const advices = [];
  if (savings >= 30) advices.push({ type: 'success', icon: '🏆', title: 'Excellent taux d\'épargne !', text: `Vous épargnez ${savings}% de vos revenus. C'est au-dessus de la moyenne recommandée.` });
  else if (savings >= 15) advices.push({ type: 'info', icon: '👍', title: 'Bon taux d\'épargne', text: `Vous épargnez ${savings}% de vos revenus. Essayez d'atteindre 30% pour plus de sécurité.` });
  else if (savings > 0) advices.push({ type: 'warning', icon: '⚠️', title: 'Épargne faible', text: `Seulement ${savings}% d'épargne. Identifiez les dépenses réductibles.` });
  else if (income > 0) advices.push({ type: 'danger', icon: '🚨', title: 'Déficit budgétaire', text: `Vos dépenses dépassent vos revenus de ${fmt(Math.abs(balance))}. Action urgente requise.` });

  const catSpending = {};
  txMonth.filter(t => t.type === 'expense').forEach(t => { catSpending[t.category] = (catSpending[t.category] || 0) + t.amount; });
  const topCat = Object.entries(catSpending).sort((a, b) => b[1] - a[1])[0];
  if (topCat && expense > 0) {
    const pct = Math.round((topCat[1] / expense) * 100);
    if (pct > 40) advices.push({ type: 'warning', icon: '📊', title: `${topCat[0]} = ${pct}% des dépenses`, text: `La catégorie "${topCat[0]}" représente ${pct}% de vos dépenses. Diversifiez ou réduisez.` });
  }

  if (income === 0 && expense > 0) advices.push({ type: 'info', icon: '💡', title: 'Ajoutez vos revenus', text: 'Pour une analyse complète, n\'oubliez pas d\'ajouter vos sources de revenus.' });
  if (data.transactions.length < 3) advices.push({ type: 'info', icon: '📝', title: 'Données insuffisantes', text: 'Ajoutez plus de transactions pour obtenir des prédictions précises.' });
  if (daysLeft > 0 && balance > 0) advices.push({ type: 'success', icon: '💰', title: 'Budget quotidien', text: `Il vous reste ${fmt(balance)} pour ${daysLeft} jours, soit ${fmt(Math.round(balance / daysLeft))} par jour.` });

  adviceContainer.innerHTML = advices.map(a => `
    <div class="advice-card ${a.type}">
      <div class="advice-title">${a.icon} ${a.title}</div>
      <div class="advice-text">${a.text}</div>
    </div>
  `).join('');
}

// ==================== SETTINGS ====================
function refreshSettings() {
  if (!currentUser) return;
  const avatar = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
  document.getElementById('settings-avatar').textContent = avatar;
  document.getElementById('settings-username').textContent = currentUser.name;
  document.getElementById('settings-status').textContent = currentUser.isPremium ? 'Premium' : 'Gratuit';
  document.getElementById('info-username').textContent = currentUser.name;
  document.getElementById('info-status').textContent = currentUser.isPremium ? 'Premium' : 'Gratuit';
  document.getElementById('info-since').textContent = currentUser.joinDate || '--';
  renderThemeGrid();
}

function renderThemeGrid() {
  const grid = document.getElementById('theme-grid');
  grid.innerHTML = Object.entries(THEMES).map(([key, t]) => `
    <div class="theme-card ${key === currentTheme ? 'active' : ''}" onclick="setTheme('${key}')">
      <div class="theme-preview" style="background:${t.gradient}"></div>
      <div class="theme-card-label">${t.name}</div>
      ${key === currentTheme ? '<span class="theme-check">✓</span>' : ''}
    </div>
  `).join('');
}

// ==================== THEME ====================
function loadTheme() {
  currentTheme = localStorage.getItem('app_theme') || 'violet';
  document.documentElement.setAttribute('data-theme', currentTheme);
}

function setTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('app_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  renderThemeGrid();
}

function cycleTheme() {
  const keys = Object.keys(THEMES);
  const idx = (keys.indexOf(currentTheme) + 1) % keys.length;
  setTheme(keys[idx]);
}

// ==================== EXPORT CSV ====================
function exportCSV() {
  const data = getData();
  if (!data.transactions.length) return toast('Aucune donnée à exporter', 'error');
  const BOM = '﻿';
  const header = 'Type,Montant,Catégorie,Description,Date\n';
  const rows = data.transactions.map(t =>
    `${t.type},${t.amount},${t.category},"${(t.description || '').replace(/"/g, '""')}",${t.date}`
  ).join('\n');
  const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SaytuXalis_${currentUser.name}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Export CSV téléchargé !', 'success');
}

// ==================== CLOUD SYNC ====================
async function backupToCloud() {
  if (!authToken) return toast('Connectez-vous en ligne pour sauvegarder', 'error');
  const data = getData();
  const budgets = getBudgets();
  const res = await apiCall('/sync/backup', 'POST', {
    transactions: data.transactions.map(t => ({ ...t, localId: String(t.id) })),
    budgets,
    settings: { theme: currentTheme }
  });
  if (res) toast('Sauvegarde cloud réussie !', 'success');
  else toast('Erreur de sauvegarde', 'error');
}

async function restoreFromCloud() {
  if (!authToken) return toast('Connectez-vous en ligne pour restaurer', 'error');
  showConfirm('Restaurer', 'Cela remplacera vos données locales par celles du cloud. Continuer ?', async () => {
    const res = await apiCall('/sync/restore');
    if (res) {
      if (res.transactions?.length) {
        const data = { transactions: res.transactions.map(t => ({ id: Number(t.localId) || Date.now(), type: t.type, amount: t.amount, category: t.category, description: t.description, date: t.date })) };
        saveData(data);
      }
      if (res.budgets) saveBudgetsData(res.budgets);
      if (res.settings?.theme) setTheme(res.settings.theme);
      navigate('dashboard');
      toast('Données restaurées !', 'success');
    } else {
      toast('Erreur de restauration', 'error');
    }
  });
}

// ==================== DATA MANAGEMENT ====================
function deleteAllData() {
  showConfirm('Supprimer toutes les données', 'Cette action est irréversible. Toutes vos transactions et budgets seront supprimés.', () => {
    localStorage.removeItem(getKey());
    localStorage.removeItem(getKey('budgets'));
    navigate('dashboard');
    toast('Toutes les données ont été supprimées');
  });
}

// ==================== UI HELPERS ====================
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (type ? ` ${type}` : '');
  setTimeout(() => { el.className = 'toast hidden'; }, 3000);
}

function setLoading(btn, loading) {
  btn.querySelector('.btn-text').classList.toggle('hidden', loading);
  btn.querySelector('.btn-loader').classList.toggle('hidden', !loading);
  btn.disabled = loading;
}

function showConfirm(title, message, callback) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-modal').classList.remove('hidden');
  confirmCallback = callback;
}

function closeConfirm(confirmed) {
  document.getElementById('confirm-modal').classList.add('hidden');
  if (confirmed && confirmCallback) confirmCallback();
  confirmCallback = null;
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
