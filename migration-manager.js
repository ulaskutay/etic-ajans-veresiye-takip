const fs = require('fs');
const path = require('path');
const { getDataManager } = require('./data-manager');
const { getConfigManager } = require('./config-manager');
const { getBackupManager } = require('./backup-manager');

class MigrationManager {
    constructor() {
        this.dataManager = null;
        this.configManager = null;
        this.backupManager = null;
        this.migrations = new Map();
        this.targetVersion = 1; // Hedef schema version
    }

    // Migration Manager'ı başlat
    initialize() {
        this.dataManager = getDataManager();
        this.configManager = getConfigManager();
        this.backupManager = getBackupManager();
        this.loadMigrations();
    }

    // Migration'ları yükle
    loadMigrations() {
        const migrationsPath = this.dataManager.getPath('migrations');
        
        if (!fs.existsSync(migrationsPath)) {
            fs.mkdirSync(migrationsPath, { recursive: true });
        }

        // Built-in migration'ları kaydet
        this.registerBuiltinMigrations();
        
        // Dosya sisteminden migration'ları yükle
        this.loadMigrationFiles(migrationsPath);
    }

    // Built-in migration'ları kaydet
    registerBuiltinMigrations() {
        // Migration v1: customers.json'a phoneType alanı ekle
        this.migrations.set(1, async () => {
            console.log('🔄 Running migration v1: Adding phoneType to customers');
            
            const customersPath = this.dataManager.getFilePath('db', 'customers.json');
            
            if (fs.existsSync(customersPath)) {
                const customers = JSON.parse(fs.readFileSync(customersPath, 'utf8'));
                let updated = false;
                
                customers.forEach(customer => {
                    if (!customer.phoneType) {
                        // Telefon numarasına göre otomatik tür belirleme
                        if (customer.phone && customer.phone.startsWith('053')) {
                            customer.phoneType = 'mobile'; // Cep telefonu
                        } else if (customer.phone && customer.phone.startsWith('021')) {
                            customer.phoneType = 'work'; // İş telefonu
                        } else {
                            customer.phoneType = 'home'; // Ev telefonu
                        }
                        updated = true;
                    }
                });
                
                if (updated) {
                    fs.writeFileSync(customersPath, JSON.stringify(customers, null, 2));
                    console.log('✅ Migration v1 completed: Added phoneType to customers');
                } else {
                    console.log('✅ Migration v1 completed: No updates needed');
                }
            } else {
                console.log('✅ Migration v1 completed: customers.json not found, skipping');
            }
        });

        // Migration v2: settings.json theme yapısını güncelle
        this.migrations.set(2, async () => {
            console.log('🔄 Running migration v2: Updating theme structure');
            
            const settingsPath = this.dataManager.getFilePath('config', 'settings.json');
            
            if (fs.existsSync(settingsPath)) {
                const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                let updated = false;
                
                // Eski theme yapısını yeni appearance yapısına dönüştür
                if (settings.theme && !settings.appearance) {
                    settings.appearance = {
                        theme: settings.theme,
                        fontSize: 'medium',
                        language: 'tr'
                    };
                    delete settings.theme;
                    updated = true;
                }
                
                // Eksik alanları varsayılanla doldur
                if (!settings.appearance) {
                    settings.appearance = {
                        theme: 'light',
                        fontSize: 'medium',
                        language: 'tr'
                    };
                    updated = true;
                }
                
                if (updated) {
                    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
                    console.log('✅ Migration v2 completed: Updated theme structure');
                } else {
                    console.log('✅ Migration v2 completed: No updates needed');
                }
            } else {
                console.log('✅ Migration v2 completed: settings.json not found, skipping');
            }
        });

        // Migration v3: customers tablosuna yeni alanlar ekle
        this.migrations.set(3, async () => {
            console.log('🔄 Running migration v3: Adding new customer fields');
            
            // Bu migration database schema değişikliği yapacak
            // main.js'deki database initialization'da zaten yeni alanlar var
            console.log('✅ Migration v3 completed: Customer fields already up to date');
        });

        // Migration v4: products tablosuna yeni alanlar ekle
        this.migrations.set(4, async () => {
            console.log('🔄 Running migration v4: Adding new product fields');
            
            // Bu migration database schema değişikliği yapacak
            // main.js'deki database initialization'da zaten yeni alanlar var
            console.log('✅ Migration v4 completed: Product fields already up to date');
        });

        // Migration v5: alerts sistemi ekle
        this.migrations.set(5, async () => {
            console.log('🔄 Running migration v5: Adding alerts system');
            
            // Bu migration database schema değişikliği yapacak
            // main.js'deki database initialization'da zaten alerts tabloları var
            console.log('✅ Migration v5 completed: Alerts system already up to date');
        });
    }

