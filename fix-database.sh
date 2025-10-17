#!/bin/bash

echo "=================================="
echo "Veresiye Takip - Veritabanı Düzeltme"
echo "=================================="
echo ""

echo "1. Electron-rebuild yükleniyor..."
npm install --save-dev electron-rebuild

echo ""
echo "2. Better-sqlite3 modülü yeniden derleniyor..."
npx electron-rebuild -f -w better-sqlite3

echo ""
echo "3. Uygulama bağımlılıkları kontrol ediliyor..."
npm run postinstall

echo ""
echo "=================================="
echo "✅ Düzeltme tamamlandı!"
echo "=================================="
echo ""
echo "Şimdi uygulamayı çalıştırabilirsiniz:"
echo "npm start"
echo ""


