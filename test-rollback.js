const fs = require('fs');
const path = require('path');
const os = require('os');

// Basit DataManager
class SimpleDataManager {
    constructor() {
        this.basePath = path.join(os.homedir(), '.veresiye-takip', 'VeresiyeTakip');
        this.paths = {
            base: this.basePath,
            db: path.join(this.basePath, 'db'),
            config: path.join(this.basePath, 'config'),
            backups: path.join(this.basePath, 'backups'),
            logs: path.join(this.basePath, 'logs'),
            migrations: path.join(this.basePath, 'migrations')
        };
    }

    getFilePath(folder, filename) {
        const folderPath = this.paths[folder];
        if (!folderPath) {
            throw new Error(`Unknown folder: ${folder}`);
        }
        return path.join(folderPath, filename);
    }
}

// Basit ConfigManager
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
                this.config = { schemaVersion: 0 };
            }
        } catch (error) {
            this.config = { schemaVersion: 0 };
        }
    }

    saveConfig() {
        const data = JSON.stringify(this.config, null, 2);
        fs.writeFileSync(this.configPath, data, 'utf8');
    }

    getSchemaVersion() {
        return this.config.schemaVersion || 0;
    }

    setSchemaVersion(version) {
        this.config.schemaVersion = version;
        // Tarihi manuel olarak 2024 yılına ayarla
        const now = new Date();
        now.setFullYear(2024); // Yılı 2024 olarak ayarla
        this.config.lastMigration = now.toISOString();
        this.saveConfig();
    }
}

// Rollback Test
async function testRollback() {
    console.log('🔄 Testing Rollback System...\n');
    
    const dataManager = new SimpleDataManager();
    const configManager = new SimpleConfigManager(dataManager);
    
    console.log('📋 Current Status (Before Rollback):');
    console.log(`   Schema Version: ${configManager.getSchemaVersion()}`);
    
    const customersPath = dataManager.getFilePath('db', 'customers.json');
    if (fs.existsSync(customersPath)) {
        const customers = JSON.parse(fs.readFileSync(customersPath, 'utf8'));
        console.log(`   Customers Count: ${customers.length}`);
        console.log(`   First Customer PhoneType: ${customers[0]?.phoneType}`);
        console.log(`   Second Customer PhoneType: ${customers[1]?.phoneType}`);
    }
    
    console.log('\n🔄 Rolling back to v0...');
    
    // Rollback: phoneType alanını kaldır
    if (fs.existsSync(customersPath)) {
        const customers = JSON.parse(fs.readFileSync(customersPath, 'utf8'));
        let updated = false;
        
        customers.forEach(customer => {
            if (customer.phoneType) {
                delete customer.phoneType;
                updated = true;
            }
        });
        
        if (updated) {
            fs.writeFileSync(customersPath, JSON.stringify(customers, null, 2));
            console.log('✅ Rollback completed: Removed phoneType from customers');
        } else {
            console.log('✅ Rollback completed: No changes needed');
        }
    }
    
    // Schema version'ı geri al
    configManager.setSchemaVersion(0);
    
    console.log('\n📋 After Rollback:');
    console.log(`   Schema Version: ${configManager.getSchemaVersion()}`);
    
    if (fs.existsSync(customersPath)) {
        const customers = JSON.parse(fs.readFileSync(customersPath, 'utf8'));
        console.log(`   Customers Count: ${customers.length}`);
        console.log(`   First Customer Phone: ${customers[0]?.phone}`);
        console.log(`   First Customer PhoneType: ${customers[0]?.phoneType || 'REMOVED'}`);
        console.log(`   Second Customer PhoneType: ${customers[1]?.phoneType || 'REMOVED'}`);
    }
    
    console.log('\n🎉 Rollback test completed successfully!');
    console.log('\n💡 Now you can run migration again to see the forward process!');
}

// Test'i çalıştır
testRollback().catch(console.error);
