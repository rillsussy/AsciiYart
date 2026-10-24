/**
 * DITHER BOY // Studio Export Suite
 * Includes Pure-JS GIF89a LZW Encoder, ZIP Archive Builder, Vector SVG Exporter,
 * ASCII/ANSI Art Generator, Sprite Sheet Composer, and High-DPI PNG Exporter.
 */
window.DitherBoy = window.DitherBoy || {};

(function (DB) {
  'use strict';

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // =========================================================================
  // 1. HIGH-RES CRISP RASTER EXPORT (PNG / WEBP / JPEG AT 1X, 2X, 4X, 8X)
  // =========================================================================
  function exportRasterImage(imageData, scaleMultiplier = 1, format = 'image/png', filename = 'dither-boy-export.png') {
    const mult = Math.max(1, Math.min(8, Math.round(scaleMultiplier)));
    const targetW = imageData.width * mult;
    const targetH = imageData.height * mult;
    const upscaled = mult === 1
      ? imageData
      : DB.Pipeline.upscaleNearestImageData(imageData, targetW, targetH);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(upscaled, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) triggerDownload(blob, filename);
    }, format, 0.95);
  }

  // =========================================================================
  // 2. TRUE VECTOR SVG EXPORT (RUN-LENGTH MERGED PIXELS OR HALFTONE DOTS)
  // =========================================================================
  function exportVectorSVG(imageData, ditherScale = 2, shapeMode = 'rect', filename = 'dither-boy-vector.svg') {
    const step = Math.max(1, Math.round(ditherScale));
    // Sample at the dither cell grid so SVG stays lightweight and crisp
    const gridW = Math.floor(imageData.width / step);
    const gridH = Math.floor(imageData.height / step);
    const data = imageData.data;
    const fullW = imageData.width;

    // Group geometry by hex color for clean Illustrator/Figma layer groups
    const colorPaths = new Map();
    let bgHex = '#000000';
    const colorCounts = new Map();

    const cellHexGrid = new Array(gridW * gridH);
    for (let gy = 0; gy < gridH; gy++) {
      const sy = Math.min(imageData.height - 1, gy * step);
      for (let gx = 0; gx < gridW; gx++) {
        const sx = Math.min(fullW - 1, gx * step);
        const idx = (sy * fullW + sx) * 4;
        const hex = DB.Palettes.rgbToHex(data[idx], data[idx + 1], data[idx + 2]);
        cellHexGrid[gy * gridW + gx] = hex;
        colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
      }
    }

    // Use most frequent color as background rect to dramatically reduce SVG node count!
    let maxCount = -1;
    for (const [hex, cnt] of colorCounts.entries()) {
      if (cnt > maxCount) {
        maxCount = cnt;
        bgHex = hex;
      }
    }

    for (let gy = 0; gy < gridH; gy++) {
      let gx = 0;
      while (gx < gridW) {
        const hex = cellHexGrid[gy * gridW + gx];
        if (hex === bgHex) {
          gx++;
          continue;
        }
        if (!colorPaths.has(hex)) colorPaths.set(hex, []);

        if (shapeMode === 'circle') {
          const cx = (gx + 0.5) * step;
          const cy = (gy + 0.5) * step;
          const r = (step * 0.48).toFixed(2);
          colorPaths.get(hex).push(`<circle cx="${cx}" cy="${cy}" r="${r}"/>`);
          gx++;
        } else {
          // Run-length horizontal merge for rectangles
          let run = 1;
          while (gx + run < gridW && cellHexGrid[gy * gridW + (gx + run)] === hex) {
            run++;
          }
          colorPaths.get(hex).push(`<rect x="${gx * step}" y="${gy * step}" width="${run * step}" height="${step}"/>`);
          gx += run;
        }
      }
    }

    const svgLines = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gridW * step} ${gridH * step}" width="${gridW * step}" height="${gridH * step}" shape-rendering="crispEdges">`,
      `  <rect width="100%" height="100%" fill="${bgHex}"/>`
    ];

    for (const [hex, elements] of colorPaths.entries()) {
      svgLines.push(`  <g fill="${hex}">`);
      svgLines.push('    ' + elements.join('\n    '));
      svgLines.push(`  </g>`);
    }
    svgLines.push(`</svg>`);

    const blob = new Blob([svgLines.join('\n')], { type: 'image/svg+xml;charset=utf-8' });
    triggerDownload(blob, filename);
  }

  // =========================================================================
  // 3. ASCII / ANSI COLOR TEXT EXPORT (.TXT & .HTML)
  // =========================================================================
  function exportAsciiArt(imageData, columns = 100, asHtml = false, filename = 'dither-boy-ascii.txt') {
    const ramp = ' .:-=+*#%@';
    const aspect = 0.5; // terminal character width/height ratio
    const cols = Math.max(20, Math.min(240, columns));
    const rows = Math.max(10, Math.round((imageData.height / imageData.width) * cols * aspect));
    const data = imageData.data;
    const w = imageData.width;
    const h = imageData.height;

    const lines = [];
    for (let r = 0; r < rows; r++) {
      const sy = Math.min(h - 1, Math.floor((r / rows) * h));
      let line = '';
      for (let c = 0; c < cols; c++) {
        const sx = Math.min(w - 1, Math.floor((c / cols) * w));
        const idx = (sy * w + sx) * 4;
        const rv = data[idx], gv = data[idx + 1], bv = data[idx + 2];
        const luma01 = (0.2126 * rv + 0.7152 * gv + 0.0722 * bv) / 255;
        const ch = ramp[Math.min(ramp.length - 1, Math.floor(luma01 * ramp.length))];
        if (asHtml) {
          const hex = DB.Palettes.rgbToHex(rv, gv, bv);
          const safeCh = ch === ' ' ? '&nbsp;' : ch;
          line += `<span style="color:${hex}">${safeCh}</span>`;
        } else {
          line += ch;
        }
      }
      lines.push(line);
    }

    if (asHtml) {
      const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Dither Boy ANSI Art</title>
<style>body{background:#09090b;margin:24px;display:flex;justify-content:center;}pre{font:bold 10px/10px 'Courier New',monospace;letter-spacing:0;}</style>
</head><body><pre>${lines.join('\n')}</pre></body></html>`;
      triggerDownload(new Blob([htmlContent], { type: 'text/html;charset=utf-8' }), filename);
    } else {
      triggerDownload(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }), filename);
    }
  }

  // =========================================================================
  // 4. PURE-JS GIF89a LZW ANIMATION ENCODER (ZERO EXTERNAL DEPENDENCIES)
  // =========================================================================
  function encodeAnimatedGIF(framesImageData, delayMs = 80, filename = 'dither-boy-anim.gif') {
    if (!framesImageData || framesImageData.length === 0) return;
    const width = framesImageData[0].width;
    const height = framesImageData[0].height;

    const bytes = [];
    const writeByte = (b) => bytes.push(b & 0xFF);
    const writeShort = (s) => {
      bytes.push(s & 0xFF);
      bytes.push((s >> 8) & 0xFF);
    };
    const writeAscii = (str) => {
      for (let i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i));
    };

    // Build a global 256-color table across frames (using fast 6-8-5 RGB cube + exact palette match)
    const paletteRGB = [];
    const colorMap = new Map();

    for (let f = 0; f < framesImageData.length; f++) {
      const d = framesImageData[f].data;
      const step = Math.max(4, Math.floor(d.length / 8192) * 4);
      for (let i = 0; i < d.length; i += step) {
        const r = d[i] & 0xF8;
        const g = d[i + 1] & 0xFC;
        const b = d[i + 2] & 0xF8;
        const key = (r << 16) | (g << 8) | b;
        if (!colorMap.has(key) && paletteRGB.length < 256) {
          colorMap.set(key, paletteRGB.length);
          paletteRGB.push([d[i], d[i + 1], d[i + 2]]);
        }
      }
    }
    while (paletteRGB.length < 256) {
      paletteRGB.push([0, 0, 0]);
    }

    // GIF89a Header
    writeAscii('GIF89a');
    writeShort(width);
    writeShort(height);
    writeByte(0xF7); // Global Color Table Flag (1), Color Res (7), Sort (0), Size of GCT (7 -> 256 colors)
    writeByte(0);    // Background color index
    writeByte(0);    // Pixel aspect ratio

    // Global Color Table (256 * 3 bytes)
    for (let i = 0; i < 256; i++) {
      writeByte(paletteRGB[i][0]);
      writeByte(paletteRGB[i][1]);
      writeByte(paletteRGB[i][2]);
    }

    // Netscape 2.0 Infinite Loop Application Extension
    writeByte(0x21);
    writeByte(0xFF);
    writeByte(11);
    writeAscii('NETSCAPE2.0');
    writeByte(3);
    writeByte(1);
    writeShort(0); // Loop forever
    writeByte(0);

    // Fast nearest-palette lookup cache
    const nearestCache = new Map();
    function mapRgbToIndex(r, g, b) {
      const key = ((r & 0xF8) << 16) | ((g & 0xFC) << 8) | (b & 0xF8);
      if (nearestCache.has(key)) return nearestCache.get(key);
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < paletteRGB.length; i++) {
        const c = paletteRGB[i];
        const dr = r - c[0], dg = g - c[1], db = b - c[2];
        const d = dr * dr + dg * dg + db * db;
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
          if (d === 0) break;
        }
      }
      nearestCache.set(key, bestIdx);
      return bestIdx;
    }

    const delayCs = Math.max(2, Math.round(delayMs / 10));

    // Encode each frame using LZW minCodeSize = 8
    for (let f = 0; f < framesImageData.length; f++) {
      const img = framesImageData[f].data;
      const numPixels = width * height;
      const indexedPixels = new Uint8Array(numPixels);
      for (let p = 0, i = 0; p < numPixels; p++, i += 4) {
        indexedPixels[p] = mapRgbToIndex(img[i], img[i + 1], img[i + 2]);
      }

      // Graphic Control Extension
      writeByte(0x21);
      writeByte(0xF9);
      writeByte(4);
      writeByte(0x04); // Disposal method: Do not dispose
      writeShort(delayCs);
      writeByte(0);
      writeByte(0);

      // Image Descriptor
      writeByte(0x2C);
      writeShort(0);
      writeShort(0);
      writeShort(width);
      writeShort(height);
      writeByte(0); // Use Global Color Table

      // LZW Compression
      const minCodeSize = 8;
      writeByte(minCodeSize);

      const clearCode = 1 << minCodeSize;
      const eoiCode = clearCode + 1;
      let codeSize = minCodeSize + 1;
      let nextCode = eoiCode + 1;

      let bitBuf = 0;
      let bitCount = 0;
      const subBlock = [];

      const flushSubBlock = () => {
        if (subBlock.length > 0) {
          writeByte(subBlock.length);
          for (let i = 0; i < subBlock.length; i++) writeByte(subBlock[i]);
          subBlock.length = 0;
        }
      };

      const emitCode = (code) => {
        bitBuf |= code << bitCount;
        bitCount += codeSize;
        while (bitCount >= 8) {
          subBlock.push(bitBuf & 0xFF);
          if (subBlock.length === 255) flushSubBlock();
          bitBuf >>= 8;
          bitCount -= 8;
        }
      };

      let dict = new Map();
      emitCode(clearCode);

      let prefix = indexedPixels[0];
      for (let p = 1; p < numPixels; p++) {
        const k = indexedPixels[p];
        const pairKey = (prefix << 8) | k;
        const found = dict.get(pairKey);
        if (found !== undefined) {
          prefix = found;
        } else {
          emitCode(prefix);
          if (nextCode < 4096) {
            dict.set(pairKey, nextCode++);
            if (nextCode > (1 << codeSize) && codeSize < 12) {
              codeSize++;
            }
          } else {
            emitCode(clearCode);
            dict.clear();
            codeSize = minCodeSize + 1;
            nextCode = eoiCode + 1;
          }
          prefix = k;
        }
      }

      emitCode(prefix);
      emitCode(eoiCode);
      if (bitCount > 0) {
        subBlock.push(bitBuf & 0xFF);
      }
      flushSubBlock();
      writeByte(0); // Block terminator
    }

    // GIF Trailer
    writeByte(0x3B);

    const gifBlob = new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
    triggerDownload(gifBlob, filename);
  }

  // =========================================================================
  // 5. SPRITE SHEET COMPOSER (.PNG)
  // =========================================================================
  function exportSpriteSheet(framesImageData, columns = 4, filename = 'dither-boy-spritesheet.png') {
    if (!framesImageData || framesImageData.length === 0) return;
    const fw = framesImageData[0].width;
    const fh = framesImageData[0].height;
    const cols = Math.max(1, Math.min(framesImageData.length, columns));
    const rows = Math.ceil(framesImageData.length / cols);

    const sheetCanvas = document.createElement('canvas');
    sheetCanvas.width = fw * cols;
    sheetCanvas.height = fh * rows;
    const ctx = sheetCanvas.getContext('2d');

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = fw;
    tmpCanvas.height = fh;
    const tmpCtx = tmpCanvas.getContext('2d');

    framesImageData.forEach((frame, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      tmpCtx.putImageData(frame, 0, 0);
      ctx.drawImage(tmpCanvas, col * fw, row * fh);
    });

    sheetCanvas.toBlob((blob) => {
      if (blob) triggerDownload(blob, filename);
    }, 'image/png');
  }

  // =========================================================================
  // 6. PURE-JS ZIP ARCHIVE GENERATOR FOR PNG FRAME SEQUENCES (.ZIP)
  // =========================================================================
  const CRC_TABLE = (function () {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(uint8Arr) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < uint8Arr.length; i++) {
      crc = CRC_TABLE[(crc ^ uint8Arr[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  async function exportFrameSequenceZip(framesImageData, filename = 'dither-boy-sequence.zip') {
    if (!framesImageData || framesImageData.length === 0) return;
    const fw = framesImageData[0].width;
    const fh = framesImageData[0].height;
    const canvas = document.createElement('canvas');
    canvas.width = fw;
    canvas.height = fh;
    const ctx = canvas.getContext('2d');

    const files = [];
    for (let i = 0; i < framesImageData.length; i++) {
      ctx.putImageData(framesImageData[i], 0, 0);
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      const buf = new Uint8Array(await blob.arrayBuffer());
      const name = `frame_${String(i + 1).padStart(3, '0')}.png`;
      files.push({ name, data: buf, crc: crc32(buf) });
    }

    // Build uncompressed ZIP archive
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const file of files) {
      const nameBytes = new TextEncoder().encode(file.name);
      const localHeader = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(localHeader.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0, true);
      lv.setUint16(8, 0, true); // Store (0)
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0, true);
      lv.setUint32(14, file.crc, true);
      lv.setUint32(18, file.data.length, true);
      lv.setUint32(22, file.data.length, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      localHeader.set(nameBytes, 30);

      localParts.push(localHeader, file.data);

      const centralHeader = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(centralHeader.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0, true);
      cv.setUint32(16, file.crc, true);
      cv.setUint32(20, file.data.length, true);
      cv.setUint32(24, file.data.length, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      centralHeader.set(nameBytes, 46);
      centralParts.push(centralHeader);

      offset += localHeader.length + file.data.length;
    }

    const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    const zipBlob = new Blob([...localParts, ...centralParts, eocd], { type: 'application/zip' });
    triggerDownload(zipBlob, filename);
  }

  DB.Exporters = {
    triggerDownload,
    exportRasterImage,
    exportVectorSVG,
    exportAsciiArt,
    encodeAnimatedGIF,
    exportSpriteSheet,
    exportFrameSequenceZip
  };
})(window.DitherBoy);
