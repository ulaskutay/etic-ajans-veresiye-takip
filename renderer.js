// ipcRenderer'ı güvenli şekilde yükle
if (typeof window.ipcRenderer === 'undefined') {
    const { ipcRenderer } = require('electron');
    window.ipcRenderer = ipcRenderer;
}

// Electron API wrapper
if (typeof window.electronAPI === 'undefined') {
    window.electronAPI = {
    getCustomers: () => window.ipcRenderer.invoke('get-customers'),
    getCustomer: (id) => window.ipcRenderer.invoke('get-customer', id),
    addCustomer: (customer) => window.ipcRenderer.invoke('add-customer', customer),
    updateCustomer: (id, customer) => window.ipcRenderer.invoke('update-customer', id, customer),
    deleteCustomer: (id) => window.ipcRenderer.invoke('delete-customer', id),
    getProducts: () => window.ipcRenderer.invoke('get-products'),
    addProduct: (product) => window.ipcRenderer.invoke('add-product', product),
    updateProduct: (id, product) => window.ipcRenderer.invoke('update-product', id, product),
    deleteProduct: (id) => window.ipcRenderer.invoke('delete-product', id),
    getTransactions: (customerId) => window.ipcRenderer.invoke('get-transactions', customerId),
    getAllTransactions: () => window.ipcRenderer.invoke('get-all-transactions'),
    addTransaction: (transaction) => window.ipcRenderer.invoke('add-transaction', transaction),
    getAlerts: () => window.ipcRenderer.invoke('get-alerts'),
    addAlert: (alert) => window.ipcRenderer.invoke('add-alert', alert),
    updateAlert: (id, alert) => window.ipcRenderer.invoke('update-alert', id, alert),
    deleteAlert: (id) => window.ipcRenderer.invoke('delete-alert', id),
    getAlertTriggers: () => window.ipcRenderer.invoke('get-alert-triggers'),
    resolveAlertTrigger: (id) => window.ipcRenderer.invoke('resolve-alert-trigger', id),
    checkAlerts: () => window.ipcRenderer.invoke('check-alerts'),
    // Version Control APIs
    getConfig: () => window.ipcRenderer.invoke('get-config'),
    listBackups: () => window.ipcRenderer.invoke('list-backups'),
    createBackup: (description) => window.ipcRenderer.invoke('create-backup', description),
    getLogs: () => window.ipcRenderer.invoke('get-logs'),
    performRollback: (targetVersion) => window.ipcRenderer.invoke('perform-rollback', targetVersion),
    testMigration: () => window.ipcRenderer.invoke('test-migration'),
        restoreBackup: (backupName) => window.ipcRenderer.invoke('restore-backup', backupName),
        deleteBackup: (backupName) => window.ipcRenderer.invoke('delete-backup', backupName),
        // Version Update API
        checkForUpdates: () => window.ipcRenderer.invoke('check-for-updates'),
        downloadUpdate: (downloadUrl) => window.ipcRenderer.invoke('download-update', downloadUrl),
        installUpdate: () => window.ipcRenderer.invoke('install-update'),
        getUpdateLogs: () => window.ipcRenderer.invoke('get-update-logs'),
        updateAppVersion: (version) => window.ipcRenderer.invoke('update-app-version', version),
        // Kullanıcı Yönetimi APIs
        registerUser: (userData) => window.ipcRenderer.invoke('register-user', userData),
        loginUser: (credentials) => window.ipcRenderer.invoke('login-user', credentials),
        validateSession: (sessionToken) => window.ipcRenderer.invoke('validate-session', sessionToken),
        logoutUser: (sessionToken) => window.ipcRenderer.invoke('logout-user', sessionToken),
        getCurrentUser: (sessionToken) => window.ipcRenderer.invoke('get-current-user', sessionToken),
        // İlk kurulum APIs
        checkFirstTimeSetup: () => window.ipcRenderer.invoke('check-first-time-setup'),
        registerFirstUser: (userData) => window.ipcRenderer.invoke('register-first-user', userData)
    };
}

// Global değişkenler - güvenli tanımlama
if (typeof window.customers === 'undefined') {
    window.customers = [];
}
if (typeof window.currentCustomer === 'undefined') {
    window.currentCustomer = null;
}
if (typeof window.sales === 'undefined') {
    window.sales = [];
}
if (typeof window.purchases === 'undefined') {
    window.purchases = [];
}
if (typeof window.products === 'undefined') {
    window.products = [];
}
if (typeof window.categories === 'undefined') {
    window.categories = [];
}
if (typeof window.brands === 'undefined') {
    window.brands = [];
}
if (typeof window.selectedCustomerId === 'undefined') {
    window.selectedCustomerId = null;
}
if (typeof window.currentUser === 'undefined') {
    window.currentUser = null;
}
if (typeof window.sessionToken === 'undefined') {
    window.sessionToken = null;
}
if (typeof window.isLoggedIn === 'undefined') {
    window.isLoggedIn = false;
}

// Local referanslar
let customers = window.customers;
let currentCustomer = window.currentCustomer;
let sales = window.sales;
let purchases = window.purchases;
// products, categories, brands artık product-module.js'de tanımlı
let selectedCustomerId = window.selectedCustomerId;

// Kullanıcı rolüne göre UI elementlerini güncelle
function updateUIForUserRole() {
    console.log('updateUIForUserRole çağrıldı, currentUser:', window.currentUser);
    
    // Müşteri silme butonlarını kontrol et
    const deleteCustomerBtn = document.getElementById('delete-customer-btn');
    const deleteCustomerDetailBtn = document.getElementById('delete-customer-detail-btn');
    
    if (deleteCustomerBtn) {
        const isAdmin = window.currentUser && window.currentUser.role === 'admin';
        deleteCustomerBtn.style.display = isAdmin ? 'block' : 'none';
        console.log('delete-customer-btn görünürlüğü:', isAdmin ? 'görünür' : 'gizli');
    }
    
    if (deleteCustomerDetailBtn) {
        const isAdmin = window.currentUser && window.currentUser.role === 'admin';
        deleteCustomerDetailBtn.style.display = isAdmin ? 'block' : 'none';
        console.log('delete-customer-detail-btn görünürlüğü:', isAdmin ? 'görünür' : 'gizli');
    }
    
    // Sistem ayarları sekmesini kontrol et
    const systemTabBtn = document.getElementById('system-tab-btn');
    if (systemTabBtn) {
        const isAdmin = window.currentUser && window.currentUser.role === 'admin';
        systemTabBtn.style.display = isAdmin ? 'block' : 'none';
        console.log('system-tab-btn görünürlüğü:', isAdmin ? 'görünür' : 'gizli');
    }
}

// Sayfa yüklendiğinde UI'ı güncelle
document.addEventListener('DOMContentLoaded', async () => {
    loadCustomers();
    await loadCompanySettings();
    setupEventListeners();
    setDefaultDates();
    
    // Uyarı sistemi başlat
    initializeAlertSystem();
    
    // UI'ı kullanıcı rolüne göre güncelle
    updateUIForUserRole();
    
    // IPC listener for global shortcuts
    
    window.ipcRenderer.on('shortcut-pressed', (event, shortcut) => {
        switch (shortcut) {
        case 'new-customer':
                focusCustomerSearch();
            break;
            case 'add-sale':
                if (currentCustomer) {
                    addSale();
                } else {
                    showMessage('Önce müşteri seçin (F1)', 'warning');
                }
                break;
            case 'add-payment':
                if (currentCustomer) {
                    addPurchase();
                } else {
                    showMessage('Önce müşteri seçin (F1)', 'warning');
                }
            break;
        case 'quick-debt':
                if (currentCustomer) {
                    quickSale();
                } else {
                    showMessage('Önce müşteri seçin (F1)', 'warning');
                }
            break;
            case 'quick-payment':
                if (currentCustomer) {
                    quickPurchase();
                } else {
                    showMessage('Önce müşteri seçin (F1)', 'warning');
                }
            break;
    }
    });
    
    // Tab switching function
    window.switchTab = function(tabId) {
        // Hide all tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab panel
        document.getElementById(tabId).classList.add('active');
        
        // Add active class to clicked tab button
        event.target.classList.add('active');
    };

});

// Event listener management system
let eventListeners = {
    formListeners: [],
    keyboardListeners: [],
    inputListeners: [],
    modalListeners: [],
    customerSearchListeners: []
};

// Event listeners
function setupEventListeners() {
    // Önce mevcut event listener'ları temizle
    cleanupEventListeners();
    
    // Customer search setup
    setupCustomerSearch('sale-customer', 'sale-customer-dropdown');
    setupCustomerSearch('purchase-customer', 'purchase-customer-dropdown');

    // Form event listeners
    const formElements = [
        { id: 'add-customer-form', handler: handleAddCustomer },
        { id: 'edit-customer-form', handler: handleEditCustomer },
        { id: 'add-sale-form', handler: handleAddSale },
        { id: 'add-purchase-form', handler: handleAddPurchase },
        // { id: 'add-product-form', handler: handleAddProduct }, // Artık product-module.js'de yönetiliyor - KALDIRILDI
        // { id: 'quick-add-product-form', handler: handleQuickAddProduct }, // Modal kaldırıldı
        { id: 'edit-sale-form', handler: handleEditSale },
        { id: 'edit-purchase-form', handler: handleEditPurchase }
    ];

    formElements.forEach(({ id, handler }) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('submit', handler);
            eventListeners.formListeners.push({ element, event: 'submit', handler });
        }
    });
    
    // Date change listeners
    const dateElements = [
        { id: 'start-date', handler: filterTransactions },
        { id: 'end-date', handler: filterTransactions }
    ];

    dateElements.forEach(({ id, handler }) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', handler);
            eventListeners.inputListeners.push({ element, event: 'change', handler });
        }
    });
    
    // Product selection change - auto-fill price
    const productElements = [
        { id: 'sale-product', handler: handleProductSelection },
        { id: 'edit-sale-product', handler: handleEditProductSelection }
    ];

    productElements.forEach(({ id, handler }) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', handler);
            eventListeners.inputListeners.push({ element, event: 'change', handler });
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    eventListeners.keyboardListeners.push({ element: document, event: 'keydown', handler: handleKeyboardShortcuts });
    
    document.addEventListener('keydown', handleEscapeKey);
    eventListeners.keyboardListeners.push({ element: document, event: 'keydown', handler: handleEscapeKey });
    
    // Modal click listeners
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
    eventListeners.modalListeners.push({ 
        element: document, 
        event: 'click', 
        handler: (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        }
    });
    
    // Keyboard shortcuts initialized
    console.log('✅ Event listeners setup complete');
}

// Event listener cleanup function
function cleanupEventListeners() {
    console.log('🧹 Cleaning up event listeners...');
    
    // Form listeners cleanup
    eventListeners.formListeners.forEach(({ element, event, handler }) => {
        if (element) {
            element.removeEventListener(event, handler);
        }
    });
    eventListeners.formListeners = [];
    
    // Keyboard listeners cleanup
    eventListeners.keyboardListeners.forEach(({ element, event, handler }) => {
        if (element) {
            element.removeEventListener(event, handler);
        }
    });
    eventListeners.keyboardListeners = [];
    
    // Input listeners cleanup
    eventListeners.inputListeners.forEach(({ element, event, handler }) => {
        if (element) {
            element.removeEventListener(event, handler);
        }
    });
    eventListeners.inputListeners = [];
    
    // Modal listeners cleanup
    eventListeners.modalListeners.forEach(({ element, event, handler }) => {
        if (element) {
            element.removeEventListener(event, handler);
        }
    });
    eventListeners.modalListeners = [];
    
    // Customer search listeners cleanup
    eventListeners.customerSearchListeners.forEach(({ element, event, handler }) => {
        if (element) {
            element.removeEventListener(event, handler);
        }
    });
    eventListeners.customerSearchListeners = [];
    
    console.log('✅ Event listeners cleaned up');
}

// Reinitialize event listeners
function reinitializeEventListeners() {
    console.log('🔄 Reinitializing event listeners...');
    setupEventListeners();
    console.log('✅ Event listeners reinitialized');
}

// Global functions for external access
window.cleanupEventListeners = cleanupEventListeners;
window.reinitializeEventListeners = reinitializeEventListeners;
window.setupEventListeners = setupEventListeners;

// Test function for event listener management
window.testEventListeners = function() {
    console.log('🧪 Testing event listener management...');
    console.log('Current listeners:', eventListeners);
    
    // Test cleanup
    console.log('🧹 Testing cleanup...');
    cleanupEventListeners();
    console.log('Listeners after cleanup:', eventListeners);
    
    // Test reinitialize
    console.log('🔄 Testing reinitialize...');
    reinitializeEventListeners();
    console.log('Listeners after reinitialize:', eventListeners);
    
    console.log('✅ Event listener test completed');
};

// Example usage: Refresh page with clean event listeners
window.refreshPageWithCleanListeners = async function() {
    console.log('🔄 Refreshing page with clean event listeners...');
    
    // Clean up all event listeners
    cleanupEventListeners();
    
    // Reload customers
    await loadCustomers();
    
    // Reinitialize event listeners
    reinitializeEventListeners();
    
    console.log('✅ Page refreshed with clean event listeners');
};

// Test modal functionality
window.testModalFunctionality = function() {
    console.log('🧪 Testing modal functionality...');
    
    // Test static modals
    console.log('Testing static modals...');
    showAddCustomerModal();
    setTimeout(() => {
        closeModal('add-customer-modal');
        console.log('✅ Static modal test completed');
    }, 1000);
    
    // Test dynamic modals
    setTimeout(() => {
        console.log('Testing dynamic modals...');
        showReportsModal();
        setTimeout(() => {
            closeModal('reports-modal');
            console.log('✅ Dynamic modal test completed');
        }, 1000);
    }, 2000);
    
    console.log('✅ Modal functionality test completed');
};

// Set default dates
function setDefaultDates() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Elementlerin varlığını kontrol et
    const startDateElement = document.getElementById('start-date');
    const endDateElement = document.getElementById('end-date');
    
    if (startDateElement) {
        startDateElement.value = formatDateForInput(thirtyDaysAgo);
    }
    
    if (endDateElement) {
        endDateElement.value = formatDateForInput(today);
    }
    
    // Set "Son 30 Gün" button as active by default
    setTimeout(() => {
        const last30DaysBtn = document.querySelector('[onclick="setQuickFilter(\'last30days\')"]');
        if (last30DaysBtn) {
            last30DaysBtn.classList.add('active');
        }
    }, 100);
}

// Format date for input
function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

// Load customers
async function loadCustomers(clearSelection = false) {
    try {
        console.log('🔄 IPC ile müşteri verileri alınıyor...');
        customers = await window.electronAPI.getCustomers();
        console.log('✅ Müşteri verileri alındı:', customers.length, 'adet');
        
        // DOM elementleri hazır olduğunda göster
        const customerTableBody = document.getElementById('customer-table-body');
        console.log('🔍 customer-table-body elementi:', customerTableBody ? 'bulundu' : 'bulunamadı');
        
        if (customerTableBody) {
            console.log('🔄 Müşteriler tabloya yazılıyor...');
            displayCustomers();
            console.log('✅ Müşteriler tabloya yazıldı');
        } else {
            console.warn('⚠️ customer-table-body elementi bulunamadı');
        }
        
        // Hesap özeti alanları mevcutsa güncelle
        const totalSalesElement = document.getElementById('total-sales');
        console.log('🔍 total-sales elementi:', totalSalesElement ? 'bulundu' : 'bulunamadı');
        
        if (totalSalesElement) {
            console.log('🔄 Hesap özeti güncelleniyor...');
            updateAccountSummary();
            console.log('✅ Hesap özeti güncellendi');
        } else {
            console.warn('⚠️ total-sales elementi bulunamadı');
        }
        
        // Only clear selection if explicitly requested
        if (clearSelection) {
            currentCustomer = null;
            clearCustomerDetails();
        }
        
        console.log('✅ loadCustomers fonksiyonu başarıyla tamamlandı');
    } catch (error) {
        console.error('❌ Müşteriler yüklenirken hata:', error);
        console.error('❌ Hata detayları:', error.message);
        console.error('❌ Hata stack:', error.stack);
        showMessage('Müşteriler yüklenirken hata oluştu: ' + error.message, 'error');
    }
}

// Display customers in table
function displayCustomers() {
    const tbody = document.getElementById('customer-table-body');
    
    // Element bulunamazsa hata verme
    if (!tbody) {
        console.log('customer-table-body element not found, skipping display');
        return;
    }
    
    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="no-data">Henüz müşteri bulunmuyor</td></tr>';
        return;
    }
    
    tbody.innerHTML = customers.map(customer => `
        <tr onclick="selectCustomer(${customer.id})" data-customer-id="${customer.id}">
            <td>${customer.name}</td>
            <td>${customer.code || customer.id}</td>
        </tr>
    `).join('');
}

// Select customer
async function selectCustomer(customerId) {
    try {
        // Update table selection
        document.querySelectorAll('.customer-table tr').forEach(row => {
            row.classList.remove('selected');
        });
        document.querySelector(`tr[data-customer-id="${customerId}"]`).classList.add('selected');
        
        // Load customer details
        currentCustomer = await window.electronAPI.getCustomer(customerId);
        displayCustomerDetails();
        
        // Load transactions
        await loadTransactions(customerId);
        
    } catch (error) {
        console.error('Müşteri seçilirken hata:', error);
        showMessage('Müşteri seçilirken hata oluştu', 'error');
    }
}

// Müşteri satışlarını yeniden yükle
async function loadCustomerSales() {
    if (!currentCustomer) return;
    
    try {
        await loadTransactions(currentCustomer.id);
        displayAllTransactions();
    } catch (error) {
        console.error('Müşteri satışları yüklenirken hata:', error);
    }
}

// Display customer details
function displayCustomerDetails() {
    if (!currentCustomer) return;
    
    document.getElementById('selected-customer-name').textContent = currentCustomer.name;
    document.getElementById('customer-phone').textContent = currentCustomer.phone || '-';
    document.getElementById('customer-gsm').textContent = currentCustomer.gsm || '-';
    document.getElementById('customer-limit').textContent = formatMoney(currentCustomer.credit_limit || 500);
    
    // Müşteri tipi ve vergi bilgileri
    const customerTypeText = currentCustomer.customer_type === 'company' ? 'Kurumsal' : 'Bireysel';
    const taxInfo = currentCustomer.tax_number ? `Vergi No: ${currentCustomer.tax_number}` : 
                    currentCustomer.tc_number ? `TC: ${currentCustomer.tc_number}` : '';
    const statusText = `${customerTypeText}${taxInfo ? ' - ' + taxInfo : ''}`;
    
    document.getElementById('customer-status').textContent = statusText;
    document.getElementById('customer-debt').textContent = formatMoney(currentCustomer.balance > 0 ? currentCustomer.balance : 0);
    
    // Tahsilat toplamı loadTransactions'da hesaplanacak
    // Buradan sadece placeholder koyuyoruz
    document.getElementById('customer-credit').textContent = '0,00';
    
    // Bakiye loadTransactions'da hesaplanacak
    document.getElementById('customer-balance').textContent = '0,00';
    document.getElementById('last-sale-date').textContent = '-';
    document.getElementById('last-payment-date').textContent = '-';
}

// Clear customer details
function clearCustomerDetails() {
    document.getElementById('selected-customer-name').textContent = 'Müşteri Seçin';
    document.getElementById('customer-phone').textContent = '-';
    document.getElementById('customer-gsm').textContent = '-';
    document.getElementById('customer-limit').textContent = '0,00';
    document.getElementById('customer-status').textContent = '-';
    document.getElementById('customer-debt').textContent = '0,00';
    document.getElementById('customer-credit').textContent = '0,00';
    document.getElementById('customer-balance').textContent = '0,00';
    document.getElementById('last-sale-date').textContent = '-';
    document.getElementById('last-payment-date').textContent = '-';
    
    // Clear transaction tables
    document.getElementById('sales-table-body').innerHTML = '<tr><td colspan="8" class="no-data">&lt;Gösterilecek Bilgi Yok&gt;</td></tr>';
}

// Load transactions
async function loadTransactions(customerId, preserveSelection = false) {
    try {
        console.log('Loading transactions for customer:', customerId, 'preserveSelection:', preserveSelection);
        
        const transactions = await window.electronAPI.getTransactions(customerId);
        console.log('Loaded transactions:', transactions.length);
        
        // Separate sales and purchases
        sales = transactions.filter(t => t.type === 'debt');
        purchases = transactions.filter(t => t.type === 'payment');
        
        console.log('Sales:', sales.length, 'Purchases:', purchases.length);
        
        // Tek tabloda birleştirilmiş işlemleri göster
        displayAllTransactions(preserveSelection);
        
        // Calculate totals
        const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || s.amount || 0), 0);
        const totalPayments = purchases.reduce((sum, p) => sum + (p.total_amount || p.amount || 0), 0);
        const balance = totalSales - totalPayments;
        
        // Update customer details
        document.getElementById('customer-debt').textContent = formatMoney(totalSales);
        document.getElementById('customer-credit').textContent = formatMoney(totalPayments);
        document.getElementById('customer-balance').textContent = formatMoney(balance);
        
        // Update last transaction dates
        if (sales.length > 0) {
            const lastSale = sales[sales.length - 1];
            document.getElementById('last-sale-date').textContent = formatDate(lastSale.created_at);
        }
        
        if (purchases.length > 0) {
            const lastPurchase = purchases[purchases.length - 1];
            document.getElementById('last-payment-date').textContent = formatDate(lastPurchase.created_at);
        }
        
        console.log('Transactions loaded successfully');
        
    } catch (error) {
        console.error('İşlemler yüklenirken hata:', error);
        showMessage('İşlemler yüklenirken hata oluştu', 'error');
    }
}

// Display all transactions in a single table
function displayAllTransactions(preserveSelection = false) {
    const salesTbody = document.getElementById('sales-table-body');
    
    // Hide filter totals when showing all transactions
    hideFilterTotals();
    
    // Mevcut seçili satırı kaydet
    let selectedTransactionId = null;
    let selectedTransactionType = null;
    
    if (preserveSelection) {
        const selectedRow = salesTbody.querySelector('tr.selected');
        if (selectedRow) {
            selectedTransactionId = selectedRow.getAttribute('data-transaction-id');
            selectedTransactionType = selectedRow.getAttribute('data-transaction-type');
            console.log('Preserving selection:', selectedTransactionId, selectedTransactionType);
        }
    }
    
    // Tüm işlemleri birleştir ve tarihe göre ters sırala (en son işlem en başta)
    const allTransactions = [
        ...sales.map(s => ({ ...s, transactionType: 'sale' })),
        ...purchases.map(p => ({ ...p, transactionType: 'purchase' }))
    ].sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        
        // Önce tarihe göre sırala (en yeni en başta)
        if (dateA.getTime() !== dateB.getTime()) {
            return dateB - dateA;
        }
        
        // Aynı tarihteki işlemler için ID'ye göre sırala (en yeni en başta)
        return b.id - a.id;
    });
    
    if (allTransactions.length === 0) {
        salesTbody.innerHTML = '<tr><td colspan="8" class="no-data">&lt;Gösterilecek Bilgi Yok&gt;</td></tr>';
        return;
    }
    
    // Tek tabloda tüm işlemleri göster
    salesTbody.innerHTML = allTransactions.map((transaction, index) => {
        const date = new Date(transaction.created_at);
        const isSale = transaction.transactionType === 'sale';
        const amount = transaction.total_amount || transaction.amount || 0;
        
        // Bakiye hesaplama için işlemleri tarihe göre doğru sırala
        const sortedForBalance = [
            ...sales.map(s => ({ ...s, transactionType: 'sale' })),
            ...purchases.map(p => ({ ...p, transactionType: 'payment' }))
        ].sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            
            // Önce tarihe göre sırala (en eski en başta)
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }
            
            // Aynı tarihteki işlemler için ID'ye göre sırala (en eski en başta)
            return a.id - b.id;
        });
        
        // Bu işlemin tarihine kadar olan tüm işlemleri bul ve bakiye hesapla
        let cumulativeBalance = 0;
        const transactionDate = new Date(transaction.created_at);
        
        for (const prevTransaction of sortedForBalance) {
            const prevDate = new Date(prevTransaction.created_at);
            
            // Bu işleme kadar olan tüm işlemleri dahil et (aynı tarih dahil)
            if (prevDate <= transactionDate) {
                const prevAmount = prevTransaction.total_amount || prevTransaction.amount || 0;
                
                if (prevTransaction.transactionType === 'sale') {
                    cumulativeBalance += prevAmount; // Satış = borç artırır
                } else if (prevTransaction.transactionType === 'payment') {
                    cumulativeBalance -= prevAmount; // Tahsilat = borç azaltır
                }
            }
        }
        
        return `
            <tr data-transaction-id="${transaction.id}" data-transaction-type="${transaction.transactionType}" onclick="selectTransactionRow(this, '${transaction.transactionType}')">
                <td>${date.getDate()}</td>
                <td>${date.getMonth() + 1}</td>
                <td>${date.getFullYear()}</td>
                <td>
                    <span style="color: ${isSale ? '#e53e3e' : '#38a169'}; font-weight: 600;">
                        ${isSale ? '💰 Satış' : '💳 Tahsilat'}
                    </span>
                </td>
                <td>${transaction.description || transaction.product_name || '-'}</td>
                <td>${transaction.quantity || 1}</td>
                <td class="${isSale ? 'negative' : 'positive'}">
                    ${isSale ? '+' : '-'}${formatMoney(amount)}
                </td>
                <td class="${cumulativeBalance > 0 ? 'negative' : cumulativeBalance < 0 ? 'positive' : 'neutral'}">
                    ${formatMoney(cumulativeBalance)}
                </td>
            </tr>
        `;
    }).join('');
    
    // Seçili satırı geri yükle
    if (preserveSelection && selectedTransactionId) {
        const rowToSelect = salesTbody.querySelector(`tr[data-transaction-id="${selectedTransactionId}"]`);
        if (rowToSelect) {
            rowToSelect.classList.add('selected');
            console.log('Selection restored:', selectedTransactionId);
        } else {
            console.warn('Could not restore selection for transaction:', selectedTransactionId);
        }
    }
}

