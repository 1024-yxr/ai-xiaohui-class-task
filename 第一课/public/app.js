// State Management
const STATE_KEY = 'lightning_accounting_state';
const DEFAULT_BUDGET = 3000.00;

let state = {
    budgetTotal: DEFAULT_BUDGET,
    transactions: [],
    categories: {
        '餐饮': '🍔',
        '交通': '🚗',
        '购物': '🛍️',
        '娱乐': '🎮',
        '医疗': '🏥',
        '其他': '📦'
    }
};

// Load state from localStorage
function loadState() {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
        state = JSON.parse(saved);
    } else {
        // Initial Mock Data
        state.transactions = [
            { id: 1, amount: 25.00, category: '餐饮', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
            { id: 2, amount: 15.50, category: '交通', timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
            { id: 3, amount: 128.00, category: '购物', timestamp: new Date(Date.now() - 3600000 * 24).toISOString() }
        ];
        saveState();
    }
}

// Save state to localStorage
function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

// UI Elements
const budgetRing = document.getElementById('budget-ring');
const budgetRemainingEl = document.getElementById('budget-remaining');
const budgetTotalEl = document.getElementById('budget-total');
const transactionListEl = document.getElementById('transaction-list');
const addForm = document.getElementById('add-transaction-form');
const amountInput = document.getElementById('amount-input');
const categorySelect = document.getElementById('category-select');

// Navigation Elements
const pages = document.querySelectorAll('.page');
const navBtns = document.querySelectorAll('.nav-btn');

// Chart Elements
const chartTotalSpentEl = document.getElementById('chart-total-spent');
const chartAvgSpentEl = document.getElementById('chart-avg-spent');

// Category/Setting Elements
const settingBudgetInput = document.getElementById('setting-budget');
const saveBudgetBtn = document.getElementById('save-budget-btn');

// Helper: Calculate total spent
function getTotalSpent() {
    return state.transactions.reduce((sum, t) => sum + t.amount, 0);
}

// Helper: Format currency
function formatCurrency(amount) {
    return `¥${amount.toFixed(2)}`;
}

// Update Budget Ring UI
function updateBudgetUI() {
    const spent = getTotalSpent();
    const remaining = state.budgetTotal - spent;
    const percentage = Math.min((spent / state.budgetTotal) * 100, 100);
    
    // SVG Dash Array calculation (r=80, 2 * PI * r ≈ 502.65)
    const circumference = 502.65;
    const offset = circumference - (percentage / 100) * circumference;
    
    if (budgetRing) {
        budgetRing.style.strokeDashoffset = offset;
        
        // Update colors based on progress
        if (percentage > 90) {
            budgetRing.className = 'text-red-500 transition-all duration-500 ease-out';
            budgetRemainingEl.className = 'text-3xl font-bold text-red-400';
        } else if (percentage > 70) {
            budgetRing.className = 'text-yellow-500 transition-all duration-500 ease-out';
            budgetRemainingEl.className = 'text-3xl font-bold text-yellow-400';
        } else {
            budgetRing.className = 'text-blue-500 transition-all duration-500 ease-out';
            budgetRemainingEl.className = 'text-3xl font-bold text-blue-400';
        }
    }

    if (budgetRemainingEl) budgetRemainingEl.textContent = formatCurrency(remaining);
    if (budgetTotalEl) budgetTotalEl.textContent = `总计 ${formatCurrency(state.budgetTotal)}`;
}

// Render Transaction List
function renderTransactions() {
    if (!transactionListEl) return;
    transactionListEl.innerHTML = '';
    
    const recent = [...state.transactions].reverse().slice(0, 10);
    
    if (recent.length === 0) {
        transactionListEl.innerHTML = `
            <div class="text-center py-12 text-gray-600 text-sm">
                还没有记录，快去记一笔吧！
            </div>
        `;
        return;
    }

    recent.forEach(t => {
        const date = new Date(t.timestamp);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dayStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        const icon = state.categories[t.category] || '📦';

        const item = document.createElement('div');
        item.className = 'bg-[#1c1c1e] p-4 rounded-2xl shadow-sm border border-gray-800 flex items-center justify-between animate-slide-in';
        item.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-[#2c2c2e] rounded-full flex items-center justify-center text-xl">${icon}</div>
                <div>
                    <div class="font-medium text-gray-200">${t.category}</div>
                    <div class="text-[10px] text-gray-500 font-mono uppercase">${dayStr} ${timeStr}</div>
                </div>
            </div>
            <div class="font-bold text-red-400">- ${formatCurrency(t.amount)}</div>
        `;
        transactionListEl.appendChild(item);
    });
}

// Update Chart Page Data
function updateChartUI() {
    const spent = getTotalSpent();
    if (chartTotalSpentEl) chartTotalSpentEl.textContent = formatCurrency(spent);
    
    // Simple mock average
    const days = new Date().getDate();
    if (chartAvgSpentEl) chartAvgSpentEl.textContent = formatCurrency(spent / days);
}

// Handle Navigation
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetPage = btn.dataset.page;
        
        // Update Buttons
        navBtns.forEach(b => {
            b.classList.remove('text-blue-400');
            b.classList.add('text-gray-500');
        });
        btn.classList.add('text-blue-400');
        btn.classList.remove('text-gray-500');
        
        // Update Pages
        pages.forEach(p => {
            p.classList.remove('active');
            if (p.id === `page-${targetPage}`) {
                p.classList.add('active');
            }
        });

        // Specific Page Updates
        if (targetPage === 'chart') updateChartUI();
        if (targetPage === 'home') {
            updateBudgetUI();
            renderTransactions();
        }
    });
});

// Handle Form Submission
if (addForm) {
    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const amount = parseFloat(amountInput.value);
        const category = categorySelect.value;
        
        if (isNaN(amount) || amount <= 0) return;

        const newTransaction = {
            id: Date.now(),
            amount: amount,
            category: category,
            timestamp: new Date().toISOString()
        };

        state.transactions.push(newTransaction);
        saveState();
        
        // Reset form
        amountInput.value = '';
        amountInput.blur();
        
        // Update UI
        updateBudgetUI();
        renderTransactions();
    });
}

// Handle Budget Setting
if (saveBudgetBtn) {
    saveBudgetBtn.addEventListener('click', () => {
        const newBudget = parseFloat(settingBudgetInput.value);
        if (!isNaN(newBudget) && newBudget > 0) {
            state.budgetTotal = newBudget;
            saveState();
            alert('预算设置已保存！');
        }
    });
}

// Initialize App
function init() {
    loadState();
    updateBudgetUI();
    renderTransactions();
    if (settingBudgetInput) settingBudgetInput.value = state.budgetTotal;
}

init();
