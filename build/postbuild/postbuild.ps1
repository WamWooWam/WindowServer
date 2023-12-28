cd ntos
yarn ntos-link .
cd ..

cp ntos/dist/ntoskrnl.exe dist/windows/system32/ntoskrnl.exe

cp dlls/ntdll/dist/ntdll.dll dist/windows/system32/
cp dlls/kernel32/dist/kernel32.dll dist/windows/system32/
cp dlls/user32/dist/user32.dll dist/windows/system32/
cp dlls/gdi32/dist/gdi32.dll dist/windows/system32/

cp apps/notepad/dist/notepad.exe dist/windows/
cp apps/wininit/dist/wininit.exe dist/windows/system32/

cp setup/dist/setup.js dist/
cp ldr/dist/ntldr.js dist/

Compress-Archive -Path dist/windows -DestinationPath dist/install.zip -Force


