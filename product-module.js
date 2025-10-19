// Modern ve Sade Ürün Yönetimi Modülü
// ipcRenderer, categories, brands, products zaten renderer.js'de tanımlı

// Ana ürün yönetimi modalını göster  
async function showProductManagement() {
    try {
        // Verileri yükle
        await Promise.all([
            loadCategories(),
            loadBrands(),
            loadProducts()
        ]);
        
        // Eski modalı kaldır
        const oldModal = document.getElementById('product-management-modal');
        if (oldModal) oldModal.remove();
        
        // Modern modal oluştur
        const modalHtml = createModernProductModal();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Event listener'ları ekle
        setupProductEventListeners();
        
        // ESC tuşu ile kapatma
        document.addEventListener('keydown', handleProductModalKeydown);
        
    } catch (error) {
        console.error('Ürün yönetimi açılırken hata:', error);
        showNotification('Ürün yönetimi açılırken hata oluştu', 'error');
    }
}

// Verileri yükle
async function loadCategories() {
    try {
        categories = await ipcRenderer.invoke('get-categories');
    } catch (error) {
        console.error('Kategoriler yüklenemedi:', error);
        categories = [];
    }
}

async function loadBrands() {
    try {
        brands = await ipcRenderer.invoke('get-brands');
    } catch (error) {
        console.error('Markalar yüklenemedi:', error);
        brands = [];
    }
}

async function loadProducts() {
    try {
        products = await ipcRenderer.invoke('get-products');
    } catch (error) {
        console.error('Ürünler yüklenemedi:', error);
        products = [];
    }
}

// Modern modal HTML'i oluştur
function createModernProductModal() {
    return `
        <div id="product-management-modal" class="modal active" style="z-index: 9997;">
            <div class="modal-content" style="max-width: 95%; max-height: 95vh; border-radius: 16px; overflow: hidden;">
                
                <!-- Gradient Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="margin: 0; font-size: 28px; font-weight: 700;">Ürün Yönetimi</h2>
                            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.95;">
                                ${products.length} Ürün · ${categories.length} Kategori · ${brands.length} Marka
                            </p>
                        </div>
                        <button onclick="event.stopPropagation(); closeProductModal('product-management-modal')" 
                                style="background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 24px; transition: all 0.3s; z-index: 1001; position: relative;"
                                onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                                onmouseout="this.style.background='rgba(255,255,255,0.2)'"
                                title="Kapat">
                            ×
                        </button>
                    </div>
                </div>
                
                <!-- Content Area -->
                <div style="padding: 24px; background: #f9fafb; height: calc(95vh - 100px); overflow-y: auto;">
                    
                    <!-- Quick Action Cards -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
                        <div onclick="showProductModal()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                            <div style="font-size: 32px; margin-bottom: 12px;">+</div>
                            <div style="color: white; font-weight: 600; font-size: 16px;">Yeni Ürün Ekle</div>
                        </div>
                        
                        <div onclick="showCategoriesModal()" style="background: white; border: 2px solid #e5e7eb; padding: 20px; border-radius: 12px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#667eea'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.1)'" onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
                            <div style="font-size: 32px; margin-bottom: 12px;">📁</div>
                            <div style="font-weight: 600; font-size: 16px; color: #374151; margin-bottom: 4px;">Kategoriler</div>
                            <div style="font-size: 13px; color: #9ca3af;">${categories.length} kategori</div>
                        </div>
                        
                        <div onclick="showBrandsModal()" style="background: white; border: 2px solid #e5e7eb; padding: 20px; border-radius: 12px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#667eea'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.1)'" onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
                            <div style="font-size: 32px; margin-bottom: 12px;">🏷️</div>
                            <div style="font-weight: 600; font-size: 16px; color: #374151; margin-bottom: 4px;">Markalar</div>
                            <div style="font-size: 13px; color: #9ca3af;">${brands.length} marka</div>
                        </div>
                    </div>
                    
                    <!-- Search & Filter -->
                    <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
                            <input type="text" id="product-search-input" placeholder="🔍 Ürün ara..." 
                                   style="flex: 1; min-width: 250px; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.2s;"
                                   onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'"
                                   onkeyup="filterProductsList()">
                            <select id="category-filter-select" onchange="filterProductsList()" 
                                    style="padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; background: white; cursor: pointer;">
                                <option value="">Tüm Kategoriler</option>
                                ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                            </select>
                            <select id="brand-filter-select" onchange="filterProductsList()" 
                                    style="padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; background: white; cursor: pointer;">
                                <option value="">Tüm Markalar</option>
                                ${brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <!-- Simple Products List -->
                    <div id="products-list-container">
                        ${createSimpleProductsList()}
                    </div>
                    
                </div>
            </div>
        </div>
    `;
}