    // Dosya sisteminden migration'ları yükle
    loadMigrationFiles(migrationsPath) {
        const files = fs.readdirSync(migrationsPath);
        
        files.forEach(file => {
            if (file.endsWith('.js')) {
                const version = parseInt(file.replace('migration-', '').replace('.js', ''));
                
                if (!isNaN(version)) {
                    try {
                        const migrationPath = path.join(migrationsPath, file);
                        const migration = require(migrationPath);
                        
                        if (typeof migration === 'function') {
                            this.migrations.set(version, migration);
                            console.log(`📁 Loaded migration file: ${file}`);
                        }
                    } catch (error) {
                        console.error(`❌ Error loading migration ${file}:`, error);
                    }
                }
            }
        });
    }

    // Mevcut schema version'ı al
    getCurrentSchemaVersion() {
        return this.configManager.getSchemaVersion();
    }

    // Hedef schema version'ı al
    getTargetSchemaVersion() {
        return this.targetVersion;
    }

    // Hedef schema version'ı ayarla
    setTargetSchemaVersion(version) {
        this.targetVersion = version;
    }

    // Migration'ları çalıştır
    async runMigrations() {
        const currentVersion = this.getCurrentSchemaVersion();
        const targetVersion = this.getTargetSchemaVersion();
        
        console.log(`🔄 Starting migrations: ${currentVersion} → ${targetVersion}`);
        
        if (currentVersion >= targetVersion) {
            console.log('✅ No migrations needed');
            return true;
        }

        try {
            // Migration öncesi yedek oluştur
            console.log('🛡️ Creating pre-migration backup...');
            await this.backupManager.createBackup(`Pre-migration backup (v${currentVersion} → v${targetVersion})`);
            
            // Migration'ları sırayla çalıştır
            for (let version = currentVersion + 1; version <= targetVersion; version++) {
                console.log(`🔄 Running migration v${version}...`);
                
                const migration = this.migrations.get(version);
                if (!migration) {
                    console.log(`⚠️ Migration v${version} not found, skipping`);
                    continue;
                }
                
                try {
                    await migration();
                    
                    // Schema version'ı güncelle
                    this.configManager.setSchemaVersion(version);
                    
                    console.log(`✅ Migration v${version} completed successfully`);
                    
                } catch (error) {
                    console.error(`❌ Migration v${version} failed:`, error);
                    
                    // Hata durumunda son yedeği geri yükle
                    console.log('🔄 Restoring from backup...');
                    await this.restoreFromBackup();
                    
                    throw new Error(`Migration v${version} failed: ${error.message}`);
                }
            }
            
            console.log('🎉 All migrations completed successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Migration process failed:', error);
            throw error;
        }
    }

    // Backup'tan geri yükle
    async restoreFromBackup() {
        try {
            const backups = this.backupManager.listBackups();
            
            if (backups.length === 0) {
                throw new Error('No backups available for restore');
            }
            
            // En son yedeği bul
            const latestBackup = backups.find(backup => 
                backup.info && backup.info.description && 
                backup.info.description.includes('Pre-migration backup')
            ) || backups[0];
            
            console.log(`🔄 Restoring from backup: ${latestBackup.name}`);
            await this.backupManager.restoreBackup(latestBackup.path);
            
            console.log('✅ Restore completed successfully');
            
        } catch (error) {
            console.error('❌ Restore failed:', error);
            throw error;
        }
    }

    // Migration durumunu kontrol et
    checkMigrationStatus() {
        const currentVersion = this.getCurrentSchemaVersion();
        const targetVersion = this.getTargetSchemaVersion();
        
        return {
            currentVersion,
            targetVersion,
            needsMigration: currentVersion < targetVersion,
            availableMigrations: Array.from(this.migrations.keys()).filter(v => v > currentVersion)
        };
    }

    // Migration'ları test et
    async testMigrations() {
        console.log('🧪 Testing migrations...');
        
        const status = this.checkMigrationStatus();
        console.log('Migration status:', status);
        
        if (status.needsMigration) {
            console.log('🔄 Running test migrations...');
            return await this.runMigrations();
        } else {
            console.log('✅ No migrations needed');
            return true;
        }
    }

    // Migration'ı manuel olarak çalıştır
    async runSingleMigration(version) {
        const migration = this.migrations.get(version);
        
        if (!migration) {
            throw new Error(`Migration v${version} not found`);
        }
        
        console.log(`🔄 Running single migration v${version}...`);
        
        try {
            await migration();
            this.configManager.setSchemaVersion(version);
            console.log(`✅ Migration v${version} completed successfully`);
            return true;
        } catch (error) {
            console.error(`❌ Migration v${version} failed:`, error);
            throw error;
        }
    }
}

// Singleton instance
let migrationManager = null;

// Migration Manager'ı başlat ve döndür
function initializeMigrationManager() {
    if (!migrationManager) {
        migrationManager = new MigrationManager();
        migrationManager.initialize();
    }
    return migrationManager;
}

// Migration Manager instance'ını döndür
function getMigrationManager() {
    if (!migrationManager) {
        throw new Error('MigrationManager not initialized. Call initializeMigrationManager() first.');
    }
    return migrationManager;
}

module.exports = {
    MigrationManager,
    initializeMigrationManager,
    getMigrationManager
};