// Display filtered transactions in the single table
function displayFilteredAllTransactions(filteredSales, filteredPurchases) {
    const salesTbody = document.getElementById('sales-table-body');
    
    // Tüm filtrelenmiş işlemleri birleştir ve tarihe göre ters sırala (en son işlem en başta)
    const allTransactions = [
        ...filteredSales.map(s => ({ ...s, transactionType: 'sale' })),
        ...filteredPurchases.map(p => ({ ...p, transactionType: 'purchase' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    if (allTransactions.length === 0) {
        salesTbody.innerHTML = '<tr><td colspan="8" class="no-data">&lt;Gösterilecek Bilgi Yok&gt;</td></tr>';
        return;
    }
    
    // Tek tabloda tüm filtrelenmiş işlemleri göster
    salesTbody.innerHTML = allTransactions.map((transaction, index) => {
        const date = new Date(transaction.created_at);
        const isSale = transaction.transactionType === 'sale';
        const amount = transaction.total_amount || transaction.amount || 0;
        
        // Bakiye hesaplama için işlemleri tarihe göre doğru sırala
        const sortedForBalance = [
            ...filteredSales.map(s => ({ ...s, transactionType: 'sale' })),
            ...filteredPurchases.map(p => ({ ...p, transactionType: 'purchase' }))
        ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        // Bu işlemin tarihine kadar olan tüm işlemleri bul ve bakiye hesapla
        const transactionDate = new Date(transaction.created_at);
        let cumulativeBalance = 0;
        
        for (const prevTransaction of sortedForBalance) {
            const prevDate = new Date(prevTransaction.created_at);
            if (prevDate <= transactionDate) {
                const prevAmount = prevTransaction.total_amount || prevTransaction.amount || 0;
                
                if (prevTransaction.transactionType === 'sale') {
                    cumulativeBalance += prevAmount; // Satış = borç artırır
                } else if (prevTransaction.transactionType === 'payment') {
                    cumulativeBalance -= prevAmount; // Tahsilat = borç azaltır
                }
            }
        }
        
        return `
            <tr data-transaction-id="${transaction.id}" data-transaction-type="${transaction.transactionType}" onclick="selectTransactionRow(this, '${transaction.transactionType}')">
                <td>${date.getDate()}</td>
                <td>${date.getMonth() + 1}</td>
                <td>${date.getFullYear()}</td>
                <td>
                    <span style="color: ${isSale ? '#e53e3e' : '#38a169'}; font-weight: 600;">
                        ${isSale ? '💰 Satış' : '💳 Tahsilat'}
                    </span>
                </td>
                <td>${transaction.description || transaction.product_name || '-'}</td>
                <td>${transaction.quantity || 1}</td>
                <td class="${isSale ? 'negative' : 'positive'}">
                    ${isSale ? '+' : '-'}${formatMoney(amount)}
                </td>
                <td class="${cumulativeBalance > 0 ? 'negative' : cumulativeBalance < 0 ? 'positive' : 'neutral'}">
                    ${formatMoney(cumulativeBalance)}
                </td>
            </tr>
        `;
    }).join('');
}

// Display purchases
function displayPurchases() {
    const tbody = document.getElementById('purchases-table-body');
    
    if (purchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">&lt;Gösterilecek Bilgi Yok&gt;</td></tr>';
        return;
    }
    
    tbody.innerHTML = purchases.map(purchase => {
        const date = new Date(purchase.created_at);
        return `
            <tr data-transaction-id="${purchase.id}" data-transaction-type="purchase" onclick="selectTransactionRow(this, 'purchases')">
                <td>${date.getDate()}</td>
                <td>${date.getMonth() + 1}</td>
                <td>${date.getFullYear()}</td>
                <td>${purchase.description || purchase.product_name || '-'}</td>
                <td>${purchase.quantity || 1}</td>
                <td>${formatMoney(purchase.total_amount || purchase.amount)}</td>
            </tr>
        `;
    }).join('');
}

// Update account summary
async function updateAccountSummary() {
    try {
        // Önce müşterileri yükle (eğer yüklenmemişse)
        if (!customers || customers.length === 0) {
            await loadCustomers();
        }
        
        // Tüm transaction'ları al
        const allTransactions = await window.ipcRenderer.invoke('get-all-transactions');
        
        let totalSales = 0;
        let totalPayments = 0;
        let totalDebt = 0;
        
        console.log(`📊 Hesap özeti güncelleniyor: ${customers.length} müşteri, ${allTransactions.length} işlem`);
        
        // Her müşteri için hesaplama yap
        customers.forEach(customer => {
            const customerTransactions = allTransactions.filter(t => t.customer_id === customer.id);
            const customerSales = customerTransactions.filter(t => t.type === 'debt');
            const customerPayments = customerTransactions.filter(t => t.type === 'payment');
            
            const customerTotalSales = customerSales.reduce((sum, s) => sum + (s.total_amount || s.amount || 0), 0);
            const customerTotalPayments = customerPayments.reduce((sum, p) => sum + (p.total_amount || p.amount || 0), 0);
            const customerBalance = customerTotalSales - customerTotalPayments;
            
            totalSales += customerTotalSales;
            totalPayments += customerTotalPayments;
            
            // Sadece pozitif bakiyeleri toplam borç olarak say
            if (customerBalance > 0) {
                totalDebt += customerBalance;
            }
            
            console.log(`👤 ${customer.name}: Satış=${customerTotalSales}, Tahsilat=${customerTotalPayments}, Bakiye=${customerBalance}`);
        });
        
        const netBalance = totalSales - totalPayments;
        const paymentRate = totalSales > 0 ? ((totalPayments / totalSales) * 100).toFixed(1) : 0;
        
        console.log(`💰 Toplam: Satış=${totalSales}, Tahsilat=${totalPayments}, Borç=${totalDebt}, Net=${netBalance}`);
        
        // Güncellenmiş değerleri göster (elementler varsa)
        const totalSalesEl = document.getElementById('total-sales');
        const totalPaymentsEl = document.getElementById('total-payments');
        const totalDebtEl = document.getElementById('total-debt');
        const netBalanceEl = document.getElementById('net-balance');
        const paymentRateEl = document.getElementById('payment-rate');
        
        if (totalSalesEl) totalSalesEl.textContent = formatMoney(totalSales);
        if (totalPaymentsEl) totalPaymentsEl.textContent = formatMoney(totalPayments);
        if (totalDebtEl) totalDebtEl.textContent = formatMoney(totalDebt);
        if (netBalanceEl) netBalanceEl.textContent = formatMoney(netBalance);
        if (paymentRateEl) paymentRateEl.textContent = paymentRate + '%';
        
    } catch (error) {
        console.error('Hesap özeti güncellenirken hata:', error);
        // Hata durumunda eski değerleri göster (elementler varsa)
        const totalSalesEl = document.getElementById('total-sales');
        const totalPaymentsEl = document.getElementById('total-payments');
        const totalDebtEl = document.getElementById('total-debt');
        const netBalanceEl = document.getElementById('net-balance');
        const paymentRateEl = document.getElementById('payment-rate');
        
        if (totalSalesEl) totalSalesEl.textContent = '0,00';
        if (totalPaymentsEl) totalPaymentsEl.textContent = '0,00';
        if (totalDebtEl) totalDebtEl.textContent = '0,00';
        if (netBalanceEl) netBalanceEl.textContent = '0,00';
        if (paymentRateEl) paymentRateEl.textContent = '0%';
    }
}



// Helper function to calculate customer balance
function calculateCustomerBalance(transactions) {
    let balance = 0;
    transactions.forEach(transaction => {
        if (transaction.type === 'sale') {
            balance += transaction.total_amount || transaction.amount || 0;
        } else if (transaction.type === 'purchase') {
            balance -= transaction.total_amount || transaction.amount || 0;
        }
    });
    return balance;
}

// Edit Sale Transaction
async function editSale() {
    console.log('=== EDIT SALE FUNCTION CALLED ===');
    console.log('editSale function called');
    console.log('currentCustomer:', currentCustomer);
    console.log('sales array:', sales);
    
    if (!currentCustomer) {
        showMessage('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    
    console.log('Getting selected transaction...');
    const selectedSale = getSelectedTransaction('sale'); // Sadece sale işlemlerini al
    console.log('selectedSale result:', selectedSale);
    
    if (!selectedSale) {
        console.log('No selected sale found, showing warning');
        showMessage('Lütfen düzenlemek istediğiniz satış işlemini seçin', 'warning');
        return;
    }
    
    console.log('Selected sale found, populating modal...');
    
    try {
        // Populate edit sale modal with selected transaction data
        console.log('Setting edit-sale-id to:', selectedSale.id);
        document.getElementById('edit-sale-id').value = selectedSale.id;
        
        console.log('Setting customer name to:', currentCustomer.name);
        document.getElementById('edit-sale-customer').value = currentCustomer.name;
        document.getElementById('edit-sale-customer').readOnly = true;
        
        // Tarihi mevcut işlemin tarihiyle doldur (sıralama bozulmasın)
        const currentDate = selectedSale.created_at ? new Date(selectedSale.created_at) : new Date();
        const dateStr = new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        document.getElementById('edit-sale-date').value = dateStr;
        console.log('Edit date set to transaction date:', dateStr);
        // Orijinal timestamp'ı sakla
        let hidden = document.getElementById('edit-sale-original-created-at');
        if (!hidden) {
            hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.id = 'edit-sale-original-created-at';
            hidden.name = 'original_created_at';
            const form = document.getElementById('edit-sale-form');
            if (form) form.appendChild(hidden);
        }
        hidden.value = selectedSale.created_at || '';
        
        console.log('Setting amount to:', selectedSale.total_amount || selectedSale.amount);
        document.getElementById('edit-sale-amount').value = selectedSale.total_amount || selectedSale.amount;
        
        console.log('Setting description to:', selectedSale.description || '');
        document.getElementById('edit-sale-description').value = selectedSale.description || '';
        
        // Load products and select the current one if exists
        console.log('Loading products for select...');
        await loadProductsForSelect('edit-sale-product');
        
        if (selectedSale.product_id) {
            console.log('Setting product to:', selectedSale.product_id);
            document.getElementById('edit-sale-product').value = selectedSale.product_id;
            await handleEditProductSelection();
        }
        
        console.log('Showing modal...');
        showModal('edit-sale-modal');
        console.log('Modal should be visible now');
        
    } catch (error) {
        console.error('Error populating modal:', error);
        showMessage('Modal açılırken hata oluştu: ' + error.message, 'error');
    }
}

// Delete Sale Transaction
async function deleteSale() {
    console.log('=== DELETE SALE FUNCTION CALLED ===');
    
    if (!currentCustomer) {
        showMessage('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    
    // Seçili satırı kontrol et
    const selectedRow = document.querySelector('#sales-table-body tr.selected');
    if (!selectedRow) {
        showMessage('Lütfen silmek istediğiniz satış işlemini seçin', 'warning');
        return;
    }
    
    const transactionType = selectedRow.getAttribute('data-transaction-type');
    const transactionId = selectedRow.getAttribute('data-transaction-id');
    
    // Sadece satış işlemlerini işle
    if (transactionType !== 'sale') {
        showMessage('Bu bir satış işlemi değil', 'warning');
        return;
    }
    
    // Satış işlemini bul (önce sales array'inde, sonra allTransactions'da)
    let selectedSale = sales.find(s => s.id == transactionId);
    if (!selectedSale) {
        // Tüm işlemler kısmından seçildiyse, sales array'ini yeniden yükle
        selectedSale = sales.find(s => s.id == transactionId);
    }
    
    if (!selectedSale) {
        showMessage('Satış işlemi bulunamadı', 'error');
        return;
    }
    
    if (confirm(`"${selectedSale.description || 'Satış'}" işlemini silmek istediğinizden emin misiniz?`)) {
        // Doğrudan silme işlemini yap
        try {
            const result = await window.ipcRenderer.invoke('delete-transaction', selectedSale.id);
            
            if (result.success) {
                showMessage('Satış işlemi başarıyla silindi', 'success');
                
                // Store current customer ID before reloading
                const storedCustomerId = currentCustomer ? currentCustomer.id : null;
                
                // Reload customers to update balances (don't clear selection)
                await loadCustomers(false);
                
                // Re-select the customer to keep it active
                if (storedCustomerId) {
                    await selectCustomer(storedCustomerId);
                }
            } else {
                showMessage('Satış işlemi silinirken hata oluştu', 'error');
            }
        } catch (error) {
            console.error('Satış işlemi silinirken hata:', error);
            showMessage('Satış işlemi silinirken hata oluştu', 'error');
        }
    }
}

// Edit Purchase Transaction
async function editPurchase() {
    console.log('=== EDIT PURCHASE FUNCTION CALLED ===');
    console.log('editPurchase function called');
    console.log('currentCustomer:', currentCustomer);
    console.log('purchases array:', purchases);
    
    if (!currentCustomer) {
        showMessage('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    
    console.log('Getting selected purchase transaction...');
    const selectedPurchase = getSelectedTransaction('purchase'); // Sadece purchase işlemlerini al
    console.log('selectedPurchase result:', selectedPurchase);
    
    if (!selectedPurchase) {
        console.log('No selected purchase found, showing warning');
        showMessage('Lütfen düzenlemek istediğiniz tahsilat işlemini seçin', 'warning');
        return;
    }
    
    console.log('Selected purchase found, populating modal...');
    
    try {
        // Populate edit purchase modal with selected transaction data
        console.log('Setting edit-purchase-id to:', selectedPurchase.id);
        document.getElementById('edit-purchase-id').value = selectedPurchase.id;
        
        console.log('Setting customer name to:', currentCustomer.name);
        document.getElementById('edit-purchase-customer').value = currentCustomer.name;
        document.getElementById('edit-purchase-customer').readOnly = true;
        
        console.log('Setting date to:', selectedPurchase.date);
        const dateValue = selectedPurchase.date ? selectedPurchase.date.split('T')[0] : new Date().toISOString().split('T')[0];
        document.getElementById('edit-purchase-date').value = dateValue;
        
        console.log('Setting amount to:', selectedPurchase.total_amount || selectedPurchase.amount);
        document.getElementById('edit-purchase-amount').value = selectedPurchase.total_amount || selectedPurchase.amount;
        
        console.log('Setting description to:', selectedPurchase.description || '');
        document.getElementById('edit-purchase-description').value = selectedPurchase.description || '';
        
        console.log('Showing purchase modal...');
        showModal('edit-purchase-modal');
        console.log('Purchase modal should be visible now');
        
    } catch (error) {
        console.error('Error populating purchase modal:', error);
        showMessage('Modal açılırken hata oluştu: ' + error.message, 'error');
    }
}

// Delete Purchase Transaction
function deletePurchase() {
    console.log('=== DELETE PURCHASE FUNCTION CALLED ===');
    
    if (!currentCustomer) {
        showMessage('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    
    const selectedPurchase = getSelectedTransaction('purchase'); // Sadece purchase işlemlerini al
    if (!selectedPurchase) {
        showMessage('Lütfen silmek istediğiniz tahsilat işlemini seçin', 'warning');
        return;
    }
    
    if (confirm(`"${selectedPurchase.description || 'Tahsilat'}" işlemini silmek istediğinizden emin misiniz?`)) {
        deleteTransaction(selectedPurchase.id);
    }
}

// Get selected transaction from table
function getSelectedTransaction(transactionType = null) {
    console.log('getSelectedTransaction called with type:', transactionType);
    
    // Artık tek tablo var, sales-table-body kullanıyoruz
    const tableBody = document.getElementById('sales-table-body');
    console.log('tableBody:', tableBody);
    
    const selectedRow = tableBody.querySelector('tr.selected');
    console.log('selectedRow:', selectedRow);
    
    if (!selectedRow) {
        console.log('No selected row found');
        return null;
    }
    
    // Get transaction ID from data attribute
    const transactionId = selectedRow.getAttribute('data-transaction-id');
    console.log('transactionId:', transactionId);
    
    // Get transaction type from data attribute
    const rowTransactionType = selectedRow.getAttribute('data-transaction-type');
    console.log('rowTransactionType:', rowTransactionType);
    
    // If transactionType is specified, check if it matches
    if (transactionType && rowTransactionType !== transactionType) {
        console.log('Transaction type mismatch. Expected:', transactionType, 'Found:', rowTransactionType);
        return null;
    }
    
    // Find transaction in the appropriate array
    if (rowTransactionType === 'sale') {
        const foundTransaction = sales.find(t => t.id == transactionId);
        console.log('Found in sales array:', foundTransaction);
        return foundTransaction;
    } else if (rowTransactionType === 'purchase') {
        const foundTransaction = purchases.find(t => t.id == transactionId);
        console.log('Found in purchases array:', foundTransaction);
        return foundTransaction;
    }
    
    console.log('Unknown transaction type:', rowTransactionType);
    return null;
}

// Delete transaction (generic function)
async function deleteTransaction(transactionId) {
    try {
        const result = await window.ipcRenderer.invoke('delete-transaction', transactionId);
        
        if (result.success) {
            showMessage('İşlem başarıyla silindi', 'success');
            
            // Store current customer ID before reloading
            const storedCustomerId = currentCustomer ? currentCustomer.id : null;
            
            // Reload customers to update balances (don't clear selection)
            await loadCustomers(false);
            
            // Re-select the customer to keep it active
            if (storedCustomerId) {
                await selectCustomer(storedCustomerId);
            }
        } else {
            showMessage('İşlem silinirken hata oluştu', 'error');
        }
    } catch (error) {
        console.error('İşlem silinirken hata:', error);
        showMessage('İşlem silinirken hata oluştu', 'error');
    }
}

// Delete transaction by ID (alias for deleteTransaction to avoid confusion)
async function deleteTransactionById(transactionId) {
    return deleteTransaction(transactionId);
}

// Handle edit sale form submission
async function handleEditSale(e) {
    e.preventDefault();
    
    console.log('=== HANDLE EDIT SALE CALLED ===');
    
    const formData = new FormData(e.target);
    const transactionId = formData.get('id');
    const amount = parseFloat(formData.get('amount'));
    const description = formData.get('description') || 'Satış';
    const productId = formData.get('product_id') || null;
    const date = formData.get('date');
    
    console.log('Form data:', {
        id: transactionId,
        amount: amount,
        description: description,
        productId: productId,
        date: date
    });
    
    // Validation
    if (!transactionId) {
        showMessage('İşlem ID bulunamadı', 'error');
        return;
    }
    
    if (!amount || amount <= 0) {
        showMessage('Geçerli bir tutar girin', 'error');
        return;
    }
    
    if (!currentCustomer) {
        showMessage('Müşteri bilgisi bulunamadı', 'error');
        return;
    }
    
    // Date formatını düzenle
    const formattedDate = date ? new Date(date).toISOString() : new Date().toISOString();
    
    const transactionData = {
        id: parseInt(transactionId),
        customer_id: currentCustomer.id,
        type: 'debt',
        created_at: formattedDate,
        description: description,
        product_id: productId ? parseInt(productId) : null,
        quantity: 1,
        unit_price: amount,
        total_amount: amount
    };
    
    console.log('Sending transaction data:', transactionData);
    
    try {
        const result = await window.ipcRenderer.invoke('update-transaction', transactionData);
        console.log('Update result:', result);
        
        if (result.success) {
            showMessage('Satış başarıyla güncellendi', 'success');
            
            // Modal'ı kapat
            closeModal('edit-sale-modal');
            
            // Satışları yeniden yükle ve ekranı güncelle
            console.log('Update completed - reloading sales data');
            
            // Müşteri satışlarını yeniden yükle
            await loadCustomerSales();
            
            // Hesap özetini güncelle
            updateAccountSummary();
            
            // Tüm işlemler sekmesi aktifse onu da güncelle
            const allTransactionsTab = document.getElementById('all-transactions-tab');
            if (allTransactionsTab && allTransactionsTab.classList.contains('active')) {
                await loadAllTransactions();
            }
            
        } else {
            console.error('Update failed:', result);
            showMessage('Satış güncellenirken hata oluştu: ' + (result.error || 'Bilinmeyen hata'), 'error');
        }
    } catch (error) {
        console.error('Satış güncellenirken hata:', error);
        showMessage('Satış güncellenirken hata oluştu: ' + error.message, 'error');
    }
}

// Handle edit purchase form submission
async function handleEditPurchase(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const transactionData = {
        id: formData.get('id'),
        customer_id: currentCustomer.id,
        type: 'payment', // purchases array contains transactions with type === 'payment'
        created_at: formData.get('date'),
        description: formData.get('description') || 'Tahsilat',
        quantity: 1,
        unit_price: parseFloat(formData.get('amount')),
        total_amount: parseFloat(formData.get('amount'))
    };
    
    try {
        const result = await window.ipcRenderer.invoke('update-transaction', transactionData);
        
        if (result.success) {
            showMessage('Tahsilat başarıyla güncellendi', 'success');
            closeModal('edit-purchase-modal');
            
            // Store current customer ID before reloading
            const storedCustomerId = currentCustomer ? currentCustomer.id : null;
            
            // Reload customers to update balances (don't clear selection)
            await loadCustomers(false);
            
            // Re-select the customer to keep it active
            if (storedCustomerId) {
                await selectCustomer(storedCustomerId);
            }
        } else {
            showMessage('Tahsilat güncellenirken hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Tahsilat güncellenirken hata:', error);
        showMessage('Tahsilat güncellenirken hata oluştu', 'error');
    }
}

// Load products for select dropdown
async function loadProductsForSelect(selectId) {
    try {
        const products = await window.ipcRenderer.invoke('get-products');
        const select = document.getElementById(selectId);
        
        // Clear existing options
        select.innerHTML = '<option value="">Ürün Seçin</option>';
        
        // Add product options
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - ${product.sale_price}₺`;
            select.appendChild(option);
        });
        
        console.log(`Products loaded for ${selectId}:`, products.length);
    } catch (error) {
        console.error('Error loading products for select:', error);
    }
}

// Handle edit product selection
async function handleEditProductSelection() {
    const productId = document.getElementById('edit-sale-product').value;
    
    if (!productId) {
        // Ürün seçimi temizlendiyse, alanları temizle
        document.getElementById('edit-sale-amount').value = '';
        document.getElementById('edit-sale-description').value = '';
        return;
    }
    
    try {
        // Tüm ürünleri yeniden yükle
        const allProducts = await window.ipcRenderer.invoke('get-products');
        const product = allProducts.find(p => p.id == productId);
        
        if (product) {
            document.getElementById('edit-sale-amount').value = product.sale_price;
            document.getElementById('edit-sale-description').value = product.name;
            console.log('Ürün bilgileri güncellendi:', product.name, product.sale_price);
        } else {
            console.warn('Ürün bulunamadı:', productId);
        }
    } catch (error) {
        console.error('Ürün bilgisi yüklenirken hata:', error);
    }
}

// Select transaction row
function selectTransactionRow(row, type) {
    console.log('selectTransactionRow called with type:', type);
    console.log('row:', row);
    
    // Remove previous selection from all transaction tables - doğru selector kullan
    document.querySelectorAll('#sales-table-body tr').forEach(r => r.classList.remove('selected'));
    
    // Add selection to clicked row
    row.classList.add('selected');
    console.log('Row selected successfully');
    console.log('Selected row classes:', row.classList.toString());
}

// Search customers
function searchCustomers() {
    const searchTerm = document.getElementById('customer-search').value.toLowerCase();
    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm) ||
        (customer.code && customer.code.toString().includes(searchTerm))
    );
    
    const tbody = document.getElementById('customer-table-body');
    
    if (filteredCustomers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="no-data">Müşteri bulunamadı</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredCustomers.map(customer => `
        <tr onclick="selectCustomer(${customer.id})" data-customer-id="${customer.id}">
            <td>${customer.name}</td>
            <td>${customer.code || customer.id}</td>
        </tr>
    `).join('');
}

// Enter key handler for customer search
function handleCustomerSearchKeydown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const searchTerm = document.getElementById('customer-search').value.trim();
        
        if (searchTerm.length === 0) {
            showMessage('Arama terimi girin', 'warning');
            return;
        }
        
        // Find exact match first
        const exactMatch = customers.find(customer =>
            customer.name.toLowerCase() === searchTerm.toLowerCase() ||
            customer.code && customer.code.toString() === searchTerm
        );
        
        if (exactMatch) {
            selectCustomer(exactMatch.id);
            document.getElementById('customer-search').value = '';
            showMessage(`${exactMatch.name} seçildi`, 'success');
            return;
        }
        
        // Find first partial match
        const partialMatch = customers.find(customer =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (customer.code && customer.code.toString().includes(searchTerm))
        );
        
        if (partialMatch) {
            selectCustomer(partialMatch.id);
            document.getElementById('customer-search').value = '';
            showMessage(`${partialMatch.name} seçildi`, 'success');
        } else {
            showMessage('Müşteri bulunamadı', 'warning');
        }
    }
}

// Filter transactions by date
function filterTransactions() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    // Filter sales
    const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
        return saleDate >= startDate && saleDate <= endDate;
    });
    
    // Filter purchases
    const filteredPurchases = purchases.filter(purchase => {
        const purchaseDate = new Date(purchase.created_at).toISOString().split('T')[0];
        return purchaseDate >= startDate && purchaseDate <= endDate;
    });
    
    // Calculate totals for filtered data
    const totalFilteredSales = filteredSales.reduce((sum, sale) => sum + (sale.total_amount || sale.amount || 0), 0);
    const totalFilteredPayments = filteredPurchases.reduce((sum, purchase) => sum + (purchase.total_amount || purchase.amount || 0), 0);
    const netFilteredBalance = totalFilteredSales - totalFilteredPayments;
    
    // Show filter totals
    showFilterTotals(totalFilteredSales, totalFilteredPayments, netFilteredBalance);
    
    // Display filtered results in the single table
    displayFilteredAllTransactions(filteredSales, filteredPurchases);
}

// Show filter totals
function showFilterTotals(totalSales, totalPayments, netBalance) {
    const filterTotalsDiv = document.getElementById('filter-totals');
    const salesTotalSpan = document.getElementById('filtered-sales-total');
    const paymentsTotalSpan = document.getElementById('filtered-payments-total');
    const netTotalSpan = document.getElementById('filtered-net-total');
    
    if (filterTotalsDiv && salesTotalSpan && paymentsTotalSpan && netTotalSpan) {
        salesTotalSpan.textContent = formatMoney(totalSales) + ' ₺';
        paymentsTotalSpan.textContent = formatMoney(totalPayments) + ' ₺';
        netTotalSpan.textContent = formatMoney(netBalance) + ' ₺';
        
        filterTotalsDiv.style.display = 'flex';
    }
}

// Hide filter totals
function hideFilterTotals() {
    const filterTotalsDiv = document.getElementById('filter-totals');
    if (filterTotalsDiv) {
        filterTotalsDiv.style.display = 'none';
    }
}

// Set quick filter dates
function setQuickFilter(filterType) {
    const today = new Date();
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    // Remove active class from all buttons
    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    let startDate, endDate;
    
    switch (filterType) {
        case 'today':
            startDate = new Date(today);
            endDate = new Date(today);
            break;
            
        case 'yesterday':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 1);
            endDate = new Date(startDate);
            break;
            
        case 'last7days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            endDate = new Date(today);
            break;
            
        case 'last30days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 30);
            endDate = new Date(today);
            break;
            
        case 'thisMonth':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today);
            break;
            
        case 'lastMonth':
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
            
        case 'all':
            // Set a very wide range to show all data
            startDate = new Date('2020-01-01');
            endDate = new Date('2030-12-31');
            break;
            
        default:
            return;
    }
    
    // Format dates for input
    startDateInput.value = startDate.toISOString().split('T')[0];
    endDateInput.value = endDate.toISOString().split('T')[0];
    
    // Apply filter
    filterTransactions();
}

// Display filtered sales
function displayFilteredSales(filteredSales) {
    const tbody = document.getElementById('sales-table-body');
    
    if (filteredSales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">&lt;Gösterilecek Bilgi Yok&gt;</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredSales.map(sale => {
        const date = new Date(sale.created_at);
        return `
            <tr>
                <td>${date.getDate()}</td>
                <td>${date.getMonth() + 1}</td>
                <td>${date.getFullYear()}</td>
                <td>${sale.description || sale.product_name || '-'}</td>
                <td>${sale.quantity || 1}</td>
                <td>${formatMoney(sale.total_amount || sale.amount)}</td>
            </tr>
        `;
    }).join('');
}

// Display filtered purchases
function displayFilteredPurchases(filteredPurchases) {
    const tbody = document.getElementById('purchases-table-body');
    
    if (filteredPurchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">&lt;Gösterilecek Bilgi Yok&gt;</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredPurchases.map(purchase => {
        const date = new Date(purchase.created_at);
        return `
            <tr>
                <td>${date.getDate()}</td>
                <td>${date.getMonth() + 1}</td>
                <td>${date.getFullYear()}</td>
                <td>${purchase.description || purchase.product_name || '-'}</td>
                <td>${purchase.quantity || 1}</td>
                <td>${formatMoney(purchase.total_amount || purchase.amount)}</td>
            </tr>
        `;
    }).join('');
}

// Modal functions
function showAddCustomerModal() {
    showModal('add-customer-modal');
    document.getElementById('customer-name').focus();
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('active');
        console.log(`Modal ${modalId} shown`);
    } else {
        console.warn(`Modal ${modalId} not found in DOM`);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        console.log(`Modal ${modalId} closed`);
    }
}

// Dinamik modal'lar için yardımcı fonksiyon
function showOrCreateModal(modalId, modalHtml) {
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
        existingModal.remove();
    }
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ESC tuşu ile modal kapatma
function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        // Bakiye modal'ı için özel kapatma
        const balanceModal = document.getElementById('balance-modal');
        if (balanceModal && balanceModal.classList.contains('active')) {
            closeBalanceModal();
            return;
        }
        
        // Ürün modülü ile ilgili tüm modal'ları kontrol et
        const productRelatedModals = [
            'product-management-modal', 'categories-modal', 'brands-modal', 
            'add-product-modal', 'edit-product-modal', 'add-category-modal', 
            'add-brand-modal', 'edit-category-modal', 'edit-brand-modal',
            'quick-add-category-from-product-modal', 'quick-add-brand-from-product-modal'
        ];
        
        // Herhangi bir ürün modülü modal'ı açıksa, renderer.js ESC'yi hiç işlemesin
        const activeModals = document.querySelectorAll('.modal.active');
        for (let modal of activeModals) {
            if (productRelatedModals.includes(modal.id)) {
                // Ürün modülü modal'ları product-module.js tarafından yönetiliyor
                // Bu fonksiyon hiçbir şey yapmasın
                e.preventDefault();
                e.stopPropagation();
                return;
            }
        }
        
        // Diğer modal'lar için genel kapatma
        activeModals.forEach(modal => {
            const modalId = modal.id;
            if (modalId && !productRelatedModals.includes(modalId)) {
                closeModal(modalId);
            }
        });
    }
}

// Add customer
async function handleAddCustomer(e) {
    e.preventDefault();
    
    // Temel bilgiler
    const name = document.getElementById('customer-name').value.trim();
    const code = document.getElementById('customer-code').value.trim();
    const phone = document.getElementById('customer-phone-input').value.trim();
    const gsm = document.getElementById('customer-gsm-input').value.trim();
    const limit = parseFloat(document.getElementById('customer-limit-input').value) || 500;
    const address = document.getElementById('customer-address').value.trim();
    const email = document.getElementById('customer-email').value.trim();
    const website = document.getElementById('customer-website').value.trim();
    const customerType = document.getElementById('customer-type').value;
    
    // Vergi bilgileri
    const tcNumber = document.getElementById('customer-tc-number').value.trim();
    const taxNumber = document.getElementById('customer-tax-number').value.trim();
    const taxOffice = document.getElementById('customer-tax-office').value.trim();
    const contactPerson = document.getElementById('customer-contact-person').value.trim();
    const contactPhone = document.getElementById('customer-contact-phone').value.trim();
    
    // Fatura bilgileri
    const invoiceAddress = document.getElementById('customer-invoice-address').value.trim();
    const invoiceCity = document.getElementById('customer-invoice-city').value.trim();
    const invoiceDistrict = document.getElementById('customer-invoice-district').value.trim();
    const invoicePostalCode = document.getElementById('customer-invoice-postal-code').value.trim();
    const accountCode = document.getElementById('customer-account-code').value.trim();
    const costCenter = document.getElementById('customer-cost-center').value.trim();
    
    // E-fatura bilgileri
    const eInvoiceAlias = document.getElementById('customer-e-invoice-alias').value.trim();
    const eArchiveAlias = document.getElementById('customer-e-archive-alias').value.trim();
    const isEInvoiceEnabled = document.getElementById('customer-e-invoice-enabled').checked ? 1 : 0;
    const isEArchiveEnabled = document.getElementById('customer-e-archive-enabled').checked ? 1 : 0;
    
    if (!name) {
        showMessage('Müşteri adı gereklidir', 'error');
        return;
    }
    
    try {
        const newCustomer = await window.ipcRenderer.invoke('add-customer', {
            name,
            code,
            phone,
            gsm,
            limit,
            address,
            email,
            website,
            customer_type: customerType,
            tc_number: tcNumber,
            tax_number: taxNumber,
            tax_office: taxOffice,
            contact_person: contactPerson,
            contact_phone: contactPhone,
            invoice_address: invoiceAddress,
            invoice_city: invoiceCity,
            invoice_district: invoiceDistrict,
            invoice_postal_code: invoicePostalCode,
            account_code: accountCode,
            cost_center: costCenter,
            e_invoice_alias: eInvoiceAlias,
            e_archive_alias: eArchiveAlias,
            is_e_invoice_enabled: isEInvoiceEnabled,
            is_e_archive_enabled: isEArchiveEnabled
        });
        
        showMessage('Müşteri başarıyla eklendi', 'success');
        closeModal('add-customer-modal');
        document.getElementById('add-customer-form').reset();
        
        // Reload customers
        await loadCustomers();
        
    } catch (error) {
        console.error('Müşteri eklenirken hata:', error);
        showMessage('Müşteri eklenirken hata oluştu', 'error');
    }
}

// Handle product selection - auto-fill price
async function handleProductSelection(e) {
    const productId = e.target.value;
    
    if (!productId) {
        // Clear fields if no product selected
        document.getElementById('sale-amount').value = '';
        document.getElementById('sale-description').value = '';
        return;
    }
    
    try {
        const products = await window.ipcRenderer.invoke('get-products');
        const selectedProduct = products.find(p => p.id == productId);
        
        if (selectedProduct) {
            // Auto-fill price (with VAT) and description
            const priceWithVat = selectedProduct.sale_price;
            const vatRate = selectedProduct.vat_rate || 0;
            
            document.getElementById('sale-amount').value = priceWithVat;
            document.getElementById('sale-description').value = selectedProduct.name;
            
            // Show info notification
            if (vatRate > 0) {
                const priceWithoutVat = priceWithVat / (1 + vatRate / 100);
                console.log(`Ürün: ${selectedProduct.name} | KDV: %${vatRate} | KDV Hariç: ${priceWithoutVat.toFixed(2)}₺ | KDV Dahil: ${priceWithVat.toFixed(2)}₺`);
            }
        }
    } catch (error) {
        console.error('Ürün bilgisi yüklenirken hata:', error);
    }
}

// Add sale
async function handleAddSale(e) {
    e.preventDefault();
    
    console.log('💰 handleAddSale BAŞLADI');
    
    if (!selectedCustomerId) {
        showMessage('Müşteri seçimi bulunamadı', 'error');
        return;
    }
    
    const date = document.getElementById('sale-date').value;
    const description = document.getElementById('sale-description').value.trim() || 'Satış';
    const amount = parseFloat(document.getElementById('sale-amount').value);
    const productId = document.getElementById('sale-product').value || null;
    
    if (!date || !amount || amount <= 0) {
        showMessage('Tarih ve tutar alanları zorunludur', 'error');
        return;
    }
    
    const storedCustomerId = selectedCustomerId; // Store before reset
    
    try {
        await window.ipcRenderer.invoke('add-transaction', {
            customer_id: storedCustomerId,
            product_id: productId,
            type: 'debt',
            quantity: 1,
            unit_price: amount,
            total_amount: amount,
            description,
            date: new Date(date).toISOString()
        });
        
        showMessage('Satış başarıyla eklendi', 'success');
        closeModal('add-sale-modal');
        
        // Reset form but keep customer selection
        const form = document.getElementById('add-sale-form');
        const customerValue = document.getElementById('sale-customer').value;
        form.reset();
        document.getElementById('sale-customer').value = customerValue;
        
        // Reload customers to update balances
        await loadCustomers();
        
        // Re-select the customer to keep it active
        if (storedCustomerId) {
            await selectCustomer(storedCustomerId);
        }
        
    } catch (error) {
        console.error('Satış eklenirken hata:', error);
        showMessage('Satış eklenirken hata oluştu', 'error');
    }
}

// Add purchase
async function handleAddPurchase(e) {
    e.preventDefault();
    
    console.log('💵 handleAddPurchase BAŞLADI');
    
    if (!selectedCustomerId) {
        showMessage('Müşteri seçimi bulunamadı', 'error');
        return;
    }
    
    const date = document.getElementById('purchase-date').value;
    const description = document.getElementById('purchase-description').value.trim() || 'Tahsilat';
    const amount = parseFloat(document.getElementById('purchase-amount').value);
    
    console.log('Tahsilat verileri:', { date, description, amount, selectedCustomerId });
    
    if (!date || !amount || amount <= 0) {
        showMessage('Tarih ve tutar alanları zorunludur', 'error');
        return;
    }
    
    const storedCustomerId = selectedCustomerId; // Store before reset
    
    try {
        console.log('📤 Tahsilat kaydediliyor...');
        
        await window.ipcRenderer.invoke('add-transaction', {
            customer_id: storedCustomerId,
            type: 'payment',
            quantity: 1,
            unit_price: amount,
            total_amount: amount,
            description,
            date: new Date(date).toISOString()
        });
        
        console.log('✅ Tahsilat kaydedildi!');
        
        showMessage('Tahsilat başarıyla eklendi', 'success');
        closeModal('add-purchase-modal');
        
        // Reset form but keep customer selection
        const form = document.getElementById('add-purchase-form');
        const customerValue = document.getElementById('purchase-customer').value;
        form.reset();
        document.getElementById('purchase-customer').value = customerValue;
        
        // Reload customers to update balances
        await loadCustomers();
        
        // Re-select the customer to keep it active
        if (storedCustomerId) {
            await selectCustomer(storedCustomerId);
        }
        
    } catch (error) {
        console.error('Tahsilat eklenirken hata:', error);
        showMessage('Tahsilat eklenirken hata oluştu', 'error');
    }
}

// Button functions
async function addSale() {
    if (!currentCustomer) {
        showMessage('Önce bir müşteri seçin', 'error');
        return;
    }
    
    // Set the selected customer
    selectedCustomerId = currentCustomer.id;
    document.getElementById('sale-customer').value = currentCustomer.name;
    
    // Set today's date
    document.getElementById('sale-date').value = formatDateForInput(new Date());
    
    // Clear amount and description for new entry
    document.getElementById('sale-amount').value = '';
    document.getElementById('sale-description').value = '';
    
    // Load products for selection
    await loadProductsForSale();
    
    showModal('add-sale-modal');
    
    // Focus on amount field for quick entry
    setTimeout(() => {
        const amountField = document.getElementById('sale-amount');
        if (amountField) {
            amountField.focus();
            amountField.select();
        }
    }, 100);
}

// Tüm İşlemler için genel fonksiyonlar
async function addTransaction() {
    console.log('=== ADD TRANSACTION FUNCTION CALLED ===');
    
    if (!currentCustomer) {
        showMessage('Önce bir müşteri seçin', 'error');
        return;
    }
    
    console.log('currentCustomer:', currentCustomer);
    
    // Satış ekleme modal'ını aç (varsayılan olarak satış)
    await addSale();
}

async function editTransaction() {
    console.log('=== EDIT TRANSACTION FUNCTION CALLED ===');
    
    if (!currentCustomer) {
        showMessage('Önce bir müşteri seçin', 'error');
        return;
    }
    
    // Seçili satırı kontrol et - doğru selector kullan
    const selectedRow = document.querySelector('#sales-table-body tr.selected');
    console.log('selectedRow:', selectedRow);
    
    if (!selectedRow) {
        showMessage('Düzenlemek için bir işlem seçin', 'warning');
        return;
    }
    
    const transactionType = selectedRow.getAttribute('data-transaction-type');
    const transactionId = selectedRow.getAttribute('data-transaction-id');
    
    console.log('transactionType:', transactionType);
    console.log('transactionId:', transactionId);
    
    if (transactionType === 'sale') {
        await editSale();
    } else if (transactionType === 'purchase') {
        await editPurchase();
    }
}

async function deleteTransaction() {
    console.log('=== DELETE TRANSACTION FUNCTION CALLED ===');
    
    if (!currentCustomer) {
        showMessage('Önce bir müşteri seçin', 'error');
        return;
    }
    
    // Seçili satırı kontrol et - doğru selector kullan
    const selectedRow = document.querySelector('#sales-table-body tr.selected');
    console.log('selectedRow:', selectedRow);
    
    if (!selectedRow) {
        showMessage('Silmek için bir işlem seçin', 'warning');
        return;
    }
    
    const transactionType = selectedRow.getAttribute('data-transaction-type');
    const transactionId = selectedRow.getAttribute('data-transaction-id');
    
    console.log('transactionType:', transactionType);
    console.log('transactionId:', transactionId);
    
    if (!transactionType || !transactionId) {
        showMessage('İşlem bilgileri bulunamadı', 'error');
        return;
    }
    
    if (transactionType === 'sale') {
        await deleteSale();
    } else if (transactionType === 'purchase') {
        await deletePurchase();
    } else {
        showMessage('Bilinmeyen işlem türü', 'error');
    }
}

// Load products for sale dropdown
async function loadProductsForSale() {
    try {
        const products = await window.ipcRenderer.invoke('get-products');
        const select = document.getElementById('sale-product');
        
        select.innerHTML = '<option value="">Ürün seçin (veya manuel tutar girin)</option>';
        
        // Only show active products
        const activeProducts = products.filter(p => p.is_active === 1);
        
        activeProducts.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - ₺${formatMoney(product.sale_price)}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Ürünler yüklenirken hata:', error);
    }
}

// Show quick add product modal - KALDIRILDI (artık product-module.js'de yönetiliyor)
// function showQuickAddProduct() {
//     document.getElementById('quick-add-product-form').reset();
//     showModal('quick-add-product-modal');
//     document.getElementById('quick-product-name').focus();
// }

// Handle quick add product - KALDIRILDI (artık product-module.js'de yönetiliyor)
// async function handleQuickAddProduct(e) {
//     // Fonksiyon kaldırıldı - artık product-module.js'de yönetiliyor
// }

// ESKİ handleAddProduct FONKSİYONU KALDIRILDI - product-module.js kullanılıyor

async function addPurchase() {
    if (!currentCustomer) {
        showMessage('Önce bir müşteri seçin', 'error');
        return;
    }
    
    // Set the selected customer
    selectedCustomerId = currentCustomer.id;
    document.getElementById('purchase-customer').value = currentCustomer.name;
    
    // Set today's date
    document.getElementById('purchase-date').value = formatDateForInput(new Date());
    
    // Clear amount and description for new entry
    document.getElementById('purchase-amount').value = '';
    document.getElementById('purchase-description').value = '';
    
    showModal('add-purchase-modal');
    
    // Focus on amount field for quick entry
    setTimeout(() => {
        const amountField = document.getElementById('purchase-amount');
        if (amountField) {
            amountField.focus();
            amountField.select();
        }
    }, 100);
}

function editCustomer() {
    if (!currentCustomer) {
        showMessage('Önce bir müşteri seçin', 'error');
        return;
    }
    
    // Hidden ID
    document.getElementById('edit-customer-id').value = currentCustomer.id;
    
    // Temel Bilgiler
    document.getElementById('edit-customer-name').value = currentCustomer.name;
    document.getElementById('edit-customer-code').value = currentCustomer.code || '';
    document.getElementById('edit-customer-type').value = currentCustomer.customer_type || 'individual';
    document.getElementById('edit-customer-limit').value = currentCustomer.credit_limit || 500;
    document.getElementById('edit-customer-phone').value = currentCustomer.phone || '';
    document.getElementById('edit-customer-gsm').value = currentCustomer.gsm || '';
    document.getElementById('edit-customer-email').value = currentCustomer.email || '';
    document.getElementById('edit-customer-website').value = currentCustomer.website || '';
    document.getElementById('edit-customer-address').value = currentCustomer.address || '';
    
    // Vergi Bilgileri
    document.getElementById('edit-customer-tc-number').value = currentCustomer.tc_number || '';
    document.getElementById('edit-customer-tax-number').value = currentCustomer.tax_number || '';
    document.getElementById('edit-customer-tax-office').value = currentCustomer.tax_office || '';
    document.getElementById('edit-customer-contact-person').value = currentCustomer.contact_person || '';
    document.getElementById('edit-customer-contact-phone').value = currentCustomer.contact_phone || '';
    
    // Fatura Bilgileri
    document.getElementById('edit-customer-invoice-address').value = currentCustomer.invoice_address || '';
    document.getElementById('edit-customer-invoice-city').value = currentCustomer.invoice_city || '';
    document.getElementById('edit-customer-invoice-district').value = currentCustomer.invoice_district || '';
    document.getElementById('edit-customer-invoice-postal-code').value = currentCustomer.invoice_postal_code || '';
    document.getElementById('edit-customer-account-code').value = currentCustomer.account_code || '';
    document.getElementById('edit-customer-cost-center').value = currentCustomer.cost_center || '';
    
    // E-Fatura
    document.getElementById('edit-customer-e-invoice-alias').value = currentCustomer.e_invoice_alias || '';
    document.getElementById('edit-customer-e-archive-alias').value = currentCustomer.e_archive_alias || '';
    document.getElementById('edit-customer-e-invoice-enabled').checked = currentCustomer.is_e_invoice_enabled == 1;
    document.getElementById('edit-customer-e-archive-enabled').checked = currentCustomer.is_e_archive_enabled == 1;
    
    // İlk tab'ı aktif yap
    document.querySelectorAll('#edit-customer-modal .tab-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('#edit-customer-modal .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('edit-basic-info').classList.add('active');
    document.querySelector('#edit-customer-modal .tab-btn').classList.add('active');
    
    showModal('edit-customer-modal');
    document.getElementById('edit-customer-name').focus();
}

// Handle edit customer
async function handleEditCustomer(e) {
    e.preventDefault();
    
    console.log('=== HANDLE EDIT CUSTOMER CALLED ===');
    
    const id = document.getElementById('edit-customer-id').value;
    console.log('Customer ID:', id);
    
    // Temel bilgiler
    const name = document.getElementById('edit-customer-name').value.trim();
    const code = document.getElementById('edit-customer-code').value.trim();
    const phone = document.getElementById('edit-customer-phone').value.trim();
    const gsm = document.getElementById('edit-customer-gsm').value.trim();
    const limit = parseFloat(document.getElementById('edit-customer-limit').value) || 500;
    const address = document.getElementById('edit-customer-address').value.trim();
    const email = document.getElementById('edit-customer-email').value.trim();
    const website = document.getElementById('edit-customer-website').value.trim();
    const customerType = document.getElementById('edit-customer-type').value;
    
    // Vergi bilgileri
    const tcNumber = document.getElementById('edit-customer-tc-number').value.trim();
    const taxNumber = document.getElementById('edit-customer-tax-number').value.trim();
    const taxOffice = document.getElementById('edit-customer-tax-office').value.trim();
    const contactPerson = document.getElementById('edit-customer-contact-person').value.trim();
    const contactPhone = document.getElementById('edit-customer-contact-phone').value.trim();
    
    // Fatura bilgileri
    const invoiceAddress = document.getElementById('edit-customer-invoice-address').value.trim();
    const invoiceCity = document.getElementById('edit-customer-invoice-city').value.trim();
    const invoiceDistrict = document.getElementById('edit-customer-invoice-district').value.trim();
    const invoicePostalCode = document.getElementById('edit-customer-invoice-postal-code').value.trim();
    const accountCode = document.getElementById('edit-customer-account-code').value.trim();
    const costCenter = document.getElementById('edit-customer-cost-center').value.trim();
    
    // E-fatura bilgileri
    const eInvoiceAlias = document.getElementById('edit-customer-e-invoice-alias').value.trim();
    const eArchiveAlias = document.getElementById('edit-customer-e-archive-alias').value.trim();
    const isEInvoiceEnabled = document.getElementById('edit-customer-e-invoice-enabled').checked ? 1 : 0;
    const isEArchiveEnabled = document.getElementById('edit-customer-e-archive-enabled').checked ? 1 : 0;
    
    if (!name) {
        showMessage('Müşteri adı gereklidir', 'error');
        return;
    }
    
    console.log('Sending update request with data:', { id, name, customerType });
    
    try {
        const result = await window.ipcRenderer.invoke('update-customer', {
            id: id,
            name,
            code,
            phone,
            gsm,
            limit,
            address,
            email,
            website,
            customer_type: customerType,
            tc_number: tcNumber,
            tax_number: taxNumber,
            tax_office: taxOffice,
            contact_person: contactPerson,
            contact_phone: contactPhone,
            invoice_address: invoiceAddress,
            invoice_city: invoiceCity,
            invoice_district: invoiceDistrict,
            invoice_postal_code: invoicePostalCode,
            account_code: accountCode,
            cost_center: costCenter,
            e_invoice_alias: eInvoiceAlias,
            e_archive_alias: eArchiveAlias,
            is_e_invoice_enabled: isEInvoiceEnabled,
            is_e_archive_enabled: isEArchiveEnabled
        });
        
        console.log('Update result:', result);
        
        if (result.success) {
            showMessage('Müşteri başarıyla güncellendi', 'success');
            closeModal('edit-customer-modal');
            
            // Reload customers and refresh current customer
            await loadCustomers();
            await selectCustomer(id);
            
        } else {
            showMessage('Müşteri güncellenirken hata oluştu', 'error');
        }
        
    } catch (error) {
        console.error('Müşteri güncellenirken hata:', error);
        showMessage('Müşteri güncellenirken hata oluştu', 'error');
    }
}

async function deleteCustomer() {
    // Admin kontrolü
    if (!window.currentUser || window.currentUser.role !== 'admin') {
        showMessage('Bu işlem için admin yetkisi gereklidir', 'error');
        return;
    }
    
    if (!currentCustomer) {
        showMessage('Önce bir müşteri seçin', 'error');
        return;
    }
    
    // Onay mesajı göster
    const confirmMessage = `"${currentCustomer.name}" müşterisini ve tüm işlemlerini silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        const result = await window.ipcRenderer.invoke('delete-customer', currentCustomer.id);
        
        if (result.success) {
            showMessage('Müşteri başarıyla silindi', 'success');
            
            // Müşteri listesini yenile
            await loadCustomers();
            
            // Seçili müşteriyi temizle
            currentCustomer = null;
            
            // Detayları temizle
            const elements = {
                'selected-customer-name': 'Müşteri Seçin',
                'customer-phone': '-',
                'customer-gsm': '-',
                'customer-limit': '0,00',
                'customer-status': '-',
                'customer-debt': '0,00',
                'customer-credit': '0,00',
                'customer-balance': '0,00',
                'last-sale-date': '-',
                'last-payment-date': '-'
            };
            
            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                }
            });
            
            // İşlem tablolarını temizle
            const salesTableBody = document.getElementById('sales-table-body');
            const purchasesTableBody = document.getElementById('purchases-table-body');
            
            if (salesTableBody) {
                salesTableBody.innerHTML = '<tr><td colspan="6" class="no-data">&lt;Gösterilecek Bilgi Yok&gt;</td></tr>';
            }
            if (purchasesTableBody) {
                purchasesTableBody.innerHTML = '<tr><td colspan="6" class="no-data">&lt;Gösterilecek Bilgi Yok&gt;</td></tr>';
            }
            
        } else {
            showMessage('Müşteri silinirken hata oluştu', 'error');
        }
        
    } catch (error) {
        console.error('Müşteri silinirken hata:', error);
        showMessage('Müşteri silinirken hata oluştu', 'error');
    }
}


// Customer search functionality
function setupCustomerSearch(inputId, dropdownId) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    
    if (!input || !dropdown) return;
    
    // Input event handler
    const inputHandler = (e) => {
        const searchTerm = e.target.value.trim();
        selectedCustomerId = null; // Reset selection
        
        if (searchTerm.length >= 3) {
            searchAndShowCustomers(searchTerm, dropdown);
        } else {
            hideDropdown(dropdown);
        }
    };
    
    // Blur event handler
    const blurHandler = () => {
        // Delay hiding to allow click on dropdown item
        setTimeout(() => hideDropdown(dropdown), 200);
    };
    
    // Focus event handler
    const focusHandler = () => {
        if (input.value.trim().length >= 3) {
            searchAndShowCustomers(input.value.trim(), dropdown);
        }
    };
    
    // Add event listeners
    input.addEventListener('input', inputHandler);
    input.addEventListener('blur', blurHandler);
    input.addEventListener('focus', focusHandler);
    
    // Store listeners for cleanup
    eventListeners.customerSearchListeners.push(
        { element: input, event: 'input', handler: inputHandler },
        { element: input, event: 'blur', handler: blurHandler },
        { element: input, event: 'focus', handler: focusHandler }
    );
}

function searchAndShowCustomers(searchTerm, dropdown) {
    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.code && customer.code.toString().includes(searchTerm))
    );
    
    if (filteredCustomers.length === 0) {
        hideDropdown(dropdown);
        return;
    }
    
    showCustomerDropdown(filteredCustomers, dropdown);
}

function showCustomerDropdown(customerList, dropdown) {
    dropdown.innerHTML = customerList.map(customer => `
        <div class="customer-dropdown-item" data-customer-id="${customer.id}" onclick="selectCustomerFromDropdown(${customer.id}, '${customer.name}', '${dropdown.id}')">
            <strong>${customer.name}</strong>
            <br>
            <small>Kod: ${customer.code || customer.id} • Bakiye: ₺${formatMoney(customer.balance)}</small>
        </div>
    `).join('');
    
    dropdown.style.display = 'block';
}

function hideDropdown(dropdown) {
    dropdown.style.display = 'none';
}

function selectCustomerFromDropdown(customerId, customerName, dropdownId) {
    selectedCustomerId = customerId;
    
    // Find the input field associated with this dropdown
    const inputId = dropdownId.replace('-dropdown', '');
    const input = document.getElementById(inputId);
    input.value = customerName;
    
    hideDropdown(document.getElementById(dropdownId));
}

// Load customers for select dropdown (legacy function - keeping for compatibility)
async function loadCustomersForSelect(selectId) {
    try {
        const customers = await window.ipcRenderer.invoke('get-customers');
        const select = document.getElementById(selectId);
        
        select.innerHTML = '<option value="">Müşteri seçin...</option>';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.name} (₺${formatMoney(customer.balance)})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Müşteriler yüklenirken hata:', error);
    }
}

// Utility functions
function formatMoney(amount) {
    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
}

// Date string'i Türkçe format'a çevir
function formatDateForDisplay(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
}

function showMessage(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        font-size: 12px;
    `;
    
    if (type === 'success') {
        notification.style.background = '#38a169';
    } else if (type === 'error') {
        notification.style.background = '#e53e3e';
    } else {
        notification.style.background = '#4299e1';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
            document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// CSS animations
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyle);

// Keyboard shortcuts handler
function handleKeyboardShortcuts(e) {
    // Check if it's a function key
    const isFunctionKey = e.key && e.key.startsWith('F') && e.key.length >= 2;
    
    // If it's a function key, prevent default IMMEDIATELY
    if (isFunctionKey) {
        e.preventDefault();
    }
    
    // Check if we're in a modal
    const activeModal = document.querySelector('.modal.active');
    const isInModal = activeModal !== null;
    
    // If in input field, only allow Enter and Escape
    const isInInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT';
    
    // Handle Enter key in modal forms
    if (e.key === 'Enter' && isInModal && isInInput) {
        // Let form handle submit naturally
        return;
    }
    
    // Handle Escape to close modals
    if (e.key === 'Escape' && isInModal) {
        e.preventDefault();
        const modalId = activeModal.id;
        closeModal(modalId);
        return;
    }
    
    // Don't handle other shortcuts when typing in input (except function keys)
    if (isInInput && !isFunctionKey) {
        return;
    }
    
    // Function keys - Main shortcuts (always work, even in modals)
    switch (e.key) {
        case 'F1':
            e.preventDefault();
            focusCustomerSearch();
            break;
        case 'F2':
            if (currentCustomer) {
                quickSale();
            } else {
                showMessage('Önce müşteri seçin (F1)', 'warning');
            }
            break;
        case 'F3':
            if (currentCustomer) {
                quickPurchase();
            } else {
                showMessage('Önce müşteri seçin (F1)', 'warning');
            }
            break;
        case 'F4':
            if (currentCustomer) {
                addSale();
            } else {
                showMessage('Önce müşteri seçin (F1)', 'warning');
            }
            break;
        case 'F5':
            if (currentCustomer) {
                addPurchase();
            } else {
                showMessage('Önce müşteri seçin (F1)', 'warning');
            }
            break;
        case 'F8':
            showProductManagement();
            break;
        case 'F9':
            showReports();
            break;
        case 'F10':
            showSettings();
            break;
    }
}

// Quick Entry Functions
function focusCustomerSearch() {
    // Yeni müşteri arama modal'ını aç
    showCustomerSearchModal();
}

// Müşteri Arama Modal'ını Göster
function showCustomerSearchModal() {
    showModal('customer-search-modal');
    
    // Modal açıldıktan sonra arama kutusuna odaklan
    setTimeout(() => {
        const searchInput = document.getElementById('customer-search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
        
        // Tüm müşterileri yükle
        loadCustomersForSearch();
    }, 100);
}

async function quickSale() {
    if (!currentCustomer) {
        showMessage('Önce müşteri seçin (F1)', 'warning');
        return;
    }
    
    // Show minimal quick sale modal
    const amount = prompt(`${currentCustomer.name}\n\nSatış Tutarı (KDV Dahil):`, '');
    
    if (amount === null || amount.trim() === '') {
        return; // User cancelled
    }
    
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
        showMessage('Geçerli bir tutar girin', 'error');
        return;
    }
    
    const description = prompt(`${currentCustomer.name}\n\nAçıklama (opsiyonel):`, '');
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        await window.ipcRenderer.invoke('add-transaction', {
            customer_id: currentCustomer.id,
            type: 'sale',
            date: today,
            amount: amountFloat,
            description: description && description.trim() ? description.trim() : 'Satış',
            product_id: null,
            quantity: 1,
            unit_price: amountFloat,
            total_amount: amountFloat
        });
        
        showMessage(`✅ ${formatMoney(amountFloat)} satış kaydedildi`, 'success');
        
        // Reload data
        await loadCustomers();
        await selectCustomer(currentCustomer.id);
        
    } catch (error) {
        console.error('Quick sale error:', error);
        showMessage('Satış kaydedilemedi', 'error');
    }
}

async function quickPurchase() {
    if (!currentCustomer) {
        showMessage('Önce müşteri seçin (F1)', 'warning');
        return;
    }
    
    // Show minimal quick purchase modal
    const amount = prompt(`${currentCustomer.name}\n\nTahsilat Tutarı:`, '');
    
    if (amount === null || amount.trim() === '') {
        return; // User cancelled
    }
    
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
        showMessage('Geçerli bir tutar girin', 'error');
        return;
    }
    
    const description = prompt(`${currentCustomer.name}\n\nAçıklama (opsiyonel):`, '');
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        await window.ipcRenderer.invoke('add-transaction', {
            customer_id: currentCustomer.id,
            type: 'payment',
            date: today,
            amount: amountFloat,
            description: description && description.trim() ? description.trim() : 'Tahsilat',
            product_id: null,
            quantity: 1,
            unit_price: amountFloat,
            total_amount: amountFloat
        });
        
        showMessage(`✅ ${formatMoney(amountFloat)} tahsilat kaydedildi`, 'success');
        
        // Reload data
        await loadCustomers();
        await selectCustomer(currentCustomer.id);
        
    } catch (error) {
        console.error('Quick purchase error:', error);
        showMessage('Tahsilat kaydedilemedi', 'error');
    }
}

// Header Button Functions
function showSettings() {
    // Ayarlar modal'ını göster
    showSettingsModal();
}

function showAbout() {
    alert('Etic Ajans - Veresiye Takip\nSürüm: 1.0.1.1\n\nGeliştirici: Etic Ajans\n\nBu uygulama müşteri borç-alacak takibi için geliştirilmiştir.');
}


// Top Control Functions
function queryTransactions() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
        showMessage('Başlangıç ve bitiş tarihlerini seçin', 'error');
        return;
    }
    
    // Tarih aralığındaki işlemleri filtrele
    filterTransactions();
    showMessage(`${formatDate(startDate)} - ${formatDate(endDate)} tarihleri arası işlemler gösteriliyor`, 'success');
}

function showReports() {
    // Gelişmiş rapor sistemi
    showReportsModal();
}

async function showBalanceTotal() {
    try {
        // Seçili müşteri kontrolü
        if (!currentCustomer) {
            showMessage('Lütfen önce bir müşteri seçin', 'warning');
            return;
        }
        
        // Ana ekrandaki aynı veri kaynağını kullan (sales ve purchases global değişkenleri)
        if (!sales || !purchases) {
            showMessage('İşlem verileri yüklenmedi. Lütfen müşteriyi tekrar seçin.', 'warning');
            return;
        }
        
        // Toplamları hesapla
        const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || s.amount || 0), 0);
        const totalPayments = purchases.reduce((sum, p) => sum + (p.total_amount || p.amount || 0), 0);
        const netBalance = totalSales - totalPayments;
        
        // İşlem sayıları
        const salesCount = sales.length;
        const paymentCount = purchases.length;
        const totalTransactionCount = salesCount + paymentCount;
        
        // Son işlem tarihleri
        const lastSaleDate = sales.length > 0 ? 
            new Date(Math.max(...sales.map(s => new Date(s.created_at)))).toLocaleDateString('tr-TR') : '-';
        const lastPaymentDate = purchases.length > 0 ? 
            new Date(Math.max(...purchases.map(p => new Date(p.created_at)))).toLocaleDateString('tr-TR') : '-';
        
        // Tahsilat oranı
        const paymentRate = totalSales > 0 ? ((totalPayments / totalSales) * 100) : 0;
        
        // İşlem detayları (ana ekrandaki ile aynı sıralama)
        const allTransactions = [
            ...sales.map(s => ({ ...s, transactionType: 'sale' })),
            ...purchases.map(p => ({ ...p, transactionType: 'purchase' }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Modal olarak göster
        showDetailedBalanceModal({
            customer: currentCustomer,
            totalSales,
            totalPayments,
            netBalance,
            salesCount,
            paymentCount,
            totalTransactionCount,
            lastSaleDate,
            lastPaymentDate,
            paymentRate,
            transactions: allTransactions
        });
        
    } catch (error) {
        console.error('Bakiye hesaplanırken hata:', error);
        showMessage('Bakiye hesaplanırken hata oluştu', 'error');
    }
}

// Detaylı bakiye modal'ını göster
function showDetailedBalanceModal(data) {
    const currentDate = new Date();
    const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
    const currentDateStr = currentDate.toLocaleDateString('tr-TR');
    
    // Grafik için maksimum değeri hesapla
    const maxValue = Math.max(data.totalSales, data.totalPayments);
    const salesHeight = maxValue > 0 ? (data.totalSales / maxValue) * 100 : 20;
    const paymentsHeight = maxValue > 0 ? (data.totalPayments / maxValue) * 100 : 20;
    
    // Modal HTML'i oluştur
    const modalHtml = `
        <div id="balance-modal" class="modal active">
            <div class="modal-content balance-modal-content">
                <div class="modal-header">
                             <h2 style="font-size: 1.8rem;">📊 ${data.customer.name} - CARİ HESAP ÖZETİ</h2>
                    <button class="close-btn" onclick="closeBalanceModal()">&times;</button>
                </div>
                
                <div style="padding: 20px;">
                    <!-- Müşteri Bilgileri -->
                    <div class="balance-details-section">
                        <div class="balance-details-title">Müşteri Bilgileri</div>
                        <div class="balance-stats-grid">
                            <div class="balance-stat-item">
                                <div class="balance-stat-label">Müşteri Adı</div>
                                <div class="balance-stat-value">${data.customer.name}</div>
                            </div>
                            <div class="balance-stat-item">
                                <div class="balance-stat-label">Müşteri Kodu</div>
                                <div class="balance-stat-value">${data.customer.code || '-'}</div>
                            </div>
                            <div class="balance-stat-item">
                                <div class="balance-stat-label">Telefon</div>
                                <div class="balance-stat-value">${data.customer.phone || '-'}</div>
                            </div>
                            <div class="balance-stat-item">
                                <div class="balance-stat-label">GSM</div>
                                <div class="balance-stat-value">${data.customer.gsm || '-'}</div>
                            </div>
                            <div class="balance-stat-item">
                                <div class="balance-stat-label">Kredi Limiti</div>
                                <div class="balance-stat-value">${formatMoney(data.customer.credit_limit || 500)}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Ana Özet Kartları -->
                    <div class="balance-summary-container">
                        <div class="balance-summary-card sales">
                            <div class="balance-card-header">
                                <div class="balance-card-icon">💰</div>
                                <div class="balance-card-title">Toplam Satış</div>
                            </div>
                            <div class="balance-card-value">${formatMoney(data.totalSales)}</div>
                            <div class="balance-card-subtitle">${data.salesCount} işlem</div>
                        </div>
                        
                        <div class="balance-summary-card payments">
                            <div class="balance-card-header">
                                <div class="balance-card-icon">💳</div>
                                <div class="balance-card-title">Toplam Tahsilat</div>
                            </div>
                            <div class="balance-card-value">${formatMoney(data.totalPayments)}</div>
                            <div class="balance-card-subtitle">${data.paymentCount} işlem</div>
                        </div>
                        
                        <div class="balance-summary-card net">
                            <div class="balance-card-header">
                                <div class="balance-card-icon">⚖️</div>
                                <div class="balance-card-title">Net Bakiye</div>
                            </div>
                            <div class="balance-card-value">${formatMoney(data.netBalance)}</div>
                            <div class="balance-card-subtitle">${data.netBalance >= 0 ? 'Alacaklı' : 'Borçlu'}</div>
                        </div>
                        
                        <div class="balance-summary-card debt">
                            <div class="balance-card-header">
                                <div class="balance-card-icon">📊</div>
                                <div class="balance-card-title">Tahsilat Oranı</div>
                            </div>
                            <div class="balance-card-value">${data.paymentRate.toFixed(1)}%</div>
                            <div class="balance-card-subtitle">${data.paymentRate >= 80 ? 'İyi' : data.paymentRate >= 60 ? 'Orta' : 'Düşük'}</div>
                        </div>
                    </div>
                    
                    <!-- İstatistikler -->
                    <div class="balance-details-section">
                        <div class="balance-details-title">İşlem İstatistikleri</div>
                        <div class="balance-stats-grid">
                            <div class="balance-stat-item">
                                <div class="balance-stat-label">Toplam İşlem</div>
                                <div class="balance-stat-value">${data.totalTransactionCount}</div>
                            </div>
                            <div class="balance-stat-item">
                                <div class="balance-stat-label">Satış İşlemi</div>
                                <div class="balance-stat-value positive">${data.salesCount}</div>
                            </div>
                            <div class="balance-stat-item">
                                <div class="balance-stat-label">Tahsilat İşlemi</div>
                                <div class="balance-stat-value positive">${data.paymentCount}</div>
                            </div>
                            <div class="balance-stat-item">
                                <div class="balance-stat-label">Son Satış</div>
                                <div class="balance-stat-value neutral">${data.lastSaleDate}</div>
                            </div>
                            <div class="balance-stat-item">
                                <div class="balance-stat-label">Son Tahsilat</div>
                                <div class="balance-stat-value neutral">${data.lastPaymentDate}</div>
                            </div>
                            <div class="balance-stat-item">
                                <div class="balance-stat-label">Ortalama Satış</div>
                                <div class="balance-stat-value">${data.salesCount > 0 ? formatMoney(data.totalSales / data.salesCount) : '0,00'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Grafik -->
                    <div class="balance-chart-container">
                        <div class="balance-chart-title">Finansal Durum Grafiği</div>
                        <div class="balance-bar-chart">
                            <div class="balance-bar sales" style="height: ${salesHeight}%">
                                <div class="balance-bar-value">${formatMoney(data.totalSales)}</div>
                                <div class="balance-bar-label">Satış</div>
                            </div>
                            <div class="balance-bar payments" style="height: ${paymentsHeight}%">
                                <div class="balance-bar-value">${formatMoney(data.totalPayments)}</div>
                                <div class="balance-bar-label">Tahsilat</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- İşlem Dökümü -->
                    <div class="balance-details-section">
                        <div class="balance-details-title">İşlem Dökümü</div>
                        <div class="transaction-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Gün</th>
                                        <th>Ay</th>
                                        <th>Yıl</th>
                                        <th>Tür</th>
                                        <th>Açıklama</th>
                                        <th>Miktar</th>
                                        <th>Tutar</th>
                                        <th>Bakiye</th>
                                    </tr>
                                </thead>
                                <tbody id="modal-transactions-table-body">
                                    <!-- Ana ekrandaki tablo içeriği buraya gelecek -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Alt Bilgiler -->
                    <div class="balance-summary-footer">
                        <div class="balance-footer-info">
                            <div class="balance-footer-left">
                                <div><strong>📅 Rapor Tarihi:</strong> ${currentDateStr}</div>
                                <div><strong>🕐 Rapor Saati:</strong> ${currentTime}</div>
                                <div><strong>🏢 Şirket:</strong> Etic Ajans</div>
                            </div>
                            <div class="balance-footer-right">
                                Veresiye Takip Sistemi v1.0.1.1
                            </div>
                        </div>
                </div>
                </div>
                
                <!-- Alt Butonlar -->
                <div style="padding: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <button class="btn btn-secondary" onclick="exportBalanceToExcel()">
                            📊 Excel'e Aktar
                        </button>
                        <button class="btn btn-secondary" onclick="exportBalanceToPDF()">
                            📄 PDF'e Aktar
                        </button>
                        <button class="btn btn-secondary" onclick="copyBalanceToClipboard()">
                            📋 Kopyala
                        </button>
                    </div>
                    <div>
                        <button class="btn btn-secondary" onclick="closeBalanceModal()">
                            ❌ Kapat
                        </button>
                        <button class="btn btn-primary" onclick="printBalanceReport()">
                            🖨️ Yazdır
                        </button>
                    </div>
                    
                </div>
            </div>
        </div>
    `;
    
    // Modal'ı göster veya oluştur
    showOrCreateModal('balance-modal', modalHtml);
    
    // Modal açıldıktan sonra ana ekrandaki tablo içeriğini modal'daki tabloya kopyala
    setTimeout(() => {
        const mainTableBody = document.getElementById('sales-table-body');
        const modalTableBody = document.getElementById('modal-transactions-table-body');
        
        if (mainTableBody && modalTableBody) {
            modalTableBody.innerHTML = mainTableBody.innerHTML;
        }
    }, 100);
}

// Bakiye modal'ını kapat
function closeBalanceModal() {
    const modal = document.getElementById('balance-modal');
    if (modal) {
        modal.classList.remove('active');
        // Modal'ı DOM'dan kaldırma - sadece gizle
        console.log('Balance modal closed (hidden, not removed from DOM)');
    }
}

// Bakiye raporunu yazdır
function printBalanceReport() {
    // Seçili müşteri kontrolü
    if (!currentCustomer) {
        showMessage('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    
    try {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        const currentDateStr = currentDate.toLocaleDateString('tr-TR');
        
        // Ana ekrandaki tablodan direkt veri çek
        const mainTableBody = document.getElementById('sales-table-body');
        if (!mainTableBody) {
            showMessage('Ana ekrandaki tablo bulunamadı. Lütfen müşteriyi tekrar seçin.', 'warning');
            return;
        }
        
        const customerName = currentCustomer.name;
        
        // Ana ekrandaki tablodan satırları al
        const tableRows = mainTableBody.querySelectorAll('tr');
        const transactionRows = [];
        
        // Her satırdan veri çıkar
        tableRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 8 && !row.classList.contains('no-data')) {
                const day = cells[0].textContent.trim();
                const month = cells[1].textContent.trim();
                const year = cells[2].textContent.trim();
                const typeRaw = cells[3].textContent.trim();
                const type = typeRaw.includes('Satış') ? 'Satış' : 'Tahsilat';
                const description = cells[4].textContent.trim();
                const quantity = cells[5].textContent.trim();
                const amount = cells[6].textContent.trim();
                const balance = cells[7].textContent.trim();
                
                transactionRows.push({
                    date: `${day}.${month}.${year}`,
                    type: type,
                    description: description,
                    quantity: quantity,
                    amount: amount,
                    balance: balance
                });
            }
        });
        
        // Toplamları hesapla (ana ekrandaki tablodan)
        let totalSales = 0;
        let totalPayments = 0;
        
        transactionRows.forEach(row => {
            const amountText = row.amount.replace(/[^\d,]/g, '').replace(',', '.');
            const amount = parseFloat(amountText) || 0;
            
            if (row.type.includes('Satış')) {
                totalSales += amount;
            } else if (row.type.includes('Tahsilat')) {
                totalPayments += amount;
            }
        });
        
        const netBalance = totalSales - totalPayments;
        const paymentRate = totalSales > 0 ? ((totalPayments / totalSales) * 100) : 0;
        
        // İstatistikleri hesapla
        const salesCount = transactionRows.filter(row => row.type.includes('Satış')).length;
        const paymentCount = transactionRows.filter(row => row.type.includes('Tahsilat')).length;
        const totalTransactionCount = transactionRows.length;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="tr">
                <head>
                <meta charset="UTF-8">
                <title>Cari Hesap Özeti - ${currentDateStr}</title>
                    <style>
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        margin: 0; 
                        padding: 0;
                        background: white;
                        color: #333;
                        font-size: 12px;
                        line-height: 1.4;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 25px;
                        padding-bottom: 15px;
                        border-bottom: 3px solid #4299e1;
                    }
                    .company-name {
                                 font-size: 26px;
                        font-weight: bold;
                        color: #2d3748;
                        margin-bottom: 5px;
                    }
                    .report-title {
                                 font-size: 20px;
                        color: #4a5568;
                                 margin-bottom: 8px;
                    }
                    .report-date {
                        font-size: 14px;
                        color: #718096;
                    }
                    .summary-cards {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        margin-bottom: 20px;
                    }
                    .summary-card {
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 8px;
                        border: 1px solid #e2e8f0;
                        text-align: center;
                    }
                    .summary-card-title {
                        font-size: 11px;
                        color: #718096;
                        margin-bottom: 5px;
                        font-weight: 600;
                    }
                    .summary-card-value {
                        font-size: 16px;
                        font-weight: bold;
                        color: #2d3748;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    .stat-item {
                        background: white;
                        padding: 10px;
                        border: 1px solid #e2e8f0;
                        border-radius: 6px;
                        text-align: center;
                    }
                    .stat-label {
                        font-size: 10px;
                        color: #718096;
                        margin-bottom: 3px;
                    }
                    .stat-value {
                        font-size: 14px;
                        font-weight: bold;
                        color: #2d3748;
                    }
                    .customer-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        background: white;
                        border-radius: 6px;
                        overflow: hidden;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }
                    .customer-table th {
                        background: #4a5568;
                        color: white;
                        padding: 8px 6px;
                        text-align: left;
                        font-size: 10px;
                        font-weight: 600;
                    }
                    .customer-table td {
                        padding: 6px;
                        border-bottom: 1px solid #e2e8f0;
                        font-size: 10px;
                    }
                    .customer-table tr:last-child td {
                        border-bottom: none;
                    }
                    .positive { color: #38a169; font-weight: bold; }
                    .negative { color: #e53e3e; font-weight: bold; }
                    .neutral { color: #718096; font-weight: bold; }
                    .footer {
                        margin-top: 25px;
                        padding-top: 15px;
                        border-top: 1px solid #e2e8f0;
                        font-size: 10px;
                        color: #718096;
                        text-align: center;
                    }
                    @media print {
                        body { margin: 0; padding: 10px; }
                        .no-print { display: none; }
                        .summary-cards { grid-template-columns: 1fr 1fr; }
                        .stats-grid { grid-template-columns: repeat(3, 1fr); }
                    }
                    </style>
                </head>
                <body>
                <div class="header">
                    <div class="company-name">ETIC AJANS</div>
                    <div class="report-title">📊 CARI HESAP OZETI</div>
                    <div class="report-date">${currentDateStr} - ${currentTime}</div>
                </div>
                
                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="summary-card-title">💰 Toplam Satis</div>
                        <div class="summary-card-value">${formatMoney(totalSales)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-card-title">💳 Toplam Tahsilat</div>
                        <div class="summary-card-value">${formatMoney(totalPayments)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-card-title">⚖️ Net Bakiye</div>
                        <div class="summary-card-value">${formatMoney(netBalance)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-card-title">📊 Tahsilat Orani</div>
                        <div class="summary-card-value">${paymentRate.toFixed(2)}%</div>
                    </div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">Toplam Satis Sayisi</div>
                        <div class="stat-value">${salesCount}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Toplam Tahsilat Sayisi</div>
                        <div class="stat-value">${paymentCount}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Toplam Islem Sayisi</div>
                        <div class="stat-value">${totalTransactionCount}</div>
                    </div>
                </div>
                
                <table class="customer-table">
                    <thead>
                        <tr>
                            <th>Gün</th>
                            <th>Ay</th>
                            <th>Yıl</th>
                            <th>Tür</th>
                            <th>Açıklama</th>
                            <th>Miktar</th>
                            <th>Tutar</th>
                            <th>Bakiye</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transactionRows.map((transaction, index) => {
                            return `
                                <tr>
                                    <td>${transaction.date.split('.')[0]}</td>
                                    <td>${transaction.date.split('.')[1]}</td>
                                    <td>${transaction.date.split('.')[2]}</td>
                                    <td>${transaction.type}</td>
                                    <td>${transaction.description}</td>
                                    <td>${transaction.quantity}</td>
                                    <td>${transaction.amount}</td>
                                    <td>${transaction.balance}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    <div>Bu rapor Etic Ajans Veresiye Takip Sistemi tarafindan otomatik olarak olusturulmustur.</div>
                    <div>Sayfa: 1/1 - ${currentDateStr} ${currentTime}</div>
                </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        
        // Yazdırma işlemini başlat
        setTimeout(() => {
        printWindow.print();
            printWindow.close();
        }, 500);
        
        showMessage('🖨️ Yazdırma penceresi açıldı', 'success');
        
    } catch (error) {
        console.error('Yazdırma hatası:', error);
        showMessage('Yazdırma sırasında hata oluştu', 'error');
    }
}

// Türkçe karakterleri PDF için düzenle - Geliştirilmiş versiyon
function fixTurkishCharsForPDF(text) {
    if (!text) return text;
    return text
        // Türkçe karakterleri düzelt
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'I')
        .replace(/ğ/g, 'g')
        .replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u')
        .replace(/Ü/g, 'U')
        .replace(/ş/g, 's')
        .replace(/Ş/g, 'S')
        .replace(/ö/g, 'o')
        .replace(/Ö/g, 'O')
        .replace(/ç/g, 'c')
        .replace(/Ç/g, 'C')
        // Bozuk karakterleri düzelt
        .replace(/Ø/g, 'O')
        .replace(/1_/g, 'ış')
        .replace(/1/g, 'ı')
        .replace(/_/g, 'ş')
        .replace(/\^ti\./g, 'Şti.')
        .replace(/Dan1_manl1k/g, 'Danışmanlık')
        .replace(/Mü_teri/g, 'Müşteri')
        .replace(/°/g, 'o')
        .replace(/§/g, 's')
        .replace(/=/g, '')
        .replace(/Ü/g, 'U')
        .replace(/3/g, 'i')
        .trim();
}

// Bakiye raporunu PDF'e aktar
function exportBalanceToPDF() {
    // Seçili müşteri kontrolü
    if (!currentCustomer) {
        showMessage('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    
    try {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        const currentDateStr = currentDate.toLocaleDateString('tr-TR');
        
        // Ana ekrandaki tablodan direkt veri çek
        const mainTableBody = document.getElementById('sales-table-body');
        if (!mainTableBody) {
            showMessage('Ana ekrandaki tablo bulunamadı. Lütfen müşteriyi tekrar seçin.', 'warning');
            return;
        }
        
        const customerName = currentCustomer.name;
        
        // Ana ekrandaki tablodan satırları al
        const tableRows = mainTableBody.querySelectorAll('tr');
        const transactionRows = [];
        
        // Her satırdan veri çıkar
        tableRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 8 && !row.classList.contains('no-data')) {
                const day = cells[0].textContent.trim();
                const month = cells[1].textContent.trim();
                const year = cells[2].textContent.trim();
                const typeRaw = cells[3].textContent.trim();
                const type = typeRaw.includes('Satış') ? 'Satış' : 'Tahsilat';
                const description = cells[4].textContent.trim();
                const quantity = cells[5].textContent.trim();
                const amount = cells[6].textContent.trim();
                const balance = cells[7].textContent.trim();
                
                transactionRows.push({
                    date: `${day}.${month}.${year}`,
                    type: type,
                    description: description,
                    quantity: quantity,
                    amount: amount,
                    balance: balance
                });
            }
        });
        
        // Toplamları hesapla (ana ekrandaki tablodan)
        let totalSales = 0;
        let totalPayments = 0;
        
        transactionRows.forEach(row => {
            const amountText = row.amount.replace(/[^\d,]/g, '').replace(',', '.');
            const amount = parseFloat(amountText) || 0;
            
            if (row.type.includes('Satış')) {
                totalSales += amount;
            } else if (row.type.includes('Tahsilat')) {
                totalPayments += amount;
            }
        });
        
        const netBalance = totalSales - totalPayments;
        const paymentRate = totalSales > 0 ? ((totalPayments / totalSales) * 100) : 0;
        
        // İstatistikleri hesapla
        const salesCount = transactionRows.filter(row => row.type.includes('Satış')).length;
        const paymentCount = transactionRows.filter(row => row.type.includes('Tahsilat')).length;
        const totalTransactionCount = transactionRows.length;
        
        // PDF oluştur
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Türkçe karakter desteği için font ayarları
        doc.setFont('helvetica', 'normal');
        
        // Sayfa boyutları
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPosition = 20;
        
        // Profesyonel başlık tasarımı
        doc.setFillColor(74, 85, 104);
        doc.rect(0, 0, pageWidth, 30, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('ETIC AJANS', pageWidth / 2, 12, { align: 'center' });
        
        doc.setFontSize(18);
        doc.text(`${fixTurkishCharsForPDF(customerName)} - CARI HESAP OZETI`, pageWidth / 2, 20, { align: 'center' });
        
        doc.setTextColor(0, 0, 0);
        yPosition = 40;
        
        // Rapor bilgileri kutusu
        doc.setFillColor(248, 249, 250);
        doc.rect(20, yPosition, pageWidth - 40, 15, 'F');
        doc.setFontSize(14);
        doc.text(`Rapor Tarihi: ${currentDateStr} ${currentTime}`, 25, yPosition + 8);
        doc.text(`Musteri: ${fixTurkishCharsForPDF(customerName)}`, 25, yPosition + 12);
        yPosition += 25;
        
        // Finansal özet tablosu
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('FINANSAL OZET', 20, yPosition);
        yPosition += 10;
        
        const summaryData = [
            ['Toplam Satis', formatMoney(totalSales)],
            ['Toplam Tahsilat', formatMoney(totalPayments)],
            ['Net Bakiye', formatMoney(netBalance)],
            ['Tahsilat Orani', `${paymentRate.toFixed(2)}%`]
        ];
        
        doc.autoTable({
            startY: yPosition,
            head: [['Kategori', 'Tutar']],
            body: summaryData,
            theme: 'striped',
            headStyles: { 
                fillColor: [74, 85, 104],
                textColor: [255, 255, 255],
                fontSize: 13,
                fontStyle: 'bold'
            },
            styles: { 
                fontSize: 12,
                cellPadding: 4
            },
            columnStyles: {
                0: { cellWidth: 60, halign: 'left' },
                1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250]
            }
        });
        
        yPosition = doc.lastAutoTable.finalY + 15;
        
        // İstatistikler
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('ISLEM ISTATISTIKLERI', 20, yPosition);
        yPosition += 10;
        
        const statsData = [
            ['Toplam Satis Sayisi', salesCount.toString()],
            ['Toplam Tahsilat Sayisi', paymentCount.toString()],
            ['Toplam Islem Sayisi', totalTransactionCount.toString()]
        ];
        
        doc.autoTable({
            startY: yPosition,
            head: [['Istatistik', 'Deger']],
            body: statsData,
            theme: 'striped',
            headStyles: { 
                fillColor: [74, 85, 104],
                textColor: [255, 255, 255],
                fontSize: 11,
                fontStyle: 'bold'
            },
            styles: { 
                fontSize: 11,
                cellPadding: 4
            },
            columnStyles: {
                0: { cellWidth: 60, halign: 'left' },
                1: { cellWidth: 40, halign: 'center' }
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250]
            }
        });
        
        yPosition = doc.lastAutoTable.finalY + 15;
        
        // İşlem dökümü
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('ISLEM DOKUMU', 20, yPosition);
        yPosition += 10;
        
        const transactionData = transactionRows.map((row, index) => {
            return [
                row.date.split('.')[0], // Gün
                row.date.split('.')[1], // Ay
                row.date.split('.')[2], // Yıl
                fixTurkishCharsForPDF(row.type),
                fixTurkishCharsForPDF(row.description),
                row.quantity,
                row.amount,
                row.balance
            ];
        });
        
        doc.autoTable({
            startY: yPosition,
            head: [['Gün', 'Ay', 'Yıl', 'Tür', 'Açıklama', 'Miktar', 'Tutar', 'Bakiye']],
            body: transactionData,
            theme: 'striped',
            headStyles: { 
                fillColor: [74, 85, 104],
                textColor: [255, 255, 255],
                fontSize: 11,
                fontStyle: 'bold'
            },
            styles: { 
                fontSize: 10,
                cellPadding: 3
            },
            columnStyles: {
                0: { cellWidth: 20, halign: 'center' }, // Gün
                1: { cellWidth: 20, halign: 'center' }, // Ay
                2: { cellWidth: 30, halign: 'center' }, // Yıl
                3: { cellWidth: 30, halign: 'left' },   // Tür
                4: { cellWidth: 40, halign: 'left' },   // Açıklama
                5: { cellWidth: 25, halign: 'center' }, // Miktar
                6: { cellWidth: 30, halign: 'right' },  // Tutar
                7: { cellWidth: 30, halign: 'right' }   // Bakiye
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250]
            },
            didDrawPage: function (data) {
                // Sayfa numarası
                const pageCount = doc.internal.getNumberOfPages();
                const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text(`Sayfa ${currentPage} / ${pageCount}`, pageWidth - 20, pageHeight - 10);
            }
        });
        
        // Alt bilgi
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Bu rapor Etic Ajans Veresiye Takip Sistemi tarafindan otomatik olarak olusturulmustur.', pageWidth / 2, finalY, { align: 'center' });
        doc.text(`Olusturulma Tarihi: ${currentDateStr} ${currentTime}`, pageWidth / 2, finalY + 5, { align: 'center' });
        
        // PDF'i indir
        const fileName = `${customerName.replace(/[^a-zA-Z0-9]/g, '_')}_Cari_Hesap_Ozeti_${currentDateStr.replace(/\./g, '_')}.pdf`;
        doc.save(fileName);
        
        showMessage('📄 PDF dosyası başarıyla indirildi', 'success');
        
    } catch (error) {
        console.error('PDF export hatası:', error);
        showMessage('PDF export sırasında hata oluştu', 'error');
    }
}

// Bakiye raporunu Excel'e aktar
function exportBalanceToExcel() {
    // Seçili müşteri kontrolü
    if (!currentCustomer) {
        showMessage('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    
    try {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        const currentDateStr = currentDate.toLocaleDateString('tr-TR');
        
        // Ana ekrandaki tablodan direkt veri çek
        const mainTableBody = document.getElementById('sales-table-body');
        if (!mainTableBody) {
            showMessage('Ana ekrandaki tablo bulunamadı. Lütfen müşteriyi tekrar seçin.', 'warning');
            return;
        }
        
        const customerName = currentCustomer.name;
        
        // Ana ekrandaki tablodan satırları al
        const tableRows = mainTableBody.querySelectorAll('tr');
        const transactionRows = [];
        
        // Her satırdan veri çıkar
        tableRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 8 && !row.classList.contains('no-data')) {
                const day = cells[0].textContent.trim();
                const month = cells[1].textContent.trim();
                const year = cells[2].textContent.trim();
                const typeRaw = cells[3].textContent.trim();
                const type = typeRaw.includes('Satış') ? 'Satış' : 'Tahsilat';
                const description = cells[4].textContent.trim();
                const quantity = cells[5].textContent.trim();
                const amount = cells[6].textContent.trim();
                const balance = cells[7].textContent.trim();
                
                transactionRows.push({
                    date: `${day}.${month}.${year}`,
                    type: type,
                    description: description,
                    quantity: quantity,
                    amount: amount,
                    balance: balance
                });
            }
        });
        
        // Toplamları hesapla (ana ekrandaki tablodan)
        let totalSales = 0;
        let totalPayments = 0;
        
        transactionRows.forEach(row => {
            const amountText = row.amount.replace(/[^\d,]/g, '').replace(',', '.');
            const amount = parseFloat(amountText) || 0;
            
            if (row.type.includes('Satış')) {
                totalSales += amount;
            } else if (row.type.includes('Tahsilat')) {
                totalPayments += amount;
            }
        });
        
        const netBalance = totalSales - totalPayments;
        const paymentRate = totalSales > 0 ? ((totalPayments / totalSales) * 100) : 0;
        
        // İstatistikleri hesapla
        const salesCount = transactionRows.filter(row => row.type.includes('Satış')).length;
        const paymentCount = transactionRows.filter(row => row.type.includes('Tahsilat')).length;
        const totalTransactionCount = transactionRows.length;
        
        // CSV formatında veri oluştur - Profesyonel format
        let csvContent = '\uFEFF'; // UTF-8 BOM
        csvContent += `ETIC AJANS - ${fixTurkishCharsForPDF(customerName)} CARI HESAP OZETI\n`;
        csvContent += `Rapor Tarihi: ${currentDateStr} ${currentTime}\n`;
        csvContent += `Musteri: ${fixTurkishCharsForPDF(customerName)}\n`;
        csvContent += `Rapor No: ${Date.now()}\n\n`;
        
        // Özet kartları - Profesyonel format
        csvContent += '='.repeat(50) + '\n';
        csvContent += 'FINANSAL OZET\n';
        csvContent += '='.repeat(50) + '\n';
        csvContent += 'Kategori,Tutar\n';
        csvContent += `Toplam Satis,"${formatMoney(totalSales)}"\n`;
        csvContent += `Toplam Tahsilat,"${formatMoney(totalPayments)}"\n`;
        csvContent += `Net Bakiye,"${formatMoney(netBalance)}"\n`;
        csvContent += `Tahsilat Orani,"${paymentRate.toFixed(2)}%"\n\n`;
        
        // İstatistikler - Profesyonel format
        csvContent += '='.repeat(50) + '\n';
        csvContent += 'ISLEM ISTATISTIKLERI\n';
        csvContent += '='.repeat(50) + '\n';
        csvContent += 'Istatistik,Deger\n';
        csvContent += `"Toplam Satis Sayisi","${salesCount}"\n`;
        csvContent += `"Toplam Tahsilat Sayisi","${paymentCount}"\n`;
        csvContent += `"Toplam Islem Sayisi","${totalTransactionCount}"\n\n`;
        
        // İşlem dökümü - Ana ekrandaki tablo ile aynı
        csvContent += '='.repeat(80) + '\n';
        csvContent += 'ISLEM DOKUMU\n';
        csvContent += '='.repeat(80) + '\n';
        csvContent += 'Gun,Ay,Yil,Tur,Aciklama,Miktar,Tutar,Bakiye\n';
        
        transactionRows.forEach(row => {
            csvContent += `"${row.date.split('.')[0]}","${row.date.split('.')[1]}","${row.date.split('.')[2]}","${fixTurkishCharsForPDF(row.type)}","${fixTurkishCharsForPDF(row.description)}","${row.quantity}","${row.amount}","${row.balance}"\n`;
        });
        
        csvContent += '\n' + '='.repeat(80) + '\n';
        csvContent += 'Bu rapor Etic Ajans Veresiye Takip Sistemi tarafindan otomatik olarak olusturulmustur.\n';
        csvContent += `Olusturulma Tarihi: ${currentDateStr} ${currentTime}\n`;
        csvContent += '='.repeat(80) + '\n';
        
        // CSV dosyasını indir
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${customerName.replace(/[^a-zA-Z0-9]/g, '_')}_Cari_Hesap_Ozeti_${currentDateStr.replace(/\./g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showMessage('📊 Excel dosyası başarıyla indirildi', 'success');
        
    } catch (error) {
        console.error('Excel export hatası:', error);
        showMessage('Excel export sırasında hata oluştu', 'error');
    }
}

// Bakiye raporunu panoya kopyala
function copyBalanceToClipboard() {
    // Seçili müşteri kontrolü
    if (!currentCustomer) {
        showMessage('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    
    try {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        const currentDateStr = currentDate.toLocaleDateString('tr-TR');
        
        // Ana ekrandaki tablodan direkt veri çek
        const mainTableBody = document.getElementById('sales-table-body');
        if (!mainTableBody) {
            showMessage('Ana ekrandaki tablo bulunamadı. Lütfen müşteriyi tekrar seçin.', 'warning');
            return;
        }
        
        const customerName = currentCustomer.name;
        
        // Ana ekrandaki tablodan satırları al
        const tableRows = mainTableBody.querySelectorAll('tr');
        const transactionRows = [];
        
        // Her satırdan veri çıkar
        tableRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 8 && !row.classList.contains('no-data')) {
                const day = cells[0].textContent.trim();
                const month = cells[1].textContent.trim();
                const year = cells[2].textContent.trim();
                const typeRaw = cells[3].textContent.trim();
                const type = typeRaw.includes('Satış') ? 'Satış' : 'Tahsilat';
                const description = cells[4].textContent.trim();
                const quantity = cells[5].textContent.trim();
                const amount = cells[6].textContent.trim();
                const balance = cells[7].textContent.trim();
                
                transactionRows.push({
                    date: `${day}.${month}.${year}`,
                    type: type,
                    description: description,
                    quantity: quantity,
                    amount: amount,
                    balance: balance
                });
            }
        });
        
        // Toplamları hesapla (ana ekrandaki tablodan)
        let totalSales = 0;
        let totalPayments = 0;
        
        transactionRows.forEach(row => {
            const amountText = row.amount.replace(/[^\d,]/g, '').replace(',', '.');
            const amount = parseFloat(amountText) || 0;
            
            if (row.type.includes('Satış')) {
                totalSales += amount;
            } else if (row.type.includes('Tahsilat')) {
                totalPayments += amount;
            }
        });
        
        const netBalance = totalSales - totalPayments;
        const paymentRate = totalSales > 0 ? ((totalPayments / totalSales) * 100) : 0;
        
        // İstatistikleri hesapla
        const salesCount = transactionRows.filter(row => row.type.includes('Satış')).length;
        const paymentCount = transactionRows.filter(row => row.type.includes('Tahsilat')).length;
        const totalTransactionCount = transactionRows.length;
        
    // Kopyalanacak metni oluştur
    let copyText = `ETIC AJANS - ${customerName} - CARI HESAP OZETI\n`;
    copyText += `Rapor Tarihi: ${currentDateStr} ${currentTime}\n\n`;
    
    copyText += `FINANSAL OZET:\n`;
    copyText += `💰 Toplam Satis: ${formatMoney(totalSales)}\n`;
    copyText += `💳 Toplam Tahsilat: ${formatMoney(totalPayments)}\n`;
    copyText += `⚖️ Net Bakiye: ${formatMoney(netBalance)}\n\n`;
    
    copyText += `MUSTERI ISTATISTIKLERI:\n`;
    copyText += `• Toplam Satis Sayisi: ${salesCount}\n`;
    copyText += `• Toplam Tahsilat Sayisi: ${paymentCount}\n`;
    copyText += `• Toplam Islem Sayisi: ${totalTransactionCount}\n`;
    copyText += `\n`;
    
    copyText += `ISLEM DOKUMU:\n`;
    copyText += `Gun\tAy\tYil\tTur\tAciklama\tMiktar\tTutar\tBakiye\n`;
    copyText += `─`.repeat(80) + `\n`;
    transactionRows.forEach((transaction, index) => {
        copyText += `${transaction.date.split('.')[0]}\t${transaction.date.split('.')[1]}\t${transaction.date.split('.')[2]}\t${transaction.type}\t${transaction.description}\t${transaction.quantity}\t${transaction.amount}\t${transaction.balance}\n`;
    });
    
    copyText += `\nBu rapor Etic Ajans Veresiye Takip Sistemi tarafindan otomatik olarak olusturulmustur.`;
        
        // Clipboard API kullanarak kopyala
        if (navigator.clipboard) {
            navigator.clipboard.writeText(copyText).then(() => {
                showMessage('📋 Rapor panoya kopyalandı', 'success');
            }).catch(() => {
                fallbackCopyToClipboard(copyText);
            });
        } else {
            fallbackCopyToClipboard(copyText);
        }
        
    } catch (error) {
        console.error('Kopyalama hatası:', error);
        showMessage('Kopyalama sırasında hata oluştu', 'error');
    }
}

// Fallback kopyalama yöntemi
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showMessage('📋 Rapor panoya kopyalandı', 'success');
    } catch (err) {
        showMessage('❌ Kopyalama başarısız oldu', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Gelişmiş Raporlar Modal
function showReportsModal() {
    const modalHtml = `
        <div id="reports-modal" class="modal active">
            <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>📊 Raporlar ve Analizler</h2>
                    <button class="close-btn" onclick="closeModal('reports-modal')">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <!-- Rapor Kategorileri -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 30px;">
                        <!-- Sol Kolon - Finansal Raporlar -->
                        <div class="report-category">
                            <h3 style="color: #2d3748; margin-bottom: 15px; font-size: 16px; font-weight: 600; border-bottom: 2px solid #4299e1; padding-bottom: 8px;">
                                💰 Finansal Raporlar
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <button class="report-btn primary" onclick="generateFinancialReport()">
                                    <span class="report-icon">📈</span>
                                    <div class="report-content">
                                        <div class="report-title">Finansal Özet Raporu</div>
                                        <div class="report-desc">Toplam satış, tahsilat ve bakiye analizi</div>
                                    </div>
                                </button>
                                <button class="report-btn secondary" onclick="generateCustomerReport()">
                                    <span class="report-icon">👥</span>
                                    <div class="report-content">
                                        <div class="report-title">Müşteri Analiz Raporu</div>
                                        <div class="report-desc">Müşteri bazlı borç ve ödeme analizi</div>
                                    </div>
                                </button>
                                <button class="report-btn secondary" onclick="generateTransactionReport()">
                                    <span class="report-icon">📋</span>
                                    <div class="report-content">
                                        <div class="report-title">İşlem Detay Raporu</div>
                                        <div class="report-desc">Tüm işlemlerin detaylı listesi</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Sağ Kolon - Analiz Raporları -->
                        <div class="report-category">
                            <h3 style="color: #2d3748; margin-bottom: 15px; font-size: 16px; font-weight: 600; border-bottom: 2px solid #38a169; padding-bottom: 8px;">
                                📊 Analiz Raporları
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <button class="report-btn secondary" onclick="generateDebtReport()">
                                    <span class="report-icon">💳</span>
                                    <div class="report-content">
                                        <div class="report-title">Borç Analiz Raporu</div>
                                        <div class="report-desc">Müşteri borçları ve risk analizi</div>
                                    </div>
                                </button>
                                <button class="report-btn secondary" onclick="generateMonthlyReport()">
                                    <span class="report-icon">📅</span>
                                    <div class="report-content">
                                        <div class="report-title">Aylık Performans Raporu</div>
                                        <div class="report-desc">Aylık satış ve tahsilat performansı</div>
                                    </div>
                                </button>
                                <button class="report-btn secondary" onclick="generateProductReport()">
                                    <span class="report-icon">📦</span>
                                    <div class="report-content">
                                        <div class="report-title">Ürün Satış Raporu</div>
                                        <div class="report-desc">Ürün bazlı satış analizi</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Hızlı İşlemler -->
                    <div style="margin-top: 30px; padding-top: 25px; border-top: 2px solid #e2e8f0;">
                        <h3 style="color: #2d3748; margin-bottom: 15px; font-size: 16px; font-weight: 600; border-bottom: 2px solid #ed8936; padding-bottom: 8px;">
                            ⚡ Hızlı İşlemler
                        </h3>
                        <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                            <button class="quick-btn excel" onclick="exportAllToExcel()">
                                <span>📊</span> Excel'e Aktar
                            </button>
                            <button class="quick-btn pdf" onclick="exportAllToPDF()">
                                <span>📄</span> PDF'e Aktar
                            </button>
                            <button class="quick-btn print" onclick="printAllReports()">
                                <span>🖨️</span> Yazdır
                            </button>
                            <button class="quick-btn refresh" onclick="refreshReports()">
                                <span>🔄</span> Yenile
                            </button>
                        </div>
                    </div>
                    
                    <!-- Rapor Ayarları -->
                    <div style="margin-top: 30px; padding-top: 25px; border-top: 2px solid #e2e8f0;">
                        <h3 style="color: #2d3748; margin-bottom: 15px; font-size: 16px; font-weight: 600; border-bottom: 2px solid #9f7aea; padding-bottom: 8px;">
                            ⚙️ Rapor Ayarları
                        </h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #4a5568;">Tarih Aralığı:</label>
                                <div style="display: flex; gap: 10px;">
                                    <input type="date" id="report-start-date" style="flex: 1; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">
                                    <span style="align-self: center; color: #718096;">→</span>
                                    <input type="date" id="report-end-date" style="flex: 1; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">
                </div>
            </div>
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #4a5568;">Rapor Formatı:</label>
                                <select id="report-format" style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">
                                    <option value="excel">Excel (.xlsx)</option>
                                    <option value="pdf">PDF (.pdf)</option>
                                    <option value="csv">CSV (.csv)</option>
                                </select>
        </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
        .report-btn {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 15px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
            width: 100%;
            background: #f7fafc;
            border: 1px solid #e2e8f0;
        }
        
        .report-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .report-btn.primary {
            background: linear-gradient(135deg, #4299e1, #3182ce);
            color: white;
        }
        
        .report-btn.secondary {
            background: linear-gradient(135deg, #f7fafc, #edf2f7);
            color: #2d3748;
        }
        
        .report-btn.secondary:hover {
            background: linear-gradient(135deg, #edf2f7, #e2e8f0);
        }
        
        .report-icon {
            font-size: 24px;
            min-width: 30px;
        }
        
        .report-content {
            flex: 1;
        }
        
        .report-title {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 4px;
        }
        
        .report-desc {
            font-size: 12px;
            opacity: 0.8;
        }
        
        .quick-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        
        .quick-btn.excel {
            background: linear-gradient(135deg, #38a169, #2f855a);
            color: white;
        }
        
        .quick-btn.pdf {
            background: linear-gradient(135deg, #e53e3e, #c53030);
            color: white;
        }
        
        .quick-btn.print {
            background: linear-gradient(135deg, #ed8936, #dd6b20);
            color: white;
        }
        
        .quick-btn.refresh {
            background: linear-gradient(135deg, #9f7aea, #805ad5);
            color: white;
        }
        
        .quick-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        </style>
    `;
    
    // Modal'ı göster veya oluştur
    showOrCreateModal('reports-modal', modalHtml);
    
    // Tarih aralığını varsayılan olarak son 30 gün yap
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Modal oluşturulduktan sonra tarih alanlarını ayarla
    setTimeout(() => {
        const startDateInput = document.getElementById('report-start-date');
        const endDateInput = document.getElementById('report-end-date');
        if (startDateInput) startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
        if (endDateInput) endDateInput.value = today.toISOString().split('T')[0];
    }, 100);
}

// Ürün Yönetimi Modal - Basit Eski Tasarım
async function showProductManagement() {
    try {
        // Yeni ürün modülündeki fonksiyonu kullan
        if (typeof window.showProductManagementModule === 'function') {
            window.showProductManagementModule();
        } else {
            // Fallback: Basit modal göster
            const products = await window.electronAPI.getProducts();
            
            const modalHtml = `
                <div id="product-management-modal" class="modal active" onclick="if(event.target.id === 'product-management-modal') closeModal('product-management-modal')">
                    <div class="modal-content" style="max-width: 1000px;" onclick="event.stopPropagation()">
                        <div class="modal-header">
                            <h2>📋 Ürün Yönetimi</h2>
                            <button class="close-btn" onclick="closeModal('product-management-modal')">&times;</button>
                        </div>
                        
                        <div style="padding: 20px;">
                            <!-- Basit Butonlar -->
                            <div style="margin-bottom: 20px;">
                                <button onclick="showAddProductModal()" class="btn btn-primary" style="margin-right: 10px;">
                                    ➕ Yeni Ürün Ekle
                                </button>
                                <button onclick="exportProductsToExcel()" class="btn btn-secondary" style="margin-right: 10px;">
                                    📊 Excel'e Aktar
                                </button>
                                <button onclick="printProducts()" class="btn btn-secondary">
                                    🖨️ Yazdır
                                </button>
                            </div>
                            
                            <!-- Basit Arama -->
                            <div style="margin-bottom: 20px;">
                                <input type="text" id="product-search" placeholder="Ürün ara..." 
                                       style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;"
                                       onkeyup="filterProducts()">
                            </div>
                            
                            <!-- Basit Tablo -->
                            <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead style="background: #f5f5f5;">
                                        <tr>
                                            <th style="padding: 10px; border: 1px solid #ddd;">Ürün Adı</th>
                                            <th style="padding: 10px; border: 1px solid #ddd;">Kod</th>
                                            <th style="padding: 10px; border: 1px solid #ddd;">Fiyat</th>
                                            <th style="padding: 10px; border: 1px solid #ddd;">Stok</th>
                                            <th style="padding: 10px; border: 1px solid #ddd;">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody id="products-table-body">
                                        ${products.map(product => `
                                            <tr>
                                                <td style="padding: 10px; border: 1px solid #ddd;">${product.name || '-'}</td>
                                                <td style="padding: 10px; border: 1px solid #ddd;">${product.code || '-'}</td>
                                                <td style="padding: 10px; border: 1px solid #ddd;">${product.price ? product.price.toFixed(2) + ' ₺' : '-'}</td>
                                                <td style="padding: 10px; border: 1px solid #ddd;">${product.stock || '-'}</td>
                                                <td style="padding: 10px; border: 1px solid #ddd;">
                                                    <button onclick="editProduct(${product.id})" class="btn btn-sm" style="margin-right: 5px;">Düzenle</button>
                                                    <button onclick="deleteProduct(${product.id})" class="btn btn-sm btn-danger">Sil</button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div style="margin-top: 20px; text-align: center; color: #666;">
                                Toplam ${products.length} ürün
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            showOrCreateModal('product-management-modal', modalHtml);
        }
        
    } catch (error) {
        console.error('Product management modal error:', error);
        showMessage('Ürünler yüklenirken hata oluştu', 'error');
    }
}

// Ürün filtreleme
function filterProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    const rows = document.querySelectorAll('#products-table-body tr');
    
    rows.forEach(row => {
        const productName = row.querySelector('td:first-child div:first-child').textContent.toLowerCase();
        const productCode = row.querySelector('td:nth-child(2) div:first-child').textContent.toLowerCase();
        const productBarcode = row.querySelector('td:nth-child(2) div:last-child').textContent.toLowerCase();
        const productCategory = row.querySelector('td:nth-child(6) span').textContent.toLowerCase();
        const productStatus = row.querySelector('td:nth-child(7) span').textContent.toLowerCase();
        const stockText = row.querySelector('td:nth-child(3) div:first-child').textContent;
        const stock = parseFloat(stockText);
        const minStockText = row.querySelector('td:nth-child(3) div:last-child');
        const isLowStock = minStockText && minStockText.textContent.includes('Düşük Stok');
        
        let showRow = true;
        
        // Arama filtresi
        if (searchTerm && !productName.includes(searchTerm) && !productCode.includes(searchTerm) && !productBarcode.includes(searchTerm)) {
            showRow = false;
        }
        
        // Kategori filtresi
        if (categoryFilter && !productCategory.includes(categoryFilter.toLowerCase())) {
            showRow = false;
        }
        
        // Durum filtresi
        if (statusFilter) {
            if (statusFilter === 'active' && !productStatus.includes('aktif')) {
                showRow = false;
            } else if (statusFilter === 'inactive' && !productStatus.includes('pasif')) {
                showRow = false;
            } else if (statusFilter === 'low-stock' && !isLowStock) {
                showRow = false;
            }
        }
        
        row.style.display = showRow ? '' : 'none';
    });
}

// Filtreleri temizle
function clearProductFilters() {
    document.getElementById('product-search').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('status-filter').value = '';
    filterProducts();
}

// ESKİ ÜRÜN DÜZENLEME FONKSİYONU KALDIRILDI - product-module.js kullanılıyor

// ESKİ handleEditProduct FONKSİYONU KALDIRILDI - product-module.js kullanılıyor

// Ürün silme
async function deleteProduct(productId) {
    // Admin kontrolü
    if (!window.currentUser || window.currentUser.role !== 'admin') {
        showMessage('Bu işlem için admin yetkisi gereklidir', 'error');
        return;
    }
    
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        await window.ipcRenderer.invoke('delete-product', productId);
        showMessage('✅ Ürün başarıyla silindi', 'success');
        
        // Satış ekranındaki ürün seçimini güncelle (silinen ürünü kaldır)
        if (typeof updateSaleProductSelectAfterDelete === 'function') {
            updateSaleProductSelectAfterDelete(productId);
        }
        
        // Ürün yönetimi modal'ını yenile
        closeModal('product-management-modal');
        setTimeout(() => showProductManagement(), 100);
        
    } catch (error) {
        console.error('Delete product error:', error);
        showMessage('Ürün silinirken hata oluştu', 'error');
    }
}

// ESKİ ÜRÜN EKLEME MODAL'I KALDIRILDI - product-module.js kullanılıyor

// Ürünleri Excel'e aktar
async function exportProductsToExcel() {
    try {
        const products = await window.ipcRenderer.invoke('get-products');
        
        let csvContent = 'Ürün Adı,Kod,Barkod,Birim,Alış Fiyatı,Satış Fiyatı,KDV Oranı,Stok,Min Stok,Kategori,Açıklama,Durum\n';
        
        products.forEach(product => {
            csvContent += `"${product.name}","${product.code || ''}","${product.barcode || ''}","${product.unit}","${product.purchase_price}","${product.sale_price}","${product.vat_rate}","${product.stock}","${product.min_stock}","${product.category || ''}","${product.description || ''}","${product.is_active ? 'Aktif' : 'Pasif'}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `urunler_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showMessage('✅ Ürünler Excel dosyasına aktarıldı', 'success');
        
    } catch (error) {
        console.error('Export products error:', error);
        showMessage('Ürünler aktarılırken hata oluştu', 'error');
    }
}

// Ürünleri yazdır
function printProducts() {
    const printWindow = window.open('', '_blank');
    const products = Array.from(document.querySelectorAll('#products-table-body tr')).map(row => {
        const cells = row.querySelectorAll('td');
        return {
            name: cells[0].querySelector('div:first-child').textContent,
            code: cells[1].querySelector('div:first-child').textContent.replace('Kod: ', ''),
            barcode: cells[1].querySelector('div:last-child').textContent.replace('Barkod: ', ''),
            stock: cells[2].querySelector('div:first-child').textContent,
            purchasePrice: cells[3].querySelector('div:first-child').textContent.replace('Alış: ', ''),
            salePrice: cells[3].querySelector('div:last-child').textContent.replace('Satış: ', ''),
            vatRate: cells[4].querySelector('span').textContent,
            category: cells[5].querySelector('span').textContent,
            status: cells[6].querySelector('span').textContent
        };
    });
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Ürün Listesi</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #374151; text-align: center; margin-bottom: 30px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
                    th { background: #f3f4f6; font-weight: 600; }
                    .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <h1>📋 Ürün Listesi</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Ürün Adı</th>
                            <th>Kod</th>
                            <th>Barkod</th>
                            <th>Stok</th>
                            <th>Alış Fiyatı</th>
                            <th>Satış Fiyatı</th>
                            <th>KDV</th>
                            <th>Kategori</th>
                            <th>Durum</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(product => `
                            <tr>
                                <td>${product.name}</td>
                                <td>${product.code}</td>
                                <td>${product.barcode}</td>
                                <td>${product.stock}</td>
                                <td>${product.purchasePrice}</td>
                                <td>${product.salePrice}</td>
                                <td>${product.vatRate}</td>
                                <td>${product.category}</td>
                                <td>${product.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="summary">
                    <h3>📊 Özet Bilgiler</h3>
                    <p><strong>Toplam Ürün:</strong> ${products.length}</p>
                    <p><strong>Aktif Ürün:</strong> ${products.filter(p => p.status.includes('Aktif')).length}</p>
                    <p><strong>Pasif Ürün:</strong> ${products.filter(p => p.status.includes('Pasif')).length}</p>
                </div>
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// Ayarlar Modal - Profesyonel Versiyon
async function showSettingsModal() {
    try {
        // Mevcut firma ayarlarını getir
        const companySettings = await window.ipcRenderer.invoke('get-company-settings');
        
    const modalHtml = `
            <div id="settings-modal" class="modal active" onclick="if(event.target.id === 'settings-modal') closeModal('settings-modal')">
                <div class="modal-content" style="max-width: 1200px; max-height: 90vh; overflow-y: auto;" onclick="event.stopPropagation()">
                <div class="modal-header">
                        <h2>⚙️ Ayarlar</h2>
                    <button class="close-btn" onclick="closeModal('settings-modal')">&times;</button>
                </div>
                    
                <div style="padding: 20px;">
                    <!-- Sekme Navigasyonu -->
                    <div style="display: flex; gap: 0; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb;">
                        <button onclick="switchSettingsTab('company')" id="company-tab-btn" 
                                style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px 8px 0 0; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s;">
                            🏢 Firma Ayarları
                        </button>
                        <button onclick="switchSettingsTab('users')" id="users-tab-btn" 
                                style="padding: 12px 24px; background: #f3f4f6; color: #6b7280; border: none; border-radius: 8px 8px 0 0; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s;">
                            👥 Kullanıcı Yönetimi
                        </button>
                        ${window.currentUser && window.currentUser.role === 'admin' ? 
                            '<button onclick="switchSettingsTab(\'system\')" id="system-tab-btn" style="padding: 12px 24px; background: #f3f4f6; color: #6b7280; border: none; border-radius: 8px 8px 0 0; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s;">🔧 Sistem Ayarları</button>' : 
                            ''
                        }
                    </div>
                    
                    <!-- Sekme İçerikleri -->
                    <div id="settings-tab-content">
                        <!-- Firma Ayarları Sekmesi -->
                        <div id="company-tab-content" class="settings-tab-content">
                            <!-- Firma Bilgileri -->
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
                                <h3 style="margin: 0 0 10px 0; font-size: 18px;">🏢 Firma Bilgileri</h3>
                                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Bu bilgiler tüm raporlarda ve faturalarda görünecektir</p>
                            </div>
                        
                        <form id="company-settings-form" onsubmit="saveCompanySettings(event)">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <!-- Sol Kolon -->
                        <div>
                                    <div style="margin-bottom: 15px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Firma Adı *</label>
                                        <input type="text" id="company_name" name="company_name" value="${companySettings.company_name || ''}" 
                                               style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" required>
                                </div>
                                    
                                    <div style="margin-bottom: 15px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Firma Kodu</label>
                                        <input type="text" id="company_code" name="company_code" value="${companySettings.company_code || ''}" 
                                               style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                </div>
                                    
                                    <div style="margin-bottom: 15px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Vergi Numarası</label>
                                        <input type="text" id="tax_number" name="tax_number" value="${companySettings.tax_number || ''}" 
                                               style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                    </div>
                                    
                                    <div style="margin-bottom: 15px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Vergi Dairesi</label>
                                        <input type="text" id="tax_office" name="tax_office" value="${companySettings.tax_office || ''}" 
                                               style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                    </div>
                                    
                                    <div style="margin-bottom: 15px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Adres</label>
                                        <textarea id="address" name="address" rows="3" 
                                                  style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; resize: vertical;">${companySettings.address || ''}</textarea>
                            </div>
                        </div>
                        
                        <!-- Sağ Kolon -->
                        <div>
                                    <div style="margin-bottom: 15px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Telefon</label>
                                        <input type="tel" id="phone" name="phone" value="${companySettings.phone || ''}" 
                                               style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                    </div>
                                    
                                    <div style="margin-bottom: 15px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">E-posta</label>
                                        <input type="email" id="email" name="email" value="${companySettings.email || ''}" 
                                               style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                    </div>
                                    
                                    <div style="margin-bottom: 15px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Web Sitesi</label>
                                        <input type="url" id="website" name="website" value="${companySettings.website || ''}" 
                                               style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                    </div>
                                    
                                    <div style="margin-bottom: 15px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Logo Seç</label>
                                        <div style="display: flex; gap: 10px; align-items: center;">
                                            <input type="file" id="logo_file" name="logo_file" accept="image/*" 
                                                   style="flex: 1; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" 
                                                   onchange="handleLogoFileSelect(event)">
                                            <button type="button" onclick="document.getElementById('logo_file').click()" 
                                                    style="padding: 10px 15px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                                                📁 Seç
                                            </button>
                                        </div>
                                        <input type="hidden" id="logo_path" name="logo_path" value="${companySettings.logo_path || ''}">
                                        <div id="logo_preview" style="margin-top: 10px; text-align: center;">
                                            ${companySettings.logo_path ? `<img src="${companySettings.logo_path}" style="max-width: 100px; max-height: 100px; border-radius: 8px; border: 2px solid #e5e7eb;" alt="Logo Preview">` : '<p style="color: #9ca3af; font-size: 12px;">Logo seçilmedi</p>'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Fatura Ayarları -->
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                                <h4 style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">📄 Fatura Ayarları</h4>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <div>
                                        <div style="margin-bottom: 15px;">
                                            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Fatura Başlığı</label>
                                            <textarea id="invoice_header" name="invoice_header" rows="2" 
                                                      style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; resize: vertical;">${companySettings.invoice_header || ''}</textarea>
                                </div>
                                        
                                        <div style="margin-bottom: 15px;">
                                            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Fatura Alt Bilgisi</label>
                                            <textarea id="invoice_footer" name="invoice_footer" rows="2" 
                                                      style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; resize: vertical;">${companySettings.invoice_footer || ''}</textarea>
                                        </div>
                                    </div>
                                    
                                <div>
                                        <div style="margin-bottom: 15px;">
                                            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Para Birimi</label>
                                            <select id="default_currency" name="default_currency" 
                                                    style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                                <option value="TRY" ${companySettings.default_currency === 'TRY' ? 'selected' : ''}>TRY - Türk Lirası</option>
                                                <option value="USD" ${companySettings.default_currency === 'USD' ? 'selected' : ''}>USD - Amerikan Doları</option>
                                                <option value="EUR" ${companySettings.default_currency === 'EUR' ? 'selected' : ''}>EUR - Euro</option>
                                    </select>
                                </div>
                                        
                                        <div style="margin-bottom: 15px;">
                                            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Varsayılan KDV Oranı (%)</label>
                                            <input type="number" id="default_vat_rate" name="default_vat_rate" value="${companySettings.default_vat_rate || 20}" 
                                                   min="0" max="100" step="0.1"
                                                   style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                            </div>
                                        
                                        <div style="margin-bottom: 15px;">
                                            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Fatura Öneki</label>
                                            <input type="text" id="invoice_prefix" name="invoice_prefix" value="${companySettings.invoice_prefix || 'FAT'}" 
                                                   style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                    </div>
                    
                                        <div style="margin-bottom: 15px;">
                                            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Son Fatura Numarası</label>
                                            <input type="number" id="invoice_number" name="invoice_number" value="${companySettings.invoice_number || 1}" 
                                                   min="1"
                                                   style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                        </div>
                                    </div>
                        </div>
                    </div>
                    
                            <!-- Butonlar -->
                            <div style="display: flex; gap: 15px; justify-content: flex-end; margin-top: 30px;">
                                <button type="button" onclick="closeModal('settings-modal')" 
                                        style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                    ❌ İptal
                        </button>
                                <button type="submit" 
                                        style="padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                    💾 Kaydet
                        </button>
                    </div>
                        </form>
                        </div>
                        
                        <!-- Kullanıcı Yönetimi Sekmesi -->
                        <div id="users-tab-content" class="settings-tab-content" style="display: none;">
                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
                                <h3 style="margin: 0 0 10px 0; font-size: 18px;">👥 Kullanıcı Yönetimi</h3>
                                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Sistem kullanıcılarını yönetin ve yetkilendirin</p>
                            </div>
                            
                            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 10px;">
                                <div style="padding: 14px 18px; border-bottom: 1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center;">
                                    <h3 style="margin:0; font-size: 16px; color:#374151;">👥 Kullanıcı Listesi</h3>
                                    <div style="display: flex; gap: 8px;">
                                        ${window.currentUser && window.currentUser.role === 'admin' ? 
                                            '<button onclick="showAddUserModal()" style="padding:8px 12px; background:#10b981; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer;">➕ Yeni Kullanıcı</button>' : 
                                            ''
                                        }
                                        <button onclick="loadUsersList()" style="padding:8px 12px; background:#3b82f6; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer;">🔄 Yenile</button>
                                    </div>
                                </div>
                                <div id="users-list" style="padding: 12px 16px; min-height: 60px;">
                                    <div style="color:#6b7280;">Yükleniyor...</div>
                                </div>
                            </div>
                        </div>
                        
                        ${window.currentUser && window.currentUser.role === 'admin' ? 
                            '<!-- Sistem Ayarları Sekmesi -->' +
                            '<div id="system-tab-content" class="settings-tab-content" style="display: none;">' +
                                '<div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 30px;">' +
                                    '<h3 style="margin: 0 0 10px 0; font-size: 18px;">🔧 Sistem Ayarları</h3>' +
                                    '<p style="margin: 0; font-size: 14px; opacity: 0.9;">Sistem yedekleme ve güncelleme ayarları</p>' +
                                '</div>' : 
                            ''
                        }

                            ${window.currentUser && window.currentUser.role === 'admin' ? 
                                '<!-- Version Control Section - Basit Versiyon -->' +
                                '<div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">' +
                                    '<h4 style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">🔄 Version Kontrol</h4>' +
                                    '<div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">' +
                                        '<h5 style="margin: 0 0 10px 0; color: #374151;">📊 Mevcut Durum</h5>' +
                                        '<p style="margin: 5px 0; font-size: 14px;"><strong>Schema Version:</strong> <span id="current-schema-version">Yükleniyor...</span></p>' +
                                        '<p style="margin: 5px 0; font-size: 14px;"><strong>App Version:</strong> <span id="current-app-version">Yükleniyor...</span></p>' +
                                        '<p style="margin: 5px 0; font-size: 14px;"><strong>Son Migration:</strong> <span id="last-migration-date">Yükleniyor...</span></p>' +
                                        '<p style="margin: 5px 0; font-size: 14px;"><strong>Son Yedek:</strong> <span id="last-backup-date">Yükleniyor...</span></p>' +
                                        '<div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">' +
                                            '<button onclick="createManualBackup()" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">💾 Manuel Yedek</button>' +
                                            '<button onclick="showBackupList()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">📋 Yedek Listesi</button>' +
                                            '<button onclick="showMigrationLogs()" style="padding: 8px 16px; background: #8b5cf6; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">📝 Migration Logları</button>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 15px;">' +
                                        '<h5 style="margin: 0 0 10px 0; color: #374151;">🔄 Version Güncelleme</h5>' +
                                        '<p style="margin: 5px 0; font-size: 14px;"><strong>Mevcut Version:</strong> <span id="current-version">Yükleniyor...</span></p>' +
                                        '<p style="margin: 5px 0; font-size: 14px;"><strong>En Son Version:</strong> <span id="latest-version">Kontrol ediliyor...</span></p>' +
                                        '<p style="margin: 5px 0; font-size: 14px;"><strong>Durum:</strong> <span id="update-status">-</span></p>' +
                                        '<div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">' +
                                            '<button onclick="checkForUpdates()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">🔍 Güncellemeleri Kontrol Et</button>' +
                                            '<button onclick="manualVersionUpdate()" style="padding: 8px 16px; background: #f59e0b; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">🔧 Manuel Version Güncelleme</button>' +
                                            '<button onclick="downloadUpdate()" id="download-btn" style="display: none; padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">⬇️ Güncellemeyi İndir</button>' +
                                            '<button onclick="installUpdate()" id="install-btn" style="display: none; padding: 8px 16px; background: #059669; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">🚀 Güncellemeyi Kur</button>' +
                                            '<button onclick="showUpdateLogs()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">📋 Güncelleme Logları</button>' +
                                        '</div>' +
                                        '<div id="update-progress" style="display: none; margin-top: 15px;">' +
                                            '<div style="background: #e5e7eb; border-radius: 10px; height: 20px; overflow: hidden;">' +
                                                '<div id="progress-fill" style="background: #3b82f6; height: 100%; width: 0%; transition: width 0.3s ease;"></div>' +
                                            '</div>' +
                                            '<div id="progress-text" style="text-align: center; margin-top: 5px; font-size: 12px; color: #6b7280;">İndiriliyor...</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' : 
                                ''
                            }
                        ${window.currentUser && window.currentUser.role === 'admin' ? '</div>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Önce mevcut modal'ı kaldır
    const existingModal = document.getElementById('settings-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Yeni modal'ı oluştur
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.add('active');
    }
    // Kullanıcı listesini yükle
    loadUsersList();
    
    // Version bilgilerini yükle
    loadVersionInfo();
    loadUpdateInfo();
        
    } catch (error) {
        console.error('Settings modal error:', error);
        showMessage('Ayarlar yüklenirken hata oluştu', 'error');
    }
}

// Sekme değiştirme fonksiyonu
function switchSettingsTab(tabName) {
    // Tüm sekme içeriklerini gizle
    const tabContents = document.querySelectorAll('.settings-tab-content');
    tabContents.forEach(content => {
        content.style.display = 'none';
    });
    
    // Tüm sekme butonlarını pasif yap
    const tabButtons = document.querySelectorAll('[id$="-tab-btn"]');
    tabButtons.forEach(btn => {
        btn.style.background = '#f3f4f6';
        btn.style.color = '#6b7280';
    });
    
    // Seçilen sekmeyi aktif yap
    const activeTabContent = document.getElementById(`${tabName}-tab-content`);
    const activeTabButton = document.getElementById(`${tabName}-tab-btn`);
    
    if (activeTabContent) {
        activeTabContent.style.display = 'block';
    }
    
    if (activeTabButton) {
        activeTabButton.style.background = '#667eea';
        activeTabButton.style.color = 'white';
    }
    
    // Kullanıcı sekmesine geçildiğinde kullanıcı listesini yükle
    if (tabName === 'users') {
        loadUsersList();
    }
}

// Logo dosya seçimi
function handleLogoFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        // Dosya tipini kontrol et
        if (!file.type.startsWith('image/')) {
            showMessage('Lütfen geçerli bir resim dosyası seçin', 'error');
            return;
        }
        
        // Dosya boyutunu kontrol et (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showMessage('Dosya boyutu 5MB\'dan küçük olmalıdır', 'error');
            return;
        }
        
        // FileReader ile dosyayı oku
        const reader = new FileReader();
        reader.onload = function(e) {
            // Logo preview'ı güncelle
            const preview = document.getElementById('logo_preview');
            preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100px; max-height: 100px; border-radius: 8px; border: 2px solid #e5e7eb;" alt="Logo Preview">`;
            
            // Base64 verisini hidden input'a kaydet
            document.getElementById('logo_path').value = e.target.result;
            
            showMessage('Logo başarıyla seçildi', 'success');
        };
        
        reader.readAsDataURL(file);
    }
}

// Firma ayarlarını yükle ve header'da göster
async function loadCompanySettings() {
    try {
        const companySettings = await window.ipcRenderer.invoke('get-company-settings');
        
        // Firma adını güncelle
        const companyNameElement = document.getElementById('company-name');
        if (companyNameElement && companySettings.company_name) {
            companyNameElement.textContent = companySettings.company_name;
        }
        
        // Logoyu güncelle
        const logoElement = document.getElementById('company-logo');
        if (logoElement && companySettings.logo_path) {
            logoElement.innerHTML = `<img src="${companySettings.logo_path}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 6px;" alt="Company Logo">`;
        }
        
        console.log('Company settings loaded:', companySettings.company_name);
    } catch (error) {
        console.error('Load company settings error:', error);
    }
}

// Firma ayarlarını kaydet
async function saveCompanySettings(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const settingsData = {
            company_name: formData.get('company_name'),
            company_code: formData.get('company_code'),
            tax_number: formData.get('tax_number'),
            tax_office: formData.get('tax_office'),
            address: formData.get('address'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            website: formData.get('website'),
            logo_path: formData.get('logo_path'),
            invoice_header: formData.get('invoice_header'),
            invoice_footer: formData.get('invoice_footer'),
            default_currency: formData.get('default_currency'),
            default_vat_rate: parseFloat(formData.get('default_vat_rate')),
            invoice_prefix: formData.get('invoice_prefix'),
            invoice_number: parseInt(formData.get('invoice_number'))
        };
        
        const result = await window.ipcRenderer.invoke('update-company-settings', settingsData);
        
        if (result.success) {
            showMessage('✅ Firma ayarları başarıyla kaydedildi', 'success');
            closeModal('settings-modal');
            // Header'ı güncelle
            await loadCompanySettings();
        } else {
            showMessage('❌ Ayarlar kaydedilirken hata oluştu', 'error');
        }
        
    } catch (error) {
        console.error('Save company settings error:', error);
        showMessage('Ayarlar kaydedilirken hata oluştu', 'error');
    }
}

// Rapor fonksiyonları
// Finansal Özet Raporu
// Finansal Özet Raporu
async function generateFinancialReport() {
    try {
        showMessage('💰 Genel finansal özet raporu hazırlanıyor...', 'info');
    closeModal('reports-modal');
        
        // Tüm müşterileri getir
        const customers = await window.ipcRenderer.invoke('get-customers');
        if (!customers || customers.length === 0) {
            showMessage('Müşteri bulunamadı', 'warning');
            return;
        }
        
        // Tüm işlemleri topla
        let totalSales = 0;
        let totalPayments = 0;
        let totalCustomers = customers.length;
        let totalTransactions = 0;
        
        for (const customer of customers) {
            const sales = await window.ipcRenderer.invoke('get-sales', customer.id);
            const purchases = await window.ipcRenderer.invoke('get-purchases', customer.id);
            
            const customerSales = sales.reduce((sum, s) => sum + (s.total_amount || s.amount || 0), 0);
            const customerPayments = purchases.reduce((sum, p) => sum + (p.total_amount || p.amount || 0), 0);
            
            totalSales += customerSales;
            totalPayments += customerPayments;
            totalTransactions += sales.length + purchases.length;
        }
        
        const netBalance = totalSales - totalPayments;
        const paymentRate = totalSales > 0 ? ((totalPayments / totalSales) * 100) : 0;
        
        // Genel finansal rapor modal'ını göster
        showGeneralFinancialModal({
            totalSales,
            totalPayments,
            netBalance,
            paymentRate,
            totalCustomers,
            totalTransactions
        });
        
    } catch (error) {
        console.error('Finansal rapor hatası:', error);
        showMessage('Finansal rapor oluşturulurken hata oluştu', 'error');
    }
}

// Genel Finansal Rapor Modal'ı
function showGeneralFinancialModal(data) {
    const currentDate = new Date();
    const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
    const currentDateStr = currentDate.toLocaleDateString('tr-TR');
    
    const modalHtml = `
        <div id="general-financial-modal" class="modal active" onclick="if(event.target.id === 'general-financial-modal') closeModal('general-financial-modal')">
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>💰 Genel Finansal Özet Raporu</h2>
                    <button onclick="closeModal('general-financial-modal')" class="close-btn">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 10px 0; font-size: 18px;">📊 Genel Durum</h3>
                        <p style="margin: 0; font-size: 14px;">Rapor Tarihi: ${currentDateStr} ${currentTime}</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                            <h4 style="margin: 0 0 5px 0; color: #28a745; font-size: 16px;">💰 Toplam Satış</h4>
                            <p style="margin: 0; font-size: 20px; font-weight: bold; color: #28a745;">${formatMoney(data.totalSales)}</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                            <h4 style="margin: 0 0 5px 0; color: #dc3545; font-size: 16px;">💳 Toplam Tahsilat</h4>
                            <p style="margin: 0; font-size: 20px; font-weight: bold; color: #dc3545;">${formatMoney(data.totalPayments)}</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                            <h4 style="margin: 0 0 5px 0; color: #007bff; font-size: 16px;">⚖️ Net Bakiye</h4>
                            <p style="margin: 0; font-size: 20px; font-weight: bold; color: ${data.netBalance >= 0 ? '#28a745' : '#dc3545'};">${formatMoney(data.netBalance)}</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                            <h4 style="margin: 0 0 5px 0; color: #ffc107; font-size: 16px;">📈 Tahsilat Oranı</h4>
                            <p style="margin: 0; font-size: 20px; font-weight: bold; color: #ffc107;">%${data.paymentRate.toFixed(1)}</p>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center;">
                            <h4 style="margin: 0 0 5px 0; color: #1976d2; font-size: 16px;">👥 Toplam Müşteri</h4>
                            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1976d2;">${data.totalCustomers}</p>
                        </div>
                        
                        <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; text-align: center;">
                            <h4 style="margin: 0 0 5px 0; color: #7b1fa2; font-size: 16px;">📋 Toplam İşlem</h4>
                            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #7b1fa2;">${data.totalTransactions}</p>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <h4 style="margin: 0 0 10px 0; color: #495057;">📊 Analiz</h4>
                        <p style="margin: 0; font-size: 14px; color: #6c757d;">
                            ${data.netBalance >= 0 ? 
                                `Toplam ${data.totalCustomers} müşteriden ${formatMoney(data.netBalance)} tutarında alacak bulunmaktadır. Tahsilat oranı %${data.paymentRate.toFixed(1)} seviyesindedir.` :
                                `Toplam ${data.totalCustomers} müşteriden ${formatMoney(Math.abs(data.netBalance))} tutarında borç bulunmaktadır. Tahsilat oranı %${data.paymentRate.toFixed(1)} seviyesindedir.`
                            }
                        </p>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button onclick="exportGeneralFinancialToExcel()" class="btn btn-success">📊 Excel'e Aktar</button>
                    <button onclick="exportGeneralFinancialToPDF()" class="btn btn-danger">📄 PDF'e Aktar</button>
                    <button onclick="printGeneralFinancialReport()" class="btn btn-primary">🖨️ Yazdır</button>
                    <button onclick="closeModal('general-financial-modal')" class="btn btn-secondary">❌ Kapat</button>
                </div>
            </div>
        </div>
    `;
    
    showOrCreateModal('general-financial-modal', modalHtml);
}

// Genel Finansal Rapor Export Fonksiyonları
async function exportGeneralFinancialToExcel() {
    try {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        const currentDateStr = currentDate.toLocaleDateString('tr-TR');
        
        // Tüm müşterileri getir
        const customers = await window.ipcRenderer.invoke('get-customers');
        
        // Tüm işlemleri topla
        let totalSales = 0;
        let totalPayments = 0;
        let totalCustomers = customers.length;
        let totalTransactions = 0;
        
        for (const customer of customers) {
            const sales = await window.ipcRenderer.invoke('get-sales', customer.id);
            const purchases = await window.ipcRenderer.invoke('get-purchases', customer.id);
            
            const customerSales = sales.reduce((sum, s) => sum + (s.total_amount || s.amount || 0), 0);
            const customerPayments = purchases.reduce((sum, p) => sum + (p.total_amount || p.amount || 0), 0);
            
            totalSales += customerSales;
            totalPayments += customerPayments;
            totalTransactions += sales.length + purchases.length;
        }
        
        const netBalance = totalSales - totalPayments;
        const paymentRate = totalSales > 0 ? ((totalPayments / totalSales) * 100) : 0;
        
        // CSV formatında veri oluştur
        let csvContent = '\uFEFF'; // UTF-8 BOM
        csvContent += 'ETIC AJANS - GENEL FINANSAL OZET RAPORU\n';
        csvContent += `Rapor Tarihi: ${currentDateStr} ${currentTime}\n\n`;
        
        csvContent += 'GENEL FINANSAL OZET:\n';
        csvContent += `Toplam Satis,${formatMoney(totalSales)}\n`;
        csvContent += `Toplam Tahsilat,${formatMoney(totalPayments)}\n`;
        csvContent += `Net Bakiye,${formatMoney(netBalance)}\n`;
        csvContent += `Tahsilat Orani,%${paymentRate.toFixed(1)}\n`;
        csvContent += `Toplam Musteri,${totalCustomers}\n`;
        csvContent += `Toplam Islem,${totalTransactions}\n\n`;
        
        csvContent += 'MUSTERI DETAYLARI:\n';
        csvContent += 'Musteri Adi,Toplam Satis,Toplam Tahsilat,Net Bakiye,Tahsilat Orani,Islem Sayisi\n';
        
        for (const customer of customers) {
            const sales = await window.ipcRenderer.invoke('get-sales', customer.id);
            const purchases = await window.ipcRenderer.invoke('get-purchases', customer.id);
            
            const customerSales = sales.reduce((sum, s) => sum + (s.total_amount || s.amount || 0), 0);
            const customerPayments = purchases.reduce((sum, p) => sum + (p.total_amount || p.amount || 0), 0);
            const customerNetBalance = customerSales - customerPayments;
            const customerPaymentRate = customerSales > 0 ? ((customerPayments / customerSales) * 100) : 0;
            const customerTransactionCount = sales.length + purchases.length;
            
            csvContent += `"${fixTurkishCharsForPDF(customer.name)}",${formatMoney(customerSales)},${formatMoney(customerPayments)},${formatMoney(customerNetBalance)},%${customerPaymentRate.toFixed(1)},${customerTransactionCount}\n`;
        }
        
        csvContent += '\nBu rapor Etic Ajans Veresiye Takip Sistemi tarafindan otomatik olarak olusturulmustur.';
        
        // Dosyayı indir
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Genel_Finansal_Ozet_${currentDateStr.replace(/\./g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showMessage('📊 Genel finansal rapor Excel\'e aktarıldı', 'success');
        
    } catch (error) {
        console.error('Excel export hatası:', error);
        showMessage('Excel export sırasında hata oluştu', 'error');
    }
}

async function exportGeneralFinancialToPDF() {
    try {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        const currentDateStr = currentDate.toLocaleDateString('tr-TR');
        
        // Tüm müşterileri getir
        const customers = await window.ipcRenderer.invoke('get-customers');
        
        // Tüm işlemleri topla
        let totalSales = 0;
        let totalPayments = 0;
        let totalCustomers = customers.length;
        let totalTransactions = 0;
        
        for (const customer of customers) {
            const sales = await window.ipcRenderer.invoke('get-sales', customer.id);
            const purchases = await window.ipcRenderer.invoke('get-purchases', customer.id);
            
            const customerSales = sales.reduce((sum, s) => sum + (s.total_amount || s.amount || 0), 0);
            const customerPayments = purchases.reduce((sum, p) => sum + (p.total_amount || p.amount || 0), 0);
            
            totalSales += customerSales;
            totalPayments += customerPayments;
            totalTransactions += sales.length + purchases.length;
        }
        
        const netBalance = totalSales - totalPayments;
        const paymentRate = totalSales > 0 ? ((totalPayments / totalSales) * 100) : 0;
        
        // PDF oluştur
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Sayfa boyutları
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPosition = 20;
        
        // Profesyonel başlık tasarımı
        doc.setFillColor(74, 85, 104);
        doc.rect(0, 0, pageWidth, 30, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text('ETIC AJANS', 20, 15);
        doc.setFontSize(16);
        doc.text('GENEL FINANSAL OZET RAPORU', 20, 25);
        
        yPosition = 45;
        
        // Rapor bilgileri
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(`Rapor Tarihi: ${currentDateStr} ${currentTime}`, 20, yPosition);
        yPosition += 20;
        
        // Genel finansal özet
        doc.setFontSize(16);
        doc.text('GENEL FINANSAL OZET', 20, yPosition);
        yPosition += 15;
        
        const summaryData = [
            ['Toplam Satis', formatMoney(totalSales)],
            ['Toplam Tahsilat', formatMoney(totalPayments)],
            ['Net Bakiye', formatMoney(netBalance)],
            ['Tahsilat Orani', `%${paymentRate.toFixed(1)}`],
            ['Toplam Musteri', totalCustomers.toString()],
            ['Toplam Islem', totalTransactions.toString()]
        ];
        
        doc.autoTable({
            startY: yPosition,
            head: [['Kategori', 'Deger']],
            body: summaryData,
            theme: 'striped',
            headStyles: { 
                fillColor: [74, 85, 104],
                textColor: [255, 255, 255],
                fontSize: 12
            },
            bodyStyles: { fontSize: 11 },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: 40, halign: 'right' }
            }
        });
        
        yPosition = doc.lastAutoTable.finalY + 20;
        
        // Müşteri detayları
        doc.setFontSize(16);
        doc.text('MUSTERI DETAYLARI', 20, yPosition);
        yPosition += 15;
        
        const customerData = [];
        for (const customer of customers) {
            const sales = await window.ipcRenderer.invoke('get-sales', customer.id);
            const purchases = await window.ipcRenderer.invoke('get-purchases', customer.id);
            
            const customerSales = sales.reduce((sum, s) => sum + (s.total_amount || s.amount || 0), 0);
            const customerPayments = purchases.reduce((sum, p) => sum + (p.total_amount || p.amount || 0), 0);
            const customerNetBalance = customerSales - customerPayments;
            const customerPaymentRate = customerSales > 0 ? ((customerPayments / customerSales) * 100) : 0;
            const customerTransactionCount = sales.length + purchases.length;
            
            customerData.push([
                fixTurkishCharsForPDF(customer.name),
                formatMoney(customerSales),
                formatMoney(customerPayments),
                formatMoney(customerNetBalance),
                `%${customerPaymentRate.toFixed(1)}`,
                customerTransactionCount.toString()
            ]);
        }
        
        doc.autoTable({
            startY: yPosition,
            head: [['Musteri Adi', 'Toplam Satis', 'Toplam Tahsilat', 'Net Bakiye', 'Tahsilat Orani', 'Islem Sayisi']],
            body: customerData,
            theme: 'striped',
            headStyles: { 
                fillColor: [74, 85, 104],
                textColor: [255, 255, 255],
                fontSize: 10
            },
            bodyStyles: { fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 25, halign: 'right' },
                2: { cellWidth: 25, halign: 'right' },
                3: { cellWidth: 25, halign: 'right' },
                4: { cellWidth: 20, halign: 'right' },
                5: { cellWidth: 15, halign: 'center' }
            }
        });
        
        // Alt bilgi
        yPosition = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text('Bu rapor Etic Ajans Veresiye Takip Sistemi tarafindan otomatik olarak olusturulmustur.', 20, yPosition);
        
        // PDF'i indir
        doc.save(`Genel_Finansal_Ozet_${currentDateStr.replace(/\./g, '_')}.pdf`);
        
        showMessage('📄 Genel finansal rapor PDF\'e aktarıldı', 'success');
        
    } catch (error) {
        console.error('PDF export hatası:', error);
        showMessage('PDF export sırasında hata oluştu', 'error');
    }
}

function printGeneralFinancialReport() {
    try {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        const currentDateStr = currentDate.toLocaleDateString('tr-TR');
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Genel Finansal Özet Raporu</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .company-name { font-size: 24px; font-weight: bold; color: #4a5568; }
                    .report-title { font-size: 18px; color: #718096; margin-top: 10px; }
                    .report-date { font-size: 14px; color: #a0aec0; margin-top: 5px; }
                    .summary-section { margin-bottom: 30px; }
                    .summary-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #2d3748; }
                    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
                    .summary-item { background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #4299e1; }
                    .summary-label { font-size: 14px; color: #4a5568; margin-bottom: 5px; }
                    .summary-value { font-size: 18px; font-weight: bold; color: #2d3748; }
                    .customer-section { margin-top: 30px; }
                    .customer-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #2d3748; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
                    th { background-color: #f7fafc; font-weight: bold; color: #4a5568; }
                    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #a0aec0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">ETIC AJANS</div>
                    <div class="report-title">GENEL FINANSAL OZET RAPORU</div>
                    <div class="report-date">Rapor Tarihi: ${currentDateStr} ${currentTime}</div>
                </div>
                
                <div class="summary-section">
                    <div class="summary-title">GENEL FINANSAL OZET</div>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-label">Toplam Satis</div>
                            <div class="summary-value">${formatMoney(0)}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Toplam Tahsilat</div>
                            <div class="summary-value">${formatMoney(0)}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Net Bakiye</div>
                            <div class="summary-value">${formatMoney(0)}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Tahsilat Orani</div>
                            <div class="summary-value">%0.0</div>
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    Bu rapor Etic Ajans Veresiye Takip Sistemi tarafindan otomatik olarak olusturulmustur.
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
        
        showMessage('🖨️ Genel finansal rapor yazdırıldı', 'success');
        
    } catch (error) {
        console.error('Print hatası:', error);
        showMessage('Yazdırma sırasında hata oluştu', 'error');
    }
}

// Müşteri Analiz Raporu
async function generateCustomerReport() {
    try {
        showMessage('👥 Müşteri analiz raporu hazırlanıyor...', 'info');
        
        // Tüm müşterileri getir
        const customers = await window.ipcRenderer.invoke('get-customers');
        if (!customers || customers.length === 0) {
            showMessage('Müşteri bulunamadı', 'warning');
            return;
        }
        
        // Her müşteri için işlemleri getir ve analiz et
        const customerAnalysis = [];
        
        for (const customer of customers) {
            const sales = await window.ipcRenderer.invoke('get-sales', customer.id);
            const purchases = await window.ipcRenderer.invoke('get-purchases', customer.id);
            
            const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || s.amount || 0), 0);
            const totalPayments = purchases.reduce((sum, p) => sum + (p.total_amount || p.amount || 0), 0);
            const netBalance = totalSales - totalPayments;
            const paymentRate = totalSales > 0 ? ((totalPayments / totalSales) * 100) : 0;
            
            customerAnalysis.push({
                name: fixTurkishCharsForPDF(customer.name),
                totalSales: totalSales,
                totalPayments: totalPayments,
                netBalance: netBalance,
                paymentRate: paymentRate,
                transactionCount: sales.length + purchases.length,
                lastTransaction: sales.length > 0 || purchases.length > 0 ? 
                    Math.max(
                        ...sales.map(s => new Date(s.created_at).getTime()),
                        ...purchases.map(p => new Date(p.created_at).getTime())
                    ) : null
            });
        }
        
        // Net bakiyeye göre sırala (en yüksek borç en üstte)
        customerAnalysis.sort((a, b) => b.netBalance - a.netBalance);
        
        // Rapor modal'ını göster
        showCustomerAnalysisModal(customerAnalysis);
        
    } catch (error) {
        console.error('Müşteri analiz raporu hatası:', error);
        showMessage('Müşteri analiz raporu oluşturulurken hata oluştu', 'error');
    }
}

// İşlem Detay Raporu
async function generateTransactionReport() {
    try {
        showMessage('📋 İşlem detay raporu hazırlanıyor...', 'info');
        
        // Tüm müşterileri getir
        const customers = await window.ipcRenderer.invoke('get-customers');
        if (!customers || customers.length === 0) {
            showMessage('Müşteri bulunamadı', 'warning');
            return;
        }
        
        // Tüm işlemleri topla
        const allTransactions = [];
        
        for (const customer of customers) {
            const sales = await window.ipcRenderer.invoke('get-sales', customer.id);
            const purchases = await window.ipcRenderer.invoke('get-purchases', customer.id);
            
            // Satışları ekle
            sales.forEach(sale => {
                allTransactions.push({
                    ...sale,
                    customerName: fixTurkishCharsForPDF(customer.name),
                    transactionType: 'sale',
                    type: '💰 Satış'
                });
            });
            
            // Tahsilatları ekle
            purchases.forEach(purchase => {
                allTransactions.push({
                    ...purchase,
                    customerName: fixTurkishCharsForPDF(customer.name),
                    transactionType: 'purchase',
                    type: '💳 Tahsilat'
                });
            });
        }
        
        // Tarihe göre sırala (en yeni en üstte)
        allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Rapor modal'ını göster
        showTransactionReportModal(allTransactions);
        
    } catch (error) {
        console.error('İşlem detay raporu hatası:', error);
        showMessage('İşlem detay raporu oluşturulurken hata oluştu', 'error');
    }
}

// Borç Analiz Raporu
async function generateDebtReport() {
    try {
        showMessage('💳 Borç analiz raporu hazırlanıyor...', 'info');
        
        // Tüm müşterileri getir
        const customers = await window.ipcRenderer.invoke('get-customers');
        if (!customers || customers.length === 0) {
            showMessage('Müşteri bulunamadı', 'warning');
            return;
        }
        
        // Her müşteri için borç analizi yap
        const debtAnalysis = [];
        
        for (const customer of customers) {
            const sales = await window.ipcRenderer.invoke('get-sales', customer.id);
            const purchases = await window.ipcRenderer.invoke('get-purchases', customer.id);
            
            const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || s.amount || 0), 0);
            const totalPayments = purchases.reduce((sum, p) => sum + (p.total_amount || p.amount || 0), 0);
            const netBalance = totalSales - totalPayments;
            
            if (netBalance > 0) { // Sadece borcu olan müşteriler
                const lastPaymentDate = purchases.length > 0 ? 
                    Math.max(...purchases.map(p => new Date(p.created_at).getTime())) : null;
                
                const daysSinceLastPayment = lastPaymentDate ? 
                    Math.floor((new Date().getTime() - lastPaymentDate) / (1000 * 60 * 60 * 24)) : null;
                
                // Risk seviyesi hesapla
                let riskLevel = 'Düşük';
                if (netBalance > 50000) riskLevel = 'Yüksek';
                else if (netBalance > 20000) riskLevel = 'Orta';
                
                if (daysSinceLastPayment > 90) riskLevel = 'Yüksek';
                else if (daysSinceLastPayment > 30) riskLevel = 'Orta';
                
                debtAnalysis.push({
                    name: fixTurkishCharsForPDF(customer.name),
                    netBalance: netBalance,
                    riskLevel: riskLevel,
                    daysSinceLastPayment: daysSinceLastPayment,
                    totalSales: totalSales,
                    totalPayments: totalPayments,
                    paymentRate: totalSales > 0 ? ((totalPayments / totalSales) * 100) : 0
                });
            }
        }
        
        // Borç miktarına göre sırala (en yüksek borç en üstte)
        debtAnalysis.sort((a, b) => b.netBalance - a.netBalance);
        
        // Rapor modal'ını göster
        showDebtAnalysisModal(debtAnalysis);
        
    } catch (error) {
        console.error('Borç analiz raporu hatası:', error);
        showMessage('Borç analiz raporu oluşturulurken hata oluştu', 'error');
    }
}

// Aylık Performans Raporu
async function generateMonthlyReport() {
    try {
        showMessage('📅 Aylık performans raporu hazırlanıyor...', 'info');
        
        // Son 12 ayın verilerini getir
        const monthlyData = [];
        const today = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const nextMonthDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
            
            const monthName = monthDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
            
            // Bu ay için tüm müşterilerin işlemlerini getir
            const customers = await window.ipcRenderer.invoke('get-customers');
            let monthSales = 0;
            let monthPayments = 0;
            let transactionCount = 0;
            
            for (const customer of customers) {
                const sales = await window.ipcRenderer.invoke('get-sales', customer.id);
                const purchases = await window.ipcRenderer.invoke('get-purchases', customer.id);
                
                // Bu ay içindeki işlemleri filtrele
                const monthSalesData = sales.filter(s => {
                    const saleDate = new Date(s.created_at);
                    return saleDate >= monthDate && saleDate < nextMonthDate;
                });
                
                const monthPurchasesData = purchases.filter(p => {
                    const purchaseDate = new Date(p.created_at);
                    return purchaseDate >= monthDate && purchaseDate < nextMonthDate;
                });
                
                monthSales += monthSalesData.reduce((sum, s) => sum + (s.total_amount || s.amount || 0), 0);
                monthPayments += monthPurchasesData.reduce((sum, p) => sum + (p.total_amount || p.amount || 0), 0);
                transactionCount += monthSalesData.length + monthPurchasesData.length;
            }
            
            monthlyData.push({
                month: monthName,
                sales: monthSales,
                payments: monthPayments,
                netBalance: monthSales - monthPayments,
                transactionCount: transactionCount,
                paymentRate: monthSales > 0 ? ((monthPayments / monthSales) * 100) : 0
            });
        }
        
        // Rapor modal'ını göster
        showMonthlyReportModal(monthlyData);
        
    } catch (error) {
        console.error('Aylık performans raporu hatası:', error);
        showMessage('Aylık performans raporu oluşturulurken hata oluştu', 'error');
    }
}

// Ürün Satış Raporu
async function generateProductReport() {
    try {
        showMessage('📦 Ürün satış raporu hazırlanıyor...', 'info');
        
        // Tüm müşterileri getir
        const customers = await window.ipcRenderer.invoke('get-customers');
        if (!customers || customers.length === 0) {
            showMessage('Müşteri bulunamadı', 'warning');
            return;
        }
        
        // Tüm satışları topla ve ürün bazında analiz et
        const productAnalysis = new Map();
        
        for (const customer of customers) {
            const sales = await window.ipcRenderer.invoke('get-sales', customer.id);
            
            sales.forEach(sale => {
                const productName = sale.product_name || sale.description || 'Belirtilmemiş';
                const amount = sale.total_amount || sale.amount || 0;
                const quantity = sale.quantity || 1;
                
                if (productAnalysis.has(productName)) {
                    const existing = productAnalysis.get(productName);
                    existing.totalAmount += amount;
                    existing.totalQuantity += quantity;
                    existing.saleCount += 1;
                    existing.customers.add(customer.name);
                } else {
                    productAnalysis.set(productName, {
                        productName: productName,
                        totalAmount: amount,
                        totalQuantity: quantity,
                        saleCount: 1,
                        customers: new Set([customer.name])
                    });
                }
            });
        }
        
        // Map'i array'e çevir ve sırala
        const productData = Array.from(productAnalysis.values()).map(item => ({
            ...item,
            customerCount: item.customers.size,
            averageAmount: item.totalAmount / item.saleCount,
            averageQuantity: item.totalQuantity / item.saleCount
        }));
        
        // Toplam tutara göre sırala (en yüksek en üstte)
        productData.sort((a, b) => b.totalAmount - a.totalAmount);
        
        // Rapor modal'ını göster
        showProductReportModal(productData);
        
    } catch (error) {
        console.error('Ürün satış raporu hatası:', error);
        showMessage('Ürün satış raporu oluşturulurken hata oluştu', 'error');
    }
}

// Hızlı İşlemler Fonksiyonları
function exportAllToExcel() {
    if (!currentCustomer) {
        showMessage('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    exportBalanceToExcel();
}

function exportAllToPDF() {
    if (!currentCustomer) {
        showMessage('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    exportBalanceToPDF();
}

function printAllReports() {
    if (!currentCustomer) {
        showMessage('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    printBalanceReport();
}

function refreshReports() {
    showMessage('🔄 Raporlar yenileniyor...', 'info');
    closeModal('reports-modal');
    setTimeout(() => showReportsModal(), 500);
}

// Rapor Modal'ları
function showCustomerAnalysisModal(customerAnalysis) {
    const modalHtml = `
        <div id="customer-analysis-modal" class="modal active" onclick="if(event.target.id === 'customer-analysis-modal') closeModal('customer-analysis-modal')">
            <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow-y: auto;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>👥 Müşteri Analiz Raporu</h2>
                    <button class="close-btn" onclick="closeModal('customer-analysis-modal')">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <button class="btn btn-primary" onclick="exportCustomerAnalysisToExcel()">📊 Excel'e Aktar</button>
                        <button class="btn btn-secondary" onclick="printCustomerAnalysis()">🖨️ Yazdır</button>
                    </div>
                    
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr style="background: #f7fafc; border-bottom: 2px solid #e2e8f0;">
                                    <th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Müşteri</th>
                                    <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">Toplam Satış</th>
                                    <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">Toplam Tahsilat</th>
                                    <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">Net Bakiye</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">Tahsilat Oranı</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">İşlem Sayısı</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">Son İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${customerAnalysis.map(customer => `
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 500;">${customer.name}</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #e53e3e;">${formatMoney(customer.totalSales)}</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #38a169;">${formatMoney(customer.totalPayments)}</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: ${customer.netBalance > 0 ? '#e53e3e' : customer.netBalance < 0 ? '#38a169' : '#718096'}; font-weight: 600;">${formatMoney(customer.netBalance)}</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${customer.paymentRate.toFixed(1)}%</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${customer.transactionCount}</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${customer.lastTransaction ? new Date(customer.lastTransaction).toLocaleDateString('tr-TR') : '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    showOrCreateModal('customer-analysis-modal', modalHtml);
}

function showTransactionReportModal(allTransactions) {
    const modalHtml = `
        <div id="transaction-report-modal" class="modal active" onclick="if(event.target.id === 'transaction-report-modal') closeModal('transaction-report-modal')">
            <div class="modal-content" style="max-width: 1200px; max-height: 90vh; overflow-y: auto;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>📋 İşlem Detay Raporu</h2>
                    <button class="close-btn" onclick="closeModal('transaction-report-modal')">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <button class="btn btn-primary" onclick="exportTransactionReportToExcel()">📊 Excel'e Aktar</button>
                        <button class="btn btn-secondary" onclick="printTransactionReport()">🖨️ Yazdır</button>
                    </div>
                    
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                            <thead>
                                <tr style="background: #f7fafc; border-bottom: 2px solid #e2e8f0;">
                                    <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0;">Tarih</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0;">Müşteri</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0;">Tür</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0;">Açıklama</th>
                                    <th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">Tutar</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allTransactions.map(transaction => `
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="padding: 10px; border: 1px solid #e2e8f0;">${new Date(transaction.created_at).toLocaleDateString('tr-TR')}</td>
                                        <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 500;">${transaction.customerName}</td>
                                        <td style="padding: 10px; border: 1px solid #e2e8f0;">${transaction.type}</td>
                                        <td style="padding: 10px; border: 1px solid #e2e8f0;">${transaction.description || transaction.product_name || '-'}</td>
                                        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; color: ${transaction.transactionType === 'sale' ? '#e53e3e' : '#38a169'}; font-weight: 600;">${transaction.transactionType === 'sale' ? '+' : '-'}${formatMoney(transaction.total_amount || transaction.amount || 0)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    showOrCreateModal('transaction-report-modal', modalHtml);
    
    // Global değişkene kaydet
    window.currentTransactionReport = allTransactions;
}

// İşlem detay raporunu yazdır
function printTransactionReport() {
    try {
        const transactions = window.currentTransactionReport;
        if (!transactions || transactions.length === 0) {
            showMessage('Yazdırılacak veri bulunamadı', 'error');
            return;
        }
        
        // Yazdırma için HTML oluştur
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>İşlem Detay Raporu</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #2d3748; margin-bottom: 10px; }
                    .header p { color: #718096; margin: 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
                    th { background-color: #f7fafc; font-weight: bold; }
                    .type-debt { background-color: #e53e3e; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                    .type-payment { background-color: #38a169; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                    .debt-amount { color: #e53e3e; font-weight: bold; }
                    .payment-amount { color: #38a169; font-weight: bold; }
                    .summary { margin-top: 30px; padding: 20px; background-color: #f7fafc; border-radius: 8px; }
                    .summary h3 { margin-top: 0; color: #2d3748; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📋 İşlem Detay Raporu</h1>
                    <p>Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Tarih</th>
                            <th>Müşteri</th>
                            <th>Ürün</th>
                            <th style="text-align: center;">Tip</th>
                            <th style="text-align: right;">Miktar</th>
                            <th style="text-align: right;">Birim Fiyat</th>
                            <th style="text-align: right;">Toplam</th>
                            <th>Açıklama</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transactions.map(transaction => `
                            <tr>
                                <td>${new Date(transaction.created_at).toLocaleDateString('tr-TR')}</td>
                                <td style="font-weight: 500;">${transaction.customer_name || 'Bilinmiyor'}</td>
                                <td>${transaction.product_name || '-'}</td>
                                <td style="text-align: center;">
                                    <span class="type-${transaction.type}">
                                        ${transaction.type === 'debt' ? 'Borç' : 'Ödeme'}
                                    </span>
                                </td>
                                <td style="text-align: right;">${transaction.quantity || 1}</td>
                                <td style="text-align: right;">${formatMoney(transaction.unit_price)}</td>
                                <td style="text-align: right;" class="${transaction.type === 'debt' ? 'debt-amount' : 'payment-amount'}">${formatMoney(transaction.total_amount)}</td>
                                <td>${transaction.description || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="summary">
                    <h3>📊 Özet</h3>
                    <p><strong>Toplam İşlem:</strong> ${transactions.length}</p>
                    <p><strong>Toplam Borç:</strong> ${formatMoney(transactions.filter(t => t.type === 'debt').reduce((sum, t) => sum + t.total_amount, 0))}</p>
                    <p><strong>Toplam Ödeme:</strong> ${formatMoney(transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.total_amount, 0))}</p>
                    <p><strong>Net Bakiye:</strong> ${formatMoney(transactions.filter(t => t.type === 'debt').reduce((sum, t) => sum + t.total_amount, 0) - transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.total_amount, 0))}</p>
                </div>
            </body>
            </html>
        `;
        
        // Yeni pencere aç ve yazdır
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Yazdırma dialogunu aç
        setTimeout(() => {
            printWindow.print();
        }, 500);
        
        showMessage('İşlem detay raporu yazdırma için hazırlandı', 'success');
        
    } catch (error) {
        console.error('İşlem detay raporu yazdırma hatası:', error);
        showMessage('Yazdırma sırasında hata oluştu', 'error');
    }
}

// İşlem detay raporunu Excel'e aktar
function exportTransactionReportToExcel() {
    try {
        const transactions = window.currentTransactionReport;
        if (!transactions || transactions.length === 0) {
            showMessage('Aktarılacak veri bulunamadı', 'error');
            return;
        }
        
        // Excel verisi hazırla
        const excelData = transactions.map(transaction => ({
            'Tarih': new Date(transaction.created_at).toLocaleDateString('tr-TR'),
            'Müşteri': transaction.customer_name || 'Bilinmiyor',
            'Ürün': transaction.product_name || '-',
            'Tip': transaction.type === 'debt' ? 'Borç' : 'Ödeme',
            'Miktar': transaction.quantity || 1,
            'Birim Fiyat': transaction.unit_price,
            'Toplam': transaction.total_amount,
            'Açıklama': transaction.description || '-'
        }));
        
        // XLSX kütüphanesi kullanarak Excel dosyası oluştur
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'İşlem Detay Raporu');
        
        // Dosyayı indir
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `islem_detay_raporu_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showMessage('İşlem detay raporu Excel dosyası olarak indirildi', 'success');
        
    } catch (error) {
        console.error('Excel aktarım hatası:', error);
        showMessage('Excel aktarımı sırasında hata oluştu', 'error');
    }
}

function showDebtAnalysisModal(debtAnalysis) {
    const modalHtml = `
        <div id="debt-analysis-modal" class="modal active" onclick="if(event.target.id === 'debt-analysis-modal') closeModal('debt-analysis-modal')">
            <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow-y: auto;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>💳 Borç Analiz Raporu</h2>
                    <button class="close-btn" onclick="closeModal('debt-analysis-modal')">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <button class="btn btn-primary" onclick="exportDebtAnalysisToExcel()">📊 Excel'e Aktar</button>
                        <button class="btn btn-secondary" onclick="printDebtAnalysis()">🖨️ Yazdır</button>
                    </div>
                    
                    <div id="debt-analysis-content" style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr style="background: #f7fafc; border-bottom: 2px solid #e2e8f0;">
                                    <th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Müşteri</th>
                                    <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">Borç Miktarı</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">Risk Seviyesi</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">Son Ödeme</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">Tahsilat Oranı</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${debtAnalysis.map(customer => `
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 500;">${customer.name}</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #e53e3e; font-weight: 600;">${formatMoney(customer.netBalance)}</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">
                                            <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; color: white; background: ${customer.riskLevel === 'Yüksek' ? '#e53e3e' : customer.riskLevel === 'Orta' ? '#ed8936' : '#38a169'};">
                                                ${customer.riskLevel}
                                            </span>
                                        </td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${customer.daysSinceLastPayment ? customer.daysSinceLastPayment + ' gün önce' : 'Hiç ödeme yok'}</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${customer.paymentRate.toFixed(1)}%</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    showOrCreateModal('debt-analysis-modal', modalHtml);
    
    // Global değişkene kaydet
    window.currentDebtAnalysis = debtAnalysis;
}

// Borç analiz raporunu yazdır
function printDebtAnalysis() {
    try {
        const debtAnalysis = window.currentDebtAnalysis;
        if (!debtAnalysis || debtAnalysis.length === 0) {
            showMessage('Yazdırılacak veri bulunamadı', 'error');
            return;
        }
        
        // Yazdırma için HTML oluştur
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Borç Analiz Raporu</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #2d3748; margin-bottom: 10px; }
                    .header p { color: #718096; margin: 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
                    th { background-color: #f7fafc; font-weight: bold; }
                    .risk-high { background-color: #e53e3e; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                    .risk-medium { background-color: #ed8936; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                    .risk-low { background-color: #38a169; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                    .debt-amount { color: #e53e3e; font-weight: bold; }
                    .summary { margin-top: 30px; padding: 20px; background-color: #f7fafc; border-radius: 8px; }
                    .summary h3 { margin-top: 0; color: #2d3748; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>💳 Borç Analiz Raporu</h1>
                    <p>Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Müşteri</th>
                            <th style="text-align: right;">Borç Miktarı</th>
                            <th style="text-align: center;">Risk Seviyesi</th>
                            <th style="text-align: center;">Son Ödeme</th>
                            <th style="text-align: center;">Tahsilat Oranı</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${debtAnalysis.map(customer => `
                            <tr>
                                <td style="font-weight: 500;">${customer.name}</td>
                                <td style="text-align: right;" class="debt-amount">${formatMoney(customer.netBalance)}</td>
                                <td style="text-align: center;">
                                    <span class="risk-${customer.riskLevel === 'Yüksek' ? 'high' : customer.riskLevel === 'Orta' ? 'medium' : 'low'}">
                                        ${customer.riskLevel}
                                    </span>
                                </td>
                                <td style="text-align: center;">${customer.daysSinceLastPayment ? customer.daysSinceLastPayment + ' gün önce' : 'Hiç ödeme yok'}</td>
                                <td style="text-align: center;">${customer.paymentRate.toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="summary">
                    <h3>📊 Özet</h3>
                    <p><strong>Toplam Borç:</strong> ${formatMoney(debtAnalysis.reduce((sum, c) => sum + c.netBalance, 0))}</p>
                    <p><strong>Müşteri Sayısı:</strong> ${debtAnalysis.length}</p>
                    <p><strong>Ortalama Borç:</strong> ${formatMoney(debtAnalysis.reduce((sum, c) => sum + c.netBalance, 0) / debtAnalysis.length)}</p>
                    <p><strong>Yüksek Riskli Müşteri:</strong> ${debtAnalysis.filter(c => c.riskLevel === 'Yüksek').length}</p>
                    <p><strong>Orta Riskli Müşteri:</strong> ${debtAnalysis.filter(c => c.riskLevel === 'Orta').length}</p>
                    <p><strong>Düşük Riskli Müşteri:</strong> ${debtAnalysis.filter(c => c.riskLevel === 'Düşük').length}</p>
                </div>
            </body>
            </html>
        `;
        
        // Yeni pencere aç ve yazdır
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Yazdırma dialogunu aç
        setTimeout(() => {
            printWindow.print();
        }, 500);
        
        showMessage('Borç analiz raporu yazdırma için hazırlandı', 'success');
        
    } catch (error) {
        console.error('Borç analiz raporu yazdırma hatası:', error);
        showMessage('Yazdırma sırasında hata oluştu', 'error');
    }
}

// Borç analiz raporunu Excel'e aktar
function exportDebtAnalysisToExcel() {
    try {
        const debtAnalysis = window.currentDebtAnalysis;
        if (!debtAnalysis || debtAnalysis.length === 0) {
            showMessage('Aktarılacak veri bulunamadı', 'error');
            return;
        }
        
        // Excel verisi hazırla
        const excelData = debtAnalysis.map(customer => ({
            'Müşteri': customer.name,
            'Borç Miktarı': customer.netBalance,
            'Risk Seviyesi': customer.riskLevel,
            'Son Ödeme': customer.daysSinceLastPayment ? customer.daysSinceLastPayment + ' gün önce' : 'Hiç ödeme yok',
            'Tahsilat Oranı': customer.paymentRate.toFixed(1) + '%',
            'Toplam Satış': customer.totalSales,
            'Toplam Ödeme': customer.totalPayments
        }));
        
        // XLSX kütüphanesi kullanarak Excel dosyası oluştur
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Borç Analiz Raporu');
        
        // Dosyayı indir
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `borc_analiz_raporu_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showMessage('Borç analiz raporu Excel dosyası olarak indirildi', 'success');
        
    } catch (error) {
        console.error('Excel aktarım hatası:', error);
        showMessage('Excel aktarımı sırasında hata oluştu', 'error');
    }
}

function showMonthlyReportModal(monthlyData) {
    const modalHtml = `
        <div id="monthly-report-modal" class="modal active" onclick="if(event.target.id === 'monthly-report-modal') closeModal('monthly-report-modal')">
            <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow-y: auto;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>📅 Aylık Performans Raporu</h2>
                    <button class="close-btn" onclick="closeModal('monthly-report-modal')">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <button class="btn btn-primary" onclick="exportMonthlyReportToExcel()">📊 Excel'e Aktar</button>
                        <button class="btn btn-secondary" onclick="printMonthlyReport()">🖨️ Yazdır</button>
                    </div>
                    
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr style="background: #f7fafc; border-bottom: 2px solid #e2e8f0;">
                                    <th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Ay</th>
                                    <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">Satış</th>
                                    <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">Tahsilat</th>
                                    <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">Net Bakiye</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">Tahsilat Oranı</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">İşlem Sayısı</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${monthlyData.map(month => `
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 500;">${month.month}</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #e53e3e;">${formatMoney(month.sales)}</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #38a169;">${formatMoney(month.payments)}</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: ${month.netBalance > 0 ? '#e53e3e' : month.netBalance < 0 ? '#38a169' : '#718096'}; font-weight: 600;">${formatMoney(month.netBalance)}</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${month.paymentRate.toFixed(1)}%</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${month.transactionCount}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    showOrCreateModal('monthly-report-modal', modalHtml);
    
    // Global değişkene kaydet
    window.currentMonthlyReport = monthlyData;
}

function showProductReportModal(productData) {
    const modalHtml = `
        <div id="product-report-modal" class="modal active" onclick="if(event.target.id === 'product-report-modal') closeModal('product-report-modal')">
            <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow-y: auto;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>📦 Ürün Satış Raporu</h2>
                    <button class="close-btn" onclick="closeModal('product-report-modal')">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <button class="btn btn-primary" onclick="exportProductReportToExcel()">📊 Excel'e Aktar</button>
                        <button class="btn btn-secondary" onclick="printProductReport()">🖨️ Yazdır</button>
                    </div>
                    
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr style="background: #f7fafc; border-bottom: 2px solid #e2e8f0;">
                                    <th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Ürün</th>
                                    <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">Toplam Tutar</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">Toplam Miktar</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">Satış Sayısı</th>
                                    <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">Müşteri Sayısı</th>
                                    <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">Ortalama Tutar</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productData.map(product => `
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 500;">${product.productName}</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #e53e3e; font-weight: 600;">${formatMoney(product.totalAmount)}</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${product.totalQuantity}</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${product.saleCount}</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${product.customerCount}</td>
                                        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">${formatMoney(product.averageAmount)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    showOrCreateModal('product-report-modal', modalHtml);
    
    // Global değişkene kaydet
    window.currentProductReport = productData;
}

function restoreData() {
    showMessage('📁 Veri geri yükleme yakında eklenecek', 'info');
}

function clearData() {
    if (confirm('Tüm verileri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
        showMessage('🗑️ Veri temizleme yakında eklenecek', 'warning');
    }
}

function saveSettings() {
    showMessage('💾 Ayarlar kaydedildi', 'success');
    closeModal('settings-modal');
}

// Müşteri Arama Modal Fonksiyonları
let allCustomersForSearch = [];
let filteredCustomersForSearch = [];
let currentFilterType = 'all';

// Müşterileri arama modal'ı için yükle
async function loadCustomersForSearch() {
    try {
        allCustomersForSearch = await window.ipcRenderer.invoke('get-customers');
        
        // Her müşteri için bakiye hesapla
        const allTransactions = await window.ipcRenderer.invoke('get-all-transactions');
        
        allCustomersForSearch = allCustomersForSearch.map(customer => {
            const customerTransactions = allTransactions.filter(t => t.customer_id === customer.id);
            const sales = customerTransactions.filter(t => t.type === 'debt');
            const payments = customerTransactions.filter(t => t.type === 'payment');
            
            const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || s.amount || 0), 0);
            const totalPayments = payments.reduce((sum, p) => sum + (p.total_amount || p.amount || 0), 0);
            const balance = totalSales - totalPayments;
            
            return {
                ...customer,
                balance: balance
            };
        });
        
        filteredCustomersForSearch = [...allCustomersForSearch];
        displayCustomersInSearchModal();
        
    } catch (error) {
        console.error('Müşteriler yüklenirken hata:', error);
        showMessage('Müşteriler yüklenirken hata oluştu', 'error');
    }
}

// Müşteri arama modal'ında arama yap
function searchCustomersInModal() {
    const searchTerm = document.getElementById('customer-search-input').value.toLowerCase().trim();
    
    if (!searchTerm) {
        // Arama terimi boşsa mevcut filtreyi uygula
        applyCurrentFilter();
        return;
    }
    
    filteredCustomersForSearch = allCustomersForSearch.filter(customer => {
        const nameMatch = customer.name.toLowerCase().includes(searchTerm);
        const codeMatch = customer.code && customer.code.toString().toLowerCase().includes(searchTerm);
        const phoneMatch = customer.phone && customer.phone.includes(searchTerm);
        const gsmMatch = customer.gsm && customer.gsm.includes(searchTerm);
        const taxMatch = customer.tax_number && customer.tax_number.includes(searchTerm);
        
        return nameMatch || codeMatch || phoneMatch || gsmMatch || taxMatch;
    });
    
    displayCustomersInSearchModal();
}

// Müşteri tipine göre filtrele
function filterCustomersByType(type) {
    currentFilterType = type;
    
    // Aktif filtre butonunu güncelle
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`filter-${type}`).classList.add('active');
    
    // Arama kutusunu temizle
    document.getElementById('customer-search-input').value = '';
    
    applyCurrentFilter();
}

// Mevcut filtreyi uygula
function applyCurrentFilter() {
    switch (currentFilterType) {
        case 'all':
            filteredCustomersForSearch = [...allCustomersForSearch];
            break;
        case 'debt':
            filteredCustomersForSearch = allCustomersForSearch.filter(c => c.balance > 0);
            break;
        case 'credit':
            filteredCustomersForSearch = allCustomersForSearch.filter(c => c.balance < 0);
            break;
        case 'zero':
            filteredCustomersForSearch = allCustomersForSearch.filter(c => c.balance === 0);
            break;
    }
    
    displayCustomersInSearchModal();
}

// Müşterileri arama modal'ında göster
function displayCustomersInSearchModal() {
    const resultsContainer = document.getElementById('customer-search-results');
    
    if (filteredCustomersForSearch.length === 0) {
        resultsContainer.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #718096;">
                <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Müşteri bulunamadı</div>
                <div style="font-size: 14px;">Arama kriterlerinizi değiştirmeyi deneyin</div>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = filteredCustomersForSearch.map(customer => {
        const balanceClass = customer.balance > 0 ? 'negative' : customer.balance < 0 ? 'positive' : 'zero';
        const balanceText = customer.balance > 0 ? `₺${formatMoney(customer.balance)}` : 
                           customer.balance < 0 ? `₺${formatMoney(Math.abs(customer.balance))}` : '₺0,00';
        const balanceLabel = customer.balance > 0 ? 'Borç' : customer.balance < 0 ? 'Alacak' : 'Sıfır';
        
        return `
            <div class="customer-search-item" onclick="selectCustomerFromSearchModal(${customer.id})" data-customer-id="${customer.id}">
                <div class="customer-info">
                    <div class="customer-name">${customer.name}</div>
                    <div class="customer-details">
                        <span>Kod: ${customer.code || customer.id}</span>
                        ${customer.phone ? `<span>Tel: ${customer.phone}</span>` : ''}
                        ${customer.gsm ? `<span>GSM: ${customer.gsm}</span>` : ''}
                        ${customer.tax_number ? `<span>Vergi: ${customer.tax_number}</span>` : ''}
                    </div>
                </div>
                <div class="customer-balance ${balanceClass}">
                    <div>${balanceText}</div>
                    <div style="font-size: 11px; color: #718096;">${balanceLabel}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Arama modal'ından müşteri seç
async function selectCustomerFromSearchModal(customerId) {
    try {
        closeModal('customer-search-modal');
        
        // Müşteriyi seç
        await selectCustomer(customerId);
        
        showMessage(`✅ ${allCustomersForSearch.find(c => c.id === customerId)?.name} seçildi`, 'success');
        
    } catch (error) {
        console.error('Müşteri seçilirken hata:', error);
        showMessage('Müşteri seçilirken hata oluştu', 'error');
    }
}

// Arama modal'ında klavye kısayolları
function handleCustomerSearchModalKeydown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        
        // İlk müşteriyi seç
        const firstCustomer = document.querySelector('.customer-search-item');
        if (firstCustomer) {
            const customerId = firstCustomer.getAttribute('data-customer-id');
            selectCustomerFromSearchModal(parseInt(customerId));
        }
    } else if (event.key === 'Escape') {
        closeModal('customer-search-modal');
    } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        navigateCustomerList(1);
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        navigateCustomerList(-1);
    }
}

// Müşteri listesinde navigasyon
function navigateCustomerList(direction) {
    const items = document.querySelectorAll('.customer-search-item');
    const selectedItem = document.querySelector('.customer-search-item.selected');
    
    let currentIndex = -1;
    if (selectedItem) {
        currentIndex = Array.from(items).indexOf(selectedItem);
    }
    
    // Seçimi kaldır
    items.forEach(item => item.classList.remove('selected'));
    
    // Yeni seçim
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = items.length - 1;
    if (newIndex >= items.length) newIndex = 0;
    
    if (items[newIndex]) {
        items[newIndex].classList.add('selected');
        items[newIndex].scrollIntoView({ block: 'nearest' });
    }
}

// Arama modal'ından müşteri ekleme
function showAddCustomerModalFromSearch() {
    closeModal('customer-search-modal');
    setTimeout(() => {
        showAddCustomerModal();
    }, 200);
}

function printReport() {
    if (!currentCustomer) {
        showMessage('Önce bir müşteri seçin', 'error');
        return;
    }
    
    showMessage(`${currentCustomer.name} müşterisi için yazdırma raporu hazırlanıyor...`, 'info');
    // TODO: Implement print functionality
}

// Aylık rapor yazdırma fonksiyonu
function printMonthlyReport() {
    try {
        const monthlyData = window.currentMonthlyReport;
        if (!monthlyData || monthlyData.length === 0) {
            showMessage('Yazdırılacak veri bulunamadı', 'error');
            return;
        }
        
        // Yazdırma için HTML oluştur
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Aylık Performans Raporu</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #2d3748; margin-bottom: 10px; }
                    .header p { color: #718096; margin: 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
                    th { background-color: #f7fafc; font-weight: bold; }
                    .sales-amount { color: #38a169; font-weight: bold; }
                    .payment-amount { color: #4299e1; font-weight: bold; }
                    .debt-amount { color: #e53e3e; font-weight: bold; }
                    .summary { margin-top: 30px; padding: 20px; background-color: #f7fafc; border-radius: 8px; }
                    .summary h3 { margin-top: 0; color: #2d3748; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📅 Aylık Performans Raporu</h1>
                    <p>Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Ay</th>
                            <th style="text-align: right;">Toplam Satış</th>
                            <th style="text-align: right;">Toplam Tahsilat</th>
                            <th style="text-align: right;">Net Bakiye</th>
                            <th style="text-align: center;">İşlem Sayısı</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${monthlyData.map(month => `
                            <tr>
                                <td style="font-weight: 500;">${month.month}</td>
                                <td style="text-align: right;" class="sales-amount">${formatMoney(month.totalSales)}</td>
                                <td style="text-align: right;" class="payment-amount">${formatMoney(month.totalPayments)}</td>
                                <td style="text-align: right;" class="debt-amount">${formatMoney(month.netBalance)}</td>
                                <td style="text-align: center;">${month.transactionCount}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="summary">
                    <h3>📊 Özet</h3>
                    <p><strong>Toplam Satış:</strong> ${formatMoney(monthlyData.reduce((sum, m) => sum + m.totalSales, 0))}</p>
                    <p><strong>Toplam Tahsilat:</strong> ${formatMoney(monthlyData.reduce((sum, m) => sum + m.totalPayments, 0))}</p>
                    <p><strong>Net Bakiye:</strong> ${formatMoney(monthlyData.reduce((sum, m) => sum + m.netBalance, 0))}</p>
                    <p><strong>Toplam İşlem:</strong> ${monthlyData.reduce((sum, m) => sum + m.transactionCount, 0)}</p>
                </div>
            </body>
            </html>
        `;
        
        // Yeni pencere aç ve yazdır
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Yazdırma dialogunu aç
        setTimeout(() => {
            printWindow.print();
        }, 500);
        
        showMessage('Aylık performans raporu yazdırma için hazırlandı', 'success');
        
    } catch (error) {
        console.error('Aylık rapor yazdırma hatası:', error);
        showMessage('Yazdırma sırasında hata oluştu', 'error');
    }
}

// Ürün raporu yazdırma fonksiyonu
function printProductReport() {
    try {
        const productData = window.currentProductReport;
        if (!productData || productData.length === 0) {
            showMessage('Yazdırılacak veri bulunamadı', 'error');
            return;
        }
        
        // Yazdırma için HTML oluştur
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Ürün Satış Raporu</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #2d3748; margin-bottom: 10px; }
                    .header p { color: #718096; margin: 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
                    th { background-color: #f7fafc; font-weight: bold; }
                    .sales-amount { color: #38a169; font-weight: bold; }
                    .revenue-amount { color: #4299e1; font-weight: bold; }
                    .summary { margin-top: 30px; padding: 20px; background-color: #f7fafc; border-radius: 8px; }
                    .summary h3 { margin-top: 0; color: #2d3748; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📦 Ürün Satış Raporu</h1>
                    <p>Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Ürün Adı</th>
                            <th style="text-align: right;">Satılan Miktar</th>
                            <th style="text-align: right;">Toplam Gelir</th>
                            <th style="text-align: right;">Ortalama Fiyat</th>
                            <th style="text-align: center;">Satış Sayısı</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productData.map(product => `
                            <tr>
                                <td style="font-weight: 500;">${product.name}</td>
                                <td style="text-align: right;" class="sales-amount">${product.totalQuantity}</td>
                                <td style="text-align: right;" class="revenue-amount">${formatMoney(product.totalRevenue)}</td>
                                <td style="text-align: right;">${formatMoney(product.averagePrice)}</td>
                                <td style="text-align: center;">${product.salesCount}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="summary">
                    <h3>📊 Özet</h3>
                    <p><strong>Toplam Satılan Miktar:</strong> ${productData.reduce((sum, p) => sum + p.totalQuantity, 0)}</p>
                    <p><strong>Toplam Gelir:</strong> ${formatMoney(productData.reduce((sum, p) => sum + p.totalRevenue, 0))}</p>
                    <p><strong>Toplam Satış Sayısı:</strong> ${productData.reduce((sum, p) => sum + p.salesCount, 0)}</p>
                    <p><strong>En Çok Satılan Ürün:</strong> ${productData.sort((a, b) => b.totalQuantity - a.totalQuantity)[0]?.name || 'N/A'}</p>
                </div>
            </body>
            </html>
        `;
        
        // Yeni pencere aç ve yazdır
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Yazdırma dialogunu aç
        setTimeout(() => {
            printWindow.print();
        }, 500);
        
        showMessage('Ürün satış raporu yazdırma için hazırlandı', 'success');
        
    } catch (error) {
        console.error('Ürün raporu yazdırma hatası:', error);
        showMessage('Yazdırma sırasında hata oluştu', 'error');
    }
}

// Uyarı sistemi başlatma
function initializeAlertSystem() {
    console.log('Alert system initialized');
    
    // Her 5 dakikada bir uyarıları kontrol et
    setInterval(async () => {
        try {
            const triggeredAlerts = await window.ipcRenderer.invoke('check-alerts');
            if (triggeredAlerts.length > 0) {
                showAlertNotifications(triggeredAlerts);
            }
        } catch (error) {
            console.error('Alert check error:', error);
        }
    }, 5 * 60 * 1000); // 5 dakika
    
    // Sayfa yüklendiğinde de kontrol et
    setTimeout(async () => {
        try {
            const triggeredAlerts = await window.ipcRenderer.invoke('check-alerts');
            if (triggeredAlerts.length > 0) {
                showAlertNotifications(triggeredAlerts);
            }
        } catch (error) {
            console.error('Initial alert check error:', error);
        }
    }, 2000); // 2 saniye sonra
}

// Uyarı bildirimlerini göster
function showAlertNotifications(triggeredAlerts) {
    triggeredAlerts.forEach(alert => {
        showAlertNotification(alert);
    });
}

// Tekil uyarı bildirimi göster
function showAlertNotification(alert) {
    const notification = document.createElement('div');
    notification.className = 'alert-notification';
    notification.style.cssText = `
        position: fixed; 
        top: 20px; 
        right: 20px; 
        z-index: 99999;
        padding: 16px 20px; 
        border-radius: 12px; 
        color: white;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        font-size: 14px; 
        font-weight: 500; 
        box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
        border-left: 4px solid #fca5a5;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    const priorityColors = {
        'low': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'medium': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'high': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'critical': 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
    };
    
    notification.style.background = priorityColors[alert.priority] || priorityColors['medium'];
    
    const alertTypeIcons = {
        'stock': '📦',
        'debt': '💰',
        'payment': '💳',
        'custom': '⚙️'
    };
    
    notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            <div style="font-size: 24px; margin-top: 2px;">
                ${alertTypeIcons[alert.alert_type] || '🚨'}
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px; font-size: 16px;">
                    ${alert.alert_name || 'Uyarı'}
                </div>
                <div style="font-size: 13px; opacity: 0.9; margin-bottom: 8px;">
                    ${alert.target_name ? `Hedef: ${alert.target_name}` : ''}
                </div>
                <div style="font-size: 12px; opacity: 0.8;">
                    Değer: <strong>${alert.trigger_value}</strong>
                </div>
                <div style="margin-top: 8px; display: flex; gap: 8px;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            style="padding: 4px 8px; background: rgba(255,255,255,0.2); border: none; border-radius: 4px; color: white; font-size: 11px; cursor: pointer;">
                        Kapat
                    </button>
                    <button onclick="showAlertManagement(); this.parentElement.parentElement.parentElement.remove()" 
                            style="padding: 4px 8px; background: rgba(255,255,255,0.3); border: none; border-radius: 4px; color: white; font-size: 11px; cursor: pointer;">
                        Detaylar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 10 saniye sonra otomatik kapat
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 10000);
}

// CSS animasyonları ekle
const alertStyle = document.createElement('style');
alertStyle.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .alert-notification:hover {
        transform: translateX(-5px);
        transition: transform 0.2s ease;
    }
`;
document.head.appendChild(alertStyle);

// App quit function
window.app = {
    quit: () => {
        if (confirm('Uygulamadan çıkmak istediğinizden emin misiniz?')) {
            window.close();
        }
    }
};

// ==================== VERSION CONTROL FUNCTIONS ====================

// Version bilgilerini yükle
async function loadVersionInfo() {
    try {
        // DOM elementlerinin var olduğundan emin ol
        const schemaVersionEl = document.getElementById('current-schema-version');
        const appVersionEl = document.getElementById('current-app-version');
        const lastMigrationEl = document.getElementById('last-migration-date');
        const lastBackupEl = document.getElementById('last-backup-date');
        
        if (!schemaVersionEl || !appVersionEl || !lastMigrationEl || !lastBackupEl) {
            console.log('Version info elements not found, skipping...');
            return;
        }
        
        // Config bilgilerini al
        const config = await window.electronAPI.getConfig();
        
        // Version bilgilerini güncelle
        schemaVersionEl.textContent = config.schemaVersion || 0;
        appVersionEl.textContent = config.appVersion || '1.0.0';
        lastMigrationEl.textContent = 
            config.lastMigration ? new Date(config.lastMigration).toLocaleString('tr-TR') : 'Hiç yapılmadı';
        lastBackupEl.textContent = 
            config.lastBackup ? new Date(config.lastBackup).toLocaleString('tr-TR') : 'Hiç yapılmadı';
        
        // Rollback seçeneklerini yükle
        loadRollbackOptions();
        
    } catch (error) {
        console.error('Version info load error:', error);
        // Hata durumunda varsayılan değerler göster
        const schemaVersionEl = document.getElementById('current-schema-version');
        const appVersionEl = document.getElementById('current-app-version');
        const lastMigrationEl = document.getElementById('last-migration-date');
        const lastBackupEl = document.getElementById('last-backup-date');
        
        if (schemaVersionEl) schemaVersionEl.textContent = 'Hata';
        if (appVersionEl) appVersionEl.textContent = 'Hata';
        if (lastMigrationEl) lastMigrationEl.textContent = 'Hata';
        if (lastBackupEl) lastBackupEl.textContent = 'Hata';
    }
}

// Rollback seçeneklerini yükle
async function loadRollbackOptions() {
    try {
        const select = document.getElementById('rollback-target-version');
        
        // Select elementi yoksa (basitleştirilmiş versiyonda) skip et
        if (!select) { return; }
        
        const backups = await window.electronAPI.listBackups();
        
        // Mevcut seçenekleri temizle
        select.innerHTML = '<option value="">Version seçin...</option>';
        
        // Backup'ları ekle
        backups.forEach(backup => {
            if (backup.info && backup.info.schemaVersion !== undefined) {
                const option = document.createElement('option');
                option.value = backup.info.schemaVersion;
                option.textContent = `v${backup.info.schemaVersion} - ${new Date(backup.created).toLocaleString('tr-TR')}`;
                select.appendChild(option);
            }
        });
        
    } catch (error) {
        console.error('Rollback options load error:', error);
    }
}

// Manuel yedek oluştur
async function createManualBackup() {
    try {
        showMessage('Manuel yedek oluşturuluyor...', 'info');
        
        const result = await window.electronAPI.createBackup('Manuel yedek');
        
        if (result.success) {
            showMessage('Manuel yedek başarıyla oluşturuldu', 'success');
            loadVersionInfo(); // Bilgileri yenile
        } else {
            showMessage('Yedek oluşturulurken hata oluştu', 'error');
        }
        
    } catch (error) {
        console.error('Manual backup error:', error);
        showMessage('Yedek oluşturulurken hata oluştu', 'error');
    }
}

// Yedek listesini göster
async function showBackupList() {
    try {
        // Mevcut modalı tamamen kaldır ve taze içerik ile yeniden oluştur
        const existing = document.getElementById('backup-list-modal');
        if (existing && existing.parentNode) {
            existing.parentNode.removeChild(existing);
        }

        const backups = await window.electronAPI.listBackups();
        
        let backupListHtml = `
            <div style="max-height: 400px; overflow-y: auto;">
                <h4 style="margin: 0 0 15px 0;">📋 Yedek Listesi</h4>
        `;
        
        if (backups.length === 0) {
            backupListHtml += '<p style="color: #6b7280; text-align: center; padding: 20px;">Henüz yedek bulunmuyor</p>';
        } else {
            backups.forEach(backup => {
                const size = formatBytes(backup.size);
                const created = new Date(backup.created).toLocaleString('tr-TR');
                
                backupListHtml += `
                    <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: between; align-items: center;">
                            <div style="flex: 1;">
                                <h5 style="margin: 0 0 5px 0; color: #374151;">${backup.name}</h5>
                                <p style="margin: 0; font-size: 12px; color: #6b7280;">
                                    📅 ${created} | 📦 ${size}
                                    ${backup.info ? ` | v${backup.info.schemaVersion}` : ''}
                                </p>
                            </div>
                            <div style="display: flex; gap: 5px;">
                                <button onclick="restoreBackup('${backup.name}')" 
                                        style="padding: 5px 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer;">
                                    🔄 Geri Yükle
                                </button>
                                <button onclick="deleteBackup('${backup.name}')" 
                                        style="padding: 5px 10px; background: #ef4444; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer;">
                                    🗑️ Sil
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        backupListHtml += '</div>';
        
        showOrCreateModal('backup-list-modal', `
            <div id="backup-list-modal" class="modal active" onclick="if(event.target.id === 'backup-list-modal') closeModal('backup-list-modal')">
                <div class="modal-content" style="max-width: 800px;" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>📋 Yedek Listesi</h2>
                        <button class="close-btn" onclick="closeModal('backup-list-modal')">&times;</button>
                    </div>
                    <div style="padding: 20px;">
                        ${backupListHtml}
                    </div>
                </div>
            </div>
        `);
        
    } catch (error) {
        console.error('Backup list error:', error);
        showMessage('Yedek listesi yüklenirken hata oluştu', 'error');
    }
}

// Migration loglarını göster
async function showMigrationLogs() {
    try {
        const logs = await window.electronAPI.getLogs();
        
        let logsHtml = `
            <div style="max-height: 400px; overflow-y: auto;">
                <h4 style="margin: 0 0 15px 0;">📝 Migration Logları</h4>
        `;
        
        if (logs.length === 0) {
            logsHtml += '<p style="color: #6b7280; text-align: center; padding: 20px;">Henüz log bulunmuyor</p>';
        } else {
            logs.forEach(log => {
                const logLevel = log.includes('ERROR') ? 'error' : 
                                log.includes('WARN') ? 'warning' : 
                                log.includes('INFO') ? 'info' : 'debug';
                
                const levelColors = {
                    error: '#ef4444',
                    warning: '#f59e0b',
                    info: '#3b82f6',
                    debug: '#6b7280'
                };
                
                logsHtml += `
                    <div style="background: white; padding: 10px; border-radius: 6px; border-left: 4px solid ${levelColors[logLevel]}; margin-bottom: 8px; font-family: monospace; font-size: 12px;">
                        ${log}
                    </div>
                `;
            });
        }
        
        logsHtml += '</div>';
        
        showOrCreateModal('migration-logs-modal', `
            <div id="migration-logs-modal" class="modal active" onclick="if(event.target.id === 'migration-logs-modal') closeModal('migration-logs-modal')">
                <div class="modal-content" style="max-width: 900px;" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>📝 Migration Logları</h2>
                        <button class="close-btn" onclick="closeModal('migration-logs-modal')">&times;</button>
                    </div>
                    <div style="padding: 20px;">
                        ${logsHtml}
                    </div>
                </div>
            </div>
        `);
        
    } catch (error) {
        console.error('Migration logs error:', error);
        showMessage('Migration logları yüklenirken hata oluştu', 'error');
    }
}

// Rollback işlemi gerçekleştir
async function performRollback() {
    const targetVersion = document.getElementById('rollback-target-version').value;
    
    if (!targetVersion) {
        showMessage('Lütfen hedef version seçin', 'warning');
        return;
    }
    
    if (!confirm(`Version ${targetVersion}'a geri almak istediğinizden emin misiniz?\n\nBu işlem geri alınamaz ve veri kaybına neden olabilir!`)) {
        return;
    }
    
    try {
        showMessage('Geri alma işlemi başlatılıyor...', 'info');
        
        const result = await window.electronAPI.performRollback(targetVersion);
        
        if (result.success) {
            showMessage('Geri alma işlemi başarıyla tamamlandı', 'success');
            loadVersionInfo(); // Bilgileri yenile
            closeModal('settings-modal');
        } else {
            showMessage('Geri alma işlemi başarısız', 'error');
        }
        
    } catch (error) {
        console.error('Rollback error:', error);
        showMessage('Geri alma işlemi sırasında hata oluştu', 'error');
    }
}

// Migration testi
async function testMigration() {
    try {
        showMessage('Migration testi başlatılıyor...', 'info');
        
        const result = await window.electronAPI.testMigration();
        
        if (result.success) {
            showMessage('Migration testi başarıyla tamamlandı', 'success');
            loadVersionInfo(); // Bilgileri yenile
        } else {
            showMessage('Migration testi başarısız', 'error');
        }
        
    } catch (error) {
        console.error('Migration test error:', error);
        showMessage('Migration testi sırasında hata oluştu', 'error');
    }
}

// Yedek geri yükle
async function restoreBackup(backupName) {
    if (!confirm(`"${backupName}" yedeğini geri yüklemek istediğinizden emin misiniz?\n\nBu işlem mevcut verileri değiştirecektir!`)) {
        return;
    }
    
    try {
        showMessage('Yedek geri yükleniyor...', 'info');
        
        const result = await window.electronAPI.restoreBackup(backupName);
        
        if (result.success) {
            showMessage('Yedek başarıyla geri yüklendi', 'success');
            loadVersionInfo(); // Bilgileri yenile
            // Müşteri listesini güncelle
            try { await loadCustomers(); } catch (e) { console.warn('loadCustomers after restore failed:', e); }
            closeModal('backup-list-modal');
        } else {
            showMessage('Yedek geri yüklenirken hata oluştu', 'error');
        }
        
    } catch (error) {
        console.error('Restore backup error:', error);
        showMessage('Yedek geri yüklenirken hata oluştu', 'error');
    }
}

// Yedek sil
async function deleteBackup(backupName) {
    if (!confirm(`"${backupName}" yedeğini silmek istediğinizden emin misiniz?`)) {
        return;
    }
    
    try {
        showMessage('Yedek siliniyor...', 'info');
        
        const result = await window.electronAPI.deleteBackup(backupName);
        
        if (result.success) {
            showMessage('Yedek başarıyla silindi', 'success');
            showBackupList(); // Listeyi yenile
        } else {
            showMessage('Yedek silinirken hata oluştu', 'error');
        }
        
    } catch (error) {
        console.error('Delete backup error:', error);
        showMessage('Yedek silinirken hata oluştu', 'error');
    }
}

// Byte formatı
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==================== VERSION UPDATE FUNCTIONS ====================

// Güncelleme bilgilerini yükle
async function loadUpdateInfo() {
    try {
        const currentVersionEl = document.getElementById('current-version');
        const latestVersionEl = document.getElementById('latest-version');
        const updateStatusEl = document.getElementById('update-status');
        
        if (!currentVersionEl || !latestVersionEl || !updateStatusEl) {
            console.log('Update info elements not found, skipping...');
            return;
        }
        
        // Mevcut version'ı göster
        const config = await window.electronAPI.getConfig();
        currentVersionEl.textContent = config.appVersion || '1.0.0';
        
        // GitHub'dan en son version'ı kontrol et
        await checkForUpdates();
        
    } catch (error) {
        console.error('Update info load error:', error);
        const latestVersionEl = document.getElementById('latest-version');
        const updateStatusEl = document.getElementById('update-status');
        if (latestVersionEl) latestVersionEl.textContent = 'Hata';
        if (updateStatusEl) updateStatusEl.textContent = 'Kontrol edilemedi';
    }
}

// Güncellemeleri kontrol et
async function checkForUpdates() {
    try {
        const latestVersionEl = document.getElementById('latest-version');
        const updateStatusEl = document.getElementById('update-status');
        const downloadBtn = document.getElementById('download-btn');
        const installBtn = document.getElementById('install-btn');
        
        if (!latestVersionEl || !updateStatusEl) return;
        
        showMessage('GitHub\'dan güncellemeler kontrol ediliyor...', 'info');
        
        // GitHub API üzerinden güncelleme kontrolü
        const result = await window.electronAPI.checkForUpdates();
        
        if (!result.success) {
            latestVersionEl.textContent = 'Hata';
            updateStatusEl.textContent = result.error || 'Kontrol edilemedi';
            updateStatusEl.style.color = '#ef4444';
            
            if (downloadBtn) downloadBtn.style.display = 'none';
            if (installBtn) installBtn.style.display = 'none';
            
            showMessage('GitHub güncelleme kontrolü başarısız: ' + (result.error || 'Bilinmeyen hata'), 'error');
            return;
        }
        
        const latestVersion = result.latestVersion || '1.0.0';
        const currentVersion = result.currentVersion || '1.0.0';
        
        latestVersionEl.textContent = latestVersion;
        
        if (result.hasUpdate) {
            updateStatusEl.textContent = `Yeni güncelleme mevcut! (${currentVersion} → ${latestVersion})`;
            updateStatusEl.style.color = '#f59e0b';
            
            // Platforma uygun indirme linki var mı?
            let platformUrl = null;
            const isMac = navigator.userAgent.includes('Mac');
            const isWin = navigator.userAgent.includes('Windows');
            const isLinux = navigator.userAgent.includes('Linux') && !isMac && !isWin;
            const urls = result.downloadUrls || {};
            if (isWin && urls.windows) platformUrl = urls.windows;
            if (isMac && urls.macos) platformUrl = urls.macos;
            if (isLinux && urls.linux) platformUrl = urls.linux;

            if (downloadBtn) {
                const fallbackUrl = (result.downloadUrls && result.downloadUrls.fallback) ? result.downloadUrls.fallback : null;
                if (platformUrl || fallbackUrl) {
                    downloadBtn.style.display = 'inline-block';
                    downloadBtn.setAttribute('data-download-url', platformUrl || fallbackUrl);
                    downloadBtn.onclick = () => downloadUpdate();
                } else {
                    // Asset yoksa butonu gizle ve durum mesajı göster
                    downloadBtn.style.display = 'none';
                    updateStatusEl.textContent += ' (İndirme dosyası bulunamadı)';
                }
            }
            
            // Release notlarını göster
            if (result.releaseNotes) {
                showReleaseNotes(result.releaseNotes, latestVersion, result.releaseUrl);
            }
            
            showMessage(`Yeni güncelleme mevcut: ${latestVersion}`, 'success');
            
        } else {
            updateStatusEl.textContent = 'Uygulamanız güncel';
            updateStatusEl.style.color = '#10b981';
            
            if (downloadBtn) downloadBtn.style.display = 'none';
            if (installBtn) installBtn.style.display = 'none';
        }
        
        showMessage('Güncelleme kontrolü tamamlandı', 'success');
        
    } catch (error) {
        console.error('Check updates error:', error);
        const latestVersionEl = document.getElementById('latest-version');
        const updateStatusEl = document.getElementById('update-status');
        
        if (latestVersionEl) latestVersionEl.textContent = 'Hata';
        if (updateStatusEl) {
            updateStatusEl.textContent = 'Kontrol edilemedi';
            updateStatusEl.style.color = '#ef4444';
        }
        
        showMessage('Güncelleme kontrolü başarısız', 'error');
    }
}

// Version karşılaştırması
function compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
        const v1part = v1parts[i] || 0;
        const v2part = v2parts[i] || 0;
        
        if (v1part > v2part) return 1;
        if (v1part < v2part) return -1;
    }
    
    return 0;
}

// Güncellemeyi indir
async function downloadUpdate() {
    try {
        const downloadBtn = document.getElementById('download-btn');
        const installBtn = document.getElementById('install-btn');
        const progressDiv = document.getElementById('update-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        if (!downloadBtn || !progressDiv || !progressFill || !progressText) return;
        
        const downloadUrl = downloadBtn.getAttribute('data-download-url');
        if (!downloadUrl) {
            showMessage('İndirme URL\'si bulunamadı', 'error');
            return;
        }
        
        showMessage('Güncelleme indiriliyor...', 'info');
        
        // Progress bar'ı göster
        progressDiv.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'İndiriliyor...';
        
        // IPC üzerinden indirme
        const result = await window.electronAPI.downloadUpdate(downloadUrl);
        
        if (result.success) {
            progressText.textContent = 'İndirme tamamlandı';
            downloadBtn.style.display = 'none';
            if (installBtn) installBtn.style.display = 'inline-block';
            
            showMessage('Güncelleme indirildi', 'success');
        } else {
            throw new Error(result.error || 'İndirme başarısız');
        }
        
    } catch (error) {
        console.error('Download update error:', error);
        showMessage('Güncelleme indirilirken hata oluştu', 'error');
    }
}

// Güncellemeyi kur
async function installUpdate() {
    try {
        const installBtn = document.getElementById('install-btn');
        const progressDiv = document.getElementById('update-progress');
        const progressText = document.getElementById('progress-text');
        
        if (!installBtn || !progressDiv || !progressText) return;
        
        if (!confirm('Güncelleme kurulacak ve uygulama yeniden başlatılacak. Devam etmek istiyor musunuz?')) {
            return;
        }
        
        showMessage('Güncelleme kuruluyor...', 'info');
        
        progressText.textContent = 'Kuruluyor...';
        
        // IPC üzerinden kurulum
        const result = await window.electronAPI.installUpdate();
        
        if (result.success) {
            progressText.textContent = 'Kurulum tamamlandı';
            showMessage('Güncelleme başarıyla kuruldu. Uygulama yeniden başlatılacak.', 'success');
            
            if (result.restartRequired) {
                setTimeout(() => {
                    if (confirm('Uygulamayı yeniden başlatmak istiyor musunuz?')) {
                        window.location.reload();
                    }
                }, 2000);
            }
        } else {
            throw new Error(result.error || 'Kurulum başarısız');
        }
        
    } catch (error) {
        console.error('Install update error:', error);
        showMessage('Güncelleme kurulurken hata oluştu', 'error');
    }
}

// Manuel version güncelleme
async function manualVersionUpdate() {
    try {
        // Modal ile version girişi
        const modalHtml = `
            <div id="version-update-modal" class="modal active" onclick="if(event.target.id === 'version-update-modal') closeModal('version-update-modal')" style="z-index: 20000;">
                <div class="modal-content" style="max-width: 400px;" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>🔧 Manuel Version Güncelleme</h2>
                        <button onclick="closeModal('version-update-modal')" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Mevcut Version:</label>
                            <div style="padding: 8px; background: #f3f4f6; border-radius: 6px; font-family: monospace; font-size: 14px;" id="current-version-display">Yükleniyor...</div>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Hedef Version *</label>
                            <input type="text" id="new-version-input" placeholder="örn: 1.2.0" 
                                   style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                            <div style="margin-top: 5px; font-size: 12px; color: #6b7280;">
                                💡 <strong>Önerilen:</strong> <span id="suggested-version">1.2.0</span> (mevcut + 0.1.0)
                            </div>
                        </div>
                        
                        <div style="background: #f0f9ff; padding: 12px; border-radius: 6px; border-left: 4px solid #3b82f6; margin-bottom: 15px;">
                            <h5 style="margin: 0 0 5px 0; color: #1e40af;">ℹ️ Bilgi</h5>
                            <p style="margin: 0; font-size: 12px; color: #1e40af;">
                                Version numarası <strong>MAJOR.MINOR.PATCH</strong> formatında olmalıdır. Örnek: 1.2.0
                            </p>
                        </div>
                        
                        <div style="background: #fef3c7; padding: 12px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 15px;">
                            <h5 style="margin: 0 0 5px 0; color: #92400e;">⚠️ Uyarı</h5>
                            <p style="margin: 0; font-size: 12px; color: #92400e;">
                                Version güncellemesi geri alınamaz. Lütfen doğru version numarasını girdiğinizden emin olun.
                            </p>
                        </div>
                        
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button onclick="closeModal('version-update-modal')" 
                                    style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">
                                İptal
                            </button>
                            <button onclick="confirmVersionUpdate()" 
                                    style="padding: 8px 16px; background: #f59e0b; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">
                                🔧 Version Güncelle
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mevcut version'ı göster ve önerilen version'ı hesapla
        const currentVersionEl = document.getElementById('current-version-display');
        const suggestedVersionEl = document.getElementById('suggested-version');
        const config = await window.electronAPI.getConfig();
        const currentVersion = config.appVersion || '1.1.0';
        
        currentVersionEl.textContent = currentVersion;
        
        // Önerilen version'ı hesapla (minor version +1)
        const versionParts = currentVersion.split('.');
        const major = parseInt(versionParts[0]) || 1;
        const minor = parseInt(versionParts[1]) || 0;
        const patch = parseInt(versionParts[2]) || 0;
        
        const suggestedVersion = `${major}.${minor + 1}.${patch}`;
        suggestedVersionEl.textContent = suggestedVersion;
        
        // Input'a önerilen version'ı otomatik doldur
        const input = document.getElementById('new-version-input');
        input.value = suggestedVersion;
        
        // Input'a odaklan
        setTimeout(() => {
            if (input) input.focus();
        }, 100);
        
    } catch (error) {
        console.error('Manual version update modal error:', error);
        showMessage('Version güncelleme modalı açılırken hata oluştu', 'error');
    }
}

// Version güncellemeyi onayla
async function confirmVersionUpdate() {
    try {
        const newVersion = document.getElementById('new-version-input').value.trim();
        
        if (!newVersion) {
            showMessage('Lütfen yeni version numarasını girin', 'error');
            return;
        }
        
        // Version formatını kontrol et
        const versionRegex = /^\d+\.\d+\.\d+$/;
        if (!versionRegex.test(newVersion)) {
            showMessage('Geçersiz version formatı! Örnek: 1.2.0', 'error');
            return;
        }
        
        // Mevcut version ile aynı mı kontrol et
        const config = await window.electronAPI.getConfig();
        const currentVersion = config.appVersion || '1.1.0';
        
        if (newVersion === currentVersion) {
            showMessage('Yeni version mevcut version ile aynı!', 'error');
            return;
        }
        
        if (!confirm(`Version'ı ${currentVersion} → ${newVersion} olarak güncellemek istediğinizden emin misiniz?`)) {
            return;
        }
        
        showMessage('Version güncelleniyor...', 'info');
        
        // IPC üzerinden version güncelleme
        const result = await window.electronAPI.updateAppVersion(newVersion);
        
        if (result.success) {
            showMessage(`Version başarıyla ${newVersion} olarak güncellendi!`, 'success');
            
            // Modal'ı kapat
            closeModal('version-update-modal');
            
            // Version bilgilerini yeniden yükle
            await loadUpdateInfo();
            
            // Uygulamayı yeniden başlatma önerisi
            setTimeout(() => {
                if (confirm('Değişikliklerin etkili olması için uygulamayı yeniden başlatmak istiyor musunuz?')) {
                    window.location.reload();
                }
            }, 2000);
        } else {
            throw new Error(result.error || 'Version güncellenemedi');
        }
        
    } catch (error) {
        console.error('Confirm version update error:', error);
        showMessage('Version güncellenirken hata oluştu: ' + error.message, 'error');
    }
}

// Güncelleme loglarını göster
async function showUpdateLogs() {
    try {
        // IPC üzerinden logları al
        const result = await window.electronAPI.getUpdateLogs();
        
        let logsContent = '';
        if (result && result.success && result.logs) {
            const logs = result.logs;
            if (Array.isArray(logs)) {
                if (logs.length > 0 && typeof logs[0] === 'string') {
                    logsContent = logs.map(line => `<div style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${line}</div>`).join('');
                } else {
                    logsContent = logs.map(log => {
                        const ts = log.timestamp ? new Date(log.timestamp).toLocaleString('tr-TR') : '';
                        const msg = log.message || '';
                        return `<div style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${ts ? `<strong>${ts}</strong> - ` : ''}${msg}</div>`;
                    }).join('');
                }
            } else if (typeof logs === 'string') {
                logsContent = `<div style="white-space: pre-wrap; font-family: monospace; font-size: 12px;">${logs}</div>`;
            }
        }
        if (!logsContent) {
            logsContent = `
                <div style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                    <strong>2024-10-19 22:00:00</strong> - v1.0.0 kuruldu
                </div>
                <div style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                    <strong>2024-10-19 21:56:00</strong> - Migration sistemi eklendi
                </div>
                <div style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                    <strong>2024-10-19 21:30:00</strong> - Alert sistemi eklendi
                </div>
                <div style="padding: 8px;">
                    <strong>2024-10-19 21:00:00</strong> - İlk kurulum
                </div>
            `;
        }
        
        const modalHtml = `
            <div id="update-logs-modal" class="modal active" onclick="if(event.target.id === 'update-logs-modal') closeModal('update-logs-modal')" style="z-index: 20000;">
                <div class="modal-content" style="max-width: 800px; max-height: 80vh;" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>📋 Güncelleme Logları</h2>
                        <button onclick="closeModal('update-logs-modal')" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h4 style="margin: 0 0 10px 0;">Güncelleme Geçmişi</h4>
                            <div id="update-logs-content" style="max-height: 400px; overflow-y: auto; font-family: monospace; font-size: 12px; line-height: 1.4;">
                                ${logsContent}
                            </div>
                        </div>
                        
                        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                            <h5 style="margin: 0 0 10px 0; color: #1e40af;">ℹ️ Bilgi</h5>
                            <p style="margin: 0; font-size: 14px; color: #1e40af;">
                                Güncelleme logları otomatik olarak kaydedilir. Her güncelleme işlemi burada görüntülenir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
    } catch (error) {
        console.error('Show update logs error:', error);
        showMessage('Güncelleme logları yüklenirken hata oluştu', 'error');
    }
}

// ==================== KULLANICI YÖNETİMİ FONKSİYONLARI ====================

// Uygulama başlangıcında session kontrolü
async function initializeUserSession() {
    try {
        // Önce ilk kurulum kontrolü yap
        const firstTimeCheck = await window.electronAPI.checkFirstTimeSetup();
        
        if (firstTimeCheck.success && firstTimeCheck.isFirstTime) {
            console.log('🎉 İlk kurulum tespit edildi');
            showFirstTimeSetupModal();
            return false;
        }
        
        // LocalStorage'dan session token'ı al
        const savedToken = localStorage.getItem('sessionToken');
        if (savedToken) {
            const result = await window.electronAPI.validateSession(savedToken);
            if (result.success) {
                window.currentUser = result.user;
                window.sessionToken = savedToken;
                window.isLoggedIn = true;
                updateUserInterface();
                console.log('✅ Otomatik giriş başarılı:', result.user.username);
                return true;
            } else {
                // Geçersiz token'ı temizle
                localStorage.removeItem('sessionToken');
                localStorage.removeItem('userData');
            }
        }
        
        // Giriş yapılmamışsa login ekranını göster
        showLoginModal();
        return false;
        
    } catch (error) {
        console.error('Session başlatma hatası:', error);
        showLoginModal();
        return false;
    }
}

// Login modalını göster
function showLoginModal() {
    console.log('🔐 Login modal gösteriliyor...');
    
    // Önce arka planı tamamen gizle
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.style.display = 'none';
        console.log('📱 App container gizlendi');
    }
    
    // Mevcut modal'ı temizle
    const existingModal = document.getElementById('dynamic-login-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Tamamen yeni dinamik modal oluştur
    const modalHtml = `
        <div id="dynamic-login-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        ">
            <div style="
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 24px;
                padding: 0;
                width: 90%;
                max-width: 450px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                overflow: hidden;
            ">
                <!-- Header -->
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px 30px 30px 30px;
                    text-align: center;
                    color: white;
                ">
                    <div style="
                        width: 80px;
                        height: 80px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 50%;
                        margin: 0 auto 20px auto;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 32px;
                        backdrop-filter: blur(10px);
                        border: 2px solid rgba(255, 255, 255, 0.3);
                    ">
                        🔐
                    </div>
                    <h1 style="
                        margin: 0 0 8px 0;
                        font-size: 28px;
                        font-weight: 700;
                        letter-spacing: -0.5px;
                    ">Hoş Geldiniz</h1>
                    <p style="
                        margin: 0;
                        font-size: 16px;
                        opacity: 0.9;
                        font-weight: 300;
                    ">Hesabınıza giriş yapın</p>
                </div>
                
                <!-- Form -->
                <div style="padding: 40px 30px;">
                    <form id="dynamic-login-form" style="margin: 0;">
                        <div style="margin-bottom: 24px;">
                            <label style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #374151;
                                font-size: 14px;
                            ">Kullanıcı Adı</label>
                            <div style="position: relative;">
                                <input type="text" name="username" required 
                                       style="
                                           width: 100%;
                                           padding: 16px 20px 16px 50px;
                                           border: 2px solid #e5e7eb;
                                           border-radius: 12px;
                                           font-size: 16px;
                                           outline: none;
                                           transition: all 0.3s ease;
                                           background: #f9fafb;
                                           box-sizing: border-box;
                                       "
                                       placeholder="Kullanıcı adınızı girin"
                                       onfocus="this.style.borderColor='#667eea'; this.style.background='white'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                                       onblur="this.style.borderColor='#e5e7eb'; this.style.background='#f9fafb'; this.style.boxShadow='none'">
                                <div style="
                                    position: absolute;
                                    left: 16px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    color: #9ca3af;
                                    font-size: 18px;
                                ">👤</div>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 24px;">
                            <label style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #374151;
                                font-size: 14px;
                            ">Şifre</label>
                            <div style="position: relative;">
                                <input type="password" name="password" required 
                                       style="
                                           width: 100%;
                                           padding: 16px 20px 16px 50px;
                                           border: 2px solid #e5e7eb;
                                           border-radius: 12px;
                                           font-size: 16px;
                                           outline: none;
                                           transition: all 0.3s ease;
                                           background: #f9fafb;
                                           box-sizing: border-box;
                                       "
                                       placeholder="Şifrenizi girin"
                                       onfocus="this.style.borderColor='#667eea'; this.style.background='white'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                                       onblur="this.style.borderColor='#e5e7eb'; this.style.background='#f9fafb'; this.style.boxShadow='none'">
                                <div style="
                                    position: absolute;
                                    left: 16px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    color: #9ca3af;
                                    font-size: 18px;
                                ">🔒</div>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 30px;">
                            <label style="
                                display: flex;
                                align-items: center;
                                cursor: pointer;
                                font-size: 14px;
                                color: #6b7280;
                            ">
                                <input type="checkbox" name="rememberMe" style="margin-right: 8px;">
                                Beni hatırla (30 gün)
                            </label>
                        </div>
                        
                        <button type="submit" style="
                            width: 100%;
                            padding: 16px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(102, 126, 234, 0.4)'">
                            🔑 Giriş Yap
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Modal'ı DOM'a ekle
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    console.log('✅ Dinamik login modal oluşturuldu');
    
    // Form submit handler
    const form = document.getElementById('dynamic-login-form');
    if (form) {
        form.addEventListener('submit', handleDynamicLogin);
        console.log('📝 Dinamik login form handler eklendi');
    } else {
        console.error('❌ Dinamik login form bulunamadı!');
    }
}

// Eski dinamik modal fonksiyonu - artık kullanılmıyor
function showLoginModalOld() {
    const modalHtml = `
        <div id="login-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        ">
            <div style="
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 24px;
                padding: 0;
                width: 90%;
                max-width: 450px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                overflow: hidden;
                animation: slideInUp 0.6s ease-out;
            ">
                <!-- Header -->
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px 30px 30px 30px;
                    text-align: center;
                    color: white;
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="
                        position: absolute;
                        top: -50%;
                        left: -50%;
                        width: 200%;
                        height: 200%;
                        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                        animation: float 6s ease-in-out infinite;
                    "></div>
                    <div style="position: relative; z-index: 2;">
                        <div style="
                            width: 80px;
                            height: 80px;
                            background: rgba(255, 255, 255, 0.2);
                            border-radius: 50%;
                            margin: 0 auto 20px auto;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 32px;
                            backdrop-filter: blur(10px);
                            border: 2px solid rgba(255, 255, 255, 0.3);
                        ">
                            🔐
                        </div>
                        <h1 style="
                            margin: 0 0 8px 0;
                            font-size: 28px;
                            font-weight: 700;
                            letter-spacing: -0.5px;
                        ">Hoş Geldiniz</h1>
                        <p style="
                            margin: 0;
                            font-size: 16px;
                            opacity: 0.9;
                            font-weight: 300;
                        ">Hesabınıza giriş yapın</p>
                    </div>
                </div>
                
                <!-- Form -->
                <div style="padding: 40px 30px;">
                    <form id="login-form" style="margin: 0;">
                        <div style="margin-bottom: 24px;">
                            <label style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #374151;
                                font-size: 14px;
                            ">Kullanıcı Adı</label>
                            <div style="position: relative;">
                                <input type="text" name="username" required 
                                       style="
                                           width: 100%;
                                           padding: 16px 20px 16px 50px;
                                           border: 2px solid #e5e7eb;
                                           border-radius: 12px;
                                           font-size: 16px;
                                           outline: none;
                                           transition: all 0.3s ease;
                                           background: #f9fafb;
                                       "
                                       placeholder="Kullanıcı adınızı girin"
                                       onfocus="this.style.borderColor='#667eea'; this.style.background='white'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                                       onblur="this.style.borderColor='#e5e7eb'; this.style.background='#f9fafb'; this.style.boxShadow='none'">
                                <div style="
                                    position: absolute;
                                    left: 16px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    color: #9ca3af;
                                    font-size: 18px;
                                ">👤</div>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 24px;">
                            <label style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #374151;
                                font-size: 14px;
                            ">Şifre</label>
                            <div style="position: relative;">
                                <input type="password" name="password" required 
                                       style="
                                           width: 100%;
                                           padding: 16px 20px 16px 50px;
                                           border: 2px solid #e5e7eb;
                                           border-radius: 12px;
                                           font-size: 16px;
                                           outline: none;
                                           transition: all 0.3s ease;
                                           background: #f9fafb;
                                       "
                                       placeholder="Şifrenizi girin"
                                       onfocus="this.style.borderColor='#667eea'; this.style.background='white'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                                       onblur="this.style.borderColor='#e5e7eb'; this.style.background='#f9fafb'; this.style.boxShadow='none'">
                                <div style="
                                    position: absolute;
                                    left: 16px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    color: #9ca3af;
                                    font-size: 18px;
                                ">🔒</div>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 30px;">
                            <label style="
                                display: flex;
                                align-items: center;
                                cursor: pointer;
                                font-size: 14px;
                                color: #6b7280;
                            ">
                                <input type="checkbox" name="rememberMe" 
                                       style="
                                           margin-right: 8px;
                                           width: 18px;
                                           height: 18px;
                                           accent-color: #667eea;
                                       ">
                                Beni hatırla (30 gün)
                            </label>
                        </div>
                        
                        <button type="submit" 
                                style="
                                    width: 100%;
                                    padding: 16px;
                                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                    color: white;
                                    border: none;
                                    border-radius: 12px;
                                    font-size: 16px;
                                    font-weight: 600;
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                                "
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.6)'"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(102, 126, 234, 0.4)'">
                            🚀 Giriş Yap
                        </button>
                    </form>
                    
                    <!-- Kayıt Ol Linki -->
                    <div style="
                        text-align: center;
                        margin-top: 24px;
                        padding-top: 24px;
                        border-top: 1px solid #e5e7eb;
                    ">
                        <p style="
                            margin: 0 0 12px 0;
                            color: #6b7280;
                            font-size: 14px;
                        ">Hesabınız yok mu?</p>
                        <button type="button" onclick="showRegisterModal()" 
                                style="
                                    background: none;
                                    border: none;
                                    color: #667eea;
                                    font-size: 14px;
                                    font-weight: 600;
                                    cursor: pointer;
                                    text-decoration: underline;
                                    transition: color 0.3s ease;
                                "
                                onmouseover="this.style.color='#764ba2'"
                                onmouseout="this.style.color='#667eea'">
                            📝 Kayıt Ol
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes float {
                0%, 100% {
                    transform: translateY(0px) rotate(0deg);
                }
                50% {
                    transform: translateY(-20px) rotate(180deg);
                }
            }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Form submit handler
    document.getElementById('login-form').addEventListener('submit', handleLogin);
}

// Register modalını göster
function showRegisterModal() {
    // Login modalını kapat
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
        loginModal.remove();
    }
    
    const modalHtml = `
        <div id="register-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        ">
            <div style="
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 24px;
                padding: 0;
                width: 90%;
                max-width: 500px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                overflow: hidden;
                animation: slideInUp 0.6s ease-out;
                max-height: 90vh;
                overflow-y: auto;
            ">
                <!-- Header -->
                <div style="
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    padding: 40px 30px 30px 30px;
                    text-align: center;
                    color: white;
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="
                        position: absolute;
                        top: -50%;
                        left: -50%;
                        width: 200%;
                        height: 200%;
                        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                        animation: float 6s ease-in-out infinite;
                    "></div>
                    <div style="position: relative; z-index: 2;">
                        <div style="
                            width: 80px;
                            height: 80px;
                            background: rgba(255, 255, 255, 0.2);
                            border-radius: 50%;
                            margin: 0 auto 20px auto;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 32px;
                            backdrop-filter: blur(10px);
                            border: 2px solid rgba(255, 255, 255, 0.3);
                        ">
                            📝
                        </div>
                        <h1 style="
                            margin: 0 0 8px 0;
                            font-size: 28px;
                            font-weight: 700;
                            letter-spacing: -0.5px;
                        ">Kayıt Ol</h1>
                        <p style="
                            margin: 0;
                            font-size: 16px;
                            opacity: 0.9;
                            font-weight: 300;
                        ">Yeni hesap oluşturun</p>
                    </div>
                </div>
                
                <!-- Form -->
                <div style="padding: 40px 30px;">
                    <form id="register-form" style="margin: 0;">
                        <div style="margin-bottom: 20px;">
                            <label style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #374151;
                                font-size: 14px;
                            ">Ad Soyad</label>
                            <div style="position: relative;">
                                <input type="text" name="fullName" required 
                                       style="
                                           width: 100%;
                                           padding: 14px 20px 14px 50px;
                                           border: 2px solid #e5e7eb;
                                           border-radius: 12px;
                                           font-size: 16px;
                                           outline: none;
                                           transition: all 0.3s ease;
                                           background: #f9fafb;
                                       "
                                       placeholder="Adınızı ve soyadınızı girin"
                                       onfocus="this.style.borderColor='#10b981'; this.style.background='white'; this.style.boxShadow='0 0 0 3px rgba(16, 185, 129, 0.1)'"
                                       onblur="this.style.borderColor='#e5e7eb'; this.style.background='#f9fafb'; this.style.boxShadow='none'">
                                <div style="
                                    position: absolute;
                                    left: 16px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    color: #9ca3af;
                                    font-size: 18px;
                                ">👤</div>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #374151;
                                font-size: 14px;
                            ">Kullanıcı Adı</label>
                            <div style="position: relative;">
                                <input type="text" name="username" required 
                                       style="
                                           width: 100%;
                                           padding: 14px 20px 14px 50px;
                                           border: 2px solid #e5e7eb;
                                           border-radius: 12px;
                                           font-size: 16px;
                                           outline: none;
                                           transition: all 0.3s ease;
                                           background: #f9fafb;
                                       "
                                       placeholder="Kullanıcı adınızı girin"
                                       onfocus="this.style.borderColor='#10b981'; this.style.background='white'; this.style.boxShadow='0 0 0 3px rgba(16, 185, 129, 0.1)'"
                                       onblur="this.style.borderColor='#e5e7eb'; this.style.background='#f9fafb'; this.style.boxShadow='none'">
                                <div style="
                                    position: absolute;
                                    left: 16px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    color: #9ca3af;
                                    font-size: 18px;
                                ">🏷️</div>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #374151;
                                font-size: 14px;
                            ">E-posta</label>
                            <div style="position: relative;">
                                <input type="email" name="email" required 
                                       style="
                                           width: 100%;
                                           padding: 14px 20px 14px 50px;
                                           border: 2px solid #e5e7eb;
                                           border-radius: 12px;
                                           font-size: 16px;
                                           outline: none;
                                           transition: all 0.3s ease;
                                           background: #f9fafb;
                                       "
                                       placeholder="E-posta adresinizi girin"
                                       onfocus="this.style.borderColor='#10b981'; this.style.background='white'; this.style.boxShadow='0 0 0 3px rgba(16, 185, 129, 0.1)'"
                                       onblur="this.style.borderColor='#e5e7eb'; this.style.background='#f9fafb'; this.style.boxShadow='none'">
                                <div style="
                                    position: absolute;
                                    left: 16px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    color: #9ca3af;
                                    font-size: 18px;
                                ">📧</div>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #374151;
                                font-size: 14px;
                            ">Şifre</label>
                            <div style="position: relative;">
                                <input type="password" name="password" required 
                                       style="
                                           width: 100%;
                                           padding: 14px 20px 14px 50px;
                                           border: 2px solid #e5e7eb;
                                           border-radius: 12px;
                                           font-size: 16px;
                                           outline: none;
                                           transition: all 0.3s ease;
                                           background: #f9fafb;
                                       "
                                       placeholder="Şifrenizi girin (min. 6 karakter)"
                                       onfocus="this.style.borderColor='#10b981'; this.style.background='white'; this.style.boxShadow='0 0 0 3px rgba(16, 185, 129, 0.1)'"
                                       onblur="this.style.borderColor='#e5e7eb'; this.style.background='#f9fafb'; this.style.boxShadow='none'">
                                <div style="
                                    position: absolute;
                                    left: 16px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    color: #9ca3af;
                                    font-size: 18px;
                                ">🔒</div>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 30px;">
                            <label style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #374151;
                                font-size: 14px;
                            ">Şifre Tekrar</label>
                            <div style="position: relative;">
                                <input type="password" name="confirmPassword" required 
                                       style="
                                           width: 100%;
                                           padding: 14px 20px 14px 50px;
                                           border: 2px solid #e5e7eb;
                                           border-radius: 12px;
                                           font-size: 16px;
                                           outline: none;
                                           transition: all 0.3s ease;
                                           background: #f9fafb;
                                       "
                                       placeholder="Şifrenizi tekrar girin"
                                       onfocus="this.style.borderColor='#10b981'; this.style.background='white'; this.style.boxShadow='0 0 0 3px rgba(16, 185, 129, 0.1)'"
                                       onblur="this.style.borderColor='#e5e7eb'; this.style.background='#f9fafb'; this.style.boxShadow='none'">
                                <div style="
                                    position: absolute;
                                    left: 16px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    color: #9ca3af;
                                    font-size: 18px;
                                ">🔐</div>
                            </div>
                        </div>
                        
                        <button type="submit" 
                                style="
                                    width: 100%;
                                    padding: 16px;
                                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                                    color: white;
                                    border: none;
                                    border-radius: 12px;
                                    font-size: 16px;
                                    font-weight: 600;
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
                                "
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(16, 185, 129, 0.6)'"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(16, 185, 129, 0.4)'">
                            🚀 Kayıt Ol
                        </button>
                    </form>
                    
                    <!-- Giriş Yap Linki -->
                    <div style="
                        text-align: center;
                        margin-top: 24px;
                        padding-top: 24px;
                        border-top: 1px solid #e5e7eb;
                    ">
                        <p style="
                            margin: 0 0 12px 0;
                            color: #6b7280;
                            font-size: 14px;
                        ">Zaten hesabınız var mı?</p>
                        <button type="button" onclick="showLoginModal()" 
                                style="
                                    background: none;
                                    border: none;
                                    color: #10b981;
                                    font-size: 14px;
                                    font-weight: 600;
                                    cursor: pointer;
                                    text-decoration: underline;
                                    transition: color 0.3s ease;
                                "
                                onmouseover="this.style.color='#059669'"
                                onmouseout="this.style.color='#10b981'">
                            🔐 Giriş Yap
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Form submit handler
    document.getElementById('register-form').addEventListener('submit', handleRegister);
}

// İlk kurulum modalını göster
function showFirstTimeSetupModal() {
    // Önce arka planı tamamen gizle
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.style.display = 'none';
    }
    
    // Modal'ı göster
    const modal = document.getElementById('first-time-setup-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '99999';
        
        // Form submit handler
        document.getElementById('first-time-registration-form').addEventListener('submit', handleFirstTimeRegistration);
    }
}

// İlk kurulum kayıt işlemi
async function handleFirstTimeRegistration(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Form validasyonu
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    if (password !== confirmPassword) {
        showMessage('Şifreler eşleşmiyor!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Şifre en az 6 karakter olmalıdır!', 'error');
        return;
    }
    
    const userData = {
        email: formData.get('email'),
        phone: formData.get('phone'),
        companyName: formData.get('companyName'),
        fullName: formData.get('fullName'),
        password: password
    };
    
    // Loading state
    const submitBtn = document.getElementById('register-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="btn-icon">⏳</span>Kayıt Olunuyor...';
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    
    try {
        const result = await window.electronAPI.registerFirstUser(userData);
        
        if (result.success) {
            showMessage(result.message, 'success');
            
            // 2 saniye sonra uygulamayı başlat
            setTimeout(async () => {
                // Modal'ı kapat
                const modal = document.getElementById('first-time-setup-modal');
                if (modal) {
                    modal.style.display = 'none';
                }
                
                // Uygulamayı göster
                const appContainer = document.querySelector('.app-container');
                if (appContainer) {
                    appContainer.style.display = 'flex';
                }
                
                // Kullanıcı bilgilerini ayarla
                window.currentUser = {
                    id: result.userId,
                    email: userData.email,
                    fullName: userData.fullName,
                    companyName: userData.companyName,
                    role: 'admin'
                };
                window.isLoggedIn = true;
                
                // Uygulama verilerini yükle
                await loadCustomers();
                if (typeof loadProductsData === 'function') await loadProductsData();
                if (typeof loadCategoriesData === 'function') await loadCategoriesData();
                if (typeof loadBrandsData === 'function') await loadBrandsData();
                if (typeof loadAlerts === 'function') await loadAlerts();
                if (typeof loadAlertTriggers === 'function') await loadAlertTriggers();
                if (typeof setDefaultDates === 'function') setDefaultDates();
                
                updateUserInterface();
                console.log('✅ İlk kurulum tamamlandı ve uygulama başlatıldı');
                
            }, 2000);
            
        } else {
            showMessage(result.error || 'Kayıt sırasında bir hata oluştu!', 'error');
        }
        
    } catch (error) {
        console.error('İlk kurulum hatası:', error);
        showMessage('Kayıt sırasında bir hata oluştu!', 'error');
    } finally {
        // Loading state'i kaldır
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
}

// Dinamik login işlemi
async function handleDynamicLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const credentials = {
        username: formData.get('username'),
        password: formData.get('password'),
        rememberMe: formData.get('rememberMe') === 'on'
    };
    
    try {
        const result = await window.electronAPI.loginUser(credentials);
        
        if (result.success) {
            // Session bilgilerini kaydet
            window.currentUser = result.user;
            window.sessionToken = result.sessionToken;
            window.isLoggedIn = true;
            
            // LocalStorage'a kaydet
            if (credentials.rememberMe) {
                localStorage.setItem('sessionToken', result.sessionToken);
                localStorage.setItem('userData', JSON.stringify(result.user));
            }
            
            // Modal'ı kapat
            const loginModal = document.getElementById('dynamic-login-modal');
            if (loginModal) {
                loginModal.remove();
            }
            
            // Arka planı tekrar göster
            const appContainer = document.querySelector('.app-container');
            if (appContainer) {
                appContainer.style.display = 'flex';
            }
            
            // UI'yi güncelle
            console.log('🔄 UI güncelleniyor...');
            try {
                updateUserInterface();
                console.log('✅ updateUserInterface tamamlandı');
            } catch (error) {
                console.error('❌ updateUserInterface hatası:', error);
            }
            
            try {
                updateUIForUserRole();
                console.log('✅ updateUIForUserRole tamamlandı');
            } catch (error) {
                console.error('❌ updateUIForUserRole hatası:', error);
            }
            
            // Uygulama verilerini yükle
            console.log('🔄 Uygulama verileri yükleniyor...');
            try {
                await loadCustomers();
                console.log('✅ Müşteri verileri yüklendi');
            } catch (error) {
                console.error('❌ Veri yükleme hatası:', error);
                console.error('❌ Hata detayları:', error.message);
                console.error('❌ Hata stack:', error.stack);
                showMessage('Veri yükleme sırasında hata oluştu: ' + error.message, 'error');
            }
            
            showMessage('Giriş başarılı! Hoş geldiniz ' + result.user.fullName, 'success');
            console.log('✅ Giriş işlemi tamamlandı');
            
        } else {
            showMessage(result.error || 'Giriş başarısız', 'error');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Giriş sırasında hata oluştu', 'error');
    }
}

// Login işlemi
async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const credentials = {
        username: formData.get('email'), // HTML'de name="email" olarak tanımlı ama username için kullanılıyor
        password: formData.get('password'),
        rememberMe: formData.get('rememberMe') === 'on'
    };
    
    try {
        const result = await window.electronAPI.loginUser(credentials);
        
        if (result.success) {
            // Session bilgilerini kaydet
            window.currentUser = result.user;
            window.sessionToken = result.sessionToken;
            window.isLoggedIn = true;
            
            // LocalStorage'a kaydet
            if (credentials.rememberMe) {
                localStorage.setItem('sessionToken', result.sessionToken);
                localStorage.setItem('userData', JSON.stringify(result.user));
            }
            
            // Modal'ı kapat
            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                loginModal.classList.remove('active');
                loginModal.style.display = 'none';
                loginModal.style.visibility = 'hidden';
                loginModal.style.opacity = '0';
            }
            
            // Arka planı tekrar göster
            const appContainer = document.querySelector('.app-container');
            if (appContainer) {
                appContainer.style.display = 'flex';
            }
            
            // UI'yi güncelle
            console.log('🔄 UI güncelleniyor...');
            try {
                updateUserInterface();
                console.log('✅ updateUserInterface tamamlandı');
            } catch (error) {
                console.error('❌ updateUserInterface hatası:', error);
            }
            
            try {
                updateUIForUserRole();
                console.log('✅ updateUIForUserRole tamamlandı');
            } catch (error) {
                console.error('❌ updateUIForUserRole hatası:', error);
            }
            
            // Uygulama verilerini yükle
            console.log('🔄 Uygulama verileri yükleniyor...');
            try {
                await loadCustomers();
                console.log('✅ Müşteri verileri yüklendi');
            } catch (error) {
                console.error('❌ Veri yükleme hatası:', error);
                console.error('❌ Hata detayları:', error.message);
                console.error('❌ Hata stack:', error.stack);
                showMessage('Veri yükleme sırasında hata oluştu: ' + error.message, 'error');
            }
            
            showMessage('Giriş başarılı! Hoş geldiniz ' + result.user.fullName, 'success');
            console.log('✅ Giriş işlemi tamamlandı');
            
        } else {
            showMessage(result.error || 'Giriş başarısız', 'error');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Giriş sırasında hata oluştu', 'error');
    }
}

// Kayıt işlemi
async function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const userData = {
        fullName: formData.get('fullName'),
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
    };
    
    // Şifre kontrolü
    if (userData.password !== userData.confirmPassword) {
        showMessage('Şifreler eşleşmiyor', 'error');
        return;
    }
    
    if (userData.password.length < 6) {
        showMessage('Şifre en az 6 karakter olmalıdır', 'error');
        return;
    }
    
    try {
        const result = await window.electronAPI.registerUser(userData);
        
        if (result.success) {
            showMessage('Kayıt başarılı! Şimdi giriş yapabilirsiniz', 'success');
            
            // Register modalını kapat ve login modalını göster
            const registerModal = document.getElementById('register-modal');
            if (registerModal) {
                registerModal.remove();
            }
            showLoginModal();
            
        } else {
            showMessage(result.error || 'Kayıt başarısız', 'error');
        }
        
    } catch (error) {
        console.error('Register error:', error);
        showMessage('Kayıt sırasında hata oluştu', 'error');
    }
}

// Çıkış işlemi
async function handleLogout() {
    try {
        if (window.sessionToken) {
            await window.electronAPI.logoutUser(window.sessionToken);
        }
        
        // Session bilgilerini temizle
        window.currentUser = null;
        window.sessionToken = null;
        window.isLoggedIn = false;
        
        // LocalStorage'ı temizle
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('userData');
        
        // UI'yi güncelle
        updateUserInterface();
        updateUIForUserRole();
        
        // Login modalını göster
        showLoginModal();
        
        showMessage('Çıkış yapıldı', 'success');
        
    } catch (error) {
        console.error('Logout error:', error);
        showMessage('Çıkış sırasında hata oluştu', 'error');
    }
}

// Kullanıcı arayüzünü güncelle
function updateUserInterface() {
    // Kullanıcı bilgilerini header'a ekle
    const header = document.querySelector('.app-header');
    if (header && window.isLoggedIn && window.currentUser) {
        // Mevcut kullanıcı bilgisi varsa kaldır
        const existingUserInfo = header.querySelector('.user-info');
        if (existingUserInfo) {
            existingUserInfo.remove();
        }
        
        const userInfoHtml = `
            <div class="user-info" style="display: flex; align-items: center; gap: 15px; margin-left: auto;">
                <div style="text-align: right;">
                    <div style="font-weight: 600; color: #374151;">${window.currentUser.fullName}</div>
                    <div style="font-size: 12px; color: #6b7280;">@${window.currentUser.username}</div>
                </div>
                <button onclick="handleLogout()" 
                        style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                    🚪 Çıkış
                </button>
            </div>
        `;
        
        header.insertAdjacentHTML('beforeend', userInfoHtml);
    }
}

// Yeni kullanıcı ekleme modal'ını göster
function showAddUserModal() {
    // Admin kontrolü
    if (!window.currentUser || window.currentUser.role !== 'admin') {
        showMessage('Bu işlem için admin yetkisi gereklidir', 'error');
        return;
    }
    
    const modalHtml = `
        <div id="add-user-modal" class="modal active" onclick="if(event.target.id === 'add-user-modal') closeModal('add-user-modal')">
            <div class="modal-content" style="max-width: 500px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>➕ Yeni Kullanıcı Ekle</h2>
                    <button class="close-btn" onclick="closeModal('add-user-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="add-user-form" onsubmit="handleAddUser(event)">
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Ad Soyad *</label>
                            <input type="text" name="fullName" required
                                   style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                                   placeholder="Kullanıcının tam adı">
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Kullanıcı Adı *</label>
                            <input type="text" name="username" required
                                   style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                                   placeholder="Benzersiz kullanıcı adı">
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">E-posta *</label>
                            <input type="email" name="email" required
                                   style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                                   placeholder="kullanici@example.com">
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Şifre *</label>
                            <input type="password" name="password" required minlength="6"
                                   style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                                   placeholder="En az 6 karakter">
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Rol *</label>
                            <select name="role" required
                                    style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                <option value="">Rol seçin</option>
                                <option value="user">👤 Kullanıcı</option>
                                <option value="admin">👑 Yönetici</option>
                            </select>
                        </div>
                        
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="button" onclick="closeModal('add-user-modal')"
                                    style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                                İptal
                            </button>
                            <button type="submit"
                                    style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                                ➕ Kullanıcı Ekle
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Yeni kullanıcı ekleme işlemi
async function handleAddUser(event) {
    event.preventDefault();
    
    // Admin kontrolü
    if (!window.currentUser || window.currentUser.role !== 'admin') {
        showMessage('Bu işlem için admin yetkisi gereklidir', 'error');
        return;
    }
    
    const formData = new FormData(event.target);
    
    const userData = {
        fullName: formData.get('fullName'),
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role')
    };
    
    try {
        const result = await window.electronAPI.registerUser(userData);
        
        if (result.success) {
            showMessage('Kullanıcı başarıyla eklendi', 'success');
            closeModal('add-user-modal');
            await loadUsersList(); // Kullanıcı listesini yenile
        } else {
            showMessage(result.error || 'Kullanıcı eklenirken hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Add user error:', error);
        showMessage('Kullanıcı eklenirken hata oluştu', 'error');
    }
}

// Kullanıcı listesini yükle ve render et
async function loadUsersList() {
    try {
        const container = document.getElementById('users-list');
        if (!container) return;
        container.innerHTML = '<div style="color:#6b7280;">Yükleniyor...</div>';
        const res = await window.ipcRenderer.invoke('get-users');
        if (!res.success) {
            container.innerHTML = `<div style="color:#dc2626;">Hata: ${res.error || 'Kullanıcılar getirilemedi'}</div>`;
            return;
        }
        if (!res.users || res.users.length === 0) {
            container.innerHTML = '<div style="color:#6b7280;">Kayıtlı kullanıcı yok</div>';
            return;
        }
        const rows = res.users.map(u => `
            <tr>
                <td style="padding:8px; border-bottom:1px solid #e5e7eb;">${u.full_name}</td>
                <td style="padding:8px; border-bottom:1px solid #e5e7eb; color:#6b7280;">@${u.username}</td>
                <td style="padding:8px; border-bottom:1px solid #e5e7eb;">${u.email || '-'}</td>
                <td style="padding:8px; border-bottom:1px solid #e5e7eb;">${u.role}</td>
                <td style="padding:8px; border-bottom:1px solid #e5e7eb;">
                    <span style="padding:2px 8px; border-radius:12px; font-size:12px; ${u.is_active? 'background:#dcfce7; color:#166534' : 'background:#fee2e2; color:#991b1b'}">${u.is_active? 'Aktif' : 'Pasif'}</span>
                </td>
                <td style="padding:8px; border-bottom:1px solid #e5e7eb; text-align:right;">
                    ${window.currentUser && window.currentUser.role === 'admin' ? `
                        <button onclick="openEditUserModal(${u.id}, '${u.full_name?.replace(/'/g, "&#39;")}', '${u.email?.replace(/'/g, "&#39;")}', '${u.role}')" style="padding:6px 10px; border:none; border-radius:6px; background:#10b981; color:#fff; font-size:12px; cursor:pointer;">Düzenle</button>
                        <button onclick="toggleUserActive(${u.id}, ${u.is_active? 'false':'true'})" style="padding:6px 10px; border:none; border-radius:6px; background:#6b7280; color:#fff; font-size:12px; cursor:pointer;">${u.is_active? 'Pasifleştir' : 'Aktifleştir'}</button>
                        <button onclick="openResetPasswordModal(${u.id})" style="padding:6px 10px; border:none; border-radius:6px; background:#3b82f6; color:#fff; font-size:12px; cursor:pointer;">Şifre Sıfırla</button>
                        <button onclick="deleteUser(${u.id})" style="padding:6px 10px; border:none; border-radius:6px; background:#ef4444; color:#fff; font-size:12px; cursor:pointer;">Sil</button>
                    ` : `
                        <span style="color:#6b7280; font-size:12px;">Sadece görüntüleme</span>
                    `}
                </td>
            </tr>
        `).join('');
        container.innerHTML = `
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr>
                        <th style="text-align:left; padding:8px; border-bottom:2px solid #e5e7eb;">Ad Soyad</th>
                        <th style="text-align:left; padding:8px; border-bottom:2px solid #e5e7eb;">Kullanıcı</th>
                        <th style="text-align:left; padding:8px; border-bottom:2px solid #e5e7eb;">E-posta</th>
                        <th style="text-align:left; padding:8px; border-bottom:2px solid #e5e7eb;">Rol</th>
                        <th style="text-align:left; padding:8px; border-bottom:2px solid #e5e7eb;">Durum</th>
                        <th style="text-align:right; padding:8px; border-bottom:2px solid #e5e7eb;">İşlemler</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    } catch (error) {
        const container = document.getElementById('users-list');
        if (container) container.innerHTML = `<div style="color:#dc2626;">Hata: ${error.message}</div>`;
    }
}

function openEditUserModal(userId, fullName, email, role) {
    // Admin kontrolü
    if (!window.currentUser || window.currentUser.role !== 'admin') {
        showMessage('Bu işlem için admin yetkisi gereklidir', 'error');
        return;
    }
    
    const modalHtml = `
        <div id="edit-user-modal" class="modal active" onclick="if(event.target.id==='edit-user-modal') closeModal('edit-user-modal')">
            <div class="modal-content" style="max-width:480px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>👤 Kullanıcı Düzenle</h2>
                    <button class="close-btn" onclick="closeModal('edit-user-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="edit-user-form" onsubmit="submitEditUser(event)">
                        <input type="hidden" name="id" value="${userId}">
                        <div style="margin-bottom:12px;">
                            <label style="display:block; margin-bottom:6px; font-weight:600;">Ad Soyad</label>
                            <input type="text" name="fullName" value="${fullName||''}" style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:6px;">
                        </div>
                        <div style="margin-bottom:12px;">
                            <label style="display:block; margin-bottom:6px; font-weight:600;">E-posta</label>
                            <input type="email" name="email" value="${email||''}" style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:6px;">
                        </div>
                        <div style="margin-bottom:12px;">
                            <label style="display:block; margin-bottom:6px; font-weight:600;">Rol</label>
                            <select name="role" style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:6px;">
                                <option value="user" ${role==='user'?'selected':''}>Kullanıcı</option>
                                <option value="admin" ${role==='admin'?'selected':''}>Admin</option>
                            </select>
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:10px;">
                            <button type="button" onclick="closeModal('edit-user-modal')" style="padding:8px 16px; background:#6b7280; color:#fff; border:none; border-radius:6px; font-size:12px;">İptal</button>
                            <button type="submit" style="padding:8px 16px; background:#10b981; color:#fff; border:none; border-radius:6px; font-size:12px;">Kaydet</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function submitEditUser(e) {
    e.preventDefault();
    
    // Admin kontrolü
    if (!window.currentUser || window.currentUser.role !== 'admin') {
        showMessage('Bu işlem için admin yetkisi gereklidir', 'error');
        return;
    }
    
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
        const res = await window.ipcRenderer.invoke('update-user', { id: parseInt(data.id), full_name: data.fullName, email: data.email, role: data.role });
        if (!res.success) throw new Error(res.error||'Güncelleme başarısız');
        closeModal('edit-user-modal');
        loadUsersList();
        showMessage('Kullanıcı güncellendi','success');
    } catch(err){ showMessage('Hata: '+err.message,'error'); }
}
async function toggleUserActive(userId, active) {
    // Admin kontrolü
    if (!window.currentUser || window.currentUser.role !== 'admin') {
        showMessage('Bu işlem için admin yetkisi gereklidir', 'error');
        return;
    }
    
    try {
        const res = await window.ipcRenderer.invoke('set-user-active', { userId, isActive: active });
        if (!res.success) throw new Error(res.error || 'İşlem başarısız');
        loadUsersList();
        showMessage('Kullanıcı durumu güncellendi', 'success');
    } catch (e) { showMessage('Hata: ' + e.message, 'error'); }
}

async function deleteUser(userId) {
    // Admin kontrolü
    if (!window.currentUser || window.currentUser.role !== 'admin') {
        showMessage('Bu işlem için admin yetkisi gereklidir', 'error');
        return;
    }
    
    if (!confirm('Kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
        const res = await window.ipcRenderer.invoke('delete-user', userId);
        if (!res.success) throw new Error(res.error || 'Silme başarısız');
        loadUsersList();
        showMessage('Kullanıcı silindi', 'success');
    } catch (e) { showMessage('Hata: ' + e.message, 'error'); }
}

function openResetPasswordModal(userId) {
    // Admin kontrolü
    if (!window.currentUser || window.currentUser.role !== 'admin') {
        showMessage('Bu işlem için admin yetkisi gereklidir', 'error');
        return;
    }
    
    const modalHtml = `
        <div id="reset-password-modal" class="modal active" onclick="if(event.target.id==='reset-password-modal') closeModal('reset-password-modal')">
            <div class="modal-content" style="max-width:420px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>🔒 Şifre Sıfırla</h2>
                    <button class="close-btn" onclick="closeModal('reset-password-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="reset-password-form" onsubmit="submitResetPassword(event)">
                        <input type="hidden" name="id" value="${userId}">
                        <div style="margin-bottom:12px;">
                            <label style="display:block; margin-bottom:6px; font-weight:600;">Yeni Şifre</label>
                            <input type="password" name="password" style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:6px;" required>
                        </div>
                        <div style="margin-bottom:12px;">
                            <label style="display:block; margin-bottom:6px; font-weight:600;">Yeni Şifre (Tekrar)</label>
                            <input type="password" name="password2" style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:6px;" required>
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:10px;">
                            <button type="button" onclick="closeModal('reset-password-modal')" style="padding:8px 16px; background:#6b7280; color:#fff; border:none; border-radius:6px; font-size:12px;">İptal</button>
                            <button type="submit" style="padding:8px 16px; background:#3b82f6; color:#fff; border:none; border-radius:6px; font-size:12px;">Sıfırla</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function submitResetPassword(e) {
    e.preventDefault();
    
    // Admin kontrolü
    if (!window.currentUser || window.currentUser.role !== 'admin') {
        showMessage('Bu işlem için admin yetkisi gereklidir', 'error');
        return;
    }
    
    const data = Object.fromEntries(new FormData(e.target).entries());
    if (!data.password || data.password.length < 6 || data.password !== data.password2) {
        showMessage('Şifre en az 6 karakter olmalı ve eşleşmeli', 'warning');
        return;
    }
    try {
        const res = await window.ipcRenderer.invoke('reset-user-password', { userId: parseInt(data.id), newPassword: data.password });
        if (!res.success) throw new Error(res.error || 'Şifre sıfırlanamadı');
        closeModal('reset-password-modal');
        showMessage('Şifre sıfırlandı', 'success');
    } catch (e) { showMessage('Hata: ' + e.message, 'error'); }
}
// ==================== GITHUB GÜNCELLEME FONKSİYONLARI ====================

// Release notlarını göster
function showReleaseNotes(notes, version, releaseUrl) {
    const modalHtml = `
        <div id="release-notes-modal" class="modal active" onclick="if(event.target.id === 'release-notes-modal') closeModal('release-notes-modal')" style="z-index: 20000;">
            <div class="modal-content" style="max-width: 600px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>🚀 Yeni Güncelleme: v${version}</h2>
                    <button onclick="closeModal('release-notes-modal')" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
                        <h4 style="margin: 0 0 10px 0; color: #1e40af;">📋 Release Notları</h4>
                        <div style="white-space: pre-wrap; font-family: monospace; font-size: 13px; line-height: 1.5; color: #374151;">
                            ${notes || 'Release notları bulunamadı.'}
                        </div>
                    </div>
                    
                    <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
                        <h4 style="margin: 0 0 10px 0; color: #166534;">💡 Güncelleme Önerisi</h4>
                        <p style="margin: 0; font-size: 14px; color: #374151;">
                            Bu güncellemeyi indirmek için aşağıdaki butona tıklayın. İndirme sayfası tarayıcınızda açılacak.
                        </p>
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: space-between;">
                        <button onclick="closeModal('release-notes-modal')" 
                                style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                            ❌ Daha Sonra
                        </button>
                        <button onclick="window.open('${releaseUrl}', '_blank')" 
                                style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                            🔗 GitHub'da Görüntüle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Platform-specific güncelleme indirme (hem mapping hem doğrudan URL destekler)
async function downloadUpdate(downloadUrls) {
    try {
        // 1) Eğer buton attribute'unda doğrudan URL varsa onu kullan
        const btn = document.getElementById('download-btn');
        const directUrl = btn ? btn.getAttribute('data-download-url') : null;
        if (!downloadUrls && directUrl) {
            const res = await window.electronAPI.downloadUpdate(directUrl);
            if (res && res.success) showMessage('İndirme sayfası açıldı', 'success');
            else showMessage('İndirme başlatılamadı', 'error');
            return;
        }

        // 2) Eski kullanım: mapping nesnesi verildiyse platforma göre seç
        const urls = downloadUrls || {};
        const ua = navigator.userAgent || '';
        const isWin = ua.includes('Windows');
        const isMac = ua.includes('Mac');
        const isLinux = ua.includes('Linux') && !isMac && !isWin;
        let chosen = null;
        if (isWin && urls.windows) chosen = urls.windows;
        if (isMac && urls.macos) chosen = urls.macos;
        if (isLinux && urls.linux) chosen = urls.linux;
        if (!chosen && urls.fallback) chosen = urls.fallback;
        if (!chosen) {
            showMessage('Bu sürüm için indirme dosyası bulunamadı', 'error');
            return;
        }
        const result = await window.electronAPI.downloadUpdate(chosen);
        if (result && result.success) showMessage('İndirme sayfası açıldı', 'success');
        else showMessage('İndirme başlatılamadı', 'error');
    } catch (error) {
        console.error('Download update error:', error);
        showMessage('İndirme sırasında hata oluştu', 'error');
    }
}

// 🚀 MODERN ÜRÜN MODÜLÜ ENTEGRASYONU
// Bu fonksiyonlar yeni product-module.js ile entegre edilmiştir

// Ürün ekleme modalını göster
function showAddProductModal() {
    if (typeof window.showAddProductModalFromRenderer === 'function') {
        window.showAddProductModalFromRenderer();
    } else {
        // Fallback: Eski modal göster
        showAddProductModalLegacy();
    }
}

// Eski ürün ekleme modalı (fallback)
function showAddProductModalLegacy() {
    const modalHtml = `
        <div id="add-product-modal" class="modal active" style="z-index: 9999;">
            <div class="modal-content" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px 12px 0 0; color: white;">
                    <h3 style="margin: 0; font-size: 20px; font-weight: 600;">Yeni Ürün Ekle</h3>
                </div>
                
                <form id="new-add-product-form" onsubmit="handleAddProductLegacy(event)" style="padding: 24px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Ürün Adı *</label>
                            <input type="text" id="product-name" name="name" required 
                                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                                   onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Ürün Kodu</label>
                            <input type="text" id="product-code" name="code" 
                                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                                   onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Barkod</label>
                            <input type="text" id="product-barcode" name="barcode" 
                                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                                   onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Birim</label>
                            <select id="product-unit" name="unit" 
                                    style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; background: white;">
                                <option value="adet">Adet</option>
                                <option value="kg">Kilogram</option>
                                <option value="lt">Litre</option>
                                <option value="m">Metre</option>
                                <option value="m2">Metrekare</option>
                                <option value="m3">Metreküp</option>
                                <option value="paket">Paket</option>
                                <option value="kutu">Kutu</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Kategori</label>
                            <div style="display: flex; gap: 8px;">
                                <select id="product-category" name="category_id" 
                                        style="flex: 1; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; background: white;">
                                    <option value="">Kategori Seçin</option>
                                    ${window.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
                                </select>
                                <button type="button" onclick="showAddCategoryModal()" 
                                        style="background: #667eea; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.2s;"
                                        onmouseover="this.style.background='#5a67d8'" onmouseout="this.style.background='#667eea'"
                                        title="Hızlı Kategori Ekle">
                                    ➕
                                </button>
                            </div>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Marka</label>
                            <div style="display: flex; gap: 8px;">
                                <select id="product-brand" name="brand_id" 
                                        style="flex: 1; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; background: white;">
                                    <option value="">Marka Seçin</option>
                                    ${window.brands.map(brand => `<option value="${brand.id}">${brand.name}</option>`).join('')}
                                </select>
                                <button type="button" onclick="showAddBrandModal()" 
                                        style="background: #667eea; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.2s;"
                                        onmouseover="this.style.background='#5a67d8'" onmouseout="this.style.background='#667eea'"
                                        title="Hızlı Marka Ekle">
                                    ➕
                                </button>
                            </div>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Stok</label>
                            <input type="number" id="product-stock" name="stock" value="0" min="0" step="0.01" 
                                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                                   onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Alış Fiyatı (₺)</label>
                            <input type="number" id="product-purchase-price" name="purchase_price" value="0" min="0" step="0.01" 
                                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                                   onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Satış Fiyatı (₺) *</label>
                            <input type="number" id="product-sale-price" name="sale_price" value="0" min="0.01" step="0.01" required 
                                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                                   onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">KDV Oranı (%)</label>
                            <select id="product-vat-rate" name="vat_rate" 
                                    style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; background: white;"
                                    onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                                <option value="0">%0</option>
                                <option value="1">%1</option>
                                <option value="8">%8</option>
                                <option value="18">%18</option>
                                <option value="20" selected>%20 (Standart)</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Minimum Stok</label>
                            <input type="number" id="product-min-stock" name="min_stock" value="0" min="0" step="0.01" 
                                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                                   onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Açıklama</label>
                        <textarea id="product-description" name="description" rows="3" 
                                  style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; resize: vertical;"
                                  onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button type="button" onclick="event.stopPropagation(); closeProductModal('add-product-modal')" 
                                style="padding: 12px 24px; background: #f3f4f6; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            İptal
                        </button>
                        <button type="submit" 
                                style="padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Ürün Ekle
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('product-name').focus();
}

// Eski ürün ekleme handler (fallback)
async function handleAddProductLegacy(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const productData = {
        name: formData.get('name').trim(),
        code: formData.get('code') || null,
        barcode: formData.get('barcode') || null,
        unit: formData.get('unit') || 'adet',
        category_id: formData.get('category_id') || null,
        brand_id: formData.get('brand_id') || null,
        stock: parseFloat(formData.get('stock')) || 0,
        purchase_price: parseFloat(formData.get('purchase_price')) || 0,
        sale_price: parseFloat(formData.get('sale_price')) || 0,
        description: formData.get('description') || null
    };
    
    // Validasyon
    if (!productData.name) {
        showMessage('Ürün adı zorunludur', 'error');
        return;
    }
    
    if (productData.sale_price <= 0) {
        showMessage('Satış fiyatı 0\'dan büyük olmalıdır', 'error');
        return;
    }
    
    try {
        const newProduct = await ipcRenderer.invoke('add-product', productData);
        window.products.push(newProduct); // Global referansı güncelle
        
        // Form'u reset et
        event.target.reset();
        
        showMessage('Ürün başarıyla eklendi', 'success');
        
        // Modal'ı kapat
        setTimeout(() => {
            closeProductModal('add-product-modal');
        }, 100);
        
        // Satış ekranındaki ürün seçimini güncelle
        if (typeof updateSaleProductSelect === 'function') {
            updateSaleProductSelect(newProduct);
        }
        
    } catch (error) {
        console.error('Ürün eklenirken hata:', error);
        showMessage('Ürün eklenirken hata oluştu', 'error');
    }
}

// Kategori modülü
function showCategoriesModule() {
    if (typeof window.showCategoriesModalFromRenderer === 'function') {
        window.showCategoriesModalFromRenderer();
    } else {
        showMessage('Kategori modülü henüz aktif değil', 'warning');
    }
}

// Marka modülü
function showBrandsModule() {
    if (typeof window.showBrandsModalFromRenderer === 'function') {
        window.showBrandsModalFromRenderer();
    } else {
        showMessage('Marka modülü henüz aktif değil', 'warning');
    }
}

// Hızlı ürün ekleme
function showQuickAddProduct() {
    showAddProductModal();
}

// Ürün düzenleme
function editProduct(id) {
    if (typeof window.editProductFromRenderer === 'function') {
        window.editProductFromRenderer(id);
    } else {
        showMessage('Ürün düzenleme modülü henüz aktif değil', 'warning');
    }
}

// Ürün silme
function deleteProduct(id) {
    if (typeof window.deleteProductFromRenderer === 'function') {
        window.deleteProductFromRenderer(id);
    } else {
        // Fallback: Basit silme
        if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
            deleteProductLegacy(id);
        }
    }
}

// Eski ürün silme (fallback)
async function deleteProductLegacy(id) {
    try {
        await ipcRenderer.invoke('delete-product', id);
        
        // Ürünü listeden kaldır
        const index = products.findIndex(p => p.id === id);
        if (index > -1) {
            products.splice(index, 1);
        }
        
        showMessage('Ürün başarıyla silindi', 'success');
        
        // Satış ekranını güncelle
        if (typeof updateSaleProductSelectAfterDelete === 'function') {
            updateSaleProductSelectAfterDelete(id);
        }
        
        // Ürün yönetim modülünde liste görünümü açıksa yenile
        if (typeof window.refreshProductList === 'function') {
            console.log('🔄 Ürün silindi, liste yenileniyor...');
            await window.refreshProductList();
        }
        
    } catch (error) {
        console.error('Ürün silinemedi:', error);
        showMessage('Ürün silinemedi', 'error');
    }
}

// Excel aktarma
function exportProductsToExcel() {
    if (typeof window.exportProductsToExcel === 'function') {
        window.exportProductsToExcel();
    } else {
        showMessage('Excel aktarma modülü henüz aktif değil', 'warning');
    }
}

// Yazdırma
function printProducts() {
    showMessage('Yazdırma modülü henüz aktif değil', 'warning');
}

// 🎯 YENİ MODÜL ENTEGRASYON FONKSİYONLARI
// Bu fonksiyonlar product-module.js tarafından çağrılır

// Ürün ekleme modalını renderer'dan çağır
window.showAddProductModalFromRenderer = showAddProductModalLegacy;

// Hızlı kategori ekleme fonksiyonu
window.showAddCategoryModal = function() {
    if (typeof window.showAddCategoryModalFromProductModule === 'function') {
        window.showAddCategoryModalFromProductModule();
    } else {
        showMessage('Kategori ekleme modülü henüz aktif değil', 'warning');
    }
};

// Hızlı marka ekleme fonksiyonu
window.showAddBrandModal = function() {
    if (typeof window.showAddBrandModalFromProductModule === 'function') {
        window.showAddBrandModalFromProductModule();
    } else {
        showMessage('Marka ekleme modülü henüz aktif değil', 'warning');
    }
};

// Ürün düzenleme modalını renderer'dan çağır
window.editProductFromRenderer = function(id) {
    const product = window.products.find(p => p.id === id);
    if (!product) {
        showMessage('Ürün bulunamadı', 'error');
        return;
    }
    
    const modalHtml = `
        <div id="edit-product-modal" class="modal active" style="z-index: 9999;">
            <div class="modal-content" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px 12px 0 0; color: white;">
                    <h3 style="margin: 0; font-size: 20px; font-weight: 600;">Ürün Düzenle</h3>
                </div>
                
                <form id="edit-product-form" onsubmit="handleEditProductLegacy(event, ${id})" style="padding: 24px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Ürün Adı *</label>
                            <input type="text" id="edit-product-name" name="name" value="${product.name}" required 
                                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                                   onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Ürün Kodu</label>
                            <input type="text" id="edit-product-code" name="code" value="${product.code || ''}" 
                                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                                   onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Barkod</label>
                            <input type="text" id="edit-product-barcode" name="barcode" value="${product.barcode || ''}" 
                                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                                   onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Birim</label>
                            <select id="edit-product-unit" name="unit" 
                                    style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; background: white;">
                                <option value="adet" ${product.unit === 'adet' ? 'selected' : ''}>Adet</option>
                                <option value="kg" ${product.unit === 'kg' ? 'selected' : ''}>Kilogram</option>
                                <option value="lt" ${product.unit === 'lt' ? 'selected' : ''}>Litre</option>
                                <option value="m" ${product.unit === 'm' ? 'selected' : ''}>Metre</option>
                                <option value="m2" ${product.unit === 'm2' ? 'selected' : ''}>Metrekare</option>
                                <option value="m3" ${product.unit === 'm3' ? 'selected' : ''}>Metreküp</option>
                                <option value="paket" ${product.unit === 'paket' ? 'selected' : ''}>Paket</option>
                                <option value="kutu" ${product.unit === 'kutu' ? 'selected' : ''}>Kutu</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Kategori</label>
                            <div style="display: flex; gap: 8px;">
                                <select id="edit-product-category" name="category_id" 
                                        style="flex: 1; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; background: white;">
                                    <option value="">Kategori Seçin</option>
                                    ${window.categories.map(cat => `<option value="${cat.id}" ${product.category_id === cat.id ? 'selected' : ''}>${cat.name}</option>`).join('')}
                                </select>
                                <button type="button" onclick="showAddCategoryModal()" 
                                        style="background: #667eea; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.2s;"
                                        onmouseover="this.style.background='#5a67d8'" onmouseout="this.style.background='#667eea'"
                                        title="Hızlı Kategori Ekle">
                                    ➕
                                </button>
                            </div>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Marka</label>
                            <div style="display: flex; gap: 8px;">
                                <select id="edit-product-brand" name="brand_id" 
                                        style="flex: 1; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; background: white;">
                                    <option value="">Marka Seçin</option>
                                    ${window.brands.map(brand => `<option value="${brand.id}" ${product.brand_id === brand.id ? 'selected' : ''}>${brand.name}</option>`).join('')}
                                </select>
                                <button type="button" onclick="showAddBrandModal()" 
                                        style="background: #667eea; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.2s;"
                                        onmouseover="this.style.background='#5a67d8'" onmouseout="this.style.background='#667eea'"
                                        title="Hızlı Marka Ekle">
                                    ➕
                                </button>
                            </div>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Stok</label>
                            <input type="number" id="edit-product-stock" name="stock" value="${product.stock || 0}" min="0" step="0.01" 
                                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                                   onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Alış Fiyatı (₺)</label>
                            <input type="number" id="edit-product-purchase-price" name="purchase_price" value="${product.purchase_price || 0}" min="0" step="0.01" 
                                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                                   onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Satış Fiyatı (₺) *</label>
                            <input type="number" id="edit-product-sale-price" name="sale_price" value="${product.sale_price || 0}" min="0.01" step="0.01" required 
                                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                                   onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">KDV Oranı (%)</label>
                            <select id="edit-product-vat-rate" name="vat_rate" 
                                    style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; background: white;"
                                    onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                                <option value="0" ${product.vat_rate === 0 ? 'selected' : ''}>%0</option>
                                <option value="1" ${product.vat_rate === 1 ? 'selected' : ''}>%1</option>
                                <option value="8" ${product.vat_rate === 8 ? 'selected' : ''}>%8</option>
                                <option value="18" ${product.vat_rate === 18 ? 'selected' : ''}>%18</option>
                                <option value="20" ${product.vat_rate === 20 ? 'selected' : ''}>%20 (Standart)</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Minimum Stok</label>
                            <input type="number" id="edit-product-min-stock" name="min_stock" value="${product.min_stock || 0}" min="0" step="0.01" 
                                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                                   onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Açıklama</label>
                        <textarea id="edit-product-description" name="description" rows="3" 
                                  style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; resize: vertical;"
                                  onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">${product.description || ''}</textarea>
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button type="button" onclick="closeProductModal('edit-product-modal')" 
                                style="padding: 12px 24px; background: #f3f4f6; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            İptal
                        </button>
                        <button type="submit" 
                                style="padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Güncelle
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('edit-product-name').focus();
}

// Eski ürün düzenleme handler (fallback)
async function handleEditProductLegacy(event, id) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const productData = {
        name: formData.get('name').trim(),
        code: formData.get('code') || null,
        barcode: formData.get('barcode') || null,
        unit: formData.get('unit') || 'adet',
        category_id: formData.get('category_id') || null,
        brand_id: formData.get('brand_id') || null,
        stock: parseFloat(formData.get('stock')) || 0,
        purchase_price: parseFloat(formData.get('purchase_price')) || 0,
        sale_price: parseFloat(formData.get('sale_price')) || 0,
        description: formData.get('description') || null
    };
    
    // Validasyon
    if (!productData.name) {
        showMessage('Ürün adı zorunludur', 'error');
        return;
    }
    
    if (productData.sale_price <= 0) {
        showMessage('Satış fiyatı 0\'dan büyük olmalıdır', 'error');
        return;
    }
    
    try {
        await ipcRenderer.invoke('update-product', { id, ...productData });
        
        // Veritabanından taze veri çek
        window.products = await ipcRenderer.invoke('get-products');
        
        showMessage('Ürün başarıyla güncellendi', 'success');
        
        // Modal'ı kapat
        setTimeout(() => {
            closeProductModal('edit-product-modal');
        }, 100);
        
        // Satış ekranını güncelle
        if (typeof updateSaleProductSelect === 'function') {
            updateSaleProductSelect();
        }
        
    } catch (error) {
        console.error('Ürün güncellenirken hata:', error);
        showMessage('Ürün güncellenirken hata oluştu', 'error');
    }
}

// Ürün silme modalını renderer'dan çağır
window.deleteProductFromRenderer = function(id) {
    const product = window.products.find(p => p.id === id);
    if (!product) {
        showMessage('Ürün bulunamadı', 'error');
        return;
    }
    
    if (confirm(`"${product.name}" ürününü silmek istediğinizden emin misiniz?`)) {
        deleteProductLegacy(id);
    }
};

// Kategori modülü modalını renderer'dan çağır
window.showCategoriesModalFromRenderer = function() {
    const modalHtml = `
        <div id="categories-modal" class="modal active" style="z-index: 9998;">
            <div class="modal-content" style="max-width: 600px; border-radius: 12px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px 12px 0 0; color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; font-size: 20px; font-weight: 600;">Kategori Yönetimi</h3>
                        <button onclick="event.stopPropagation(); closeProductModal('categories-modal')" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 18px; z-index: 9999; position: relative;" title="Kapat">×</button>
                    </div>
                </div>
                
                <div style="padding: 20px;">
                    <button onclick="showAddCategoryModal()" class="btn btn-primary" style="margin-bottom: 20px;">+ Yeni Kategori Ekle</button>
                    
                    <div style="background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f9fafb;">
                                <tr>
                                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Kategori Adı</th>
                                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${window.categories.map(cat => `
                                    <tr style="border-bottom: 1px solid #f3f4f6;">
                                        <td style="padding: 12px; font-weight: 500;">${cat.name}</td>
                                        <td style="padding: 12px; text-align: center;">
                                            <button onclick="editCategory(${cat.id})" style="background: #f3f4f6; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 8px;">Düzenle</button>
                                            ${window.currentUser && window.currentUser.role === 'admin' ? 
                                                '<button onclick="deleteCategory(' + cat.id + ')" style="background: #fef2f2; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; color: #dc2626;">Sil</button>' : 
                                                ''
                                            }
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        ${window.categories.length === 0 ? '<div style="text-align: center; padding: 40px; color: #9ca3af;">Henüz kategori eklenmemiş</div>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

// Marka modülü modalını renderer'dan çağır
window.showBrandsModalFromRenderer = function() {
    const modalHtml = `
        <div id="brands-modal" class="modal active" style="z-index: 9998;">
            <div class="modal-content" style="max-width: 600px; border-radius: 12px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px 12px 0 0; color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; font-size: 20px; font-weight: 600;">Marka Yönetimi</h3>
                        <button onclick="event.stopPropagation(); closeProductModal('brands-modal')" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 18px; z-index: 9999; position: relative;" title="Kapat">×</button>
                    </div>
                </div>
                
                <div style="padding: 20px;">
                    <button onclick="showAddBrandModal()" class="btn btn-primary" style="margin-bottom: 20px;">+ Yeni Marka Ekle</button>
                    
                    <div style="background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f9fafb;">
                                <tr>
                                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Marka Adı</th>
                                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${brands.map(brand => `
                                    <tr style="border-bottom: 1px solid #f3f4f6;">
                                        <td style="padding: 12px; font-weight: 500;">${brand.name}</td>
                                        <td style="padding: 12px; text-align: center;">
                                            <button onclick="editBrand(${brand.id})" style="background: #f3f4f6; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 8px;">Düzenle</button>
                                            ${window.currentUser && window.currentUser.role === 'admin' ? 
                                                '<button onclick="deleteBrand(' + brand.id + ')" style="background: #fef2f2; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; color: #dc2626;">Sil</button>' : 
                                                ''
                                            }
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        ${window.brands.length === 0 ? '<div style="text-align: center; padding: 40px; color: #9ca3af;">Henüz marka eklenmemiş</div>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

// Toplu işlemler modalını renderer'dan çağır
window.showBulkOperationsModalFromRenderer = function() {
    showMessage('Toplu işlemler modülü henüz aktif değil', 'warning');
};

// Modal kapatma fonksiyonu
function closeProductModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
            console.log(`Modal ${modalId} closed and removed from DOM`);
        } else {
            console.warn(`Modal ${modalId} not found`);
        }
    } catch (error) {
        console.error(`Error closing modal ${modalId}:`, error);
    }
}

// Global fonksiyonları tanımla
window.closeProductModal = closeProductModal;
window.handleAddProductLegacy = handleAddProductLegacy;
window.handleEditProductLegacy = handleEditProductLegacy;
window.deleteProductLegacy = deleteProductLegacy;

// Mesaj gösterme fonksiyonu
function showMessage(message, type = 'info') {
    // Mevcut mesajları temizle
    const existingMessages = document.querySelectorAll('.message-toast');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-toast ${type}`;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        font-size: 14px;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    // Tip'e göre stil
    switch (type) {
        case 'success':
            messageDiv.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            messageDiv.innerHTML = `<span style="font-size: 18px;">✅</span> ${message}`;
            break;
        case 'error':
            messageDiv.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            messageDiv.innerHTML = `<span style="font-size: 18px;">❌</span> ${message}`;
            break;
        case 'warning':
            messageDiv.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            messageDiv.innerHTML = `<span style="font-size: 18px;">⚠️</span> ${message}`;
            break;
        default:
            messageDiv.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
            messageDiv.innerHTML = `<span style="font-size: 18px;">ℹ️</span> ${message}`;
    }
    
    document.body.appendChild(messageDiv);
    
    // 5 saniye sonra otomatik kapat
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 300);
        }
    }, 5000);
    
    // CSS animasyonları ekle
    if (!document.getElementById('message-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'message-toast-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Global fonksiyon olarak tanımla
window.showMessage = showMessage;
window.initializeUserSession = initializeUserSession;
