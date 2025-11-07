/**
 * Excel Import & Template Manager (v1)
 * Ürün ve müşteri Excel işlemleri için basit yardımcılar.
 */
(function () {
    const state = {
        product: {
            rows: [],
            hasInvalid: false
        },
        customer: {
            rows: [],
            hasInvalid: false
        }
    };

    function notify(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else if (typeof window.showMessage === 'function') {
            window.showMessage(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    function ensureXLSX() {
        if (window.XLSX && window.XLSX.utils) return window.XLSX;

        try {
            const xlsx = window.require ? window.require('xlsx') : null;
            if (xlsx && xlsx.utils) {
                window.XLSX = xlsx;
                return xlsx;
            }
        } catch (error) {
            console.warn('xlsx require failed:', error);
        }

        notify('Excel kütüphanesi yüklenemedi. Sayfayı yenileyip tekrar deneyin.', 'error');
        throw new Error('XLSX library not available');
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();
    }

    function createModal({ id, title, body }) {
        closeModal(id);
        const modalHtml = `
            <div id="${id}" class="modal active" style="z-index: 20000;">
                <div class="modal-content" style="max-width: 880px; max-height: 90vh; overflow-y: auto; border-radius: 18px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 18px 18px 0 0; color: white; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; font-size: 22px; font-weight: 700;">${title}</h3>
                        <button type="button" data-excel-close="${id}" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; font-size: 20px;">×</button>
                    </div>
                    <div style="padding: 24px;">${body}</div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.querySelector(`[data-excel-close="${id}"]`)?.addEventListener('click', () => closeModal(id));
    }

    function downloadWorkbook(filename, sheetName, rows) {
        try {
            const XLSX = ensureXLSX();
            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([buffer], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
            notify('Şablon indirildi.', 'success');
        } catch (error) {
            console.error('Excel template download error:', error);
            notify('Şablon indirilirken hata oluştu.', 'error');
        }
    }

    const escapeHtml = (value) =>
        String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

    function renderPreviewTable({ containerId, headerMap, rows }) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!rows.length) {
            container.innerHTML = '<div style="padding: 24px; color: #6b7280;">Veri bulunamadı. Lütfen Excel dosyanızı kontrol edin.</div>';
            return;
        }

        const headers = Object.values(headerMap)
            .map((label) => `<th style="padding: 10px; border: 1px solid #e5e7eb; background: #f9fafb; text-align: left;">${label}</th>`)
            .join('');

        const body = rows
            .map((row) => {
                const invalidStyle = row.__invalid ? 'background: #fef2f2;' : '';
                const cells = Object.keys(headerMap)
                    .map((key) => `<td style="padding: 10px; border: 1px solid #e5e7eb;">${escapeHtml(row[key])}</td>`)
                    .join('');
                const statusCell = row.__invalid
                    ? '<td style="padding: 10px; border: 1px solid #e5e7eb; color: #dc2626; text-align: center;">❌</td>'
                    : '<td style="padding: 10px; border: 1px solid #e5e7eb; color: #16a34a; text-align: center;">✅</td>';
                return `<tr style="${invalidStyle}">${cells}${statusCell}</tr>`;
            })
            .join('');

        container.innerHTML = `
            <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; max-height: 320px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr>${headers}<th style="padding: 10px; border: 1px solid #e5e7eb; background: #f9fafb; text-align: center;">Durum</th></tr>
                    </thead>
                    <tbody>${body}</tbody>
                </table>
            </div>
        `;
    }

    function parseExcelFile(file, mapper) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const XLSX = ensureXLSX();
                    const workbook = XLSX.read(event.target.result, { type: 'array' });
                    const firstSheet = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheet];
                    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    if (!rawData.length) return resolve([]);
                    const [headerRow, ...dataRows] = rawData;
                    const headers = headerRow.map((header) => String(header || '').trim().toLowerCase());
                    const rows = dataRows
                        .filter((row) => row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ''))
                        .map((row) => mapper(row, headers));
                    resolve(rows);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    function mapProductRow(row, headers) {
        const find = (keywords) => {
            const index = headers.findIndex((header) => keywords.some((keyword) => header.includes(keyword)));
            return index >= 0 ? row[index] : '';
        };
        const name = find(['ürün adı', 'urun adi', 'name']);
        const salePrice = find(['satış fiyatı', 'satis fiyati', 'sale']);
        const result = {
            name,
            code: find(['kod', 'code']),
            barcode: find(['barkod', 'barcode']),
            unit: find(['birim', 'unit']) || 'adet',
            purchase_price: find(['alış fiyatı', 'alis fiyati', 'purchase']) || '',
            sale_price: salePrice,
            vat_rate: find(['kdv', 'vat']) || '20',
            stock: find(['stok', 'stock']) || '0',
            min_stock: find(['minimum stok', 'min stok', 'safety stock']) || '0',
            category: find(['kategori', 'category']) || '',
            description: find(['açıklama', 'aciklama', 'description']) || ''
        };
        if (!String(name).trim() || !String(salePrice).trim()) result.__invalid = true;
        return result;
    }

    function mapCustomerRow(row, headers) {
        const find = (keywords) => {
            const index = headers.findIndex((header) =>
                keywords.some((keyword) => header.includes(keyword))
            );
            return index >= 0 ? row[index] : '';
        };

        const name = find(['müşteri adı', 'musteri adi', 'ad soyad', 'name']);
        const phone = find(['telefon', 'tel', 'phone']);
        const gsm = find(['gsm', 'cep', 'mobile']);
        const limit = find(['limit', 'kredi', 'credit']);
        const taxNumber = find(['vergi no', 'vergi', 'tax']);
        const taxOffice = find(['vergi dairesi', 'tax office']);
        const accountCode = find(['hesap', 'account']);
        const type = find(['tip', 'tür', 'type', 'status']);
        const email = find(['e-posta', 'eposta', 'email', 'mail']);
        const address = find(['adres', 'address']);
        const description = find(['açıklama', 'aciklama', 'not', 'description']);

        const result = {
            name,
            code: find(['müşteri kodu', 'musteri kodu', 'code']),
            phone,
            gsm,
            email,
            address,
            tax_office: taxOffice,
            tax_number: taxNumber,
            account_code: accountCode,
            limit,
            type,
            description
        };

        if (!String(name).trim()) result.__invalid = true;
        return result;
    }

    async function handleProductFile(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const rows = await parseExcelFile(file, mapProductRow);
            state.product.rows = rows;
            state.product.hasInvalid = rows.some((row) => row.__invalid);
            renderPreviewTable({
                containerId: 'excel-product-preview',
                headerMap: {
                    name: 'Ürün Adı',
                    code: 'Ürün Kodu',
                    barcode: 'Barkod',
                    sale_price: 'Satış Fiyatı',
                    purchase_price: 'Alış Fiyatı',
                    stock: 'Stok',
                    vat_rate: 'KDV %'
                },
                rows
            });
            document.getElementById('excel-product-valid').textContent = rows.filter((row) => !row.__invalid).length;
            document.getElementById('excel-product-invalid').textContent = rows.filter((row) => row.__invalid).length;
            document.getElementById('excel-product-preview-wrapper').style.display = 'block';
            notify('Excel dosyası okundu.', 'success');
        } catch (error) {
            console.error('Product excel parse error:', error);
            notify('Excel dosyası okunamadı. Lütfen şablona uygun olduğundan emin olun.', 'error');
        }
    }

    async function handleCustomerFile(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const rows = await parseExcelFile(file, mapCustomerRow);
            state.customer.rows = rows;
            state.customer.hasInvalid = rows.some((row) => row.__invalid);
            renderPreviewTable({
                containerId: 'excel-customer-preview',
                headerMap: {
                    name: 'Müşteri Adı',
                    code: 'Müşteri Kodu',
                    phone: 'Telefon',
                    gsm: 'GSM',
                    email: 'E-posta',
                    address: 'Adres',
                    tax_office: 'Vergi Dairesi',
                    tax_number: 'Vergi No',
                    account_code: 'Hesap Kodu',
                    limit: 'Limit'
                },
                rows
            });
            document.getElementById('excel-customer-valid').textContent = rows.filter((row) => !row.__invalid).length;
            document.getElementById('excel-customer-invalid').textContent = rows.filter((row) => row.__invalid).length;
            document.getElementById('excel-customer-preview-wrapper').style.display = 'block';
            notify('Excel dosyası okundu.', 'success');
        } catch (error) {
            console.error('Customer excel parse error:', error);
            notify('Excel dosyası okunamadı. Lütfen şablona uygun olduğundan emin olun.', 'error');
        }
    }

    async function importProductsFromExcel() {
        if (!state.product.rows.length) {
            notify('Önce Excel dosyası seçin.', 'warning');
            return;
        }
        if (state.product.hasInvalid) {
            notify('Hatalı satırlar mevcut. Lütfen düzeltin.', 'warning');
            return;
        }
        try {
            if (window.ipcRenderer?.invoke) {
                const response = await window.ipcRenderer.invoke('import-products-from-excel', state.product.rows);
                if (response?.success) {
                    notify('Ürünler başarıyla içe aktarıldı.', 'success');
                    closeModal('excel-product-import-modal');
                    window.refreshProductList?.();
                    return;
                }
                notify(response?.message || 'Ürünler içe aktarılırken hata oluştu.', 'error');
            } else {
                console.table(state.product.rows);
                notify('İçe aktarma sonuçları konsola yazdırıldı (demo mod).', 'info');
            }
        } catch (error) {
            console.error('import-products-from-excel error:', error);
            notify('Ürünler içe aktarılırken hata oluştu.', 'error');
        }
    }

    async function importCustomersFromExcel() {
        if (!state.customer.rows.length) {
            notify('Önce Excel dosyası seçin.', 'warning');
            return;
        }
        if (state.customer.hasInvalid) {
            notify('Hatalı satırlar mevcut. Lütfen düzeltin.', 'warning');
            return;
        }
        try {
            if (window.ipcRenderer?.invoke) {
                const response = await window.ipcRenderer.invoke('import-customers-from-excel', state.customer.rows);
                if (response?.success) {
                    notify('Müşteriler başarıyla içe aktarıldı.', 'success');
                    closeModal('excel-customer-import-modal');
                    window.loadCustomers?.();
                    return;
                }
                notify(response?.message || 'Müşteriler içe aktarılırken hata oluştu.', 'error');
            } else {
                console.table(state.customer.rows);
                notify('İçe aktarma sonuçları konsola yazdırıldı (demo mod).', 'info');
            }
        } catch (error) {
            console.error('import-customers-from-excel error:', error);
            notify('Müşteriler içe aktarılırken hata oluştu.', 'error');
        }
    }

    function downloadProductTemplate() {
        downloadWorkbook('urun_import_sablonu.xlsx', 'Ürünler', [
            {
                'Ürün Adı': 'Örnek Ürün 1',
                'Ürün Kodu': 'PRD-001',
                'Barkod': '8691234567890',
                'Birim': 'adet',
                'Alış Fiyatı': 25.5,
                'Satış Fiyatı': 35.9,
                'KDV Oranı': 20,
                'Stok': 12,
                'Minimum Stok': 3,
                'Kategori': 'Elektronik',
                'Açıklama': 'Örnek açıklama'
            },
            {
                'Ürün Adı': 'Örnek Ürün 2',
                'Ürün Kodu': 'PRD-002',
                'Barkod': '8690987654321',
                'Birim': 'kg',
                'Alış Fiyatı': 12,
                'Satış Fiyatı': 19.99,
                'KDV Oranı': 10,
                'Stok': 45,
                'Minimum Stok': 5,
                'Kategori': 'Gıda',
                'Açıklama': 'İkinci örnek'
            }
        ]);
    }

    function downloadCustomerTemplate() {
        downloadWorkbook('musteri_import_sablonu.xlsx', 'Müşteriler', [
            {
                'Müşteri Adı': 'Ahmet Yılmaz',
                'Müşteri Kodu': 'CUST-001',
                'Telefon': '0532 000 00 00',
                'E-posta': 'ahmet@example.com',
                'Adres': 'İstanbul',
                'Vergi No': '1234567890',
                'Açıklama': 'Perakende müşteri'
            },
            {
                'Müşteri Adı': 'ABC Ltd. Şti.',
                'Müşteri Kodu': 'CUST-002',
                'Telefon': '0212 555 55 55',
                'E-posta': 'info@abc.com',
                'Adres': 'Ankara',
                'Vergi No': '9876543210',
                'Açıklama': 'Kurumsal müşteri'
            }
        ]);
    }

    function showProductImportModal() {
        createModal({
            id: 'excel-product-import-modal',
            title: '📥 Excel ile Ürün İçe Aktarma',
            body: `
                <div style="display: grid; gap: 24px;">
                    <div style="background: #f8fafc; padding: 18px; border-radius: 12px;">
                        <h4 style="margin: 0 0 12px 0; color: #1e293b;">Adım 1 • Excel Şablonunu İndir</h4>
                        <p style="margin: 0 0 12px 0; color: #475569;">Şablonu indirip ürünlerinizi doldurduktan sonra tekrar yükleyin.</p>
                        <button type="button" id="excel-product-template-btn" style="padding: 12px 20px; border: none; border-radius: 10px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; font-weight: 600; cursor: pointer;">📄 Şablonu İndir</button>
                    </div>
                    <div style="background: #ffffff; padding: 18px; border-radius: 12px; border: 1px dashed #cbd5f5; text-align: center;">
                        <h4 style="margin: 0 0 12px 0; color: #1e293b;">Adım 2 • Excel Dosyanızı Seçin</h4>
                        <p style="margin: 0 0 16px 0; color: #475569;">.xlsx veya .xls formatında dosya yükleyebilirsiniz.</p>
                        <input type="file" id="excel-product-file" accept=".xlsx,.xls" style="display: none;">
                        <button type="button" id="excel-product-file-btn" style="padding: 12px 20px; border: none; border-radius: 10px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; font-weight: 600; cursor: pointer;">📁 Dosya Seç</button>
                    </div>
                    <div id="excel-product-preview-wrapper" style="display: none; background: #ffffff; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h4 style="margin: 0; color: #1e293b;">📋 Veri Önizleme</h4>
                            <div style="display: flex; gap: 16px; color: #475569;">
                                <span>✅ Geçerli: <strong id="excel-product-valid">0</strong></span>
                                <span>❌ Hatalı: <strong id="excel-product-invalid">0</strong></span>
                            </div>
                        </div>
                        <div id="excel-product-preview"></div>
                        <div style="display: flex; justify-content: flex-end; margin-top: 18px;">
                            <button type="button" id="excel-product-import-btn" style="padding: 12px 24px; border: none; border-radius: 10px; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: white; font-weight: 600; cursor: pointer;">🚀 Ürünleri İçeri Aktar</button>
                        </div>
                    </div>
                </div>
            `
        });
        document.getElementById('excel-product-template-btn')?.addEventListener('click', downloadProductTemplate);
        document.getElementById('excel-product-file-btn')?.addEventListener('click', () => document.getElementById('excel-product-file')?.click());
        document.getElementById('excel-product-file')?.addEventListener('change', handleProductFile);
        document.getElementById('excel-product-import-btn')?.addEventListener('click', importProductsFromExcel);
        state.product.rows = [];
        state.product.hasInvalid = false;
        document.getElementById('excel-product-preview-wrapper').style.display = 'none';
    }

    function showCustomerImportModal() {
        createModal({
            id: 'excel-customer-import-modal',
            title: '📊 Excel ile Müşteri İçe Aktarma',
            body: `
                <div style="display: grid; gap: 24px;">
                    <div style="background: #f8fafc; padding: 18px; border-radius: 12px;">
                        <h4 style="margin: 0 0 12px 0; color: #1e293b;">Adım 1 • Excel Şablonunu İndir</h4>
                        <p style="margin: 0 0 12px 0; color: #475569;">Şablonu indirip müşteri bilgilerini doldurduktan sonra tekrar yükleyin.</p>
                        <button type="button" id="excel-customer-template-btn" style="padding: 12px 20px; border: none; border-radius: 10px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; font-weight: 600; cursor: pointer;">📄 Şablonu İndir</button>
                    </div>
                    <div style="background: #ffffff; padding: 18px; border-radius: 12px; border: 1px dashed #cbd5f5; text-align: center;">
                        <h4 style="margin: 0 0 12px 0; color: #1e293b;">Adım 2 • Excel Dosyanızı Seçin</h4>
                        <p style="margin: 0 0 16px 0; color: #475569;">.xlsx veya .xls formatında dosya yükleyebilirsiniz.</p>
                        <input type="file" id="excel-customer-file" accept=".xlsx,.xls" style="display: none;">
                        <button type="button" id="excel-customer-file-btn" style="padding: 12px 20px; border: none; border-radius: 10px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; font-weight: 600; cursor: pointer;">📁 Dosya Seç</button>
                    </div>
                    <div id="excel-customer-preview-wrapper" style="display: none; background: #ffffff; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h4 style="margin: 0; color: #1e293b;">📋 Veri Önizleme</h4>
                            <div style="display: flex; gap: 16px; color: #475569;">
                                <span>✅ Geçerli: <strong id="excel-customer-valid">0</strong></span>
                                <span>❌ Hatalı: <strong id="excel-customer-invalid">0</strong></span>
                            </div>
                        </div>
                        <div id="excel-customer-preview"></div>
                        <div style="display: flex; justify-content: flex-end; margin-top: 18px;">
                            <button type="button" id="excel-customer-import-btn" style="padding: 12px 24px; border: none; border-radius: 10px; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: white; font-weight: 600; cursor: pointer;">🚀 Müşterileri İçeri Aktar</button>
                        </div>
                    </div>
                </div>
            `
        });
        document.getElementById('excel-customer-template-btn')?.addEventListener('click', downloadCustomerTemplate);
        document.getElementById('excel-customer-file-btn')?.addEventListener('click', () => document.getElementById('excel-customer-file')?.click());
        document.getElementById('excel-customer-file')?.addEventListener('change', handleCustomerFile);
        document.getElementById('excel-customer-import-btn')?.addEventListener('click', importCustomersFromExcel);
        state.customer.rows = [];
        state.customer.hasInvalid = false;
        document.getElementById('excel-customer-preview-wrapper').style.display = 'none';
    }

    window.showExcelImportModal = showProductImportModal;
    window.showExcelCustomerImportModal = showCustomerImportModal;
    window.downloadProductExcelTemplate = downloadProductTemplate;
    window.downloadCustomerExcelTemplate = downloadCustomerTemplate;
})();