// Basit ürün listesi
function createSimpleProductsList() {
    console.log('createSimpleProductsList çağrıldı, products array:', products);
    if (!products || products.length === 0) {
        return `
            <div style="text-align: center; padding: 60px 20px; background: white; border-radius: 12px;">
                <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;">📦</div>
                <h3 style="color: #6b7280; margin-bottom: 16px;">Henüz ürün yok</h3>
                <button onclick="showProductModal()" class="btn btn-primary">İlk Ürünü Ekle</button>
            </div>
        `;
    }
    
    return `
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f9fafb;">
                    <tr>
                        <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Ürün Adı</th>
                        <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Kategori</th>
                        <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Marka</th>
                        <th style="padding: 16px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Fiyat</th>
                        <th style="padding: 16px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Stok</th>
                        <th style="padding: 16px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => createSimpleProductRow(product)).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Basit ürün satırı
function createSimpleProductRow(product) {
    const category = categories.find(c => c.id === product.category_id);
    const brand = brands.find(b => b.id === product.brand_id);
    const hasLowStock = product.stock <= (product.min_stock || 0);
    
    return `
        <tr style="border-bottom: 1px solid #f3f4f6; transition: background 0.2s;" 
            onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
            <td style="padding: 16px;">
                <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${product.name}</div>
                <div style="font-size: 12px; color: #9ca3af;">${product.code || 'Kod yok'}</div>
            </td>
            <td style="padding: 16px;">
                ${category ? `<span style="background: #ede9fe; color: #7c3aed; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${category.name}</span>` : '<span style="color: #9ca3af; font-size: 12px;">-</span>'}
            </td>
            <td style="padding: 16px;">
                ${brand ? `<span style="background: #dbeafe; color: #2563eb; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${brand.name}</span>` : '<span style="color: #9ca3af; font-size: 12px;">-</span>'}
            </td>
            <td style="padding: 16px; text-align: right;">
                <div style="font-weight: 700; color: #10b981; font-size: 16px;">₺${(product.sale_price || 0).toFixed(2)}</div>
            </td>
            <td style="padding: 16px; text-align: center;">
                <div style="font-weight: 600; color: ${hasLowStock ? '#dc2626' : '#374151'}; display: flex; align-items: center; justify-content: center; gap: 4px;">
                    ${hasLowStock ? '⚠️' : ''}
                    <span>${product.stock || 0}</span>
                    <span style="font-size: 12px; color: #9ca3af;">${product.unit || 'adet'}</span>
                </div>
            </td>
            <td style="padding: 16px; text-align: center;">
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button onclick="editProduct(${product.id})" 
                            style="background: #f3f4f6; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; color: #374151; transition: background 0.2s;"
                            onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">
                        Düzenle
                    </button>
                    <button onclick="deleteProduct(${product.id})" 
                            style="background: #fef2f2; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; color: #dc2626; transition: background 0.2s;"
                            onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">
                        Sil
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Event listeners
function setupProductEventListeners() {
    // Event listeners zaten HTML'de inline olarak var
}

// ESC tuşu ile modal kapatma
function handleProductModalKeydown(event) {
    if (event.key === 'Escape') {
        // Tüm aktif modal'ları bul
        const allModals = document.querySelectorAll('.modal.active');
        if (allModals.length === 0) return;
        
        // En son eklenen (DOM'da en son olan) modal'ı al
        const lastModal = allModals[allModals.length - 1];
        const modalId = lastModal.id;
        
        console.log(`ESC ile modal kapatılıyor: ${modalId}`);
        
        // Eğer ana ürün yönetimi modalıysa, sadece onu kapat
        if (modalId === 'product-management-modal') {
            closeProductModal(modalId);
            // ESC event listener'ını kaldır
            document.removeEventListener('keydown', handleProductModalKeydown);
        } else {
            // Diğer modalları kapat (kategori, marka, vs.)
            closeProductModal(modalId);
        }
        
        event.preventDefault();
        event.stopPropagation();
    }
}

// Filtreleme
function filterProductsList() {
    const search = (document.getElementById('product-search-input')?.value || '').toLowerCase();
    const categoryId = document.getElementById('category-filter-select')?.value || '';
    const brandId = document.getElementById('brand-filter-select')?.value || '';
    
    // Burada filtreleme yapıp grid'i güncelleyebiliriz
    // Şimdilik basit tutalım
    console.log('Filtering:', { search, categoryId, brandId });
}

// Placeholder fonksiyonlar
function showProductModal() {
    const modalHtml = `
        <div id="add-product-modal" class="modal active" style="z-index: 9999;">
            <div class="modal-content" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px 12px 0 0; color: white;">
                    <h3 style="margin: 0; font-size: 20px; font-weight: 600;">Yeni Ürün Ekle</h3>
                </div>
                
                <form id="new-add-product-form" onsubmit="handleAddProduct(event)" style="padding: 24px;">
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
                                    ${categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
                                </select>
                                <button type="button" onclick="showQuickAddCategoryFromProduct()" 
                                        style="padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; transition: all 0.2s;"
                                        onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"
                                        title="Hızlı Kategori Ekle">
                                    +
                                </button>
                            </div>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Marka</label>
                            <div style="display: flex; gap: 8px;">
                                <select id="product-brand" name="brand_id" 
                                        style="flex: 1; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; background: white;">
                                    <option value="">Marka Seçin</option>
                                    ${brands.map(brand => `<option value="${brand.id}">${brand.name}</option>`).join('')}
                                </select>
                                <button type="button" onclick="showQuickAddBrandFromProduct()" 
                                        style="padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; transition: all 0.2s;"
                                        onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"
                                        title="Hızlı Marka Ekle">
                                    +
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

async function handleAddProduct(event) {
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
        showNotification('Ürün adı zorunludur', 'error');
        return;
    }
    
    if (productData.sale_price <= 0) {
        showNotification('Satış fiyatı 0\'dan büyük olmalıdır', 'error');
        return;
    }
    
    try {
        const newProduct = await ipcRenderer.invoke('add-product', productData);
        products.push(newProduct);
        
        // Form'u reset et
        event.target.reset();
        
        showNotification('Ürün başarıyla eklendi', 'success');
        
        // Modal'ı kapat
        setTimeout(() => {
            closeProductModal('add-product-modal');
        }, 100);
        
        // Ürün listesini güncelle
        const container = document.getElementById('products-list-container');
        if (container) {
            container.innerHTML = createSimpleProductsList();
        }
        
        // Ana modal'daki sayıları güncelle
        const header = document.querySelector('#product-management-modal h2');
        if (header) {
            const countP = header.nextElementSibling;
            if (countP) {
                countP.textContent = `${products.length} Ürün · ${categories.length} Kategori · ${brands.length} Marka`;
            }
        }
        
        // Satış ekranındaki ürün seçimini güncelle
        updateSaleProductSelect(newProduct);
        
    } catch (error) {
        console.error('Ürün eklenirken hata:', error);
        showNotification('Ürün eklenirken hata oluştu', 'error');
    }
}

function showCategoriesModal() {
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
                                ${categories.map(cat => `
                                    <tr style="border-bottom: 1px solid #f3f4f6;">
                                        <td style="padding: 12px; font-weight: 500;">${cat.name}</td>
                                        <td style="padding: 12px; text-align: center;">
                                            <button onclick="editCategory(${cat.id})" style="background: #f3f4f6; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 8px;">Düzenle</button>
                                            <button onclick="deleteCategory(${cat.id})" style="background: #fef2f2; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; color: #dc2626;">Sil</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        ${categories.length === 0 ? '<div style="text-align: center; padding: 40px; color: #9ca3af;">Henüz kategori eklenmemiş</div>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function showBrandsModal() {
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
                                            <button onclick="deleteBrand(${brand.id})" style="background: #fef2f2; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; color: #dc2626;">Sil</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        ${brands.length === 0 ? '<div style="text-align: center; padding: 40px; color: #9ca3af;">Henüz marka eklenmemiş</div>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) {
        showNotification('Ürün bulunamadı', 'error');
        return;
    }
    
    const modalHtml = `
        <div id="edit-product-modal" class="modal active" style="z-index: 9999;">
            <div class="modal-content" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px 12px 0 0; color: white;">
                    <h3 style="margin: 0; font-size: 20px; font-weight: 600;">Ürün Düzenle</h3>
                </div>
                
                <form id="edit-product-form" onsubmit="handleEditProduct(event, ${id})" style="padding: 24px;">
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
                            <select id="edit-product-category" name="category_id" 
                                    style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; background: white;">
                                <option value="">Kategori Seçin</option>
                                ${categories.map(cat => `<option value="${cat.id}" ${product.category_id === cat.id ? 'selected' : ''}>${cat.name}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Marka</label>
                            <select id="edit-product-brand" name="brand_id" 
                                    style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none; background: white;">
                                <option value="">Marka Seçin</option>
                                ${brands.map(brand => `<option value="${brand.id}" ${product.brand_id === brand.id ? 'selected' : ''}>${brand.name}</option>`).join('')}
                            </select>
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

async function handleEditProduct(event, id) {
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
        showNotification('Ürün adı zorunludur', 'error');
        return;
    }
    
    if (productData.sale_price <= 0) {
        showNotification('Satış fiyatı 0\'dan büyük olmalıdır', 'error');
        return;
    }
    
    try {
        await ipcRenderer.invoke('update-product', { id, ...productData });
        
        // Veritabanından taze veri çek
        await loadProducts();
        
        showNotification('Ürün başarıyla güncellendi', 'success');
        
        // Modal'ı kapat
        setTimeout(() => {
            closeProductModal('edit-product-modal');
        }, 100);
        
        // Ürün listesini güncelle
        const container = document.getElementById('products-list-container');
        if (container) {
            console.log('Ürün listesi güncelleniyor, toplam ürün sayısı:', products.length);
            container.innerHTML = createSimpleProductsList();
        }
        
    } catch (error) {
        console.error('Ürün güncellenirken hata:', error);
        showNotification('Ürün güncellenirken hata oluştu', 'error');
    }
}

async function deleteProduct(id) {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    
    try {
        await ipcRenderer.invoke('delete-product', id);
        await loadProducts();
        
        // Sadece ürün listesini güncelle - modal açmadan
        const container = document.getElementById('products-list-container');
        if (container) {
            container.innerHTML = createSimpleProductsList();
        }
        
        showNotification('Ürün başarıyla silindi', 'success');
    } catch (error) {
        console.error('Ürün silinemedi:', error);
        showNotification('Ürün silinemedi', 'error');
    }
}

// Kategori işlemleri
function showAddCategoryModal() {
    const modalHtml = `
        <div id="add-category-modal" class="modal active" style="z-index: 9999;">
            <div class="modal-content" style="max-width: 400px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px; border-radius: 12px 12px 0 0; color: white;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Yeni Kategori</h3>
                </div>
                
                <form id="category-form" onsubmit="handleAddCategory(event)" style="padding: 20px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Kategori Adı *</label>
                        <input type="text" id="category-name" name="name" required 
                               style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                               onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button type="button" onclick="event.stopPropagation(); closeProductModal('add-category-modal')" 
                                style="padding: 12px 24px; background: #f3f4f6; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            İptal
                        </button>
                        <button type="submit" 
                                style="padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('category-name').focus();
}

async function handleAddCategory(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const categoryData = {
        name: formData.get('name').trim(),
        icon: '📦',
        color: '#667eea'
    };
    
    if (!categoryData.name) {
        showNotification('Kategori adı zorunludur', 'error');
        return;
    }
    
    try {
        await ipcRenderer.invoke('add-category', categoryData);
        await loadCategories();
        
        closeProductModal('add-category-modal');
        showNotification('Kategori başarıyla eklendi', 'success');
        
        // Kategori modalını yenile
        closeProductModal('categories-modal');
        showCategoriesModal();
        
    } catch (error) {
        console.error('Kategori eklenirken hata:', error);
        showNotification('Kategori eklenirken hata oluştu', 'error');
    }
}

async function deleteCategory(id) {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    // Kategoriye ait ürün var mı kontrol et
    const productsInCategory = products.filter(p => p.category_id === id);
    if (productsInCategory.length > 0) {
        showNotification(`Bu kategoride ${productsInCategory.length} ürün var. Önce ürünleri başka kategoriye taşıyın.`, 'warning');
        return;
    }
    
    if (!confirm(`"${category.name}" kategorisini silmek istediğinizden emin misiniz?`)) {
        return;
    }
    
    try {
        await ipcRenderer.invoke('delete-category', id);
        await loadCategories();
        
        // Kategori listesini yenile - modal'ı kapatmadan
        const categoriesModal = document.getElementById('categories-modal');
        if (categoriesModal) {
            categoriesModal.remove();
            showCategoriesModal();
        }
        
        showNotification('Kategori başarıyla silindi', 'success');
    } catch (error) {
        console.error('Kategori silinirken hata:', error);
        showNotification('Kategori silinirken hata oluştu', 'error');
    }
}

function editCategory(id) {
    showNotification('Kategori düzenleme özelliği yakında eklenecek', 'info');
}

// Marka işlemleri
function showAddBrandModal() {
    const modalHtml = `
        <div id="add-brand-modal" class="modal active" style="z-index: 9999;">
            <div class="modal-content" style="max-width: 400px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px; border-radius: 12px 12px 0 0; color: white;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Yeni Marka</h3>
                </div>
                
                <form id="brand-form" onsubmit="handleAddBrand(event)" style="padding: 20px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Marka Adı *</label>
                        <input type="text" id="brand-name" name="name" required 
                               style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                               onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button type="button" onclick="closeProductModal('add-brand-modal')" 
                                style="padding: 12px 24px; background: #f3f4f6; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            İptal
                        </button>
                        <button type="submit" 
                                style="padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('brand-name').focus();
}

async function handleAddBrand(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const brandData = {
        name: formData.get('name').trim(),
        icon: '🏷️',
        color: '#667eea'
    };
    
    if (!brandData.name) {
        showNotification('Marka adı zorunludur', 'error');
        return;
    }
    
    try {
        await ipcRenderer.invoke('add-brand', brandData);
        await loadBrands();
        
        closeProductModal('add-brand-modal');
        showNotification('Marka başarıyla eklendi', 'success');
        
        // Marka modalını yenile
        closeProductModal('brands-modal');
        showBrandsModal();
        
    } catch (error) {
        console.error('Marka eklenirken hata:', error);
        showNotification('Marka eklenirken hata oluştu', 'error');
    }
}

async function deleteBrand(id) {
    const brand = brands.find(b => b.id === id);
    if (!brand) return;
    
    // Markaya ait ürün var mı kontrol et
    const productsInBrand = products.filter(p => p.brand_id === id);
    if (productsInBrand.length > 0) {
        showNotification(`Bu markada ${productsInBrand.length} ürün var. Önce ürünleri başka markaya taşıyın.`, 'warning');
        return;
    }
    
    if (!confirm(`"${brand.name}" markasını silmek istediğinizden emin misiniz?`)) {
        return;
    }
    
    try {
        await ipcRenderer.invoke('delete-brand', id);
        await loadBrands();
        
        // Marka listesini yenile - modal'ı kapatmadan
        const brandsModal = document.getElementById('brands-modal');
        if (brandsModal) {
            brandsModal.remove();
            showBrandsModal();
        }
        
        showNotification('Marka başarıyla silindi', 'success');
    } catch (error) {
        console.error('Marka silinirken hata:', error);
        showNotification('Marka silinirken hata oluştu', 'error');
    }
}

function editBrand(id) {
    const brand = brands.find(b => b.id === id);
    if (!brand) return;
    
    const modalHtml = `
        <div id="edit-brand-modal" class="modal active" style="z-index: 9999;">
            <div class="modal-content" style="max-width: 400px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px; border-radius: 12px 12px 0 0; color: white;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Marka Düzenle</h3>
                </div>
                
                <form id="edit-brand-form" onsubmit="handleEditBrand(event, ${id})" style="padding: 20px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Marka Adı *</label>
                        <input type="text" id="edit-brand-name" name="name" value="${brand.name}" required 
                               style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                               onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button type="button" onclick="closeProductModal('edit-brand-modal')" 
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
    document.getElementById('edit-brand-name').focus();
    document.getElementById('edit-brand-name').select();
}

async function handleEditBrand(event, brandId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const brandData = {
        name: formData.get('name').trim()
    };
    
    if (!brandData.name) {
        showNotification('Marka adı zorunludur', 'error');
        return;
    }
    
    try {
        await ipcRenderer.invoke('update-brand', brandId, brandData);
        await loadBrands();
        
        closeProductModal('edit-brand-modal');
        showNotification('Marka başarıyla güncellendi', 'success');
        
        // Marka modalını yenile
        const brandsModal = document.getElementById('brands-modal');
        if (brandsModal) {
            brandsModal.remove();
            showBrandsModal();
        }
        
    } catch (error) {
        console.error('Marka güncellenirken hata:', error);
        showNotification('Marka güncellenirken hata oluştu', 'error');
    }
}

// Ürün ekleme formundan hızlı kategori ekleme
function showQuickAddCategoryFromProduct() {
    const modalHtml = `
        <div id="quick-add-category-from-product-modal" class="modal active" style="z-index: 1003;">
            <div class="modal-content" style="max-width: 400px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px; border-radius: 12px 12px 0 0; color: white;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Hızlı Kategori Ekle</h3>
                </div>
                
                <form id="quick-category-from-product-form" onsubmit="handleQuickAddCategoryFromProduct(event)" style="padding: 20px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Kategori Adı *</label>
                        <input type="text" id="quick-category-from-product-name" name="name" required 
                               style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                               onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button type="button" onclick="closeProductModal('quick-add-category-from-product-modal')" 
                                style="padding: 12px 24px; background: #f3f4f6; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            İptal
                        </button>
                        <button type="submit" 
                                style="padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Ekle
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('quick-category-from-product-name').focus();
}

async function handleQuickAddCategoryFromProduct(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const categoryData = {
        name: formData.get('name').trim(),
        icon: '📦',
        color: '#667eea'
    };
    
    if (!categoryData.name) {
        showNotification('Kategori adı zorunludur', 'error');
        return;
    }
    
    try {
        const newCategory = await ipcRenderer.invoke('add-category', categoryData);
        categories.push(newCategory);
        
        closeProductModal('quick-add-category-from-product-modal');
        showNotification('Kategori başarıyla eklendi', 'success');
        
        // Kategori dropdown'unu güncelle
        const categorySelect = document.getElementById('product-category');
        if (categorySelect) {
            const newOption = document.createElement('option');
            newOption.value = newCategory.id;
            newOption.textContent = newCategory.name;
            categorySelect.appendChild(newOption);
            categorySelect.value = newCategory.id; // Yeni eklenen kategoriyi seç
        }
        
    } catch (error) {
        console.error('Kategori eklenirken hata:', error);
        showNotification('Kategori eklenirken hata oluştu', 'error');
    }
}

// Ürün ekleme formundan hızlı marka ekleme
function showQuickAddBrandFromProduct() {
    const modalHtml = `
        <div id="quick-add-brand-from-product-modal" class="modal active" style="z-index: 1003;">
            <div class="modal-content" style="max-width: 400px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px; border-radius: 12px 12px 0 0; color: white;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Hızlı Marka Ekle</h3>
                </div>
                
                <form id="quick-brand-from-product-form" onsubmit="handleQuickAddBrandFromProduct(event)" style="padding: 20px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Marka Adı *</label>
                        <input type="text" id="quick-brand-from-product-name" name="name" required 
                               style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                               onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'">
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button type="button" onclick="closeProductModal('quick-add-brand-from-product-modal')" 
                                style="padding: 12px 24px; background: #f3f4f6; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            İptal
                        </button>
                        <button type="submit" 
                                style="padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            Ekle
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('quick-brand-from-product-name').focus();
}

async function handleQuickAddBrandFromProduct(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const brandData = {
        name: formData.get('name').trim(),
        icon: '🏷️',
        color: '#667eea'
    };
    
    if (!brandData.name) {
        showNotification('Marka adı zorunludur', 'error');
        return;
    }
    
    try {
        const newBrand = await ipcRenderer.invoke('add-brand', brandData);
        brands.push(newBrand);
        
        closeProductModal('quick-add-brand-from-product-modal');
        showNotification('Marka başarıyla eklendi', 'success');
        
        // Marka dropdown'unu güncelle
        const brandSelect = document.getElementById('product-brand');
        if (brandSelect) {
            const newOption = document.createElement('option');
            newOption.value = newBrand.id;
            newOption.textContent = newBrand.name;
            brandSelect.appendChild(newOption);
            brandSelect.value = newBrand.id; // Yeni eklenen markayı seç
        }
        
    } catch (error) {
        console.error('Marka eklenirken hata:', error);
        showNotification('Marka eklenirken hata oluştu', 'error');
    }
}

// Close modal fonksiyonu - modal'ı tamamen kaldır
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

// Satış ekranından ürün ekleme modalını aç
function showProductModalFromSale() {
    // Önce verileri yükle
    Promise.all([
        loadCategories(),
        loadBrands(),
        loadProducts()
    ]).then(() => {
        // Ürün ekleme modalını aç
        showProductModal();
    }).catch(error => {
        console.error('Veriler yüklenirken hata:', error);
        showNotification('Veriler yüklenirken hata oluştu', 'error');
    });
}

// Satış ekranındaki ürün seçimini güncelle
function updateSaleProductSelect(newProduct) {
    const saleProductSelect = document.getElementById('sale-product');
    if (saleProductSelect) {
        // Yeni ürünü seçeneklere ekle
        const newOption = document.createElement('option');
        newOption.value = newProduct.id;
        newOption.textContent = `${newProduct.name} - ₺${newProduct.sale_price}`;
        saleProductSelect.appendChild(newOption);
        
        // Yeni eklenen ürünü seç
        saleProductSelect.value = newProduct.id;
        
        // Eğer renderer.js'de loadProductsForSale fonksiyonu varsa çağır
        if (typeof loadProductsForSale === 'function') {
            loadProductsForSale();
        }
        
        console.log('Satış ekranındaki ürün seçimi güncellendi:', newProduct.name);
    }
}

// Global fonksiyonlar
window.showProductManagement = showProductManagement;
window.showProductModalFromSale = showProductModalFromSale;
window.showProductModal = showProductModal;
window.handleAddProduct = handleAddProduct;
window.showCategoriesModal = showCategoriesModal;
window.showBrandsModal = showBrandsModal;
window.showAddCategoryModal = showAddCategoryModal;
window.showAddBrandModal = showAddBrandModal;
window.handleAddCategory = handleAddCategory;
window.handleAddBrand = handleAddBrand;
window.deleteCategory = deleteCategory;
window.deleteBrand = deleteBrand;
window.editCategory = editCategory;
window.editBrand = editBrand;
window.handleEditBrand = handleEditBrand;
window.closeProductModal = closeProductModal;
window.handleProductModalKeydown = handleProductModalKeydown;
window.showQuickAddCategoryFromProduct = showQuickAddCategoryFromProduct;
window.showQuickAddBrandFromProduct = showQuickAddBrandFromProduct;
window.handleQuickAddCategoryFromProduct = handleQuickAddCategoryFromProduct;
window.handleQuickAddBrandFromProduct = handleQuickAddBrandFromProduct;

