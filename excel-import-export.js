// XLSX modülünü güvenli şekilde yükle
if (typeof window.XLSX === 'undefined') {
    let XLSX;
    try {
        XLSX = require('xlsx');
        window.XLSX = XLSX; // Global olarak sakla
    } catch (error) {
        console.error('XLSX modülü yüklenemedi:', error);
        window.XLSX = null;
    }
}

// Excel ile toplu ürün yükleme modalını göster
function showExcelImportModal() {
    const modalHtml = `
        <div id="excel-import-modal" class="modal active" style="z-index: 9999;">
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px 12px 0 0; color: white;">
                    <h3 style="margin: 0; font-size: 20px; font-weight: 600;">📊 Excel ile Toplu Ürün Yükleme</h3>
                </div>
                
                <div style="padding: 24px;">
                    <!-- Excel Şablonu İndirme -->
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 2px solid #e9ecef;">
                        <h4 style="margin: 0 0 12px 0; color: #495057; display: flex; align-items: center; gap: 8px;">
                            📋 Excel Şablonu
                        </h4>
                        <p style="margin: 0 0 16px 0; color: #6c757d; font-size: 14px;">
                            Önce Excel şablonunu indirin, ürün bilgilerinizi doldurun ve sonra yükleyin.
                        </p>
                        <button onclick="downloadExcelTemplate()" 
                                style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 8px;">
                            📥 Şablon İndir
                        </button>
                    </div>
                    
                    <!-- Excel Dosya Yükleme -->
                    <div style="background: #fff; padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 2px solid #e9ecef;">
                        <h4 style="margin: 0 0 12px 0; color: #495057; display: flex; align-items: center; gap: 8px;">
                            📤 Excel Dosyası Yükle
                        </h4>
                        <p style="margin: 0 0 16px 0; color: #6c757d; font-size: 14px;">
                            Doldurduğunuz Excel dosyasını seçin ve yükleyin.
                        </p>
                        
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <input type="file" id="excel-file-input" accept=".xlsx,.xls" 
                                   style="flex: 1; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; outline: none;"
                                   onchange="handleExcelFileSelect(event)">
                            <button onclick="document.getElementById('excel-file-input').click()" 
                                    style="padding: 12px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                                📁 Dosya Seç
                            </button>
                        </div>
                        
                        <div id="excel-file-info" style="margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; display: none;">
                            <div style="display: flex; align-items: center; gap: 8px; color: #495057;">
                                <span>📄</span>
                                <span id="file-name"></span>
                                <span style="color: #6c757d; font-size: 12px;">(<span id="file-size"></span>)</span>
                        </div>
                        </div>
                    </div>
                    
                    <!-- Önizleme ve Yükleme -->
                    <div id="excel-preview-section" style="display: none;">
                        <div style="background: #fff; padding: 20px; border-radius: 12px; border: 2px solid #e9ecef;">
                            <h4 style="margin: 0 0 12px 0; color: #495057; display: flex; align-items: center; gap: 8px;">
                                👀 Veri Önizlemesi
                            </h4>
                            <p style="margin: 0 0 16px 0; color: #6c757d; font-size: 14px;">
                                Yüklenecek ürünleri kontrol edin. Hatalı satırlar kırmızı renkte gösterilir.
                            </p>
                            
                            <div id="excel-preview-table" style="max-height: 300px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px;">
                                <!-- Önizleme tablosu buraya gelecek -->
                            </div>
                            
                            <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <span style="color: #28a745; font-weight: 500;">✅ Geçerli: </span>
                                    <span id="valid-count" style="color: #28a745; font-weight: 600;">0</span>
                                    <span style="margin-left: 16px; color: #dc3545; font-weight: 500;">❌ Hatalı: </span>
                                    <span id="error-count" style="color: #dc3545; font-weight: 600;">0</span>
                                </div>
                                <button onclick="importProductsFromExcel()" 
                                        style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500;">
                                    🚀 Ürünleri Yükle
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Yardım -->
                    <div style="background: #e7f3ff; padding: 16px; border-radius: 8px; border-left: 4px solid #007bff;">
                        <h5 style="margin: 0 0 8px 0; color: #0056b3;">💡 Yardım</h5>
                        <ul style="margin: 0; padding-left: 20px; color: #0056b3; font-size: 14px;">
                            <li>Excel dosyasında sütun başlıkları esas alınır</li>
                            <li>Ürün Adı ve Satış Fiyatı zorunlu alanlardır</li>
                            <li>Fiyatlar sayısal değer olmalıdır</li>
                            <li>Kategori ve Marka ID'leri kullanılır</li>
                            <li>Boş satırlar otomatik atlanır</li>
                        </ul>
                    </div>
                </div>
                
                <div style="padding: 0 24px 24px 24px; display: flex; gap: 12px; justify-content: flex-end;">
                    <button onclick="closeExcelImportModal()" 
                            style="padding: 12px 24px; background: #f3f4f6; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                        İptal
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    loadCategoriesAndBrandsForExcelImport();
}

// Kategori ve marka verilerini yükle
async function loadCategoriesAndBrandsForExcelImport() {
    try {
        // Kategori ve marka verilerini global değişkenlere yükle
        window.categories = await ipcRenderer.invoke('get-categories');
        window.brands = await ipcRenderer.invoke('get-brands');
        console.log('Excel Import - Kategori verileri yüklendi:', window.categories);
        console.log('Excel Import - Marka verileri yüklendi:', window.brands);
        
        // Eğer kategori/marka yoksa uyarı ver
        if (!window.categories || window.categories.length === 0) {
            console.warn('UYARI: Hiç kategori bulunamadı! Excel import işleminde kategori eşleştirmesi yapılamayacak.');
        }
        if (!window.brands || window.brands.length === 0) {
            console.warn('UYARI: Hiç marka bulunamadı! Excel import işleminde marka eşleştirmesi yapılamayacak.');
        }
        
        // Debug: Marka verilerini detaylı kontrol et
        if (window.brands && window.brands.length > 0) {
            console.log('Excel Import - Marka detayları:');
            window.brands.forEach((brand, index) => {
                console.log(`  ${index + 1}. ${brand.name} (ID: ${brand.id})`);
            });
        }
    } catch (error) {
        console.error('Kategori ve marka verileri yüklenirken hata:', error);
    }
}

// Excel şablonunu indir
function downloadExcelTemplate() {
    if (!window.XLSX) {
        showNotification('XLSX modülü yüklenemedi', 'error');
        return;
    }
    
    const templateData = [
        {
            'Ürün Adı': 'Örnek Ürün 1',
            'Ürün Kodu': 'KOD001',
            'Barkod': '1234567890123',
            'Birim': 'adet',
            'Kategori': 'Elektronik',
            'Marka': 'Samsung',
            'Stok': '100',
            'Alış Fiyatı': '50.00',
            'Satış Fiyatı': '75.00',
            'KDV Oranı': '20',
            'Minimum Stok': '10',
            'Açıklama': 'Örnek ürün açıklaması'
        },
        {
            'Ürün Adı': 'Örnek Ürün 2',
            'Ürün Kodu': 'KOD002',
            'Barkod': '1234567890124',
            'Birim': 'kg',
            'Kategori': 'Gıda',
            'Marka': 'Nestle',
            'Stok': '50',
            'Alış Fiyatı': '25.00',
            'Satış Fiyatı': '40.00',
            'KDV Oranı': '20',
            'Minimum Stok': '5',
            'Açıklama': 'İkinci örnek ürün'
        }
    ];
    
    const ws = window.XLSX.utils.json_to_sheet(templateData);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');
    
    // Electron'da dosya indirme için alternatif yöntem
    const wbout = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    
    // Dosya indirme linki oluştur
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'urun_import_sablonu.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('✅ Excel şablonu indirildi!', 'success');
}

// Excel dosyası seçildiğinde
function handleExcelFileSelect(event) {
    if (!window.XLSX) {
        showNotification('XLSX modülü yüklenemedi', 'error');
        return;
    }
    
    const file = event.target.files[0];
    if (!file) return;
    
    // Dosya bilgilerini göster
    const fileInfo = document.getElementById('excel-file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.style.display = 'block';
    
    // Excel dosyasını oku
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = window.XLSX.read(data, { type: 'array' });
            
            // İlk sayfayı al
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // JSON formatına çevir
            const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length < 2) {
                showNotification('❌ Excel dosyası boş veya geçersiz!', 'error');
                return;
            }
            
            // İlk satır başlık olmalı
            const headers = jsonData[0];
            const rows = jsonData.slice(1);
            
            // Veriyi işle ve önizleme göster
            processExcelData(headers, rows);
            
        } catch (error) {
            console.error('Excel okuma hatası:', error);
            showNotification('❌ Excel dosyası okunamadı!', 'error');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// Excel verilerini işle ve önizleme göster
async function processExcelData(headers, rows) {
    const previewTable = document.getElementById('excel-preview-table');
    const validCount = document.getElementById('valid-count');
    const errorCount = document.getElementById('error-count');
    const previewSection = document.getElementById('excel-preview-section');
    
    let validRows = 0;
    let errorRows = 0;
    
    // Sütun indekslerini bul
    const columnIndexes = {
        name: headers.findIndex(h => h && h.toString().toLowerCase().includes('ürün adı')),
        code: headers.findIndex(h => h && h.toString().toLowerCase().includes('kod')),
        barcode: headers.findIndex(h => h && h.toString().toLowerCase().includes('barkod')),
        unit: headers.findIndex(h => h && h.toString().toLowerCase().includes('birim')),
        category: headers.findIndex(h => h && h.toString().toLowerCase().includes('kategori')),
        brand: headers.findIndex(h => h && h.toString().toLowerCase().includes('marka')),
        stock: headers.findIndex(h => h && h.toString().toLowerCase().includes('stok')),
        purchase_price: headers.findIndex(h => h && h.toString().toLowerCase().includes('alış')),
        sale_price: headers.findIndex(h => h && h.toString().toLowerCase().includes('satış')),
        vat_rate: headers.findIndex(h => h && h.toString().toLowerCase().includes('kdv')),
        min_stock: headers.findIndex(h => h && h.toString().toLowerCase().includes('minimum')),
        description: headers.findIndex(h => h && h.toString().toLowerCase().includes('açıklama'))
    };
    
    // Tablo HTML'ini oluştur
    let tableHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead style="background: #f8f9fa; position: sticky; top: 0;">
                <tr>
                    ${headers.map(h => `<th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600;">${h || ''}</th>`).join('')}
                    <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: center; font-weight: 600;">Durum</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Satırları işle
    rows.forEach((row, index) => {
        if (!row || row.every(cell => !cell)) return; // Boş satırları atla
        
        const errors = validateProductRow(row, columnIndexes);
        const isValid = errors.length === 0;
        
        if (isValid) validRows++;
        else errorRows++;
        
        const rowStyle = isValid ? '' : 'background: #fee2e2; color: #dc2626;';
        
        tableHtml += `
            <tr style="${rowStyle}">
                ${row.map(cell => `<td style="padding: 8px; border: 1px solid #e5e7eb;">${cell || ''}</td>`).join('')}
                <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">
                    ${isValid ? '✅' : `❌ ${errors.join(', ')}`}
                </td>
            </tr>
        `;
    });
    
    tableHtml += '</tbody></table>';
    
    previewTable.innerHTML = tableHtml;
    validCount.textContent = validRows;
    errorCount.textContent = errorRows;
    previewSection.style.display = 'block';
    
    // Global değişkenlere kaydet
    window.excelData = { headers, rows, columnIndexes };
}

