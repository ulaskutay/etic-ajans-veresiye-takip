# KLAVYE KISAYOLLARI TEST REHBERİ

## 🚀 HIZLI BAŞLATMA

### 1. Terminal Açın ve Şunu Çalıştırın:
```bash
cd "/Users/eticajans/Desktop/Etic Ajans/Projeler/masaustu-veresiye-takip"

# Eski process'leri temizle
pkill -f "npm start" 2>/dev/null

# Temiz başlat
npm start
```

---

## 🧪 TEST ADIMLARI

### Adım 1: Console'u Açın
1. Uygulama açıldığında `Cmd + Option + I` (Mac) veya `F12` (Windows)
2. Console tab'ına geçin

### Adım 2: Listener Kontrolü
Console'da şu mesajı görmelisiniz:
```
✅ Keyboard shortcuts listener attached!
Try pressing F5, F6, or F7
```

**Bu mesajı görmüyorsanız:**
- Sayfayı yenileyin: `Cmd + R`
- Veya uygulamayı kapatıp yeniden açın

### Adım 3: Tuş Testleri

#### Test 1: Herhangi Bir Tuşa Basın
Herhangi bir tuşa (örn: A, B, C) basın.

**Beklenen:**
```
🎹 KEY EVENT: a Code: KeyA Target: BODY
```

Eğer bu mesajı görüyorsanız, event listener çalışıyor demektir! ✅

#### Test 2: F5'e Basın
F5 tuşuna basın.

**Beklenen Console Output:**
```
🎹 KEY EVENT: F5 Code: F5 Target: BODY
Processing shortcut: F5
Prevented default for: F5
F5 - Customer Search
```

**Beklenen Ekran:**
- Bildirim: "F5: Müşteri Ara | ↑↓: Gezin | Enter: Seç"

#### Test 3: Müşteri Seçip F6'ya Basın
1. Sol listeden bir müşteri seçin
2. F6 tuşuna basın

**Beklenen:**
```
🎹 KEY EVENT: F6 Code: F6 Target: BODY
Processing shortcut: F6
Prevented default for: F6
F6 - Quick Sale
```

**Beklenen Ekran:**
- Prompt açılır: "[Müşteri Adı]\n\nSatış Tutarı (KDV Dahil):"

#### Test 4: F7 (Tahsilat)
1. Müşteri seçili olmalı
2. F7'ye basın

**Beklenen:**
- Prompt: "[Müşteri Adı]\n\nTahsilat Tutarı:"

---

## 🔍 SORUN GİDERME

### Sorun 1: "Keyboard shortcuts listener attached!" Mesajı Yok

**Çözüm:**
```javascript
// Console'a yazın:
console.log('setupEventListeners:', typeof setupEventListeners);
console.log('handleKeyboardShortcuts:', typeof handleKeyboardShortcuts);

// İkisi de "function" dönmeli
```

### Sorun 2: Tuşa Bastığımda Hiçbir Log Yok

**Çözüm:**
```javascript
// Console'a yazın ve test edin:
document.addEventListener('keydown', (e) => {
    console.log('DIRECT TEST:', e.key);
});

// Şimdi herhangi bir tuşa basın
// Eğer "DIRECT TEST: ..." görüyorsanız, 
// sorun handleKeyboardShortcuts fonksiyonundadır
```

### Sorun 3: Log Var Ama Fonksiyon Çalışmıyor

**Kontrol:**
```javascript
// Console'da test edin:
if (typeof focusCustomerSearch === 'function') {
    console.log('✅ focusCustomerSearch tanımlı');
    focusCustomerSearch(); // Manuel çağır
} else {
    console.log('❌ focusCustomerSearch tanımlı değil!');
}

if (typeof quickSale === 'function') {
    console.log('✅ quickSale tanımlı');
} else {
    console.log('❌ quickSale tanımlı değil!');
}

if (typeof quickPurchase === 'function') {
    console.log('✅ quickPurchase tanımlı');
} else {
    console.log('❌ quickPurchase tanımlı değil!');
}
```

### Sorun 4: F5 Sayfa Yeniliyor

**Açıklama:**
Bu normaldir - preventDefault çalışmıyorsa. Ancak console'da log görüyorsanız sorun yoktur.

**Test:**
```javascript
// Console'a yazın:
document.addEventListener('keydown', (e) => {
    if (e.key === 'F5') {
        e.preventDefault();
        console.log('F5 prevented!');
    }
});

// Şimdi F5'e basın
```

---

## 🎯 MANUEL TEST SCRIPT

Console'a kopyala-yapıştır:

```javascript
console.clear();
console.log('=== KLAVYE KISAYOLLARI TEST ===\n');

// 1. Fonksiyonlar tanımlı mı?
console.log('1. Fonksiyon Kontrolü:');
console.log('  handleKeyboardShortcuts:', typeof handleKeyboardShortcuts);
console.log('  focusCustomerSearch:', typeof focusCustomerSearch);
console.log('  quickSale:', typeof quickSale);
console.log('  quickPurchase:', typeof quickPurchase);

// 2. Event listener var mı?
console.log('\n2. Event Listener Testi:');
const testEvent = new KeyboardEvent('keydown', {
    key: 'F5',
    code: 'F5',
    bubbles: true,
    cancelable: true
});

console.log('F5 event simulating...');
document.dispatchEvent(testEvent);

console.log('\n3. Sonuç:');
console.log('Yukarıda "🎹 KEY EVENT: F5" görüyorsanız ✅');
console.log('Görmüyorsanız event listener çalışmıyor ❌');

console.log('\n=== TEST BİTTİ ===');
console.log('Şimdi manuel olarak F5, F6, F7 tuşlarını deneyin!');
```

---

## ✅ BAŞARILI TEST ÖRNEĞİ

```
✅ Keyboard shortcuts listener attached!
Try pressing F5, F6, or F7

[F5 tuşuna basıldı]

🎹 KEY EVENT: F5 Code: F5 Target: BODY
Processing shortcut: F5
Prevented default for: F5
F5 - Customer Search
```

---

## 📞 DESTEK

Hala çalışmıyorsa, console'daki TÜM çıktıyı kopyalayıp gönderin:
1. Uygulama açıldığında gelen ilk mesajlar
2. F5'e bastığınızda gelen mesajlar (veya gelmiyorsa "hiçbir şey" yazın)
3. Manuel test scriptinin çıktısı


