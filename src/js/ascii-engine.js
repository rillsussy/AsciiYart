/**
 * ASCII BOY // Photo & Video to ASCII Art Engine (ascii-engine.js)
 * Converts any ImageData into crisp ASCII, ANSI Block, Unicode Braille (2x4 subpixel),
 * Edge-Guided Contour ASCII (| - / \), Matrix Katakana, or Custom Character ramps.
 */
window.DitherBoy = window.DitherBoy || {};

(function (DB) {
  'use strict';

  // 20 Curated ASCII / ANSI / Unicode Character Sets
  const ASCII_STYLES = [
    {
      id: 'classic-10',
      name: 'Classic ASCII (10-Level)',
      category: 'classic',
      chars: ' .:-=+*#%@',
      desc: 'Balanced 10-step classic ASCII ramp from space to dense @.'
    },
    {
      id: 'edge-contour',
      name: 'Edge-Guided Contour + Shading',
      category: 'contour',
      chars: ' .:-=+*#%@',
      edgeAware: true,
      edgeStrength: 0.75,
      desc: 'Detects photo edges to draw | - / \\ structural outlines around shaded ASCII.'
    },
    {
      id: 'detailed-70',
      name: 'Detailed Paul Bourke (70-Char)',
      category: 'classic',
      chars: ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
      desc: 'Ultra-smooth 70-character photographic tonal ramp.'
    },
    {
      id: 'ansi-blocks',
      name: 'ANSI Shaded Blocks (░▒▓█)',
      category: 'blocks',
      chars: ' ░▒▓█',
      desc: 'Retro DOS / BBS ANSI art shaded block elements.'
    },
    {
      id: 'braille-2x4',
      name: 'Braille 2×4 Subpixel (⠀⠁⠃⠇⠏⠟⠿⣿)',
      category: 'blocks',
      chars: ' ⠀⠁⠃⠇⠏⠟⠿⣿',
      isBraille: true,
      desc: 'Computes 8-dot Unicode Braille subpixels (2×4 matrix per character) for razor-sharp detail.'
    },
    {
      id: 'minimal-dots',
      name: 'Minimalist Dots & Crosses',
      category: 'classic',
      chars: ' ·:xX#',
      desc: 'Clean modern typographic dot-to-cross progression.'
    },
    {
      id: 'typewriter',
      name: 'Vintage Typewriter Ink',
      category: 'classic',
      chars: ' .,;i1tfLCG08@',
      desc: 'Classic mechanical typewriter character density ramp.'
    },
    {
      id: 'pure-wireframe',
      name: 'Pure Wireframe Line Art (|-/\\)',
      category: 'contour',
      chars: '  .',
      edgeAware: true,
      edgeOnly: true,
      edgeStrength: 0.9,
      desc: 'Extracts pure ASCII contour line art from photo edges.'
    },
    {
      id: 'matrix-cyber',
      name: 'Matrix Digital Rain',
      category: 'cyber',
      chars: ' ｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ012345789Z',
      desc: 'Half-width katakana and cybernetic glyphs.'
    },
    {
      id: 'binary-01',
      name: 'Binary Stream (0 & 1)',
      category: 'cyber',
      chars: '  01',
      isBinaryCoord: true,
      desc: 'Renders photo shading using strictly 0s and 1s.'
    },
    {
      id: 'hex-dump',
      name: 'Hexadecimal Memory Dump',
      category: 'cyber',
      chars: ' .0123456789ABCDEF',
      desc: 'Hexadecimal nibble density characters.'
    },
    {
      id: 'slash-hatch',
      name: 'Woodcut Slash Crosshatch',
      category: 'classic',
      chars: ' `-\'/|\\X#',
      desc: 'Directional engraving slashes and crosshatches.'
    },
    {
      id: 'geometric-circles',
      name: 'Geometric Dots & Rings (·∘○◎●)',
      category: 'blocks',
      chars: ' ·∘○◌◎●◉',
      desc: 'Halftone-inspired Unicode geometric circles.'
    },
    {
      id: 'box-circuit',
      name: 'Box Drawing Circuit Maze',
      category: 'blocks',
      chars: ' ╴╵╶╷┌┐└┘├┤┬┴┼╬█',
      desc: 'Interlocking terminal box-drawing characters.'
    },
    {
      id: 'math-symbols',
      name: 'Mathematical & Logic Notation',
      category: 'cyber',
      chars: ' ·-±÷×∑∏∆∇∞§#@',
      desc: 'Scientific equation symbols arranged by ink density.'
    },
    {
      id: 'high-contrast',
      name: 'Brutalist High-Contrast ( .#@)',
      category: 'classic',
      chars: ' .#@',
      desc: 'Stark 4-level brutalist poster character ramp.'
    },
    {
      id: 'custom-chars',
      name: 'Custom Character Ramp / Word',
      category: 'custom',
      chars: ' .:-=+*#%@',
      desc: 'Type your own characters or word in the Custom Characters box!'
    }
  ];

  const BAYER_4 = [
    [0,  8,  2, 10],
    [12, 4, 14,  6],
    [3, 11,  1,  9],
    [15, 7, 13,  5]
  ];

  // Convert ImageData into a structured ASCII Grid + Render onto target Canvas
  function renderPhotoToAscii(sourceImageData, asciiConfig, colorConfig, targetCanvas) {
    const srcW = sourceImageData.width;
    const srcH = sourceImageData.height;
    const srcData = sourceImageData.data;

    const styleObj = ASCII_STYLES.find((s) => s.id === asciiConfig.styleId) || ASCII_STYLES[0];
    const rampStr = (asciiConfig.customRamp && asciiConfig.customRamp.length >= 2)
      ? asciiConfig.customRamp
      : styleObj.chars;
    const rampLen = rampStr.length;

    // Columns (20..220)
    const cols = Math.max(20, Math.min(240, Math.round(asciiConfig.columns || 100)));
    // Monospace character cell aspect ratio (~0.55 width/height)
    const charAspect = 0.56 * Math.max(0.5, Math.min(2.0, (asciiConfig.lineScale || 1)));
    const rows = Math.max(12, Math.round((srcH / srcW) * cols * charAspect));

    const biasNorm = (asciiConfig.thresholdBias || 0) / 100;
    const contrast = Math.max(0.2, Math.min(3.0, (asciiConfig.contrast || 120) / 100));
    const invert = !!asciiConfig.invert;
    const gateCutoff = invert
      ? Math.max(0.02, Math.min(0.88, 0.36 - biasNorm * 0.75))
      : Math.max(0.01, Math.min(0.85, 0.08 - biasNorm * 0.65));
    const ditherMode = asciiConfig.ditherMode || 'floyd'; // 'none', 'floyd', 'atkinson', 'bayer'
    const ditherSpread = (asciiConfig.ditherStrength ?? 65) / 100;
    const extraEdgeStrength = (asciiConfig.edgeStrength ?? 0) / 100;
    const useEdge = styleObj.edgeAware || extraEdgeStrength > 0.05;
    const effEdgeStrength = styleObj.edgeAware
      ? Math.max(styleObj.edgeStrength || 0.7, extraEdgeStrength)
      : extraEdgeStrength;

    // Prepare Palette Cache for Palette-Mapped Color Mode
    const paletteCache = DB.Palettes.preparePaletteCache(colorConfig.palette || ['#000000', '#FFFFFF']);
    const bgHex = colorConfig.bgColor || colorConfig.palette?.[0] || '#0e0e11';
    const fgHex = colorConfig.fgColor || colorConfig.palette?.[colorConfig.palette.length - 1] || '#E5E4CE';

    // 1. Sample Cell Grid Luminance, RGB, and Sobel Gradient Vectors
    const cellLuma = new Float32Array(cols * rows);
    const cellR = new Float32Array(cols * rows);
    const cellG = new Float32Array(cols * rows);
    const cellB = new Float32Array(cols * rows);

    for (let r = 0; r < rows; r++) {
      const sy0 = Math.floor((r / rows) * srcH);
      const sy1 = Math.max(sy0 + 1, Math.min(srcH, Math.floor(((r + 1) / rows) * srcH)));
      for (let c = 0; c < cols; c++) {
        const sx0 = Math.floor((c / cols) * srcW);
        const sx1 = Math.max(sx0 + 1, Math.min(srcW, Math.floor(((c + 1) / cols) * srcW)));

        let sumR = 0, sumG = 0, sumB = 0, count = 0;
        for (let sy = sy0; sy < sy1; sy++) {
          for (let sx = sx0; sx < sx1; sx++) {
            const idx = (sy * srcW + sx) * 4;
            sumR += srcData[idx];
            sumG += srcData[idx + 1];
            sumB += srcData[idx + 2];
            count++;
          }
        }
        let rv = sumR / count;
        let gv = sumG / count;
        let bv = sumB / count;

        // Apply contrast
        rv = Math.max(0, Math.min(255, (rv - 128) * contrast + 128));
        gv = Math.max(0, Math.min(255, (gv - 128) * contrast + 128));
        bv = Math.max(0, Math.min(255, (bv - 128) * contrast + 128));

        const photoLuma = (0.2126 * rv + 0.7152 * gv + 0.0722 * bv) / 255;
        let targetIntensity = invert ? (1.0 - photoLuma) : photoLuma;

        if (targetIntensity <= gateCutoff) {
          targetIntensity = 0;
        } else {
          targetIntensity = (targetIntensity - gateCutoff) / Math.max(0.05, 1.0 - gateCutoff);
        }
        targetIntensity = Math.max(0, Math.min(1, targetIntensity));

        if (invert) {
          rv = 255 - rv;
          gv = 255 - gv;
          bv = 255 - bv;
        }

        const cellIdx = r * cols + c;
        cellR[cellIdx] = rv;
        cellG[cellIdx] = gv;
        cellB[cellIdx] = bv;
        cellLuma[cellIdx] = targetIntensity;
      }
    }

    // 2. Optional Pre-Glyph Cell Dithering (Creates authentic dithered ASCII shading!)
    const workLuma = new Float32Array(cellLuma);
    if (ditherMode === 'bayer') {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (cellLuma[idx] <= 0) {
            workLuma[idx] = 0;
            continue;
          }
          const bVal = (BAYER_4[r & 3][c & 3] + 0.5) / 16 - 0.5;
          workLuma[idx] = Math.max(0, Math.min(1, workLuma[idx] + bVal * (1.8 / Math.max(2, rampLen)) * ditherSpread));
        }
      }
    } else if (ditherMode === 'floyd' || ditherMode === 'atkinson') {
      const steps = Math.max(2, rampLen - 1);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (cellLuma[idx] <= 0) {
            workLuma[idx] = 0;
            continue;
          }
          const oldL = Math.max(0, Math.min(1, workLuma[idx]));
          const qL = Math.round(oldL * steps) / steps;
          workLuma[idx] = qL;
          const err = (oldL - qL) * ditherSpread;
          if (ditherMode === 'atkinson') {
            const w = err / 8;
            if (c + 1 < cols && cellLuma[idx + 1] > 0) workLuma[idx + 1] += w;
            if (c + 2 < cols && cellLuma[idx + 2] > 0) workLuma[idx + 2] += w;
            if (r + 1 < rows) {
              if (c > 0 && cellLuma[idx + cols - 1] > 0) workLuma[idx + cols - 1] += w;
              if (cellLuma[idx + cols] > 0) workLuma[idx + cols] += w;
              if (c + 1 < cols && cellLuma[idx + cols + 1] > 0) workLuma[idx + cols + 1] += w;
            }
            if (r + 2 < rows && cellLuma[idx + cols * 2] > 0) workLuma[idx + cols * 2] += w;
          } else {
            if (c + 1 < cols && cellLuma[idx + 1] > 0) workLuma[idx + 1] += err * (7 / 16);
            if (r + 1 < rows) {
              if (c > 0 && cellLuma[idx + cols - 1] > 0) workLuma[idx + cols - 1] += err * (3 / 16);
              if (cellLuma[idx + cols] > 0) workLuma[idx + cols] += err * (5 / 16);
              if (c + 1 < cols && cellLuma[idx + cols + 1] > 0) workLuma[idx + cols + 1] += err * (1 / 16);
            }
          }
        }
      }
    }

    // 3. Map Each Cell to its ASCII Character & Color
    const gridChars = new Array(rows);
    const gridColors = new Array(rows);
    const plainLines = [];

    // Braille 2x4 dot bit offsets:
    // (0,0):0x01, (0,1):0x02, (0,2):0x04, (1,0):0x08, (1,1):0x10, (1,2):0x20, (0,3):0x40, (1,3):0x80
    const brailleMap = [
      [0x01, 0x08],
      [0x02, 0x10],
      [0x04, 0x20],
      [0x40, 0x80]
    ];

    const edgeThresh = 0.22 * (1.15 - effEdgeStrength * 0.75);

    for (let r = 0; r < rows; r++) {
      const rowChars = new Array(cols);
      const rowCols = new Array(cols);

      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const luma = Math.max(0, Math.min(1, workLuma[idx]));
        let ch = ' ';

        // If cell is gated out as empty (e.g. bright spot in Dark Spots mode, or dark background in Bright Spots mode)
        if (cellLuma[idx] <= 0) {
          ch = ' ';
        }
        // Special Case A: True 2x4 Subpixel Unicode Braille (U+2800 + mask)
        else if (styleObj.isBraille) {
          let mask = 0;
          const thresh = Math.max(20, Math.min(235, gateCutoff * 255 + 45));
          for (let dy = 0; dy < 4; dy++) {
            const sy = Math.min(srcH - 1, Math.floor(((r + (dy + 0.5) / 4) / rows) * srcH));
            for (let dx = 0; dx < 2; dx++) {
              const sx = Math.min(srcW - 1, Math.floor(((c + (dx + 0.5) / 2) / cols) * srcW));
              const pIdx = (sy * srcW + sx) * 4;
              let pLuma = 0.2126 * srcData[pIdx] + 0.7152 * srcData[pIdx + 1] + 0.0722 * srcData[pIdx + 2];
              pLuma = Math.max(0, Math.min(255, (pLuma - 128) * contrast + 128));
              if (invert) pLuma = 255 - pLuma;
              if (pLuma >= thresh) {
                mask |= brailleMap[dy][dx];
              }
            }
          }
          ch = mask === 0 ? ' ' : String.fromCharCode(0x2800 + mask);
        }
        // Special Case B: Binary 0/1 Coordinate Stream
        else if (styleObj.isBinaryCoord) {
          if (luma < 0.14) ch = ' ';
          else if (luma < 0.52) ch = ((r + c) & 1) ? '0' : '.';
          else ch = ((r ^ c) & 1) ? '1' : '0';
        }
        // Standard & Edge-Guided Character Selection
        else {
          let isEdgeChar = false;
          if (useEdge && r > 0 && r < rows - 1 && c > 0 && c < cols - 1) {
            const gx =
              -cellLuma[(r - 1) * cols + (c - 1)] + cellLuma[(r - 1) * cols + (c + 1)]
              - 2 * cellLuma[r * cols + (c - 1)] + 2 * cellLuma[r * cols + (c + 1)]
              - cellLuma[(r + 1) * cols + (c - 1)] + cellLuma[(r + 1) * cols + (c + 1)];
            const gy =
              -cellLuma[(r - 1) * cols + (c - 1)] - 2 * cellLuma[(r - 1) * cols + c] - cellLuma[(r - 1) * cols + (c + 1)]
              + cellLuma[(r + 1) * cols + (c - 1)] + 2 * cellLuma[(r + 1) * cols + c] + cellLuma[(r + 1) * cols + (c + 1)];
            const mag = Math.hypot(gx, gy);
            if (mag > edgeThresh) {
              // Edge tangent angle is perpendicular to gradient
              let angle = (Math.atan2(gy, gx) * 180) / Math.PI;
              if (angle < 0) angle += 180;
              if (angle >= 22.5 && angle < 67.5) ch = '/';
              else if (angle >= 67.5 && angle < 112.5) ch = '-';
              else if (angle >= 112.5 && angle < 157.5) ch = '\\';
              else ch = '|';
              isEdgeChar = true;
            }
          }

          if (!isEdgeChar) {
            if (styleObj.edgeOnly) {
              ch = luma > 0.75 ? '·' : ' ';
            } else {
              const charIdx = Math.min(rampLen - 1, Math.floor(luma * (rampLen - 0.001)));
              ch = rampStr[charIdx];
            }
          }
        }

        rowChars[c] = ch;

        // Determine Character Foreground Color
        const cMode = colorConfig.mode || 'palette';
        if (cMode === 'photo-rgb') {
          rowCols[c] = DB.Palettes.rgbToHex(cellR[idx], cellG[idx], cellB[idx]);
        } else if (cMode === 'monochrome') {
          rowCols[c] = fgHex;
        } else {
          // Palette-Mapped: map pixel RGB to nearest color in active palette!
          const match = DB.Palettes.findNearestColor(cellR[idx], cellG[idx], cellB[idx], paletteCache, 'redmean');
          rowCols[c] = match.hex;
        }
      }

      gridChars[r] = rowChars;
      gridColors[r] = rowCols;
      plainLines.push(rowChars.join(''));
    }

    // 4. Render Crisp Monospace ASCII Art onto Target Canvas
    if (targetCanvas) {
      const cellW = Math.max(5, Math.round(720 / cols));
      const cellH = Math.max(8, Math.round(cellW / charAspect));
      const canvasW = cols * cellW;
      const canvasH = rows * cellH;

      if (targetCanvas.width !== canvasW || targetCanvas.height !== canvasH) {
        targetCanvas.width = canvasW;
        targetCanvas.height = canvasH;
      }

      const ctx = targetCanvas.getContext('2d');
      ctx.fillStyle = bgHex;
      ctx.fillRect(0, 0, canvasW, canvasH);

      ctx.font = `bold ${Math.round(cellH * 0.92)}px "JetBrains Mono", "Cascadia Code", "Consolas", monospace`;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';

      for (let r = 0; r < rows; r++) {
        const y = r * cellH;
        const rChars = gridChars[r];
        const rCols = gridColors[r];
        for (let c = 0; c < cols; c++) {
          const ch = rChars[c];
          if (ch === ' ') continue;
          ctx.fillStyle = rCols[c];
          ctx.fillText(ch, c * cellW, y);
        }
      }

      // Optional CRT Scanline & Bloom Polish
      if (asciiConfig.crtScanlines > 0) {
        const alpha = (asciiConfig.crtScanlines / 100) * 0.45;
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        for (let y = 0; y < canvasH; y += 3) {
          ctx.fillRect(0, y, canvasW, 1);
        }
      }
    }

    return {
      cols,
      rows,
      bgHex,
      gridChars,
      gridColors,
      plainText: plainLines.join('\n')
    };
  }

  // Export True Vector <text> SVG of the ASCII Art
  function exportAsciiVectorSVG(asciiResult, filename = 'ascii-art.svg') {
    const { cols, rows, bgHex, gridChars, gridColors } = asciiResult;
    const cellW = 8;
    const cellH = 14;
    const svgW = cols * cellW;
    const svgH = rows * cellH;

    const escapeXml = (s) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const lines = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}">`,
      `  <rect width="100%" height="100%" fill="${bgHex}"/>`,
      `  <g font-family="'JetBrains Mono', 'Consolas', monospace" font-size="13" font-weight="bold">`
    ];

    for (let r = 0; r < rows; r++) {
      const y = (r + 0.82) * cellH;
      for (let c = 0; c < cols; c++) {
        const ch = gridChars[r][c];
        if (ch === ' ') continue;
        lines.push(`    <text x="${c * cellW}" y="${y.toFixed(1)}" fill="${gridColors[r][c]}">${escapeXml(ch)}</text>`);
      }
    }

    lines.push(`  </g>`);
    lines.push(`</svg>`);

    const blob = new Blob([lines.join('\n')], { type: 'image/svg+xml;charset=utf-8' });
    DB.Exporters.triggerDownload(blob, filename);
  }

  // Export Self-Contained Colored HTML ASCII Art
  function exportAsciiColoredHTML(asciiResult, filename = 'ascii-art.html') {
    const { rows, cols, bgHex, gridChars, gridColors } = asciiResult;
    const escapeHtml = (s) =>
      s === ' ' ? '&nbsp;' : s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const htmlRows = [];
    for (let r = 0; r < rows; r++) {
      let rowStr = '';
      let c = 0;
      while (c < cols) {
        const col = gridColors[r][c];
        let runChars = '';
        while (c < cols && gridColors[r][c] === col) {
          runChars += escapeHtml(gridChars[r][c]);
          c++;
        }
        rowStr += `<span style="color:${col}">${runChars}</span>`;
      }
      htmlRows.push(rowStr);
    }

    const doc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ASCII Boy // Colored ASCII Art</title>
<style>
  body { background: ${bgHex}; margin: 24px; display: flex; justify-content: center; }
  pre { font: bold 11px/12px 'JetBrains Mono', 'Consolas', 'Courier New', monospace; letter-spacing: 0; }
</style>
</head>
<body>
<pre>${htmlRows.join('\n')}</pre>
</body>
</html>`;

    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
    DB.Exporters.triggerDownload(blob, filename);
  }

  DB.AsciiEngine = {
    ASCII_STYLES,
    renderPhotoToAscii,
    exportAsciiVectorSVG,
    exportAsciiColoredHTML
  };
})(window.DitherBoy);
