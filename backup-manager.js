const fs = require('fs');
const path = require('path');
const { getDataManager } = require('./data-manager');
const { getConfigManager } = require('./config-manager');

class BackupManager {
    constructor() {
        this.dataManager = null;
        this.configManager = null;
    }

    // Backup Manager'ı başlat
    initialize() {
        this.dataManager = getDataManager();
        this.configManager = getConfigManager();
    }

    // Yedek oluştur
    async createBackup(description = 'Manual backup') {
        try {
            const timestamp = this.getTimestamp();
            const backupPath = path.join(this.dataManager.getPath('backups'), timestamp);
            
            console.log(`🔄 Creating backup: ${timestamp}`);
            
            // Backup klasörünü oluştur
            if (!fs.existsSync(backupPath)) {
                fs.mkdirSync(backupPath, { recursive: true });
            }

            // db/ klasörünü kopyala
            await this.copyDirectory(
                this.dataManager.getPath('db'),
                path.join(backupPath, 'db')
            );

            // config/ klasörünü kopyala
            await this.copyDirectory(
                this.dataManager.getPath('config'),
                path.join(backupPath, 'config')
            );

            // Backup bilgilerini kaydet
            const backupInfo = {
                timestamp: timestamp,
                description: description,
                created: new Date().toISOString(),
                schemaVersion: this.configManager.getSchemaVersion(),
                appVersion: this.configManager.getAppVersion(),
                size: this.calculateBackupSize(backupPath)
            };

            fs.writeFileSync(
                path.join(backupPath, 'backup-info.json'),
                JSON.stringify(backupInfo, null, 2)
            );

            // Config'de son yedek tarihini güncelle
            this.configManager.setLastBackup();

            console.log(`✅ Backup created successfully: ${timestamp}`);
            return backupPath;

        } catch (error) {
            console.error('❌ Backup creation failed:', error);
            throw error;
        }
    }

