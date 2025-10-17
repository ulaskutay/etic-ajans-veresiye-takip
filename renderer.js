const { ipcRenderer } = require('electron');

// Global değişkenler
let customers = [];
let currentCustomer = null;
let sales = [];
let purchases = [];
let products = []; // Ürünler listesi
let selectedCustomerId = null; // Seçili müşteri ID'si

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    loadCustomers();
    setupEventListeners();
    setDefaultDates();
    
    // IPC listener for global shortcuts
    const { ipcRenderer } = require('electron');
    
    ipcRenderer.on('shortcut-pressed', (event, shortcut) => {
        switch (shortcut) {
        case 'new-customer':
                focusCustomerSearch();
            break;
            case 'add-sale':
                if (currentCustomer) {
                    addSale();
                } else {
                    showNotification('Önce müşteri seçin (F1)', 'warning');
                }
                break;
            case 'add-payment':
                if (currentCustomer) {
                    addPurchase();
                } else {
                    showNotification('Önce müşteri seçin (F1)', 'warning');
                }
            break;
        case 'quick-debt':
                if (currentCustomer) {
                    quickSale();
                } else {
                    showNotification('Önce müşteri seçin (F1)', 'warning');
                }
            break;
            case 'quick-payment':
                if (currentCustomer) {
                    quickPurchase();
                } else {
                    showNotification('Önce müşteri seçin (F1)', 'warning');
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

// Event listeners
function setupEventListeners() {
    // Customer search setup
    setupCustomerSearch('sale-customer', 'sale-customer-dropdown');
    setupCustomerSearch('purchase-customer', 'purchase-customer-dropdown');

    // Form event listeners
    document.getElementById('add-customer-form').addEventListener('submit', handleAddCustomer);
    document.getElementById('edit-customer-form').addEventListener('submit', handleEditCustomer);
    document.getElementById('add-sale-form').addEventListener('submit', handleAddSale);
    document.getElementById('add-purchase-form').addEventListener('submit', handleAddPurchase);
    document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
    document.getElementById('quick-add-product-form').addEventListener('submit', handleQuickAddProduct);
    document.getElementById('edit-sale-form').addEventListener('submit', handleEditSale);
    document.getElementById('edit-purchase-form').addEventListener('submit', handleEditPurchase);
    
    // Date change listeners
    document.getElementById('start-date').addEventListener('change', filterTransactions);
    document.getElementById('end-date').addEventListener('change', filterTransactions);
    
    // Product selection change - auto-fill price
    document.getElementById('sale-product').addEventListener('change', handleProductSelection);
    document.getElementById('edit-sale-product').addEventListener('change', handleEditProductSelection);
    
    // Keyboard shortcuts - MUST BE FIRST
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Keyboard shortcuts initialized
    console.log('✅ Keyboard shortcuts ready');
}

// Set default dates
function setDefaultDates() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('start-date').value = formatDateForInput(thirtyDaysAgo);
    document.getElementById('end-date').value = formatDateForInput(today);
    
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
        customers = await ipcRenderer.invoke('get-customers');
        displayCustomers();
        updateAccountSummary();
        
        // Only clear selection if explicitly requested
        if (clearSelection) {
            currentCustomer = null;
            clearCustomerDetails();
        }
    } catch (error) {
        console.error('Müşteriler yüklenirken hata:', error);
        showNotification('Müşteriler yüklenirken hata oluştu', 'error');
    }
}

// Display customers in table
function displayCustomers() {
    const tbody = document.getElementById('customer-table-body');
    
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
        currentCustomer = await ipcRenderer.invoke('get-customer', customerId);
        displayCustomerDetails();
        
        // Load transactions
        await loadTransactions(customerId);
        
    } catch (error) {
        console.error('Müşteri seçilirken hata:', error);
        showNotification('Müşteri seçilirken hata oluştu', 'error');
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
async function loadTransactions(customerId) {
    try {
        const transactions = await ipcRenderer.invoke('get-transactions', customerId);
        
        // Separate sales and purchases
        sales = transactions.filter(t => t.type === 'debt');
        purchases = transactions.filter(t => t.type === 'payment');
        
        // Tek tabloda birleştirilmiş işlemleri göster
        displayAllTransactions();
        
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
        
    } catch (error) {
        console.error('İşlemler yüklenirken hata:', error);
        showNotification('İşlemler yüklenirken hata oluştu', 'error');
    }
}

// Display all transactions in a single table
function displayAllTransactions() {
    const salesTbody = document.getElementById('sales-table-body');
    
    // Hide filter totals when showing all transactions
    hideFilterTotals();
    
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
            ...purchases.map(p => ({ ...p, transactionType: 'purchase' }))
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
            
            // Bu işlemden önceki tüm işlemleri dahil et (aynı tarih dahil değil)
            if (prevDate < transactionDate) {
                const prevAmount = prevTransaction.total_amount || prevTransaction.amount || 0;
                
                if (prevTransaction.transactionType === 'sale') {
                    cumulativeBalance += prevAmount; // Satış = pozitif ekle
                } else {
                    cumulativeBalance -= prevAmount; // Tahsilat = negatif çıkar
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
            </tr>
        `;
    }).join('');
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
                    cumulativeBalance += prevAmount; // Satış = pozitif ekle
                } else {
                    cumulativeBalance -= prevAmount; // Tahsilat = negatif çıkar
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
        // Tüm transaction'ları al
        const allTransactions = await ipcRenderer.invoke('get-all-transactions');
        
        let totalSales = 0;
        let totalPayments = 0;
        let totalDebt = 0;
        
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
        });
        
        const netBalance = totalSales - totalPayments;
        const paymentRate = totalSales > 0 ? ((totalPayments / totalSales) * 100).toFixed(1) : 0;
        
        // Güncellenmiş değerleri göster
        document.getElementById('total-sales').textContent = formatMoney(totalSales);
        document.getElementById('total-payments').textContent = formatMoney(totalPayments);
        document.getElementById('total-debt').textContent = formatMoney(totalDebt);
        document.getElementById('net-balance').textContent = formatMoney(netBalance);
        document.getElementById('payment-rate').textContent = paymentRate + '%';
        
    } catch (error) {
        console.error('Hesap özeti güncellenirken hata:', error);
        // Hata durumunda eski değerleri göster
        document.getElementById('total-sales').textContent = '0,00';
        document.getElementById('total-payments').textContent = '0,00';
        document.getElementById('total-debt').textContent = '0,00';
        document.getElementById('net-balance').textContent = '0,00';
        document.getElementById('payment-rate').textContent = '0%';
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
        showNotification('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    
    console.log('Getting selected transaction...');
    const selectedSale = getSelectedTransaction(); // Parametre kaldırıldı
    console.log('selectedSale result:', selectedSale);
    
    if (!selectedSale) {
        console.log('No selected sale found, showing warning');
        showNotification('Lütfen düzenlemek istediğiniz satış işlemini seçin', 'warning');
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
        
        console.log('Setting date to:', selectedSale.date);
        const dateValue = selectedSale.date ? selectedSale.date.split('T')[0] : new Date().toISOString().split('T')[0];
        document.getElementById('edit-sale-date').value = dateValue;
        
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
            handleEditProductSelection();
        }
        
        console.log('Showing modal...');
        showModal('edit-sale-modal');
        console.log('Modal should be visible now');
        
    } catch (error) {
        console.error('Error populating modal:', error);
        showNotification('Modal açılırken hata oluştu: ' + error.message, 'error');
    }
}

// Delete Sale Transaction
function deleteSale() {
    console.log('=== DELETE SALE FUNCTION CALLED ===');
    
    if (!currentCustomer) {
        showNotification('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    
    const selectedSale = getSelectedTransaction(); // Parametre kaldırıldı
    if (!selectedSale) {
        showNotification('Lütfen silmek istediğiniz satış işlemini seçin', 'warning');
        return;
    }
    
    if (confirm(`"${selectedSale.description || 'Satış'}" işlemini silmek istediğinizden emin misiniz?`)) {
        deleteTransaction(selectedSale.id);
    }
}

// Edit Purchase Transaction
async function editPurchase() {
    console.log('=== EDIT PURCHASE FUNCTION CALLED ===');
    console.log('editPurchase function called');
    console.log('currentCustomer:', currentCustomer);
    console.log('purchases array:', purchases);
    
    if (!currentCustomer) {
        showNotification('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    
    console.log('Getting selected purchase transaction...');
    const selectedPurchase = getSelectedTransaction(); // Parametre kaldırıldı
    console.log('selectedPurchase result:', selectedPurchase);
    
    if (!selectedPurchase) {
        console.log('No selected purchase found, showing warning');
        showNotification('Lütfen düzenlemek istediğiniz tahsilat işlemini seçin', 'warning');
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
        showNotification('Modal açılırken hata oluştu: ' + error.message, 'error');
    }
}

// Delete Purchase Transaction
function deletePurchase() {
    console.log('=== DELETE PURCHASE FUNCTION CALLED ===');
    
    if (!currentCustomer) {
        showNotification('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    
    const selectedPurchase = getSelectedTransaction(); // Parametre kaldırıldı
    if (!selectedPurchase) {
        showNotification('Lütfen silmek istediğiniz tahsilat işlemini seçin', 'warning');
        return;
    }
    
    if (confirm(`"${selectedPurchase.description || 'Tahsilat'}" işlemini silmek istediğinizden emin misiniz?`)) {
        deleteTransaction(selectedPurchase.id);
    }
}

// Get selected transaction from table
function getSelectedTransaction() {
    console.log('getSelectedTransaction called');
    
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
    const transactionType = selectedRow.getAttribute('data-transaction-type');
    console.log('transactionType:', transactionType);
    
    // Find transaction in the appropriate array based on transaction type
    const transactions = transactionType === 'sale' ? sales : purchases;
    console.log('transactions array:', transactions);
    
    const foundTransaction = transactions.find(t => t.id == transactionId);
    console.log('foundTransaction:', foundTransaction);
    
    return foundTransaction;
}

// Delete transaction (generic function)
async function deleteTransaction(transactionId) {
    try {
        const result = await ipcRenderer.invoke('delete-transaction', transactionId);
        
        if (result.success) {
            showNotification('İşlem başarıyla silindi', 'success');
            
            // Store current customer ID before reloading
            const storedCustomerId = currentCustomer ? currentCustomer.id : null;
            
            // Reload customers to update balances (don't clear selection)
            await loadCustomers(false);
            
            // Re-select the customer to keep it active
            if (storedCustomerId) {
                await selectCustomer(storedCustomerId);
            }
        } else {
            showNotification('İşlem silinirken hata oluştu', 'error');
        }
    } catch (error) {
        console.error('İşlem silinirken hata:', error);
        showNotification('İşlem silinirken hata oluştu', 'error');
    }
}

// Handle edit sale form submission
async function handleEditSale(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const transactionData = {
        id: formData.get('id'),
        customer_id: currentCustomer.id,
        type: 'sale',
        created_at: formData.get('date'),
        description: formData.get('description') || 'Satış',
        product_id: formData.get('product_id') || null,
        quantity: 1,
        unit_price: parseFloat(formData.get('amount')),
        total_amount: parseFloat(formData.get('amount'))
    };
    
    try {
        const result = await ipcRenderer.invoke('update-transaction', transactionData);
        
        if (result.success) {
            showNotification('Satış başarıyla güncellendi', 'success');
            closeModal('edit-sale-modal');
            
            // Store current customer ID before reloading
            const storedCustomerId = currentCustomer ? currentCustomer.id : null;
            
            // Reload customers to update balances (don't clear selection)
            await loadCustomers(false);
            
            // Re-select the customer to keep it active
            if (storedCustomerId) {
                await selectCustomer(storedCustomerId);
            }
        } else {
            showNotification('Satış güncellenirken hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Satış güncellenirken hata:', error);
        showNotification('Satış güncellenirken hata oluştu', 'error');
    }
}

// Handle edit purchase form submission
async function handleEditPurchase(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const transactionData = {
        id: formData.get('id'),
        customer_id: currentCustomer.id,
        type: 'purchase',
        created_at: formData.get('date'),
        description: formData.get('description') || 'Tahsilat',
        quantity: 1,
        unit_price: parseFloat(formData.get('amount')),
        total_amount: parseFloat(formData.get('amount'))
    };
    
    try {
        const result = await ipcRenderer.invoke('update-transaction', transactionData);
        
        if (result.success) {
            showNotification('Tahsilat başarıyla güncellendi', 'success');
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
            showNotification('Tahsilat güncellenirken hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Tahsilat güncellenirken hata:', error);
        showNotification('Tahsilat güncellenirken hata oluştu', 'error');
    }
}

// Load products for select dropdown
async function loadProductsForSelect(selectId) {
    try {
        const products = await ipcRenderer.invoke('get-products');
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
function handleEditProductSelection() {
    const productId = document.getElementById('edit-sale-product').value;
    const product = products.find(p => p.id == productId);
    
    if (product) {
        document.getElementById('edit-sale-amount').value = product.sale_price;
        document.getElementById('edit-sale-description').value = product.name;
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
            showNotification('Arama terimi girin', 'warning');
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
            showNotification(`${exactMatch.name} seçildi`, 'success');
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
            showNotification(`${partialMatch.name} seçildi`, 'success');
        } else {
            showNotification('Müşteri bulunamadı', 'warning');
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
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        // Modal'ı DOM'dan kaldır
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300); // CSS transition süresi kadar bekle
    }
}

// ESC tuşu ile modal kapatma
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Aktif modal'ları bul ve kapat
        const activeModals = document.querySelectorAll('.modal.active');
        activeModals.forEach(modal => {
            const modalId = modal.id;
            if (modalId) {
                closeModal(modalId);
            }
        });
    }
});

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
        showNotification('Müşteri adı gereklidir', 'error');
        return;
    }
    
    try {
        const newCustomer = await ipcRenderer.invoke('add-customer', {
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
        
        showNotification('Müşteri başarıyla eklendi', 'success');
        closeModal('add-customer-modal');
        document.getElementById('add-customer-form').reset();
        
        // Reload customers
        await loadCustomers();
        
    } catch (error) {
        console.error('Müşteri eklenirken hata:', error);
        showNotification('Müşteri eklenirken hata oluştu', 'error');
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
        const products = await ipcRenderer.invoke('get-products');
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
        showNotification('Müşteri seçimi bulunamadı', 'error');
        return;
    }
    
    const date = document.getElementById('sale-date').value;
    const description = document.getElementById('sale-description').value.trim() || 'Satış';
    const amount = parseFloat(document.getElementById('sale-amount').value);
    const productId = document.getElementById('sale-product').value || null;
    
    if (!date || !amount || amount <= 0) {
        showNotification('Tarih ve tutar alanları zorunludur', 'error');
        return;
    }
    
    const storedCustomerId = selectedCustomerId; // Store before reset
    
    try {
        await ipcRenderer.invoke('add-transaction', {
            customer_id: storedCustomerId,
            product_id: productId,
            type: 'debt',
            quantity: 1,
            unit_price: amount,
            total_amount: amount,
            description,
            date: new Date(date).toISOString()
        });
        
        showNotification('Satış başarıyla eklendi', 'success');
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
        showNotification('Satış eklenirken hata oluştu', 'error');
    }
}

// Add purchase
async function handleAddPurchase(e) {
    e.preventDefault();
    
    console.log('💵 handleAddPurchase BAŞLADI');
    
    if (!selectedCustomerId) {
        showNotification('Müşteri seçimi bulunamadı', 'error');
        return;
    }
    
    const date = document.getElementById('purchase-date').value;
    const description = document.getElementById('purchase-description').value.trim() || 'Tahsilat';
    const amount = parseFloat(document.getElementById('purchase-amount').value);
    
    console.log('Tahsilat verileri:', { date, description, amount, selectedCustomerId });
    
    if (!date || !amount || amount <= 0) {
        showNotification('Tarih ve tutar alanları zorunludur', 'error');
        return;
    }
    
    const storedCustomerId = selectedCustomerId; // Store before reset
    
    try {
        console.log('📤 Tahsilat kaydediliyor...');
        
        await ipcRenderer.invoke('add-transaction', {
            customer_id: storedCustomerId,
            type: 'payment',
            quantity: 1,
            unit_price: amount,
            total_amount: amount,
            description,
            date: new Date(date).toISOString()
        });
        
        console.log('✅ Tahsilat kaydedildi!');
        
        showNotification('Tahsilat başarıyla eklendi', 'success');
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
        showNotification('Tahsilat eklenirken hata oluştu', 'error');
    }
}

// Button functions
async function addSale() {
    if (!currentCustomer) {
        showNotification('Önce bir müşteri seçin', 'error');
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
        showNotification('Önce bir müşteri seçin', 'error');
        return;
    }
    
    console.log('currentCustomer:', currentCustomer);
    
    // Satış ekleme modal'ını aç (varsayılan olarak satış)
    await addSale();
}

async function editTransaction() {
    console.log('=== EDIT TRANSACTION FUNCTION CALLED ===');
    
    if (!currentCustomer) {
        showNotification('Önce bir müşteri seçin', 'error');
        return;
    }
    
    // Seçili satırı kontrol et - doğru selector kullan
    const selectedRow = document.querySelector('#sales-table-body tr.selected');
    console.log('selectedRow:', selectedRow);
    
    if (!selectedRow) {
        showNotification('Düzenlemek için bir işlem seçin', 'warning');
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

function deleteTransaction() {
    console.log('=== DELETE TRANSACTION FUNCTION CALLED ===');
    
    if (!currentCustomer) {
        showNotification('Önce bir müşteri seçin', 'error');
        return;
    }
    
    // Seçili satırı kontrol et - doğru selector kullan
    const selectedRow = document.querySelector('#sales-table-body tr.selected');
    console.log('selectedRow:', selectedRow);
    
    if (!selectedRow) {
        showNotification('Silmek için bir işlem seçin', 'warning');
        return;
    }
    
    const transactionType = selectedRow.getAttribute('data-transaction-type');
    const transactionId = selectedRow.getAttribute('data-transaction-id');
    
    console.log('transactionType:', transactionType);
    console.log('transactionId:', transactionId);
    
    if (transactionType === 'sale') {
        deleteSale();
    } else if (transactionType === 'purchase') {
        deletePurchase();
    }
}

// Load products for sale dropdown
async function loadProductsForSale() {
    try {
        const products = await ipcRenderer.invoke('get-products');
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

// Show quick add product modal
function showQuickAddProduct() {
    document.getElementById('quick-add-product-form').reset();
    showModal('quick-add-product-modal');
    document.getElementById('quick-product-name').focus();
}

// Handle quick add product
async function handleQuickAddProduct(e) {
    e.preventDefault();
    
    const name = document.getElementById('quick-product-name').value.trim();
    const price = parseFloat(document.getElementById('quick-product-price').value);
    const vatRate = parseFloat(document.getElementById('quick-product-vat').value);
    
    if (!name || !price || price <= 0) {
        showNotification('Tüm alanları doldurun', 'error');
        return;
    }
    
    try {
        // Calculate price without VAT
        const priceWithoutVat = price / (1 + vatRate / 100);
        const purchasePrice = priceWithoutVat * 0.7; // 30% profit margin on price without VAT
        
        const productData = {
            name: name,
            code: '',
            barcode: '',
            unit: 'adet',
            purchase_price: purchasePrice,
            sale_price: price, // KDV dahil fiyat
            vat_rate: vatRate,
            stock: 0,
            min_stock: 0,
            category: '',
            description: ''
        };
        
        const result = await ipcRenderer.invoke('add-product', productData);
        
        showNotification('Ürün başarıyla eklendi', 'success');
        closeModal('quick-add-product-modal');
        
        // Reload products
        await loadProductsForSale();
        
        // Auto-select the newly added product
        document.getElementById('sale-product').value = result.id;
        
        // Trigger change event to fill price
        document.getElementById('sale-product').dispatchEvent(new Event('change'));
        
    } catch (error) {
        console.error('Ürün eklenirken hata:', error);
        showNotification('Ürün eklenirken hata oluştu', 'error');
    }
}

// Handle add product (from product management)
async function handleAddProduct(e) {
    e.preventDefault();
    
    const name = document.getElementById('product-name').value.trim();
    const code = document.getElementById('product-code').value.trim();
    const barcode = document.getElementById('product-barcode').value.trim();
    const unit = document.getElementById('product-unit').value;
    const purchasePrice = parseFloat(document.getElementById('product-purchase-price').value) || 0;
    const salePrice = parseFloat(document.getElementById('product-sale-price').value);
    const vatRate = parseFloat(document.getElementById('product-vat').value);
    const stock = parseFloat(document.getElementById('product-stock').value) || 0;
    const minStock = parseFloat(document.getElementById('product-min-stock').value) || 0;
    const category = document.getElementById('product-category').value.trim();
    const description = document.getElementById('product-description').value.trim();
    
    if (!name || !salePrice || salePrice <= 0) {
        showNotification('Ürün adı ve satış fiyatı zorunludur', 'error');
        return;
    }
    
    try {
        const productData = {
            name,
            code,
            barcode,
            unit,
            purchase_price: purchasePrice,
            sale_price: salePrice,
            vat_rate: vatRate,
            stock,
            min_stock: minStock,
            category,
            description
        };
        
        await ipcRenderer.invoke('add-product', productData);
        
        showNotification('Ürün başarıyla eklendi', 'success');
        closeModal('add-product-modal');
        document.getElementById('add-product-form').reset();
        
        // If product management modal is open, reload products
        // (This will be handled by loadProducts function if called)
        
    } catch (error) {
        console.error('Ürün eklenirken hata:', error);
        showNotification('Ürün eklenirken hata oluştu', 'error');
    }
}

async function addPurchase() {
    if (!currentCustomer) {
        showNotification('Önce bir müşteri seçin', 'error');
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
        showNotification('Önce bir müşteri seçin', 'error');
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
        showNotification('Müşteri adı gereklidir', 'error');
        return;
    }
    
    console.log('Sending update request with data:', { id, name, customerType });
    
    try {
        const result = await ipcRenderer.invoke('update-customer', {
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
            showNotification('Müşteri başarıyla güncellendi', 'success');
            closeModal('edit-customer-modal');
            
            // Reload customers and refresh current customer
            await loadCustomers();
            await selectCustomer(id);
            
        } else {
            showNotification('Müşteri güncellenirken hata oluştu', 'error');
        }
        
    } catch (error) {
        console.error('Müşteri güncellenirken hata:', error);
        showNotification('Müşteri güncellenirken hata oluştu', 'error');
    }
}

async function deleteCustomer() {
    if (!currentCustomer) {
        showNotification('Önce bir müşteri seçin', 'error');
        return;
    }
    
    // Onay mesajı göster
    const confirmMessage = `"${currentCustomer.name}" müşterisini ve tüm işlemlerini silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        const result = await ipcRenderer.invoke('delete-customer', currentCustomer.id);
        
        if (result.success) {
            showNotification('Müşteri başarıyla silindi', 'success');
            
            // Müşteri listesini yenile
            await loadCustomers();
            
            // Seçili müşteriyi temizle
            currentCustomer = null;
            
            // Detayları temizle
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
            
            // İşlem tablolarını temizle
            document.getElementById('sales-table-body').innerHTML = '<tr><td colspan="6" class="no-data">&lt;Gösterilecek Bilgi Yok&gt;</td></tr>';
            document.getElementById('purchases-table-body').innerHTML = '<tr><td colspan="6" class="no-data">&lt;Gösterilecek Bilgi Yok&gt;</td></tr>';
            
        } else {
            showNotification('Müşteri silinirken hata oluştu', 'error');
        }
        
    } catch (error) {
        console.error('Müşteri silinirken hata:', error);
        showNotification('Müşteri silinirken hata oluştu', 'error');
    }
}


// Customer search functionality
function setupCustomerSearch(inputId, dropdownId) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    
    input.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        selectedCustomerId = null; // Reset selection
        
        if (searchTerm.length >= 3) {
            searchAndShowCustomers(searchTerm, dropdown);
        } else {
            hideDropdown(dropdown);
        }
    });
    
    input.addEventListener('blur', () => {
        // Delay hiding to allow click on dropdown item
        setTimeout(() => hideDropdown(dropdown), 200);
    });
    
    input.addEventListener('focus', () => {
        if (input.value.trim().length >= 3) {
            searchAndShowCustomers(input.value.trim(), dropdown);
        }
    });
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
        const customers = await ipcRenderer.invoke('get-customers');
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

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
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
const style = document.createElement('style');
style.textContent = `
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
document.head.appendChild(style);

// Modal dışına tıklayınca kapatma
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ESC tuşu ile modal kapatma
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Bakiye modal'ı için özel kapatma
        const balanceModal = document.getElementById('balance-modal');
        if (balanceModal) {
            closeBalanceModal();
            return;
        }
        
        // Diğer modal'lar için genel kapatma
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

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
    
    // Function keys - Main shortcuts
    switch (e.key) {
        case 'F1':
            focusCustomerSearch();
            break;
        case 'F2':
            if (currentCustomer) {
                quickSale();
            } else {
                showNotification('Önce müşteri seçin (F1)', 'warning');
            }
            break;
        case 'F3':
            if (currentCustomer) {
                quickPurchase();
            } else {
                showNotification('Önce müşteri seçin (F1)', 'warning');
            }
            break;
        case 'F4':
            if (currentCustomer) {
                addSale();
            } else {
                showNotification('Önce müşteri seçin (F1)', 'warning');
            }
            break;
        case 'F5':
            if (currentCustomer) {
                addPurchase();
            } else {
                showNotification('Önce müşteri seçin (F1)', 'warning');
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
        showNotification('Önce müşteri seçin (F1)', 'warning');
        return;
    }
    
    // Show minimal quick sale modal
    const amount = prompt(`${currentCustomer.name}\n\nSatış Tutarı (KDV Dahil):`, '');
    
    if (amount === null || amount.trim() === '') {
        return; // User cancelled
    }
    
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
        showNotification('Geçerli bir tutar girin', 'error');
        return;
    }
    
    const description = prompt(`${currentCustomer.name}\n\nAçıklama (opsiyonel):`, '');
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        await ipcRenderer.invoke('add-transaction', {
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
        
        showNotification(`✅ ${formatMoney(amountFloat)} satış kaydedildi`, 'success');
        
        // Reload data
        await loadCustomers();
        await selectCustomer(currentCustomer.id);
        
    } catch (error) {
        console.error('Quick sale error:', error);
        showNotification('Satış kaydedilemedi', 'error');
    }
}

async function quickPurchase() {
    if (!currentCustomer) {
        showNotification('Önce müşteri seçin (F1)', 'warning');
        return;
    }
    
    // Show minimal quick purchase modal
    const amount = prompt(`${currentCustomer.name}\n\nTahsilat Tutarı:`, '');
    
    if (amount === null || amount.trim() === '') {
        return; // User cancelled
    }
    
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
        showNotification('Geçerli bir tutar girin', 'error');
        return;
    }
    
    const description = prompt(`${currentCustomer.name}\n\nAçıklama (opsiyonel):`, '');
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        await ipcRenderer.invoke('add-transaction', {
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
        
        showNotification(`✅ ${formatMoney(amountFloat)} tahsilat kaydedildi`, 'success');
        
        // Reload data
        await loadCustomers();
        await selectCustomer(currentCustomer.id);
        
    } catch (error) {
        console.error('Quick purchase error:', error);
        showNotification('Tahsilat kaydedilemedi', 'error');
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

function exitApp() {
    if (confirm('Uygulamadan çıkmak istediğinizden emin misiniz?')) {
        window.close();
    }
}

// Top Control Functions
function queryTransactions() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
        showNotification('Başlangıç ve bitiş tarihlerini seçin', 'error');
        return;
    }
    
    // Tarih aralığındaki işlemleri filtrele
    filterTransactions();
    showNotification(`${formatDate(startDate)} - ${formatDate(endDate)} tarihleri arası işlemler gösteriliyor`, 'success');
}

function showReports() {
    // Gelişmiş rapor sistemi
    showReportsModal();
}

async function showBalanceTotal() {
    try {
        // Seçili müşteri kontrolü
        if (!currentCustomer) {
            showNotification('Lütfen önce bir müşteri seçin', 'warning');
            return;
        }
        
        // Ana ekrandaki aynı veri kaynağını kullan (sales ve purchases global değişkenleri)
        if (!sales || !purchases) {
            showNotification('İşlem verileri yüklenmedi. Lütfen müşteriyi tekrar seçin.', 'warning');
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
        showNotification('Bakiye hesaplanırken hata oluştu', 'error');
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
    
    // Modal'ı body'e ekle
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
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
        modal.remove();
    }
}

// Bakiye raporunu yazdır
function printBalanceReport() {
    // Seçili müşteri kontrolü
    if (!currentCustomer) {
        showNotification('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    
    try {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        const currentDateStr = currentDate.toLocaleDateString('tr-TR');
        
        // Ana ekrandaki tablodan direkt veri çek
        const mainTableBody = document.getElementById('sales-table-body');
        if (!mainTableBody) {
            showNotification('Ana ekrandaki tablo bulunamadı. Lütfen müşteriyi tekrar seçin.', 'warning');
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
        
        showNotification('🖨️ Yazdırma penceresi açıldı', 'success');
        
    } catch (error) {
        console.error('Yazdırma hatası:', error);
        showNotification('Yazdırma sırasında hata oluştu', 'error');
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
        showNotification('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    
    try {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        const currentDateStr = currentDate.toLocaleDateString('tr-TR');
        
        // Ana ekrandaki tablodan direkt veri çek
        const mainTableBody = document.getElementById('sales-table-body');
        if (!mainTableBody) {
            showNotification('Ana ekrandaki tablo bulunamadı. Lütfen müşteriyi tekrar seçin.', 'warning');
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
        
        showNotification('📄 PDF dosyası başarıyla indirildi', 'success');
        
    } catch (error) {
        console.error('PDF export hatası:', error);
        showNotification('PDF export sırasında hata oluştu', 'error');
    }
}

// Bakiye raporunu Excel'e aktar
function exportBalanceToExcel() {
    // Seçili müşteri kontrolü
    if (!currentCustomer) {
        showNotification('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    
    try {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        const currentDateStr = currentDate.toLocaleDateString('tr-TR');
        
        // Ana ekrandaki tablodan direkt veri çek
        const mainTableBody = document.getElementById('sales-table-body');
        if (!mainTableBody) {
            showNotification('Ana ekrandaki tablo bulunamadı. Lütfen müşteriyi tekrar seçin.', 'warning');
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
        
        showNotification('📊 Excel dosyası başarıyla indirildi', 'success');
        
    } catch (error) {
        console.error('Excel export hatası:', error);
        showNotification('Excel export sırasında hata oluştu', 'error');
    }
}

// Bakiye raporunu panoya kopyala
function copyBalanceToClipboard() {
    // Seçili müşteri kontrolü
    if (!currentCustomer) {
        showNotification('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    
    try {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        const currentDateStr = currentDate.toLocaleDateString('tr-TR');
        
        // Ana ekrandaki tablodan direkt veri çek
        const mainTableBody = document.getElementById('sales-table-body');
        if (!mainTableBody) {
            showNotification('Ana ekrandaki tablo bulunamadı. Lütfen müşteriyi tekrar seçin.', 'warning');
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
                showNotification('📋 Rapor panoya kopyalandı', 'success');
            }).catch(() => {
                fallbackCopyToClipboard(copyText);
            });
        } else {
            fallbackCopyToClipboard(copyText);
        }
        
    } catch (error) {
        console.error('Kopyalama hatası:', error);
        showNotification('Kopyalama sırasında hata oluştu', 'error');
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
        showNotification('📋 Rapor panoya kopyalandı', 'success');
    } catch (err) {
        showNotification('❌ Kopyalama başarısız oldu', 'error');
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
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Tarih aralığını varsayılan olarak son 30 gün yap
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    document.getElementById('report-start-date').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('report-end-date').value = today.toISOString().split('T')[0];
}

// Ürün Yönetimi Modal - Profesyonel Versiyon
async function showProductManagement() {
    try {
        // Mevcut ürünleri getir
        const products = await ipcRenderer.invoke('get-products');
        
    const modalHtml = `
            <div id="product-management-modal" class="modal active" onclick="if(event.target.id === 'product-management-modal') closeModal('product-management-modal')">
                <div class="modal-content" style="max-width: 1200px; max-height: 90vh; overflow-y: auto;" onclick="event.stopPropagation()">
                <div class="modal-header">
                        <h2>📋 Ürün Yönetimi</h2>
                        <button class="close-btn" onclick="closeModal('product-management-modal')">&times;</button>
                </div>
                    
                <div style="padding: 20px;">
                        <!-- Üst Butonlar -->
                        <div style="display: flex; gap: 15px; margin-bottom: 30px; flex-wrap: wrap;">
                            <button onclick="showAddProductModal()" 
                                    style="padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                ➕ Yeni Ürün Ekle
                            </button>
                            <button onclick="showQuickAddProduct()" 
                                    style="padding: 12px 24px; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                ⚡ Hızlı Ekle
                            </button>
                            <button onclick="exportProductsToExcel()" 
                                    style="padding: 12px 24px; background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                📊 Excel'e Aktar
                            </button>
                            <button onclick="printProducts()" 
                                    style="padding: 12px 24px; background: linear-gradient(135deg, #9f7aea 0%, #805ad5 100%); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                🖨️ Yazdır
                            </button>
                        </div>
                        
                        <!-- Arama ve Filtreler -->
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 15px; align-items: end;">
                        <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">🔍 Ürün Ara</label>
                                    <input type="text" id="product-search" placeholder="Ürün adı, kodu veya barkod..." 
                                           style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;"
                                           onkeyup="filterProducts()">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">📦 Kategori</label>
                                    <select id="category-filter" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" onchange="filterProducts()">
                                        <option value="">Tüm Kategoriler</option>
                                        <option value="Elektronik">Elektronik</option>
                                        <option value="Giyim">Giyim</option>
                                        <option value="Gıda">Gıda</option>
                                        <option value="Ev & Yaşam">Ev & Yaşam</option>
                                        <option value="Spor">Spor</option>
                                        <option value="Kitap">Kitap</option>
                                        <option value="Diğer">Diğer</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">📊 Durum</label>
                                    <select id="status-filter" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" onchange="filterProducts()">
                                        <option value="">Tüm Durumlar</option>
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Pasif</option>
                                        <option value="low-stock">Düşük Stok</option>
                                    </select>
                                </div>
                                <div>
                                    <button onclick="clearProductFilters()" 
                                            style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                        🗑️ Temizle
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Ürünler Tablosu -->
                        <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                                        <tr>
                                            <th style="padding: 15px; text-align: left; font-weight: 600; font-size: 14px;">📦 Ürün Bilgileri</th>
                                            <th style="padding: 15px; text-align: left; font-weight: 600; font-size: 14px;">🏷️ Kod & Barkod</th>
                                            <th style="padding: 15px; text-align: center; font-weight: 600; font-size: 14px;">📊 Stok</th>
                                            <th style="padding: 15px; text-align: right; font-weight: 600; font-size: 14px;">💰 Fiyatlar</th>
                                            <th style="padding: 15px; text-align: center; font-weight: 600; font-size: 14px;">📈 KDV</th>
                                            <th style="padding: 15px; text-align: center; font-weight: 600; font-size: 14px;">📂 Kategori</th>
                                            <th style="padding: 15px; text-align: center; font-weight: 600; font-size: 14px;">⚡ Durum</th>
                                            <th style="padding: 15px; text-align: center; font-weight: 600; font-size: 14px;">🔧 İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody id="products-table-body">
                                        ${products.map(product => `
                                            <tr style="border-bottom: 1px solid #e5e7eb;" data-product-id="${product.id}">
                                                <td style="padding: 15px;">
                                                    <div style="font-weight: 600; color: #374151; margin-bottom: 5px;">${product.name}</div>
                                                    <div style="font-size: 12px; color: #6b7280;">${product.description || 'Açıklama yok'}</div>
                                                </td>
                                                <td style="padding: 15px;">
                                                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 3px;">Kod: ${product.code || '-'}</div>
                                                    <div style="font-size: 12px; color: #6b7280;">Barkod: ${product.barcode || '-'}</div>
                                                </td>
                                                <td style="padding: 15px; text-align: center;">
                                                    <div style="font-weight: 600; color: ${product.stock <= product.min_stock ? '#e53e3e' : '#38a169'};">
                                                        ${product.stock} ${product.unit}
                                                    </div>
                                                    ${product.stock <= product.min_stock ? '<div style="font-size: 11px; color: #e53e3e;">⚠️ Düşük Stok</div>' : ''}
                                                </td>
                                                <td style="padding: 15px; text-align: right;">
                                                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 3px;">Alış: ₺${formatMoney(product.purchase_price)}</div>
                                                    <div style="font-weight: 600; color: #38a169;">Satış: ₺${formatMoney(product.sale_price)}</div>
                                                </td>
                                                <td style="padding: 15px; text-align: center;">
                                                    <span style="background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                                                        %${product.vat_rate}
                                                    </span>
                                                </td>
                                                <td style="padding: 15px; text-align: center;">
                                                    <span style="background: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                                                        ${product.category || 'Genel'}
                                                    </span>
                                                </td>
                                                <td style="padding: 15px; text-align: center;">
                                                    <span style="background: ${product.is_active ? '#d1fae5' : '#fee2e2'}; color: ${product.is_active ? '#065f46' : '#991b1b'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                                                        ${product.is_active ? '✅ Aktif' : '❌ Pasif'}
                                                    </span>
                                                </td>
                                                <td style="padding: 15px; text-align: center;">
                                                    <div style="display: flex; gap: 5px; justify-content: center;">
                                                        <button onclick="editProduct(${product.id})" 
                                                                style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                                                            ✏️
                                                        </button>
                                                        <button onclick="deleteProduct(${product.id})" 
                                                                style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <!-- Özet Bilgiler -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                                <div style="font-size: 24px; font-weight: 700; margin-bottom: 5px;">${products.length}</div>
                                <div style="font-size: 14px; opacity: 0.9;">Toplam Ürün</div>
                            </div>
                            <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                                <div style="font-size: 24px; font-weight: 700; margin-bottom: 5px;">${products.filter(p => p.is_active).length}</div>
                                <div style="font-size: 14px; opacity: 0.9;">Aktif Ürün</div>
                            </div>
                            <div style="background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                                <div style="font-size: 24px; font-weight: 700; margin-bottom: 5px;">${products.filter(p => p.stock <= p.min_stock).length}</div>
                                <div style="font-size: 14px; opacity: 0.9;">Düşük Stok</div>
                            </div>
                            <div style="background: linear-gradient(135deg, #9f7aea 0%, #805ad5 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                                <div style="font-size: 24px; font-weight: 700; margin-bottom: 5px;">${new Set(products.map(p => p.category).filter(c => c)).size}</div>
                                <div style="font-size: 14px; opacity: 0.9;">Kategori</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
    } catch (error) {
        console.error('Product management modal error:', error);
        showNotification('Ürünler yüklenirken hata oluştu', 'error');
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

// Ürün düzenleme modal'ı
async function editProduct(productId) {
    try {
        const products = await ipcRenderer.invoke('get-products');
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            showNotification('Ürün bulunamadı', 'error');
            return;
        }
        
        const modalHtml = `
            <div id="edit-product-modal" class="modal active" onclick="if(event.target.id === 'edit-product-modal') closeModal('edit-product-modal')">
                <div class="modal-content" style="max-width: 800px;" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>✏️ Ürün Düzenle</h2>
                        <button class="close-btn" onclick="closeModal('edit-product-modal')">&times;</button>
                    </div>
                    
                    <div style="padding: 20px;">
                        <form id="edit-product-form" onsubmit="handleEditProduct(event, ${productId})">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Ürün Adı *</label>
                                    <input type="text" id="edit-product-name" name="name" value="${product.name}" 
                                           style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" required>
                                </div>
                                
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Ürün Kodu</label>
                                    <input type="text" id="edit-product-code" name="code" value="${product.code || ''}" 
                                           style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                </div>
                                
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Barkod</label>
                                    <input type="text" id="edit-product-barcode" name="barcode" value="${product.barcode || ''}" 
                                           style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                </div>
                                
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Birim</label>
                                    <select id="edit-product-unit" name="unit" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                        <option value="adet" ${product.unit === 'adet' ? 'selected' : ''}>Adet</option>
                                        <option value="kg" ${product.unit === 'kg' ? 'selected' : ''}>Kilogram</option>
                                        <option value="lt" ${product.unit === 'lt' ? 'selected' : ''}>Litre</option>
                                        <option value="m" ${product.unit === 'm' ? 'selected' : ''}>Metre</option>
                                        <option value="m²" ${product.unit === 'm²' ? 'selected' : ''}>Metrekare</option>
                                        <option value="paket" ${product.unit === 'paket' ? 'selected' : ''}>Paket</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Alış Fiyatı (₺)</label>
                                    <input type="number" id="edit-product-purchase-price" name="purchase_price" value="${product.purchase_price}" 
                                           step="0.01" min="0" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                            </div>
                                
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Satış Fiyatı (₺) *</label>
                                    <input type="number" id="edit-product-sale-price" name="sale_price" value="${product.sale_price}" 
                                           step="0.01" min="0" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" required>
                        </div>
                                
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">KDV Oranı (%)</label>
                                    <input type="number" id="edit-product-vat" name="vat_rate" value="${product.vat_rate}" 
                                           step="0.1" min="0" max="100" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                    </div>
                    
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Stok Miktarı</label>
                                    <input type="number" id="edit-product-stock" name="stock" value="${product.stock}" 
                                           step="0.01" min="0" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                </div>
                                
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Minimum Stok</label>
                                    <input type="number" id="edit-product-min-stock" name="min_stock" value="${product.min_stock}" 
                                           step="0.01" min="0" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                </div>
                                
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Kategori</label>
                                    <input type="text" id="edit-product-category" name="category" value="${product.category || ''}" 
                                           style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Açıklama</label>
                                <textarea id="edit-product-description" name="description" rows="3" 
                                          style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; resize: vertical;">${product.description || ''}</textarea>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label style="display: flex; align-items: center; gap: 8px;">
                                    <input type="checkbox" id="edit-product-active" name="is_active" ${product.is_active ? 'checked' : ''}>
                                    <span style="font-weight: 600; color: #374151;">Aktif Ürün</span>
                                </label>
                            </div>
                            
                            <div style="display: flex; gap: 15px; justify-content: flex-end;">
                                <button type="button" onclick="closeModal('edit-product-modal')" 
                                        style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                    ❌ İptal
                            </button>
                                <button type="submit" 
                                        style="padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                    💾 Güncelle
                            </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
    } catch (error) {
        console.error('Edit product modal error:', error);
        showNotification('Ürün düzenleme modal\'ı açılırken hata oluştu', 'error');
    }
}

// Ürün düzenleme işlemi
async function handleEditProduct(event, productId) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const productData = {
            name: formData.get('name'),
            code: formData.get('code'),
            barcode: formData.get('barcode'),
            unit: formData.get('unit'),
            purchase_price: parseFloat(formData.get('purchase_price')) || 0,
            sale_price: parseFloat(formData.get('sale_price')),
            vat_rate: parseFloat(formData.get('vat_rate')) || 0,
            stock: parseFloat(formData.get('stock')) || 0,
            min_stock: parseFloat(formData.get('min_stock')) || 0,
            category: formData.get('category'),
            description: formData.get('description'),
            is_active: formData.get('is_active') ? 1 : 0
        };
        
        await ipcRenderer.invoke('update-product', productId, productData);
        
        showNotification('✅ Ürün başarıyla güncellendi', 'success');
        closeModal('edit-product-modal');
        
        // Ürün yönetimi modal'ını yenile
        closeModal('product-management-modal');
        setTimeout(() => showProductManagement(), 100);
        
    } catch (error) {
        console.error('Update product error:', error);
        showNotification('Ürün güncellenirken hata oluştu', 'error');
    }
}

