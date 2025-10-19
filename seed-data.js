const fs = require('fs');
const path = require('path');
const os = require('os');

// Electron context'i dışında çalıştırıldığında alternatif path
function getUserDataPath() {
    if (typeof require !== 'undefined') {
        try {
            const { app } = require('electron');
            return app.getPath('userData');
        } catch (error) {
            // Electron context'i dışında, varsayılan path kullan
            return path.join(os.homedir(), '.veresiye-takip');
        }
    }
    return path.join(os.homedir(), '.veresiye-takip');
}

// Basit DataManager alternatifi
class SimpleDataManager {
    constructor() {
        this.basePath = path.join(getUserDataPath(), 'VeresiyeTakip');
        this.paths = {
            base: this.basePath,
            db: path.join(this.basePath, 'db'),
            config: path.join(this.basePath, 'config'),
            backups: path.join(this.basePath, 'backups'),
            logs: path.join(this.basePath, 'logs'),
            migrations: path.join(this.basePath, 'migrations')
        };
        this.createDirectories();
    }

    createDirectories() {
        Object.values(this.paths).forEach(dirPath => {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log('📂 Created directory:', dirPath);
            }
        });
    }

    getPath(key) {
        return this.paths[key] || null;
    }

    getFilePath(folder, filename) {
        const folderPath = this.paths[folder];
        if (!folderPath) {
            throw new Error(`Unknown folder: ${folder}`);
        }
        return path.join(folderPath, filename);
    }
}

// Basit ConfigManager alternatifi
class SimpleConfigManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.configPath = dataManager.getFilePath('config', 'config.json');
        this.config = null;
        this.loadConfig();
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, 'utf8');
                this.config = JSON.parse(data);
            } else {
                this.config = {
                    schemaVersion: 0,
                    appVersion: '1.0.0',
                    lastBackup: null,
                    lastMigration: null,
                    settings: {
                        theme: 'light',
                        language: 'tr',
                        autoBackup: true,
                        backupRetention: 30
                    }
                };
                this.saveConfig();
            }
        } catch (error) {
            console.error('❌ Config load error:', error);
            this.config = {
                schemaVersion: 0,
                appVersion: '1.0.0',
                lastBackup: null,
                lastMigration: null,
                settings: {
                    theme: 'light',
                    language: 'tr',
                    autoBackup: true,
                    backupRetention: 30
                }
            };
        }
    }

    saveConfig() {
        try {
            const data = JSON.stringify(this.config, null, 2);
            fs.writeFileSync(this.configPath, data, 'utf8');
        } catch (error) {
            console.error('❌ Config save error:', error);
            throw error;
        }
    }

    getSchemaVersion() {
        return this.config.schemaVersion || 0;
    }

    setSchemaVersion(version) {
        this.config.schemaVersion = version;
        this.config.lastMigration = new Date().toISOString();
        this.saveConfig();
    }

    getAppVersion() {
        return this.config.appVersion || '1.0.0';
    }

    setAppVersion(version) {
        this.config.appVersion = version;
        this.saveConfig();
    }

    resetConfig() {
        this.config = {
            schemaVersion: 0,
            appVersion: '1.0.0',
            lastBackup: null,
            lastMigration: null,
            settings: {
                theme: 'light',
                language: 'tr',
                autoBackup: true,
                backupRetention: 30
            }
        };
        this.saveConfig();
    }
}

class SeedDataManager {
    constructor() {
        this.dataManager = null;
        this.configManager = null;
    }

    // Seed Data Manager'ı başlat
    initialize() {
        this.dataManager = new SimpleDataManager();
        this.configManager = new SimpleConfigManager(this.dataManager);
    }

    // v0 formatında test verisi oluştur
    createV0Data() {
        console.log('🌱 Creating v0 test data...');
        
        const v0Data = {
            customers: [
                {
                    id: 1,
                    name: 'Ahmet Yılmaz',
                    phone: '0532 123 45 67',
                    address: 'İstanbul, Türkiye',
                    debt: 1500.50,
                    credit: 0
                },
                {
                    id: 2,
                    name: 'Fatma Demir',
                    phone: '0533 987 65 43',
                    address: 'Ankara, Türkiye',
                    debt: 2300.75,
                    credit: 500.00
                }
            ],
            products: [
                {
                    id: 1,
                    name: 'Çay',
                    price: 15.50,
                    stock: 100,
                    unit: 'kg'
                },
                {
                    id: 2,
                    name: 'Şeker',
                    price: 8.75,
                    stock: 50,
                    unit: 'kg'
                }
            ],
            sales: [
                {
                    id: 1,
                    customerId: 1,
                    productId: 1,
                    quantity: 2,
                    price: 15.50,
                    total: 31.00,
                    date: '2024-01-15'
                }
            ]
        };

        // Dosyaları kaydet
        this.saveDataFiles(v0Data, 'v0');
        console.log('✅ v0 test data created');
    }

