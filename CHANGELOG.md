# Changelog

Tüm önemli değişiklikler bu dosyada belgelenecektir.

Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına uygun olarak yazılmıştır,
ve bu proje [Semantic Versioning](https://semver.org/spec/v2.0.0.html) kullanır.

## [Unreleased]

### Added
- GitHub tabanlı otomatik güncelleme sistemi
- Kullanıcı yönetimi sistemi
- Çoklu kullanıcı desteği
- Session yönetimi
- Güvenli şifre hashleme (bcrypt)

### Changed
- Version kontrol sistemi GitHub API ile entegre edildi
- Güncelleme bildirimleri iyileştirildi
- Release notları GitHub'dan otomatik çekiliyor

### Fixed
- Bakiye hesaplama algoritması düzeltildi
- Müşteri silme hatası giderildi
- UI iyileştirmeleri yapıldı

## [1.2.1] - 2024-10-19

### Added
- Uyarı sistemi yeniden tasarlandı
- Version kontrol sistemi eklendi
- Backup ve migration sistemi kuruldu
- Manuel version güncelleme özelliği

### Changed
- Uyarı sistemi basitleştirildi
- Stok uyarıları için ürün seçimi eklendi
- Müşteri uyarıları için müşteri seçimi eklendi

### Fixed
- Uyarı sistemi form alanları düzeltildi
- Modal z-index problemleri çözüldü
- ESC tuşu ile modal kapanma eklendi

## [1.2.0] - 2024-10-18

### Added
- Uyarı sistemi temel yapısı
- Tarih filtreleme özellikleri
- Öncelik bazlı bildirimler
- Uyarı tetikleme sistemi

### Changed
- UI/UX iyileştirmeleri
- Performans optimizasyonları

### Fixed
- Çeşitli hata düzeltmeleri

## [1.1.0] - 2024-10-17

### Added
- Temel veresiye takip özellikleri
- Müşteri yönetimi
- Ürün yönetimi
- İşlem kayıtları
- Excel import/export

### Changed
- İlk stabil sürüm

## [1.0.0] - 2024-10-16

### Added
- İlk sürüm
- Temel Electron uygulaması yapısı
- SQLite veritabanı entegrasyonu
- Temel UI bileşenleri