// Ürün silme
async function deleteProduct(productId) {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        await ipcRenderer.invoke('delete-product', productId);
        showNotification('✅ Ürün başarıyla silindi', 'success');
        
        // Ürün yönetimi modal'ını yenile
        closeModal('product-management-modal');
        setTimeout(() => showProductManagement(), 100);
        
    } catch (error) {
        console.error('Delete product error:', error);
        showNotification('Ürün silinirken hata oluştu', 'error');
    }
}

// Ürün ekleme modal'ı
function showAddProductModal() {
    const modalHtml = `
        <div id="add-product-modal" class="modal active" onclick="if(event.target.id === 'add-product-modal') closeModal('add-product-modal')">
            <div class="modal-content" style="max-width: 800px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>➕ Yeni Ürün Ekle</h2>
                    <button class="close-btn" onclick="closeModal('add-product-modal')">&times;</button>
                </div>
                
                <div style="padding: 20px;">
                    <form id="add-product-form" onsubmit="handleAddProduct(event)">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Ürün Adı *</label>
                                <input type="text" id="product-name" name="name" 
                                       style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" required>
                            </div>
                            
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Ürün Kodu</label>
                                <input type="text" id="product-code" name="code" 
                                       style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                            </div>
                            
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Barkod</label>
                                <input type="text" id="product-barcode" name="barcode" 
                                       style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                            </div>
                            
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Birim</label>
                                <select id="product-unit" name="unit" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                    <option value="adet">Adet</option>
                                    <option value="kg">Kilogram</option>
                                    <option value="lt">Litre</option>
                                    <option value="m">Metre</option>
                                    <option value="m²">Metrekare</option>
                                    <option value="paket">Paket</option>
                                </select>
                            </div>
                            
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Alış Fiyatı (₺)</label>
                                <input type="number" id="product-purchase-price" name="purchase_price" 
                                       step="0.01" min="0" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                            </div>
                            
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Satış Fiyatı (₺) *</label>
                                <input type="number" id="product-sale-price" name="sale_price" 
                                       step="0.01" min="0" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" required>
                            </div>
                            
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">KDV Oranı (%)</label>
                                <input type="number" id="product-vat" name="vat_rate" value="20" 
                                       step="0.1" min="0" max="100" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                            </div>
                            
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Stok Miktarı</label>
                                <input type="number" id="product-stock" name="stock" 
                                       step="0.01" min="0" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                            </div>
                            
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Minimum Stok</label>
                                <input type="number" id="product-min-stock" name="min_stock" 
                                       step="0.01" min="0" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                            </div>
                            
                            <div>
                                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Kategori</label>
                                <input type="text" id="product-category" name="category" 
                                       style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Açıklama</label>
                            <textarea id="product-description" name="description" rows="3" 
                                      style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; resize: vertical;"></textarea>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" id="product-active" name="is_active" checked>
                                <span style="font-weight: 600; color: #374151;">Aktif Ürün</span>
                            </label>
                        </div>
                        
                        <div style="display: flex; gap: 15px; justify-content: flex-end;">
                            <button type="button" onclick="closeModal('add-product-modal')" 
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
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Ürünleri Excel'e aktar
async function exportProductsToExcel() {
    try {
        const products = await ipcRenderer.invoke('get-products');
        
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
        
        showNotification('✅ Ürünler Excel dosyasına aktarıldı', 'success');
        
    } catch (error) {
        console.error('Export products error:', error);
        showNotification('Ürünler aktarılırken hata oluştu', 'error');
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
        const companySettings = await ipcRenderer.invoke('get-company-settings');
        
    const modalHtml = `
            <div id="settings-modal" class="modal active" onclick="if(event.target.id === 'settings-modal') closeModal('settings-modal')">
                <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow-y: auto;" onclick="event.stopPropagation()">
                <div class="modal-header">
                        <h2>⚙️ Firma Ayarları</h2>
                    <button class="close-btn" onclick="closeModal('settings-modal')">&times;</button>
                </div>
                    
                <div style="padding: 20px;">
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
                                        <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">Logo Yolu</label>
                                        <input type="text" id="logo_path" name="logo_path" value="${companySettings.logo_path || ''}" 
                                               style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" 
                                               placeholder="C:\\path\\to\\logo.png">
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
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
        
    } catch (error) {
        console.error('Settings modal error:', error);
        showNotification('Ayarlar yüklenirken hata oluştu', 'error');
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
        
        const result = await ipcRenderer.invoke('update-company-settings', settingsData);
        
        if (result.success) {
            showNotification('✅ Firma ayarları başarıyla kaydedildi', 'success');
            closeModal('settings-modal');
        } else {
            showNotification('❌ Ayarlar kaydedilirken hata oluştu', 'error');
        }
        
    } catch (error) {
        console.error('Save company settings error:', error);
        showNotification('Ayarlar kaydedilirken hata oluştu', 'error');
    }
}

