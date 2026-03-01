// Global State
const state = {
    workers: [],
    transactions: [],
    memberships: []
};

// API Service
const API_URL = 'http://localhost:8000/api';

const apiService = {
    async getWorkers() {
        try {
            const res = await fetch(`${API_URL}/workers/`);
            return await res.json();
        } catch (e) {
            console.error('Failed to fetch workers:', e);
            return [];
        }
    },
    async getTransactions() {
        try {
            const res = await fetch(`${API_URL}/transactions/`);
            const data = await res.json();
            // Convert string timestamp to Date object for existing logic
            return data.map(t => ({ ...t, timestamp: new Date(t.timestamp), amount: parseFloat(t.amount) }));
        } catch (e) {
            console.error('Failed to fetch transactions:', e);
            return [];
        }
    },
    async addWorker(worker) {
        try {
            const res = await fetch(`${API_URL}/workers/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(worker)
            });
            if (!res.ok) {
                const text = await res.text();
                console.error('Server error response:', res.status, text);
                throw new Error(`Server returned ${res.status}`);
            }
            return await res.json();
        } catch (e) {
            console.error('Failed to add worker:', e);
            throw e;
        }
    },
    async updateWorker(id, worker) {
        try {
            const res = await fetch(`${API_URL}/workers/${id}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(worker)
            });
            return await res.json();
        } catch (e) {
            console.error('Failed to update worker:', e);
            throw e;
        }
    },
    async addTransaction(tx) {
        try {
            const res = await fetch(`${API_URL}/transactions/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tx)
            });
            const data = await res.json();
            return { ...data, timestamp: new Date(data.timestamp), amount: parseFloat(data.amount) };
        } catch (e) {
            console.error('Failed to add transaction:', e);
            throw e;
        }
    },
    async getMemberships() {
        try {
            const res = await fetch(`${API_URL}/memberships/`);
            return await res.json();
        } catch (e) {
            console.error('Failed to fetch memberships:', e);
            return [];
        }
    },
    async addMembership(membership) {
        try {
            const res = await fetch(`${API_URL}/memberships/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(membership)
            });
            if (!res.ok) {
                const text = await res.text();
                console.error('Server error response:', res.status, text);
                throw new Error(`Server returned ${res.status}`);
            }
            return await res.json();
        } catch (e) {
            console.error('Failed to add membership:', e);
            throw e;
        }
    },
    async getMembershipRecords() {
        try {
            const res = await fetch(`${API_URL}/membership-records/`);
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            console.error('Failed to fetch membership records:', e);
            return [];
        }
    },
    async addMembershipRecord(record) {
        try {
            const res = await fetch(`${API_URL}/membership-records/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            });
            if (!res.ok) throw new Error('Server error');
            return await res.json();
        } catch (e) {
            console.error('Failed to add membership record:', e);
            throw e;
        }
    }
};

// Utilities
const formatCurrency = (amount) => `₹${amount.toLocaleString()}`;
const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Selectors
const DOM = {
    navLinks: document.querySelectorAll('.nav-link'),
    views: document.querySelectorAll('.view-section'),
    currentDate: document.getElementById('current-date'),

    // Dashboard Stats
    dashNet: document.getElementById('dashboard-net'),
    dashCash: document.getElementById('dashboard-cash'),
    dashOnline: document.getElementById('dashboard-online'),
    dashExpenses: document.getElementById('dashboard-expenses'),

    // Workers
    workersGrid: document.getElementById('workers-grid'),

    // Worker Modal
    workerModal: document.getElementById('worker-modal'),
    wmAvatar: document.getElementById('wm-avatar'),
    wmName: document.getElementById('wm-name'),
    wmPhone: document.getElementById('wm-phone'),
    wmNet: document.getElementById('wm-net'),
    wmExpectedCash: document.getElementById('wm-expected-cash'),
    wmOnline: document.getElementById('wm-online'),
    wmExpenses: document.getElementById('wm-expenses'),
    wmTransactionsBody: document.getElementById('wm-transactions-body'),
    wmDateFilter: document.getElementById('wm-date-filter'),
    wmTypeFilter: document.getElementById('wm-type-filter'),

    // Buttons & Form
    btnAddIncome: document.getElementById('btn-add-income'),
    btnAddExpense: document.getElementById('btn-add-expense'),
    transactionModal: document.getElementById('transaction-modal'),
    transactionForm: document.getElementById('transaction-form'),
    tmTitle: document.getElementById('tm-title'),
    tmType: document.getElementById('tm-type'),
    tmWorkerId: document.getElementById('tm-worker-id'),
    tmPaymentModeGroup: document.getElementById('tm-payment-mode-group'),
    tmQuickTags: document.getElementById('tm-quick-tags'),

    // Edit Profile
    btnEditProfile: document.getElementById('btn-edit-profile'),
    editProfileModal: document.getElementById('edit-profile-modal'),
    editProfileForm: document.getElementById('edit-profile-form'),
    epWorkerId: document.getElementById('ep-worker-id'),
    epName: document.getElementById('ep-name'),
    epPhone: document.getElementById('ep-phone'),
    epPhotoUpload: document.getElementById('ep-photo-upload'),
    epPhotoData: document.getElementById('ep-photo-data'),

    // Memberships
    membershipsGrid: document.getElementById('memberships-grid'),
    btnAddMembership: document.getElementById('btn-add-membership'),
    membershipModal: document.getElementById('membership-modal'),
    membershipForm: document.getElementById('membership-form'),
    msName: document.getElementById('ms-name'),
    msPhone: document.getElementById('ms-phone'),
    msVillage: document.getElementById('ms-village'),
    msIssueDate: document.getElementById('ms-issue-date'),
    msExpireDate: document.getElementById('ms-expire-date'),

    // Membership Detail Modal
    membershipDetailModal: document.getElementById('membership-detail-modal'),
    mdmAvatar: document.getElementById('mdm-avatar'),
    mdmName: document.getElementById('mdm-name'),
    mdmPhone: document.getElementById('mdm-phone'),
    mdmVillage: document.getElementById('mdm-village'),
    mdmTotalRecords: document.getElementById('mdm-total-records'),
    mdmTotalDiscount: document.getElementById('mdm-total-discount'),
    mdmIssueDate: document.getElementById('mdm-issue-date'),
    mdmExpireDate: document.getElementById('mdm-expire-date'),
    mdmRecordsBody: document.getElementById('mdm-records-body'),
    btnAddRecord: document.getElementById('btn-add-record'),

    // Add Record Modal
    addRecordModal: document.getElementById('add-record-modal'),
    recordForm: document.getElementById('record-form'),
    rmMembershipId: document.getElementById('rm-membership-id'),
    rmDesc: document.getElementById('rm-desc'),
    rmAmount: document.getElementById('rm-amount'),
    rmDiscountedAmount: document.getElementById('rm-discounted-amount'),

    closeModals: document.querySelectorAll('.close-modal, .close-modal-btn')
};

const app = {
    async init() {
        this.setupEventListeners();
        this.setDate();
        await this.loadData();
    },

    async loadData() {
        state.workers = await apiService.getWorkers();
        state.transactions = await apiService.getTransactions();
        state.memberships = await apiService.getMemberships();
        this.renderDashboard();
        this.renderWorkers();
        this.renderMemberships();
    },

    setupEventListeners() {
        // Navigation Navigation Navigation
        DOM.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                DOM.navLinks.forEach(l => l.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.switchView(e.currentTarget.dataset.target);
            });
        });

        // Form Submit (Profile Edit)
        if (DOM.editProfileForm) {
            DOM.editProfileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileSubmit();
            });
        }

        // Form Submit (Membership)
        if (DOM.membershipForm) {
            DOM.membershipForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMembershipSubmit();
            });
        }

        // Open Membership Modal
        if (DOM.btnAddMembership) {
            DOM.btnAddMembership.addEventListener('click', () => {
                DOM.membershipForm.reset();
                DOM.msIssueDate.valueAsDate = new Date();
                DOM.membershipModal.classList.add('show');
            });
        }

        // Form Submit (Record for Membership)
        if (DOM.recordForm) {
            DOM.recordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMembershipRecordSubmit();
            });

            // Auto-calculate 20% discount
            if (DOM.rmAmount && DOM.rmDiscountedAmount) {
                DOM.rmAmount.addEventListener('input', (e) => {
                    const original = parseFloat(e.target.value) || 0;
                    const discounted = original * 0.8;
                    DOM.rmDiscountedAmount.value = discounted.toFixed(2);
                });
            }
        }

        // Modals Close button handler addition
        DOM.closeModals.forEach(btn => {
            btn.addEventListener('click', () => {
                DOM.workerModal.classList.remove('show');
                DOM.transactionModal.classList.remove('show');
                DOM.editProfileModal.classList.remove('show');
                DOM.membershipModal.classList.remove('show');
                if (DOM.membershipDetailModal) DOM.membershipDetailModal.classList.remove('show');
                if (DOM.addRecordModal) DOM.addRecordModal.classList.remove('show');
            });
        });

        // Photo Upload
        if (DOM.epPhotoUpload) {
            DOM.epPhotoUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        DOM.epPhotoData.value = ev.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Date and Type filters
        const applyFilters = () => {
            if (!DOM.tmWorkerId) return;
            const workerId = parseInt(DOM.tmWorkerId.value);
            const dateStr = DOM.wmDateFilter && DOM.wmDateFilter.value ? DOM.wmDateFilter.value : null;
            const txType = DOM.wmTypeFilter && DOM.wmTypeFilter.value ? DOM.wmTypeFilter.value : 'all';
            this.updateWorkerModalStats(workerId, dateStr);
            this.renderWorkerTransactions(workerId, dateStr, txType);
        };

        if (DOM.wmDateFilter) DOM.wmDateFilter.addEventListener('change', applyFilters);
        if (DOM.wmTypeFilter) DOM.wmTypeFilter.addEventListener('change', applyFilters);

        // Quick tags
        if (DOM.tmQuickTags) {
            DOM.tmQuickTags.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag')) {
                    const descInput = document.getElementById('tm-desc');
                    const val = e.target.dataset.val;
                    if (descInput && descInput.value) {
                        descInput.value += ', ' + val;
                    } else if (descInput) {
                        descInput.value = val;
                    }
                }
            });
        }

        // Add dummy worker btn
        const btnAddWorker = document.getElementById('btn-add-worker');
        if (btnAddWorker) {
            btnAddWorker.addEventListener('click', async () => {
                const name = prompt("Enter worker name:");
                if (name) {
                    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    try {
                        const newWorker = await apiService.addWorker({ name, initials });
                        state.workers.push(newWorker);
                        this.renderWorkers();
                        this.showToast(`Worker ${name} added!`, 'success');
                    } catch (e) {
                        console.error('Add Worker Error:', e);
                        this.showToast(`Failed to add worker.`, 'error');
                    }
                }
            });
        }

        // Global date filter (worker cards view)
        const globalDateFilter = document.getElementById('global-date-filter');
        if (globalDateFilter) {
            // Default to today
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            globalDateFilter.value = `${year}-${month}-${day}`;

            globalDateFilter.addEventListener('change', (e) => {
                state.workers.forEach(w => w.selectedDate = e.target.value);
                this.renderWorkers();
            });
        }
    },

    setDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        if (DOM.currentDate) {
            DOM.currentDate.textContent = new Date().toLocaleDateString('en-US', options);
        }
    },

    switchView(viewId) {
        DOM.views.forEach(v => v.classList.remove('active'));
        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) targetView.classList.add('active');
        if (viewId === 'dashboard') this.renderDashboard();
        if (viewId === 'workers') this.renderWorkers();
    },
    // Get aggregated stats for a specific worker OR whole shop (if workerId is null)
    getStats(workerId = null, dateStr = null) {
        let txs = state.transactions;
        if (workerId !== null) {
            txs = txs.filter(t => t.workerId === workerId);
        }
        if (dateStr !== null) {
            txs = txs.filter(t => {
                const d = new Date(t.timestamp);
                const ty = d.getFullYear();
                const tm = String(d.getMonth() + 1).padStart(2, '0');
                const td = String(d.getDate()).padStart(2, '0');
                return `${ty}-${tm}-${td}` === dateStr;
            });
        }

        let totalIncome = 0;
        let totalCashIn = 0;
        let totalOnlineIn = 0;
        let totalExpense = 0;

        txs.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
                if (t.mode === 'cash') totalCashIn += t.amount;
                if (t.mode === 'online') totalOnlineIn += t.amount;
            } else if (t.type === 'expense') {
                totalExpense += t.amount;
            }
        });

        const netCollected = totalIncome - totalExpense;
        const expectedCash = totalCashIn - totalExpense;

        return { totalIncome, totalCashIn, totalOnlineIn, totalExpense, netCollected, expectedCash };
    },

    renderDashboard() {
        const stats = this.getStats();

        // Counter Animation effect
        this.animateValue(DOM.dashNet, stats.netCollected);
        this.animateValue(DOM.dashCash, stats.totalCashIn);
        this.animateValue(DOM.dashOnline, stats.totalOnlineIn);
        this.animateValue(DOM.dashExpenses, stats.totalExpense);
    },

    renderWorkers() {
        DOM.workersGrid.innerHTML = '';

        const globalDateFilter = document.getElementById('global-date-filter');
        const defaultDate = globalDateFilter ? globalDateFilter.value : '';

        state.workers.forEach(worker => {
            const cardDate = worker.selectedDate !== undefined ? worker.selectedDate : defaultDate;
            const stats = this.getStats(worker.id, cardDate || null);

            const card = document.createElement('div');
            card.className = 'worker-card';
            card.innerHTML = `
                <div class="worker-card-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <div class="avatar" style="overflow: hidden;">${worker.photo ? `<img src="${worker.photo}" style="width:100%; height:100%; object-fit:cover;">` : worker.initials}</div>
                        <div class="info">
                            <h3>${worker.name}</h3>
                            <p>ID: #00${worker.id}</p>
                        </div>
                    </div>
                    <div class="worker-date-filter" onclick="event.stopPropagation()">
                        <input type="date" class="date-filter card-date-picker" value="${cardDate || ''}" style="padding: 4px 8px; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-glass); background: rgba(0,0,0,0.2); color: var(--text-main); cursor: pointer; color-scheme: dark;">
                    </div>
                </div>
                <div class="worker-stats-mini" style="margin-bottom: 16px;">
                    <div class="mini-stat">
                        <span class="label">Net Amount</span>
                        <span class="value text-primary card-net-val">${formatCurrency(stats.netCollected)}</span>
                    </div>
                    <div class="mini-stat">
                        <span class="label">Exp Amount</span>
                        <span class="value text-red card-exp-val">${formatCurrency(stats.totalExpense)}</span>
                    </div>
                </div>
                <div class="worker-card-actions" style="display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-success btn-add-income-card" style="flex: 1;"><i class="fa-solid fa-plus"></i> Income</button>
                    <button class="btn btn-sm btn-danger btn-add-expense-card" style="flex: 1;"><i class="fa-solid fa-minus"></i> Expense</button>
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-add-income-card') && !e.target.closest('.btn-add-expense-card') && !e.target.closest('.worker-date-filter')) {
                    this.openWorkerModal(worker.id);
                }
            });

            const incomeBtn = card.querySelector('.btn-add-income-card');
            const expenseBtn = card.querySelector('.btn-add-expense-card');
            const datePicker = card.querySelector('.card-date-picker');

            datePicker.addEventListener('change', (e) => {
                e.stopPropagation();
                worker.selectedDate = e.target.value;
                const newStats = this.getStats(worker.id, worker.selectedDate || null);
                card.querySelector('.card-net-val').textContent = formatCurrency(newStats.netCollected);
                card.querySelector('.card-exp-val').textContent = formatCurrency(newStats.totalExpense);
            });

            incomeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                DOM.tmWorkerId.value = worker.id;
                this.openTransactionModal('income');
            });

            expenseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                DOM.tmWorkerId.value = worker.id;
                this.openTransactionModal('expense');
            });

            DOM.workersGrid.appendChild(card);
        });
    },

    renderMemberships() {
        if (!DOM.membershipsGrid) return;
        DOM.membershipsGrid.innerHTML = '';

        if (state.memberships.length === 0) {
            DOM.membershipsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">No memberships found. Click "Add Membership Card" to create one.</div>';
            return;
        }

        state.memberships.forEach(member => {
            const card = document.createElement('div');
            card.className = 'worker-card';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <div class="worker-card-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <div class="avatar" style="background: var(--gradient-primary); color: white;">
                            <i class="fa-solid fa-id-card"></i>
                        </div>
                        <div class="info">
                            <h3 style="margin-bottom: 4px;">${member.name}</h3>
                            <p style="font-size: 0.85rem;"><i class="fa-solid fa-phone" style="margin-right: 4px;"></i> ${member.phone_number}</p>
                        </div>
                    </div>
                </div>
                <div style="padding: 16px; background: rgba(0,0,0,0.15); border-radius: 8px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--text-muted); font-size: 0.85rem;">Village</span>
                        <span style="font-weight: 500;">${member.village_name}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--text-muted); font-size: 0.85rem;">Issue Date</span>
                        <span style="font-weight: 500;">${member.issue_date}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-muted); font-size: 0.85rem;">Expire Date</span>
                        <span style="font-weight: 500; color: var(--text-primary);">${member.expire_date}</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                this.openMembershipDetailModal(member.id);
            });

            DOM.membershipsGrid.appendChild(card);
        });
    },

    async openMembershipDetailModal(membershipId) {
        const member = state.memberships.find(m => m.id === membershipId);
        if (!member) return;

        // Set membership ID on hidden form inputs
        if (DOM.rmMembershipId) DOM.rmMembershipId.value = member.id;

        // Populate Modal Header
        if (DOM.mdmName) DOM.mdmName.textContent = member.name;
        if (DOM.mdmPhone) DOM.mdmPhone.textContent = `📞 ${member.phone_number}`;
        if (DOM.mdmVillage) DOM.mdmVillage.textContent = `📍 ${member.village_name}`;
        if (DOM.mdmIssueDate) DOM.mdmIssueDate.textContent = member.issue_date;
        if (DOM.mdmExpireDate) DOM.mdmExpireDate.textContent = member.expire_date;

        // Fetch records
        const records = await apiService.getMembershipRecords(member.id);

        // Calculate stats
        let totalDiscount = 0;
        records.forEach(r => {
            const orig = parseFloat(r.original_amount);
            const disc = parseFloat(r.discounted_amount);
            totalDiscount += (orig - disc);
        });

        if (DOM.mdmTotalRecords) DOM.mdmTotalRecords.textContent = records.length;
        if (DOM.mdmTotalDiscount) DOM.mdmTotalDiscount.textContent = formatCurrency(totalDiscount);

        this.renderMembershipRecords(records);

        if (DOM.membershipDetailModal) DOM.membershipDetailModal.classList.add('show');

        // Bind Add Record Button Event Listener (Avoid duplicates)
        if (DOM.btnAddRecord) {
            const newBtn = DOM.btnAddRecord.cloneNode(true);
            DOM.btnAddRecord.parentNode.replaceChild(newBtn, DOM.btnAddRecord);
            DOM.btnAddRecord = newBtn;

            DOM.btnAddRecord.addEventListener('click', () => {
                if (DOM.recordForm) DOM.recordForm.reset();
                if (DOM.addRecordModal) DOM.addRecordModal.classList.add('show');
            });
        }
    },

    renderMembershipRecords(records) {
        if (!DOM.mdmRecordsBody) return;
        DOM.mdmRecordsBody.innerHTML = '';

        if (records.length === 0) {
            DOM.mdmRecordsBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 16px;">No records found.</td></tr>`;
            return;
        }

        records.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-weight: 500;">${new Date(r.timestamp).toLocaleDateString()}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${formatTime(new Date(r.timestamp))}</div>
                </td>
                <td>${r.service_desc}</td>
                <td><span class="text-primary">${formatCurrency(r.original_amount)}</span></td>
                <td><span class="text-green">${formatCurrency(r.original_amount - r.discounted_amount)}</span></td>
                <td><span style="font-weight: bold; color: var(--text-green);">${formatCurrency(r.discounted_amount)}</span></td>
            `;
            DOM.mdmRecordsBody.appendChild(tr);
        });
    },

    openWorkerModal(workerId) {
        const worker = state.workers.find(w => w.id === workerId);
        if (!worker) return;

        // Set worker ID on hidden form inputs
        DOM.tmWorkerId.value = worker.id;

        // Populate Modal Header
        if (worker.photo) {
            DOM.wmAvatar.innerHTML = `<img src="${worker.photo}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            DOM.wmAvatar.textContent = worker.initials;
        }
        DOM.wmName.textContent = worker.name;
        DOM.wmPhone.textContent = worker.phone ? `📞 ${worker.phone}` : 'No phone connected';

        // Default to today's date or worker's selected date
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const activeDate = worker.selectedDate !== undefined && worker.selectedDate !== '' ? worker.selectedDate : todayStr;

        if (DOM.wmDateFilter) DOM.wmDateFilter.value = activeDate;
        if (DOM.wmTypeFilter) DOM.wmTypeFilter.value = 'all';

        this.updateWorkerModalStats(workerId, activeDate);
        this.renderWorkerTransactions(workerId, activeDate, 'all');

        DOM.workerModal.classList.add('show');
    },

    updateWorkerModalStats(workerId, dateStr = null) {
        const stats = this.getStats(workerId, dateStr);
        DOM.wmNet.textContent = formatCurrency(stats.netCollected);
        DOM.wmExpectedCash.textContent = formatCurrency(Math.max(0, stats.expectedCash));
        DOM.wmOnline.textContent = formatCurrency(stats.totalOnlineIn);
        DOM.wmExpenses.textContent = formatCurrency(stats.totalExpense);
    },

    renderWorkerTransactions(workerId, dateStr = null, txType = 'all') {
        let txs = state.transactions.filter(t => t.workerId === workerId);

        if (dateStr) {
            txs = txs.filter(t => {
                const d = new Date(t.timestamp);
                const ty = d.getFullYear();
                const tm = String(d.getMonth() + 1).padStart(2, '0');
                const td = String(d.getDate()).padStart(2, '0');
                return `${ty}-${tm}-${td}` === dateStr;
            });
        }

        if (txType !== 'all') {
            txs = txs.filter(t => t.type === txType);
        }

        txs.sort((a, b) => b.timestamp - a.timestamp);
        DOM.wmTransactionsBody.innerHTML = '';

        if (txs.length === 0) {
            DOM.wmTransactionsBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px; color: var(--text-muted);">No transactions for this date</td></tr>';
            return;
        }

        txs.forEach(t => {
            const tr = document.createElement('tr');

            // Badges
            const typeBadge = t.type === 'income'
                ? '<span class="badge badge-income">Income</span>'
                : '<span class="badge badge-expense">Expense</span>';

            let modeBadge = '-';
            if (t.type === 'income') {
                modeBadge = t.mode === 'cash'
                    ? '<span class="badge badge-cash"><i class="fa-solid fa-money-bill"></i> Cash</span>'
                    : '<span class="badge badge-online"><i class="fa-solid fa-mobile-screen"></i> Online</span>';
            } else {
                modeBadge = '<span class="badge badge-cash">Cash (from Reg)</span>';
            }

            const amountClass = t.type === 'income' ? 'text-green' : 'text-red';
            const sign = t.type === 'income' ? '+' : '-';

            tr.innerHTML = `
                <td>${formatTime(t.timestamp)}</td>
                <td>${typeBadge}</td>
                <td>${t.desc}</td>
                <td>${modeBadge}</td>
                <td class="${amountClass} font-bold">${sign}${formatCurrency(t.amount)}</td>
            `;
            DOM.wmTransactionsBody.appendChild(tr);
        });
    },

    openTransactionModal(type) {
        DOM.tmType.value = type;
        DOM.transactionForm.reset();

        if (type === 'income') {
            DOM.tmTitle.textContent = 'Add Income / Payment';
            DOM.tmPaymentModeGroup.style.display = 'block';
        } else {
            DOM.tmTitle.textContent = 'Add Expense';
            DOM.tmPaymentModeGroup.style.display = 'none'; // Assume expenses are taken from cash
        }

        DOM.transactionModal.classList.add('show');
    },

    openEditProfileModal() {
        const workerId = parseInt(DOM.tmWorkerId.value);
        const worker = state.workers.find(w => w.id === workerId);
        if (!worker) return;

        DOM.epWorkerId.value = worker.id;
        DOM.epName.value = worker.name;
        DOM.epPhone.value = worker.phone || '';
        if (DOM.epPhotoUpload) DOM.epPhotoUpload.value = '';
        DOM.epPhotoData.value = worker.photo || '';

        DOM.editProfileModal.classList.add('show');
    },

    async handleProfileSubmit() {
        const workerId = parseInt(DOM.epWorkerId.value);
        const newName = DOM.epName.value.trim();
        const newPhone = DOM.epPhone.value.trim();
        const newPhoto = DOM.epPhotoData.value;

        const worker = state.workers.find(w => w.id === workerId);
        if (worker) {
            const initials = newName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            try {
                const updatedWorker = await apiService.updateWorker(workerId, {
                    name: newName,
                    phone: newPhone,
                    photo: newPhoto,
                    initials: initials
                });

                // Update local state
                Object.assign(worker, updatedWorker);

                DOM.editProfileModal.classList.remove('show');

                // Re-render
                this.renderWorkers();
                // Upate open modal 
                DOM.wmName.textContent = worker.name;
                if (worker.photo) {
                    DOM.wmAvatar.innerHTML = `<img src="${worker.photo}" style="width:100%; height:100%; object-fit:cover;">`;
                } else {
                    DOM.wmAvatar.textContent = worker.initials;
                }
                DOM.wmPhone.textContent = worker.phone ? `📞 ${worker.phone}` : 'No phone connected';

                this.showToast('Profile updated successfully', 'success');
            } catch (e) {
                this.showToast('Failed to update profile.', 'error');
            }
        }
    },

    async handleTransactionSubmit() {
        const workerId = parseInt(DOM.tmWorkerId.value);
        const type = DOM.tmType.value;
        const desc = document.getElementById('tm-desc').value;
        const amount = parseFloat(document.getElementById('tm-amount').value);
        let mode = 'cash'; // Default for expense

        if (type === 'income') {
            const selectedRadio = document.querySelector('input[name="payment_mode"]:checked');
            mode = selectedRadio ? selectedRadio.value : 'cash';
        }

        try {
            const newTx = await apiService.addTransaction({
                workerId: workerId,
                type,
                desc,
                amount,
                mode
            });

            state.transactions.push(newTx);

            // Hide Modal
            DOM.transactionModal.classList.remove('show');

            // Update UI
            const currentFilterDate = DOM.wmDateFilter ? DOM.wmDateFilter.value : null;
            const currentFilterType = DOM.wmTypeFilter ? DOM.wmTypeFilter.value : 'all';
            this.updateWorkerModalStats(workerId, currentFilterDate);
            this.renderWorkerTransactions(workerId, currentFilterDate, currentFilterType);
            this.renderDashboard();
            this.renderWorkers();

            this.showToast(`Successfully added ${type} of ${formatCurrency(amount)}`, 'success');
        } catch (e) {
            this.showToast(`Failed to add transaction.`, 'error');
        }
    },

    async handleMembershipSubmit() {
        const name = DOM.msName.value.trim();
        const phone = DOM.msPhone.value.trim();
        const village = DOM.msVillage.value.trim();
        const issueDate = DOM.msIssueDate.value;
        const expireDate = DOM.msExpireDate.value;

        if (!name || !phone || !village || !issueDate || !expireDate) {
            this.showToast('Please fill all required fields.', 'error');
            return;
        }

        try {
            const newMembership = await apiService.addMembership({
                name: name,
                phone_number: phone,
                village_name: village,
                issue_date: issueDate,
                expire_date: expireDate
            });

            state.memberships.push(newMembership);

            // Hide Modal
            DOM.membershipModal.classList.remove('show');

            // Update UI
            this.renderMemberships();
            this.showToast(`Successfully added membership for ${name}`, 'success');
        } catch (e) {
            this.showToast(`Failed to add membership.`, 'error');
        }
    },

    async handleMembershipRecordSubmit() {
        if (!DOM.rmMembershipId) return;

        const membershipId = parseInt(DOM.rmMembershipId.value);
        const desc = DOM.rmDesc ? DOM.rmDesc.value.trim() : '';
        const amountStr = DOM.rmAmount ? DOM.rmAmount.value : '0';
        const originalAmount = parseFloat(amountStr);

        if (!membershipId || !desc || !originalAmount || originalAmount <= 0) {
            this.showToast('Please fill all required fields correctly.', 'error');
            return;
        }

        const discountedAmount = (originalAmount * 0.8).toFixed(2);

        const newRecord = {
            membershipId: membershipId,
            service_desc: desc,
            original_amount: originalAmount,
            discounted_amount: discountedAmount
        };

        try {
            await apiService.addMembershipRecord(newRecord);

            // Hide Add Record Modal
            if (DOM.addRecordModal) DOM.addRecordModal.classList.remove('show');
            if (DOM.recordForm) DOM.recordForm.reset();

            // Refresh the Detailed Modal Records
            const records = await apiService.getMembershipRecords(membershipId);
            this.renderMembershipRecords(records);

            // Update Stats locally on the modal
            let totalDiscount = 0;
            records.forEach(r => {
                const orig = parseFloat(r.original_amount);
                const disc = parseFloat(r.discounted_amount);
                totalDiscount += (orig - disc);
            });

            if (DOM.mdmTotalRecords) DOM.mdmTotalRecords.textContent = records.length;
            if (DOM.mdmTotalDiscount) DOM.mdmTotalDiscount.textContent = formatCurrency(totalDiscount);

            this.showToast(`Record added successfully. 20% Discount applied!`, 'success');
        } catch (e) {
            this.showToast(`Failed to add record.`, 'error');
        }
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastFade 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Helper for number counter animation
    animateValue(obj, end, duration = 1000) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Ease out quad
            const easeProgress = progress * (2 - progress);
            obj.innerHTML = formatCurrency(Math.floor(easeProgress * end));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = formatCurrency(end);
            }
        };
        window.requestAnimationFrame(step);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
