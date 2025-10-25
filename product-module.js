/**
 * 🚀 MODERN ÜRÜN YÖNETİM MODÜLÜ v2.0
 * 
 * Yenilikçi özellikler:
 * - Modern dashboard tasarımı
 * - Akıllı kategoriler ve markalar
 * - Excel import/export
 * - Gelişmiş arama ve filtreleme
 * - Stok takibi ve uyarılar
 * - QR/Barkod desteği
 * - Toplu işlemler
 */

// Global değişkenler
let products = [];
let categories = [];
let brands = [];
let currentView = 'dashboard'; // dashboard, list, grid
let selectedProducts = new Set();
let searchFilters = {
    text: '',
    category: '',
    brand: '',
    stockStatus: '',
    priceRange: { min: '', max: '' }
};

// Global değişkenleri window objesine ata (renderer.js ile uyumluluk için)
window.products = products;
window.categories = categories;
window.brands = brands;

// 🎯 ANA MODAL AÇMA FONKSİYONU
async function showProductManagement() {
    try {
        // Verileri yükle
        await Promise.all([
            loadCategoriesData(),
            loadBrandsData(),
            loadProductsData()
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
        
        // Dashboard'u göster
        showDashboard();
        
    } catch (error) {
        console.error('Ürün yönetimi açılırken hata:', error);
        showNotification('Ürün yönetimi açılırken hata oluştu', 'error');
    }
}

// 📊 VERİ YÜKLEME FONKSİYONLARI
// Eski loadCategoriesData fonksiyonu kaldırıldı - yeni versiyon aşağıda

// Eski loadBrandsData fonksiyonu kaldırıldı - yeni versiyon aşağıda

// Eski loadProductsData fonksiyonu kaldırıldı - yeni versiyon aşağıda

// 🎨 MODERN MODAL OLUŞTURMA
function createModernProductModal() {
    return `
        <div id="product-management-modal" class="modal active" style="z-index: 9997;">
            <div class="modal-content" style="max-width: 98%; max-height: 98vh; border-radius: 20px; overflow: hidden; background: #ffffff; box-shadow: 0 25px 50px rgba(0,0,0,0.15);">
                
                <!-- Modern Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px 32px; color: white; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2;">
                        <div>
                            <h2 style="margin: 0; font-size: 32px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">📦 Ürün Yönetimi</h2>
                            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.95; font-weight: 500;">
                                ${products.length} Ürün · ${categories.length} Kategori · ${brands.length} Marka
                            </p>
                        </div>
                        <div style="display: flex; gap: 16px; align-items: center;">
                            <button onclick="showExcelImportModal()" 
                                    style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 12px 20px; border-radius: 12px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s; display: flex; align-items: center; gap: 8px; backdrop-filter: blur(10px);"
                                    onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='translateY(-2px)'" 
                                    onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='translateY(0)'" 
                                    title="Excel ile Toplu Ürün Yükle">
                                📊 Excel Import
                            </button>
                            <button onclick="exportProductsToExcel()" 
                                    style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 12px 20px; border-radius: 12px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s; display: flex; align-items: center; gap: 8px; backdrop-filter: blur(10px);"
                                    onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='translateY(-2px)'" 
                                    onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='translateY(0)'" 
                                    title="Ürünleri Excel'e Aktar">
                                📤 Excel Export
                            </button>
                            <button onclick="event.stopPropagation(); closeProductModal('product-management-modal')" 
                                    style="background: rgba(255,255,255,0.2); border: none; color: white; width: 48px; height: 48px; border-radius: 50%; cursor: pointer; font-size: 24px; transition: all 0.3s; z-index: 1001; position: relative; backdrop-filter: blur(10px);"
                                    onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='rotate(90deg)'" 
                                    onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='rotate(0deg)'"
                                    title="Kapat">
                                ×
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Navigation Tabs -->
                <div style="background: #f8fafc; padding: 0 32px; border-bottom: 1px solid #e2e8f0;">
                    <div style="display: flex; gap: 0;">
                        <button onclick="showDashboard()" id="tab-dashboard" 
                                style="padding: 16px 24px; background: #667eea; color: white; border: none; border-radius: 12px 12px 0 0; cursor: pointer; font-weight: 600; transition: all 0.3s; margin-right: 4px;">
                            📊 Dashboard
                        </button>
                        <button onclick="showListView()" id="tab-list" 
                                style="padding: 16px 24px; background: transparent; color: #64748b; border: none; cursor: pointer; font-weight: 500; transition: all 0.3s;">
                            📋 Liste Görünümü
                        </button>
                    </div>
                </div>
                
                <!-- Content Area -->
                <div id="product-content-area" style="padding: 32px; background: #f8fafc; height: calc(98vh - 200px); overflow-y: auto;">
                    <!-- Content will be dynamically loaded here -->
                </div>
            </div>
        </div>
    `;
}

// 📊 DASHBOARD GÖRÜNÜMÜ
function showDashboard() {
    currentView = 'dashboard';
    updateTabStyles();
    
    const stats = calculateProductStats();
    const lowStockProducts = products.filter(p => p.stock <= (p.min_stock || 5));
    const recentProducts = products.slice(-5).reverse();
    
    const dashboardHtml = `
        <div style="display: grid; gap: 24px;">
            <!-- Stats Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 16px; color: white; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Toplam Ürün</div>
                            <div style="font-size: 32px; font-weight: 800;">${stats.totalProducts}</div>
                        </div>
                        <div style="font-size: 48px; opacity: 0.3;">📦</div>
                    </div>
                </div>
                
                <div onclick="showBrandsModal()" 
                     style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; border-radius: 16px; color: white; box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3); cursor: pointer; transition: all 0.3s;"
                     onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 35px rgba(16, 185, 129, 0.4)'" 
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(16, 185, 129, 0.3)'">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Markalar</div>
                            <div style="font-size: 32px; font-weight: 800;">${stats.totalBrands}</div>
                        </div>
                        <div style="font-size: 48px; opacity: 0.3;">🏷️</div>
                    </div>
                </div>
                
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 24px; border-radius: 16px; color: white; box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Düşük Stok</div>
                            <div style="font-size: 32px; font-weight: 800;">${stats.lowStockCount}</div>
                        </div>
                        <div style="font-size: 48px; opacity: 0.3;">⚠️</div>
                    </div>
                </div>
                
                <div onclick="showCategoriesModal()" 
                     style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 24px; border-radius: 16px; color: white; box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3); cursor: pointer; transition: all 0.3s;"
                     onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 35px rgba(139, 92, 246, 0.4)'" 
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(139, 92, 246, 0.3)'">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Kategoriler</div>
                            <div style="font-size: 32px; font-weight: 800;">${stats.totalCategories}</div>
                        </div>
                        <div style="font-size: 48px; opacity: 0.3;">📁</div>
                    </div>
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <h3 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 700; color: #1e293b;">🚀 Hızlı İşlemler</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                    <button onclick="showAddProductModal()" 
                            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; cursor: pointer; transition: all 0.3s; border: none; color: white; font-weight: 600; display: flex; align-items: center; gap: 12px;"
                            onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 25px rgba(102, 126, 234, 0.4)'" 
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        <span style="font-size: 24px;">➕</span>
                        <span>Yeni Ürün Ekle</span>
                    </button>
                    
                    <button onclick="showCategoriesModal()" 
                            style="background: white; border: 2px solid #e5e7eb; padding: 20px; border-radius: 12px; cursor: pointer; transition: all 0.3s; color: #374151; font-weight: 600; display: flex; align-items: center; gap: 12px;"
                            onmouseover="this.style.borderColor='#667eea'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.1)'" 
                            onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
                        <span style="font-size: 24px;">📁</span>
                        <span>Kategoriler</span>
                    </button>
                    
                    <button onclick="showBrandsModal()" 
                            style="background: white; border: 2px solid #e5e7eb; padding: 20px; border-radius: 12px; cursor: pointer; transition: all 0.3s; color: #374151; font-weight: 600; display: flex; align-items: center; gap: 12px;"
                            onmouseover="this.style.borderColor='#667eea'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.1)'" 
                            onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
                        <span style="font-size: 24px;">🏷️</span>
                        <span>Markalar</span>
                    </button>
                    
                    <button onclick="showBulkOperationsModal()" 
                            style="background: white; border: 2px solid #e5e7eb; padding: 20px; border-radius: 12px; cursor: pointer; transition: all 0.3s; color: #374151; font-weight: 600; display: flex; align-items: center; gap: 12px;"
                            onmouseover="this.style.borderColor='#667eea'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.1)'" 
                            onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
                        <span style="font-size: 24px;">⚡</span>
                        <span>Toplu İşlemler</span>
                    </button>
                </div>
            </div>
            
            <!-- Low Stock Alert -->
            ${lowStockProducts.length > 0 ? `
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <span style="font-size: 24px;">⚠️</span>
                        <h4 style="margin: 0; font-size: 18px; font-weight: 700; color: #92400e;">Düşük Stok Uyarısı</h4>
                    </div>
                    <div style="display: grid; gap: 8px;">
                        ${lowStockProducts.slice(0, 5).map(product => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255,255,255,0.7); border-radius: 8px;">
                                <span style="font-weight: 500; color: #92400e;">${product.name}</span>
                                <span style="font-weight: 700; color: #dc2626;">${product.stock} ${product.unit || 'adet'}</span>
                            </div>
                        `).join('')}
                        ${lowStockProducts.length > 5 ? `
                            <div style="text-align: center; margin-top: 8px;">
                                <span style="font-size: 14px; color: #92400e;">ve ${lowStockProducts.length - 5} ürün daha...</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            
            <!-- Recent Products -->
            <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <h3 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 700; color: #1e293b;">🕒 Son Eklenen Ürünler</h3>
                <div style="display: grid; gap: 12px;">
                    ${recentProducts.map(product => {
                        const category = categories.find(c => c.id === product.category_id);
                        const brand = brands.find(b => b.id === product.brand_id);
                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                                <div style="display: flex; align-items: center; gap: 16px;">
                                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px;">
                                        ${product.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">${product.name}</div>
                                        <div style="font-size: 14px; color: #64748b;">
                                            ${category ? `<span style="background: #ede9fe; color: #7c3aed; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px;">${category.name}</span>` : ''}
                                            ${brand ? `<span style="background: #dbeafe; color: #2563eb; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${brand.name}</span>` : ''}
                                        </div>
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-weight: 700; color: #10b981; font-size: 16px;">₺${(product.sale_price || 0).toFixed(2)}</div>
                                    <div style="font-size: 14px; color: #64748b;">Stok: ${product.stock || 0}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('product-content-area').innerHTML = dashboardHtml;
}

// 📋 LİSTE GÖRÜNÜMÜ
function showListView() {
    currentView = 'list';
    updateTabStyles();
    
    const listHtml = `
        <div style="display: grid; gap: 24px;">
            <!-- Search and Filters -->
            <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 16px; align-items: end;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">🔍 Ürün Ara</label>
                        <input type="text" id="product-search-input" placeholder="Ürün adı, kodu veya barkod..." 
                               style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 14px; outline: none; transition: all 0.2s;"
                               onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#e5e7eb'"
                               onkeyup="filterProducts()">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">📁 Kategori</label>
                        <select id="category-filter-select" onchange="filterProducts()" 
                                style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 14px; outline: none; background: white; cursor: pointer;">
                            <option value="">Tüm Kategoriler</option>
                            ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">🏷️ Marka</label>
                        <select id="brand-filter-select" onchange="filterProducts()" 
                                style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 14px; outline: none; background: white; cursor: pointer;">
                            <option value="">Tüm Markalar</option>
                            ${brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">📊 Stok Durumu</label>
                        <select id="stock-filter-select" onchange="filterProducts()" 
                                style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 14px; outline: none; background: white; cursor: pointer;">
                            <option value="">Tümü</option>
                            <option value="low">Düşük Stok</option>
                            <option value="out">Stokta Yok</option>
                            <option value="available">Stokta Var</option>
                        </select>
                    </div>
                    <div>
                        <button onclick="clearFilters()" 
                                style="padding: 12px 20px; background: #f3f4f6; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; color: #374151; transition: all 0.2s;"
                                onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">
                            🗑️ Temizle
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Products Table -->
            <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div id="products-table-container">
                    ${createProductsTable()}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('product-content-area').innerHTML = listHtml;
}

// 🎯 KART GÖRÜNÜMÜ
// 📊 İSTATİSTİK HESAPLAMA
function calculateProductStats() {
    const totalProducts = products.length;
    const totalCategories = categories.length;
    const totalBrands = brands.length;
    const lowStockCount = products.filter(p => p.stock <= (p.min_stock || 5)).length;
    
    return {
        totalProducts,
        totalCategories,
        totalBrands,
        lowStockCount
    };
}

// 📋 ÜRÜN TABLOSU OLUŞTURMA
function createProductsTable(filteredProducts = null) {
    const productsToShow = filteredProducts || products;
    
    if (productsToShow.length === 0) {
        return `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 24px; opacity: 0.3;">📦</div>
                <h3 style="color: #6b7280; margin-bottom: 16px; font-size: 24px;">Henüz ürün yok</h3>
                <p style="color: #9ca3af; margin-bottom: 24px;">İlk ürününüzü ekleyerek başlayın</p>
                <button onclick="showAddProductModal()" 
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 16px;">
                    ➕ İlk Ürünü Ekle
                </button>
            </div>
        `;
    }
    
    return `
        <table style="width: 100%; border-collapse: collapse;">
            <thead style="background: #f8fafc;">
                <tr>
                    <th style="padding: 16px; text-align: left; font-weight: 700; color: #374151; border-bottom: 2px solid #e2e8f0;">
                        <input type="checkbox" onchange="toggleSelectAll(this)" style="margin-right: 8px;">
                        Ürün Bilgileri
                    </th>
                    <th style="padding: 16px; text-align: left; font-weight: 700; color: #374151; border-bottom: 2px solid #e2e8f0;">Kategori</th>
                    <th style="padding: 16px; text-align: left; font-weight: 700; color: #374151; border-bottom: 2px solid #e2e8f0;">Marka</th>
                    <th style="padding: 16px; text-align: right; font-weight: 700; color: #374151; border-bottom: 2px solid #e2e8f0;">Fiyat</th>
                    <th style="padding: 16px; text-align: center; font-weight: 700; color: #374151; border-bottom: 2px solid #e2e8f0;">KDV</th>
                    <th style="padding: 16px; text-align: center; font-weight: 700; color: #374151; border-bottom: 2px solid #e2e8f0;">Stok</th>
                    <th style="padding: 16px; text-align: center; font-weight: 700; color: #374151; border-bottom: 2px solid #e2e8f0;">İşlemler</th>
                </tr>
            </thead>
            <tbody>
                ${productsToShow.map(product => createProductTableRow(product)).join('')}
            </tbody>
        </table>
    `;
}

// 🎯 ÜRÜN KARTLARI OLUŞTURMA
function createProductsGrid(filteredProducts = null) {
    const productsToShow = filteredProducts || products;
    
    if (productsToShow.length === 0) {
        return `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 24px; opacity: 0.3;">📦</div>
                <h3 style="color: #6b7280; margin-bottom: 16px; font-size: 24px;">Henüz ürün yok</h3>
                <p style="color: #9ca3af; margin-bottom: 24px;">İlk ürününüzü ekleyerek başlayın</p>
                <button onclick="showAddProductModal()" 
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 16px;">
                    ➕ İlk Ürünü Ekle
                </button>
            </div>
        `;
    }
    
    return `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
            ${productsToShow.map(product => createProductCard(product)).join('')}
        </div>
    `;
}

// 📋 ÜRÜN TABLO SATIRI
function createProductTableRow(product) {
    const category = categories.find(c => c.id === product.category_id);
    const brand = brands.find(b => b.id === product.brand_id);
    const hasLowStock = product.stock <= (product.min_stock || 5);
    const isOutOfStock = product.stock <= 0;
    
    return `
        <tr style="border-bottom: 1px solid #f3f4f6; transition: background 0.2s;" 
            onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
            <td style="padding: 16px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <input type="checkbox" value="${product.id}" onchange="toggleProductSelection(${product.id})" style="margin-right: 8px;">
                    <div>
                        <div style="font-weight: 700; color: #111827; margin-bottom: 4px; font-size: 16px;">${product.name}</div>
                        <div style="font-size: 12px; color: #9ca3af;">
                            ${product.code ? `Kod: ${product.code}` : ''}
                            ${product.barcode ? ` | Barkod: ${product.barcode}` : ''}
                        </div>
                    </div>
                </div>
            </td>
            <td style="padding: 16px;">
                ${category ? `<span style="color: #7c3aed; font-size: 14px; font-weight: 500;">${category.name}</span>` : '<span style="color: #9ca3af; font-size: 14px;">-</span>'}
            </td>
            <td style="padding: 16px;">
                ${brand ? `<span style="color: #2563eb; font-size: 14px; font-weight: 500;">${brand.name}</span>` : '<span style="color: #9ca3af; font-size: 14px;">-</span>'}
            </td>
            <td style="padding: 16px; text-align: right;">
                <div style="font-weight: 800; color: #10b981; font-size: 18px;">₺${(product.sale_price || 0).toFixed(2)}</div>
                ${product.purchase_price ? `<div style="font-size: 12px; color: #9ca3af;">Alış: ₺${product.purchase_price.toFixed(2)}</div>` : ''}
            </td>
            <td style="padding: 16px; text-align: center;">
                <span style="background: #fef3c7; color: #d97706; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;">%${product.vat_rate || 20}</span>
            </td>
            <td style="padding: 16px; text-align: center;">
                <div style="font-weight: 700; color: ${isOutOfStock ? '#dc2626' : hasLowStock ? '#f59e0b' : '#374151'}; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    ${isOutOfStock ? '❌' : hasLowStock ? '⚠️' : '✅'}
                    <span style="font-size: 16px;">${product.stock || 0}</span>
                    <span style="font-size: 12px; color: #9ca3af;">${product.unit || 'adet'}</span>
                </div>
            </td>
            <td style="padding: 16px; text-align: center;">
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button onclick="editProduct(${product.id})" 
                            style="background: #f3f4f6; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; color: #374151; transition: all 0.2s; font-weight: 600;"
                            onmouseover="this.style.background='#e5e7eb'; this.style.transform='translateY(-1px)'" 
                            onmouseout="this.style.background='#f3f4f6'; this.style.transform='translateY(0)'">
                        ✏️ Düzenle
                    </button>
                    ${window.currentUser && window.currentUser.role === 'admin' ? 
                        `<button onclick="deleteProduct(${product.id})" 
                                style="background: #fef2f2; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; color: #dc2626; transition: all 0.2s; font-weight: 600;"
                                onmouseover="this.style.background='#fee2e2'; this.style.transform='translateY(-1px)'" 
                                onmouseout="this.style.background='#fef2f2'; this.style.transform='translateY(0)'">
                            🗑️ Sil
                        </button>` : 
                        ''
                    }
                </div>
            </td>
        </tr>
    `;
}

// 🎯 ÜRÜN KARTI
function createProductCard(product) {
    const category = categories.find(c => c.id === product.category_id);
    const brand = brands.find(b => b.id === product.brand_id);
    const hasLowStock = product.stock <= (product.min_stock || 5);
    const isOutOfStock = product.stock <= 0;
    
    return `
        <div style="background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: all 0.3s; border: 1px solid #e2e8f0;"
             onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.1)'" 
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)'">
            
            <!-- Product Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <input type="checkbox" value="${product.id}" onchange="toggleProductSelection(${product.id})" style="margin-right: 8px;">
                    <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 20px;">
                        ${product.name.charAt(0).toUpperCase()}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 800; color: #10b981; font-size: 20px;">₺${(product.sale_price || 0).toFixed(2)}</div>
                    ${product.purchase_price ? `<div style="font-size: 12px; color: #9ca3af;">Alış: ₺${product.purchase_price.toFixed(2)}</div>` : ''}
                </div>
            </div>
            
            <!-- Product Info -->
            <div style="margin-bottom: 16px;">
                <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #1e293b; line-height: 1.3;">${product.name}</h3>
                <div style="font-size: 14px; color: #64748b; margin-bottom: 12px;">
                    ${product.code ? `<div style="margin-bottom: 4px;">📋 Kod: ${product.code}</div>` : ''}
                    ${product.barcode ? `<div>🏷️ Barkod: ${product.barcode}</div>` : ''}
                </div>
            </div>
            
            <!-- Categories and Brand -->
            <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
                ${category ? `<span style="background: #ede9fe; color: #7c3aed; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">📁 ${category.name}</span>` : ''}
                ${brand ? `<span style="background: #dbeafe; color: #2563eb; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">🏷️ ${brand.name}</span>` : ''}
            </div>
            
            <!-- Stock Status -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${isOutOfStock ? '❌' : hasLowStock ? '⚠️' : '✅'}
                    <span style="font-weight: 700; color: ${isOutOfStock ? '#dc2626' : hasLowStock ? '#f59e0b' : '#10b981'}; font-size: 16px;">
                        ${product.stock || 0} ${product.unit || 'adet'}
                    </span>
                </div>
                <div style="font-size: 12px; color: #9ca3af;">
                    ${isOutOfStock ? 'Stokta Yok' : hasLowStock ? 'Düşük Stok' : 'Stokta Var'}
                </div>
            </div>
            
            <!-- Actions -->
            <div style="display: flex; gap: 8px;">
                <button onclick="editProduct(${product.id})" 
                        style="flex: 1; background: #f3f4f6; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 12px; color: #374151; transition: all 0.2s; font-weight: 600;"
                        onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">
                    ✏️ Düzenle
                </button>
                ${window.currentUser && window.currentUser.role === 'admin' ? 
                    `<button onclick="deleteProduct(${product.id})" 
                            style="flex: 1; background: #fef2f2; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 12px; color: #dc2626; transition: all 0.2s; font-weight: 600;"
                            onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">
                        🗑️ Sil
                    </button>` : 
                    ''
                }
            </div>
        </div>
    `;
}

// 🔄 TAB STİLLERİNİ GÜNCELLEME
function updateTabStyles() {
    const tabs = ['dashboard', 'list', 'grid'];
    tabs.forEach(tab => {
        const tabElement = document.getElementById(`tab-${tab}`);
        if (tabElement) {
            if (tab === currentView) {
                tabElement.style.background = '#667eea';
                tabElement.style.color = 'white';
            } else {
                tabElement.style.background = 'transparent';
                tabElement.style.color = '#64748b';
            }
        }
    });
}

// 🔍 FİLTRELEME FONKSİYONLARI
function filterProducts() {
    const search = (document.getElementById('product-search-input')?.value || '').toLowerCase();
    const categoryId = document.getElementById('category-filter-select')?.value || '';
    const brandId = document.getElementById('brand-filter-select')?.value || '';
    const stockStatus = document.getElementById('stock-filter-select')?.value || '';
    
    let filteredProducts = products.filter(product => {
        // Arama metni kontrolü
        const matchesSearch = !search || 
            product.name.toLowerCase().includes(search) ||
            (product.code && product.code.toLowerCase().includes(search)) ||
            (product.barcode && product.barcode.toLowerCase().includes(search));
        
        // Kategori kontrolü
        const matchesCategory = !categoryId || product.category_id == categoryId;
        
        // Marka kontrolü
        const matchesBrand = !brandId || product.brand_id == brandId;
        
        // Stok durumu kontrolü
        let matchesStock = true;
        if (stockStatus === 'low') {
            matchesStock = product.stock <= (product.min_stock || 5) && product.stock > 0;
        } else if (stockStatus === 'out') {
            matchesStock = product.stock <= 0;
        } else if (stockStatus === 'available') {
            matchesStock = product.stock > (product.min_stock || 5);
        }
        
        return matchesSearch && matchesCategory && matchesBrand && matchesStock;
    });
    
    // Tabloyu güncelle
    const container = document.getElementById('products-table-container');
    if (container) {
        container.innerHTML = createProductsTable(filteredProducts);
    }
}

function filterProductsGrid() {
    const search = (document.getElementById('product-search-input-grid')?.value || '').toLowerCase();
    const categoryId = document.getElementById('category-filter-select-grid')?.value || '';
    const brandId = document.getElementById('brand-filter-select-grid')?.value || '';
    const stockStatus = document.getElementById('stock-filter-select-grid')?.value || '';
    
    let filteredProducts = products.filter(product => {
        // Arama metni kontrolü
        const matchesSearch = !search || 
            product.name.toLowerCase().includes(search) ||
            (product.code && product.code.toLowerCase().includes(search)) ||
            (product.barcode && product.barcode.toLowerCase().includes(search));
        
        // Kategori kontrolü
        const matchesCategory = !categoryId || product.category_id == categoryId;
        
        // Marka kontrolü
        const matchesBrand = !brandId || product.brand_id == brandId;
        
        // Stok durumu kontrolü
        let matchesStock = true;
        if (stockStatus === 'low') {
            matchesStock = product.stock <= (product.min_stock || 5) && product.stock > 0;
        } else if (stockStatus === 'out') {
            matchesStock = product.stock <= 0;
        } else if (stockStatus === 'available') {
            matchesStock = product.stock > (product.min_stock || 5);
        }
        
        return matchesSearch && matchesCategory && matchesBrand && matchesStock;
    });
    
    // Grid'i güncelle
    const container = document.getElementById('products-grid-container');
    if (container) {
        container.innerHTML = createProductsGrid(filteredProducts);
    }
}

function clearFilters() {
    document.getElementById('product-search-input').value = '';
    document.getElementById('category-filter-select').value = '';
    document.getElementById('brand-filter-select').value = '';
    document.getElementById('stock-filter-select').value = '';
    filterProducts();
}

function clearFiltersGrid() {
    document.getElementById('product-search-input-grid').value = '';
    document.getElementById('category-filter-select-grid').value = '';
    document.getElementById('brand-filter-select-grid').value = '';
    document.getElementById('stock-filter-select-grid').value = '';
    filterProductsGrid();
}

// ✅ ÜRÜN SEÇİMİ
function toggleProductSelection(productId) {
    if (selectedProducts.has(productId)) {
        selectedProducts.delete(productId);
    } else {
        selectedProducts.add(productId);
    }
    updateSelectionUI();
}

function toggleSelectAll(checkbox) {
    const productCheckboxes = document.querySelectorAll('input[type="checkbox"][value]');
    productCheckboxes.forEach(cb => {
        cb.checked = checkbox.checked;
        const productId = parseInt(cb.value);
        if (checkbox.checked) {
            selectedProducts.add(productId);
        } else {
            selectedProducts.delete(productId);
        }
    });
    updateSelectionUI();
}

function updateSelectionUI() {
    // Seçili ürün sayısını göster
    const selectedCount = selectedProducts.size;
    console.log(`Seçili ürün sayısı: ${selectedCount}`);
}

// 📊 EXCEL IMPORT MODAL
function showExcelImportModal() {
    const modalHtml = `
        <div id="excel-import-modal" class="modal active" style="z-index: 10000;">
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; border-radius: 16px 16px 0 0; color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; font-size: 24px; font-weight: 700;">📊 Excel ile Toplu Ürün Yükleme</h3>
                        <button onclick="closeProductModal('excel-import-modal')" 
                                style="background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 20px; transition: all 0.3s;"
                                onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                                onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            ×
                        </button>
                    </div>
                </div>
                
                <div style="padding: 24px;">
                    <!-- Instructions -->
                    <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; border-left: 4px solid #0ea5e9; margin-bottom: 24px;">
                        <h4 style="margin: 0 0 12px 0; color: #0c4a6e; font-size: 16px; font-weight: 700;">📋 Excel Dosyası Formatı</h4>
                        <div style="color: #0c4a6e; font-size: 14px; line-height: 1.6;">
                            <p style="margin: 0 0 8px 0;"><strong>Gerekli Sütunlar:</strong></p>
                            <ul style="margin: 0; padding-left: 20px;">
                                <li><strong>Ürün Adı</strong> (zorunlu) - Ürünün adı</li>
                                <li><strong>Satış Fiyatı</strong> (zorunlu) - Ürünün satış fiyatı</li>
                                <li><strong>Stok</strong> - Mevcut stok miktarı (varsayılan: 0)</li>
                                <li><strong>Kategori</strong> - Ürün kategorisi</li>
                                <li><strong>Marka</strong> - Ürün markası</li>
                                <li><strong>Ürün Kodu</strong> - Ürün kodu</li>
                                <li><strong>Barkod</strong> - Ürün barkodu</li>
                                <li><strong>Alış Fiyatı</strong> - Ürünün alış fiyatı</li>
                                <li><strong>Birim</strong> - Ürün birimi (varsayılan: adet)</li>
                                <li><strong>Açıklama</strong> - Ürün açıklaması</li>
                            </ul>
                        </div>
                    </div>
                    
                    <!-- File Upload -->
                    <div style="background: white; border: 2px dashed #d1d5db; border-radius: 12px; padding: 40px; text-align: center; margin-bottom: 24px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">📁</div>
                        <h4 style="margin: 0 0 8px 0; color: #374151; font-size: 18px;">Excel Dosyasını Seçin</h4>
                        <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px;">.xlsx veya .xls formatında dosya yükleyin</p>
                        <input type="file" id="excel-file-input" accept=".xlsx,.xls" 
                               style="display: none;" onchange="handleExcelFileSelect(event)">
                        <button onclick="document.getElementById('excel-file-input').click()" 
                                style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 16px;">
                            📁 Dosya Seç
                        </button>
                    </div>
                    
                    <!-- Preview Area -->
                    <div id="excel-preview-area" style="display: none;">
                        <h4 style="margin: 0 0 16px 0; color: #374151; font-size: 18px; font-weight: 700;">📋 Önizleme</h4>
                        <div id="excel-preview-table" style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; max-height: 300px; overflow-y: auto;">
                            <!-- Preview table will be inserted here -->
                        </div>
                        <div style="margin-top: 16px; display: flex; gap: 12px; justify-content: flex-end;">
                            <button onclick="closeProductModal('excel-import-modal')" 
                                    style="padding: 12px 24px; background: #f3f4f6; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; color: #374151;">
                                İptal
                            </button>
                            <button onclick="importProductsFromExcel()" 
                                    style="padding: 12px 24px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                📊 Ürünleri İçe Aktar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 📊 EXCEL EXPORT
function exportProductsToExcel() {
    try {
        // Ürün verilerini Excel formatına hazırla
        const excelData = products.map(product => {
            const category = categories.find(c => c.id === product.category_id);
            const brand = brands.find(b => b.id === product.brand_id);
            
            return {
                'Ürün Adı': product.name,
                'Ürün Kodu': product.code || '',
                'Barkod': product.barcode || '',
                'Kategori': category ? category.name : '',
                'Marka': brand ? brand.name : '',
                'Stok': product.stock || 0,
                'Birim': product.unit || 'adet',
                'Alış Fiyatı': product.purchase_price || 0,
                'Satış Fiyatı': product.sale_price || 0,
                'Açıklama': product.description || ''
            };
        });
        
        // Excel dosyası oluştur ve indir
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');
        
        const fileName = `urunler_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showNotification('Ürünler başarıyla Excel dosyasına aktarıldı', 'success');
        
    } catch (error) {
        console.error('Excel export hatası:', error);
        showNotification('Excel dosyası oluşturulurken hata oluştu', 'error');
    }
}

// 📊 EXCEL IMPORT HANDLER
function handleExcelFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // Preview oluştur
            createExcelPreview(jsonData);
            
        } catch (error) {
            console.error('Excel dosyası okuma hatası:', error);
            showNotification('Excel dosyası okunamadı', 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}

function createExcelPreview(data) {
    if (data.length === 0) {
        showNotification('Excel dosyası boş görünüyor', 'warning');
        return;
    }
    
    // İlk 10 satırı göster
    const previewData = data.slice(0, 10);
    const headers = Object.keys(previewData[0]);
    
    const tableHtml = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead style="background: #f8fafc;">
                <tr>
                    ${headers.map(header => `<th style="padding: 12px; text-align: left; font-weight: 700; color: #374151; border-bottom: 2px solid #e2e8f0;">${header}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${previewData.map((row, index) => `
                    <tr style="border-bottom: 1px solid #f3f4f6;">
                        ${headers.map(header => `<td style="padding: 12px; color: #374151;">${row[header] || ''}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ${data.length > 10 ? `<div style="text-align: center; padding: 12px; color: #6b7280; font-size: 14px;">ve ${data.length - 10} satır daha...</div>` : ''}
    `;
    
    document.getElementById('excel-preview-table').innerHTML = tableHtml;
    document.getElementById('excel-preview-area').style.display = 'block';
    
    // Global değişkene kaydet
    window.excelImportData = data;
}

async function importProductsFromExcel() {
    if (!window.excelImportData) {
        showNotification('Önce Excel dosyasını seçin', 'warning');
        return;
    }
    
    try {
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        for (const row of window.excelImportData) {
            try {
                // Veri dönüşümü
                const productData = {
                    name: row['Ürün Adı'] || row['urun_adi'] || row['name'],
                    code: row['Ürün Kodu'] || row['urun_kodu'] || row['code'] || null,
                    barcode: row['Barkod'] || row['barkod'] || row['barcode'] || null,
                    category_id: null,
                    brand_id: null,
                    stock: parseFloat(row['Stok'] || row['stok'] || row['stock']) || 0,
                    unit: row['Birim'] || row['birim'] || row['unit'] || 'adet',
                    purchase_price: parseFloat(row['Alış Fiyatı'] || row['alis_fiyati'] || row['purchase_price']) || 0,
                    sale_price: parseFloat(row['Satış Fiyatı'] || row['satis_fiyati'] || row['sale_price']) || 0,
                    description: row['Açıklama'] || row['aciklama'] || row['description'] || null
                };
                
                // Validasyon
                if (!productData.name) {
                    throw new Error('Ürün adı boş olamaz');
                }
                
                if (productData.sale_price <= 0) {
                    throw new Error('Satış fiyatı 0\'dan büyük olmalıdır');
                }
                
                // Kategori bul
                const categoryName = row['Kategori'] || row['kategori'] || row['category'];
                if (categoryName) {
                    let category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
                    if (!category) {
                        // Kategori yoksa oluştur
                        category = await ipcRenderer.invoke('add-category', {
                            name: categoryName,
                            icon: '📦',
                            color: '#667eea'
                        });
                        categories.push(category);
                    }
                    productData.category_id = category.id;
                }
                
                // Marka bul
                const brandName = row['Marka'] || row['marka'] || row['brand'];
                if (brandName) {
                    let brand = brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
                    if (!brand) {
                        // Marka yoksa oluştur
                        brand = await ipcRenderer.invoke('add-brand', {
                            name: brandName,
                            icon: '🏷️',
                            color: '#667eea'
                        });
                        brands.push(brand);
                    }
                    productData.brand_id = brand.id;
                }
                
                // Ürünü ekle
                const newProduct = await ipcRenderer.invoke('add-product', productData);
                products.push(newProduct);
                successCount++;
                
            } catch (error) {
                errorCount++;
                errors.push(`${row['Ürün Adı'] || 'Bilinmeyen'}: ${error.message}`);
            }
        }
        
        // Sonuçları göster
        if (successCount > 0) {
            showNotification(`${successCount} ürün başarıyla eklendi`, 'success');
        }
        
        if (errorCount > 0) {
            showNotification(`${errorCount} ürün eklenemedi`, 'warning');
            console.error('Excel import hataları:', errors);
        }
        
        // Modal'ı kapat ve listeyi güncelle
        closeProductModal('excel-import-modal');
        
        // Mevcut görünümü yenile
        if (currentView === 'dashboard') {
            showDashboard();
        } else if (currentView === 'list') {
            showListView();
        } else if (currentView === 'grid') {
            showGridView();
        }
        
        // Satış ekranını güncelle
        if (typeof updateSaleProductSelect === 'function') {
            updateSaleProductSelect();
        }
        
    } catch (error) {
        console.error('Excel import hatası:', error);
        showNotification('Ürünler içe aktarılırken hata oluştu', 'error');
    }
}

// 🎯 EVENT LISTENERS
function setupProductEventListeners() {
    // Event listeners zaten HTML'de inline olarak var
}

// ⌨️ ESC TUŞU İLE MODAL KAPATMA
function handleProductModalKeydown(event) {
    if (event.key === 'Escape') {
        // Tüm aktif modal'ları bul
        const allModals = document.querySelectorAll('.modal.active');
        if (allModals.length === 0) return;
        
        // Z-index'e göre en üstteki modal'ı bul
        let topModal = null;
        let topZIndex = -1;
        
        allModals.forEach(modal => {
            const zIndex = parseInt(window.getComputedStyle(modal).zIndex) || 0;
            if (zIndex > topZIndex) {
                topZIndex = zIndex;
                topModal = modal;
            }
        });
        
        if (!topModal) return;
        
        const modalId = topModal.id;
        console.log(`ESC ile modal kapatılıyor: ${modalId} (z-index: ${topZIndex})`);
        
        // Alt modalları kontrol et
        const subModals = [
            'categories-modal', 'brands-modal', 'add-product-modal', 'edit-product-modal', 
            'add-category-modal', 'add-brand-modal', 'edit-category-modal', 'edit-brand-modal',
            'quick-add-category-from-product-modal', 'quick-add-brand-from-product-modal',
            'excel-import-modal', 'bulk-operations-modal'
        ];
        
        if (subModals.includes(modalId)) {
            // Alt modalları kapat
            closeProductModal(modalId);
            console.log(`Alt modal kapatıldı: ${modalId}`);
        } else if (modalId === 'product-management-modal') {
            // Ana ürün yönetimi modalını kapat
            closeProductModal(modalId);
            // ESC event listener'ını kaldır
            document.removeEventListener('keydown', handleProductModalKeydown);
            console.log('Ana ürün modalı kapatıldı, ESC listener kaldırıldı');
        }
        
        event.preventDefault();
        event.stopPropagation();
    }
}

// 🚪 MODAL KAPATMA FONKSİYONU
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

// 🎯 PLACEHOLDER FONKSİYONLAR (Diğer modüllerle entegrasyon için)
function showAddProductModal() {
    // Bu fonksiyon renderer.js'de tanımlı olacak
    if (typeof window.showAddProductModalFromRenderer === 'function') {
        window.showAddProductModalFromRenderer();
    } else {
        showNotification('Ürün ekleme modülü henüz aktif değil', 'warning');
    }
}

function editProduct(id) {
    // Bu fonksiyon renderer.js'de tanımlı olacak
    if (typeof window.editProductFromRenderer === 'function') {
        window.editProductFromRenderer(id);
    } else {
        showNotification('Ürün düzenleme modülü henüz aktif değil', 'warning');
    }
}

function deleteProduct(id) {
    // Bu fonksiyon renderer.js'de tanımlı olacak
    if (typeof window.deleteProductFromRenderer === 'function') {
        window.deleteProductFromRenderer(id);
    } else {
        showNotification('Ürün silme modülü henüz aktif değil', 'warning');
    }
}

function showCategoriesModal() {
    // Bu fonksiyon renderer.js'de tanımlı olacak
    if (typeof window.showCategoriesModalFromRenderer === 'function') {
        window.showCategoriesModalFromRenderer();
    } else {
        showNotification('Kategori modülü henüz aktif değil', 'warning');
    }
}

function showBrandsModal() {
    // Bu fonksiyon renderer.js'de tanımlı olacak
    if (typeof window.showBrandsModalFromRenderer === 'function') {
        window.showBrandsModalFromRenderer();
    } else {
        showNotification('Marka modülü henüz aktif değil', 'warning');
    }
}

function showBulkOperationsModal() {
    // Bu fonksiyon renderer.js'de tanımlı olacak
    if (typeof window.showBulkOperationsModalFromRenderer === 'function') {
        window.showBulkOperationsModalFromRenderer();
    } else {
        showNotification('Toplu işlemler modülü henüz aktif değil', 'warning');
    }
}

// 🌐 GLOBAL FONKSİYONLAR
window.showProductManagementModule = showProductManagement;
window.showDashboard = showDashboard;
window.showListView = showListView;
// window.showGridView = showGridView; // Removed - function no longer exists
window.filterProducts = filterProducts;
window.filterProductsGrid = filterProductsGrid;
window.clearFilters = clearFilters;
window.clearFiltersGrid = clearFiltersGrid;
window.toggleProductSelection = toggleProductSelection;
window.toggleSelectAll = toggleSelectAll;
window.showExcelImportModal = showExcelImportModal;
window.exportProductsToExcel = exportProductsToExcel;
window.handleExcelFileSelect = handleExcelFileSelect;
window.importProductsFromExcel = importProductsFromExcel;
window.closeProductModal = closeProductModal;
window.handleProductModalKeydown = handleProductModalKeydown;

// Hızlı ekleme fonksiyonları - renderer.js'de kullanılabilir
window.showAddCategoryModalFromProductModule = showAddCategoryModal;
window.showAddBrandModalFromProductModule = showAddBrandModal;

// 📁 KATEGORİ EKLEME MODALI
function showAddCategoryModal() {
    const modalHtml = `
        <div id="add-category-modal" class="modal active" style="z-index: 9999;">
            <div class="modal-content" style="max-width: 500px; border-radius: 16px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 16px 16px 0 0; color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; font-size: 24px; font-weight: 700;">📁 Yeni Kategori</h3>
                        <button onclick="closeAddCategoryModal()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 20px;">×</button>
                    </div>
                </div>
                
                <div style="padding: 24px;">
                    <form id="add-category-form">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Kategori Adı</label>
                            <input type="text" id="category-name" required 
                                   style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 16px; outline: none; transition: all 0.2s;"
                                   placeholder="Kategori adını girin"
                                   onfocus="this.style.borderColor='#667eea'" 
                                   onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                        
                        <div style="margin-bottom: 24px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Açıklama (Opsiyonel)</label>
                            <textarea id="category-description" rows="3"
                                      style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 16px; outline: none; transition: all 0.2s; resize: vertical;"
                                      placeholder="Kategori açıklaması"
                                      onfocus="this.style.borderColor='#667eea'" 
                                      onblur="this.style.borderColor='#e5e7eb'"></textarea>
                        </div>
                        
                        <div style="display: flex; gap: 12px; justify-content: flex-end;">
                            <button type="button" onclick="closeAddCategoryModal()" 
                                    style="padding: 12px 24px; background: #f3f4f6; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; color: #374151; transition: all 0.2s;">
                                İptal
                            </button>
                            <button type="submit" 
                                    style="padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                ➕ Kategori Ekle
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Form submit handler
    document.getElementById('add-category-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('category-name').value.trim();
        const description = document.getElementById('category-description').value.trim();
        
        if (!name) {
            showNotification('Kategori adı gereklidir', 'error');
            return;
        }
        
        try {
            const result = await ipcRenderer.invoke('add-category', { name, description });
            
            if (result && result.id) {
                showNotification('Kategori başarıyla eklendi', 'success');
                closeAddCategoryModal();
                
                console.log('🔄 Kategori eklendi, veriler yenileniyor...');
                // Kategorileri yeniden yükle
                await loadCategoriesData();
                console.log('📊 Kategoriler yeniden yüklendi, liste güncelleniyor...');
                
                // Kategori listesini yenile
                refreshCategoryList();
                
                // Ürün ekleme modalındaki kategori select'ini güncelle ve yeni kategoriyi seç
                updateCategorySelect();
                updateProductCategorySelect(result.id);
                
                // Dashboard'ı yenile (eğer dashboard görünümündeyse)
                if (currentView === 'dashboard') {
                    showDashboard();
                }
            } else {
                showNotification('Kategori eklenirken hata oluştu', 'error');
            }
        } catch (error) {
            console.error('Kategori ekleme hatası:', error);
            showNotification('Kategori eklenirken hata oluştu', 'error');
        }
    });
}

// 🏷️ MARKA EKLEME MODALI
function showAddBrandModal() {
    const modalHtml = `
        <div id="add-brand-modal" class="modal active" style="z-index: 9999;">
            <div class="modal-content" style="max-width: 500px; border-radius: 16px;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; border-radius: 16px 16px 0 0; color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; font-size: 24px; font-weight: 700;">🏷️ Yeni Marka</h3>
                        <button onclick="closeAddBrandModal()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 20px;">×</button>
                    </div>
                </div>
                
                <div style="padding: 24px;">
                    <form id="add-brand-form">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Marka Adı</label>
                            <input type="text" id="brand-name" required 
                                   style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 16px; outline: none; transition: all 0.2s;"
                                   placeholder="Marka adını girin"
                                   onfocus="this.style.borderColor='#10b981'" 
                                   onblur="this.style.borderColor='#e5e7eb'">
                        </div>
                        
                        <div style="margin-bottom: 24px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">Açıklama (Opsiyonel)</label>
                            <textarea id="brand-description" rows="3"
                                      style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 16px; outline: none; transition: all 0.2s; resize: vertical;"
                                      placeholder="Marka açıklaması"
                                      onfocus="this.style.borderColor='#10b981'" 
                                      onblur="this.style.borderColor='#e5e7eb'"></textarea>
                        </div>
                        
                        <div style="display: flex; gap: 12px; justify-content: flex-end;">
                            <button type="button" onclick="closeAddBrandModal()" 
                                    style="padding: 12px 24px; background: #f3f4f6; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; color: #374151; transition: all 0.2s;">
                                İptal
                            </button>
                            <button type="submit" 
                                    style="padding: 12px 24px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                ➕ Marka Ekle
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Form submit handler
    document.getElementById('add-brand-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('brand-name').value.trim();
        const description = document.getElementById('brand-description').value.trim();
        
        if (!name) {
            showNotification('Marka adı gereklidir', 'error');
            return;
        }
        
        try {
            const result = await ipcRenderer.invoke('add-brand', { name, description });
            
            if (result && result.id) {
                showNotification('Marka başarıyla eklendi', 'success');
                closeAddBrandModal();
                
                console.log('🔄 Marka eklendi, veriler yenileniyor...');
                // Markaları yeniden yükle
                await loadBrandsData();
                console.log('📊 Markalar yeniden yüklendi, liste güncelleniyor...');
                
                // Marka listesini yenile
                refreshBrandList();
                
                // Ürün ekleme modalındaki marka select'ini güncelle ve yeni markayı seç
                updateBrandSelect();
                updateProductBrandSelect(result.id);
                
                // Dashboard'ı yenile (eğer dashboard görünümündeyse)
                if (currentView === 'dashboard') {
                    showDashboard();
                }
            } else {
                showNotification('Marka eklenirken hata oluştu', 'error');
            }
        } catch (error) {
            console.error('Marka ekleme hatası:', error);
            showNotification('Marka eklenirken hata oluştu', 'error');
        }
    });
}

// Modal kapatma fonksiyonları
function closeAddCategoryModal() {
    const modal = document.getElementById('add-category-modal');
    if (modal) modal.remove();
}

function closeAddBrandModal() {
    const modal = document.getElementById('add-brand-modal');
    if (modal) modal.remove();
}

// Select güncelleme fonksiyonları
function updateCategorySelect() {
    const categorySelect = document.getElementById('product-category');
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Kategori Seçin</option>' + 
            categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
}

function updateBrandSelect() {
    const brandSelect = document.getElementById('product-brand');
    if (brandSelect) {
        brandSelect.innerHTML = '<option value="">Marka Seçin</option>' + 
            brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    }
}

// 🔄 ÜRÜN EKLEME MODALI SELECT GÜNCELLEME FONKSİYONLARI
function updateProductCategorySelect(selectedCategoryId = null) {
    const productCategorySelect = document.getElementById('product-category');
    const editProductCategorySelect = document.getElementById('edit-product-category');
    
    if (productCategorySelect) {
        // Mevcut seçenekleri temizle (ilk seçenek hariç)
        while (productCategorySelect.children.length > 1) {
            productCategorySelect.removeChild(productCategorySelect.lastChild);
        }
        
        // Yeni kategorileri ekle
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            if (selectedCategoryId && category.id === selectedCategoryId) {
                option.selected = true;
            }
            productCategorySelect.appendChild(option);
        });
        
        console.log('✅ Ürün ekleme modalı kategori select güncellendi');
    }
    
    if (editProductCategorySelect) {
        // Mevcut seçenekleri temizle (ilk seçenek hariç)
        while (editProductCategorySelect.children.length > 1) {
            editProductCategorySelect.removeChild(editProductCategorySelect.lastChild);
        }
        
        // Yeni kategorileri ekle
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            if (selectedCategoryId && category.id === selectedCategoryId) {
                option.selected = true;
            }
            editProductCategorySelect.appendChild(option);
        });
        
        console.log('✅ Ürün düzenleme modalı kategori select güncellendi');
    }
}

function updateProductBrandSelect(selectedBrandId = null) {
    const productBrandSelect = document.getElementById('product-brand');
    const editProductBrandSelect = document.getElementById('edit-product-brand');
    
    if (productBrandSelect) {
        // Mevcut seçenekleri temizle (ilk seçenek hariç)
        while (productBrandSelect.children.length > 1) {
            productBrandSelect.removeChild(productBrandSelect.lastChild);
        }
        
        // Yeni markaları ekle
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand.id;
            option.textContent = brand.name;
            if (selectedBrandId && brand.id === selectedBrandId) {
                option.selected = true;
            }
            productBrandSelect.appendChild(option);
        });
        
        console.log('✅ Ürün ekleme modalı marka select güncellendi');
    }
    
    if (editProductBrandSelect) {
        // Mevcut seçenekleri temizle (ilk seçenek hariç)
        while (editProductBrandSelect.children.length > 1) {
            editProductBrandSelect.removeChild(editProductBrandSelect.lastChild);
        }
        
        // Yeni markaları ekle
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand.id;
            option.textContent = brand.name;
            if (selectedBrandId && brand.id === selectedBrandId) {
                option.selected = true;
            }
            editProductBrandSelect.appendChild(option);
        });
        
        console.log('✅ Ürün düzenleme modalı marka select güncellendi');
    }
}

// Bildirim fonksiyonu
function showNotification(message, type = 'info') {
    // Basit bildirim sistemi
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    const colors = {
        success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
    };
    
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animasyon
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Otomatik kaldırma
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 📊 VERİTABANINDAN VERİ ÇEKME FONKSİYONLARI
async function loadCategoriesData() {
    try {
        const categoriesData = await ipcRenderer.invoke('get-categories');
        categories.length = 0; // Mevcut verileri temizle
        categories.push(...categoriesData); // Yeni verileri ekle
        window.categories = categories; // Global referansı güncelle
        console.log('Kategoriler yüklendi:', categories.length);
        return categories;
    } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
        return [];
    }
}

async function loadBrandsData() {
    try {
        const brandsData = await ipcRenderer.invoke('get-brands');
        brands.length = 0; // Mevcut verileri temizle
        brands.push(...brandsData); // Yeni verileri ekle
        window.brands = brands; // Global referansı güncelle
        console.log('Markalar yüklendi:', brands.length);
        return brands;
    } catch (error) {
        console.error('Markalar yüklenirken hata:', error);
        return [];
    }
}

async function loadProductsData() {
    try {
        const productsData = await ipcRenderer.invoke('get-products');
        products.length = 0; // Mevcut verileri temizle
        products.push(...productsData); // Yeni verileri ekle
        window.products = products; // Global referansı güncelle
        console.log('Ürünler yüklendi:', products.length);
        return products;
    } catch (error) {
        console.error('Ürünler yüklenirken hata:', error);
        return [];
    }
}

// 🔄 KATEGORİ LİSTESİNİ YENİLEME FONKSİYONU
function refreshCategoryList() {
    // Kategori yönetimi modalı açık mı kontrol et
    const categoryModal = document.getElementById('categories-modal');
    if (categoryModal) {
        console.log('🔄 Kategori modalı bulundu, liste güncelleniyor...');
        
        // Modal içindeki kategori listesini bul - daha geniş selector
        const categoryList = categoryModal.querySelector('.category-list, .modal-body, tbody, table, .list-container, [class*="list"], [class*="table"]');
        
        if (categoryList) {
            console.log('📋 Liste elementi bulundu:', categoryList.tagName, categoryList.className);
            
            // Yeni kategori listesini oluştur - modal'ın gerçek yapısına uygun
            const newListHtml = categories.map(category => `
                <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 12px; font-weight: 500;">${category.name}</td>
                    <td style="padding: 12px; text-align: center;">
                        <button onclick="editCategory(${category.id})" style="background: #f3f4f6; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 8px;">Düzenle</button>
                        <button onclick="deleteCategory(${category.id})" style="background: #fef2f2; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; color: #dc2626;">Sil</button>
                    </td>
                </tr>
            `).join('');
            
            // Listeyi güncelle
            if (categoryList.tagName === 'TBODY') {
                categoryList.innerHTML = newListHtml;
                console.log('✅ Tbody güncellendi');
            } else if (categoryList.tagName === 'TABLE') {
                // TABLE elementi bulunduysa, tbody'yi bul ve güncelle
                const tbody = categoryList.querySelector('tbody');
                if (tbody) {
                    tbody.innerHTML = newListHtml;
                    console.log('✅ Tablo tbody güncellendi');
                } else {
                    // Tbody yoksa, tam tablo oluştur
                    categoryList.innerHTML = `
                        <thead style="background: #f9fafb;">
                            <tr>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Kategori Adı</th>
                                <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${newListHtml}
                        </tbody>
                    `;
                    console.log('✅ Tablo tamamen güncellendi');
                }
            } else {
                // Genel container için - modal'ın gerçek yapısına uygun
                categoryList.innerHTML = `
                    <div style="background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f9fafb;">
                                <tr>
                                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Kategori Adı</th>
                                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${newListHtml}
                            </tbody>
                        </table>
                        ${categories.length === 0 ? '<div style="text-align: center; padding: 40px; color: #9ca3af;">Henüz kategori eklenmemiş</div>' : ''}
                    </div>
                `;
                console.log('✅ Container güncellendi');
            }
        } else {
            console.log('❌ Liste elementi bulunamadı, modal içeriği:', categoryModal.innerHTML.substring(0, 200));
        }
    } else {
        console.log('❌ Kategori modalı bulunamadı');
    }
}

// 🔄 MARKA LİSTESİNİ YENİLEME FONKSİYONU
function refreshBrandList() {
    // Marka yönetimi modalı açık mı kontrol et
    const brandModal = document.getElementById('brands-modal');
    if (brandModal) {
        console.log('🔄 Marka modalı bulundu, liste güncelleniyor...');
        
        // Modal içindeki marka listesini bul - daha geniş selector
        const brandList = brandModal.querySelector('.brand-list, .modal-body, tbody, table, .list-container, [class*="list"], [class*="table"]');
        
        if (brandList) {
            console.log('📋 Liste elementi bulundu:', brandList.tagName, brandList.className);
            
            // Yeni marka listesini oluştur - modal'ın gerçek yapısına uygun
            const newListHtml = brands.map(brand => `
                <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 12px; font-weight: 500;">${brand.name}</td>
                    <td style="padding: 12px; text-align: center;">
                        <button onclick="editBrand(${brand.id})" style="background: #f3f4f6; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 8px;">Düzenle</button>
                        <button onclick="deleteBrand(${brand.id})" style="background: #fef2f2; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; color: #dc2626;">Sil</button>
                    </td>
                </tr>
            `).join('');
            
            // Listeyi güncelle
            if (brandList.tagName === 'TBODY') {
                brandList.innerHTML = newListHtml;
                console.log('✅ Tbody güncellendi');
            } else if (brandList.tagName === 'TABLE') {
                // TABLE elementi bulunduysa, tbody'yi bul ve güncelle
                const tbody = brandList.querySelector('tbody');
                if (tbody) {
                    tbody.innerHTML = newListHtml;
                    console.log('✅ Tablo tbody güncellendi');
                } else {
                    // Tbody yoksa, tam tablo oluştur
                    brandList.innerHTML = `
                        <thead style="background: #f9fafb;">
                            <tr>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Marka Adı</th>
                                <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${newListHtml}
                        </tbody>
                    `;
                    console.log('✅ Tablo tamamen güncellendi');
                }
            } else {
                // Genel container için - modal'ın gerçek yapısına uygun
                brandList.innerHTML = `
                    <div style="background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f9fafb;">
                                <tr>
                                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Marka Adı</th>
                                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${newListHtml}
                            </tbody>
                        </table>
                        ${brands.length === 0 ? '<div style="text-align: center; padding: 40px; color: #9ca3af;">Henüz marka eklenmemiş</div>' : ''}
                    </div>
                `;
                console.log('✅ Container güncellendi');
            }
        } else {
            console.log('❌ Liste elementi bulunamadı, modal içeriği:', brandModal.innerHTML.substring(0, 200));
        }
    } else {
        console.log('❌ Marka modalı bulunamadı');
    }
}

// 🗑️ KATEGORİ SİLME FONKSİYONU
async function deleteCategory(categoryId) {
    if (!categoryId) {
        showNotification('Kategori ID bulunamadı', 'error');
        return;
    }
    
    // Kategori kullanımda mı kontrol et
    const categoryInUse = products.some(p => p.category_id === categoryId);
    if (categoryInUse) {
        showNotification('Bu kategori kullanımda olduğu için silinemez', 'error');
        return;
    }
    
    if (confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
        try {
            const result = await ipcRenderer.invoke('delete-category', categoryId);
            
            if (result && result.success !== false) {
                showNotification('Kategori başarıyla silindi', 'success');
                
                console.log('🔄 Kategori silindi, veriler yenileniyor...');
                // Kategorileri yeniden yükle
                await loadCategoriesData();
                console.log('📊 Kategoriler yeniden yüklendi, liste güncelleniyor...');
                
                // Kategori modalı açıksa yeniden oluştur
                const categoryModal = document.getElementById('categories-modal');
                if (categoryModal) {
                    console.log('🔄 Kategori modalı yeniden oluşturuluyor...');
                    categoryModal.remove();
                    showCategoriesModal();
                }
                
                // Ürün ekleme modalındaki kategori select'ini güncelle
                updateCategorySelect();
                
                // Eğer dashboard görünümündeyse yenile
                if (currentView === 'dashboard') {
                    showDashboard();
                }
            } else {
                showNotification('Kategori silinirken hata oluştu', 'error');
            }
        } catch (error) {
            console.error('Kategori silme hatası:', error);
            showNotification('Kategori silinirken hata oluştu', 'error');
        }
    }
}

// 🗑️ MARKA SİLME FONKSİYONU
async function deleteBrand(brandId) {
    if (!brandId) {
        showNotification('Marka ID bulunamadı', 'error');
        return;
    }
    
    // Marka kullanımda mı kontrol et
    const brandInUse = products.some(p => p.brand_id === brandId);
    if (brandInUse) {
        showNotification('Bu marka kullanımda olduğu için silinemez', 'error');
        return;
    }
    
    if (confirm('Bu markayı silmek istediğinizden emin misiniz?')) {
        try {
            const result = await ipcRenderer.invoke('delete-brand', brandId);
            
            if (result && result.success !== false) {
                showNotification('Marka başarıyla silindi', 'success');
                
                // Markaları yeniden yükle
                await loadBrandsData();
                
                // Marka modalı açıksa yeniden oluştur
                const brandModal = document.getElementById('brands-modal');
                if (brandModal) {
                    console.log('🔄 Marka modalı yeniden oluşturuluyor...');
                    brandModal.remove();
                    showBrandsModal();
                }
                
                // Ürün ekleme modalındaki marka select'ini güncelle
                updateBrandSelect();
                
                // Eğer dashboard görünümündeyse yenile
                if (currentView === 'dashboard') {
                    showDashboard();
                }
            } else {
                showNotification('Marka silinirken hata oluştu', 'error');
            }
        } catch (error) {
            console.error('Marka silme hatası:', error);
            showNotification('Marka silinirken hata oluştu', 'error');
        }
    }
}

// Ürün listesini yenile
async function refreshProductList() {
    try {
        console.log('🔄 Ürün listesi yenileniyor...');
        await loadProductsData();
        
        // Eğer liste görünümündeyse yenile
        if (currentView === 'list') {
            showListView();
        }
        
        console.log('✅ Ürün listesi yenilendi');
    } catch (error) {
        console.error('Ürün listesi yenilenemedi:', error);
    }
}

// Global fonksiyonlar
window.showAddCategoryModal = showAddCategoryModal;
window.showAddBrandModal = showAddBrandModal;
window.closeAddCategoryModal = closeAddCategoryModal;
window.closeAddBrandModal = closeAddBrandModal;
window.showNotification = showNotification;
window.deleteCategory = deleteCategory;
window.deleteBrand = deleteBrand;
window.refreshCategoryList = refreshCategoryList;
window.refreshBrandList = refreshBrandList;
window.refreshProductList = refreshProductList;

console.log('🚀 Modern Ürün Yönetim Modülü v2.0 yüklendi!');