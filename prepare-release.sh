#!/bin/bash

# Release Preparation Script
# Bu script tag oluşturur, build yapar ve release için hazırlar

set -e

echo "🚀 Release Preparation Script"
echo "=============================="

# Mevcut versiyonu al
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Mevcut versiyon: $CURRENT_VERSION"

# Tag oluştur
echo "🏷️  Tag oluşturuluyor: v$CURRENT_VERSION"
git tag -a "v$CURRENT_VERSION" -m "Release $CURRENT_VERSION"
git push origin "v$CURRENT_VERSION"

echo "✅ Tag başarıyla oluşturuldu ve push edildi"

# Build işlemleri
echo "🔨 Build işlemleri başlatılıyor..."

echo "📱 Windows build..."
npm run build-win

echo "🍎 macOS build..."
npm run build-mac

echo "🐧 Linux build..."
npm run build-linux

echo "✅ Tüm build işlemleri tamamlandı"

# Build dosyalarını listele
echo ""
echo "📁 Oluşturulan dosyalar:"
echo "========================"
ls -la dist/*.exe dist/*.dmg dist/*.AppImage 2>/dev/null || echo "Build dosyaları bulunamadı"

echo ""
echo "🎯 Sonraki adımlar:"
echo "==================="
echo "1. GitHub'a gidin: https://github.com/ulaskutay/etic-ajans-veresiye-takip"
echo "2. Releases sekmesine tıklayın"
echo "3. 'Create a new release' butonuna tıklayın"
echo "4. Tag version: v$CURRENT_VERSION seçin"
echo "5. Release title: 'Release $CURRENT_VERSION' yazın"
echo "6. Aşağıdaki dosyaları sürükleyip bırakın:"
echo "   - dist/VeresiyeTakip-Setup-$CURRENT_VERSION.exe"
echo "   - dist/VeresiyeTakip-$CURRENT_VERSION.dmg"
echo "   - dist/VeresiyeTakip-$CURRENT_VERSION.AppImage"
echo "7. 'Publish release' butonuna tıklayın"
echo ""
echo "🎉 Release hazır!"
