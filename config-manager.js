const fs = require('fs');
const path = require('path');
const { getDataManager } = require('./data-manager');

class ConfigManager {
    constructor() {
        this.configPath = null;
        this.config = null;
    }

    // Config dosyası yolunu ayarla
    initialize() {
        const dataManager = getDataManager();
        this.configPath = dataManager.getFilePath('config', 'config.json');
        this.loadConfig();
    }

    // Config dosyasını yükle
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, 'utf8');
                this.config = JSON.parse(data);
                console.log('📋 Config loaded:', this.config);
            } else {
                // Varsayılan config oluştur
                this.config = {
                    schemaVersion: 0,
                    appVersion: '1.1.0',
                    lastBackup: null,
                    lastMigration: null,
                    settings: {
                        theme: 'light',
                        language: 'tr',
                        autoBackup: true,
                        backupRetention: 30 // gün
                    }
                };
                this.saveConfig();
                console.log('📋 Default config created');
            }
        } catch (error) {
            console.error('❌ Config load error:', error);
            // Hata durumunda varsayılan config
            this.config = {
                schemaVersion: 0,
                appVersion: '1.1.0',
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

    // Config dosyasını kaydet
    saveConfig() {
        try {
            const data = JSON.stringify(this.config, null, 2);
            fs.writeFileSync(this.configPath, data, 'utf8');
            console.log('💾 Config saved');
        } catch (error) {
            console.error('❌ Config save error:', error);
            throw error;
        }
    }

    // Schema version'ı al
    getSchemaVersion() {
        return this.config.schemaVersion || 0;
    }

    // Schema version'ı güncelle
    setSchemaVersion(version) {
        this.config.schemaVersion = version;
        // Tarihi manuel olarak 2024 yılına ayarla
        const now = new Date();
        now.setFullYear(2024); // Yılı 2024 olarak ayarla
        this.config.lastMigration = now.toISOString();
        this.saveConfig();
        console.log(`🔄 Schema version updated to: ${version}`);
    }

    // App version'ı al
    getAppVersion() {
        return this.config.appVersion || '1.1.0';
    }

    // App version'ı güncelle
    setAppVersion(version) {
        this.config.appVersion = version;
        this.saveConfig();
    }

    // Setting al
    getSetting(key, defaultValue = null) {
        return this.config.settings?.[key] ?? defaultValue;
    }

    // Setting güncelle
    setSetting(key, value) {
        if (!this.config.settings) {
            this.config.settings = {};
        }
        this.config.settings[key] = value;
        this.saveConfig();
    }

    // Son yedek tarihini güncelle
    setLastBackup(date = null) {
        this.config.lastBackup = date || new Date().toISOString();
        this.saveConfig();
    }

    // Son yedek tarihini al
    getLastBackup() {
        return this.config.lastBackup;
    }

    // Son migration tarihini al
    getLastMigration() {
        return this.config.lastMigration;
    }

    // Config'i tamamen al
    getConfig() {
        return { ...this.config };
    }

    // Config'i tamamen güncelle
    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
    }

    // Config'i sıfırla
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
        console.log('🔄 Config reset to defaults');
    }

    // Config dosyasının var olup olmadığını kontrol et
    exists() {
        return fs.existsSync(this.configPath);
    }

    // Config dosyasını sil
    deleteConfig() {
        if (fs.existsSync(this.configPath)) {
            fs.unlinkSync(this.configPath);
            console.log('🗑️ Config file deleted');
        }
    }
}

// Singleton instance
let configManager = null;

// Config Manager'ı başlat ve döndür
function initializeConfigManager() {
    if (!configManager) {
        configManager = new ConfigManager();
        configManager.initialize();
    }
    return configManager;
}

// Config Manager instance'ını döndür
function getConfigManager() {
    if (!configManager) {
        throw new Error('ConfigManager not initialized. Call initializeConfigManager() first.');
    }
    return configManager;
}

module.exports = {
    ConfigManager,
    initializeConfigManager,
    getConfigManager
};
