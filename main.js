const electron = require('electron');
const { app, BrowserWindow, globalShortcut, ipcMain, Menu } = electron;
const path = require('path');
const Database = require('better-sqlite3');

let mainWindow;
let db;

// Veritabanını başlat
async function initDatabase() {
    try {
        const dbPath = path.join(app.getPath('userData'), 'veresiye.db');
        console.log('Database path:', dbPath);
        
        db = new Database(dbPath, { verbose: console.log });
        
        // Check if we need to migrate existing database
        try {
            const tableInfo = db.prepare("PRAGMA table_info(customers)").all();
            const hasNewColumns = tableInfo.some(col => col.name === 'tax_office');
            
            if (tableInfo.length > 0 && !hasNewColumns) {
                console.log('⚠️  OLD DATABASE SCHEMA DETECTED - MIGRATING...');
                
                // Add new columns to existing table
                const migrations = [
                    'ALTER TABLE customers ADD COLUMN tax_office TEXT',
                    'ALTER TABLE customers ADD COLUMN tax_number TEXT',
                    'ALTER TABLE customers ADD COLUMN tc_number TEXT',
                    'ALTER TABLE customers ADD COLUMN email TEXT',
                    'ALTER TABLE customers ADD COLUMN website TEXT',
                    'ALTER TABLE customers ADD COLUMN customer_type TEXT DEFAULT "individual"',
                    'ALTER TABLE customers ADD COLUMN invoice_address TEXT',
                    'ALTER TABLE customers ADD COLUMN invoice_city TEXT',
                    'ALTER TABLE customers ADD COLUMN invoice_district TEXT',
                    'ALTER TABLE customers ADD COLUMN invoice_postal_code TEXT',
                    'ALTER TABLE customers ADD COLUMN contact_person TEXT',
                    'ALTER TABLE customers ADD COLUMN contact_phone TEXT',
                    'ALTER TABLE customers ADD COLUMN account_code TEXT',
                    'ALTER TABLE customers ADD COLUMN cost_center TEXT',
                    'ALTER TABLE customers ADD COLUMN e_invoice_alias TEXT',
                    'ALTER TABLE customers ADD COLUMN e_archive_alias TEXT',
                    'ALTER TABLE customers ADD COLUMN is_e_invoice_enabled INTEGER DEFAULT 0',
                    'ALTER TABLE customers ADD COLUMN is_e_archive_enabled INTEGER DEFAULT 0',
                    'ALTER TABLE customers ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP'
                ];
                
                for (const migration of migrations) {
                    try {
                        db.exec(migration);
                        console.log(`✅ ${migration}`);
                    } catch (err) {
                        if (!err.message.includes('duplicate column name')) {
                            console.log(`⚠️  ${migration} - ${err.message}`);
                        }
                    }
                }
                
                console.log('✅ Database migration completed!');
            }
        } catch (err) {
            console.log('Creating new database...');
        }
        
        // Tablolar oluştur
        db.exec(`
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                code TEXT,
                phone TEXT,
                gsm TEXT,
                address TEXT,
                credit_limit REAL DEFAULT 500,
                balance REAL DEFAULT 0,
                -- E-fatura ve E-arşiv için gerekli alanlar
                tax_office TEXT,              -- Vergi Dairesi
                tax_number TEXT,              -- Vergi Numarası
                tc_number TEXT,               -- TC Kimlik Numarası
                email TEXT,                   -- E-posta
                website TEXT,                 -- Web Sitesi
                customer_type TEXT DEFAULT 'individual', -- individual/company
                -- Fatura adresi (adres farklı olabilir)
                invoice_address TEXT,
                invoice_city TEXT,
                invoice_district TEXT,
                invoice_postal_code TEXT,
                -- İletişim detayları
                contact_person TEXT,          -- Yetkili Kişi
                contact_phone TEXT,           -- Yetkili Telefon
                -- Muhasebe kodları
                account_code TEXT,            -- Hesap Kodu
                cost_center TEXT,             -- Maliyet Merkezi
                -- E-fatura entegrasyonu
                e_invoice_alias TEXT,         -- E-fatura Alias
                e_archive_alias TEXT,         -- E-arşiv Alias
                is_e_invoice_enabled INTEGER DEFAULT 0, -- E-fatura aktif mi
                is_e_archive_enabled INTEGER DEFAULT 0, -- E-arşiv aktif mi
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                code TEXT,
                barcode TEXT,
                unit TEXT DEFAULT 'adet',
                purchase_price REAL DEFAULT 0,
                sale_price REAL DEFAULT 0,
                vat_rate REAL DEFAULT 20,
                stock REAL DEFAULT 0,
                min_stock REAL DEFAULT 0,
                category TEXT,
                category_id INTEGER,
                brand_id INTEGER,
                description TEXT,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories (id),
                FOREIGN KEY (brand_id) REFERENCES brands (id)
            );
            
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER,
                product_id INTEGER,
                type TEXT NOT NULL,
                quantity REAL DEFAULT 1,
                unit_price REAL NOT NULL,
                total_amount REAL NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers (id),
                FOREIGN KEY (product_id) REFERENCES products (id)
            );
            
            CREATE TABLE IF NOT EXISTS company_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_name TEXT NOT NULL DEFAULT 'Etic Ajans',
                company_code TEXT,
                tax_number TEXT,
                tax_office TEXT,
                address TEXT,
                phone TEXT,
                email TEXT,
                website TEXT,
                logo_path TEXT,
                invoice_header TEXT,
                invoice_footer TEXT,
                default_currency TEXT DEFAULT 'TRY',
                default_vat_rate REAL DEFAULT 20,
                invoice_prefix TEXT DEFAULT 'FAT',
                invoice_number INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Mevcut products tablosuna yeni sütunları ekle (eğer yoksa)
        try {
            await db.run(`ALTER TABLE products ADD COLUMN category_id INTEGER`);
        } catch (e) {
            // Sütun zaten varsa hata vermez
        }
        
        try {
            await db.run(`ALTER TABLE products ADD COLUMN brand_id INTEGER`);
        } catch (e) {
            // Sütun zaten varsa hata vermez
        }
        
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        throw error;
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show: false
    });

    mainWindow.loadFile('index.html');
    
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        console.log('Window shown');
    });

    // Console'u aç (development için)
    mainWindow.webContents.openDevTools();
    console.log('🔧 Application started');

    // Menü oluştur
    const template = [
        {
            label: 'Dosya',
            submenu: [
                {
                    label: 'Yeni Müşteri',
                    accelerator: 'F1',
                    click: () => {
                        mainWindow.webContents.send('shortcut-pressed', 'new-customer');
                    }
                },
                {
                    label: 'Cari Aç',
                    accelerator: 'F5',
                    click: () => {
                        mainWindow.webContents.send('shortcut-pressed', 'open-customer');
                    }
                },
                {
                    label: 'Hızlı Borç',
                    accelerator: 'F6',
                    click: () => {
                        mainWindow.webContents.send('shortcut-pressed', 'quick-debt');
                    }
                },
                {
                    label: 'Ödeme Al',
                    accelerator: 'F7',
                    click: () => {
                        mainWindow.webContents.send('shortcut-pressed', 'payment');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Çıkış',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Global kısayol tuşları
function registerGlobalShortcuts() {
    try {
        globalShortcut.register('F1', () => {
            if (mainWindow) {
                mainWindow.webContents.send('shortcut-pressed', 'new-customer');
                mainWindow.focus();
            }
        });

        globalShortcut.register('F4', () => {
            if (mainWindow) {
                mainWindow.webContents.send('shortcut-pressed', 'add-sale');
                mainWindow.focus();
            }
        });

        globalShortcut.register('F5', () => {
            if (mainWindow) {
                mainWindow.webContents.send('shortcut-pressed', 'add-payment');
                mainWindow.focus();
            }
        });

        globalShortcut.register('F6', () => {
            if (mainWindow) {
                mainWindow.webContents.send('shortcut-pressed', 'quick-debt');
                mainWindow.focus();
            }
        });

        globalShortcut.register('F7', () => {
            if (mainWindow) {
                mainWindow.webContents.send('shortcut-pressed', 'quick-payment');
                mainWindow.focus();
            }
        });
        
        console.log('Global shortcuts registered');
    } catch (error) {
        console.error('Shortcut registration error:', error);
    }
}

// IPC handlers
function setupIpcHandlers() {
    ipcMain.handle('get-customers', () => {
        try {
            const stmt = db.prepare('SELECT * FROM customers ORDER BY name');
            return stmt.all();
        } catch (error) {
            console.error('Get customers error:', error);
            return [];
        }
    });

    ipcMain.handle('add-customer', (event, customer) => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            console.log('Adding customer:', customer);
            const stmt = db.prepare(`
                INSERT INTO customers (
                    name, code, phone, gsm, address, credit_limit,
                    tax_office, tax_number, tc_number, email, website,
                    customer_type, invoice_address, invoice_city, invoice_district,
                    invoice_postal_code, contact_person, contact_phone,
                    account_code, cost_center, e_invoice_alias, e_archive_alias,
                    is_e_invoice_enabled, is_e_archive_enabled
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const result = stmt.run(
                customer.name, 
                customer.code || null,
                customer.phone || null,
                customer.gsm || null,
                customer.address || null,
                customer.limit || 500,
                customer.tax_office || null,
                customer.tax_number || null,
                customer.tc_number || null,
                customer.email || null,
                customer.website || null,
                customer.customer_type || 'individual',
                customer.invoice_address || null,
                customer.invoice_city || null,
                customer.invoice_district || null,
                customer.invoice_postal_code || null,
                customer.contact_person || null,
                customer.contact_phone || null,
                customer.account_code || null,
                customer.cost_center || null,
                customer.e_invoice_alias || null,
                customer.e_archive_alias || null,
                customer.is_e_invoice_enabled ? 1 : 0,
                customer.is_e_archive_enabled ? 1 : 0
            );
            console.log('Customer added successfully, ID:', result.lastInsertRowid);
            return { id: result.lastInsertRowid, ...customer, balance: 0 };
        } catch (error) {
            console.error('Add customer error:', error);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            throw error;
        }
    });

    ipcMain.handle('get-customer', (event, id) => {
        try {
            const stmt = db.prepare('SELECT * FROM customers WHERE id = ?');
            return stmt.get(id);
        } catch (error) {
            console.error('Get customer error:', error);
            return null;
        }
    });

    ipcMain.handle('update-customer', (event, customer) => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            console.log('Updating customer:', customer);
            const stmt = db.prepare(`
                UPDATE customers SET 
                    name = ?, code = ?, phone = ?, gsm = ?, address = ?, credit_limit = ?,
                    tax_office = ?, tax_number = ?, tc_number = ?, email = ?, website = ?,
                    customer_type = ?, invoice_address = ?, invoice_city = ?, invoice_district = ?,
                    invoice_postal_code = ?, contact_person = ?, contact_phone = ?,
                    account_code = ?, cost_center = ?, e_invoice_alias = ?, e_archive_alias = ?,
                    is_e_invoice_enabled = ?, is_e_archive_enabled = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `);
            const result = stmt.run(
                customer.name, 
                customer.code || null,
                customer.phone || null,
                customer.gsm || null,
                customer.address || null,
                customer.limit || 500,
                customer.tax_office || null,
                customer.tax_number || null,
                customer.tc_number || null,
                customer.email || null,
                customer.website || null,
                customer.customer_type || 'individual',
                customer.invoice_address || null,
                customer.invoice_city || null,
                customer.invoice_district || null,
                customer.invoice_postal_code || null,
                customer.contact_person || null,
                customer.contact_phone || null,
                customer.account_code || null,
                customer.cost_center || null,
                customer.e_invoice_alias || null,
                customer.e_archive_alias || null,
                customer.is_e_invoice_enabled ? 1 : 0,
                customer.is_e_archive_enabled ? 1 : 0,
                customer.id
            );
            console.log('Customer updated successfully, affected rows:', result.changes);
            return { success: true, affectedRows: result.changes };
        } catch (error) {
            console.error('Update customer error:', error);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            throw error;
        }
    });

    ipcMain.handle('delete-customer', (event, id) => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            console.log('Deleting customer:', id);
            
            // Önce müşterinin işlemlerini sil
            const deleteTransactions = db.prepare('DELETE FROM transactions WHERE customer_id = ?');
            deleteTransactions.run(id);
            
            // Sonra müşteriyi sil
            const deleteCustomer = db.prepare('DELETE FROM customers WHERE id = ?');
            const result = deleteCustomer.run(id);
            
            console.log('Customer deleted successfully, affected rows:', result.changes);
            return { success: true, affectedRows: result.changes };
        } catch (error) {
            console.error('Delete customer error:', error);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            throw error;
        }
    });

    // Update transaction
    ipcMain.handle('update-transaction', (event, transactionData) => {
        try {
            console.log('Updating transaction:', transactionData);
            
            const { id, customer_id, type, created_at, description, product_id, quantity, unit_price, total_amount } = transactionData;
            
            const result = db.prepare(`
                UPDATE transactions 
                SET customer_id = ?, type = ?, created_at = ?, description = ?, 
                    product_id = ?, quantity = ?, unit_price = ?, total_amount = ?
                WHERE id = ?
            `).run(customer_id, type, created_at, description, product_id, quantity, unit_price, total_amount, id);
            
            console.log('Transaction update result:', result);
            return { success: result.changes > 0 };
        } catch (error) {
            console.error('Error updating transaction:', error);
            return { success: false, error: error.message };
        }
    });

    // Delete transaction
    ipcMain.handle('delete-transaction', (event, transactionId) => {
        try {
            console.log('Deleting transaction:', transactionId);
            
            const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(transactionId);
            
            console.log('Transaction deletion result:', result);
            return { success: result.changes > 0 };
        } catch (error) {
            console.error('Error deleting transaction:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('add-transaction', (event, transaction) => {
        try {
            const stmt = db.prepare('INSERT INTO transactions (customer_id, product_id, type, quantity, unit_price, total_amount, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
            const result = stmt.run(
                transaction.customer_id, 
                transaction.product_id || null,
                transaction.type, 
                transaction.quantity || 1,
                transaction.unit_price || transaction.amount,
                transaction.total_amount || transaction.amount,
                transaction.description
            );
            
            // Müşteri bakiyesini güncelle
            const updateBalance = db.prepare('UPDATE customers SET balance = balance + ? WHERE id = ?');
            const balanceChange = transaction.type === 'debt' ? (transaction.total_amount || transaction.amount) : -(transaction.total_amount || transaction.amount);
            updateBalance.run(balanceChange, transaction.customer_id);
            
            // Ürün stokunu güncelle (sadece satış için)
            if (transaction.product_id && transaction.type === 'debt') {
                const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
                updateStock.run(transaction.quantity || 1, transaction.product_id);
            }
            
            return { id: result.lastInsertRowid, ...transaction };
        } catch (error) {
            console.error('Add transaction error:', error);
            throw error;
        }
    });

    ipcMain.handle('get-transactions', (event, customerId) => {
        try {
            const stmt = db.prepare(`
                SELECT t.*, c.name as customer_name, p.name as product_name
                FROM transactions t 
                LEFT JOIN customers c ON t.customer_id = c.id 
                LEFT JOIN products p ON t.product_id = p.id
                WHERE t.customer_id = ? 
                ORDER BY t.created_at DESC
            `);
            return stmt.all(customerId);
        } catch (error) {
            console.error('Get transactions error:', error);
            return [];
        }
    });

    ipcMain.handle('get-all-transactions', () => {
        try {
            const stmt = db.prepare(`
                SELECT t.*, c.name as customer_name, p.name as product_name
                FROM transactions t 
                LEFT JOIN customers c ON t.customer_id = c.id 
                LEFT JOIN products p ON t.product_id = p.id
                ORDER BY t.created_at DESC 
                LIMIT 100
            `);
            return stmt.all();
        } catch (error) {
            console.error('Get all transactions error:', error);
            return [];
        }
    });

    // Product handlers
    ipcMain.handle('get-products', () => {
        try {
            const stmt = db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY name');
            return stmt.all();
        } catch (error) {
            console.error('Get products error:', error);
            return [];
        }
    });
    
    ipcMain.handle('get-categories', () => {
        try {
            const stmt = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY name');
            return stmt.all();
        } catch (error) {
            console.error('Get categories error:', error);
            return [];
        }
    });
    
    ipcMain.handle('get-brands', () => {
        try {
            const stmt = db.prepare('SELECT * FROM brands WHERE is_active = 1 ORDER BY name');
            return stmt.all();
        } catch (error) {
            console.error('Get brands error:', error);
            return [];
        }
    });

    ipcMain.handle('add-category', (event, category) => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            console.log('Adding category:', category);
            const stmt = db.prepare('INSERT INTO categories (name, icon, color, description) VALUES (?, ?, ?, ?)');
            const result = stmt.run(
                category.name,
                category.icon || '📦',
                category.color || '#667eea',
                category.description || null
            );
            console.log('Category added successfully, ID:', result.lastInsertRowid);
            return { id: result.lastInsertRowid, ...category };
        } catch (error) {
            console.error('Add category error:', error);
            throw error;
        }
    });
    
    ipcMain.handle('add-brand', (event, brand) => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            console.log('Adding brand:', brand);
            const stmt = db.prepare('INSERT INTO brands (name, logo, description, website) VALUES (?, ?, ?, ?)');
            const result = stmt.run(
                brand.name,
                brand.logo || '🏷️',
                brand.description || null,
                brand.website || null
            );
            console.log('Brand added successfully, ID:', result.lastInsertRowid);
            return { id: result.lastInsertRowid, ...brand };
        } catch (error) {
            console.error('Add brand error:', error);
            throw error;
        }
    });
    
    ipcMain.handle('update-category', (event, category) => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            console.log('Updating category:', category);
            const stmt = db.prepare('UPDATE categories SET name = ? WHERE id = ?');
            stmt.run(category.name, category.id);
            console.log('Category updated successfully');
            return category;
        } catch (error) {
            console.error('Update category error:', error);
            throw error;
        }
    });
    
    ipcMain.handle('delete-category', (event, id) => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            console.log('Deleting category:', id);
            const stmt = db.prepare('UPDATE categories SET is_active = 0 WHERE id = ?');
            stmt.run(id);
            console.log('Category deleted successfully');
            return { success: true };
        } catch (error) {
            console.error('Delete category error:', error);
            throw error;
        }
    });
    
    ipcMain.handle('update-brand', (event, brand) => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            console.log('Updating brand:', brand);
            const stmt = db.prepare('UPDATE brands SET name = ? WHERE id = ?');
            stmt.run(brand.name, brand.id);
            console.log('Brand updated successfully');
            return brand;
        } catch (error) {
            console.error('Update brand error:', error);
            throw error;
        }
    });
    
    ipcMain.handle('delete-brand', (event, id) => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            console.log('Deleting brand:', id);
            const stmt = db.prepare('UPDATE brands SET is_active = 0 WHERE id = ?');
            stmt.run(id);
            console.log('Brand deleted successfully');
            return { success: true };
        } catch (error) {
            console.error('Delete brand error:', error);
            throw error;
        }
    });

    ipcMain.handle('add-product', (event, product) => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            console.log('Adding product:', product);
            const stmt = db.prepare('INSERT INTO products (name, code, barcode, unit, purchase_price, sale_price, vat_rate, stock, min_stock, category_id, brand_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            const result = stmt.run(
                product.name, 
                product.code, 
                product.barcode, 
                product.unit || 'adet',
                product.purchase_price || 0,
                product.sale_price || 0,
                product.vat_rate || 20,
                product.stock || 0,
                product.min_stock || 0,
                product.category_id || null,
                product.brand_id || null,
                product.description
            );
            console.log('Product added successfully, ID:', result.lastInsertRowid);
            return { id: result.lastInsertRowid, ...product };
        } catch (error) {
            console.error('Add product error:', error);
            throw error;
        }
    });

    ipcMain.handle('update-product', (event, product) => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            console.log('Updating product:', product);
            const stmt = db.prepare('UPDATE products SET name = ?, code = ?, barcode = ?, unit = ?, purchase_price = ?, sale_price = ?, vat_rate = ?, stock = ?, min_stock = ?, category_id = ?, brand_id = ?, description = ? WHERE id = ?');
            const result = stmt.run(
                product.name, 
                product.code, 
                product.barcode, 
                product.unit,
                product.purchase_price,
                product.sale_price,
                product.vat_rate || 20,
                product.stock,
                product.min_stock,
                product.category_id || null,
                product.brand_id || null,
                product.description,
                product.id
            );
            console.log('Product updated successfully, affected rows:', result.changes);
            return { id: product.id, ...product };
        } catch (error) {
            console.error('Update product error:', error);
            throw error;
        }
    });

    ipcMain.handle('delete-product', (event, id) => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            console.log('Deleting product:', id);
            
            // Soft delete - set is_active to 0
            const stmt = db.prepare('UPDATE products SET is_active = 0 WHERE id = ?');
            const result = stmt.run(id);
            
            console.log('Product deleted successfully, affected rows:', result.changes);
            return { success: true, affectedRows: result.changes };
        } catch (error) {
            console.error('Delete product error:', error);
            throw error;
        }
    });
    
    // Get sales for a specific customer
    ipcMain.handle('get-sales', (event, customerId) => {
        try {
            const stmt = db.prepare(`
                SELECT t.*, c.name as customer_name, p.name as product_name
                FROM transactions t 
                LEFT JOIN customers c ON t.customer_id = c.id 
                LEFT JOIN products p ON t.product_id = p.id
                WHERE t.customer_id = ? AND t.type = 'debt'
                ORDER BY t.created_at DESC
            `);
            return stmt.all(customerId);
        } catch (error) {
            console.error('Get sales error:', error);
            throw error;
        }
    });
    
    // Get purchases for a specific customer
    ipcMain.handle('get-purchases', (event, customerId) => {
        try {
            const stmt = db.prepare(`
                SELECT t.*, c.name as customer_name, p.name as product_name
                FROM transactions t 
                LEFT JOIN customers c ON t.customer_id = c.id 
                LEFT JOIN products p ON t.product_id = p.id
                WHERE t.customer_id = ? AND t.type = 'payment'
                ORDER BY t.created_at DESC
            `);
            return stmt.all(customerId);
        } catch (error) {
            console.error('Get purchases error:', error);
            throw error;
        }
    });
    
    // Company Settings IPC Handlers
    ipcMain.handle('get-company-settings', () => {
        try {
            const stmt = db.prepare('SELECT * FROM company_settings ORDER BY id DESC LIMIT 1');
            const settings = stmt.get();
            return settings || {
                company_name: 'Etic Ajans',
                company_code: '',
                tax_number: '',
                tax_office: '',
                address: '',
                phone: '',
                email: '',
                website: '',
                logo_path: '',
                invoice_header: '',
                invoice_footer: '',
                default_currency: 'TRY',
                default_vat_rate: 20,
                invoice_prefix: 'FAT',
                invoice_number: 1
            };
        } catch (error) {
            console.error('Get company settings error:', error);
            throw error;
        }
    });
    
    ipcMain.handle('update-company-settings', (event, settingsData) => {
        try {
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO company_settings (
                    id, company_name, company_code, tax_number, tax_office, 
                    address, phone, email, website, logo_path, invoice_header, 
                    invoice_footer, default_currency, default_vat_rate, 
                    invoice_prefix, invoice_number, updated_at
                ) VALUES (
                    1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
                )
            `);
            
            const result = stmt.run(
                settingsData.company_name,
                settingsData.company_code,
                settingsData.tax_number,
                settingsData.tax_office,
                settingsData.address,
                settingsData.phone,
                settingsData.email,
                settingsData.website,
                settingsData.logo_path,
                settingsData.invoice_header,
                settingsData.invoice_footer,
                settingsData.default_currency,
                settingsData.default_vat_rate,
                settingsData.invoice_prefix,
                settingsData.invoice_number
            );
            
            console.log('Company settings updated successfully, affected rows:', result.changes);
            return { success: true, affectedRows: result.changes };
        } catch (error) {
            console.error('Update company settings error:', error);
            throw error;
        }
    });
    
    console.log('IPC handlers setup complete');
}

// App event handlers
app.on('ready', () => {
    console.log('App ready');
    initDatabase();
    createWindow();
    registerGlobalShortcuts();
    setupIpcHandlers();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    if (db) {
        db.close();
    }
});

console.log('Main process started');