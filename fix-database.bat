@echo off
echo ==================================
echo Veresiye Takip - Veritabani Duzeltme
echo ==================================
echo.

echo 1. Electron-rebuild yukleniyor...
call npm install --save-dev electron-rebuild

echo.
echo 2. Better-sqlite3 modulu yeniden derleniyor...
call npx electron-rebuild -f -w better-sqlite3

echo.
echo 3. Uygulama bagimliliklari kontrol ediliyor...
call npm run postinstall

echo.
echo ==================================
echo TAMAMLANDI!
echo ==================================
echo.
echo Simdi uygulamayi calistirabilirsiniz:
echo npm start
echo.
pause


