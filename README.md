# 🖼️ AsciiYart — Photo to ASCII Art Studio

<p align="center">
  <img src="AsciiYart.ico" width="96" height="96" alt="AsciiYart Logo" />
</p>

<p align="center">
  <b>A lightweight, standalone Windows desktop application to transform photos into stylized ASCII art with custom palettes and high-resolution exports.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?style=flat&logo=windows" alt="Platform Windows" />
  <img src="https://img.shields.io/badge/Architecture-x64%20%7C%20AnyCpu-informational?style=flat" alt="Architecture" />
  <img src="https://img.shields.io/badge/Size-%3C%201%20MB%20Portable-success?style=flat" alt="Portable Size" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat" alt="License" />
</p>

---

## 🚀 Quick Download & Run (Zero Install)

You can run **AsciiYart** immediately without any installer or setup wizard:

1. Download [`AsciiYart.exe`](AsciiYart.exe) from this repository.
2. Double-click **`AsciiYart.exe`** anywhere (Desktop, Downloads folder, or USB drive).
3. The studio opens instantly in an isolated dark-themed desktop window.

> **Note:** Requires Windows 10 or 11 with the standard Microsoft Edge WebView2 runtime (pre-installed on almost all modern Windows machines).

---

## ✨ Features

- **⚡ Real-Time Photo Conversion:**
  - Drag-and-drop or import PNG, JPEG, WebP, BMP, and GIF photos.
  - Interactive adjustment of character size, line height, contrast, brightness, and luminance inversion.
  - Live character density mapping for crisp text representation.

- **🎨 Rich Palette & Color Engine:**
  - Preset color palettes: *Matrix Green, Cyberpunk Neon, Classic Monochrome, Amber CRT, Retro Terminal, Pastel Dream, Solarized, and more*.
  - **K-Means Palette Extraction:** Extract dominant color palettes directly from uploaded photos with one click.
  - Custom foreground and background color customization.

- **🖼️ Built-In Demo Showcase:**
  - Includes sample photos (*Apollo Statue, Feline Portrait, Film Noir, Cyberpunk Car, Sakura & Fuji, Space Explorer*) ready to test with a dedicated selection drawer.

- **💾 Multi-Format Export:**
  - **Export PNG Image** (crisp canvas raster at 1x, 2x, 4x, or 8x scale).
  - **Export JPEG Image**.
  - **Copy ASCII Text** directly to the clipboard for terminals, text files, and markdown.

- **⌨️ Keyboard Shortcuts:**
  - `Ctrl + O` : Open / Import Photo
  - `Ctrl + E` : Export PNG Image
  - `Ctrl + S` : Export JPEG Image
  - `Ctrl + C` : Copy ASCII Art Text
  - `T` : Toggle Raw Text Mode
  - `R` : Randomize Style & Palette
  - `+` / `-` / `0` : Zoom In / Zoom Out / Reset Zoom

---

## 🛠️ Tech Stack & Architecture

- **Host Wrapper:** C# (.NET Framework 4.0 / WinForms), WebView2 Core interop.
- **Embedded Architecture:** All HTML, CSS, JavaScript, icons, and native WebView2 loaders are packed directly into the executable as manifest resources via an in-memory loopback server.
- **Engine:** Pure HTML5 Canvas API, ES6 JavaScript, and responsive CSS3.
- **Single-Instance Mutex:** Prevents duplicate memory footprint and focuses existing windows.

---

## 🔨 Building from Source

To compile `AsciiYart.exe` yourself:

1. Ensure Windows .NET Framework 4.0+ is installed (default on Windows 10 & 11).
2. Double-click **`build.bat`** in the repository root.
3. The batch script uses the native Windows C# compiler (`csc.exe`) to bundle all resources into `AsciiYart.exe`:

```cmd
build.bat
```

---

## 📂 Repository Structure

```
AsciiYart/
├── AsciiYart.exe         # Standalone Windows application (< 1 MB)
├── AsciiYart.ico         # Studio application icon
├── build.bat             # 1-click build script
├── README.md             # Documentation
└── src/
    ├── AsciiYartApp.cs   # Desktop host & embedded HTTP server
    ├── AsciiYart.html    # Studio user interface
    ├── css/
    │   └── styles.css    # Dark studio styling
    ├── js/
    │   ├── app.js          # Studio state & event orchestration
    │   ├── ascii-engine.js # ASCII luminance mapping engine
    │   ├── demo-photos.js  # Curated sample photos
    │   ├── exporters.js    # PNG & JPEG canvas exporters
    │   └── palettes.js     # Color palettes & K-Means extractor
    └── lib/
        ├── Microsoft.Web.WebView2.Core.dll
        ├── Microsoft.Web.WebView2.WinForms.dll
        └── WebView2Loader.dll
```

---

## 👨‍💻 Author

- **GitHub:** [@rillsussy](https://github.com/rillsussy)

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
