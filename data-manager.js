const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class DataManager {
    constructor() {
        this.basePath = null;
        this.paths = {};
    }

    // Ana veri klasörünü başlat
    initialize() {
        this.basePath = path.join(app.getPath('userData'), 'VeresiyeTakip');
        this.setupPaths();
        this.createDirectories();
        console.log('📁 Data Manager initialized:', this.basePath);
    }

    // Alt klasör yollarını tanımla
    setupPaths() {
        this.paths = {
            base: this.basePath,
            db: path.join(this.basePath, 'db'),
            config: path.join(this.basePath, 'config'),
            backups: path.join(this.basePath, 'backups'),
            logs: path.join(this.basePath, 'logs'),
            migrations: path.join(this.basePath, 'migrations')
        };
    }

    // Gerekli klasörleri oluştur
    createDirectories() {
        Object.values(this.paths).forEach(dirPath => {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log('📂 Created directory:', dirPath);
            }
        });
    }

    // Klasör yollarını döndür
    getPaths() {
        return { ...this.paths };
    }

    // Belirli bir klasör yolunu döndür
    getPath(key) {
        return this.paths[key] || null;
    }

    // Dosya yolu oluştur
    getFilePath(folder, filename) {
        const folderPath = this.paths[folder];
        if (!folderPath) {
            throw new Error(`Unknown folder: ${folder}`);
        }
        return path.join(folderPath, filename);
    }

    // Klasörün var olup olmadığını kontrol et
    exists(folder) {
        const folderPath = this.paths[folder];
        return folderPath ? fs.existsSync(folderPath) : false;
    }

    // Klasör içeriğini listele
    listFiles(folder) {
        const folderPath = this.paths[folder];
        if (!folderPath || !fs.existsSync(folderPath)) {
            return [];
        }
        return fs.readdirSync(folderPath);
    }

    // Klasör boyutunu hesapla
    getFolderSize(folder) {
        const folderPath = this.paths[folder];
        if (!folderPath || !fs.existsSync(folderPath)) {
            return 0;
        }

        let totalSize = 0;
        const files = fs.readdirSync(folderPath);

        files.forEach(file => {
            const filePath = path.join(folderPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
                totalSize += stats.size;
            } else if (stats.isDirectory()) {
                totalSize += this.getFolderSizeRecursive(filePath);
            }
        });

        return totalSize;
    }

    // Klasör boyutunu recursive hesapla
    getFolderSizeRecursive(dirPath) {
        let totalSize = 0;
        const files = fs.readdirSync(dirPath);

        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
                totalSize += stats.size;
            } else if (stats.isDirectory()) {
                totalSize += this.getFolderSizeRecursive(filePath);
            }
        });

        return totalSize;
    }

    // Klasör istatistiklerini döndür
    getStats() {
        const stats = {};
        Object.keys(this.paths).forEach(key => {
            if (key !== 'base') {
                stats[key] = {
                    path: this.paths[key],
                    exists: this.exists(key),
                    fileCount: this.listFiles(key).length,
                    size: this.getFolderSize(key)
                };
            }
        });
        return stats;
    }
}

// Singleton instance
let dataManager = null;

// Data Manager'ı başlat ve döndür
function initializeDataManager() {
    if (!dataManager) {
        dataManager = new DataManager();
        dataManager.initialize();
    }
    return dataManager;
}

// Data Manager instance'ını döndür
function getDataManager() {
    if (!dataManager) {
        throw new Error('DataManager not initialized. Call initializeDataManager() first.');
    }
    return dataManager;
}

module.exports = {
    DataManager,
    initializeDataManager,
    getDataManager
};
