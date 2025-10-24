// Profesyonel Ürün Yönetimi Sistemi
// ipcRenderer zaten renderer.js'de tanımlı


let productManagementData = {
    products: [],
    categories: [],
    brands: [],
    filteredProducts: [],
    sortBy: 'name',
    sortOrder: 'asc',
    searchTerm: '',
    selectedCategory: '',
    selectedBrand: '',
    selectedProducts: new Set()
};

// Veri yükleme fonksiyonları
async function loadProductCategories() {
    try {
        productManagementData.categories = await ipcRenderer.invoke('get-categories');
        console.log('Categories loaded:', productManagementData.categories);
    } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
        productManagementData.categories = [];
    }
}

async function loadProductBrands() {
    try {
        productManagementData.brands = await ipcRenderer.invoke('get-brands');
        console.log('Brands loaded:', productManagementData.brands);
    } catch (error) {
        console.error('Markalar yüklenirken hata:', error);
        productManagementData.brands = [];
    }
}

async function loadProductData() {
    try {
        productManagementData.products = await ipcRenderer.invoke('get-products');
        productManagementData.filteredProducts = [...productManagementData.products];
        applyFilters();
    } catch (error) {
        console.error('Ürünler yüklenirken hata:', error);
        productManagementData.products = [];
        productManagementData.filteredProducts = [];
    }
}

