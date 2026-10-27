@echo off
setlocal
echo ========================================================
echo  Building AsciiYart Standalone Executable (.NET 4.0 / CSC)
echo ========================================================

set CSC=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe
if not exist "%CSC%" (
    set CSC=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe
)

if not exist "%CSC%" (
    echo [ERROR] csc.exe compiler not found!
    exit /b 1
)

pushd "%~dp0"

"%CSC%" /nologo /target:winexe /platform:anycpu /optimize+ ^
    /win32icon:AsciiYart.ico ^
    /out:AsciiYart.exe ^
    /r:src\lib\Microsoft.Web.WebView2.Core.dll ^
    /r:src\lib\Microsoft.Web.WebView2.WinForms.dll ^
    /resource:src\AsciiYart.html,AsciiYart.html ^
    /resource:src\css\styles.css,styles.css ^
    /resource:src\js\palettes.js,palettes.js ^
    /resource:src\js\exporters.js,exporters.js ^
    /resource:src\js\demo-photos.js,demo-photos.js ^
    /resource:src\js\ascii-engine.js,ascii-engine.js ^
    /resource:src\js\app.js,app.js ^
    /resource:src\lib\Microsoft.Web.WebView2.Core.dll,Microsoft.Web.WebView2.Core.dll ^
    /resource:src\lib\Microsoft.Web.WebView2.WinForms.dll,Microsoft.Web.WebView2.WinForms.dll ^
    /resource:src\lib\WebView2Loader.dll,WebView2Loader.dll ^
    src\AsciiYartApp.cs

if %ERRORLEVEL% equ 0 (
    echo.
    powershell -NoProfile -Command "$cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert | Where-Object { $_.Subject -like '*thegraveyart*' } | Select-Object -First 1; if ($cert) { Set-AuthenticodeSignature -FilePath AsciiYart.exe -Certificate $cert | Out-Null; Write-Host '  [Signed] Publisher: thegraveyart' -ForegroundColor Green }"
    echo [SUCCESS] AsciiYart.exe compiled successfully!
    dir AsciiYart.exe | findstr /i "AsciiYart.exe"
) else (
    echo.
    echo [ERROR] Compilation failed!
)

popd
endlocal
