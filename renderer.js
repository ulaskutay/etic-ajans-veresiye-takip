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
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    document.getElementById('start-date').value = formatDateForInput(firstDay);
    document.getElementById('end-date').value = formatDateForInput(lastDay);
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
    document.getElementById('sales-table-body').innerHTML = '<tr><td colspan="6" class="no-data">&lt;Gösterilecek Bilgi Yok&gt;</td></tr>';
    document.getElementById('purchases-table-body').innerHTML = '<tr><td colspan="6" class="no-data">&lt;Gösterilecek Bilgi Yok&gt;</td></tr>';
}

// Load transactions
async function loadTransactions(customerId) {
    try {
        const transactions = await ipcRenderer.invoke('get-transactions', customerId);
        
        // Separate sales and purchases
        sales = transactions.filter(t => t.type === 'debt');
        purchases = transactions.filter(t => t.type === 'payment');
        
        displaySales();
        displayPurchases();
        
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

// Display sales
function displaySales() {
    const tbody = document.getElementById('sales-table-body');
    
    if (sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">&lt;Gösterilecek Bilgi Yok&gt;</td></tr>';
        return;
    }
    
    tbody.innerHTML = sales.map(sale => {
        const date = new Date(sale.created_at);
        return `
            <tr data-transaction-id="${sale.id}" onclick="selectTransactionRow(this, 'sales')">
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
            <tr data-transaction-id="${purchase.id}" onclick="selectTransactionRow(this, 'purchases')">
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
    const selectedSale = getSelectedTransaction('sales');
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
    
    const selectedSale = getSelectedTransaction('sales');
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
    const selectedPurchase = getSelectedTransaction('purchases');
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
    
    const selectedPurchase = getSelectedTransaction('purchases');
    if (!selectedPurchase) {
        showNotification('Lütfen silmek istediğiniz tahsilat işlemini seçin', 'warning');
        return;
    }
    
    if (confirm(`"${selectedPurchase.description || 'Tahsilat'}" işlemini silmek istediğinizden emin misiniz?`)) {
        deleteTransaction(selectedPurchase.id);
    }
}

// Get selected transaction from table
function getSelectedTransaction(type) {
    console.log('getSelectedTransaction called with type:', type);
    
    const tableBody = document.getElementById(`${type}-table-body`);
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
    
    // Find transaction in the appropriate array
    const transactions = type === 'sales' ? sales : purchases;
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
        date: formData.get('date'),
        amount: parseFloat(formData.get('amount')),
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
        date: formData.get('date'),
        amount: parseFloat(formData.get('amount')),
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
    
    // Remove previous selection
    const tableBody = document.getElementById(`${type}-table-body`);
    tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
    
    // Add selection to clicked row
    row.classList.add('selected');
    console.log('Row selected successfully');
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
    
    // Display filtered results
    displayFilteredSales(filteredSales);
    displayFilteredPurchases(filteredPurchases);
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
    document.getElementById(modalId).classList.remove('active');
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
        
        // Seçili müşterinin transaction'larını yükle
        const customerTransactions = await ipcRenderer.invoke('get-transactions', currentCustomer.id);
        
        // Satış ve tahsilat işlemlerini ayır
        const salesTransactions = customerTransactions.filter(t => t.type === 'debt');
        const paymentTransactions = customerTransactions.filter(t => t.type === 'payment');
        
        // Toplamları hesapla
        const totalSales = salesTransactions.reduce((sum, s) => sum + (s.total_amount || s.amount || 0), 0);
        const totalPayments = paymentTransactions.reduce((sum, p) => sum + (p.total_amount || p.amount || 0), 0);
        const netBalance = totalSales - totalPayments;
        
        // İşlem sayıları
        const salesCount = salesTransactions.length;
        const paymentCount = paymentTransactions.length;
        const totalTransactionCount = customerTransactions.length;
        
        // Son işlem tarihleri
        const lastSaleDate = salesTransactions.length > 0 ? 
            new Date(Math.max(...salesTransactions.map(s => new Date(s.date)))).toLocaleDateString('tr-TR') : '-';
        const lastPaymentDate = paymentTransactions.length > 0 ? 
            new Date(Math.max(...paymentTransactions.map(p => new Date(p.date)))).toLocaleDateString('tr-TR') : '-';
        
        // Tahsilat oranı
        const paymentRate = totalSales > 0 ? ((totalPayments / totalSales) * 100) : 0;
        
        // İşlem detayları (tarihe göre sıralı)
        const allTransactionsSorted = customerTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
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
            transactions: allTransactionsSorted
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
                        <table class="customer-balance-table">
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>Tür</th>
                                    <th>Açıklama</th>
                                    <th>Tutar</th>
                                    <th>Bakiye</th>
                                </tr>
                            </thead>
                            <tbody>
                                         ${data.transactions.map(transaction => {
                                             const isDebt = transaction.type === 'debt';
                                             const amount = transaction.total_amount || transaction.amount || 0;
                                             
                                             // Tarih formatını düzelt
                                             let formattedDate = '-';
                                             try {
                                                 const transactionDate = new Date(transaction.date);
                                                 if (!isNaN(transactionDate.getTime())) {
                                                     formattedDate = transactionDate.toLocaleDateString('tr-TR');
                                                 }
                                             } catch (e) {
                                                 console.error('Tarih formatı hatası:', transaction.date);
                                             }
                                             
                                             // Bakiye hesaplama - Doğru mantık: Satış ekle (+), Tahsilat çıkar (-)
                                             let currentBalance = 0;
                                             if (transaction.balance !== undefined && transaction.balance !== null) {
                                                 currentBalance = transaction.balance;
                                             } else {
                                                 // Eğer bakiye yoksa, işlem tipine göre hesapla
                                                 // Satış (debt) = pozitif bakiye, Tahsilat (payment) = negatif bakiye
                                                 currentBalance = isDebt ? amount : -amount;
                                             }
                                             
                                             return `
                                                 <tr>
                                                     <td>${formattedDate}</td>
                                                     <td>
                                                         <span style="color: ${isDebt ? '#e53e3e' : '#38a169'}; font-weight: 600;">
                                                             ${isDebt ? '💰 Satış' : '💳 Tahsilat'}
                                                         </span>
                                                     </td>
                                                     <td>${transaction.description || '-'}</td>
                                                     <td class="${isDebt ? 'negative' : 'positive'}">
                                                         ${isDebt ? '+' : '-'}${formatMoney(amount)}
                                                     </td>
                                                     <td class="${currentBalance > 0 ? 'negative' : currentBalance < 0 ? 'positive' : 'neutral'}">
                                                         ${formatMoney(currentBalance)}
                                                     </td>
                                                 </tr>
                                             `;
                                         }).join('')}
                            </tbody>
                        </table>
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
    const modal = document.getElementById('balance-modal');
    if (!modal) {
        showNotification('Rapor bulunamadı', 'error');
        return;
    }
    
    try {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        const currentDateStr = currentDate.toLocaleDateString('tr-TR');
        
        // Modal'dan verileri al
        const salesCard = modal.querySelector('.balance-summary-card.sales .balance-card-value')?.textContent || '0,00';
        const paymentsCard = modal.querySelector('.balance-summary-card.payments .balance-card-value')?.textContent || '0,00';
        const netCard = modal.querySelector('.balance-summary-card.net .balance-card-value')?.textContent || '0,00';
        const paymentRateCard = modal.querySelector('.balance-summary-card.debt .balance-card-value')?.textContent || '0%';
        
        // İstatistikleri al
        const stats = Array.from(modal.querySelectorAll('.balance-stat-item')).map(item => ({
            label: item.querySelector('.balance-stat-label')?.textContent || '',
            value: item.querySelector('.balance-stat-value')?.textContent || ''
        }));
        
        // İşlem tablosunu al
        const transactionRows = Array.from(modal.querySelectorAll('.customer-balance-table tbody tr')).map(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            return {
                date: cells[0]?.textContent || '',
                type: cells[1]?.textContent || '',
                description: cells[2]?.textContent || '',
                amount: cells[3]?.textContent || '',
                balance: cells[4]?.textContent || ''
            };
        });
        
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
                        <div class="summary-card-value">${salesCard}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-card-title">💳 Toplam Tahsilat</div>
                        <div class="summary-card-value">${paymentsCard}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-card-title">⚖️ Net Bakiye</div>
                        <div class="summary-card-value">${netCard}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-card-title">📊 Tahsilat Orani</div>
                        <div class="summary-card-value">${paymentRateCard}</div>
                    </div>
                </div>
                
                <div class="stats-grid">
                    ${stats.map(stat => `
                        <div class="stat-item">
                            <div class="stat-label">${stat.label}</div>
                            <div class="stat-value">${stat.value}</div>
                        </div>
                    `).join('')}
                </div>
                
                <table class="customer-table">
                    <thead>
                        <tr>
                            <th>Tarih</th>
                            <th>Tur</th>
                            <th>Aciklama</th>
                            <th>Tutar</th>
                            <th>Bakiye</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transactionRows.map(transaction => {
                            // Tarih formatını düzelt
                            let formattedDate = transaction.date;
                            if (transaction.date === 'Invalid Date' || transaction.date === '-') {
                                formattedDate = '-';
                            }
                            
                            return `
                                <tr>
                                    <td>${formattedDate}</td>
                                    <td>${transaction.type}</td>
                                    <td>${transaction.description}</td>
                                    <td class="${transaction.amount.includes('+') ? 'negative' : transaction.amount.includes('-') ? 'positive' : 'neutral'}">${transaction.amount}</td>
                                    <td class="${transaction.balance.includes('-') ? 'negative' : transaction.balance === '0,00' ? 'neutral' : 'positive'}">${transaction.balance}</td>
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
        .replace(/Ø/g, 'O')
        .replace(/°/g, 'o')
        .replace(/§/g, 's')
        .replace(/=/g, '')
        .replace(/Ü/g, 'U')
        .replace(/3/g, 'i')
        .trim();
}

// Bakiye raporunu PDF'e aktar
function exportBalanceToPDF() {
    const modal = document.getElementById('balance-modal');
    if (!modal) {
        showNotification('Rapor bulunamadı', 'error');
        return;
    }
    
    try {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        const currentDateStr = currentDate.toLocaleDateString('tr-TR');
        
        // Modal'dan verileri al
        const customerName = modal.querySelector('.modal-header h2')?.textContent.replace('📊 ', '').replace(' - CARİ HESAP ÖZETİ', '') || 'Musteri';
        const salesCard = modal.querySelector('.balance-summary-card.sales .balance-card-value')?.textContent || '0,00';
        const paymentsCard = modal.querySelector('.balance-summary-card.payments .balance-card-value')?.textContent || '0,00';
        const netCard = modal.querySelector('.balance-summary-card.net .balance-card-value')?.textContent || '0,00';
        const paymentRateCard = modal.querySelector('.balance-summary-card.debt .balance-card-value')?.textContent || '0%';
        
        // İstatistikleri al
        const stats = Array.from(modal.querySelectorAll('.balance-stat-item')).map(item => ({
            label: item.querySelector('.balance-stat-label').textContent,
            value: item.querySelector('.balance-stat-value').textContent
        }));
        
        // İşlem tablosunu al
        const transactionRows = Array.from(modal.querySelectorAll('.customer-balance-table tbody tr')).map(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            return {
                date: cells[0].textContent,
                type: cells[1].textContent,
                description: cells[2].textContent,
                amount: cells[3].textContent,
                balance: cells[4].textContent
            };
        });
        
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
            ['Toplam Satis', salesCard],
            ['Toplam Tahsilat', paymentsCard],
            ['Net Bakiye', netCard],
            ['Tahsilat Orani', paymentRateCard]
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
        
        const statsData = stats.map(stat => [fixTurkishCharsForPDF(stat.label), stat.value]);
        
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
        
        const transactionData = transactionRows.map(row => {
            // Tarih formatını düzelt
            let formattedDate = row.date;
            if (row.date === 'Invalid Date' || row.date === '-') {
                formattedDate = '-';
            }
            
            return [
                formattedDate,
                fixTurkishCharsForPDF(row.type),
                fixTurkishCharsForPDF(row.description),
                row.amount,
                row.balance
            ];
        });
        
        doc.autoTable({
            startY: yPosition,
            head: [['Tarih', 'Tur', 'Aciklama', 'Tutar', 'Bakiye']],
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
                0: { cellWidth: 25, halign: 'center' },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 40, halign: 'left' },
                3: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
                4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
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
    const modal = document.getElementById('balance-modal');
    if (!modal) {
        showNotification('Rapor bulunamadı', 'error');
        return;
    }
    
    try {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        const currentDateStr = currentDate.toLocaleDateString('tr-TR');
        
        // Modal'dan verileri al
        const customerName = modal.querySelector('.modal-header h2')?.textContent.replace('📊 ', '').replace(' - CARİ HESAP ÖZETİ', '') || 'Musteri';
        const salesCard = modal.querySelector('.balance-summary-card.sales .balance-card-value')?.textContent || '0,00';
        const paymentsCard = modal.querySelector('.balance-summary-card.payments .balance-card-value')?.textContent || '0,00';
        const netCard = modal.querySelector('.balance-summary-card.net .balance-card-value')?.textContent || '0,00';
        const paymentRateCard = modal.querySelector('.balance-summary-card.debt .balance-card-value')?.textContent || '0%';
        
        // İstatistikleri al
        const stats = Array.from(modal.querySelectorAll('.balance-stat-item')).map(item => ({
            label: item.querySelector('.balance-stat-label')?.textContent || '',
            value: item.querySelector('.balance-stat-value')?.textContent || ''
        }));
        
        // İşlem tablosunu al
        const transactionRows = Array.from(modal.querySelectorAll('.customer-balance-table tbody tr')).map(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            return {
                date: cells[0]?.textContent || '',
                type: cells[1]?.textContent || '',
                description: cells[2]?.textContent || '',
                amount: cells[3]?.textContent || '',
                balance: cells[4]?.textContent || ''
            };
        });
        
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
        csvContent += `Toplam Satis,"${salesCard.replace(/[^\d,.-]/g, '')}"\n`;
        csvContent += `Toplam Tahsilat,"${paymentsCard.replace(/[^\d,.-]/g, '')}"\n`;
        csvContent += `Net Bakiye,"${netCard.replace(/[^\d,.-]/g, '')}"\n`;
        csvContent += `Tahsilat Orani,"${paymentRateCard}"\n\n`;
        
        // İstatistikler - Profesyonel format
        csvContent += '='.repeat(50) + '\n';
        csvContent += 'ISLEM ISTATISTIKLERI\n';
        csvContent += '='.repeat(50) + '\n';
        csvContent += 'Istatistik,Deger\n';
        stats.forEach(stat => {
            csvContent += `"${fixTurkishCharsForPDF(stat.label)}","${stat.value}"\n`;
        });
        csvContent += '\n';
        
        // İşlem dökümü - Profesyonel format
        csvContent += '='.repeat(80) + '\n';
        csvContent += 'ISLEM DOKUMU\n';
        csvContent += '='.repeat(80) + '\n';
        csvContent += 'Tarih,Tur,Aciklama,Tutar,Bakiye\n';
        transactionRows.forEach(transaction => {
            // Tarih formatını düzelt
            let formattedDate = transaction.date;
            if (transaction.date === 'Invalid Date' || transaction.date === '-') {
                formattedDate = '-';
            }
            
            csvContent += `"${formattedDate}","${fixTurkishCharsForPDF(transaction.type)}","${fixTurkishCharsForPDF(transaction.description)}","${transaction.amount}","${transaction.balance}"\n`;
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
    const modal = document.getElementById('balance-modal');
    if (modal) {
        const currentDate = new Date();
        const currentTime = currentDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        const currentDateStr = currentDate.toLocaleDateString('tr-TR');
        
        // Modal'dan verileri al
        const salesCard = modal.querySelector('.balance-summary-card.sales .balance-card-value').textContent;
        const paymentsCard = modal.querySelector('.balance-summary-card.payments .balance-card-value').textContent;
        const debtCard = modal.querySelector('.balance-summary-card.debt .balance-card-value').textContent;
        const netCard = modal.querySelector('.balance-summary-card.net .balance-card-value').textContent;
        
        // İstatistikleri al
        const stats = Array.from(modal.querySelectorAll('.balance-stat-item')).map(item => ({
            label: item.querySelector('.balance-stat-label').textContent,
            value: item.querySelector('.balance-stat-value').textContent
        }));
        
        // Müşteri tablosunu al
        const customerRows = Array.from(modal.querySelectorAll('.customer-balance-table tbody tr')).map(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            return {
                name: cells[0].textContent,
                code: cells[1].textContent,
                sales: cells[2].textContent,
                payments: cells[3].textContent,
                balance: cells[4].textContent,
                status: cells[5].textContent.trim()
            };
        });
        
        // Kopyalanacak metni oluştur
        let copyText = `ETIC AJANS - CARI HESAP OZETI\n`;
        copyText += `Rapor Tarihi: ${currentDateStr} ${currentTime}\n\n`;
        
        copyText += `FINANSAL OZET:\n`;
        copyText += `💰 Toplam Satis: ${salesCard}\n`;
        copyText += `💳 Toplam Tahsilat: ${paymentsCard}\n`;
        copyText += `📋 Toplam Borc: ${debtCard}\n`;
        copyText += `⚖️ Net Bakiye: ${netCard}\n\n`;
        
        copyText += `MUSTERI ISTATISTIKLERI:\n`;
        stats.forEach(stat => {
            copyText += `• ${fixTurkishCharsForPDF(stat.label)}: ${stat.value}\n`;
        });
        copyText += `\n`;
        
        copyText += `MUSTERI BAKIYE DETAYLARI:\n`;
        copyText += `Musteri Adi\tKod\tSatis\tTahsilat\tBakiye\tDurum\n`;
        copyText += `─`.repeat(80) + `\n`;
        customerRows.forEach(customer => {
            copyText += `${fixTurkishCharsForPDF(customer.name)}\t${customer.code}\t${customer.sales}\t${customer.payments}\t${customer.balance}\t${customer.status}\n`;
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
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2>📊 Raporlar ve Analizler</h2>
                    <button class="close-btn" onclick="closeModal('reports-modal')">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <!-- Sol Kolon -->
                        <div>
                            <h3 style="color: #4a5568; margin-bottom: 15px; font-size: 14px;">📈 Finansal Raporlar</h3>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <button class="btn btn-primary" onclick="generateFinancialReport()">
                                    💰 Finansal Özet Raporu
                                </button>
                                <button class="btn btn-secondary" onclick="generateCustomerReport()">
                                    👥 Müşteri Analiz Raporu
                                </button>
                                <button class="btn btn-secondary" onclick="generateTransactionReport()">
                                    📋 İşlem Detay Raporu
                                </button>
                            </div>
                        </div>
                        
                        <!-- Sağ Kolon -->
                        <div>
                            <h3 style="color: #4a5568; margin-bottom: 15px; font-size: 14px;">📊 Analiz Raporları</h3>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <button class="btn btn-secondary" onclick="generateDebtReport()">
                                    💳 Borç Analiz Raporu
                                </button>
                                <button class="btn btn-secondary" onclick="generateMonthlyReport()">
                                    📅 Aylık Performans Raporu
                                </button>
                                <button class="btn btn-secondary" onclick="generateProductReport()">
                                    📦 Ürün Satış Raporu
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        <h3 style="color: #4a5568; margin-bottom: 15px; font-size: 14px;">⚡ Hızlı İşlemler</h3>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button class="btn btn-secondary" onclick="exportToExcel()">
                                📊 Excel'e Aktar
                            </button>
                            <button class="btn btn-secondary" onclick="printAllReports()">
                                🖨️ Tüm Raporları Yazdır
                            </button>
                            <button class="btn btn-secondary" onclick="showReportsModal()">
                                🔄 Raporları Yenile
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Ayarlar Modal
function showSettingsModal() {
    const modalHtml = `
        <div id="settings-modal" class="modal active">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>⚙️ Uygulama Ayarları</h2>
                    <button class="close-btn" onclick="closeModal('settings-modal')">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <!-- Sol Kolon -->
                        <div>
                            <h3 style="color: #4a5568; margin-bottom: 15px; font-size: 14px;">🔧 Genel Ayarlar</h3>
                            <div style="display: flex; flex-direction: column; gap: 15px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #4a5568;">Para Birimi:</label>
                                    <select style="width: 100%; padding: 8px; border: 1px solid #a0aec0; border-radius: 4px;">
                                        <option value="TL">Türk Lirası (₺)</option>
                                        <option value="USD">Amerikan Doları ($)</option>
                                        <option value="EUR">Euro (€)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #4a5568;">Tarih Formatı:</label>
                                    <select style="width: 100%; padding: 8px; border: 1px solid #a0aec0; border-radius: 4px;">
                                        <option value="DD.MM.YYYY">GG.AA.YYYY</option>
                                        <option value="MM/DD/YYYY">AA/GG/YYYY</option>
                                        <option value="YYYY-MM-DD">YYYY-AA-GG</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Sağ Kolon -->
                        <div>
                            <h3 style="color: #4a5568; margin-bottom: 15px; font-size: 14px;">📊 Varsayılan Değerler</h3>
                            <div style="display: flex; flex-direction: column; gap: 15px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #4a5568;">Varsayılan Kredi Limiti:</label>
                                    <input type="number" value="500" style="width: 100%; padding: 8px; border: 1px solid #a0aec0; border-radius: 4px;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #4a5568;">Varsayılan KDV Oranı:</label>
                                    <select style="width: 100%; padding: 8px; border: 1px solid #a0aec0; border-radius: 4px;">
                                        <option value="0">%0</option>
                                        <option value="1">%1</option>
                                        <option value="10">%10</option>
                                        <option value="20" selected>%20</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        <h3 style="color: #4a5568; margin-bottom: 15px; font-size: 14px;">💾 Veri Yönetimi</h3>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button class="btn btn-secondary" onclick="backupData()">
                                💾 Yedek Al
                            </button>
                            <button class="btn btn-secondary" onclick="restoreData()">
                                📁 Yedekten Geri Yükle
                            </button>
                            <button class="btn btn-secondary" onclick="clearData()">
                                🗑️ Verileri Temizle
                            </button>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
                        <button class="btn btn-secondary" onclick="closeModal('settings-modal')">
                            İptal
                        </button>
                        <button class="btn btn-primary" onclick="saveSettings()">
                            💾 Ayarları Kaydet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Rapor fonksiyonları
function generateFinancialReport() {
    showNotification('💰 Finansal özet raporu hazırlanıyor...', 'info');
    closeModal('reports-modal');
    setTimeout(() => showBalanceTotal(), 500);
}

function generateCustomerReport() {
    showNotification('👥 Müşteri analiz raporu yakında eklenecek', 'info');
}

function generateTransactionReport() {
    showNotification('📋 İşlem detay raporu yakında eklenecek', 'info');
}

function generateDebtReport() {
    showNotification('💳 Borç analiz raporu yakında eklenecek', 'info');
}

function generateMonthlyReport() {
    showNotification('📅 Aylık performans raporu yakında eklenecek', 'info');
}

function generateProductReport() {
    showNotification('📦 Ürün satış raporu yakında eklenecek', 'info');
}

function exportToExcel() {
    showNotification('📊 Excel aktarımı yakında eklenecek', 'info');
}

function printAllReports() {
    showNotification('🖨️ Tüm raporların yazdırılması yakında eklenecek', 'info');
}

// Ayarlar fonksiyonları
function backupData() {
    showNotification('💾 Veri yedekleme yakında eklenecek', 'info');
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