// Filtreleme ve sıralama
function applyFilters() {
    let filtered = [...productManagementData.products];
    
    // Arama filtresi
    if (productManagementData.searchTerm) {
        const searchLower = productManagementData.searchTerm.toLowerCase();
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(searchLower) ||
            product.code?.toLowerCase().includes(searchLower) ||
            product.barcode?.toLowerCase().includes(searchLower) ||
            product.category_name?.toLowerCase().includes(searchLower) ||
            product.brand_name?.toLowerCase().includes(searchLower)
        );
    }
    
    // Kategori filtresi
    if (productManagementData.selectedCategory) {
        filtered = filtered.filter(product => 
            product.category_name === productManagementData.selectedCategory
        );
    }
    
    // Marka filtresi
    if (productManagementData.selectedBrand) {
        filtered = filtered.filter(product => 
            product.brand_name === productManagementData.selectedBrand
        );
    }
    
    // Sıralama
    filtered.sort((a, b) => {
        let aVal = a[productManagementData.sortBy] || '';
        let bVal = b[productManagementData.sortBy] || '';
        
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (productManagementData.sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
    
    productManagementData.filteredProducts = filtered;
}

// Profesyonel tablo oluşturma
function createProductTable() {
    if (productManagementData.filteredProducts.length === 0) {
        return `
            <div style="text-align: center; padding: 60px 20px; color: #64748b;">
                <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
                <h3 style="margin: 0 0 8px 0; color: #374151;">Henüz ürün bulunmuyor</h3>
                <p style="margin: 0; font-size: 14px;">Yeni ürün eklemek için yukarıdaki "Yeni Ürün" butonuna tıklayın</p>
            </div>
        `;
    }
    
    return `
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <!-- Tablo Header -->
            <div style="background: #f8fafc; padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <input type="checkbox" id="select-all-products" onchange="toggleSelectAllProducts()" 
                               style="width: 16px; height: 16px; cursor: pointer;">
                        <span style="font-weight: 600; color: #374151;">Tümünü Seç</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 14px; color: #64748b;">
                            ${productManagementData.selectedProducts.size} / ${productManagementData.filteredProducts.length} seçili
                        </span>
                        ${productManagementData.selectedProducts.size > 0 ? `
                            <button onclick="bulkDeleteProducts()" 
                                    style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">
                                🗑️ Seçilenleri Sil
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Tablo -->
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; width: 40px;">
                                <input type="checkbox" id="header-checkbox" style="width: 16px; height: 16px;">
                            </th>
                            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; cursor: pointer;" 
                                onclick="sortProducts('name')">
                                Ürün Adı ${getSortIcon('name')}
                            </th>
                            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; cursor: pointer;" 
                                onclick="sortProducts('code')">
                                Kod ${getSortIcon('code')}
                            </th>
                            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151;">
                                Kategori
                            </th>
                            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151;">
                                Marka
                            </th>
                            <th style="padding: 12px 16px; text-align: right; font-weight: 600; color: #374151; cursor: pointer;" 
                                onclick="sortProducts('stock')">
                                Stok ${getSortIcon('stock')}
                            </th>
                            <th style="padding: 12px 16px; text-align: right; font-weight: 600; color: #374151; cursor: pointer;" 
                                onclick="sortProducts('sale_price')">
                                Satış Fiyatı ${getSortIcon('sale_price')}
                            </th>
                            <th style="padding: 12px 16px; text-align: center; font-weight: 600; color: #374151;">
                                Durum
                            </th>
                            <th style="padding: 12px 16px; text-align: center; font-weight: 600; color: #374151;">
                                İşlemler
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productManagementData.filteredProducts.map(product => createProductRow(product)).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Ürün satırı oluşturma
function createProductRow(product) {
    const isSelected = productManagementData.selectedProducts.has(product.id);
    const stockStatus = getStockStatus(product.stock, product.min_stock);
    const profitMargin = product.sale_price > 0 && product.purchase_price > 0 
        ? ((product.sale_price - product.purchase_price) / product.sale_price * 100).toFixed(1)
        : 0;
    
    return `
        <tr style="border-bottom: 1px solid #f1f5f9; ${isSelected ? 'background: #f0f9ff;' : ''}" 
            onmouseover="this.style.background='#f8fafc'" 
            onmouseout="this.style.background='${isSelected ? '#f0f9ff' : 'transparent'}'">
            <td style="padding: 12px 16px;">
                <input type="checkbox" ${isSelected ? 'checked' : ''} 
                       onchange="toggleProductSelection(${product.id})"
                       style="width: 16px; height: 16px; cursor: pointer;">
            </td>
            <td style="padding: 12px 16px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 40px; height: 40px; background: ${product.category_color || '#e2e8f0'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                        ${product.category_icon || '📦'}
                    </div>
                    <div>
                        <div style="font-weight: 600; color: #1e293b; margin-bottom: 2px;">${product.name}</div>
                        ${product.description ? `<div style="font-size: 12px; color: #64748b;">${product.description}</div>` : ''}
                    </div>
                </div>
            </td>
            <td style="padding: 12px 16px; font-family: monospace; color: #64748b;">
                ${product.code || '-'}
            </td>
            <td style="padding: 12px 16px;">
                ${product.category_name ? `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: ${product.category_color || '#e2e8f0'}; color: white; border-radius: 6px; font-size: 12px; font-weight: 500;">
                            ${product.category_icon || '📦'} ${product.category_name}
                        </span>
                        <div style="display: flex; gap: 2px;">
                            <button onclick="editCategory(${product.category_id})" 
                                    style="padding: 2px 4px; background: #3b82f6; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;"
                                    title="Kategoriyi Düzenle">
                                ✏️
                            </button>
                            ${window.currentUser && window.currentUser.role === 'admin' ? 
                                '<button onclick="deleteCategory(' + product.category_id + ')" style="padding: 2px 4px; background: #ef4444; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;" title="Kategoriyi Sil">🗑️</button>' : 
                                ''
                            }
                        </div>
                    </div>
                ` : '<span style="color: #94a3b8;">-</span>'}
            </td>
            <td style="padding: 12px 16px;">
                ${product.brand_name ? `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: #f1f5f9; color: #374151; border-radius: 6px; font-size: 12px; font-weight: 500;">
                            ${product.brand_logo || '🏷️'} ${product.brand_name}
                        </span>
                        <div style="display: flex; gap: 2px;">
                            <button onclick="editBrand(${product.brand_id})" 
                                    style="padding: 2px 4px; background: #8b5cf6; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;"
                                    title="Markayı Düzenle">
                                ✏️
                            </button>
                            ${window.currentUser && window.currentUser.role === 'admin' ? 
                                '<button onclick="deleteBrand(' + product.brand_id + ')" style="padding: 2px 4px; background: #ef4444; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;" title="Markayı Sil">🗑️</button>' : 
                                ''
                            }
                        </div>
                    </div>
                ` : '<span style="color: #94a3b8;">-</span>'}
            </td>
            <td style="padding: 12px 16px; text-align: right;">
                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                    <span style="font-weight: 600; color: ${stockStatus.color};">${product.stock} ${product.unit}</span>
                    ${stockStatus.warning ? `<span style="font-size: 12px; color: #f59e0b;">⚠️</span>` : ''}
                </div>
                ${product.min_stock > 0 ? `<div style="font-size: 11px; color: #64748b;">Min: ${product.min_stock}</div>` : ''}
            </td>
            <td style="padding: 12px 16px; text-align: right;">
                <div style="font-weight: 600; color: #059669;">${formatMoney(product.sale_price)}</div>
                ${product.purchase_price > 0 ? `
                    <div style="font-size: 11px; color: #64748b;">Alış: ${formatMoney(product.purchase_price)}</div>
                    <div style="font-size: 11px; color: #10b981;">Kar: %${profitMargin}</div>
                ` : ''}
            </td>
            <td style="padding: 12px 16px; text-align: center;">
                <span style="padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 500; color: white; background: ${product.is_active ? '#10b981' : '#ef4444'};">
                    ${product.is_active ? 'Aktif' : 'Pasif'}
                </span>
            </td>
            <td style="padding: 12px 16px; text-align: center;">
                <div style="display: flex; gap: 4px; justify-content: center;">
                    <button onclick="editProduct(${product.id})" 
                            style="padding: 6px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;"
                            title="Düzenle">
                        ✏️
                    </button>
                    ${window.currentUser && window.currentUser.role === 'admin' ? 
                        '<button onclick="deleteProduct(' + product.id + ')" style="padding: 6px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;" title="Sil">🗑️</button>' : 
                        ''
                    }
                </div>
            </td>
        </tr>
    `;
}

// Yardımcı fonksiyonlar
function getStockStatus(stock, minStock) {
    if (stock <= 0) {
        return { status: 'Tükendi', color: '#ef4444', warning: true };
    } else if (minStock > 0 && stock <= minStock) {
        return { status: 'Azaldı', color: '#f59e0b', warning: true };
    } else {
        return { status: 'Mevcut', color: '#10b981', warning: false };
    }
}

function formatMoney(amount) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(amount);
}

function getSortIcon(column) {
    if (productManagementData.sortBy !== column) return '↕️';
    return productManagementData.sortOrder === 'asc' ? '↑' : '↓';
}

// Sıralama fonksiyonu
function sortProducts(column) {
    if (productManagementData.sortBy === column) {
        productManagementData.sortOrder = productManagementData.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        productManagementData.sortBy = column;
        productManagementData.sortOrder = 'asc';
    }
    applyFilters();
    updateProductDisplay();
}

// Ürün seçimi
function toggleProductSelection(productId) {
    if (productManagementData.selectedProducts.has(productId)) {
        productManagementData.selectedProducts.delete(productId);
    } else {
        productManagementData.selectedProducts.add(productId);
    }
    updateProductDisplay();
}

function toggleSelectAllProducts() {
    const selectAllCheckbox = document.getElementById('select-all-products');
    const headerCheckbox = document.getElementById('header-checkbox');
    
    if (selectAllCheckbox.checked) {
        productManagementData.filteredProducts.forEach(product => {
            productManagementData.selectedProducts.add(product.id);
        });
    } else {
        productManagementData.selectedProducts.clear();
    }
    
    if (headerCheckbox) headerCheckbox.checked = selectAllCheckbox.checked;
    updateProductDisplay();
}

// Toplu silme
async function bulkDeleteProducts() {
    if (productManagementData.selectedProducts.size === 0) return;
    
    const confirmed = confirm(`${productManagementData.selectedProducts.size} ürünü silmek istediğinizden emin misiniz?`);
    if (!confirmed) return;
    
    try {
        for (const productId of productManagementData.selectedProducts) {
            await ipcRenderer.invoke('delete-product', productId);
        }
        productManagementData.selectedProducts.clear();
        await loadProductData();
        updateProductDisplay();
        showNotification('Seçilen ürünler başarıyla silindi', 'success');
    } catch (error) {
        console.error('Toplu silme hatası:', error);
        showNotification('Ürünler silinirken hata oluştu', 'error');
    }
}

// Filtreleme fonksiyonları
function filterProductData() {
    const searchInput = document.getElementById('product-search-input');
    const categoryFilter = document.getElementById('product-category-filter');
    const brandFilter = document.getElementById('product-brand-filter');
    
    productManagementData.searchTerm = searchInput ? searchInput.value : '';
    productManagementData.selectedCategory = categoryFilter ? categoryFilter.value : '';
    productManagementData.selectedBrand = brandFilter ? brandFilter.value : '';
    
    applyFilters();
    updateProductDisplay();
}

// Ana ürün yönetimi modalı
async function showProductManagementNew() {
    try {
        await Promise.all([
            loadProductCategories(),
            loadProductBrands(),
            loadProductData()
        ]);
        
        // Mevcut modal'ı kaldır
        const existingModal = document.getElementById('product-management-new-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Modal HTML'ini oluştur ve ekle
        const modalHtml = `
            <div id="product-management-new-modal" class="modal active" onclick="if(event.target.id === 'product-management-new-modal') closeProductManagementModal()" style="z-index: 10000;">
                <div class="modal-content" style="max-width: 1600px; max-height: 95vh; overflow-y: auto; background: #ffffff; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);" onclick="event.stopPropagation()">
                    
                    <!-- Header -->
                    <div style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9; background: #ffffff;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #1e293b; letter-spacing: -0.025em;">📦 Ürün Yönetimi</h2>
                                <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b; font-weight: 400;">
                                    ${productManagementData.products.length} ürün • ${productManagementData.categories.length} kategori • ${productManagementData.brands.length} marka
                                </p>
                            </div>
                            <button onclick="closeProductManagementModal()" 
                                    style="background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; padding: 8px; border-radius: 8px; font-size: 16px; cursor: pointer; transition: all 0.2s; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;"
                                    onmouseover="this.style.background='#f1f5f9'; this.style.borderColor='#cbd5e1'"
                                    onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#e2e8f0'">
                                ×
                            </button>
                        </div>
                    </div>
                    
                    <!-- Action Bar -->
                    <div style="padding: 20px 32px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 16px;">
                            <button onclick="showAddProductModal()" 
                                    style="background: #3b82f6; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;"
                                    onmouseover="this.style.background='#2563eb'"
                                    onmouseout="this.style.background='#3b82f6'">
                                <span>+</span> Yeni Ürün
                            </button>
                            <button onclick="showQuickAddCategory()" 
                                    style="background: #10b981; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;"
                                    onmouseover="this.style.background='#059669'"
                                    onmouseout="this.style.background='#10b981'">
                                <span>🏷️</span> Kategori Ekle
                            </button>
                            <button onclick="showQuickAddBrand()" 
                                    style="background: #8b5cf6; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;"
                                    onmouseover="this.style.background='#7c3aed'"
                                    onmouseout="this.style.background='#8b5cf6'">
                                <span>🏢</span> Marka Ekle
                            </button>
                        </div>
                        
                        <!-- Filtreler -->
                        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 12px; align-items: end;">
                            <div>
                                <label style="display: block; margin-bottom: 4px; font-size: 12px; font-weight: 600; color: #374151;">Arama</label>
                                <input type="text" id="product-search-input" placeholder="Ürün adı, kodu, barkod..." 
                                       style="width: 100%; padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white;"
                                       onkeyup="filterProductData()">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 4px; font-size: 12px; font-weight: 600; color: #374151;">Kategori</label>
                                <select id="product-category-filter" style="width: 100%; padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white;" onchange="filterProductData()">
                                    <option value="">Tüm Kategoriler</option>
                                    ${productManagementData.categories.map(cat => `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 4px; font-size: 12px; font-weight: 600; color: #374151;">Marka</label>
                                <select id="product-brand-filter" style="width: 100%; padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white;" onchange="filterProductData()">
                                    <option value="">Tüm Markalar</option>
                                    ${productManagementData.brands.map(brand => `<option value="${brand.name}">${brand.logo} ${brand.name}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <button onclick="resetFilters()" 
                                        style="padding: 10px 16px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;">
                                    🔄 Temizle
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Products Table -->
                    <div style="padding: 24px 32px;">
                        <div id="products-table-container">
                            ${createProductTable()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
    } catch (error) {
        console.error('Ürün yönetimi açılırken hata:', error);
        showNotification('Ürün yönetimi açılırken hata oluştu', 'error');
    }
}

// Filtreleri sıfırla
function resetFilters() {
    productManagementData.searchTerm = '';
    productManagementData.selectedCategory = '';
    productManagementData.selectedBrand = '';
    
    const searchInput = document.getElementById('product-search-input');
    const categoryFilter = document.getElementById('product-category-filter');
    const brandFilter = document.getElementById('product-brand-filter');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (brandFilter) brandFilter.value = '';
    
    applyFilters();
    updateProductDisplay();
}

// Tablo güncelleme
function updateProductDisplay() {
    const container = document.getElementById('products-table-container');
    if (container) {
        container.innerHTML = createProductTable();
    }
}

// Modal kapatma
function closeProductManagementModal() {
    const modal = document.getElementById('product-management-new-modal');
    if (modal) {
        modal.remove();
    }
}

// Ürün silme
async function deleteProduct(productId) {
    // Admin kontrolü
    if (!window.currentUser || window.currentUser.role !== 'admin') {
        showNotification('Bu işlem için admin yetkisi gereklidir', 'error');
        return;
    }
    
    const confirmed = confirm('Bu ürünü silmek istediğinizden emin misiniz?');
    if (!confirmed) return;
    
    try {
        await ipcRenderer.invoke('delete-product', productId);
        await loadProductData();
        updateProductDisplay();
        
        // Satış ekranındaki ürün seçimini güncelle (silinen ürünü kaldır)
        if (typeof updateSaleProductSelectAfterDelete === 'function') {
            updateSaleProductSelectAfterDelete(productId);
        }
        
        showNotification('Ürün başarıyla silindi', 'success');
    } catch (error) {
        console.error('Ürün silme hatası:', error);
        showNotification('Ürün silinirken hata oluştu', 'error');
    }
}

// Ürün düzenleme
function editProduct(productId) {
    const product = productManagementData.products.find(p => p.id === productId);
    if (product) {
        showEditProductModal(product);
    }
}

// Ürün düzenleme modal'ı
function showEditProductModal(product) {
    // Basit bir alert ile placeholder
    alert(`Ürün düzenleme özelliği henüz tamamlanmadı.\n\nÜrün: ${product.name}\nKategori: ${product.category_name || 'Yok'}\nMarka: ${product.brand_name || 'Yok'}`);
}

// Hızlı kategori ekleme
window.showQuickAddCategory = function() {
    const modalHtml = `
        <div id="quick-add-category-modal" class="modal active" onclick="if(event.target.id === 'quick-add-category-modal') closeModal('quick-add-category-modal')">
            <div class="modal-content" style="max-width: 500px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>🏷️ Hızlı Kategori Ekle</h2>
                    <button class="close-btn" onclick="closeModal('quick-add-category-modal')">&times;</button>
                </div>
                
                <div style="padding: 20px;">
                    <form id="quick-add-category-form" onsubmit="handleQuickAddCategory(event)">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Kategori Adı *</label>
                            <input type="text" id="quick-category-name" name="name" required
                                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">İkon</label>
                                <select id="quick-category-icon" name="icon" style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                    <option value="📦">📦 Genel</option>
                                    <option value="📱">📱 Elektronik</option>
                                    <option value="👕">👕 Giyim</option>
                                    <option value="🍎">🍎 Gıda</option>
                                    <option value="🏠">🏠 Ev & Yaşam</option>
                                    <option value="⚽">⚽ Spor</option>
                                    <option value="📚">📚 Kitap</option>
                                    <option value="💊">💊 Sağlık</option>
                                    <option value="🚗">🚗 Otomotiv</option>
                                    <option value="🎮">🎮 Oyun</option>
                                </select>
                            </div>
                            
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Renk</label>
                                <input type="color" id="quick-category-color" name="color" value="#667eea"
                                       style="width: 100%; height: 45px; border: 2px solid #e5e7eb; border-radius: 8px;">
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 15px; justify-content: flex-end;">
                            <button type="button" onclick="closeModal('quick-add-category-modal')" 
                                    style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                ❌ İptal
                            </button>
                            <button type="submit" 
                                    style="padding: 12px 24px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                💾 Kaydet
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    showOrCreateModal('quick-add-category-modal', modalHtml);
}

// Hızlı kategori ekleme işlemi
async function handleQuickAddCategory(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const categoryData = {
        name: formData.get('name'),
        icon: formData.get('icon'),
        color: formData.get('color')
    };
    
    try {
        await ipcRenderer.invoke('add-category', categoryData);
        
        showNotification('Kategori başarıyla eklendi', 'success');
        closeModal('quick-add-category-modal');
        
        // Kategorileri yeniden yükle
        await loadProductCategories();
        
        // Ürün yönetimi modal'ını yenile - sadece içeriği güncelle
        setTimeout(async () => {
            await loadProductCategories();
            await loadProductBrands();
            await loadProducts();
            updateProductManagementDisplay();
        }, 500);
        
    } catch (error) {
        console.error('Quick add category error:', error);
        showNotification('Kategori eklenirken hata oluştu', 'error');
    }
}

// Hızlı marka ekleme
window.showQuickAddBrand = function() {
    const modalHtml = `
        <div id="quick-add-brand-modal" class="modal active" onclick="if(event.target.id === 'quick-add-brand-modal') closeModal('quick-add-brand-modal')">
            <div class="modal-content" style="max-width: 500px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>🏢 Hızlı Marka Ekle</h2>
                    <button class="close-btn" onclick="closeModal('quick-add-brand-modal')">&times;</button>
                </div>
                
                <div style="padding: 20px;">
                    <form id="quick-add-brand-form" onsubmit="handleQuickAddBrand(event)">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Marka Adı *</label>
                            <input type="text" id="quick-brand-name" name="name" required
                                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Logo</label>
                            <input type="text" id="quick-brand-logo" name="logo" placeholder="🏷️"
                                   style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                        </div>
                        
                        <div style="display: flex; gap: 15px; justify-content: flex-end;">
                            <button type="button" onclick="closeModal('quick-add-brand-modal')" 
                                    style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                ❌ İptal
                            </button>
                            <button type="submit" 
                                    style="padding: 12px 24px; background: #8b5cf6; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                💾 Kaydet
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    showOrCreateModal('quick-add-brand-modal', modalHtml);
}

// Hızlı marka ekleme işlemi
async function handleQuickAddBrand(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const brandData = {
        name: formData.get('name'),
        logo: formData.get('logo') || '🏷️'
    };
    
    try {
        await ipcRenderer.invoke('add-brand', brandData);
        
        showNotification('Marka başarıyla eklendi', 'success');
        closeModal('quick-add-brand-modal');
        
        // Markaları yeniden yükle
        await loadProductBrands();
        
        // Ürün yönetimi modal'ını yenile - sadece içeriği güncelle
        setTimeout(async () => {
            await loadProductCategories();
            await loadProductBrands();
            await loadProducts();
            updateProductManagementDisplay();
        }, 500);
        
    } catch (error) {
        console.error('Quick add brand error:', error);
        showNotification('Marka eklenirken hata oluştu', 'error');
    }
}

// Kategori düzenleme
window.editCategory = async function(categoryId) {
    try {
        const category = productManagementData.categories.find(c => c.id === categoryId);
        if (!category) {
            showNotification('Kategori bulunamadı', 'error');
            return;
        }
        
        const modalHtml = `
            <div id="edit-category-modal" class="modal active" onclick="if(event.target.id === 'edit-category-modal') closeModal('edit-category-modal')">
                <div class="modal-content" style="max-width: 600px;" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>✏️ Kategori Düzenle</h2>
                        <button class="close-btn" onclick="closeModal('edit-category-modal')">&times;</button>
                    </div>
                    
                    <div style="padding: 20px;">
                        <form id="edit-category-form" onsubmit="handleEditCategory(event, ${categoryId})">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Kategori Adı *</label>
                                    <input type="text" id="edit-category-name" name="name" value="${category.name}" required
                                           style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                </div>
                                
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">İkon</label>
                                    <select id="edit-category-icon" name="icon" style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                        <option value="📦" ${category.icon === '📦' ? 'selected' : ''}>📦 Genel</option>
                                        <option value="📱" ${category.icon === '📱' ? 'selected' : ''}>📱 Elektronik</option>
                                        <option value="👕" ${category.icon === '👕' ? 'selected' : ''}>👕 Giyim</option>
                                        <option value="🍎" ${category.icon === '🍎' ? 'selected' : ''}>🍎 Gıda</option>
                                        <option value="🏠" ${category.icon === '🏠' ? 'selected' : ''}>🏠 Ev & Yaşam</option>
                                        <option value="⚽" ${category.icon === '⚽' ? 'selected' : ''}>⚽ Spor</option>
                                        <option value="📚" ${category.icon === '📚' ? 'selected' : ''}>📚 Kitap</option>
                                        <option value="💊" ${category.icon === '💊' ? 'selected' : ''}>💊 Sağlık</option>
                                        <option value="🚗" ${category.icon === '🚗' ? 'selected' : ''}>🚗 Otomotiv</option>
                                        <option value="🎮" ${category.icon === '🎮' ? 'selected' : ''}>🎮 Oyun</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Renk</label>
                                    <input type="color" id="edit-category-color" name="color" value="${category.color}"
                                           style="width: 100%; height: 45px; border: 2px solid #e5e7eb; border-radius: 8px;">
                                </div>
                                
                                <div>
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Sıralama</label>
                                    <input type="number" id="edit-category-sort" name="sort_order" value="${category.sort_order || 0}" min="0"
                                           style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Açıklama</label>
                                <textarea id="edit-category-description" name="description" rows="3"
                                          style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; resize: vertical;">${category.description || ''}</textarea>
                            </div>
                            
                            <div style="display: flex; gap: 15px; justify-content: flex-end;">
                                <button type="button" onclick="closeModal('edit-category-modal')" 
                                        style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                    ❌ İptal
                                </button>
                                <button type="submit" 
                                        style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                    💾 Güncelle
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        showOrCreateModal('edit-category-modal', modalHtml);
        
    } catch (error) {
        console.error('Edit category modal error:', error);
        showNotification('Kategori düzenleme modal\'ı açılırken hata oluştu', 'error');
    }
}

// Kategori düzenleme işlemi
async function handleEditCategory(event, categoryId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const categoryData = {
        id: categoryId,
        name: formData.get('name'),
        description: formData.get('description'),
        icon: formData.get('icon'),
        color: formData.get('color'),
        sort_order: parseInt(formData.get('sort_order')) || 0
    };
    
    try {
        await ipcRenderer.invoke('update-category', categoryData);
        
        showNotification('Kategori başarıyla güncellendi', 'success');
        closeModal('edit-category-modal');
        
        // Kategorileri yeniden yükle
        await loadProductCategories();
        
        // Ürün yönetimi modal'ını yenile - sadece içeriği güncelle
        setTimeout(async () => {
            await loadProductCategories();
            await loadProductBrands();
            await loadProducts();
            updateProductManagementDisplay();
        }, 500);
        
    } catch (error) {
        console.error('Update category error:', error);
        showNotification('Kategori güncellenirken hata oluştu', 'error');
    }
}

// Kategori silme
window.deleteCategory = async function(categoryId) {
    // Admin kontrolü
    if (!window.currentUser || window.currentUser.role !== 'admin') {
        showNotification('Bu işlem için admin yetkisi gereklidir', 'error');
        return;
    }
    
    const category = productManagementData.categories.find(c => c.id === categoryId);
    if (!category) {
        showNotification('Kategori bulunamadı', 'error');
        return;
    }
    
    const productCount = productManagementData.products.filter(p => p.category_id === categoryId).length;
    
    if (productCount > 0) {
        showNotification(`Bu kategoride ${productCount} ürün bulunuyor. Önce ürünleri başka kategoriye taşıyın.`, 'warning');
        return;
    }
    
    if (confirm(`"${category.name}" kategorisini silmek istediğinizden emin misiniz?`)) {
        try {
            await ipcRenderer.invoke('delete-category', categoryId);
            
            showNotification('Kategori başarıyla silindi', 'success');
            
            // Kategorileri yeniden yükle
            await loadProductCategories();
            
            // Ürün yönetimi modal'ını yenile - sadece içeriği güncelle
            setTimeout(async () => {
                await loadProductCategories();
                await loadProductBrands();
                await loadProducts();
                updateProductManagementDisplay();
            }, 500);
            
        } catch (error) {
            console.error('Delete category error:', error);
            showNotification('Kategori silinirken hata oluştu', 'error');
        }
    }
}

// Marka düzenleme
window.editBrand = async function(brandId) {
    try {
        const brand = productManagementData.brands.find(b => b.id === brandId);
        if (!brand) {
            showNotification('Marka bulunamadı', 'error');
            return;
        }
        
        const modalHtml = `
            <div id="edit-brand-modal" class="modal active" onclick="if(event.target.id === 'edit-brand-modal') closeModal('edit-brand-modal')">
                <div class="modal-content" style="max-width: 500px;" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>✏️ Marka Düzenle</h2>
                        <button class="close-btn" onclick="closeModal('edit-brand-modal')">&times;</button>
                    </div>
                    
                    <div style="padding: 20px;">
                        <form id="edit-brand-form" onsubmit="handleEditBrand(event, ${brandId})">
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Marka Adı *</label>
                                <input type="text" id="edit-brand-name" name="name" value="${brand.name}" required
                                       style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Logo</label>
                                <input type="text" id="edit-brand-logo" name="logo" value="${brand.logo || '🏷️'}"
                                       style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                            </div>
                            
                            <div style="display: flex; gap: 15px; justify-content: flex-end;">
                                <button type="button" onclick="closeModal('edit-brand-modal')" 
                                        style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                    ❌ İptal
                                </button>
                                <button type="submit" 
                                        style="padding: 12px 24px; background: #8b5cf6; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                    💾 Güncelle
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        showOrCreateModal('edit-brand-modal', modalHtml);
        
    } catch (error) {
        console.error('Edit brand modal error:', error);
        showNotification('Marka düzenleme modal\'ı açılırken hata oluştu', 'error');
    }
}

// Marka düzenleme işlemi
async function handleEditBrand(event, brandId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const brandData = {
        id: brandId,
        name: formData.get('name'),
        logo: formData.get('logo') || '🏷️'
    };
    
    try {
        await ipcRenderer.invoke('update-brand', brandData);
        
        showNotification('Marka başarıyla güncellendi', 'success');
        closeModal('edit-brand-modal');
        
        // Markaları yeniden yükle
        await loadProductBrands();
        
        // Ürün yönetimi modal'ını yenile - sadece içeriği güncelle
        setTimeout(async () => {
            await loadProductCategories();
            await loadProductBrands();
            await loadProducts();
            updateProductManagementDisplay();
        }, 500);
        
    } catch (error) {
        console.error('Update brand error:', error);
        showNotification('Marka güncellenirken hata oluştu', 'error');
    }
}

// Marka silme
window.deleteBrand = async function(brandId) {
    // Admin kontrolü
    if (!window.currentUser || window.currentUser.role !== 'admin') {
        showNotification('Bu işlem için admin yetkisi gereklidir', 'error');
        return;
    }
    
    const brand = productManagementData.brands.find(b => b.id === brandId);
    if (!brand) {
        showNotification('Marka bulunamadı', 'error');
        return;
    }
    
    const productCount = productManagementData.products.filter(p => p.brand_id === brandId).length;
    
    if (productCount > 0) {
        showNotification(`Bu markada ${productCount} ürün bulunuyor. Önce ürünleri başka markaya taşıyın.`, 'warning');
        return;
    }
    
    if (confirm(`"${brand.name}" markasını silmek istediğinizden emin misiniz?`)) {
        try {
            await ipcRenderer.invoke('delete-brand', brandId);
            
            showNotification('Marka başarıyla silindi', 'success');
            
            // Markaları yeniden yükle
            await loadProductBrands();
            
            // Ürün yönetimi modal'ını yenile - sadece içeriği güncelle
            setTimeout(async () => {
                await loadProductCategories();
                await loadProductBrands();
                await loadProducts();
                updateProductManagementDisplay();
            }, 500);
            
        } catch (error) {
            console.error('Delete brand error:', error);
            showNotification('Marka silinirken hata oluştu', 'error');
        }
    }
}

// Ürün yönetimi display güncelleme fonksiyonu
function updateProductManagementDisplay() {
    const productsTableContainer = document.getElementById('products-table-container');
    if (productsTableContainer) {
        productsTableContainer.innerHTML = createProductTable();
    }
    
    // Filtreleri güncelle
    const categoryFilter = document.getElementById('product-category-filter');
    const brandFilter = document.getElementById('product-brand-filter');
    
    if (categoryFilter) {
        const currentValue = categoryFilter.value;
        categoryFilter.innerHTML = '<option value="">Tüm Kategoriler</option>' +
            productManagementData.categories.map(cat => `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`).join('');
        categoryFilter.value = currentValue;
    }
    
    if (brandFilter) {
        const currentValue = brandFilter.value;
        brandFilter.innerHTML = '<option value="">Tüm Markalar</option>' +
            productManagementData.brands.map(brand => `<option value="${brand.name}">${brand.logo} ${brand.name}</option>`).join('');
        brandFilter.value = currentValue;
    }
}

// Modal yardımcı fonksiyonları (showOrCreateModal renderer.js'de tanımlı)

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// Bildirim fonksiyonu
function showNotification(message, type = 'info') {
    // Basit bildirim sistemi
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 99999;
        padding: 12px 20px; border-radius: 8px; color: white;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        font-size: 14px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}