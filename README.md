# 🏪 Veresiye Takip - Masaüstü Uygulaması

Modern ve kullanıcı dostu masaüstü veresiye takip uygulaması. Electron tabanlı, çoklu platform desteği ile geliştirilmiştir.

## ✨ Özellikler

### 🔐 Kullanıcı Yönetimi
- **Çoklu kullanıcı desteği**: Her kullanıcının kendi verileri
- **Güvenli giriş sistemi**: bcrypt ile şifre hashleme
- **Session yönetimi**: Otomatik giriş ve güvenli çıkış
- **Rol tabanlı yetkilendirme**: Admin ve kullanıcı rolleri

### 📊 Veri Yönetimi
- **Müşteri yönetimi**: Detaylı müşteri bilgileri ve borç takibi
- **Ürün yönetimi**: Stok takibi ve kategori yönetimi
- **İşlem kayıtları**: Satış ve tahsilat işlemleri
- **Bakiye hesaplama**: Otomatik ve doğru bakiye hesaplama

### 🚨 Uyarı Sistemi
- **Stok uyarıları**: Minimum stok seviyesi bildirimleri
- **Borç uyarıları**: Yüksek borçlu müşteri bildirimleri
- **Özelleştirilebilir**: Kullanıcı tanımlı uyarı kuralları
- **Gerçek zamanlı**: Anlık bildirimler

### 🔄 Otomatik Güncelleme
- **GitHub entegrasyonu**: Otomatik version kontrolü
- **Platform desteği**: Windows, macOS, Linux
- **Release notları**: Detaylı güncelleme bilgileri
- **Kolay kurulum**: Tek tıkla güncelleme

### 💾 Veri Güvenliği
- **Otomatik yedekleme**: Günlük veri yedekleri
- **Migration sistemi**: Güvenli veri güncellemeleri
- **Rollback desteği**: Hatalı güncellemeleri geri alma
- **Log sistemi**: Detaylı işlem kayıtları

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn
- Git

### Geliştirme Ortamı
```bash
# Repository'yi klonlayın
git clone https://github.com/ulaskutay/etic-ajans-veresiye-takip.git
cd etic-ajans-veresiye-takip

# Bağımlılıkları yükleyin
npm install

# Uygulamayı başlatın
npm start
```

### Production Build
```bash
# Windows için build
npm run build-win

# macOS için build
npm run build-mac

# Linux için build
npm run build-linux
```

## 📱 Kullanım

### İlk Kurulum
1. Uygulamayı başlatın
2. İlk kullanıcı hesabınızı oluşturun
3. Müşteri ve ürün bilgilerinizi ekleyin
4. Uyarı kurallarınızı tanımlayın

### Günlük Kullanım
- **Müşteri ekleme**: Yeni müşterileri sisteme kaydedin
- **Satış kaydı**: Müşterilere satış yapın
- **Tahsilat**: Ödemeleri kaydedin
- **Stok takibi**: Ürün stoklarını kontrol edin
- **Raporlama**: Detaylı raporlar alın

## 🔧 Geliştirme

### Proje Yapısı
```
├── main.js                 # Electron ana süreç
├── renderer.js             # Frontend ana dosyası
├── index.html              # Ana HTML dosyası
├── styles.css              # CSS stilleri
├── alert-system.js         # Uyarı sistemi
├── product-module.js       # Ürün yönetimi
├── excel-import-export.js  # Excel entegrasyonu
├── data-manager.js         # Veri yönetimi
├── config-manager.js       # Konfigürasyon
├── backup-manager.js       # Yedekleme sistemi
├── migration-manager.js    # Migration sistemi
└── logger.js               # Log sistemi
```

### Veritabanı Şeması
- **users**: Kullanıcı bilgileri
- **user_sessions**: Session yönetimi
- **customers**: Müşteri bilgileri
- **products**: Ürün bilgileri
- **transactions**: İşlem kayıtları
- **alerts**: Uyarı kuralları
- **alert_triggers**: Uyarı tetiklemeleri

## 🚀 Release Süreci

### Yeni Version Oluşturma
1. Değişiklikleri commit edin
2. Version numarasını güncelleyin (`package.json`)
3. Git tag oluşturun:
   ```bash
   git tag v1.2.2
   git push origin v1.2.2
   ```
4. GitHub Actions otomatik olarak build ve release oluşturacak

### Release Notları
Her release için detaylı notlar ekleyin:
- Yeni özellikler
- Hata düzeltmeleri
- Performans iyileştirmeleri
- Breaking changes

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 Destek

- **GitHub Issues**: Bug raporları ve özellik istekleri
- **Email**: support@eticajans.com
- **Dokümantasyon**: [Wiki sayfası](https://github.com/ulaskutay/etic-ajans-veresiye-takip/wiki)

## 🏆 Teşekkürler

- Electron ekibine harika framework için
- Better-sqlite3 ekibine performanslı veritabanı için
- Tüm açık kaynak katkıcılarına

---

**Etic Ajans** tarafından geliştirilmiştir. © 2024