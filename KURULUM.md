# 🛠️ Kurulum ve Sorun Giderme Kılavuzu

## 📋 Hızlı Başlangıç

### 1. Gereksinimler
- **Node.js** 16 veya üzeri ([İndir](https://nodejs.org/))
- **npm** (Node.js ile birlikte gelir)
- **Git** (opsiyonel)

### 2. Kurulum Adımları

```bash
# 1. Bağımlılıkları yükleyin
npm install

# 2. Native modülleri yeniden derleyin
npm install --save-dev electron-rebuild
npm run rebuild

# 3. Uygulamayı başlatın
npm start
```

## 🐛 "Müşteri Eklenirken Hata Oluştu" Sorunu

Bu hata **better-sqlite3** modülünün Electron ile uyumlu olmamasından kaynaklanır.

### Hızlı Çözüm (Önerilen)

#### macOS/Linux:
```bash
chmod +x fix-database.sh
./fix-database.sh
```

#### Windows:
```cmd
fix-database.bat
```

### Manuel Çözüm

#### Yöntem 1: Electron Rebuild
```bash
# Electron-rebuild'i yükleyin
npm install --save-dev electron-rebuild

# Better-sqlite3'ü yeniden derleyin
npm run rebuild

# Veya doğrudan:
npx electron-rebuild -f -w better-sqlite3
```

#### Yöntem 2: Tam Temizlik
```bash
# Node_modules ve lock dosyasını silin
rm -rf node_modules package-lock.json

# Yeniden yükleyin
npm install

# Rebuild yapın
npm run rebuild
```

#### Yöntem 3: Manuel Rebuild
```bash
# Better-sqlite3'ü kaldırın
npm uninstall better-sqlite3

# Yeniden yükleyin
npm install better-sqlite3

# Electron için rebuild yapın
npx electron-rebuild -f -w better-sqlite3
```

## 🔍 Hata Ayıklama

### Konsolu Kontrol Etme
1. Uygulamayı başlatın: `npm start`
2. Developer Tools açmak için **F12** tuşuna basın
3. **Console** sekmesini kontrol edin
4. Hata mesajlarını okuyun

### Yaygın Hatalar ve Çözümleri

#### Hata: "Cannot find module 'better-sqlite3'"
```bash
npm install better-sqlite3
npm run rebuild
```

#### Hata: "Error: The module was compiled against a different Node.js version"
```bash
npx electron-rebuild -f -w better-sqlite3
```

#### Hata: "Database initialization error"
- Veritabanı dosyasının yazma izinleri olduğundan emin olun
- Konsol çıktısında veritabanı yolunu kontrol edin
- Veritabanı klasörünün var olduğundan emin olun

#### Hata: "Permission denied"
```bash
# macOS/Linux
chmod +x fix-database.sh
sudo npm run rebuild

# Windows (Yönetici olarak cmd açın)
npm run rebuild
```

## 🔧 Gelişmiş Sorun Giderme

### Veritabanı Konumunu Bulma

Uygulamayı başlatın ve konsola bakın. Şu satırı göreceksiniz:
```
Database path: /Users/[kullanici]/Library/Application Support/masaustu-veresiye-takip/veresiye.db
```

### Veritabanını Sıfırlama

⚠️ **DİKKAT**: Bu işlem tüm verilerinizi silecektir!

```bash
# macOS/Linux
rm ~/Library/Application\ Support/masaustu-veresiye-takip/veresiye.db

# Windows
del %APPDATA%\masaustu-veresiye-takip\veresiye.db
```

### Python Bağımlılığı Sorunu

Better-sqlite3 derlemek için Python gerekir:

#### macOS:
```bash
# Homebrew ile Python yükleyin
brew install python3

# Veya Xcode Command Line Tools
xcode-select --install
```

#### Windows:
```bash
# Python 3.x indirin ve yükleyin
# https://www.python.org/downloads/

# Veya Windows Build Tools
npm install --global windows-build-tools
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install python3 build-essential
```

## ✅ Kurulum Doğrulama

Kurulumun başarılı olduğunu doğrulamak için:

```bash
# 1. Bağımlılıkları kontrol edin
npm list better-sqlite3
npm list electron

# 2. Uygulamayı başlatın
npm start

# 3. F1 tuşuna basarak yeni müşteri eklemeyi deneyin
```

## 📊 Sistem Gereksinimleri

### Minimum:
- **RAM**: 2 GB
- **Disk**: 200 MB boş alan
- **İşletim Sistemi**: 
  - macOS 10.13+
  - Windows 7+
  - Linux (Ubuntu 18.04+, Fedora 24+)

### Önerilen:
- **RAM**: 4 GB
- **Disk**: 500 MB boş alan
- **İşletim Sistemi**: En güncel sürüm

## 🔐 Güvenlik Notları

### Veritabanı Yedekleme

Düzenli olarak veritabanınızı yedekleyin:

```bash
# macOS/Linux
cp ~/Library/Application\ Support/masaustu-veresiye-takip/veresiye.db ~/Desktop/veresiye-backup-$(date +%Y%m%d).db

# Windows
copy %APPDATA%\masaustu-veresiye-takip\veresiye.db %USERPROFILE%\Desktop\veresiye-backup.db
```

### Veritabanı Geri Yükleme

```bash
# macOS/Linux
cp ~/Desktop/veresiye-backup-20231009.db ~/Library/Application\ Support/masaustu-veresiye-takip/veresiye.db

# Windows
copy %USERPROFILE%\Desktop\veresiye-backup.db %APPDATA%\masaustu-veresiye-takip\veresiye.db
```

## 📞 Destek

Sorun yaşıyorsanız:

1. **README.md** dosyasını okuyun
2. **Konsol çıktısını** kontrol edin (F12)
3. **Bu kılavuzdaki** çözümleri deneyin
4. **GitHub Issues** açın veya destek alın

## 🎓 Ek Kaynaklar

- [Electron Dokumentasyonu](https://www.electronjs.org/docs)
- [Better-SQLite3 Dokumentasyonu](https://github.com/WiseLibs/better-sqlite3)
- [Node.js Kılavuzu](https://nodejs.org/en/docs/)

---

**Son Güncelleme**: 2024-01-09
**Versiyon**: 1.0.0


