import sys
with open('app.js', 'r') as f:
    lines = f.readlines()

new_content = """    setupEventListeners() {
        // Navigation Navigation Navigation
        DOM.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                DOM.navLinks.forEach(l => l.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.switchView(e.currentTarget.dataset.target);
            });
        });

        // Modals
        DOM.closeModals.forEach(btn => {
            btn.addEventListener('click', () => {
                DOM.workerModal.classList.remove('show');
                DOM.transactionModal.classList.remove('show');
                DOM.editProfileModal.classList.remove('show');
            });
        });

        // Worker Modal Buttons
        if (DOM.btnAddIncome) DOM.btnAddIncome.addEventListener('click', () => this.openTransactionModal('income'));
        if (DOM.btnAddExpense) DOM.btnAddExpense.addEventListener('click', () => this.openTransactionModal('expense'));
        if (DOM.btnEditProfile) {
            DOM.btnEditProfile.addEventListener('click', () => this.openEditProfileModal());
        }

        // Form Submit (Transaction)
        if (DOM.transactionForm) {
            DOM.transactionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTransactionSubmit();
            });
        }

        // Form Submit (Profile Edit)
        if (DOM.editProfileForm) {
            DOM.editProfileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileSubmit();
            });
        }

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
            btnAddWorker.addEventListener('click', () => {
                const name = prompt("Enter worker name:");
                if (name) {
                    const id = state.workers.length + 1;
                    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    state.workers.push({ id, name, initials });
                    this.renderWorkers();
                    this.showToast(`Worker ${name} added!`, 'success');
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
            
            globalDateFilter.addEventListener('change', () => {
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
"""

lines = lines[:82] + [new_content + "\n"] + lines[178:]

with open('app.js', 'w') as f:
    f.writelines(lines)
