# 🏪 Masaüstü Veresiye Takip Uygulaması

Kısayol tuşları ile hızlı çalışan, modern masaüstü veresiye takip uygulaması. Electron ve SQLite kullanılarak geliştirilmiştir.

## ✨ Özellikler

- 🚀 **Hızlı Kısayol Tuşları**: F1-F7 tuşları ile anında işlem yapma
- 👥 **Müşteri Yönetimi**: Kolay müşteri ekleme ve takibi
- 💰 **Borç Takibi**: Hızlı borç girişi ve ödeme alma
- 📊 **Dashboard**: Anlık istatistikler ve özet bilgiler
- 💾 **Yerel Veritabanı**: SQLite ile güvenli veri saklama
- 🎨 **Modern Arayüz**: Kullanıcı dostu ve şık tasarım

## ⌨️ Kısayol Tuşları

| Tuş | İşlev |
|-----|-------|
| **F1** | Yeni Müşteri Ekle |
| **F5** | Cari Aç (Müşteri Seç) |
| **F6** | Hızlı Borç Girişi |
| **F7** | Ödeme Al |
| **F12** | Geliştirici Araçları |
| **Ctrl+Q** | Uygulamadan Çık |

## 🚀 Kurulum

### Gereksinimler
- Node.js 16+ 
- npm veya yarn

### Adımlar

1. **Projeyi klonlayın:**
```bash
git clone <repo-url>
cd masaustu-veresiye-takip
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Native modülleri yeniden derleyin (önemli!):**
```bash
npm install --save-dev electron-rebuild
npm run rebuild
```
> **Not**: `better-sqlite3` native bir modül olduğu için Electron ile uyumlu olması gerekir. Eğer "müşteri eklenirken hata oluştu" hatası alıyorsanız, yukarıdaki komutu çalıştırın.

4. **Uygulamayı çalıştırın:**
```bash
npm start
```

## 🔧 Geliştirme

### Geliştirme modunda çalıştırma:
```bash
npm run dev
```

### Uygulama paketleme:
```bash
# Tüm platformlar için
npm run build

# Sadece Windows için
npm run build-win

# Sadece macOS için
npm run build-mac

# Sadece Linux için
npm run build-linux
```

## 📱 Kullanım

### İlk Kullanım
1. Uygulamayı başlatın
2. **F1** tuşu ile ilk müşterinizi ekleyin
3. **F6** tuşu ile hızlı borç girişi yapın
4. **F7** tuşu ile ödeme alın

### Hızlı İşlemler
- **Yeni Müşteri**: F1 tuşuna basın, bilgileri girin
- **Borç Girişi**: F6 tuşuna basın, müşteri seçin, tutarı girin
- **Ödeme Alma**: F7 tuşuna basın, müşteri seçin, tutarı girin
- **Müşteri Arama**: F5 tuşuna basın, müşteri adı yazın

### Dashboard
- Toplam müşteri sayısı
- Toplam alacak tutarı
- Günlük işlem sayısı
- Son işlemler listesi

## 🗃️ Veritabanı

Uygulama SQLite veritabanı kullanır. Veriler `veresiye.db` dosyasında saklanır.

### Tablolar:
- **customers**: Müşteri bilgileri
- **transactions**: İşlem kayıtları (borç/ödeme)

## 🎨 Özelleştirme

### Tema Değişikliği
`styles.css` dosyasını düzenleyerek görünümü özelleştirebilirsiniz.

### Yeni Kısayol Tuşları
`main.js` dosyasındaki `registerGlobalShortcuts()` fonksiyonunu düzenleyin.

## 📊 Ekran Görüntüleri

### Dashboard
- Modern kart tasarımı ile istatistikler
- Son işlemler listesi
- Renkli göstergeler

### Müşteri Yönetimi
- Kart görünümünde müşteri listesi
- Detaylı müşteri bilgileri
- İşlem geçmişi

### Hızlı İşlemler
- Modal pencereler ile hızlı giriş
- Otomatik odaklanma
- Form doğrulama

## 🔒 Güvenlik

- Yerel SQLite veritabanı
- Veri şifreleme (isteğe bağlı)
- Otomatik yedekleme özelliği

## 🐛 Sorun Giderme

### "Müşteri eklenirken hata oluştu" hatası
Bu hata genellikle `better-sqlite3` modülünün Electron ile uyumlu olmadığı anlamına gelir:

```bash
# Çözüm 1: Electron-rebuild kullanın
npm install --save-dev electron-rebuild
npm run rebuild

# Çözüm 2: Bağımlılıkları yeniden yükleyin
rm -rf node_modules package-lock.json
npm install
npm run rebuild
```

### Uygulama açılmıyor
1. Node.js versiyonunu kontrol edin (16+ gerekli)
2. `npm install` komutunu tekrar çalıştırın
3. Antivirus yazılımını kontrol edin
4. Konsol çıktısını kontrol edin (Developer Tools - F12)

### Veritabanı hatası
1. Konsol çıktısında veritabanı yolunu kontrol edin
2. Veritabanı dosyasının yazma izinleri olduğundan emin olun
3. Son çare olarak `veresiye.db` dosyasını silin (veriler kaybolur)
4. Uygulamayı yeniden başlatın

### Kısayol tuşları çalışmıyor
1. Uygulamanın odakta olduğundan emin olun
2. Diğer uygulamaların aynı tuşları kullanmadığını kontrol edin
3. macOS'ta sistem tercihlerinden klavye izinlerini kontrol edin

## 📝 Değişiklik Günlüğü

### v1.0.0
- İlk sürüm
- Temel müşteri yönetimi
- Kısayol tuşları sistemi
- Dashboard ve raporlama
- SQLite veritabanı entegrasyonu

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👨‍💻 Geliştirici

**Etic Ajans**
- Email: info@eticajans.com
- Website: https://eticajans.com

## 📞 Destek

Sorunlarınız için:
- GitHub Issues kullanın
- Email: support@eticajans.com

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
