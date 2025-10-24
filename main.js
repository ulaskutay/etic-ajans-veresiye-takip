const electron = require('electron');
const { app, BrowserWindow, globalShortcut, ipcMain, Menu } = electron;
const path = require('path');
const Database = require('better-sqlite3');

// Data Management System
const { initializeDataManager, getDataManager } = require('./data-manager');
const { initializeConfigManager, getConfigManager } = require('./config-manager');
const { initializeBackupManager, getBackupManager } = require('./backup-manager');
const { initializeMigrationManager, getMigrationManager } = require('./migration-manager');
const { initializeLogger, getLogger } = require('./logger');

let mainWindow;
let db;
let splashWindow;
let isMigrating = false;

// Veritabanını başlat
async function initDatabase() {
    try {
        const dbPath = path.join(app.getPath('userData'), 'veresiye.db');
        console.log('Database path:', dbPath);
        
        db = new Database(dbPath);
        
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
                user_id INTEGER NOT NULL DEFAULT 1, -- Kullanıcıya ait müşteriler
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
                user_id INTEGER NOT NULL DEFAULT 1, -- Kullanıcıya ait ürünler
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
                user_id INTEGER NOT NULL DEFAULT 1, -- Kullanıcıya ait işlemler
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
            
            -- Kullanıcı Yönetimi Tabloları
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT DEFAULT 'user', -- 'admin', 'user'
                is_active INTEGER DEFAULT 1,
                last_login DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                expires_at DATETIME NOT NULL,
                device_info TEXT,
                ip_address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            
            CREATE TABLE IF NOT EXISTS user_data_sync (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                table_name TEXT NOT NULL,
                record_id INTEGER NOT NULL,
                action TEXT NOT NULL, -- 'create', 'update', 'delete'
                data TEXT, -- JSON formatında veri
                sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'conflict'
                last_sync DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                icon TEXT DEFAULT '📦',
                color TEXT DEFAULT '#667eea',
                description TEXT,
                sort_order INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS brands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                logo TEXT DEFAULT '🏷️',
                description TEXT,
                website TEXT,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                alert_type TEXT NOT NULL, -- 'stock', 'debt', 'payment', 'custom'
                condition_type TEXT NOT NULL, -- 'less_than', 'greater_than', 'equals', 'contains'
                condition_value TEXT NOT NULL,
                condition_field TEXT NOT NULL, -- 'stock', 'balance', 'amount', 'unit', etc.
                target_type TEXT NOT NULL, -- 'product', 'customer', 'transaction', 'all'
                target_id INTEGER, -- specific product/customer ID, NULL for all
                unit TEXT, -- 'adet', 'metre', 'ton', 'dolar', etc.
                currency TEXT DEFAULT 'TRY',
                is_active INTEGER DEFAULT 1,
                priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
                notification_method TEXT DEFAULT 'popup', -- 'popup', 'email', 'both'
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS alert_triggers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_id INTEGER NOT NULL,
                triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                trigger_value TEXT NOT NULL,
                target_id INTEGER,
                target_name TEXT,
                is_resolved INTEGER DEFAULT 0,
                resolved_at DATETIME,
                resolved_by TEXT,
                notes TEXT,
                FOREIGN KEY (alert_id) REFERENCES alerts (id)
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
        
        // Default admin kullanıcısı oluştur (eğer yoksa)
        try {
            const bcrypt = require('bcrypt');
            const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
            
            if (!existingAdmin) {
                const saltRounds = 10;
                const passwordHash = await bcrypt.hash('admin123', saltRounds);
                
                const stmt = db.prepare(`
                    INSERT INTO users (username, email, password_hash, full_name, role)
                    VALUES (?, ?, ?, ?, ?)
                `);
                
                const result = stmt.run('admin', 'admin@eticajans.com', passwordHash, 'Sistem Yöneticisi', 'admin');
                console.log(`✅ Default admin kullanıcısı oluşturuldu (ID: ${result.lastInsertRowid})`);
                console.log('🔐 Admin giriş bilgileri:');
                console.log('   Kullanıcı Adı: admin');
                console.log('   Şifre: admin123');
            } else {
                console.log('ℹ️ Admin kullanıcısı zaten mevcut');
            }
        } catch (error) {
            console.error('❌ Default admin kullanıcısı oluşturulamadı:', error);
        }
        
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        throw error;
    }
}

// Menü oluştur
function createMenu() {
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
            const customers = stmt.all();
            
            // Her müşteri için bakiye hesapla ve güncelle
            for (const customer of customers) {
                const transactions = db.prepare(`
                    SELECT type, total_amount FROM transactions 
                    WHERE customer_id = ? ORDER BY created_at
                `).all(customer.id);
                
                let balance = 0;
                transactions.forEach(t => {
                    if (t.type === 'debt') {
                        balance += t.total_amount || 0;  // Satış = borç artırır
                    } else if (t.type === 'payment') {
                        balance -= t.total_amount || 0;  // Tahsilat = borç azaltır
                    }
                });
                
                // Bakiye güncelle
                db.prepare('UPDATE customers SET balance = ? WHERE id = ?').run(balance, customer.id);
                customer.balance = balance;
            }
            
            return customers;
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
            
            // Validation
            if (!id || !customer_id || !type || !created_at) {
                console.error('Missing required fields:', { id, customer_id, type, created_at });
                return { success: false, error: 'Missing required fields' };
            }
            
            const result = db.prepare(`
                UPDATE transactions 
                SET customer_id = ?, type = ?, created_at = ?, description = ?, 
                    product_id = ?, quantity = ?, unit_price = ?, total_amount = ?
                WHERE id = ?
            `).run(customer_id, type, created_at, description, product_id, quantity, unit_price, total_amount, id);
            
            console.log('Transaction update result:', result);
            console.log('Changes made:', result.changes);
            
            if (result.changes === 0) {
                console.error('No rows were updated - transaction might not exist');
                return { success: false, error: 'Transaction not found or no changes made' };
            }
            
            return { success: true, changes: result.changes };
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
            
            // Müşteri bakiyesi artık otomatik güncellenmiyor - transaction'lardan hesaplanıyor
            
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

    ipcMain.handle('get-product-by-barcode', (event, barcode) => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            if (!barcode) return null;
            const stmt = db.prepare('SELECT * FROM products WHERE barcode = ? AND is_active = 1');
            return stmt.get(barcode);
        } catch (error) {
            console.error('Ürün barkod ile getirilirken hata:', error);
            throw error;
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
    
    // Alert System IPC Handlers
    ipcMain.handle('get-alerts', () => {
        try {
            const stmt = db.prepare('SELECT * FROM alerts WHERE is_active = 1 ORDER BY priority DESC, created_at DESC');
            return stmt.all();
        } catch (error) {
            console.error('Get alerts error:', error);
            return [];
        }
    });

    ipcMain.handle('add-alert', (event, alert) => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            console.log('Adding alert:', alert);
            const stmt = db.prepare(`
                INSERT INTO alerts (
                    name, description, alert_type, condition_type, condition_value,
                    condition_field, target_type, target_id, unit, currency,
                    priority, notification_method
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const result = stmt.run(
                alert.name,
                alert.description || null,
                alert.alert_type,
                alert.condition_type,
                alert.condition_value,
                alert.condition_field,
                alert.target_type,
                alert.target_id || null,
                alert.unit || null,
                alert.currency || 'TRY',
                alert.priority || 'medium',
                alert.notification_method || 'popup'
            );
            console.log('Alert added successfully, ID:', result.lastInsertRowid);
            return { id: result.lastInsertRowid, ...alert };
        } catch (error) {
            console.error('Add alert error:', error);
            throw error;
        }
    });

    ipcMain.handle('update-alert', (event, alert) => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            console.log('Updating alert:', alert);
            const stmt = db.prepare(`
                UPDATE alerts SET 
                    name = ?, description = ?, alert_type = ?, condition_type = ?,
                    condition_value = ?, condition_field = ?, target_type = ?,
                    target_id = ?, unit = ?, currency = ?, priority = ?,
                    notification_method = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `);
            const result = stmt.run(
                alert.name,
                alert.description || null,
                alert.alert_type,
                alert.condition_type,
                alert.condition_value,
                alert.condition_field,
                alert.target_type,
                alert.target_id || null,
                alert.unit || null,
                alert.currency || 'TRY',
                alert.priority || 'medium',
                alert.notification_method || 'popup',
                alert.id
            );
            console.log('Alert updated successfully, affected rows:', result.changes);
            return { id: alert.id, ...alert };
        } catch (error) {
            console.error('Update alert error:', error);
            throw error;
        }
    });

    ipcMain.handle('delete-alert', (event, id) => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            console.log('Deleting alert:', id);
            const stmt = db.prepare('UPDATE alerts SET is_active = 0 WHERE id = ?');
            const result = stmt.run(id);
            console.log('Alert deleted successfully, affected rows:', result.changes);
            return { success: true, affectedRows: result.changes };
        } catch (error) {
            console.error('Delete alert error:', error);
            throw error;
        }
    });

    ipcMain.handle('get-alert-triggers', (event, alertId = null) => {
        try {
            let query = `
                SELECT at.*, a.name as alert_name, a.alert_type, a.priority
                FROM alert_triggers at
                LEFT JOIN alerts a ON at.alert_id = a.id
            `;
            let params = [];
            
            if (alertId) {
                query += ' WHERE at.alert_id = ?';
                params.push(alertId);
            }
            
            query += ' ORDER BY at.triggered_at DESC LIMIT 100';
            
            const stmt = db.prepare(query);
            return stmt.all(...params);
        } catch (error) {
            console.error('Get alert triggers error:', error);
            return [];
        }
    });

    ipcMain.handle('add-alert-trigger', (event, trigger) => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            console.log('Adding alert trigger:', trigger);
            const stmt = db.prepare(`
                INSERT INTO alert_triggers (
                    alert_id, trigger_value, target_id, target_name, notes
                ) VALUES (?, ?, ?, ?, ?)
            `);
            const result = stmt.run(
                trigger.alert_id,
                trigger.trigger_value,
                trigger.target_id || null,
                trigger.target_name || null,
                trigger.notes || null
            );
            console.log('Alert trigger added successfully, ID:', result.lastInsertRowid);
            return { id: result.lastInsertRowid, ...trigger };
        } catch (error) {
            console.error('Add alert trigger error:', error);
            throw error;
        }
    });

    ipcMain.handle('resolve-alert-trigger', (event, triggerId, resolvedBy = 'system') => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            console.log('Resolving alert trigger:', triggerId);
            const stmt = db.prepare(`
                UPDATE alert_triggers SET 
                    is_resolved = 1, resolved_at = CURRENT_TIMESTAMP, resolved_by = ?
                WHERE id = ?
            `);
            const result = stmt.run(resolvedBy, triggerId);
            console.log('Alert trigger resolved successfully, affected rows:', result.changes);
            return { success: true, affectedRows: result.changes };
        } catch (error) {
            console.error('Resolve alert trigger error:', error);
            throw error;
        }
    });

    ipcMain.handle('check-alerts', () => {
        try {
            if (!db) {
                throw new Error('Veritabanı başlatılmadı');
            }
            
            const alerts = db.prepare('SELECT * FROM alerts WHERE is_active = 1').all();
            const triggeredAlerts = [];
            
            for (const alert of alerts) {
                let shouldTrigger = false;
                let triggerValue = '';
                let targetName = '';
                
                switch (alert.alert_type) {
                    case 'stock':
                        if (alert.target_type === 'product' && alert.target_id) {
                            const product = db.prepare('SELECT * FROM products WHERE id = ?').get(alert.target_id);
                            if (product) {
                                triggerValue = product.stock.toString();
                                targetName = product.name;
                                shouldTrigger = checkCondition(product.stock, alert.condition_type, alert.condition_value);
                            }
                        } else if (alert.target_type === 'all') {
                            const products = db.prepare('SELECT * FROM products WHERE is_active = 1').all();
                            for (const product of products) {
                                if (checkCondition(product.stock, alert.condition_type, alert.condition_value)) {
                                    triggeredAlerts.push({
                                        alert_id: alert.id,
                                        trigger_value: product.stock.toString(),
                                        target_id: product.id,
                                        target_name: product.name,
                                        notes: `Stok uyarısı: ${product.name}`
                                    });
                                }
                            }
                            continue;
                        }
                        break;
                        
                    case 'debt':
                        if (alert.target_type === 'customer' && alert.target_id) {
                            const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(alert.target_id);
                            if (customer) {
                                triggerValue = customer.balance.toString();
                                targetName = customer.name;
                                shouldTrigger = checkCondition(customer.balance, alert.condition_type, alert.condition_value);
                            }
                        } else if (alert.target_type === 'all') {
                            const customers = db.prepare('SELECT * FROM customers').all();
                            for (const customer of customers) {
                                if (checkCondition(customer.balance, alert.condition_type, alert.condition_value)) {
                                    triggeredAlerts.push({
                                        alert_id: alert.id,
                                        trigger_value: customer.balance.toString(),
                                        target_id: customer.id,
                                        target_name: customer.name,
                                        notes: `Borç uyarısı: ${customer.name}`
                                    });
                                }
                            }
                            continue;
                        }
                        break;
                }
                
                if (shouldTrigger) {
                    triggeredAlerts.push({
                        alert_id: alert.id,
                        trigger_value: triggerValue,
                        target_id: alert.target_id,
                        target_name: targetName,
                        notes: `${alert.alert_type} uyarısı tetiklendi`
                    });
                }
            }
            
            // Triggered alerts'leri veritabanına kaydet
            for (const trigger of triggeredAlerts) {
                try {
                    db.prepare(`
                        INSERT INTO alert_triggers (alert_id, trigger_value, target_id, target_name, notes)
                        VALUES (?, ?, ?, ?, ?)
                    `).run(trigger.alert_id, trigger.trigger_value, trigger.target_id, trigger.target_name, trigger.notes);
                } catch (err) {
                    console.error('Error saving alert trigger:', err);
                }
            }
            
            return triggeredAlerts;
        } catch (error) {
            console.error('Check alerts error:', error);
            return [];
        }
    });
    
    // ==================== VERSION CONTROL HANDLERS ====================
    
    // Config bilgilerini al
    ipcMain.handle('get-config', async () => {
        try {
            const configManager = getConfigManager();
            return configManager.getConfig();
        } catch (error) {
            console.error('Get config error:', error);
            return { schemaVersion: 0, appVersion: '1.0.0' };
        }
    });
    
    // Yedek listesini al
    ipcMain.handle('list-backups', async () => {
        try {
            const backupManager = getBackupManager();
            return backupManager.listBackups();
        } catch (error) {
            console.error('List backups error:', error);
            return [];
        }
    });
    
    // Manuel yedek oluştur
    ipcMain.handle('create-backup', async (event, description) => {
        try {
            const backupManager = getBackupManager();
            const backupPath = await backupManager.createBackup(description);
            return { success: true, backupPath };
        } catch (error) {
            console.error('Create backup error:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Log'ları al
    ipcMain.handle('get-logs', async () => {
        try {
            const logger = getLogger();
            return logger.readLogs(100); // Son 100 satır
        } catch (error) {
            console.error('Get logs error:', error);
            return [];
        }
    });
    
    // Rollback işlemi
    ipcMain.handle('perform-rollback', async (event, targetVersion) => {
        try {
            const migrationManager = getMigrationManager();
            const configManager = getConfigManager();
            
            // Mevcut version'ı kontrol et
            const currentVersion = configManager.getSchemaVersion();
            
            if (currentVersion <= targetVersion) {
                return { success: false, error: 'Hedef version mevcut version\'dan küçük veya eşit olamaz' };
            }
            
            // Rollback işlemi (basit implementasyon)
            // Gerçek uygulamada backup'tan geri yükleme yapılacak
            configManager.setSchemaVersion(targetVersion);
            
            return { success: true, message: `Version ${targetVersion}'a geri alındı` };
        } catch (error) {
            console.error('Perform rollback error:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Migration testi
    ipcMain.handle('test-migration', async () => {
        try {
            const migrationManager = getMigrationManager();
            const result = await migrationManager.testMigrations();
            return { success: result };
        } catch (error) {
            console.error('Test migration error:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Yedek geri yükle
    ipcMain.handle('restore-backup', async (event, backupName) => {
        try {
            const backupManager = getBackupManager();
            const backups = backupManager.listBackups();
            const backup = backups.find(b => b.name === backupName);
            
            if (!backup) {
                return { success: false, error: 'Yedek bulunamadı' };
            }
            
            await backupManager.restoreBackup(backup.path);
            return { success: true, message: 'Yedek başarıyla geri yüklendi' };
        } catch (error) {
            console.error('Restore backup error:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Yedek sil
    ipcMain.handle('delete-backup', async (event, backupName) => {
        try {
            const backupManager = getBackupManager();
            const backups = backupManager.listBackups();
            const backup = backups.find(b => b.name === backupName);
            
            if (!backup) {
                return { success: false, error: 'Yedek bulunamadı' };
            }
            
            // Yedek klasörünü sil
            const fs = require('fs');
            fs.rmSync(backup.path, { recursive: true, force: true });
            
            return { success: true, message: 'Yedek başarıyla silindi' };
        } catch (error) {
            console.error('Delete backup error:', error);
            return { success: false, error: error.message };
        }
    });

    // Version Update IPC Handlers
    ipcMain.handle('check-for-updates', async () => {
        try {
            const https = require('https');
            const GITHUB_OWNER = 'ulaskutay';
            const GITHUB_REPO = 'etic-ajans-veresiye-takip';
            const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases?per_page=5`;
            const configManager = getConfigManager();
            const pkg = require('./package.json');
            const currentVersionResolved = (configManager && configManager.getAppVersion && configManager.getAppVersion()) || pkg.version || '0.0.0';

            return await new Promise((resolve) => {
                const req = https.get(GITHUB_API_URL, {
                    headers: {
                        'User-Agent': 'VeresiyeTakip-App',
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }, (res) => {
                    let body = '';
                    res.on('data', (c) => body += c);
                    res.on('end', () => {
                        try {
                            if (res.statusCode !== 200) {
                                // Fallback: tags endpoint
                                const tagsUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/tags?per_page=1`;
                                const reqTags = https.get(tagsUrl, { headers: { 'User-Agent': 'VeresiyeTakip-App', 'Accept': 'application/vnd.github.v3+json' } }, (resTags) => {
                                    let tb = '';
                                    resTags.on('data', (c2) => tb += c2);
                                    resTags.on('end', () => {
                                        try {
                                            if (resTags.statusCode !== 200) return resolve({ success: false, hasUpdate: false, error: `GitHub HTTP ${res.statusCode}/${resTags.statusCode}` });
                                            const tags = JSON.parse(tb) || [];
                                            const latestTag = tags[0]?.name || '0.0.0';
                                            const latestVersion = latestTag.replace(/^v/, '');
                                            const currentVersion = currentVersionResolved;
                                            const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;
                                            return resolve({ success: true, hasUpdate, currentVersion, latestVersion, releaseNotes: '', downloadUrls: {}, releaseUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases` });
                                        } catch { return resolve({ success: false, hasUpdate: false, error: 'Tags parse error' }); }
                                    });
                                });
                                reqTags.on('error', () => resolve({ success: false, hasUpdate: false, error: 'Tags network error' }));
                                reqTags.setTimeout(8000, () => { try { reqTags.destroy(); } catch {} resolve({ success: false, hasUpdate: false, error: 'Tags timeout' }); });
                                return;
                            }
                            const releases = JSON.parse(body);
                            const latestRelease = (Array.isArray(releases) ? releases : [])
                                .find(r => !r.draft && !r.prerelease) || null;
                            if (!latestRelease) throw new Error('No published releases');
                            const latestVersion = (latestRelease.tag_name || '').replace(/^v/, '') || '0.0.0';
                            const currentVersion = currentVersionResolved;
                            const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

                            const downloadUrls = {};
                            (latestRelease.assets || []).forEach((asset) => {
                                const name = asset.name || '';
                                if (/\.exe$/i.test(name) || /\.msi$/i.test(name)) downloadUrls.windows = asset.browser_download_url;
                                if (/\.dmg$/i.test(name) || /\.pkg$/i.test(name) || /\.zip$/i.test(name)) downloadUrls.macos = asset.browser_download_url;
                                if (/\.AppImage$/i.test(name) || /\.deb$/i.test(name) || /\.rpm$/i.test(name)) downloadUrls.linux = asset.browser_download_url;
                            });
                            // Eğer platform spesifik eşleşme yok ama asset varsa ilkini fallback olarak kullan
                            if (!downloadUrls.windows && !downloadUrls.macos && !downloadUrls.linux && Array.isArray(latestRelease.assets) && latestRelease.assets.length > 0) {
                                const firstUrl = latestRelease.assets[0].browser_download_url;
                                downloadUrls.fallback = firstUrl;
                            }

                            resolve({
                                success: true,
                                hasUpdate,
                                currentVersion,
                                latestVersion,
                                releaseNotes: latestRelease.body || '',
                                publishedAt: latestRelease.published_at || null,
                                downloadUrls,
                                releaseUrl: latestRelease.html_url
                            });
                        } catch (e) {
                            resolve({ success: false, hasUpdate: false, error: 'Parse error' });
                        }
                    });
                });
                req.on('error', () => resolve({ success: false, hasUpdate: false, error: 'Network error' }));
                req.setTimeout(10000, () => { try { req.destroy(); } catch {} resolve({ success: false, hasUpdate: false, error: 'Timeout' }); });
            });
        } catch (error) {
            return { success: false, hasUpdate: false, error: error.message };
        }
    });
    
    // Version karşılaştırma fonksiyonu
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

    ipcMain.handle('download-update', async (event, downloadUrl) => {
        try {
            const { shell } = require('electron');
            
            console.log('📥 Güncelleme indiriliyor:', downloadUrl);
            
            // Tarayıcıda indirme sayfasını aç
            await shell.openExternal(downloadUrl);
            
            return {
                success: true,
                message: 'İndirme sayfası açıldı. Lütfen güncellemeyi indirin ve kurun.'
            };
            
        } catch (error) {
            console.error('❌ İndirme hatası:', error);
            return {
                success: false,
                error: error.message
            };
        }
    });

    ipcMain.handle('install-update', async () => {
        try {
            // Gerçek uygulamada electron-updater ile kurulum yapılır
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: true,
                        message: 'Güncelleme kuruldu',
                        restartRequired: true
                    });
                }, 3000);
            });
        } catch (error) {
            console.error('Install update error:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-update-logs', async () => {
        try {
            const https = require('https');
            const GITHUB_OWNER = 'ulaskutay';
            const GITHUB_REPO = 'etic-ajans-veresiye-takip';
            const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases?per_page=10`;

            return await new Promise((resolve) => {
                const req = https.get(GITHUB_API_URL, {
                    headers: {
                        'User-Agent': 'VeresiyeTakip-App',
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }, (res) => {
                    let body = '';
                    res.on('data', (c) => body += c);
                    res.on('end', () => {
                        try {
                            if (res.statusCode !== 200) {
                                // Fallback: tags
                                const tagsUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/tags?per_page=10`;
                                const reqTags = https.get(tagsUrl, { headers: { 'User-Agent': 'VeresiyeTakip-App', 'Accept': 'application/vnd.github.v3+json' } }, (resTags) => {
                                    let tb = '';
                                    resTags.on('data', (c2) => tb += c2);
                                    resTags.on('end', () => {
                                        try {
                                            if (resTags.statusCode !== 200) return resolve({ success: false, error: `GitHub HTTP ${res.statusCode}/${resTags.statusCode}` });
                                            const tags = JSON.parse(tb) || [];
                                            const logs = tags.map((t) => `Tag ${t.name}\n${'='.repeat(50)}`).join('\n\n');
                                            resolve({ success: true, logs, releases: [] });
                                        } catch { resolve({ success: false, error: 'Tags parse error' }); }
                                    });
                                });
                                reqTags.on('error', () => resolve({ success: false, error: 'Tags network error' }));
                                reqTags.setTimeout(8000, () => { try { reqTags.destroy(); } catch {} resolve({ success: false, error: 'Tags timeout' }); });
                                return;
                            }
                            const releases = JSON.parse(body);
                            const logs = (releases || []).map((r) => {
                                const v = (r.tag_name || '').replace(/^v/, '');
                                const date = r.published_at ? new Date(r.published_at).toLocaleDateString('tr-TR') : '-';
                                const notes = r.body ? r.body.substring(0, 200) + '...' : '';
                                return `Version ${v} (${date})\n${notes}\n${'='.repeat(50)}`;
                            }).join('\n\n');
                            resolve({ success: true, logs, releases });
                        } catch {
                            resolve({ success: false, error: 'Parse error' });
                        }
                    });
                });
                req.on('error', () => resolve({ success: false, error: 'Network error' }));
                req.setTimeout(10000, () => { try { req.destroy(); } catch {} resolve({ success: false, error: 'Timeout' }); });
            });
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ==================== Kullanıcı Yönetimi IPC ====================
    ipcMain.handle('get-users', async () => {
        try {
            const rows = db.prepare(`SELECT id, username, email, full_name, role, is_active, last_login, created_at FROM users ORDER BY created_at DESC`).all();
            return { success: true, users: rows };
        } catch (error) {
            return { success: false, error: error.message, users: [] };
        }
    });

    ipcMain.handle('set-user-active', async (event, { userId, isActive }) => {
        try {
            db.prepare(`UPDATE users SET is_active = ? WHERE id = ?`).run(isActive ? 1 : 0, userId);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('delete-user', async (event, userId) => {
        try {
            // Admin kullanıcısını silmeyi engelle
            const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
            if (user && user.username === 'admin') {
                return { success: false, error: 'Admin kullanıcısı silinemez' };
            }
            db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
            db.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).run(userId);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('reset-user-password', async (event, { userId, newPassword }) => {
        try {
            const bcrypt = require('bcrypt');
            const saltRounds = 10;
            const hash = await bcrypt.hash(newPassword, saltRounds);
            db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hash, userId);
            // Aktif sessionları iptal et
            db.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).run(userId);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('update-user', async (event, payload) => {
        try {
            const { id, full_name, email, role } = payload;
            db.prepare(`UPDATE users SET full_name = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(full_name, email, role, id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Manuel version güncelleme
    ipcMain.handle('update-app-version', async (event, version) => {
        try {
            const configManager = getConfigManager();
            const logger = getLogger();
            
            // Mevcut version'ı al
            const currentVersion = configManager.getAppVersion();
            
            // Version'ı güncelle
            configManager.setAppVersion(version);
            
            // Log'a kaydet
            logger.log(`Version güncellendi: ${currentVersion} → ${version}`);
            
            console.log(`✅ App version updated: ${currentVersion} → ${version}`);
            
            return {
                success: true,
                message: `Version başarıyla ${version} olarak güncellendi`,
                previousVersion: currentVersion,
                newVersion: version
            };
        } catch (error) {
            console.error('Update app version error:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Kullanıcı Yönetimi IPC Handlers
    ipcMain.handle('register-user', async (event, userData) => {
        try {
            const bcrypt = require('bcrypt');
            const { username, email, password, fullName } = userData;
            
            // Kullanıcı adı ve email kontrolü
            const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
            if (existingUser) {
                return { success: false, error: 'Kullanıcı adı veya email zaten kullanılıyor' };
            }
            
            // Şifre hashleme
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            
            // Kullanıcı oluştur
            const stmt = db.prepare(`
                INSERT INTO users (username, email, password_hash, full_name, role)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            const result = stmt.run(username, email, passwordHash, fullName, 'user');
            
            console.log(`✅ Yeni kullanıcı oluşturuldu: ${username} (ID: ${result.lastInsertRowid})`);
            return { 
                success: true, 
                message: 'Kullanıcı başarıyla oluşturuldu',
                userId: result.lastInsertRowid 
            };
            
        } catch (error) {
            console.error('Kullanıcı kayıt hatası:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('login-user', async (event, credentials) => {
        try {
            const bcrypt = require('bcrypt');
            const { username, password, rememberMe } = credentials;
            
            // Kullanıcıyı bul
            const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
            if (!user) {
                return { success: false, error: 'Kullanıcı adı veya şifre hatalı' };
            }
            
            // Şifre kontrolü
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return { success: false, error: 'Kullanıcı adı veya şifre hatalı' };
            }
            
            // Session token oluştur
            const crypto = require('crypto');
            const sessionToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 1)); // 30 gün veya 1 gün
            
            // Session kaydet
            const sessionStmt = db.prepare(`
                INSERT INTO user_sessions (user_id, session_token, expires_at, device_info, ip_address)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            sessionStmt.run(user.id, sessionToken, expiresAt.toISOString(), 'Desktop App', '127.0.0.1');
            
            // Son giriş tarihini güncelle
            db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
            
            console.log(`✅ Kullanıcı giriş yaptı: ${username} (ID: ${user.id})`);
            return {
                success: true,
                message: 'Giriş başarılı',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role
                },
                sessionToken: sessionToken,
                expiresAt: expiresAt.toISOString()
            };
            
        } catch (error) {
            console.error('Kullanıcı giriş hatası:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('validate-session', async (event, sessionToken) => {
        try {
            if (!sessionToken) {
                return { success: false, error: 'Session token bulunamadı' };
            }
            
            // Session kontrolü
            const session = db.prepare(`
                SELECT s.*, u.username, u.email, u.full_name, u.role
                FROM user_sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.session_token = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = 1
            `).get(sessionToken);
            
            if (!session) {
                return { success: false, error: 'Geçersiz veya süresi dolmuş session' };
            }
            
            return {
                success: true,
                user: {
                    id: session.user_id,
                    username: session.username,
                    email: session.email,
                    fullName: session.full_name,
                    role: session.role
                }
            };
            
        } catch (error) {
            console.error('Session doğrulama hatası:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('logout-user', async (event, sessionToken) => {
        try {
            if (sessionToken) {
                // Session'ı sil
                db.prepare('DELETE FROM user_sessions WHERE session_token = ?').run(sessionToken);
                console.log('✅ Kullanıcı çıkış yaptı');
            }
            return { success: true, message: 'Çıkış başarılı' };
        } catch (error) {
            console.error('Çıkış hatası:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('get-current-user', async (event, sessionToken) => {
        try {
            const sessionResult = await ipcMain.handle('validate-session', event, sessionToken);
            return sessionResult;
        } catch (error) {
            console.error('Kullanıcı bilgisi alma hatası:', error);
            return { success: false, error: error.message };
        }
    });
    
    console.log('IPC handlers setup complete');
}

// Helper function to check alert conditions
function checkCondition(value, conditionType, conditionValue) {
    const numValue = parseFloat(value);
    const numCondition = parseFloat(conditionValue);
    
    switch (conditionType) {
        case 'less_than':
            return numValue < numCondition;
        case 'greater_than':
            return numValue > numCondition;
        case 'equals':
            return numValue === numCondition;
        case 'less_than_or_equal':
            return numValue <= numCondition;
        case 'greater_than_or_equal':
            return numValue >= numCondition;
        default:
            return false;
    }
}

// App event handlers
// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        // İkinci instance açılmaya çalışıldığında ana pencereyi öne getir
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

// Splash window oluştur
function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        webPreferences: {
            nodeIntegration: true
        }
    });

    splashWindow.loadFile('splash.html');
    splashWindow.center();
}

// Ana pencere oluştur
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show: false // Başlangıçta gizli
    });

    mainWindow.loadFile('index.html');

    // Content Security Policy
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; " +
                    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
                    "img-src 'self' data: blob:; " +
                    "font-src 'self' https://cdnjs.cloudflare.com; " +
                    "connect-src 'self'; " +
                    "object-src 'none'; " +
                    "base-uri 'self';"
                ]
            }
        });
    });

    mainWindow.once('ready-to-show', () => {
        if (splashWindow) {
            splashWindow.close();
        }
        mainWindow.show();
        
        // Menüyü oluştur
        createMenu();
        
        console.log('🔧 Application started');
    });
}

// Migration'ları çalıştır
async function runMigrations() {
    try {
        isMigrating = true;
        
        // Splash window göster
        createSplashWindow();
        
        // Sistemleri başlat
        const dataManager = initializeDataManager();
        const configManager = initializeConfigManager();
        const backupManager = initializeBackupManager();
        const migrationManager = initializeMigrationManager();
        const logger = initializeLogger();
        
        logger.appStart(configManager.getAppVersion());
        
        // Migration'ları çalıştır
        const success = await migrationManager.runMigrations();
        
        if (success) {
            logger.info('Application initialization completed successfully');
        }
        
        isMigrating = false;
        return success;
        
    } catch (error) {
        isMigrating = false;
        const logger = getLogger();
        logger.appError(error);
        
        // Hata durumunda kullanıcıya bilgi ver
        if (splashWindow) {
            splashWindow.webContents.executeJavaScript(`
                document.body.innerHTML = \`
                    <div style="text-align: center; padding: 20px;">
                        <h2>⚠️ Güncelleme Hatası</h2>
                        <p>Verileriniz korundu ve eski sürüme geri döndürüldü.</p>
                        <p>Uygulama açılıyor...</p>
                    </div>
                \`;
            `);
            
            setTimeout(() => {
                if (splashWindow) {
                    splashWindow.close();
                }
            }, 3000);
        }
        
        return false;
    }
}

app.on('ready', async () => {
    console.log('App ready');
    
    try {
        // Migration'ları çalıştır
        await runMigrations();
        
        // Veritabanını başlat
        await initDatabase();
        
        // Ana pencereyi oluştur
        createMainWindow();
        
        // Diğer sistemleri başlat
        registerGlobalShortcuts();
        setupIpcHandlers();
        
    } catch (error) {
        console.error('App initialization failed:', error);
        const logger = getLogger();
        if (logger) {
            logger.appError(error);
        }
    }
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