    // v1 formatında test verisi oluştur (createdAt alanı ile)
    createV1Data() {
        console.log('🌱 Creating v1 test data...');
        
        const v1Data = {
            customers: [
                {
                    id: 1,
                    name: 'Mehmet Kaya',
                    phone: '0532 111 22 33',
                    address: 'İzmir, Türkiye',
                    debt: 2000.00,
                    credit: 100.00,
                    createdAt: '2024-01-01T10:00:00.000Z'
                },
                {
                    id: 2,
                    name: 'Ayşe Özkan',
                    phone: '0533 444 55 66',
                    address: 'Bursa, Türkiye',
                    debt: 1500.25,
                    credit: 0,
                    createdAt: '2024-01-02T14:30:00.000Z'
                }
            ],
            products: [
                {
                    id: 1,
                    name: 'Kahve',
                    price: 25.00,
                    stock: 75,
                    unit: 'kg',
                    createdAt: '2024-01-01T09:00:00.000Z'
                },
                {
                    id: 2,
                    name: 'Süt',
                    price: 12.50,
                    stock: 30,
                    unit: 'lt',
                    createdAt: '2024-01-01T09:15:00.000Z'
                }
            ],
            sales: [
                {
                    id: 1,
                    customerId: 1,
                    productId: 1,
                    quantity: 1,
                    price: 25.00,
                    total: 25.00,
                    date: '2024-01-15',
                    createdAt: '2024-01-15T16:45:00.000Z'
                }
            ]
        };

        // Config'i v1 olarak ayarla
        this.configManager.setSchemaVersion(1);
        this.configManager.setAppVersion('1.1.0');
        
        // Dosyaları kaydet
        this.saveDataFiles(v1Data, 'v1');
        console.log('✅ v1 test data created');
    }

    // v2 formatında test verisi oluştur (appearance yapısı ile)
    createV2Data() {
        console.log('🌱 Creating v2 test data...');
        
        const v2Data = {
            customers: [
                {
                    id: 1,
                    name: 'Ali Veli',
                    phone: '0532 777 88 99',
                    address: 'Antalya, Türkiye',
                    debt: 3000.00,
                    credit: 200.00,
                    createdAt: '2024-01-01T10:00:00.000Z',
                    updatedAt: '2024-01-15T16:00:00.000Z'
                }
            ],
            products: [
                {
                    id: 1,
                    name: 'Un',
                    price: 18.00,
                    stock: 200,
                    unit: 'kg',
                    createdAt: '2024-01-01T09:00:00.000Z',
                    updatedAt: '2024-01-15T16:00:00.000Z'
                }
            ],
            sales: [
                {
                    id: 1,
                    customerId: 1,
                    productId: 1,
                    quantity: 5,
                    price: 18.00,
                    total: 90.00,
                    date: '2024-01-15',
                    createdAt: '2024-01-15T16:45:00.000Z',
                    updatedAt: '2024-01-15T16:45:00.000Z'
                }
            ],
            settings: {
                appearance: {
                    theme: 'dark',
                    fontSize: 'large',
                    language: 'tr'
                },
                notifications: {
                    enabled: true,
                    sound: true
                }
            }
        };

        // Config'i v2 olarak ayarla
        this.configManager.setSchemaVersion(2);
        this.configManager.setAppVersion('1.2.0');
        
        // Dosyaları kaydet
        this.saveDataFiles(v2Data, 'v2');
        console.log('✅ v2 test data created');
    }