// Ürün satırını doğrula
function validateProductRow(row, columnIndexes) {
    const errors = [];
    
    // Ürün adı zorunlu
    if (columnIndexes.name >= 0 && (!row[columnIndexes.name] || row[columnIndexes.name].toString().trim() === '')) {
        errors.push('Ürün adı boş');
    }
    
    // Satış fiyatı zorunlu ve sayısal
    if (columnIndexes.sale_price >= 0) {
        const salePrice = row[columnIndexes.sale_price];
        if (!salePrice || isNaN(parseFloat(salePrice)) || parseFloat(salePrice) <= 0) {
            errors.push('Geçersiz satış fiyatı');
        }
    }
    
    // Alış fiyatı sayısal olmalı
    if (columnIndexes.purchase_price >= 0 && row[columnIndexes.purchase_price]) {
        const purchasePrice = row[columnIndexes.purchase_price];
        if (isNaN(parseFloat(purchasePrice)) || parseFloat(purchasePrice) < 0) {
            errors.push('Geçersiz alış fiyatı');
        }
    }
    
    // Stok sayısal olmalı
    if (columnIndexes.stock >= 0 && row[columnIndexes.stock]) {
        const stock = row[columnIndexes.stock];
        if (isNaN(parseFloat(stock)) || parseFloat(stock) < 0) {
            errors.push('Geçersiz stok');
        }
    }
    
    return errors;
}