// Rapor fonksiyonları
// Finansal Özet Raporu
// Finansal Özet Raporu
async function generateFinancialReport() {
    try {
        showNotification('💰 Genel finansal özet raporu hazırlanıyor...', 'info');
    closeModal('reports-modal');
        
        // Tüm müşterileri getir
        const customers = await ipcRenderer.invoke('get-customers');
        if (!customers || customers.length === 0) {
            showNotification('Müşteri bulunamadı', 'warning');
            return;
        }
        
        // Tüm işlemleri topla
        let totalSales = 0;
        let totalPayments = 0;
        let totalCustomers = customers.length;
        let totalTransactions = 0;
        
        for (const customer of customers) {
            const sales = await ipcRenderer.invoke('get-sales', customer.id);
            const purchases = await ipcRenderer.invoke('get-purchases', customer.id);
            
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
        showNotification('Finansal rapor oluşturulurken hata oluştu', 'error');
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
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Genel Finansal Rapor Export Fonksiyonları
async function exportGeneralFinancialToExcel() {
    try {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        const currentDateStr = currentDate.toLocaleDateString('tr-TR');
        
        // Tüm müşterileri getir
        const customers = await ipcRenderer.invoke('get-customers');
        
        // Tüm işlemleri topla
        let totalSales = 0;
        let totalPayments = 0;
        let totalCustomers = customers.length;
        let totalTransactions = 0;
        
        for (const customer of customers) {
            const sales = await ipcRenderer.invoke('get-sales', customer.id);
            const purchases = await ipcRenderer.invoke('get-purchases', customer.id);
            
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
            const sales = await ipcRenderer.invoke('get-sales', customer.id);
            const purchases = await ipcRenderer.invoke('get-purchases', customer.id);
            
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
        
        showNotification('📊 Genel finansal rapor Excel\'e aktarıldı', 'success');
        
    } catch (error) {
        console.error('Excel export hatası:', error);
        showNotification('Excel export sırasında hata oluştu', 'error');
    }
}

async function exportGeneralFinancialToPDF() {
    try {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        const currentDateStr = currentDate.toLocaleDateString('tr-TR');
        
        // Tüm müşterileri getir
        const customers = await ipcRenderer.invoke('get-customers');
        
        // Tüm işlemleri topla
        let totalSales = 0;
        let totalPayments = 0;
        let totalCustomers = customers.length;
        let totalTransactions = 0;
        
        for (const customer of customers) {
            const sales = await ipcRenderer.invoke('get-sales', customer.id);
            const purchases = await ipcRenderer.invoke('get-purchases', customer.id);
            
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
            const sales = await ipcRenderer.invoke('get-sales', customer.id);
            const purchases = await ipcRenderer.invoke('get-purchases', customer.id);
            
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
        
        showNotification('📄 Genel finansal rapor PDF\'e aktarıldı', 'success');
        
    } catch (error) {
        console.error('PDF export hatası:', error);
        showNotification('PDF export sırasında hata oluştu', 'error');
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
        
        showNotification('🖨️ Genel finansal rapor yazdırıldı', 'success');
        
    } catch (error) {
        console.error('Print hatası:', error);
        showNotification('Yazdırma sırasında hata oluştu', 'error');
    }
}

// Müşteri Analiz Raporu
async function generateCustomerReport() {
    try {
        showNotification('👥 Müşteri analiz raporu hazırlanıyor...', 'info');
        
        // Tüm müşterileri getir
        const customers = await ipcRenderer.invoke('get-customers');
        if (!customers || customers.length === 0) {
            showNotification('Müşteri bulunamadı', 'warning');
            return;
        }
        
        // Her müşteri için işlemleri getir ve analiz et
        const customerAnalysis = [];
        
        for (const customer of customers) {
            const sales = await ipcRenderer.invoke('get-sales', customer.id);
            const purchases = await ipcRenderer.invoke('get-purchases', customer.id);
            
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
        showNotification('Müşteri analiz raporu oluşturulurken hata oluştu', 'error');
    }
}

// İşlem Detay Raporu
async function generateTransactionReport() {
    try {
        showNotification('📋 İşlem detay raporu hazırlanıyor...', 'info');
        
        // Tüm müşterileri getir
        const customers = await ipcRenderer.invoke('get-customers');
        if (!customers || customers.length === 0) {
            showNotification('Müşteri bulunamadı', 'warning');
            return;
        }
        
        // Tüm işlemleri topla
        const allTransactions = [];
        
        for (const customer of customers) {
            const sales = await ipcRenderer.invoke('get-sales', customer.id);
            const purchases = await ipcRenderer.invoke('get-purchases', customer.id);
            
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
        showNotification('İşlem detay raporu oluşturulurken hata oluştu', 'error');
    }
}

// Borç Analiz Raporu
async function generateDebtReport() {
    try {
        showNotification('💳 Borç analiz raporu hazırlanıyor...', 'info');
        
        // Tüm müşterileri getir
        const customers = await ipcRenderer.invoke('get-customers');
        if (!customers || customers.length === 0) {
            showNotification('Müşteri bulunamadı', 'warning');
            return;
        }
        
        // Her müşteri için borç analizi yap
        const debtAnalysis = [];
        
        for (const customer of customers) {
            const sales = await ipcRenderer.invoke('get-sales', customer.id);
            const purchases = await ipcRenderer.invoke('get-purchases', customer.id);
            
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
        showNotification('Borç analiz raporu oluşturulurken hata oluştu', 'error');
    }
}

// Aylık Performans Raporu
async function generateMonthlyReport() {
    try {
        showNotification('📅 Aylık performans raporu hazırlanıyor...', 'info');
        
        // Son 12 ayın verilerini getir
        const monthlyData = [];
        const today = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const nextMonthDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
            
            const monthName = monthDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
            
            // Bu ay için tüm müşterilerin işlemlerini getir
            const customers = await ipcRenderer.invoke('get-customers');
            let monthSales = 0;
            let monthPayments = 0;
            let transactionCount = 0;
            
            for (const customer of customers) {
                const sales = await ipcRenderer.invoke('get-sales', customer.id);
                const purchases = await ipcRenderer.invoke('get-purchases', customer.id);
                
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
        showNotification('Aylık performans raporu oluşturulurken hata oluştu', 'error');
    }
}

// Ürün Satış Raporu
async function generateProductReport() {
    try {
        showNotification('📦 Ürün satış raporu hazırlanıyor...', 'info');
        
        // Tüm müşterileri getir
        const customers = await ipcRenderer.invoke('get-customers');
        if (!customers || customers.length === 0) {
            showNotification('Müşteri bulunamadı', 'warning');
            return;
        }
        
        // Tüm satışları topla ve ürün bazında analiz et
        const productAnalysis = new Map();
        
        for (const customer of customers) {
            const sales = await ipcRenderer.invoke('get-sales', customer.id);
            
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
        showNotification('Ürün satış raporu oluşturulurken hata oluştu', 'error');
    }
}

// Hızlı İşlemler Fonksiyonları
function exportAllToExcel() {
    if (!currentCustomer) {
        showNotification('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    exportBalanceToExcel();
}

function exportAllToPDF() {
    if (!currentCustomer) {
        showNotification('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    exportBalanceToPDF();
}

function printAllReports() {
    if (!currentCustomer) {
        showNotification('Lütfen önce bir müşteri seçin', 'warning');
        return;
    }
    printBalanceReport();
}

function refreshReports() {
    showNotification('🔄 Raporlar yenileniyor...', 'info');
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
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
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
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
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
                    
                    <div style="overflow-x: auto;">
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
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
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
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
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
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function restoreData() {
    showNotification('📁 Veri geri yükleme yakında eklenecek', 'info');
}

function clearData() {
    if (confirm('Tüm verileri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
        showNotification('🗑️ Veri temizleme yakında eklenecek', 'warning');
    }
}

function saveSettings() {
    showNotification('💾 Ayarlar kaydedildi', 'success');
    closeModal('settings-modal');
}

// Müşteri Arama Modal Fonksiyonları
let allCustomersForSearch = [];
let filteredCustomersForSearch = [];
let currentFilterType = 'all';

// Müşterileri arama modal'ı için yükle
async function loadCustomersForSearch() {
    try {
        allCustomersForSearch = await ipcRenderer.invoke('get-customers');
        
        // Her müşteri için bakiye hesapla
        const allTransactions = await ipcRenderer.invoke('get-all-transactions');
        
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
        showNotification('Müşteriler yüklenirken hata oluştu', 'error');
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
        
        showNotification(`✅ ${allCustomersForSearch.find(c => c.id === customerId)?.name} seçildi`, 'success');
        
    } catch (error) {
        console.error('Müşteri seçilirken hata:', error);
        showNotification('Müşteri seçilirken hata oluştu', 'error');
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
        showNotification('Önce bir müşteri seçin', 'error');
        return;
    }
    
    showNotification(`${currentCustomer.name} müşterisi için yazdırma raporu hazırlanıyor...`, 'info');
    // TODO: Implement print functionality
}

// App quit function
window.app = {
    quit: () => {
        if (confirm('Uygulamadan çıkmak istediğinizden emin misiniz?')) {
            window.close();
        }
    }
};