    // Klasörü kopyala
    async copyDirectory(source, destination) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(source)) {
                console.log(`⚠️ Source directory doesn't exist: ${source}`);
                resolve();
                return;
            }

            // Hedef klasörü oluştur
            if (!fs.existsSync(destination)) {
                fs.mkdirSync(destination, { recursive: true });
            }

            // Dosyaları kopyala
            const files = fs.readdirSync(source);
            
            files.forEach(file => {
                const sourcePath = path.join(source, file);
                const destPath = path.join(destination, file);
                
                const stats = fs.statSync(sourcePath);
                
                if (stats.isDirectory()) {
                    // Alt klasörü recursive kopyala
                    this.copyDirectory(sourcePath, destPath).then(resolve).catch(reject);
                } else {
                    // Dosyayı kopyala
                    fs.copyFileSync(sourcePath, destPath);
                }
            });

            resolve();
        });
    }

    // Backup boyutunu hesapla
    calculateBackupSize(backupPath) {
        let totalSize = 0;
        
        const calculateSize = (dirPath) => {
            const files = fs.readdirSync(dirPath);
            
            files.forEach(file => {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                
                if (stats.isDirectory()) {
                    calculateSize(filePath);
                } else {
                    totalSize += stats.size;
                }
            });
        };

        if (fs.existsSync(backupPath)) {
            calculateSize(backupPath);
        }

        return totalSize;
    }

    // Timestamp oluştur
    getTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        
        return `${year}${month}${day}_${hour}${minute}`;
    }

    // Mevcut yedekleri listele
    listBackups() {
        const backupsPath = this.dataManager.getPath('backups');
        const backups = [];

        if (fs.existsSync(backupsPath)) {
            const folders = fs.readdirSync(backupsPath);
            
            folders.forEach(folder => {
                const folderPath = path.join(backupsPath, folder);
                const stats = fs.statSync(folderPath);
                
                if (stats.isDirectory()) {
                    const infoPath = path.join(folderPath, 'backup-info.json');
                    let info = null;
                    
                    if (fs.existsSync(infoPath)) {
                        try {
                            info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
                        } catch (error) {
                            console.error('Error reading backup info:', error);
                        }
                    }

                    backups.push({
                        name: folder,
                        path: folderPath,
                        created: stats.birthtime,
                        size: this.calculateBackupSize(folderPath),
                        info: info
                    });
                }
            });
        }

        // Tarihe göre sırala (en yeni önce)
        return backups.sort((a, b) => new Date(b.created) - new Date(a.created));
    }

    // Eski yedekleri temizle
    cleanupOldBackups(retentionDays = 30) {
        const backups = this.listBackups();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        let deletedCount = 0;
        let freedSpace = 0;

        backups.forEach(backup => {
            if (new Date(backup.created) < cutoffDate) {
                try {
                    freedSpace += backup.size;
                    fs.rmSync(backup.path, { recursive: true, force: true });
                    deletedCount++;
                    console.log(`🗑️ Deleted old backup: ${backup.name}`);
                } catch (error) {
                    console.error(`❌ Error deleting backup ${backup.name}:`, error);
                }
            }
        });

        console.log(`🧹 Cleanup completed: ${deletedCount} backups deleted, ${this.formatBytes(freedSpace)} freed`);
        return { deletedCount, freedSpace };
    }

    // Byte'ları formatla
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Backup'ı geri yükle
    async restoreBackup(backupPath) {
        try {
            console.log(`🔄 Restoring backup: ${backupPath}`);

            if (!fs.existsSync(backupPath)) {
                throw new Error(`Backup path doesn't exist: ${backupPath}`);
            }

            // Backup info'yu oku
            const infoPath = path.join(backupPath, 'backup-info.json');
            let backupInfo = null;
            
            if (fs.existsSync(infoPath)) {
                backupInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
            }

            // Mevcut verileri yedekle (güvenlik için)
            const safetyBackup = await this.createBackup('Pre-restore safety backup');
            console.log(`🛡️ Safety backup created: ${safetyBackup}`);

            // db/ klasörünü geri yükle
            const dbBackupPath = path.join(backupPath, 'db');
            if (fs.existsSync(dbBackupPath)) {
                // Mevcut db klasörünü sil
                const currentDbPath = this.dataManager.getPath('db');
                if (fs.existsSync(currentDbPath)) {
                    fs.rmSync(currentDbPath, { recursive: true, force: true });
                }
                
                // Backup'tan geri yükle
                await this.copyDirectory(dbBackupPath, currentDbPath);
            }

            // config/ klasörünü geri yükle
            const configBackupPath = path.join(backupPath, 'config');
            if (fs.existsSync(configBackupPath)) {
                // Mevcut config klasörünü sil
                const currentConfigPath = this.dataManager.getPath('config');
                if (fs.existsSync(currentConfigPath)) {
                    fs.rmSync(currentConfigPath, { recursive: true, force: true });
                }
                
                // Backup'tan geri yükle
                await this.copyDirectory(configBackupPath, currentConfigPath);
            }

            // Config Manager'ı yeniden başlat
            this.configManager.initialize();

            console.log(`✅ Backup restored successfully: ${backupPath}`);
            
            if (backupInfo) {
                console.log(`📋 Restored schema version: ${backupInfo.schemaVersion}`);
                console.log(`📋 Restored app version: ${backupInfo.appVersion}`);
            }

            return true;

        } catch (error) {
            console.error('❌ Backup restore failed:', error);
            throw error;
        }
    }

    // En son yedeği geri yükle
    async restoreLatestBackup() {
        const backups = this.listBackups();
        
        if (backups.length === 0) {
            throw new Error('No backups found');
        }

        const latestBackup = backups[0];
        return await this.restoreBackup(latestBackup.path);
    }
}

// Singleton instance
let backupManager = null;

// Backup Manager'ı başlat ve döndür
function initializeBackupManager() {
    if (!backupManager) {
        backupManager = new BackupManager();
        backupManager.initialize();
    }
    return backupManager;
}

// Backup Manager instance'ını döndür
function getBackupManager() {
    if (!backupManager) {
        throw new Error('BackupManager not initialized. Call initializeBackupManager() first.');
    }
    return backupManager;
}

module.exports = {
    BackupManager,
    initializeBackupManager,
    getBackupManager
};