// Excel'den ürünleri import et
async function importProductsFromExcel() {
    if (!window.excelData) {
        showNotification('❌ Önce Excel dosyasını seçin!', 'error');
        return;
    }
    
    const { headers, rows, columnIndexes } = window.excelData;
    let successCount = 0;
    let errorCount = 0;
    
    try {
        // Kategori/marka cache yoksa taze çek
        try {
            if ((!window.categories || window.categories.length === 0) && typeof ipcRenderer !== 'undefined') {
                window.categories = await ipcRenderer.invoke('get-categories');
            }
            if ((!window.brands || window.brands.length === 0) && typeof ipcRenderer !== 'undefined') {
                window.brands = await ipcRenderer.invoke('get-brands');
            }
        } catch (preloadErr) {
            console.warn('Kategori/marka preload hata:', preloadErr);
        }
        for (const [index, row] of rows.entries()) {
            if (!row || row.every(cell => !cell)) continue; // Boş satırları atla
            
            const errors = validateProductRow(row, columnIndexes);
            if (errors.length > 0) {
                errorCount++;
                continue;
            }
            
            try {
                // Kategori ismini ID'ye çevir
                let category_id = null;
                if (columnIndexes.category >= 0 && row[columnIndexes.category]) {
                    const categoryName = row[columnIndexes.category]?.toString().trim();
                    if (categoryName && window.categories && window.categories.length > 0) {
                        let category = window.categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
                        
                        if (!category) {
                            // Kategori bulunamadı, otomatik oluştur
                            console.log(`Kategori bulunamadı, oluşturuluyor: "${categoryName}"`);
                            try {
                                const newCategory = await ipcRenderer.invoke('add-category', {
                                    name: categoryName,
                                    icon: '📦',
                                    color: '#667eea'
                                });
                                category_id = newCategory.id;
                                
                                // Global categories array'ini güncelle
                                window.categories.push(newCategory);
                                console.log(`Kategori oluşturuldu: "${categoryName}" (ID: ${newCategory.id})`);
                            } catch (error) {
                                console.error(`Kategori oluşturulurken hata: "${categoryName}"`, error);
                            }
                        } else {
                            category_id = category.id;
                        }
                    }
                }
                
                // Marka ismini ID'ye çevir
                let brand_id = null;
                if (columnIndexes.brand >= 0 && row[columnIndexes.brand]) {
                    const brandName = row[columnIndexes.brand]?.toString().trim();
                    console.log(`Marka eşleştirmesi: "${brandName}"`);
                    
                    if (brandName && window.brands && window.brands.length > 0) {
                        // Önce tam eşleşme ara
                        let brand = window.brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
                        
                        // Tam eşleşme yoksa kısmi eşleşme ara
                        if (!brand) {
                            brand = window.brands.find(b => 
                                b.name.toLowerCase().includes(brandName.toLowerCase()) || 
                                brandName.toLowerCase().includes(b.name.toLowerCase())
                            );
                        }
                        
                        if (!brand) {
                            // Marka bulunamadı, otomatik oluştur
                            console.log(`Marka bulunamadı, oluşturuluyor: "${brandName}"`);
                            try {
                                const newBrand = await ipcRenderer.invoke('add-brand', {
                                    name: brandName,
                                    icon: '🏷️',
                                    color: '#667eea'
                                });
                                brand_id = newBrand.id;
                                
                                // Global brands array'ini güncelle
                                window.brands.push(newBrand);
                                console.log(`Marka oluşturuldu: "${brandName}" (ID: ${newBrand.id})`);
                            } catch (error) {
                                console.error(`Marka oluşturulurken hata: "${brandName}"`, error);
                            }
                        } else {
                            brand_id = brand.id;
                            console.log(`Marka eşleştirildi: "${brandName}" -> "${brand.name}" (ID: ${brand.id})`);
                        }
                    } else {
                        console.warn(`Marka eşleştirilemedi: "${brandName}" - Marka verileri yok veya boş`);
                    }
                }
                
                const productData = {
                    name: row[columnIndexes.name]?.toString().trim() || '',
                    code: columnIndexes.code >= 0 ? row[columnIndexes.code]?.toString().trim() || null : null,
                    barcode: columnIndexes.barcode >= 0 ? row[columnIndexes.barcode]?.toString().trim() || null : null,
                    unit: columnIndexes.unit >= 0 ? row[columnIndexes.unit]?.toString().trim() || 'adet' : 'adet',
                    category_id: category_id,
                    brand_id: brand_id,
                    stock: columnIndexes.stock >= 0 ? parseFloat(row[columnIndexes.stock]) || 0 : 0,
                    purchase_price: columnIndexes.purchase_price >= 0 ? parseFloat(row[columnIndexes.purchase_price]) || 0 : 0,
                    sale_price: parseFloat(row[columnIndexes.sale_price]),
                    vat_rate: columnIndexes.vat_rate >= 0 ? parseFloat(row[columnIndexes.vat_rate]) || 20 : 20,
                    min_stock: columnIndexes.min_stock >= 0 ? parseFloat(row[columnIndexes.min_stock]) || 0 : 0,
                    description: columnIndexes.description >= 0 ? row[columnIndexes.description]?.toString().trim() || null : null
                };
                
                // Barkod kontrolü - aynı barkoda sahip ürün var mı?
                if (productData.barcode) {
                    const existingProduct = await ipcRenderer.invoke('get-product-by-barcode', productData.barcode);
                    if (existingProduct) {
                        // Mevcut ürünü güncelle
                        console.log(`Aynı barkoda sahip ürün bulundu, güncelleniyor: ${productData.barcode}`);
                        await ipcRenderer.invoke('update-product', {
                            id: existingProduct.id,
                            ...productData
                        });
                        console.log(`Ürün güncellendi: ${productData.name} (Barkod: ${productData.barcode})`);
                    } else {
                        // Yeni ürün ekle
                        await ipcRenderer.invoke('add-product', productData);
                        console.log(`Yeni ürün eklendi: ${productData.name} (Barkod: ${productData.barcode})`);
                    }
                } else {
                    // Barkod yoksa direkt ekle
                    await ipcRenderer.invoke('add-product', productData);
                    console.log(`Ürün eklendi: ${productData.name}`);
                }
                
                successCount++;
                
            } catch (error) {
                console.error(`Satır ${index + 2} hatası:`, error);
                errorCount++;
            }
        }
        
        // Sonuç mesajı
        if (successCount > 0) {
            showNotification(`✅ ${successCount} ürün başarıyla yüklendi!`, 'success');
            
            // Ürün/Kategori/Marka verilerini güncelle
            try {
                if (typeof loadCategoriesData === 'function') await loadCategoriesData();
                if (typeof loadBrandsData === 'function') await loadBrandsData();
                if (typeof loadProductsData === 'function') await loadProductsData();
            } catch (refreshErr) {
                console.warn('Excel sonrası veri yenileme uyarısı:', refreshErr);
            }
            
            // Ürün listesini yenile (UI güncellemesi için)
            if (typeof createSimpleProductsList === 'function') {
                // Veritabanından fresh data çek
                const freshProducts = await ipcRenderer.invoke('get-products');
                const container = document.getElementById('products-list-container');
                if (container) {
                    container.innerHTML = createSimpleProductsList(freshProducts);
                }
                console.log('Ürün listesi Excel import sonrası yenilendi:', freshProducts.length, 'ürün');
            }
            
            // Ürün yönetimi modalı açıksa, filtre dropdownlarını da tazelemek için yeniden oluştur
            const pmModal = document.getElementById('product-management-modal');
            if (pmModal && typeof showProductManagement === 'function') {
                closeProductModal('product-management-modal');
                setTimeout(() => { try { showProductManagement(); } catch (e) {} }, 50);
            }

            // Modal'ı kapat
            closeExcelImportModal();
        }
        
        if (errorCount > 0) {
            showNotification(`⚠️ ${errorCount} ürün yüklenemedi!`, 'warning');
        }
        
    } catch (error) {
        console.error('Import hatası:', error);
        showNotification('❌ Ürün yükleme sırasında hata oluştu!', 'error');
    }
}

