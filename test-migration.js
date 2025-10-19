const fs = require('fs');
const path = require('path');
const os = require('os');

// Basit DataManager (Electron context'i olmadan)
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

// Basit Migration Test
async function testMigration() {
    console.log('🧪 Testing Migration System...\n');
    
    const dataManager = new SimpleDataManager();
    const configManager = new SimpleConfigManager(dataManager);
    
    console.log('📋 Current Status:');
    console.log(`   Schema Version: ${configManager.getSchemaVersion()}`);
    
    const customersPath = dataManager.getFilePath('db', 'customers.json');
    if (fs.existsSync(customersPath)) {
        const customers = JSON.parse(fs.readFileSync(customersPath, 'utf8'));
        console.log(`   Customers Count: ${customers.length}`);
        console.log(`   First Customer Phone: ${customers[0]?.phone}`);
        console.log(`   First Customer PhoneType: ${customers[0]?.phoneType || 'NOT SET'}`);
    }
    
    console.log('\n🔄 Running Migration v1...');
    
    // Migration v1: phoneType ekleme
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
    }
    
    // Schema version'ı güncelle
    configManager.setSchemaVersion(1);
    
    console.log('\n📋 After Migration:');
    console.log(`   Schema Version: ${configManager.getSchemaVersion()}`);
    
    if (fs.existsSync(customersPath)) {
        const customers = JSON.parse(fs.readFileSync(customersPath, 'utf8'));
        console.log(`   Customers Count: ${customers.length}`);
        console.log(`   First Customer Phone: ${customers[0]?.phone}`);
        console.log(`   First Customer PhoneType: ${customers[0]?.phoneType}`);
        console.log(`   Second Customer PhoneType: ${customers[1]?.phoneType}`);
    }
    
    console.log('\n🎉 Migration test completed successfully!');
}

// Test'i çalıştır
testMigration().catch(console.error);
