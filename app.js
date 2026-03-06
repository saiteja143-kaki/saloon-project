// Auth Guard - redirect to login if no token
(function () {
    if (!localStorage.getItem('auth_token')) {
        window.location.href = 'login.html';
        return;
    }

    // Global fetch interceptor - auto-attach auth token to all API calls
    const _originalFetch = window.fetch;
    window.fetch = function (url, options = {}) {
        const token = localStorage.getItem('auth_token');
        if (token && typeof url === 'string' && url.includes('hrinfinity.fastcopies.in')) {
            options.headers = options.headers || {};
            options.headers['Authorization'] = `Token ${token}`;
            if (!options.headers['Content-Type'] && !(options.body instanceof FormData)) {
                options.headers['Content-Type'] = 'application/json';
            }
        }
        return _originalFetch(url, options).then(res => {
            if (res.status === 401 && typeof url === 'string' && url.includes('hrinfinity.fastcopies.in')) {
                localStorage.removeItem('auth_token');
                window.location.href = 'login.html';
            }
            return res;
        });
    };
})();

// Global State
const state = {
    workers: [],
    transactions: [],
    memberships: [],
    products: [],
    productSales: [],
    attendance: [],        // today's attendance records keyed by workerId
    appointments: [],
    dateFilter: 'today',  // 'today', '7d', '30d', 'all', 'custom'
    customStart: null,
    customEnd: null
};

// API Service
const API_URL = 'https://hrinfinity.fastcopies.in/api';

