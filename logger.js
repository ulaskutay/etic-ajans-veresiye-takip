const fs = require('fs');
const path = require('path');
const { getDataManager } = require('./data-manager');

class Logger {
    constructor() {
        this.dataManager = null;
        this.logPath = null;
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.maxFiles = 5;
    }

    // Logger'ı başlat
    initialize() {
        this.dataManager = getDataManager();
        this.logPath = this.dataManager.getFilePath('logs', 'app.log');
        this.ensureLogFile();
    }

    // Log dosyasının var olduğundan emin ol
    ensureLogFile() {
        if (!fs.existsSync(this.logPath)) {
            fs.writeFileSync(this.logPath, '');
        }
    }

    // Log seviyeleri
    static LEVELS = {
        ERROR: 'ERROR',
        WARN: 'WARN',
        INFO: 'INFO',
        DEBUG: 'DEBUG'
    };

    // Log yaz
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data: data ? JSON.stringify(data) : null
        };

        const logLine = `[${timestamp}] ${level}: ${message}${data ? ' | Data: ' + JSON.stringify(data) : ''}\n`;
        
        try {
            // Log dosyasına yaz
            fs.appendFileSync(this.logPath, logLine);
            
            // Console'a da yaz (development için)
            if (level === Logger.LEVELS.ERROR) {
                console.error(`❌ ${message}`, data || '');
            } else if (level === Logger.LEVELS.WARN) {
                console.warn(`⚠️ ${message}`, data || '');
            } else if (level === Logger.LEVELS.INFO) {
                console.log(`ℹ️ ${message}`, data || '');
            } else {
                console.log(`🔍 ${message}`, data || '');
            }

            // Log dosyası çok büyükse rotate et
            this.rotateIfNeeded();

        } catch (error) {
            console.error('❌ Failed to write to log file:', error);
        }
    }

    // Error log
    error(message, data = null) {
        this.log(Logger.LEVELS.ERROR, message, data);
    }

    // Warning log
    warn(message, data = null) {
        this.log(Logger.LEVELS.WARN, message, data);
    }

    // Info log
    info(message, data = null) {
        this.log(Logger.LEVELS.INFO, message, data);
    }

    // Debug log
    debug(message, data = null) {
        this.log(Logger.LEVELS.DEBUG, message, data);
    }

    // Migration log'ları
    migrationStart(fromVersion, toVersion) {
        this.info('Migration started', { fromVersion, toVersion });
    }

    migrationComplete(fromVersion, toVersion) {
        this.info('Migration completed successfully', { fromVersion, toVersion });
    }

    migrationError(version, error) {
        this.error('Migration failed', { version, error: error.message, stack: error.stack });
    }

    // Backup log'ları
    backupStart(description) {
        this.info('Backup started', { description });
    }

    backupComplete(backupPath, size) {
        this.info('Backup completed', { backupPath, size });
    }

    backupError(error) {
        this.error('Backup failed', { error: error.message });
    }

    // Restore log'ları
    restoreStart(backupPath) {
        this.info('Restore started', { backupPath });
    }

    restoreComplete(backupPath) {
        this.info('Restore completed', { backupPath });
    }

    restoreError(error) {
        this.error('Restore failed', { error: error.message });
    }

    // App log'ları
    appStart(version) {
        this.info('Application started', { version });
    }

    appShutdown() {
        this.info('Application shutdown');
    }

    appError(error) {
        this.error('Application error', { error: error.message, stack: error.stack });
    }

    // Log dosyasını rotate et
    rotateIfNeeded() {
        try {
            const stats = fs.statSync(this.logPath);
            
            if (stats.size > this.maxFileSize) {
                this.rotateLogFile();
            }
        } catch (error) {
            console.error('❌ Error checking log file size:', error);
        }
    }

    // Log dosyasını rotate et
    rotateLogFile() {
        try {
            // Mevcut log dosyalarını say
            const logsDir = this.dataManager.getPath('logs');
            const files = fs.readdirSync(logsDir);
            const logFiles = files.filter(file => file.startsWith('app.log'));
            
            // En eski dosyaları sil
            if (logFiles.length >= this.maxFiles) {
                const sortedFiles = logFiles
                    .map(file => ({
                        name: file,
                        path: path.join(logsDir, file),
                        stats: fs.statSync(path.join(logsDir, file))
                    }))
                    .sort((a, b) => a.stats.birthtime - b.stats.birthtime);
                
                // En eski dosyaları sil
                const filesToDelete = sortedFiles.slice(0, logFiles.length - this.maxFiles + 1);
                filesToDelete.forEach(file => {
                    fs.unlinkSync(file.path);
                    this.info('Log file deleted', { file: file.name });
                });
            }
            
            // Mevcut log dosyasını yeniden adlandır
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const rotatedPath = path.join(this.dataManager.getPath('logs'), `app.log.${timestamp}`);
            fs.renameSync(this.logPath, rotatedPath);
            
            // Yeni log dosyası oluştur
            fs.writeFileSync(this.logPath, '');
            
            this.info('Log file rotated', { rotatedFile: rotatedPath });
            
        } catch (error) {
            console.error('❌ Error rotating log file:', error);
        }
    }

    // Log dosyalarını listele
    listLogFiles() {
        const logsDir = this.dataManager.getPath('logs');
        const files = [];
        
        if (fs.existsSync(logsDir)) {
            const logFiles = fs.readdirSync(logsDir);
            
            logFiles.forEach(file => {
                const filePath = path.join(logsDir, file);
                const stats = fs.statSync(filePath);
                
                files.push({
                    name: file,
                    path: filePath,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                });
            });
        }
        
        return files.sort((a, b) => b.created - a.created);
    }

    // Log dosyasını temizle
    clearLogs() {
        try {
            const logsDir = this.dataManager.getPath('logs');
            const files = fs.readdirSync(logsDir);
            
            files.forEach(file => {
                const filePath = path.join(logsDir, file);
                fs.unlinkSync(filePath);
            });
            
            // Yeni boş log dosyası oluştur
            fs.writeFileSync(this.logPath, '');
            
            this.info('Logs cleared');
            return true;
            
        } catch (error) {
            this.error('Failed to clear logs', { error: error.message });
            return false;
        }
    }

    // Log dosyasını oku
    readLogs(lines = 100) {
        try {
            if (!fs.existsSync(this.logPath)) {
                return [];
            }
            
            const content = fs.readFileSync(this.logPath, 'utf8');
            const logLines = content.split('\n').filter(line => line.trim());
            
            // Son N satırı döndür
            return logLines.slice(-lines);
            
        } catch (error) {
            this.error('Failed to read logs', { error: error.message });
            return [];
        }
    }

    // Log dosyası boyutunu al
    getLogSize() {
        try {
            if (fs.existsSync(this.logPath)) {
                const stats = fs.statSync(this.logPath);
                return stats.size;
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }
}

// Singleton instance
let logger = null;

// Logger'ı başlat ve döndür
function initializeLogger() {
    if (!logger) {
        logger = new Logger();
        logger.initialize();
    }
    return logger;
}

// Logger instance'ını döndür
function getLogger() {
    if (!logger) {
        throw new Error('Logger not initialized. Call initializeLogger() first.');
    }
    return logger;
}

module.exports = {
    Logger,
    initializeLogger,
    getLogger
};
