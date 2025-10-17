# MÜŞTERİ GÜNCELLEME TEST ADIMLARI

## 1. Uygulamayı Başlat
```bash
cd "/Users/eticajans/Desktop/Etic Ajans/Projeler/masaustu-veresiye-takip"
npm start
```

## 2. Console'u Aç
- Cmd + Option + I (Mac)
- F12 veya Ctrl + Shift + I (Windows/Linux)

## 3. Test Adımları

### Test 1: Müşteri Seç ve Düzenle Butonunu Tıkla
1. Sol listeden bir müşteri seç
2. "Değiştir" butonuna tıkla
3. Modal açılmalı

**Beklenen Console Log:**
```
(hiçbir log görünmemeli - sadece modal açılmalı)
```

### Test 2: Güncelle Butonuna Tıkla
1. Modal açıkken
2. İsmi değiştir (örn: "Test Müşteri Updated")
3. "Güncelle" butonuna tıkla

**Beklenen Console Log:**
```
=== HANDLE EDIT CUSTOMER CALLED ===
Customer ID: 1
Sending update request with data: { id: "1", name: "Test Müşteri Updated", customerType: "individual" }
Update result: { success: true, affectedRows: 1 }
```

### Test 3: Console'dan Test Fonksiyonları
Console'a şu komutları yazın:

```javascript
// 1. Mevcut müşteriyi kontrol et
testCurrentCustomer()

// 2. Edit customer modalını aç
testEditCustomer()

// 3. Form submit'i test et
testHandleEditCustomer()
```

## 4. Olası Sorunlar ve Çözümler

### Sorun 1: "handleEditCustomer is not defined"
**Çözüm:** Uygulama düzgün yüklenmemiş. Sayfayı yenileyin (Cmd+R)

### Sorun 2: Modal açılıyor ama Güncelle çalışmıyor
**Çözüm:** Console'da error var mı kontrol edin

### Sorun 3: "edit-customer-id is null"
**Çözüm:** Hidden input eksik. HTML dosyasını kontrol edin

### Sorun 4: Tab'lara tıklayınca form submit oluyor
**Çözüm:** Tab butonlarının `type="button"` olduğundan emin olun

## 5. Debug Log'ları

Şu log'ları görmelisiniz:

1. **Modal açıldığında:**
   - (sessiz - log yok)

2. **Güncelle'ye tıklayınca:**
   ```
   === HANDLE EDIT CUSTOMER CALLED ===
   Customer ID: [number]
   Sending update request with data: {...}
   ```

3. **Backend'den cevap:**
   ```
   Update result: { success: true/false }
   ```

4. **Başarılıysa:**
   ```
   (Müşteri listesi yenilenir)
   (Modal kapanır)
   (Bildirim gösterilir)
   ```

## 6. Hızlı Test Scripti

Console'a yapıştırın:

```javascript
// Otomatik test
async function quickTest() {
    console.log('1. Current customer check...');
    console.log('Current:', currentCustomer);
    
    if (!currentCustomer) {
        console.log('❌ No customer selected. Select one first!');
        return;
    }
    
    console.log('2. Opening edit modal...');
    editCustomer();
    
    setTimeout(() => {
        console.log('3. Checking form fields...');
        const name = document.getElementById('edit-customer-name').value;
        const id = document.getElementById('edit-customer-id').value;
        console.log('Name:', name);
        console.log('ID:', id);
        
        if (!id) {
            console.log('❌ ID field is empty!');
        } else {
            console.log('✅ Form looks good!');
        }
    }, 500);
}

quickTest();
```