const apiService = {
    authHeaders() {
        const token = localStorage.getItem('auth_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
        };
    },
    async getWorkers() {
        try {
            const res = await fetch(`${API_URL}/workers/`, { headers: this.authHeaders() });
            if (res.status === 401) { localStorage.removeItem('auth_token'); window.location.href = 'login.html'; }
            return await res.json();
        } catch (e) {
            console.error('Failed to fetch workers:', e);
            return [];
        }
    },
    async getTransactions() {
        try {
            const res = await fetch(`${API_URL}/transactions/`, { headers: this.authHeaders() });
            if (res.status === 401) { localStorage.removeItem('auth_token'); window.location.href = 'login.html'; }
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
                headers: this.authHeaders(),
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
                headers: this.authHeaders(),
                body: JSON.stringify(worker)
            });
            return await res.json();
        } catch (e) {
            console.error('Failed to update worker:', e);
            throw e;
        }
    },
    async deleteWorker(id) {
        try {
            const res = await fetch(`${API_URL}/workers/${id}/`, {
                method: 'DELETE',
                headers: this.authHeaders()
            });
            if (!res.ok) throw new Error('Failed to delete worker');
            return true;
        } catch (e) {
            console.error('Failed to delete worker:', e);
            throw e;
        }
    },
    async blockWorker(id, isBlocked) {
        try {
            const res = await fetch(`${API_URL}/workers/${id}/`, {
                method: 'PATCH',
                headers: this.authHeaders(),
                body: JSON.stringify({ is_blocked: isBlocked })
            });
            if (!res.ok) throw new Error('Failed to update worker status');
            return await res.json();
        } catch (e) {
            console.error('Failed to block/unblock worker:', e);
            throw e;
        }
    },
    async addTransaction(tx) {
        try {
            const res = await fetch(`${API_URL}/transactions/`, {
                method: 'POST',
                headers: this.authHeaders(),
                body: JSON.stringify(tx)
            });
            if (!res.ok) {
                const text = await res.text();
                console.error('Server error response:', res.status, text);
                throw new Error(`Server returned ${res.status}`);
            }
            const data = await res.json();
            return { ...data, timestamp: new Date(data.timestamp), amount: parseFloat(data.amount) };
        } catch (e) {
            console.error('Failed to add transaction:', e);
            throw e;
        }
    },
    async getMemberships() {
        try {
            const res = await fetch(`${API_URL}/memberships/`, { headers: this.authHeaders() });
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
                headers: this.authHeaders(),
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
            const res = await fetch(`${API_URL}/membership-records/`, { headers: this.authHeaders() });
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            console.error('Failed to fetch membership records:', e);
            return [];
        }
    },
    async deleteMembership(id) {
        try {
            const res = await fetch(`${API_URL}/memberships/${id}/`, {
                method: 'DELETE',
                headers: this.authHeaders()
            });
            if (!res.ok) throw new Error('Failed to delete membership');
            return true;
        } catch (e) {
            console.error('Failed to delete membership:', e);
            throw e;
        }
    },
    async addMembershipRecord(record) {
        try {
            const res = await fetch(`${API_URL}/membership-records/`, {
                method: 'POST',
                headers: this.authHeaders(),
                body: JSON.stringify(record)
            });
            if (!res.ok) throw new Error('Server error');
            return await res.json();
        } catch (e) {
            console.error('Failed to add membership record:', e);
            throw e;
        }
    },
    async getProducts() {
        try {
            const res = await fetch(`${API_URL}/products/`, { headers: this.authHeaders() });
            return await res.json();
        } catch (e) {
            console.error('Failed to fetch products:', e);
            return [];
        }
    },
    async addProduct(product) {
        try {
            const res = await fetch(`${API_URL}/products/`, {
                method: 'POST',
                headers: this.authHeaders(),
                body: JSON.stringify(product)
            });
            if (!res.ok) throw new Error('Failed to add product');
            return await res.json();
        } catch (e) {
            console.error('Failed to add product:', e);
            throw e;
        }
    },
    async deleteProduct(id) {
        try {
            const res = await fetch(`${API_URL}/products/${id}/`, {
                method: 'DELETE',
                headers: this.authHeaders()
            });
            if (!res.ok) throw new Error('Failed to delete product');
            return true;
        } catch (e) {
            console.error('Failed to delete product:', e);
            throw e;
        }
    },
    async getProductSales() {
        try {
            const res = await fetch(`${API_URL}/product-sales/`, { headers: this.authHeaders() });
            if (!res.ok) throw new Error('Failed to fetch product sales');
            return await res.json();
        } catch (e) {
            console.error('Failed to load product sales:', e);
            return [];
        }
    },
    async sellProduct(saleRecord) {
        try {
            const res = await fetch(`${API_URL}/product-sales/`, {
                method: 'POST',
                headers: this.authHeaders(),
                body: JSON.stringify(saleRecord)
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to sell product');
            }
            return await res.json();
        } catch (e) {
            console.error('Failed to record product sale:', e);
            throw e;
        }
    },
    async restockProduct(restockData) {
        try {
            const res = await fetch(`${API_URL}/product-restocks/`, {
                method: 'POST',
                headers: this.authHeaders(),
                body: JSON.stringify(restockData)
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to restock product');
            }
            return await res.json();
        } catch (e) {
            console.error('Failed to record product restock:', e);
            throw e;
        }
    },
    async getAttendance() {
        try {
            const res = await fetch(`${API_URL}/attendance/`, { headers: this.authHeaders() });
            return await res.json();
        } catch (e) {
            console.error('Failed to fetch attendance:', e);
            return [];
        }
    },
    async checkIn(workerId) {
        const res = await fetch(`${API_URL}/attendance/`, {
            method: 'POST',
            headers: this.authHeaders(),
            body: JSON.stringify({ workerId })
        });
        if (!res.ok) throw new Error('Check-in failed');
        return await res.json();
    },
    async checkOut(attendanceId) {
        const res = await fetch(`${API_URL}/attendance/${attendanceId}/`, {
            method: 'PATCH',
            headers: this.authHeaders(),
            body: JSON.stringify({})
        });
        if (!res.ok) throw new Error('Check-out failed');
        return await res.json();
    },
    async getAppointments() {
        try {
            const res = await fetch(`${API_URL}/appointments/`, { headers: this.authHeaders() });
            return await res.json();
        } catch (e) {
            console.error('Failed to fetch appointments:', e);
            return [];
        }
    },
    async addAppointment(appointment) {
        try {
            const res = await fetch(`${API_URL}/appointments/`, {
                method: 'POST',
                headers: this.authHeaders(),
                body: JSON.stringify(appointment)
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Server error: ${text}`);
            }
            return await res.json();
        } catch (e) {
            console.error('Failed to add appointment:', e);
            throw e;
        }
    },
    async completeAppointment(id) {
        try {
            const res = await fetch(`${API_URL}/appointments/${id}/complete/`, {
                method: 'POST',
                headers: this.authHeaders()
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to complete: ${text}`);
            }
            return await res.json();
        } catch (e) {
            console.error('Failed to complete appointment:', e);
            throw e;
        }
    }
};

// Utilities
const formatCurrency = (amount) => '₹' + parseFloat(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const formatTime = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
};
// Convert 24-hour "HH:MM" string to 12-hour "h:MM AM/PM" string
const to12Hour = (timeStr) => {
    if (!timeStr) return '-';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

// Selectors
const DOM = {
    navLinks: document.querySelectorAll('.nav-link'),
    views: document.querySelectorAll('.view-section'),
    currentDate: document.getElementById('current-date'),

    // Global Date Filter
    globalDateSelect: document.getElementById('global-date-select'),
    customDateInputs: document.getElementById('custom-date-inputs'),
    globalDateStart: document.getElementById('global-date-start'),
    globalDateEnd: document.getElementById('global-date-end'),
    btnApplyCustomDate: document.getElementById('btn-apply-custom-date'),

    // Dashboard Stats
    dashNet: document.getElementById('dashboard-net'),
    dashCash: document.getElementById('dashboard-cash'),
    dashOnline: document.getElementById('dashboard-online'),
    dashExpenses: document.getElementById('dashboard-expenses'),
    dashTotalRevenue: document.getElementById('dashboard-total-revenue'),

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

    // Resign Modal
    btnResignWorker: document.getElementById('btn-resign-worker'),
    resignModal: document.getElementById('resign-modal'),
    resignWorkerId: document.getElementById('resign-worker-id'),
    resignWorkerName: document.getElementById('resign-worker-name'),
    btnBlockWorker: document.getElementById('btn-block-worker'),
    btnDeleteWorker: document.getElementById('btn-delete-worker'),

    // Memberships
    membershipsGrid: document.getElementById('memberships-grid'),
    membershipSearch: document.getElementById('membership-search'),
    btnAddMembership: document.getElementById('btn-add-membership'),
    membershipModal: document.getElementById('membership-modal'),
    membershipForm: document.getElementById('membership-form'),
    msMemberId: document.getElementById('ms-member-id'),
    msName: document.getElementById('ms-name'),
    msPhone: document.getElementById('ms-phone'),
    msVillage: document.getElementById('ms-village'),
    msIssueDate: document.getElementById('ms-issue-date'),
    msExpireDate: document.getElementById('ms-expire-date'),

    // Products
    productsGrid: document.getElementById('products-grid'),
    productSearch: document.getElementById('product-search'),
    btnAddProduct: document.getElementById('btn-add-product'),

    // Product Modal
    productModal: document.getElementById('product-modal'),
    productForm: document.getElementById('product-form'),
    prodName: document.getElementById('prod-name'),
    prodPrice: document.getElementById('prod-price'),
    prodStock: document.getElementById('prod-stock'),

    // Sell Product Modal
    sellProductModal: document.getElementById('sell-product-modal'),
    sellProductForm: document.getElementById('sell-product-form'),
    spmProductId: document.getElementById('spm-product-id'),
    spmQuantity: document.getElementById('spm-quantity'),
    spmTotal: document.getElementById('spm-total'),
    spmTitle: document.getElementById('spm-title'),
    spmAvailableStock: document.getElementById('spm-available-stock'),

    // Restock Product Modal
    restockProductModal: document.getElementById('restock-product-modal'),
    restockProductForm: document.getElementById('restock-product-form'),
    rpmProductId: document.getElementById('rpm-product-id'),
    rpmTitle: document.getElementById('rpm-title'),
    rpmQuantity: document.getElementById('rpm-quantity'),
    rpmCurrentStock: document.getElementById('rpm-current-stock'),
    rpmTotalRestocks: document.getElementById('rpm-total-restocks'),
    rpmRecordsBody: document.getElementById('rpm-records-body'),

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

    // Shop Expenses
    workerSettlementsList: document.getElementById('worker-settlements-list'),
    btnAddShopExpense: document.getElementById('btn-add-shop-expense'),
    shopExpensesBody: document.getElementById('shop-expenses-body'),

    // Shop Expense Modal
    shopExpenseModal: document.getElementById('shop-expense-modal'),
    shopExpenseForm: document.getElementById('shop-expense-form'),
    seDesc: document.getElementById('se-desc'),
    seAmount: document.getElementById('se-amount'),
    seDate: document.getElementById('se-date'),

    // Settlement Modal
    settlementModal: document.getElementById('settlement-modal'),
    settlementForm: document.getElementById('settlement-form'),
    smWorkerId: document.getElementById('sm-worker-id'),
    smPayableAmount: document.getElementById('sm-payable-amount'),
    smAgreedAmount: document.getElementById('sm-agreed-amount'),
    smWorkerName: document.getElementById('sm-worker-name'),
    smDate: document.getElementById('sm-date'),
    smDisplayAgreed: document.getElementById('sm-display-agreed'),
    smDisplayPayable: document.getElementById('sm-display-payable'),

    // Dashboard Metric History Modal
    metricHistoryModal: document.getElementById('metric-history-modal'),
    mhmTitle: document.getElementById('mhm-title'),
    mhmRecordsBody: document.getElementById('mhm-records-body'),

    // Appointments
    viewAppointments: document.getElementById('view-appointments'),
    appointmentsGrid: document.getElementById('appointments-grid'),
    btnAddAppointment: document.getElementById('btn-add-appointment'),
    appointmentSearch: document.getElementById('appointment-search'),
    appointmentModal: document.getElementById('appointment-modal'),
    appointmentForm: document.getElementById('appointment-form'),
    apName: document.getElementById('ap-name'),
    apPhone: document.getElementById('ap-phone'),
    apDesc: document.getElementById('ap-desc'),
    apDate: document.getElementById('ap-date'),
    apWorker: document.getElementById('ap-worker'),
    apAmount: document.getElementById('ap-amount'),

    topWorkersList: document.getElementById('top-workers-list'),

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
        state.products = await apiService.getProducts();
        state.productSales = await apiService.getProductSales();
        state.attendance = await apiService.getAttendance();
        state.appointments = await apiService.getAppointments();

        this.renderDashboard();
        this.renderWorkers();
        this.renderMemberships();
        this.renderProducts();
        this.renderExpenses();
        this.renderAppointments();
    },

    setupEventListeners() {
        this.setupGlobalDateFilter();

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

        // Resign Modal — Block Worker
        if (DOM.btnBlockWorker) {
            DOM.btnBlockWorker.addEventListener('click', async () => {
                const workerId = parseInt(DOM.resignWorkerId.value);
                const worker = state.workers.find(w => w.id === workerId);
                if (!worker) return;
                try {
                    const updated = await apiService.blockWorker(workerId, true);
                    const idx = state.workers.findIndex(w => w.id === workerId);
                    if (idx !== -1) state.workers[idx].is_blocked = true;
                    DOM.resignModal.classList.remove('show');
                    this.renderWorkers();
                    this.renderExpenses();
                    this.renderDashboard();
                    this.showToast(`${worker.name} has been blocked (resigned).`, 'success');
                } catch (e) {
                    this.showToast('Failed to block worker.', 'error');
                }
            });
        }

        // Resign Modal — Permanently Delete Worker
        if (DOM.btnDeleteWorker) {
            DOM.btnDeleteWorker.addEventListener('click', async () => {
                const workerId = parseInt(DOM.resignWorkerId.value);
                const worker = state.workers.find(w => w.id === workerId);
                if (!worker) return;
                if (!confirm(`⚠️ Permanently delete ${worker.name}? This will remove ALL their transactions and history. This CANNOT be undone.`)) return;
                try {
                    await apiService.deleteWorker(workerId);
                    state.workers = state.workers.filter(w => w.id !== workerId);
                    state.transactions = state.transactions.filter(t => t.workerId !== workerId);
                    DOM.resignModal.classList.remove('show');
                    this.renderWorkers();
                    this.renderExpenses();
                    this.renderDashboard();
                    this.showToast(`${worker.name} has been permanently deleted.`, 'success');
                } catch (e) {
                    this.showToast('Failed to delete worker.', 'error');
                }
            });
        }

        // Form Submit (Transaction)
        if (DOM.transactionForm) {
            DOM.transactionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTransactionSubmit();
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
                const today = new Date();
                DOM.msIssueDate.valueAsDate = today;

                // Auto-calculate exact 1 year from today for expiry date
                const nextYear = new Date(today);
                nextYear.setFullYear(today.getFullYear() + 1);
                DOM.msExpireDate.valueAsDate = nextYear;

                // Clear member ID field so user can enter it manually
                if (DOM.msMemberId) {
                    DOM.msMemberId.value = '';
                    DOM.msMemberId.readOnly = false;
                    DOM.msMemberId.placeholder = 'Enter Member ID manually';
                }

                DOM.membershipModal.classList.add('show');
            });
        }

        // Auto-calculate exact 1 year when Issue Date changes
        if (DOM.msIssueDate && DOM.msExpireDate) {
            DOM.msIssueDate.addEventListener('change', (e) => {
                if (!e.target.value) return;
                const selectedDate = new Date(e.target.value);
                const nextYear = new Date(selectedDate);
                nextYear.setFullYear(selectedDate.getFullYear() + 1);
                DOM.msExpireDate.valueAsDate = nextYear;
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

        if (DOM.btnAddShopExpense) {
            DOM.btnAddShopExpense.addEventListener('click', () => {
                if (DOM.shopExpenseForm) DOM.shopExpenseForm.reset();

                // Set default date and time to now
                const now = new Date();
                const localOffset = now.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(now - localOffset)).toISOString().slice(0, 16);
                if (DOM.seDate) DOM.seDate.value = localISOTime;

                if (DOM.shopExpenseModal) DOM.shopExpenseModal.classList.add('show');
            });
        }

        if (DOM.shopExpenseForm) {
            DOM.shopExpenseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleShopExpenseSubmit();
            });
        }

        if (DOM.settlementForm) {
            DOM.settlementForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSettlementSubmit();
            });
        }

        // Membership Search functionality
        if (DOM.membershipSearch) {
            DOM.membershipSearch.addEventListener('input', () => {
                this.renderMemberships();
            });
        }

        if (DOM.btnAddAppointment) {
            DOM.btnAddAppointment.addEventListener('click', () => {
                this.openAppointmentModal();
            });
        }

        if (DOM.appointmentForm) {
            DOM.appointmentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAppointmentSubmit();
            });
        }

        if (DOM.appointmentSearch) {
            DOM.appointmentSearch.addEventListener('input', () => {
                this.renderAppointments();
            });
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
                if (DOM.productModal) DOM.productModal.classList.remove('show');
                if (DOM.sellProductModal) DOM.sellProductModal.classList.remove('show');
                if (DOM.restockProductModal) DOM.restockProductModal.classList.remove('show');
                if (DOM.metricHistoryModal) DOM.metricHistoryModal.classList.remove('show');
                if (DOM.appointmentModal) DOM.appointmentModal.classList.remove('show');
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

        // Product Events
        if (DOM.btnAddProduct && DOM.productModal && DOM.productForm) {
            DOM.btnAddProduct.addEventListener('click', () => {
                DOM.productForm.reset();
                DOM.productModal.classList.add('show');
            });

            DOM.productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProductSubmit();
            });
        }

        if (DOM.sellProductForm) {
            DOM.sellProductForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProductSellSubmit();
            });
        }

        if (DOM.restockProductForm) {
            DOM.restockProductForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProductRestockSubmit();
            });
        }

        if (DOM.productSearch) {
            DOM.productSearch.addEventListener('input', () => {
                this.renderProducts();
            });
        }

        // Type filters for Modal
        const applyFilters = () => {
            if (!DOM.tmWorkerId) return;
            const workerId = parseInt(DOM.tmWorkerId.value);
            const txType = DOM.wmTypeFilter && DOM.wmTypeFilter.value ? DOM.wmTypeFilter.value : 'all';
            this.updateWorkerModalStats(workerId);
            this.renderWorkerTransactions(workerId, txType);
        };

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
        if (viewId === 'memberships') this.renderMemberships();
        if (viewId === 'products') this.renderProducts();
        if (viewId === 'expenses') this.renderExpenses();
    },

    setupGlobalDateFilter() {
        if (!DOM.globalDateSelect) return;

        DOM.globalDateSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            state.dateFilter = val;

            if (val === 'custom') {
                DOM.customDateInputs.style.display = 'flex';
            } else {
                DOM.customDateInputs.style.display = 'none';
                this.refreshAllViews();
            }
        });

        if (DOM.btnApplyCustomDate) {
            DOM.btnApplyCustomDate.addEventListener('click', () => {
                const s = DOM.globalDateStart.value;
                const e = DOM.globalDateEnd.value;
                if (!s || !e) {
                    this.showToast('Please select both start and end dates', 'error');
                    return;
                }
                state.customStart = s;
                state.customEnd = e;
                this.refreshAllViews();
            });
        }
    },

    refreshAllViews() {
        // Only refresh views that rely on date filtering logic
        this.renderDashboard();
        this.renderWorkers();
        this.renderExpenses();
        // Product sales history might need a refresh logic if we update it
        // this.renderProducts(); 
    },

    isDateInRange(dateObj) {
        if (state.dateFilter === 'all') return true;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (state.dateFilter === 'today') {
            return dateObj >= startOfToday;
        }

        if (state.dateFilter === '7d') {
            const sevenDaysAgo = new Date(startOfToday);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return dateObj >= sevenDaysAgo;
        }

        if (state.dateFilter === '30d') {
            const thirtyDaysAgo = new Date(startOfToday);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return dateObj >= thirtyDaysAgo;
        }

        if (state.dateFilter === 'custom' && state.customStart && state.customEnd) {
            const customStart = new Date(state.customStart);
            const customEnd = new Date(state.customEnd);
            // Include entire end day by pushing it to 23:59:59
            customEnd.setHours(23, 59, 59, 999);
            return dateObj >= customStart && dateObj <= customEnd;
        }

        return true; // Fallback
    },

    // Get aggregated stats for a specific worker OR whole shop (if workerId is null)
    getStats(workerId = null) {
        let txs = state.transactions;
        if (workerId !== null) {
            txs = txs.filter(t => t.workerId === workerId);
        }

        // Apply global date filter
        txs = txs.filter(t => this.isDateInRange(new Date(t.timestamp)));

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
                // Exclude settlement payouts from individual worker card expense totals, but KEEP them for Shop Dashboard stats
                if (workerId === null || !t.desc.startsWith('Monthly Salary Settlement')) {
                    totalExpense += t.amount;
                }
            }
        });

        // Add Product Sales to Dashboard (Only for shop-wide stats, workerId === null)
        if (workerId === null) {
            let pSales = state.productSales.filter(sale => this.isDateInRange(new Date(sale.timestamp)));

            pSales.forEach(sale => {
                const amount = parseFloat(sale.sale_price) || 0;
                totalIncome += amount;
                if (sale.payment_method === 'cash') totalCashIn += amount;
                if (sale.payment_method === 'online') totalOnlineIn += amount;
            });
        }

        const netCollected = totalIncome - totalExpense;
        const expectedCash = totalCashIn - totalExpense;

        return { totalIncome, totalCashIn, totalOnlineIn, totalExpense, netCollected, expectedCash };
    },

    renderDashboard() {
        const stats = this.getStats();

        // Counter Animation effect
        if (DOM.dashTotalRevenue) this.animateValue(DOM.dashTotalRevenue, stats.totalIncome);
        this.animateValue(DOM.dashNet, stats.netCollected);
        this.animateValue(DOM.dashCash, stats.totalCashIn);
        this.animateValue(DOM.dashOnline, stats.totalOnlineIn);
        this.animateValue(DOM.dashExpenses, stats.totalExpense);

        this.renderAnalyticsChart();
        this.renderTopWorkers();
    },

    renderTopWorkers() {
        if (!DOM.topWorkersList) return;
        DOM.topWorkersList.innerHTML = '';

        // Calculate income for each active worker
        const workerStats = state.workers
            .filter(w => !w.is_blocked) // Exclude blocked workers
            .map(w => {
                const stats = this.getStats(w.id);
                return {
                    worker: w,
                    income: stats.totalIncome
                };
            })
            .filter(ws => ws.income > 0)
            .sort((a, b) => b.income - a.income)
            .slice(0, 3); // Top 3 workers

        if (workerStats.length === 0) {
            DOM.topWorkersList.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 10px;">No active data available</div>';
            return;
        }

        workerStats.forEach((ws, idx) => {
            const item = document.createElement('div');
            item.className = 'worker-list-item';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.padding = '10px 0';
            item.style.borderBottom = idx < workerStats.length - 1 ? '1px solid var(--border-glass)' : 'none';

            item.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div class="avatar" style="width: 32px; height: 32px; font-size: 0.9rem;">
                        ${ws.worker.photo ? '<img src="' + ws.worker.photo + '" style="width:100%; height:100%; object-fit:cover;">' : ws.worker.initials}
                    </div>
                    <div>
                        <div style="font-weight: 500; font-size: 0.95rem;">${ws.worker.name}</div>
                    </div>
                </div>
                <div style="font-weight: bold; color: var(--text-green);">
                    ${formatCurrency(ws.income)}
                </div>
            `;
            DOM.topWorkersList.appendChild(item);
        });
    },

    // ─── Analytics Chart ────────────────────────────────────────────
    _analyticsChartInstance: null,
    _chartType: 'line',

    setChartType(type) {
        this._chartType = type;
        // Update toggle button styles
        const lineBtn = document.getElementById('chart-type-line');
        const barBtn = document.getElementById('chart-type-bar');
        if (lineBtn && barBtn) {
            if (type === 'line') {
                lineBtn.className = 'btn btn-sm btn-primary';
                barBtn.className = 'btn btn-sm btn-outline';
            } else {
                lineBtn.className = 'btn btn-sm btn-outline';
                barBtn.className = 'btn btn-sm btn-primary';
            }
        }
        this.renderAnalyticsChart();
    },

    buildChartData() {
        // ── Determine date range ──────────────────────────────────
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let rangeStart, rangeEnd, groupBy;

        rangeEnd = new Date(startOfToday);
        rangeEnd.setHours(23, 59, 59, 999);

        if (state.dateFilter === 'today') {
            rangeStart = new Date(startOfToday);
            groupBy = 'hour';
        } else if (state.dateFilter === '7d') {
            rangeStart = new Date(startOfToday);
            rangeStart.setDate(rangeStart.getDate() - 6);
            groupBy = 'day';
        } else if (state.dateFilter === '30d') {
            rangeStart = new Date(startOfToday);
            rangeStart.setDate(rangeStart.getDate() - 29);
            groupBy = 'day';
        } else if (state.dateFilter === 'custom' && state.customStart && state.customEnd) {
            rangeStart = new Date(state.customStart);
            rangeEnd = new Date(state.customEnd);
            rangeEnd.setHours(23, 59, 59, 999);
            const diffDays = Math.ceil((rangeEnd - rangeStart) / 86400000);
            groupBy = diffDays <= 1 ? 'hour' : 'day';
        } else { // 'all'
            // Find earliest transaction date
            const allDates = [
                ...state.transactions.map(t => new Date(t.timestamp)),
                ...state.productSales.map(s => new Date(s.timestamp))
            ];
            rangeStart = allDates.length ? new Date(Math.min(...allDates)) : new Date(startOfToday);
            rangeStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
            const diffDays = Math.ceil((rangeEnd - rangeStart) / 86400000);
            groupBy = diffDays > 60 ? 'week' : 'day';
        }

        // ── Build bucket map ────────────────────────────────────────
        const buckets = {}; // key → { revenue, expense }

        function bucketKey(date) {
            if (groupBy === 'hour') {
                const h = date.getHours();
                const ampm = h >= 12 ? 'PM' : 'AM';
                const hr = h % 12 || 12;
                return `${hr}${ampm}`;
            }
            if (groupBy === 'week') {
                // ISO week start (Monday)
                const d = new Date(date);
                const day = d.getDay() || 7;
                d.setDate(d.getDate() - day + 1);
                return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            }
            // day
            return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        }

        function initBucket(key) {
            if (!buckets[key]) buckets[key] = { revenue: 0, expense: 0 };
        }

        // Pre-fill buckets for the range so we get 0-lines where there's no data
        if (groupBy === 'hour') {
            for (let h = 0; h < 24; h++) {
                const ampm = h >= 12 ? 'PM' : 'AM';
                const hr = h % 12 || 12;
                initBucket(`${hr}${ampm}`);
            }
        } else {
            const cur = new Date(rangeStart);
            while (cur <= rangeEnd) {
                initBucket(bucketKey(cur));
                if (groupBy === 'week') cur.setDate(cur.getDate() + 7);
                else cur.setDate(cur.getDate() + 1);
            }
        }

        // Fill from transactions
        state.transactions.forEach(t => {
            const d = new Date(t.timestamp);
            if (d < rangeStart || d > rangeEnd) return;
            const key = bucketKey(d);
            initBucket(key);
            if (t.type === 'income') buckets[key].revenue += parseFloat(t.amount) || 0;
            else buckets[key].expense += parseFloat(t.amount) || 0;
        });

        // Fill from product sales
        state.productSales.forEach(s => {
            const d = new Date(s.timestamp);
            if (d < rangeStart || d > rangeEnd) return;
            const key = bucketKey(d);
            initBucket(key);
            buckets[key].revenue += parseFloat(s.sale_price) || 0;
        });

        const labels = Object.keys(buckets);
        const revenue = labels.map(k => buckets[k].revenue);
        const expense = labels.map(k => buckets[k].expense);

        return { labels, revenue, expense };
    },

    renderAnalyticsChart() {
        const canvas = document.getElementById('analytics-chart');
        if (!canvas || typeof Chart === 'undefined') return;

        const { labels, revenue, expense } = this.buildChartData();
        const type = this._chartType || 'line';

        // Destroy old instance to avoid canvas reuse errors
        if (this._analyticsChartInstance) {
            this._analyticsChartInstance.destroy();
            this._analyticsChartInstance = null;
        }

        const isLine = type === 'line';
        const primaryColor = '#8b5cf6';
        const greenColor = '#2ecc71';
        const redColor = '#e74c3c';
        const gridColor = 'rgba(255,255,255,0.06)';
        const textColor = 'rgba(255,255,255,0.55)';

        this._analyticsChartInstance = new Chart(canvas, {
            type,
            data: {
                labels,
                datasets: [
                    {
                        label: 'Revenue',
                        data: revenue,
                        borderColor: greenColor,
                        backgroundColor: isLine
                            ? 'rgba(46,204,113,0.12)'
                            : 'rgba(46,204,113,0.75)',
                        borderWidth: isLine ? 2.5 : 0,
                        pointBackgroundColor: greenColor,
                        pointRadius: isLine ? 4 : 0,
                        pointHoverRadius: 6,
                        fill: isLine,
                        tension: 0.4,
                        borderRadius: isLine ? 0 : 6,
                    },
                    {
                        label: 'Expenses',
                        data: expense,
                        borderColor: redColor,
                        backgroundColor: isLine
                            ? 'rgba(231,76,60,0.10)'
                            : 'rgba(231,76,60,0.75)',
                        borderWidth: isLine ? 2.5 : 0,
                        pointBackgroundColor: redColor,
                        pointRadius: isLine ? 4 : 0,
                        pointHoverRadius: 6,
                        fill: isLine,
                        tension: 0.4,
                        borderRadius: isLine ? 0 : 6,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: textColor,
                            font: { family: 'Outfit', size: 13 },
                            usePointStyle: true,
                            pointStyleWidth: 10,
                            padding: 20,
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15,15,30,0.92)',
                        titleColor: '#fff',
                        bodyColor: textColor,
                        borderColor: 'rgba(139,92,246,0.4)',
                        borderWidth: 1,
                        padding: 12,
                        titleFont: { family: 'Outfit', size: 13, weight: '600' },
                        bodyFont: { family: 'Outfit', size: 12 },
                        callbacks: {
                            label(ctx) {
                                return ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString('en-IN')}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            font: { family: 'Outfit', size: 11 },
                            maxRotation: 45,
                            autoSkip: true,
                            maxTicksLimit: 14,
                        },
                        border: { color: gridColor }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            font: { family: 'Outfit', size: 11 },
                            callback: v => '₹' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v),
                        },
                        border: { color: gridColor },
                        beginAtZero: true,
                    }
                }
            }
        });
    },

    openMetricHistory(metricType) {
        if (!DOM.metricHistoryModal || !DOM.mhmRecordsBody) return;

        // Setup title
        let title = '';
        if (metricType === 'total_revenue') title = 'Total Revenue History';
        else if (metricType === 'net_revenue') title = 'Net Revenue History';
        else if (metricType === 'cash_in') title = 'Cash In History';
        else if (metricType === 'online_in') title = 'Online In History';
        else if (metricType === 'expenses') title = 'Expenses History';

        if (DOM.mhmTitle) DOM.mhmTitle.textContent = title;

        // Build Unified Ledger within the selected Date Range
        let unifiedLedger = [];

        // 1. Add Transactions
        state.transactions.filter(t => this.isDateInRange(new Date(t.timestamp))).forEach(t => {
            unifiedLedger.push({
                timestamp: new Date(t.timestamp),
                desc: t.desc || 'Transaction',
                type: t.type,
                mode: t.mode,
                amount: parseFloat(t.amount)
            });
        });

        // 2. Add Product Sales (as 'income')
        state.productSales.filter(s => this.isDateInRange(new Date(s.timestamp))).forEach(s => {
            const prod = state.products.find(p => p.id === s.productId) || {};
            unifiedLedger.push({
                timestamp: new Date(s.timestamp),
                desc: `Product Sale: ${prod.name || 'Unknown'} (x${s.quantity_sold})`,
                type: 'income',
                mode: s.payment_method || 'cash',
                amount: parseFloat(s.sale_price) || 0
            });
        });

        // Apply Metric Filters
        if (metricType === 'cash_in') {
            unifiedLedger = unifiedLedger.filter(r => r.type === 'income' && r.mode === 'cash');
        } else if (metricType === 'online_in') {
            unifiedLedger = unifiedLedger.filter(r => r.type === 'income' && r.mode === 'online');
        } else if (metricType === 'expenses') {
            unifiedLedger = unifiedLedger.filter(r => r.type === 'expense');
        } else if (metricType === 'total_revenue') {
            unifiedLedger = unifiedLedger.filter(r => r.type === 'income');
        } // 'net_revenue' includes everything

        // Sort chronologically (newest first)
        unifiedLedger.sort((a, b) => b.timestamp - a.timestamp);

        // Render Table
        DOM.mhmRecordsBody.innerHTML = '';
        if (unifiedLedger.length === 0) {
            DOM.mhmRecordsBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 30px; color: var(--text-muted);">No records found for this period.</td></tr>';
        } else {
            unifiedLedger.forEach(record => {
                const tr = document.createElement('tr');

                const dateStr = record.timestamp.toLocaleDateString();
                const timeStr = formatTime(record.timestamp);

                let typeHtml = '';
                if (record.type === 'income') {
                    if (record.mode === 'cash') {
                        typeHtml = '<span class="badge badge-cash"><i class="fa-solid fa-money-bill"></i> Cash In</span>';
                    } else {
                        typeHtml = '<span class="badge badge-online"><i class="fa-solid fa-mobile-screen"></i> Online In</span>';
                    }
                } else {
                    typeHtml = '<span class="badge badge-expense">Expense</span>';
                }

                const amountClass = record.type === 'income' ? 'text-green' : 'text-red';
                const sign = record.type === 'income' ? '+' : '-';

                tr.innerHTML = `
                    <td>
                        <div style="font-weight: 500;">${dateStr}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${timeStr}</div>
                    </td>
                    <td>${record.desc}</td>
                    <td>${typeHtml}</td>
                    <td class="${amountClass} font-bold" style="text-align: right;">${sign}${formatCurrency(record.amount)}</td>
                `;
                DOM.mhmRecordsBody.appendChild(tr);
            });
        }

        // Show Modal
        DOM.metricHistoryModal.classList.add('show');
    },

    renderWorkers() {
        DOM.workersGrid.innerHTML = '';

        // Build a today-keyed map: workerId -> attendance record
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayAttMap = {};
        state.attendance.forEach(a => {
            if (a.date === todayStr) todayAttMap[a.workerId] = a;
        });

        // Sort workers: Active first, Blocked second
        const sortedWorkers = [...state.workers].sort((a, b) => {
            if (a.is_blocked === b.is_blocked) return 0;
            return a.is_blocked ? 1 : -1;
        });

        sortedWorkers.forEach(worker => {
            const stats = this.getStats(worker.id);
            const att = todayAttMap[worker.id];

            // Derive status badge
            let statusBadge, attButtons;
            if (!att || !att.check_in) {
                statusBadge = `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(255,255,255,0.07);color:var(--text-muted);">⚪ Not Started</span>`;
                attButtons = `<button class="btn btn-sm btn-att-checkin" style="flex:1;background:rgba(46,204,113,0.15);border:1px solid rgba(46,204,113,0.4);color:#2ecc71;border-radius:6px;padding:7px;font-size:0.8rem;cursor:pointer;transition:all 0.2s;" data-worker="${worker.id}"><i class="fa-solid fa-clock"></i> Check In</button>`;
            } else if (att.check_in && !att.check_out) {
                statusBadge = `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(46,204,113,0.15);color:#2ecc71;">🟢 In since ${to12Hour(att.check_in)}</span>`;
                attButtons = `<button class="btn btn-sm btn-att-checkout" style="flex:1;background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.4);color:#e74c3c;border-radius:6px;padding:7px;font-size:0.8rem;cursor:pointer;transition:all 0.2s;" data-worker="${worker.id}" data-attid="${att.id}"><i class="fa-solid fa-clock"></i> Check Out</button>`;
            } else {
                const hrs = att.check_in && att.check_out
                    ? (() => { const [ih, im] = att.check_in.split(':').map(Number); const [oh, om] = att.check_out.split(':').map(Number); const mins = (oh * 60 + om) - (ih * 60 + im); return `${Math.floor(mins / 60)}h ${mins % 60}m`; })()
                    : '';
                statusBadge = `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(139,92,246,0.15);color:var(--primary);">✅ Done · ${hrs}</span>`;
                attButtons = `<button class="btn btn-sm" disabled style="flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:var(--text-muted);border-radius:6px;padding:7px;font-size:0.8rem;">Shift Complete</button>`;
            }

            const card = document.createElement('div');
            card.className = 'worker-card';

            // Check if blocked
            const isBlocked = worker.is_blocked;

            if (isBlocked) {
                card.style.opacity = '0.6';
                card.style.filter = 'grayscale(100%)';
                card.style.pointerEvents = 'none'; // Re-enable pointer events for the rejoin button alone below

                statusBadge = `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(231,76,60,0.15);color:#e74c3c;">🚫 RESIGNED</span>`;
                attButtons = ''; // No attendance for blocked
            }

            card.innerHTML = `
                <div class="worker-card-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <div class="avatar" style="overflow: hidden;">${worker.photo ? `<img src="${worker.photo}" style="width:100%; height:100%; object-fit:cover;">` : worker.initials}</div>
                        <div class="info">
                            <h3>${worker.name}</h3>
                            <p>ID: #00${worker.id}</p>
                        </div>
                    </div>
                    <div>${statusBadge}</div>
                </div>
                <div class="worker-stats-mini" style="margin-bottom: 12px;">
                    <div class="mini-stat">
                        <span class="label">Total Income</span>
                        <span class="value text-primary card-net-val">${formatCurrency(stats.totalIncome)}</span>
                    </div>
                    <div class="mini-stat">
                        <span class="label">Exp Amount</span>
                        <span class="value text-red card-exp-val">${formatCurrency(stats.totalExpense)}</span>
                    </div>
                </div>
                ${!isBlocked ? `
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                    ${attButtons}
                </div>
                <div class="worker-card-actions" style="display: flex; gap: 8px;">
                     <button class="btn btn-sm btn-success btn-add-income-card" style="flex: 1;"><i class="fa-solid fa-plus"></i> Income</button>
                    <button class="btn btn-sm btn-danger btn-add-expense-card" style="flex: 1;"><i class="fa-solid fa-minus"></i> Expense</button>
                </div>
                ` : `
                <div class="worker-card-actions" style="display: flex; justify-content: center;">
                    <button class="btn btn-sm btn-rejoin-worker" style="pointer-events: auto; padding: 8px 16px; border-radius: 20px; background: rgba(46,204,113,0.15); border: 1px solid rgba(46,204,113,0.5); color: #2ecc71; font-weight: bold;"><i class="fa-solid fa-user-check"></i> Rejoin Salon</button>
                </div>
                `}
            `;

            card.addEventListener('click', (e) => {
                if (isBlocked) return; // Don't open modal if blocked
                if (!e.target.closest('.btn-add-income-card') &&
                    !e.target.closest('.btn-add-expense-card') &&
                    !e.target.closest('.btn-att-checkin') &&
                    !e.target.closest('.btn-att-checkout') &&
                    !e.target.closest('.btn-rejoin-worker')) {
                    this.openWorkerModal(worker.id);
                }
            });

            const incomeBtn = card.querySelector('.btn-add-income-card');
            if (incomeBtn) {
                incomeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    DOM.tmWorkerId.value = worker.id;
                    this.openTransactionModal('income');
                });
            }

            const expenseBtn = card.querySelector('.btn-add-expense-card');
            if (expenseBtn) {
                expenseBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    DOM.tmWorkerId.value = worker.id;
                    this.openTransactionModal('expense');
                });
            }

            const checkinBtn = card.querySelector('.btn-att-checkin');
            if (checkinBtn) {
                checkinBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await this.handleCheckIn(worker.id);
                });
            }

            const checkoutBtn = card.querySelector('.btn-att-checkout');
            if (checkoutBtn) {
                checkoutBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const attId = parseInt(checkoutBtn.dataset.attid);
                    await this.handleCheckOut(attId);
                });
            }

            const rejoinBtn = card.querySelector('.btn-rejoin-worker');
            if (rejoinBtn) {
                rejoinBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (!confirm(`Are you sure you want to unblock ${worker.name} and let them rejoin the salon?`)) return;
                    try {
                        await apiService.blockWorker(worker.id, false);
                        const idx = state.workers.findIndex(w => w.id === worker.id);
                        if (idx !== -1) state.workers[idx].is_blocked = false;
                        this.renderWorkers();
                        this.showToast(`${worker.name} has rejoined the salon.`, 'success');
                    } catch (err) {
                        this.showToast('Failed to unblock worker.', 'error');
                    }
                });
            }

            DOM.workersGrid.appendChild(card);
        });
    },

    async handleCheckIn(workerId) {
        try {
            const record = await apiService.checkIn(workerId);
            // Update local state
            const exists = state.attendance.findIndex(a => a.id === record.id);
            if (exists >= 0) state.attendance[exists] = record;
            else state.attendance.push(record);
            this.renderWorkers();
            this.showToast('✅ Check-in recorded!', 'success');
        } catch (e) {
            this.showToast('Failed to check in', 'error');
        }
    },

    async handleCheckOut(attendanceId) {
        try {
            const record = await apiService.checkOut(attendanceId);
            const idx = state.attendance.findIndex(a => a.id === attendanceId);
            if (idx >= 0) state.attendance[idx] = record;
            this.renderWorkers();
            this.showToast('👋 Check-out recorded!', 'success');
        } catch (e) {
            this.showToast('Failed to check out', 'error');
        }
    },

    renderWorkerAttendance(workerId) {
        const container = document.getElementById('wm-attendance-body');
        if (!container) return;

        const records = state.attendance
            .filter(a => a.workerId === workerId)
            .sort((a, b) => b.date.localeCompare(a.date));

        if (records.length === 0) {
            container.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted);">No attendance records yet.</td></tr>`;
            return;
        }

        container.innerHTML = records.map(a => {
            let hoursWorked = '-';
            if (a.check_in && a.check_out) {
                const [ih, im] = a.check_in.split(':').map(Number);
                const [oh, om] = a.check_out.split(':').map(Number);
                const mins = (oh * 60 + om) - (ih * 60 + im);
                if (mins > 0) hoursWorked = `${Math.floor(mins / 60)}h ${mins % 60}m`;
            }
            const statusColor = (!a.check_in) ? 'var(--text-muted)' : (!a.check_out) ? '#2ecc71' : 'var(--primary)';
            const statusLabel = (!a.check_in) ? 'Absent' : (!a.check_out) ? 'Active' : 'Complete';
            return `<tr>
                <td style="font-weight:500;">${a.date}</td>
                <td style="color:#2ecc71;">${to12Hour(a.check_in)}</td>
                <td style="color:#e74c3c;">${to12Hour(a.check_out)}</td>
                <td>${hoursWorked}</td>
                <td><span style="padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;color:${statusColor};background:${statusColor}22;">${statusLabel}</span></td>
            </tr>`;
        }).join('');
    },

    renderMemberships() {
        if (!DOM.membershipsGrid) return;
        DOM.membershipsGrid.innerHTML = '';

        const searchTerm = DOM.membershipSearch ? DOM.membershipSearch.value.toLowerCase() : '';
        const filteredMemberships = state.memberships.filter(member => {
            const matchesName = member.name.toLowerCase().includes(searchTerm);
            const matchesId = (member.member_id || String(member.id)).toLowerCase().includes(searchTerm);
            const matchesPhone = member.phone_number.includes(searchTerm);
            const matchesVillage = member.village_name.toLowerCase().includes(searchTerm);
            return matchesName || matchesId || matchesPhone || matchesVillage;
        });

        if (filteredMemberships.length === 0) {
            if (searchTerm) {
                DOM.membershipsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">No memberships found matching your search.</div>';
            } else {
                DOM.membershipsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">No memberships found. Click "Add Membership Card" to create one.</div>';
            }
            return;
        }

        filteredMemberships.forEach(member => {
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
                            <h3 style="margin-bottom: 4px;">${member.member_id || member.id} <span style="font-size: 0.9rem; font-weight: normal; margin-left: 8px;">(${member.name})</span></h3>
                            <p style="font-size: 0.85rem;"><i class="fa-solid fa-phone" style="margin-right: 4px;"></i> ${member.phone_number}</p>
                        </div>
                    </div>
                    <button class="btn-icon btn-delete-membership" title="Delete Membership" style="color: var(--text-muted); background: none; border: none; cursor: pointer; padding: 4px;">
                        <i class="fa-solid fa-trash hover-red" style="transition: color 0.2s;"></i>
                    </button>
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

            const deleteBtn = card.querySelector('.btn-delete-membership');
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete the membership for ${member.name}?`)) {
                    try {
                        await apiService.deleteMembership(member.id);
                        state.memberships = state.memberships.filter(m => m.id !== member.id);
                        this.renderMemberships();
                        this.showToast('Membership deleted successfully', 'success');
                    } catch (err) {
                        this.showToast('Failed to delete membership', 'error');
                    }
                }
            });

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

        if (DOM.wmTypeFilter) DOM.wmTypeFilter.value = 'all';

        this.updateWorkerModalStats(workerId);
        this.renderWorkerTransactions(workerId, 'all');
        this.renderWorkerAttendance(workerId);

        DOM.workerModal.classList.add('show');

        // Wire up Resigned button
        if (DOM.btnResignWorker) {
            DOM.btnResignWorker.onclick = () => {
                DOM.resignWorkerId.value = worker.id;
                DOM.resignWorkerName.textContent = `What would you like to do with ${worker.name}?`;
                DOM.workerModal.classList.remove('show');
                DOM.resignModal.classList.add('show');
            };
            // If already blocked, hide resign button (handled in worker card via rejoin)
            DOM.btnResignWorker.style.display = worker.is_blocked ? 'none' : '';
        }
    },

    updateWorkerModalStats(workerId) {
        const stats = this.getStats(workerId);
        DOM.wmNet.textContent = formatCurrency(stats.totalIncome); // Changed to display gross income
        DOM.wmExpectedCash.textContent = formatCurrency(Math.max(0, stats.expectedCash));
        DOM.wmOnline.textContent = formatCurrency(stats.totalOnlineIn);
        DOM.wmExpenses.textContent = formatCurrency(stats.totalExpense);
    },

    renderWorkerTransactions(workerId, txType = 'all') {
        let txs = state.transactions.filter(t =>
            t.workerId === workerId &&
            !t.desc.startsWith('Monthly Salary Settlement')  // exclude settlement payouts
        );

        // Apply global date filter
        txs = txs.filter(t => this.isDateInRange(new Date(t.timestamp)));

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

    openTransactionModal(type, isShopExpense = false) {
        DOM.tmType.value = type;
        DOM.transactionForm.reset();

        if (isShopExpense) {
            DOM.tmTitle.textContent = 'Add Shop Expense';
            DOM.tmWorkerId.parentElement.style.display = 'none';
            DOM.tmWorkerId.required = false;
            DOM.tmWorkerId.value = '';
            DOM.tmPaymentModeGroup.style.display = 'block';
        } else {
            DOM.tmWorkerId.parentElement.style.display = 'block';
            DOM.tmWorkerId.required = true;
            if (type === 'income') {
                DOM.tmTitle.textContent = 'Add Income / Payment';
                DOM.tmPaymentModeGroup.style.display = 'block';
            } else {
                DOM.tmTitle.textContent = 'Add Expense';
                DOM.tmPaymentModeGroup.style.display = 'none'; // Assume expenses are taken from cash
            }
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
        const workerIdStr = DOM.tmWorkerId.value;
        const workerId = workerIdStr && DOM.tmWorkerId.parentElement.style.display !== 'none' ? parseInt(workerIdStr) : null;

        const type = DOM.tmType.value;
        const desc = document.getElementById('tm-desc').value;
        const amount = parseFloat(document.getElementById('tm-amount').value);
        let mode = 'cash'; // Default

        if (type === 'income' || workerId === null) {
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

            // Force update UI if modal is open and resolving a worker transaction
            if (workerId !== null && DOM.workerModal.classList.contains('show')) {
                const currentFilterDate = DOM.wmDateFilter ? DOM.wmDateFilter.value : null;
                const currentFilterType = DOM.wmTypeFilter ? DOM.wmTypeFilter.value : 'all';
                this.updateWorkerModalStats(workerId, currentFilterDate);
                this.renderWorkerTransactions(workerId, currentFilterDate, currentFilterType);
            }

            // Global update
            this.renderDashboard();
            this.renderWorkers();
            this.renderExpenses(); // Update ledger

            this.showToast(`Successfully added ${workerId === null ? 'Shop Expense' : type} of ${formatCurrency(amount)}`, 'success');
        } catch (e) {
            this.showToast(`Failed to add transaction.`, 'error');
        }
    },

    async handleSettlementSubmit() {
        const workerId = parseInt(DOM.smWorkerId.value);
        const payable = parseFloat(DOM.smPayableAmount.value);
        const agreed = parseFloat(DOM.smAgreedAmount.value);
        const dateStr = DOM.smDate.value;

        if (!workerId || isNaN(payable) || !dateStr) {
            this.showToast('Invalid settlement data.', 'error');
            return;
        }

        const worker = state.workers.find(w => w.id === workerId);
        if (!worker) return;

        try {
            // Use current time as the settlement timestamp so ALL expenses before NOW are marked settled
            const timestamp = new Date().toISOString();

            const newTx = await apiService.addTransaction({
                workerId: workerId,
                type: 'expense',
                amount: payable,
                desc: `Monthly Salary Settlement (Base: ${agreed}) - Date: ${dateStr}`,
                mode: 'cash',
                timestamp: timestamp
            });

            // Transform for frontend state
            state.transactions.push({
                ...newTx,
                timestamp: new Date(newTx.timestamp),
                amount: parseFloat(newTx.amount),
                workerId: workerId   // use the integer workerId directly, not newTx.worker
            });

            DOM.settlementModal.classList.remove('show');
            this.renderDashboard();
            this.renderExpenses(); // Re-render to update logs
            this.showToast(`Settled salary for ${worker.name}`, 'success');

        } catch (err) {
            console.error(err);
            this.showToast('Failed to settle salary', 'error');
        }
    },

    async handleShopExpenseSubmit() {
        const desc = DOM.seDesc.value.trim();
        const amount = parseFloat(DOM.seAmount.value);
        const modeInput = document.querySelector('input[name="se-payment-method"]:checked');
        const mode = modeInput ? modeInput.value : 'cash';
        const dateStr = DOM.seDate.value;

        if (!desc || isNaN(amount) || !dateStr) {
            this.showToast('Invalid shop expense data.', 'error');
            return;
        }

        try {
            const timestamp = new Date(dateStr).toISOString();

            const newTx = await apiService.addTransaction({
                workerId: null, // General shop expense
                type: 'expense',
                amount: amount,
                desc: desc,
                mode: mode,
                timestamp: timestamp
            });

            // Transform for frontend state
            state.transactions.push({
                ...newTx,
                timestamp: new Date(newTx.timestamp),
                amount: parseFloat(newTx.amount),
                workerId: null,
                worker: null
            });

            DOM.shopExpenseModal.classList.remove('show');
            this.renderDashboard();
            this.renderExpenses();
            this.showToast(`Successfully logged shop expense: ${desc}`, 'success');

        } catch (err) {
            console.error(err);
            this.showToast('Failed to log shop expense', 'error');
        }
    },

    async handleMembershipSubmit() {
        const memberId = DOM.msMemberId.value.trim();
        const name = DOM.msName.value.trim();
        const phone = DOM.msPhone.value.trim();
        const village = DOM.msVillage.value.trim();
        const issueDate = DOM.msIssueDate.value;
        const expireDate = DOM.msExpireDate.value;

        if (!name || !phone || !village || !issueDate || !expireDate || !memberId) {
            this.showToast('Please fill all required fields.', 'error');
            return;
        }

        try {
            const newMembership = await apiService.addMembership({
                member_id: memberId,
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
            this.showToast(e.message || `Failed to add membership.`, 'error');
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

    renderProducts() {
        if (!DOM.productsGrid) return;
        DOM.productsGrid.innerHTML = '';

        const searchTerm = DOM.productSearch ? DOM.productSearch.value.toLowerCase() : '';
        const filteredProducts = state.products.filter(p => {
            return p.name.toLowerCase().includes(searchTerm);
        });

        if (filteredProducts.length === 0) {
            if (searchTerm) {
                DOM.productsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">No products found matching your search.</div>';
            } else {
                DOM.productsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">No products in inventory. Click "Add Product" to add one.</div>';
            }
            return;
        }

        filteredProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'worker-card';

            // Stock styling
            const stockLevelClass = product.stock_quantity > 5 ? 'text-green' : (product.stock_quantity > 0 ? 'text-warning' : 'text-red');
            const stockIcon = product.stock_quantity > 0 ? 'fa-box' : 'fa-box-open';

            // Format the added date
            let dateAddedStr = 'Unknown';
            if (product.created_at) {
                const dateObj = new Date(product.created_at);
                dateAddedStr = dateObj.toLocaleDateString();
            }

            card.innerHTML = `
                <div class="worker-card-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <div class="avatar" style="background: var(--surface-light); color: var(--text-primary); border: 1px solid var(--border-glass);">
                            <i class="fa-solid fa-pump-soap"></i>
                        </div>
                        <div class="info">
                            <h3 style="margin-bottom: 4px; font-size: 1.1rem;">${product.name}</h3>
                            <p style="font-size: 0.9rem; font-weight: 500; color: var(--text-primary); margin-bottom: 2px;">${formatCurrency(product.price)}</p>
                            <p style="font-size: 0.75rem; color: var(--text-muted);">Added on: ${dateAddedStr}</p>
                        </div>
                    </div>
                    <button class="btn-icon btn-delete-product" title="Delete Product" style="color: var(--text-muted); background: none; border: none; cursor: pointer; padding: 4px;">
                        <i class="fa-solid fa-trash hover-red" style="transition: color 0.2s;"></i>
                    </button>
                </div>
                
                <div style="padding: 16px; background: rgba(0,0,0,0.15); border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px;">Current Stock</div>
                        <div style="font-size: 1.4rem; font-weight: 700;" class="${stockLevelClass}">
                            <i class="fa-solid ${stockIcon}" style="font-size: 1rem; margin-right: 4px;"></i> ${product.stock_quantity}
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-outline btn-restock-product" style="padding: 8px; min-width: 40px;" title="Add Stock">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                        <button class="btn btn-success btn-sell-product" style="padding: 8px 16px; min-width: 90px;">
                            <i class="fa-solid fa-cart-shopping"></i> Sell
                        </button>
                    </div>
                </div>
            `;

            const btnSell = card.querySelector('.btn-sell-product');
            btnSell.addEventListener('click', (e) => {
                e.stopPropagation();
                if (product.stock_quantity <= 0) {
                    this.showToast('Out of stock! Cannot sell this product.', 'error');
                    return;
                }

                // Populate Sell Modal
                DOM.spmProductId.value = product.id;
                DOM.spmTitle.textContent = `Sell ${product.name}`;
                DOM.spmQuantity.value = 1;
                DOM.spmQuantity.max = product.stock_quantity;
                DOM.spmTotal.value = parseFloat(product.price).toFixed(2);
                DOM.spmAvailableStock.textContent = product.stock_quantity;

                // Set a global reference to the currently active product being sold
                app.currentSellProduct = product;

                // Clear any existing listeners by replacing the element
                const newQuantityInput = DOM.spmQuantity.cloneNode(true);
                DOM.spmQuantity.parentNode.replaceChild(newQuantityInput, DOM.spmQuantity);
                DOM.spmQuantity = document.getElementById('spm-quantity'); // Re-bind

                // Auto calculate total
                DOM.spmQuantity.addEventListener('input', (e) => {
                    let qty = parseInt(e.target.value) || 0;
                    if (qty > app.currentSellProduct.stock_quantity) {
                        app.showToast(`Cannot sell more than available stock (${app.currentSellProduct.stock_quantity})`, 'error');
                        qty = app.currentSellProduct.stock_quantity;
                        e.target.value = qty;
                    }
                    DOM.spmTotal.value = (qty * parseFloat(app.currentSellProduct.price)).toFixed(2);
                });

                DOM.sellProductModal.classList.add('show');
            });

            const btnRestock = card.querySelector('.btn-restock-product');
            btnRestock.addEventListener('click', async (e) => {
                e.stopPropagation();

                DOM.rpmProductId.value = product.id;
                DOM.rpmTitle.textContent = `Restock ${product.name}`;
                DOM.rpmQuantity.value = '';
                DOM.rpmCurrentStock.textContent = product.stock_quantity;

                // Load History
                DOM.rpmRecordsBody.innerHTML = '<tr><td colspan="2" style="text-align: center;">Loading history...</td></tr>';
                DOM.rpmTotalRestocks.textContent = '... Total Restocks';

                try {
                    // Fetch all restocks (assuming no specific endpoint for product restocks yet)
                    const res = await fetch(`${API_URL}/product-restocks/`);
                    const allRestocks = await res.json();

                    const productRestocks = allRestocks.filter(r => r.productId === product.id && app.isDateInRange(new Date(r.timestamp)))
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                    DOM.rpmTotalRestocks.textContent = `${productRestocks.length} Filtered Restocks`;

                    if (productRestocks.length === 0) {
                        DOM.rpmRecordsBody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: var(--text-muted);">No restock history found.</td></tr>';
                    } else {
                        DOM.rpmRecordsBody.innerHTML = productRestocks.map(r => {
                            const dateObj = new Date(r.timestamp);
                            const dateStr = dateObj.toLocaleDateString();
                            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return `
                                <tr>
                                    <td>
                                        <div style="font-weight: 500;">${dateStr}</div>
                                        <div style="font-size: 0.8rem; color: var(--text-muted);">${timeStr}</div>
                                    </td>
                                    <td style="text-align: right;">
                                        <span style="color: var(--text-green); font-weight: bold;">+${r.quantity_added}</span>
                                    </td>
                                </tr>
                            `;
                        }).join('');
                    }

                } catch (err) {
                    console.error("Failed to load restock history:", err);
                    DOM.rpmRecordsBody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: var(--text-red);">Failed to load history.</td></tr>';
                    DOM.rpmTotalRestocks.textContent = 'Error';
                }

                DOM.restockProductModal.classList.add('show');
            });

            const btnDelete = card.querySelector('.btn-delete-product');
            btnDelete.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete ${product.name}?`)) {
                    try {
                        await apiService.deleteProduct(product.id);
                        state.products = state.products.filter(p => p.id !== product.id);
                        app.renderProducts();
                        app.showToast('Product deleted successfully', 'success');
                    } catch (err) {
                        app.showToast('Failed to delete product', 'error');
                    }
                }
            });

            DOM.productsGrid.appendChild(card);
        });
    },

    renderExpenses() {
        if (!DOM.workerSettlementsList || !DOM.shopExpensesBody) return;

        // --- 1. Worker Settlements Block ---
        DOM.workerSettlementsList.innerHTML = '';
        if (state.workers.length === 0) {
            DOM.workerSettlementsList.innerHTML = '<div style="text-align:center; color: var(--text-muted); padding: 20px;">No workers found.</div>';
        } else {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            state.workers.forEach(worker => {
                // Find the most recent settlement for this worker
                const previousSettlement = state.transactions
                    .filter(t => t.workerId === worker.id && t.desc.startsWith('Monthly Salary Settlement'))
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

                const cutoffTime = previousSettlement ? new Date(previousSettlement.timestamp).getTime() : 0;

                // Calculate total expenses assigned to this worker occurring AFTER the last settlement
                const workerExpenses = state.transactions
                    .filter(t => {
                        const tTime = new Date(t.timestamp).getTime();
                        return t.workerId === worker.id &&
                            t.type === 'expense' &&
                            !t.desc.startsWith('Monthly Salary Settlement') &&
                            tTime > cutoffTime;
                    })
                    .reduce((sum, t) => sum + t.amount, 0);

                const cardDate = worker.selectedDate !== undefined ? worker.selectedDate : ''; // Just for UI consistency if needed

                const wCard = document.createElement('div');
                wCard.className = 'worker-card';
                wCard.style.cursor = 'default';
                wCard.innerHTML = `
                    <div style="display: flex; gap: 16px; align-items: stretch; justify-content: space-between;">
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <div class="avatar" style="width: 45px; height: 45px; font-size: 1.2rem;">${worker.photo ? `<img src="${worker.photo}" style="width:100%; height:100%; object-fit:cover;">` : worker.initials}</div>
                            <div>
                                <h3 style="margin: 0; font-size: 1.1rem;">${worker.name}</h3>
                                <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--text-muted);">ID: #00${worker.id}</p>
                            </div>
                        </div>
                        <div style="text-align: right; background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-glass);">
                            <div style="font-size: 0.8rem; color: var(--text-red);">Total Expenses Logged</div>
                            <div style="font-weight: 700; font-size: 1.1rem;" id="we-total-${worker.id}">${formatCurrency(workerExpenses)}</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: end;">
                        <div class="form-group" style="margin: 0;">
                            <label style="font-size: 0.85rem;">Monthly Agreed Amount (₹)</label>
                            <input type="number" class="w-agreed-input" data-id="${worker.id}" data-expenses="${workerExpenses}" placeholder="e.g. 15000" style="padding: 8px; font-size: 1rem;">
                        </div>
                        <div style="text-align: right; padding-bottom: 8px;">
                            <span style="font-size: 0.8rem; color: var(--text-muted);">Final Payable:</span>
                            <span class="w-payable-amt" id="we-payable-${worker.id}" style="font-size: 1.2rem; font-weight: bold; color: var(--text-green); margin-left: 8px;">₹0</span>
                        </div>
                    </div>

                    <div style="margin-top: 16px; border-top: 1px solid var(--border-glass); padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <button class="btn btn-sm btn-outline btn-view-we" data-id="${worker.id}">View Expense Log</button>
                        <button class="btn btn-sm btn-success btn-settle-we" data-id="${worker.id}">Settle Payment</button>
                    </div>
                    
                    <!-- Hidden Expense Log Mini-Table -->
                    <div class="we-log-container" id="we-log-${worker.id}" style="display: none; margin-top: 12px; max-height: 150px; overflow-y: auto; background: rgba(0,0,0,0.1); border-radius: 6px; padding: 8px;">
                        <table class="table" style="font-size: 0.85rem;">
                            <tbody>
                                <!-- Populated dynamically when clicked -->
                            </tbody>
                        </table>
                    </div>
                `;

                // Real-time calculation logic
                const inputAgreed = wCard.querySelector('.w-agreed-input');
                const labelPayable = wCard.querySelector('.w-payable-amt');
                inputAgreed.addEventListener('input', (e) => {
                    const agreed = parseFloat(e.target.value) || 0;
                    const payable = Math.max(0, agreed - workerExpenses);
                    labelPayable.textContent = formatCurrency(payable);
                });

                // Toggle Expense Log
                const btnViewLog = wCard.querySelector('.btn-view-we');
                const logContainer = wCard.querySelector(`#we-log-${worker.id}`);
                const logTbody = logContainer.querySelector('tbody');

                btnViewLog.addEventListener('click', () => {
                    const isHidden = logContainer.style.display === 'none';
                    if (isHidden) {
                        const workerTxs = state.transactions
                            .filter(t => {
                                const tTime = new Date(t.timestamp).getTime();
                                return t.workerId === worker.id &&
                                    t.type === 'expense' &&
                                    !t.desc.startsWith('Monthly Salary Settlement') &&
                                    tTime > cutoffTime;
                            })
                            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                        if (workerTxs.length === 0) {
                            logTbody.innerHTML = '<tr><td style="text-align:center; color: var(--text-muted);">No expenses logged.</td></tr>';
                        } else {
                            logTbody.innerHTML = workerTxs.map(t => `
                                <tr>
                                    <td>${t.timestamp.toLocaleDateString()}</td>
                                    <td>${t.desc}</td>
                                    <td style="text-align: right; color: var(--text-red);">-₹${t.amount}</td>
                                </tr>
                            `).join('');
                        }
                        logContainer.style.display = 'block';
                        btnViewLog.textContent = 'Hide Expense Log';
                    } else {
                        logContainer.style.display = 'none';
                        btnViewLog.textContent = 'View Expense Log';
                    }
                });

                // Settle Button Logic
                const btnSettle = wCard.querySelector('.btn-settle-we');
                btnSettle.addEventListener('click', async () => {
                    const agreed = parseFloat(inputAgreed.value) || 0;
                    if (agreed <= 0) {
                        this.showToast('Please enter an agreed amount to settle.', 'error');
                        return;
                    }
                    const payable = Math.max(0, agreed - workerExpenses);

                    if (payable === 0 && agreed <= workerExpenses) {
                        this.showToast('Worker expenses exceed agreed amount. Nothing to settle.', 'error');
                        return;
                    }

                    // Open custom modal
                    DOM.smWorkerId.value = worker.id;
                    DOM.smPayableAmount.value = payable;
                    DOM.smAgreedAmount.value = agreed;
                    DOM.smWorkerName.textContent = worker.name;
                    DOM.smDisplayAgreed.textContent = formatCurrency(agreed);
                    DOM.smDisplayPayable.textContent = formatCurrency(payable);

                    // Set default date to today
                    const today = new Date();
                    // Offset to local timezone for correct YYYY-MM-DD string
                    const localOffset = today.getTimezoneOffset() * 60000;
                    const localISOTime = (new Date(today - localOffset)).toISOString().split('T')[0];
                    DOM.smDate.value = localISOTime;

                    DOM.settlementModal.classList.add('show');
                });

                DOM.workerSettlementsList.appendChild(wCard);
            });
        }

        // --- 2. General Shop Expenses Block ---
        const shopExpenses = state.transactions
            .filter(t => t.type === 'expense' && t.workerId === null && this.isDateInRange(new Date(t.timestamp)))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (shopExpenses.length === 0) {
            DOM.shopExpensesBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 24px;">No general shop expenses logged.</td></tr>';
        } else {
            DOM.shopExpensesBody.innerHTML = shopExpenses.map(t => {
                const dateObj = new Date(t.timestamp);
                const dateStr = dateObj.toLocaleDateString();
                const timeStr = formatTime(dateObj);
                return `
                    <tr>
                        <td>
                            <div style="font-weight: 500;">${dateStr}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${timeStr}</div>
                        </td>
                        <td>
                            <div style="font-weight: 500;">${t.desc}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);"><i class="fa-solid ${t.mode === 'cash' ? 'fa-money-bill-wave' : 'fa-mobile-screen'}"></i> ${t.mode.charAt(0).toUpperCase() + t.mode.slice(1)}</div>
                        </td>
                        <td style="text-align: right; font-weight: bold; color: var(--text-red);">
                            -₹${t.amount}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    },

    async handleProductSubmit() {
        if (!DOM.prodName || !DOM.prodPrice || !DOM.prodStock) return;

        const name = DOM.prodName.value.trim();
        const price = parseFloat(DOM.prodPrice.value);
        const stock = parseInt(DOM.prodStock.value);

        if (!name || isNaN(price) || isNaN(stock)) {
            this.showToast('Please provide valid product details.', 'error');
            return;
        }

        try {
            const newProduct = await apiService.addProduct({
                name: name,
                price: price,
                stock_quantity: stock
            });

            state.products.push(newProduct);
            DOM.productModal.classList.remove('show');
            this.renderProducts();
            this.showToast(`Added new product: ${name}`, 'success');
        } catch (e) {
            this.showToast('Failed to add product.', 'error');
        }
    },

    async handleProductSellSubmit() {
        if (!DOM.spmProductId || !DOM.spmQuantity || !DOM.spmTotal) return;

        const productId = parseInt(DOM.spmProductId.value);
        const quantity = parseInt(DOM.spmQuantity.value);
        const totalAmount = parseFloat(DOM.spmTotal.value);

        // Get selected payment method
        const paymentRadio = document.querySelector('input[name="spm-payment-method"]:checked');
        const paymentMethod = paymentRadio ? paymentRadio.value : 'cash';

        if (!productId || isNaN(quantity) || quantity <= 0 || isNaN(totalAmount)) {
            this.showToast('Please provide valid sale details.', 'error');
            return;
        }

        try {
            const saleResult = await apiService.sellProduct({
                productId: productId,
                quantity_sold: quantity,
                sale_price: totalAmount,
                payment_method: paymentMethod
            });

            state.productSales.push(saleResult);

            // Update local state by decrementing stock
            const product = state.products.find(p => p.id === productId);
            if (product) {
                product.stock_quantity -= quantity;
            }
            app.currentSellProduct = null;

            DOM.sellProductModal.classList.remove('show');
            this.renderProducts();
            this.showToast(`Successfully sold ${quantity}x item(s).`, 'success');

        } catch (e) {
            this.showToast(`Error: ${e.message}`, 'error');
        }
    },

    async handleProductRestockSubmit() {
        if (!DOM.rpmProductId || !DOM.rpmQuantity) return;

        const productId = parseInt(DOM.rpmProductId.value);
        const quantity = parseInt(DOM.rpmQuantity.value);

        if (!productId || isNaN(quantity) || quantity <= 0) {
            this.showToast('Please provide a valid restock quantity.', 'error');
            return;
        }

        try {
            const restockResult = await apiService.restockProduct({
                productId: productId,
                quantity_added: quantity
            });

            // Update local state by incrementing stock
            const product = state.products.find(p => p.id === productId);
            if (product) {
                product.stock_quantity += quantity;
            }

            DOM.restockProductModal.classList.remove('show');
            this.renderProducts();
            this.showToast(`Successfully added ${quantity} item(s) to stock.`, 'success');

        } catch (e) {
            this.showToast(`Error: ${e.message}`, 'error');
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
    },

    renderAppointments() {
        if (!DOM.appointmentsGrid) return;
        DOM.appointmentsGrid.innerHTML = '';

        // Sort explicitly by date so upcoming ones show appropriately
        const sorted = [...state.appointments].sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
        const searchTerm = DOM.appointmentSearch ? DOM.appointmentSearch.value.toLowerCase() : '';
        const filtered = sorted.filter(ap => {
            const matchesName = ap.client_name.toLowerCase().includes(searchTerm);
            const matchesPhone = ap.client_phone && ap.client_phone.includes(searchTerm);
            return matchesName || matchesPhone;
        });

        if (filtered.length === 0) {
            DOM.appointmentsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">No appointments found.</div>';
            return;
        }

        filtered.forEach(ap => {
            const isCompleted = ap.status === 'completed';
            const workerObj = ap.assigned_worker ? state.workers.find(w => w.id === ap.assigned_worker) : null;
            const workerName = workerObj ? workerObj.name : 'Unassigned';

            const card = document.createElement('div');
            card.className = 'worker-card';
            card.innerHTML = `
                <div class="worker-card-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <div class="avatar" style="background: ${isCompleted ? '#2ecc71' : 'var(--primary)'}; color: white;">
                            <i class="fa-solid ${isCompleted ? 'fa-check' : 'fa-calendar'}"></i>
                        </div>
                        <div class="info">
                            <h3 style="margin-bottom: 4px;">${ap.client_name}</h3>
                            <p style="font-size: 0.85rem;"><i class="fa-solid fa-phone" style="margin-right: 4px;"></i> ${ap.client_phone || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                <div style="padding: 16px; background: rgba(0,0,0,0.15); border-radius: 8px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--text-muted); font-size: 0.85rem;">Service</span>
                        <span style="font-weight: 500;">${ap.description}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--text-muted); font-size: 0.85rem;">Date</span>
                        <span style="font-weight: 500;">${new Date(ap.appointment_date).toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--text-muted); font-size: 0.85rem;">Worker</span>
                        <span style="font-weight: 500;">${workerName}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: var(--text-muted); font-size: 0.85rem;">Mode</span>
                        <span style="font-weight: 500; text-transform: capitalize;">${ap.payment_mode}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--border-glass);">
                        <span style="color: var(--text-muted); font-size: 0.85rem;">Amount</span>
                        <span style="font-weight: bold; color: var(--text-primary);">${formatCurrency(ap.amount)}</span>
                    </div>
                </div>
                ${!isCompleted ? `<button class="btn btn-success" style="width: 100%;" onclick="app.completeAppointment(${ap.id})"><i class="fa-solid fa-check"></i> Mark as Complete</button>` : `<div style="text-align: center; color: #2ecc71; font-weight: 600;"><i class="fa-solid fa-check-circle"></i> Completed</div>`}
            `;
            DOM.appointmentsGrid.appendChild(card);
        });
    },

    openAppointmentModal() {
        if (!DOM.appointmentModal) return;
        DOM.appointmentForm.reset();

        // Default date/time to now
        const now = new Date();
        const localOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now - localOffset)).toISOString().slice(0, 16);
        DOM.apDate.value = localISOTime;

        // Populate workers dropdown
        if (DOM.apWorker) {
            DOM.apWorker.innerHTML = '<option value="">-- Select Worker (Optional) --</option>';
            state.workers
                .filter(w => !w.is_blocked) // Exclude blocked workers
                .forEach(w => {
                    const opt = document.createElement('option');
                    opt.value = w.id;
                    opt.textContent = w.name;
                    DOM.apWorker.appendChild(opt);
                });
        }

        DOM.appointmentModal.classList.add('show');
    },

    async handleAppointmentSubmit() {
        try {
            const isoString = new Date(DOM.apDate.value).toISOString();
            const data = {
                client_name: DOM.apName.value,
                client_phone: DOM.apPhone.value,
                description: DOM.apDesc.value,
                appointment_date: isoString,
                amount: parseFloat(DOM.apAmount.value),
                payment_mode: document.querySelector('input[name="ap-payment-method"]:checked').value,
                status: 'pending'
            };

            if (DOM.apWorker.value) {
                data.assignedWorkerId = parseInt(DOM.apWorker.value);
            }

            const newAp = await apiService.addAppointment(data);
            state.appointments.push(newAp);

            this.renderAppointments();
            DOM.appointmentModal.classList.remove('show');
            this.showToast('Appointment added!', 'success');
        } catch (error) {
            console.error(error);
            this.showToast('Failed to add appointment', 'error');
        }
    },

    async completeAppointment(id) {
        if (!confirm('Mark this appointment as complete? Income will be added to the worker automatically.')) return;

        try {
            const updatedAp = await apiService.completeAppointment(id);
            const idx = state.appointments.findIndex(a => a.id === id);
            if (idx > -1) state.appointments[idx] = updatedAp;

            // If worker was assigned, reload transactions to reflect the new income
            if (updatedAp.assigned_worker) {
                state.transactions = await apiService.getTransactions();
                this.renderDashboard();
                this.renderWorkers();
            }

            this.renderAppointments();
            this.showToast('Appointment completed!', 'success');
        } catch (error) {
            console.error(error);
            this.showToast('Failed to complete appointment', 'error');
        }
    },

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('auth_token');
            window.location.href = 'login.html';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
