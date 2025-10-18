# Event Listener Management System

Bu sistem, uygulamadaki tüm event listener'ları merkezi olarak yönetmek için tasarlanmıştır.

## Özellikler

- **Merkezi Yönetim**: Tüm event listener'lar tek bir yerden yönetilir
- **Temizleme**: Event listener'ları güvenli bir şekilde temizler
- **Yeniden Ekleme**: Event listener'ları yeniden ekler
- **Kategorize Edilmiş**: Farklı türdeki listener'lar ayrı kategorilerde saklanır

## Kullanım

### Temel Fonksiyonlar

```javascript
// Event listener'ları temizle
cleanupEventListeners();

// Event listener'ları yeniden ekle
reinitializeEventListeners();

// Event listener'ları kurulum
setupEventListeners();
```

### Test Fonksiyonu

```javascript
// Event listener sistemini test et
testEventListeners();
```

### Örnek Kullanım

```javascript
// Sayfayı temiz event listener'larla yenile
refreshPageWithCleanListeners();
```

## Event Listener Kategorileri

1. **Form Listeners**: Form submit event'leri
2. **Keyboard Listeners**: Klavye kısayolları
3. **Input Listeners**: Input değişiklik event'leri
4. **Modal Listeners**: Modal açma/kapama event'leri
5. **Customer Search Listeners**: Müşteri arama event'leri

## Avantajlar

- **Memory Leak Önleme**: Event listener'lar düzgün temizlenir
- **Performans**: Gereksiz listener'lar kaldırılır
- **Debugging**: Listener'lar kolayca takip edilebilir
- **Maintenance**: Kod bakımı kolaylaşır

## Kullanım Senaryoları

1. **Sayfa Yenileme**: Sayfa içeriği değiştiğinde
2. **Modal Açma/Kapama**: Modal'lar arası geçişlerde
3. **Veri Yenileme**: Müşteri/ürün listesi güncellendiğinde
4. **Hata Durumları**: Hata sonrası temizlik için

## Notlar

- Event listener'lar otomatik olarak kategorize edilir
- Temizleme işlemi güvenlidir (null check'ler yapılır)
- Sistem console log'ları ile takip edilebilir
- Global fonksiyonlar olarak erişilebilir
