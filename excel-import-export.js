const XLSX = require('xlsx');

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
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');
    
    // Electron'da dosya indirme için alternatif yöntem
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
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
            const workbook = XLSX.read(data, { type: 'array' });
            
            // İlk sayfayı al
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // JSON formatına çevir
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
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
            
            // Ürün modülünü güncelle
            if (typeof loadProducts === 'function') {
                await loadProducts();
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

// Global fonksiyonları window'a ekle
window.showExcelImportModal = showExcelImportModal;
window.downloadExcelTemplate = downloadExcelTemplate;
window.handleExcelFileSelect = handleExcelFileSelect;
window.importProductsFromExcel = importProductsFromExcel;
window.closeExcelImportModal = closeExcelImportModal;
