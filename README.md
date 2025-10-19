# 📊 Veresiye Takip - Masaüstü Uygulaması

Modern, hızlı ve güvenli masaüstü veresiye takip uygulaması. Electron tabanlı, kısayol tuşları ile çalışan, veri güvenliği odaklı tasarım.

## ✨ Özellikler

### 🚀 Temel Özellikler
- **Hızlı Müşteri Yönetimi**: F1-F7 kısayol tuşları ile hızlı işlemler
- **Ürün Yönetimi**: Stok takibi ve fiyat yönetimi
- **Satış/Purchase Takibi**: Detaylı işlem geçmişi
- **Uyarı Sistemi**: Stok ve borç uyarıları
- **Excel İmport/Export**: Veri aktarımı
- **PDF Raporları**: Detaylı raporlama

### 🔒 Veri Güvenliği
- **Otomatik Yedekleme**: Her migration öncesi otomatik yedek
- **Migration Sistemi**: Güvenli veri güncelleme
- **Rollback Desteği**: Hata durumunda geri alma
- **Single Instance**: Tek kopya çalışma
- **Content Security Policy**: Güvenlik katmanları

### 📁 Veri Yönetimi
- **Organized Data Structure**: `userData/VeresiyeTakip/` altında düzenli klasör yapısı
- **Config Management**: JSON tabanlı konfigürasyon
- **Logging System**: Detaylı log kayıtları
- **Backup Management**: Otomatik yedekleme ve temizleme

## 🛠️ Kurulum

### Gereksinimler
- Node.js 16+
- npm veya yarn
- Electron 25+

### Kurulum Adımları
```bash
# Repository'yi klonla
git clone https://github.com/ulaskutay/etic-ajans-veresiye-takip.git
cd etic-ajans-veresiye-takip

# Bağımlılıkları yükle
npm install

# Uygulamayı başlat
npm start
```

## 📋 Kullanım

### Kısayol Tuşları
- **F1**: Yeni Müşteri
- **F5**: Cari Aç
- **F6**: Hızlı Borç
- **F7**: Ödeme Al
- **F12**: Geliştirici Araçları
- **Ctrl+R**: Yeniden Yükle

### Veri Yönetimi
```bash
# Test verisi oluştur
npm run seed:v0    # v0 formatında test verisi
npm run seed:v1    # v1 formatında test verisi (createdAt ile)
npm run seed:v2    # v2 formatında test verisi (appearance ile)

# Test verilerini temizle
npm run seed:clear

# Test verilerini listele
npm run seed:list

# Migration testi
npm run test:migration
```

## 🏗️ Mimari

### Veri Yapısı
```
userData/VeresiyeTakip/
├── db/                 # Veritabanı dosyaları
├── config/             # Konfigürasyon dosyaları
├── backups/            # Otomatik yedekler
├── logs/               # Log dosyaları
└── migrations/         # Migration dosyaları
```

### Sistem Bileşenleri
- **DataManager**: Klasör yönetimi ve dosya işlemleri
- **ConfigManager**: Konfigürasyon yönetimi
- **BackupManager**: Yedekleme ve geri yükleme
- **MigrationManager**: Veri güncelleme sistemi
- **Logger**: Log yönetimi

### Migration Sistemi
- **v1**: `createdAt` alanı ekleme
- **v2**: Theme yapısını `appearance` olarak güncelleme
- **v3-v5**: Database schema güncellemeleri

## 🔧 Geliştirme

### Proje Yapısı
```
├── main.js                 # Ana Electron süreci
├── renderer.js             # Renderer süreci
├── index.html              # Ana UI
├── styles.css              # Stil dosyası
├── data-manager.js         # Veri yönetimi
├── config-manager.js       # Konfigürasyon yönetimi
├── backup-manager.js       # Yedekleme sistemi
├── migration-manager.js    # Migration sistemi
├── logger.js               # Log sistemi
├── seed-data.js            # Test veri oluşturucu
├── splash.html             # Splash ekranı
└── package.json             # Proje konfigürasyonu
```

### Build ve Dağıtım
```bash
# Development build
npm run dev

# Production build
npm run build

# Platform specific builds
npm run build-win    # Windows
npm run build-mac    # macOS
npm run build-linux  # Linux
```

## 📊 Veri Güvenliği

### Otomatik Yedekleme
- Her migration öncesi otomatik yedek
- Yedek dosyaları `backups/YYYYMMDD_HHmm/` formatında
- Yedek bilgileri `backup-info.json` ile saklanır

### Migration Güvenliği
- Migration öncesi otomatik yedek
- Hata durumunda otomatik geri yükleme
- Her adımda schema version güncelleme
- Detaylı log kayıtları

### Rollback Sistemi
- En son yedeği geri yükleme
- Belirli yedekten geri yükleme
- Schema version senkronizasyonu

## 🐛 Hata Ayıklama

### Log Dosyaları
- `logs/app.log`: Ana log dosyası
- Otomatik log rotation (10MB limit)
- Detaylı migration ve backup logları

### Geliştirici Araçları
- F12 ile DevTools açma
- Console logları
- IPC mesaj takibi

## 📝 Lisans

MIT License - Detaylar için `LICENSE` dosyasına bakın.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 İletişim

- **Geliştirici**: Etic Ajans
- **Repository**: https://github.com/ulaskutay/etic-ajans-veresiye-takip
- **Versiyon**: 1.0.0

## 🔄 Changelog

### v1.0.0 (2024-01-15)
- ✅ Temel veresiye takip sistemi
- ✅ Kısayol tuşları desteği
- ✅ Excel import/export
- ✅ PDF raporlama
- ✅ Uyarı sistemi
- ✅ Veri güvenliği sistemi
- ✅ Migration sistemi
- ✅ Otomatik yedekleme
- ✅ Log sistemi
- ✅ Single instance lock
- ✅ Content Security Policy

---

**Not**: Bu uygulama production-ready durumda olup, veri güvenliği ve migration sistemi ile enterprise seviyede güvenilirlik sağlar.