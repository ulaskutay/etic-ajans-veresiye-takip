# 🚀 Release Süreci

Bu dokümantasyon, Veresiye Takip uygulamasının release sürecini açıklar.

## 📋 Release Hazırlık Süreci

### 1. Versiyon Güncelleme
```bash
# package.json'daki version'ı güncelleyin
# Örnek: "1.2.5" -> "1.2.6"
```

### 2. Değişiklikleri Commit Et
```bash
git add -A
git commit -m "feat: yeni özellik açıklaması"
git push origin main
```

### 3. Release Hazırla
```bash
# Otomatik script ile
npm run prepare-release

# Veya manuel olarak
./prepare-release.sh
```

Bu script:
- ✅ Git tag oluşturur (`v1.2.6`)
- ✅ Tag'i GitHub'a push eder
- ✅ Tüm platformlar için build yapar
- ✅ Build dosyalarını listeler
- ✅ GitHub release adımlarını gösterir

### 4. GitHub Release Oluştur

1. **GitHub'a gidin:** https://github.com/ulaskutay/etic-ajans-veresiye-takip
2. **Releases** sekmesine tıklayın
3. **"Create a new release"** butonuna tıklayın
4. **Tag version:** `v1.2.6` seçin
5. **Release title:** `Release 1.2.6` yazın
6. **Description:** Değişiklikleri açıklayın
7. **Dosyaları sürükleyip bırakın:**
   - `dist/VeresiyeTakip-Setup-1.2.6.exe` (Windows)
   - `dist/VeresiyeTakip-1.2.6.dmg` (macOS)
   - `dist/VeresiyeTakip-1.2.6.AppImage` (Linux)
8. **"Publish release"** butonuna tıklayın

## 📁 Build Dosyaları

### Windows
- **Dosya:** `VeresiyeTakip-Setup-{version}.exe`
- **Boyut:** ~80MB
- **Platform:** Windows 10/11 (x64, ARM64)

### macOS
- **Dosya:** `VeresiyeTakip-{version}.dmg`
- **Boyut:** ~98MB
- **Platform:** macOS 10.15+ (ARM64)

### Linux
- **Dosya:** `VeresiyeTakip-{version}.AppImage`
- **Boyut:** ~106MB
- **Platform:** Linux (x64, ARM64)

## 🔧 Build Komutları

```bash
# Tüm platformlar
npm run build

# Platform özel
npm run build-win    # Windows
npm run build-mac    # macOS
npm run build-linux  # Linux
```

## 📝 Release Notları Template

```markdown
## 🚀 Yeni Güncelleme: v{version}

### ✨ Yeni Özellikler
- Özellik 1
- Özellik 2

### 🔧 Düzeltmeler
- Hata düzeltmesi 1
- Hata düzeltmesi 2

### 📥 İndirme
Aşağıdaki dosyalardan işletim sisteminize uygun olanı indirin:

**Windows:** `VeresiyeTakip-Setup-{version}.exe`
**macOS:** `VeresiyeTakip-{version}.dmg`  
**Linux:** `VeresiyeTakip-{version}.AppImage`

### 🔧 Kurulum
1. İndirdiğiniz dosyayı çalıştırın
2. Kurulum talimatlarını takip edin
3. Uygulamayı başlatın

### 📞 Destek
Herhangi bir sorun yaşarsanız GitHub Issues sayfasından bildirebilirsiniz.
```

## ⚠️ Önemli Notlar

- **macOS Gatekeeper:** İmzasız uygulamalar "bozuk" olarak görünebilir
- **Çözüm:** `sudo xattr -rd com.apple.quarantine "/Applications/Veresiye Takip.app"`
- **Windows:** Antivirus yazılımları false positive verebilir
- **Linux:** AppImage dosyasına execute permission verin: `chmod +x VeresiyeTakip-*.AppImage`

## 🎯 Hızlı Başlangıç

```bash
# 1. Versiyon güncelle
# package.json'da version'ı değiştir

# 2. Commit et
git add -A && git commit -m "feat: yeni özellik" && git push origin main

# 3. Release hazırla
npm run prepare-release

# 4. GitHub'da release oluştur (web arayüzü)
```

Bu süreç ile her release için tutarlı ve güvenilir build dosyaları oluşturabilirsiniz.