    // Veri dosyalarını kaydet
    saveDataFiles(data, version) {
        const dbPath = this.dataManager.getPath('db');
        const configPath = this.dataManager.getPath('config');
        
        // db/ klasörüne kaydet
        if (data.customers) {
            fs.writeFileSync(
                path.join(dbPath, 'customers.json'),
                JSON.stringify(data.customers, null, 2)
            );
        }
        
        if (data.products) {
            fs.writeFileSync(
                path.join(dbPath, 'products.json'),
                JSON.stringify(data.products, null, 2)
            );
        }
        
        if (data.sales) {
            fs.writeFileSync(
                path.join(dbPath, 'sales.json'),
                JSON.stringify(data.sales, null, 2)
            );
        }
        
        // config/ klasörüne kaydet
        if (data.settings) {
            fs.writeFileSync(
                path.join(configPath, 'settings.json'),
                JSON.stringify(data.settings, null, 2)
            );
        }
        
        // Version bilgisini kaydet
        fs.writeFileSync(
            path.join(configPath, `version-${version}.json`),
            JSON.stringify({
                version: version,
                created: new Date().toISOString(),
                description: `Test data for version ${version}`
            }, null, 2)
        );
    }

    // Belirli version'ı temizle
    clearVersion(version) {
        console.log(`🧹 Clearing ${version} test data...`);
        
        const dbPath = this.dataManager.getPath('db');
        const configPath = this.dataManager.getPath('config');
        
        // Dosyaları sil
        const filesToDelete = [
            'customers.json',
            'products.json',
            'sales.json',
            'settings.json',
            `version-${version}.json`
        ];
        
        filesToDelete.forEach(file => {
            const filePath = path.join(configPath, file);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });
        
        // Config'i sıfırla
        this.configManager.resetConfig();
        
        console.log(`✅ ${version} test data cleared`);
    }

    // Tüm test verilerini temizle
    clearAllTestData() {
        console.log('🧹 Clearing all test data...');
        
        const dbPath = this.dataManager.getPath('db');
        const configPath = this.dataManager.getPath('config');
        
        // Tüm JSON dosyalarını sil
        [dbPath, configPath].forEach(dirPath => {
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath);
                files.forEach(file => {
                    if (file.endsWith('.json')) {
                        fs.unlinkSync(path.join(dirPath, file));
                    }
                });
            }
        });
        
        // Config'i sıfırla
        this.configManager.resetConfig();
        
        console.log('✅ All test data cleared');
    }

    // Test verilerini listele
    listTestData() {
        console.log('📋 Listing test data...');
        
        const dbPath = this.dataManager.getPath('db');
        const configPath = this.dataManager.getPath('config');
        
        const data = {
            db: [],
            config: []
        };
        
        [dbPath, configPath].forEach(dirPath => {
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath);
                files.forEach(file => {
                    if (file.endsWith('.json')) {
                        const filePath = path.join(dirPath, file);
                        const stats = fs.statSync(filePath);
                        
                        if (dirPath === dbPath) {
                            data.db.push({
                                name: file,
                                size: stats.size,
                                modified: stats.mtime
                            });
                        } else {
                            data.config.push({
                                name: file,
                                size: stats.size,
                                modified: stats.mtime
                            });
                        }
                    }
                });
            }
        });
        
        console.log('Database files:', data.db);
        console.log('Config files:', data.config);
        
        return data;
    }
}

// CLI komutları
function runSeedCommand() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const seedManager = new SeedDataManager();
    seedManager.initialize();
    
    switch (command) {
        case 'v0':
            seedManager.createV0Data();
            break;
        case 'v1':
            seedManager.createV1Data();
            break;
        case 'v2':
            seedManager.createV2Data();
            break;
        case 'clear':
            const version = args[1];
            if (version) {
                seedManager.clearVersion(version);
            } else {
                seedManager.clearAllTestData();
            }
            break;
        case 'list':
            seedManager.listTestData();
            break;
        default:
            console.log('Usage:');
            console.log('  node seed-data.js v0     - Create v0 test data');
            console.log('  node seed-data.js v1     - Create v1 test data');
            console.log('  node seed-data.js v2     - Create v2 test data');
            console.log('  node seed-data.js clear  - Clear all test data');
            console.log('  node seed-data.js clear v1 - Clear v1 test data');
            console.log('  node seed-data.js list   - List test data');
            break;
    }
}

// Eğer doğrudan çalıştırılıyorsa CLI komutunu çalıştır
if (require.main === module) {
    runSeedCommand();
}

module.exports = {
    SeedDataManager,
    runSeedCommand
};