// Modal'ı kapat
function closeExcelImportModal() {
    const modal = document.getElementById('excel-import-modal');
    if (modal) {
        modal.remove();
    }
}

// Dosya boyutunu formatla
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Excel ile müşteri import modalını göster
function showExcelCustomerImportModal() {
    const modalHtml = `
        <div id="excel-customer-import-modal" class="modal active" style="z-index: 9999;">
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px 12px 0 0; color: white; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 20px; font-weight: 600;">📊 Excel ile Müşteri Import</h3>
                    <button onclick="event.stopPropagation(); closeExcelCustomerImportModal()" 
                            style="background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 24px; transition: all 0.3s;"
                            onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                            onmouseout="this.style.background='rgba(255,255,255,0.2)'"
                            title="Kapat">
                        ×
                    </button>
                </div>
                
                <div style="padding: 24px;">
                    <!-- Şablon İndirme -->
                    <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 16px;">📥 Excel Şablonu</h4>
                        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">Müşteri bilgilerini Excel şablonuna göre doldurun ve yükleyin.</p>
                        <button onclick="downloadCustomerExcelTemplate()" 
                                style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 8px;">
                            📥 Şablon İndir
                        </button>
                    </div>
                    
                    <!-- Dosya Seçimi -->
                    <div style="background: white; border: 2px dashed #d1d5db; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                        <input type="file" id="customer-excel-file" accept=".xlsx,.xls" 
                               style="display: none;" onchange="handleCustomerExcelFileSelect(event)">
                        <div style="font-size: 48px; margin-bottom: 12px;">📁</div>
                        <h4 style="margin: 0 0 8px 0; color: #374151;">Excel Dosyasını Seçin</h4>
                        <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">.xlsx veya .xls formatında dosya yükleyin</p>
                        <button onclick="document.getElementById('customer-excel-file').click()" 
                                style="background: #f3f4f6; color: #374151; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500;">
                            📁 Dosya Seç
                        </button>
                    </div>
                    
                    <!-- Önizleme -->
                    <div id="customer-excel-preview-section" style="display: none;">
                        <h4 style="margin: 0 0 16px 0; color: #374151; font-size: 16px;">📋 Veri Önizleme</h4>
                        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                            <div id="customer-excel-preview-table" style="max-height: 300px; overflow-y: auto;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
                            <div style="display: flex; gap: 20px; font-size: 14px;">
                                <span style="color: #10b981;">✅ Geçerli: <strong id="customer-valid-count">0</strong></span>
                                <span style="color: #ef4444;">❌ Hatalı: <strong id="customer-error-count">0</strong></span>
                            </div>
                            <button onclick="importCustomersFromExcel()" 
                                    style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500;">
                                📤 Müşterileri Yükle
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Müşteri Excel şablonunu indir
function downloadCustomerExcelTemplate() {
    if (!window.XLSX) {
        showNotification('XLSX modülü yüklenemedi', 'error');
        return;
    }
    
    const templateData = [
        {
            'Müşteri Adı': 'Ahmet Yılmaz',
            'Müşteri Kodu': 'MUST001',
            'Telefon': '0532 123 45 67',
            'GSM': '0532 123 45 67',
            'Adres': 'İstanbul, Türkiye',
            'Kredi Limiti': '1000',
            'Vergi Dairesi': 'İstanbul VD',
            'Vergi Numarası': '1234567890',
            'TC Numarası': '12345678901',
            'E-posta': 'ahmet@example.com',
            'Web Sitesi': 'www.example.com',
            'Müşteri Tipi': 'individual',
            'Fatura Adresi': 'İstanbul, Türkiye',
            'Fatura Şehri': 'İstanbul',
            'Fatura İlçesi': 'Kadıköy',
            'Posta Kodu': '34710',
            'Yetkili Kişi': 'Ahmet Yılmaz',
            'Yetkili Telefon': '0532 123 45 67',
            'Hesap Kodu': '120.001',
            'Maliyet Merkezi': 'Ana'
        },
        {
            'Müşteri Adı': 'ABC Şirketi Ltd.',
            'Müşteri Kodu': 'MUST002',
            'Telefon': '0212 555 66 77',
            'GSM': '0533 444 55 66',
            'Adres': 'Ankara, Türkiye',
            'Kredi Limiti': '5000',
            'Vergi Dairesi': 'Ankara VD',
            'Vergi Numarası': '9876543210',
            'TC Numarası': '',
            'E-posta': 'info@abc.com',
            'Web Sitesi': 'www.abc.com',
            'Müşteri Tipi': 'company',
            'Fatura Adresi': 'Ankara, Türkiye',
            'Fatura Şehri': 'Ankara',
            'Fatura İlçesi': 'Çankaya',
            'Posta Kodu': '06420',
            'Yetkili Kişi': 'Mehmet Demir',
            'Yetkili Telefon': '0533 444 55 66',
            'Hesap Kodu': '120.002',
            'Maliyet Merkezi': 'Ana'
        }
    ];
    
    const ws = window.XLSX.utils.json_to_sheet(templateData);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Müşteriler');
    
    // Electron'da dosya indirme için alternatif yöntem
    const wbout = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    
    // Dosya indirme linki oluştur
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'musteri_import_sablonu.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('✅ Müşteri Excel şablonu indirildi!', 'success');
}

// Müşteri Excel dosyası seçildiğinde
function handleCustomerExcelFileSelect(event) {
    if (!window.XLSX) {
        showNotification('XLSX modülü yüklenemedi', 'error');
        return;
    }
    
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = window.XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length < 2) {
                showNotification('❌ Excel dosyası boş veya geçersiz!', 'error');
                return;
            }
            
            const headers = jsonData[0];
            const rows = jsonData.slice(1);
            
            // Veriyi işle ve önizleme göster
            processCustomerExcelData(headers, rows);
            
        } catch (error) {
            console.error('Excel okuma hatası:', error);
            showNotification('❌ Excel dosyası okunamadı!', 'error');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// Müşteri Excel verilerini işle ve önizleme göster
async function processCustomerExcelData(headers, rows) {
    const previewTable = document.getElementById('customer-excel-preview-table');
    const validCount = document.getElementById('customer-valid-count');
    const errorCount = document.getElementById('customer-error-count');
    const previewSection = document.getElementById('customer-excel-preview-section');
    
    let validRows = 0;
    let errorRows = 0;
    
    // Sütun indekslerini bul
    const columnIndexes = {
        name: headers.findIndex(h => h && h.toString().toLowerCase().includes('müşteri adı')),
        code: headers.findIndex(h => h && h.toString().toLowerCase().includes('müşteri kodu')),
        phone: headers.findIndex(h => h && h.toString().toLowerCase().includes('telefon')),
        gsm: headers.findIndex(h => h && h.toString().toLowerCase().includes('gsm')),
        address: headers.findIndex(h => h && h.toString().toLowerCase().includes('adres')),
        credit_limit: headers.findIndex(h => h && h.toString().toLowerCase().includes('kredi limiti')),
        tax_office: headers.findIndex(h => h && h.toString().toLowerCase().includes('vergi dairesi')),
        tax_number: headers.findIndex(h => h && h.toString().toLowerCase().includes('vergi numarası')),
        tc_number: headers.findIndex(h => h && h.toString().toLowerCase().includes('tc numarası')),
        email: headers.findIndex(h => h && h.toString().toLowerCase().includes('e-posta')),
        website: headers.findIndex(h => h && h.toString().toLowerCase().includes('web sitesi')),
        customer_type: headers.findIndex(h => h && h.toString().toLowerCase().includes('müşteri tipi')),
        invoice_address: headers.findIndex(h => h && h.toString().toLowerCase().includes('fatura adresi')),
        invoice_city: headers.findIndex(h => h && h.toString().toLowerCase().includes('fatura şehri')),
        invoice_district: headers.findIndex(h => h && h.toString().toLowerCase().includes('fatura ilçesi')),
        invoice_postal_code: headers.findIndex(h => h && h.toString().toLowerCase().includes('posta kodu')),
        contact_person: headers.findIndex(h => h && h.toString().toLowerCase().includes('yetkili kişi')),
        contact_phone: headers.findIndex(h => h && h.toString().toLowerCase().includes('yetkili telefon')),
        account_code: headers.findIndex(h => h && h.toString().toLowerCase().includes('hesap kodu')),
        cost_center: headers.findIndex(h => h && h.toString().toLowerCase().includes('maliyet merkezi'))
    };
    
    // Tablo HTML'ini oluştur
    let tableHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead style="background: #f8f9fa; position: sticky; top: 0;">
                <tr>
                    ${headers.map(h => `<th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600;">${h || ''}</th>`).join('')}
                    <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: center; font-weight: 600;">Durum</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Satırları işle
    rows.forEach((row, index) => {
        if (!row || row.every(cell => !cell)) return; // Boş satırları atla
        
        const errors = validateCustomerRow(row, columnIndexes);
        const isValid = errors.length === 0;
        
        if (isValid) validRows++;
        else errorRows++;
        
        const rowStyle = isValid ? '' : 'background: #fee2e2; color: #dc2626;';
        
        tableHtml += `
            <tr style="${rowStyle}">
                ${row.map(cell => `<td style="padding: 8px; border: 1px solid #e5e7eb;">${cell || ''}</td>`).join('')}
                <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">
                    ${isValid ? '✅' : `❌ ${errors.join(', ')}`}
                </td>
            </tr>
        `;
    });
    
    tableHtml += '</tbody></table>';
    
    previewTable.innerHTML = tableHtml;
    validCount.textContent = validRows;
    errorCount.textContent = errorRows;
    previewSection.style.display = 'block';
    
    // Global değişkenlere kaydet
    window.customerExcelData = { headers, rows, columnIndexes };
}

// Müşteri satırını doğrula
function validateCustomerRow(row, columnIndexes) {
    const errors = [];
    
    // Müşteri adı zorunlu
    if (columnIndexes.name >= 0 && (!row[columnIndexes.name] || row[columnIndexes.name].toString().trim() === '')) {
        errors.push('Müşteri adı boş');
    }
    
    // Kredi limiti kontrolü
    if (columnIndexes.credit_limit >= 0 && row[columnIndexes.credit_limit]) {
        const creditLimit = row[columnIndexes.credit_limit];
        if (isNaN(parseFloat(creditLimit)) || parseFloat(creditLimit) < 0) {
            errors.push('Geçersiz kredi limiti');
        }
    }
    
    // E-posta kontrolü
    if (columnIndexes.email >= 0 && row[columnIndexes.email]) {
        const email = row[columnIndexes.email].toString().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push('Geçersiz e-posta');
        }
    }
    
    return errors;
}

// Excel'den müşterileri import et
async function importCustomersFromExcel() {
    if (!window.customerExcelData) {
        showNotification('❌ Önce Excel dosyasını seçin!', 'error');
        return;
    }
    
    const { headers, rows, columnIndexes } = window.customerExcelData;
    let successCount = 0;
    let errorCount = 0;
    
    try {
        for (const [index, row] of rows.entries()) {
            if (!row || row.every(cell => !cell)) continue; // Boş satırları atla
            
            const errors = validateCustomerRow(row, columnIndexes);
            if (errors.length > 0) {
                errorCount++;
                continue;
            }
            
            try {
                const customerData = {
                    name: row[columnIndexes.name]?.toString().trim() || '',
                    code: columnIndexes.code >= 0 ? row[columnIndexes.code]?.toString().trim() || null : null,
                    phone: columnIndexes.phone >= 0 ? row[columnIndexes.phone]?.toString().trim() || null : null,
                    gsm: columnIndexes.gsm >= 0 ? row[columnIndexes.gsm]?.toString().trim() || null : null,
                    address: columnIndexes.address >= 0 ? row[columnIndexes.address]?.toString().trim() || null : null,
                    credit_limit: columnIndexes.credit_limit >= 0 ? parseFloat(row[columnIndexes.credit_limit]) || 500 : 500,
                    tax_office: columnIndexes.tax_office >= 0 ? row[columnIndexes.tax_office]?.toString().trim() || null : null,
                    tax_number: columnIndexes.tax_number >= 0 ? row[columnIndexes.tax_number]?.toString().trim() || null : null,
                    tc_number: columnIndexes.tc_number >= 0 ? row[columnIndexes.tc_number]?.toString().trim() || null : null,
                    email: columnIndexes.email >= 0 ? row[columnIndexes.email]?.toString().trim() || null : null,
                    website: columnIndexes.website >= 0 ? row[columnIndexes.website]?.toString().trim() || null : null,
                    customer_type: columnIndexes.customer_type >= 0 ? (row[columnIndexes.customer_type]?.toString().trim() || 'individual') : 'individual',
                    invoice_address: columnIndexes.invoice_address >= 0 ? row[columnIndexes.invoice_address]?.toString().trim() || null : null,
                    invoice_city: columnIndexes.invoice_city >= 0 ? row[columnIndexes.invoice_city]?.toString().trim() || null : null,
                    invoice_district: columnIndexes.invoice_district >= 0 ? row[columnIndexes.invoice_district]?.toString().trim() || null : null,
                    invoice_postal_code: columnIndexes.invoice_postal_code >= 0 ? row[columnIndexes.invoice_postal_code]?.toString().trim() || null : null,
                    contact_person: columnIndexes.contact_person >= 0 ? row[columnIndexes.contact_person]?.toString().trim() || null : null,
                    contact_phone: columnIndexes.contact_phone >= 0 ? row[columnIndexes.contact_phone]?.toString().trim() || null : null,
                    account_code: columnIndexes.account_code >= 0 ? row[columnIndexes.account_code]?.toString().trim() || null : null,
                    cost_center: columnIndexes.cost_center >= 0 ? row[columnIndexes.cost_center]?.toString().trim() || null : null
                };
                
                await ipcRenderer.invoke('add-customer', customerData);
                successCount++;
                console.log(`Müşteri eklendi: ${customerData.name}`);
                
            } catch (error) {
                console.error(`Satır ${index + 2} hatası:`, error);
                errorCount++;
            }
        }
        
        // Sonuç mesajı
        if (successCount > 0) {
            showNotification(`✅ ${successCount} müşteri başarıyla yüklendi!`, 'success');
            
            // Müşteri listesini güncelle
            if (typeof loadCustomers === 'function') {
                await loadCustomers();
            }
            
            // Modal'ı kapat
            closeExcelCustomerImportModal();
        }
        
        if (errorCount > 0) {
            showNotification(`⚠️ ${errorCount} müşteri yüklenemedi!`, 'warning');
        }
        
    } catch (error) {
        console.error('Import hatası:', error);
        showNotification('❌ Müşteri yükleme sırasında hata oluştu!', 'error');
    }
}

// Müşteri import modal'ı kapat
function closeExcelCustomerImportModal() {
    const modal = document.getElementById('excel-customer-import-modal');
    if (modal) {
        modal.remove();
    }
}

// Global fonksiyonları window'a ekle
window.showExcelImportModal = showExcelImportModal;
window.downloadExcelTemplate = downloadExcelTemplate;
window.handleExcelFileSelect = handleExcelFileSelect;
window.importProductsFromExcel = importProductsFromExcel;
window.closeExcelImportModal = closeExcelImportModal;

// Müşteri import fonksiyonları
window.showExcelCustomerImportModal = showExcelCustomerImportModal;
window.downloadCustomerExcelTemplate = downloadCustomerExcelTemplate;
window.handleCustomerExcelFileSelect = handleCustomerExcelFileSelect;
window.importCustomersFromExcel = importCustomersFromExcel;
window.closeExcelCustomerImportModal = closeExcelCustomerImportModal;
