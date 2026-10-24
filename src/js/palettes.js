/**
 * DITHER BOY // Palettes, Color Spaces, K-Means Extractor & Studio Presets
 */
window.DitherBoy = window.DitherBoy || {};

(function (DB) {
  'use strict';

  // Convert hex string (#RRGGBB or RRGGBB) to [R, G, B]
  function hexToRgb(hex) {
    let clean = String(hex).replace(/[^0-9a-fA-F]/g, '');
    if (clean.length === 3) {
      clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    const num = parseInt(clean || '000000', 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  function rgbToHex(r, g, b) {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    return (
      '#' +
      [clamp(r), clamp(g), clamp(b)]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
    );
  }

  function getLuma(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Fast sRGB to approximate CIELAB [L, a, b] for perceptual matching
  function rgbToLab(r, g, b) {
    let rn = r / 255, gn = g / 255, bn = b / 255;
    rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
    gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
    bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;

    let x = (rn * 0.4124 + gn * 0.3576 + bn * 0.1805) / 0.95047;
    let y = (rn * 0.2126 + gn * 0.7152 + bn * 0.0722) / 1.00000;
    let z = (rn * 0.0193 + gn * 0.1192 + bn * 0.9505) / 1.08883;

    x = x > 0.008856 ? Math.cbrt(x) : (7.787 * x) + 16 / 116;
    y = y > 0.008856 ? Math.cbrt(y) : (7.787 * y) + 16 / 116;
    z = z > 0.008856 ? Math.cbrt(z) : (7.787 * z) + 16 / 116;

    return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)];
  }

  // 33 Curated Authentic Hardware, Print & Artistic Palettes
  const PALETTES = [
    // Studio AAA Default Abstract Palette
    {
      id: 'acidic',
      name: 'Acidic',
      category: 'Abstract',
      colors: [
        '#28282C',
        '#242985',
        '#2834EE',
        '#4C85F9',
        '#C6FB1F',
        '#B1F27E',
        '#76D2ED',
        '#E5E4CE'
      ]
    },
    {
      id: 'hyper-cobalt',
      name: 'Hyper Cobalt',
      category: 'Abstract',
      colors: ['#0D0E15', '#1B2358', '#2945D8', '#5698FF', '#FF5277', '#FFE57F', '#F4F3EA']
    },
    {
      id: 'ultraviolet-Moss',
      name: 'Ultraviolet Moss',
      category: 'Abstract',
      colors: ['#16131E', '#372566', '#6C3CE9', '#A882FF', '#7CE85F', '#D8FF9C', '#F2F0E6']
    },
    // 1-Bit & Dual-Ink
    {
      id: 'mac-1bit',
      name: '1984 Macintosh 1-Bit',
      category: '1-Bit & Monitors',
      colors: ['#000000', '#FFFFFF']
    },
    {
      id: 'obra-ibm-8503',
      name: 'Obra Dinn // IBM 8503 Paper',
      category: '1-Bit & Monitors',
      colors: ['#26231F', '#E5DFC5']
    },
    {
      id: 'obra-mac-se',
      name: 'Obra Dinn // Macintosh SE',
      category: '1-Bit & Monitors',
      colors: ['#333319', '#FFFFE5']
    },
    {
      id: 'obra-c1084',
      name: 'Obra Dinn // Commodore 1084',
      category: '1-Bit & Monitors',
      colors: ['#0D2B24', '#8CE6B8']
    },
    {
      id: 'crt-amber',
      name: 'P3 Amber Phosphor CRT',
      category: '1-Bit & Monitors',
      colors: ['#1A0B00', '#592400', '#B35900', '#FFB000']
    },
    {
      id: 'crt-green',
      name: 'P1 Green Terminal CRT',
      category: '1-Bit & Monitors',
      colors: ['#041406', '#0D4014', '#1FA630', '#55FF66']
    },
    {
      id: 'playdate-1bit',
      name: 'Playdate Reflective LCD',
      category: '1-Bit & Monitors',
      colors: ['#312F28', '#B1AFA8']
    },
    {
      id: 'blueprint',
      name: 'Cyanotype Blueprint',
      category: '1-Bit & Monitors',
      colors: ['#081A38', '#143D7A', '#3B78C4', '#E6F2FF']
    },

    // Retro Handhelds & Consoles
    {
      id: 'dmg-01',
      name: 'Game Boy DMG-01 Olive',
      category: 'Retro Handhelds',
      colors: ['#0F380F', '#306230', '#8BAC0F', '#9BBC0F']
    },
    {
      id: 'gb-pocket',
      name: 'Game Boy Pocket Grayscale',
      category: 'Retro Handhelds',
      colors: ['#181818', '#4A5138', '#8C926B', '#C5CAA4']
    },
    {
      id: 'gb-camera-thermal',
      name: 'GB Printer Thermal Paper',
      category: 'Retro Handhelds',
      colors: ['#2B2523', '#665852', '#A8968A', '#EAE0D5']
    },
    {
      id: 'virtual-boy',
      name: 'Virtual Boy Red LED',
      category: 'Retro Handhelds',
      colors: ['#000000', '#550000', '#AA0000', '#FF0019']
    },
    {
      id: 'pico-8',
      name: 'PICO-8 Fantasy Console (16)',
      category: 'Retro Computers',
      colors: [
        '#000000', '#1D2B53', '#7E2553', '#008751',
        '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
        '#FF004D', '#FFA300', '#FFEC27', '#00E436',
        '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
      ]
    },
    {
      id: 'cga-mode4-cool',
      name: 'IBM CGA Mode 4 (Cyan/Magenta)',
      category: 'Retro Computers',
      colors: ['#000000', '#00AAAA', '#AA00AA', '#FFFFFF']
    },
    {
      id: 'cga-mode4-high',
      name: 'IBM CGA Palette 1 High',
      category: 'Retro Computers',
      colors: ['#000000', '#55FFFF', '#FF55FF', '#FFFFFF']
    },
    {
      id: 'cga-mode4-warm',
      name: 'IBM CGA Mode 4 (Red/Green/Gold)',
      category: 'Retro Computers',
      colors: ['#000000', '#00AA00', '#AA0000', '#AA5500']
    },
    {
      id: 'commodore-64',
      name: 'Commodore 64 (Pepto 16)',
      category: 'Retro Computers',
      colors: [
        '#000000', '#FFFFFF', '#68372B', '#70A4B2',
        '#6F3D86', '#588D43', '#352879', '#B8C76F',
        '#6F4F25', '#433900', '#9A6759', '#444444',
        '#6C6C6C', '#9AD284', '#6C5EB5', '#959595'
      ]
    },
    {
      id: 'apple-ii',
      name: 'Apple II Hi-Res (6-Color)',
      category: 'Retro Computers',
      colors: ['#000000', '#D033B9', '#14CF1C', '#1490F5', '#F25F16', '#FFFFFF']
    },
    {
      id: 'zx-spectrum',
      name: 'Sinclair ZX Spectrum (15)',
      category: 'Retro Computers',
      colors: [
        '#000000', '#0000D7', '#D70000', '#D700D7',
        '#00D700', '#00D7D7', '#D7D700', '#D7D7D7',
        '#0000FF', '#FF0000', '#FF00FF', '#00FF00',
        '#00FFFF', '#FFFF00', '#FFFFFF'
      ]
    },
    {
      id: 'ega-16',
      name: 'IBM EGA Standard 16',
      category: 'Retro Computers',
      colors: [
        '#000000', '#0000AA', '#00AA00', '#00AAAA',
        '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
        '#555555', '#5555FF', '#55FF55', '#55FFFF',
        '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'
      ]
    },
    {
      id: 'pc98-cyber',
      name: 'NEC PC-9801 Neon Night',
      category: 'Retro Computers',
      colors: ['#0B0719', '#241445', '#4E1E68', '#992878', '#E04673', '#388697', '#63D2B4', '#F9F3DF']
    },

    // Risograph & Fine Print
    {
      id: 'riso-pink-teal',
      name: 'Risograph // Fluo Pink & Teal',
      category: 'Risograph & Print',
      colors: ['#004F59', '#00838A', '#FF48B0', '#FFB3DE', '#FAF6EE']
    },
    {
      id: 'riso-black-orange',
      name: 'Risograph // Soy Black & Orange',
      category: 'Risograph & Print',
      colors: ['#1E1D1B', '#734B3D', '#FF6C2F', '#FFB88C', '#F5EFE6']
    },
    {
      id: 'riso-indigo-gold',
      name: 'Risograph // Indigo, Crimson & Gold',
      category: 'Risograph & Print',
      colors: ['#1A2456', '#3D52A0', '#E13745', '#F7B538', '#FBF8F1']
    },
    {
      id: 'cmyk-print',
      name: 'CMYK Newsprint Offset',
      category: 'Risograph & Print',
      colors: ['#181715', '#009FE3', '#E6007E', '#FFED00', '#2E2D88', '#009640', '#E30613', '#F4F1EA']
    },
    {
      id: 'woodcut-sepia',
      name: 'Copperplate Engraving Sepia',
      category: 'Risograph & Print',
      colors: ['#17110E', '#3D2B22', '#755442', '#B8947A', '#EFE5D8']
    },

    // Modern & Stylized
    {
      id: 'cyberpunk-2099',
      name: 'Cyberpunk 2099 Overdrive',
      category: 'Modern & Stylized',
      colors: ['#070510', '#1B113A', '#6A146E', '#E61C72', '#00F0FF', '#FFE600', '#FFFFFF']
    },
    {
      id: 'vaporwave-sunset',
      name: 'Vaporwave Plaza 1995',
      category: 'Modern & Stylized',
      colors: ['#120924', '#381954', '#7B287D', '#D9438F', '#FF7C70', '#49C6E5', '#AEF6F7']
    },
    {
      id: 'acid-brutalist',
      name: 'Acid Graphic Design Zine',
      category: 'Modern & Stylized',
      colors: ['#0A0A0A', '#293322', '#C5FF00', '#FF2A00', '#F0F0EC']
    },
    {
      id: 'bauhaus-primary',
      name: 'Weimar Bauhaus 1923',
      category: 'Modern & Stylized',
      colors: ['#191918', '#D92B2B', '#1F4E9E', '#F2C12E', '#EDE7D9']
    },
    {
      id: 'grayscale-4',
      name: '2-Bit Grayscale (4 Tones)',
      category: 'Modern & Stylized',
      colors: ['#000000', '#555555', '#AAAAAA', '#FFFFFF']
    },
    {
      id: 'grayscale-8',
      name: '3-Bit Grayscale (8 Tones)',
      category: 'Modern & Stylized',
      colors: ['#000000', '#242424', '#494949', '#6D6D6D', '#929292', '#B6B6B6', '#DBDBDB', '#FFFFFF']
    }
  ];

  // Precompute RGB and Lab arrays for fast per-pixel palette lookup
  function preparePaletteCache(hexColors) {
    const list = hexColors.map((hex, index) => {
      const [r, g, b] = hexToRgb(hex);
      const luma = getLuma(r, g, b);
      const [L, a, labB] = rgbToLab(r, g, b);
      return { hex, r, g, b, luma, L, a, labB, index };
    });
    // Also create a luma-sorted copy for Luma Ramp / Ordered mapping
    const lumaSorted = [...list].sort((x, y) => x.luma - y.luma);
    // Build a fast 16-bit (5-6-5) RGB lookup table (65,536 entries) for ultra-fast nearest color queries
    return {
      colors: list,
      lumaSorted,
      lut565: null,
      lutMetric: null
    };
  }

  function findNearestColor(r, g, b, paletteCache, metric) {
    const colors = paletteCache.colors;
    const len = colors.length;
    if (len === 0) return { r: 0, g: 0, b: 0, index: 0 };
    if (len === 1) return colors[0];

    if (metric === 'luma-ramp') {
      const luma = Math.max(0, Math.min(255, getLuma(r, g, b)));
      const idx = Math.min(len - 1, Math.floor((luma / 256) * len));
      return paletteCache.lumaSorted[idx];
    }

    // Use 15-bit (5-5-5 = 32768 entries) cached LUT for instant O(1) color matching!
    const rc = r < 0 ? 0 : r > 255 ? 255 : r | 0;
    const gc = g < 0 ? 0 : g > 255 ? 255 : g | 0;
    const bc = b < 0 ? 0 : b > 255 ? 255 : b | 0;

    if (paletteCache.lutMetric !== metric || !paletteCache.lut555) {
      paletteCache.lut555 = new Uint8Array(32768);
      paletteCache.lutMetric = metric;
      for (let ir = 0; ir < 32; ir++) {
        const rr = (ir << 3) | (ir >> 2);
        for (let ig = 0; ig < 32; ig++) {
          const gg = (ig << 3) | (ig >> 2);
          for (let ib = 0; ib < 32; ib++) {
            const bb = (ib << 3) | (ib >> 2);
            const key = (ir << 10) | (ig << 5) | ib;
            paletteCache.lut555[key] = computeExactNearestIndex(rr, gg, bb, colors, metric);
          }
        }
      }
    }

    const key = ((rc >> 3) << 10) | ((gc >> 3) << 5) | (bc >> 3);
    return colors[paletteCache.lut555[key]];
  }

  function computeExactNearestIndex(r, g, b, colors, metric) {
    let bestIdx = 0;
    let bestDist = Infinity;
    const len = colors.length;

    if (metric === 'cielab') {
      const [L, a, labB] = rgbToLab(r, g, b);
      for (let i = 0; i < len; i++) {
        const c = colors[i];
        const dL = L - c.L;
        const da = a - c.a;
        const db = labB - c.labB;
        const dist = dL * dL + da * da + db * db;
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      return bestIdx;
    }

    if (metric === 'rec709') {
      const luma = getLuma(r, g, b);
      for (let i = 0; i < len; i++) {
        const c = colors[i];
        const dr = r - c.r;
        const dg = g - c.g;
        const db = b - c.b;
        const dl = luma - c.luma;
        const dist = (dr * dr * 0.2126 + dg * dg * 0.7152 + db * db * 0.0722) + dl * dl * 1.5;
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      return bestIdx;
    }

    if (metric === 'euclidean') {
      for (let i = 0; i < len; i++) {
        const c = colors[i];
        const dr = r - c.r;
        const dg = g - c.g;
        const db = b - c.b;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      return bestIdx;
    }

    // Default: Perceptual Redmean
    for (let i = 0; i < len; i++) {
      const c = colors[i];
      const rmean = (r + c.r) * 0.5;
      const dr = r - c.r;
      const dg = g - c.g;
      const db = b - c.b;
      const dist =
        (2 + rmean / 256) * dr * dr +
        4 * dg * dg +
        (2 + (255 - rmean) / 256) * db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  // K-Means++ Image Palette Extractor
  function extractPaletteFromImageData(imageData, k = 8) {
    const data = imageData.data;
    const totalPixels = data.length / 4;
    const stride = Math.max(1, Math.floor(totalPixels / 4096));
    const samples = [];

    for (let i = 0; i < totalPixels; i += stride) {
      const idx = i * 4;
      if (data[idx + 3] > 32) {
        samples.push([data[idx], data[idx + 1], data[idx + 2]]);
      }
    }
    if (samples.length === 0) return ['#000000', '#FFFFFF'];

    // Initialize K-Means++ centroids deterministically
    const centroids = [];
    centroids.push([...samples[0]]);
    for (let c = 1; c < k; c++) {
      let maxDist = -1;
      let bestSample = samples[c % samples.length];
      for (let s = 0; s < samples.length; s += 3) {
        const pt = samples[s];
        let minDistToCentroid = Infinity;
        for (let j = 0; j < centroids.length; j++) {
          const cen = centroids[j];
          const dr = pt[0] - cen[0];
          const dg = pt[1] - cen[1];
          const db = pt[2] - cen[2];
          const d = dr * dr + dg * dg + db * db;
          if (d < minDistToCentroid) minDistToCentroid = d;
        }
        if (minDistToCentroid > maxDist) {
          maxDist = minDistToCentroid;
          bestSample = pt;
        }
      }
      centroids.push([...bestSample]);
    }

    // Run 10 iterations of K-Means
    for (let iter = 0; iter < 10; iter++) {
      const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
      for (let s = 0; s < samples.length; s++) {
        const pt = samples[s];
        let bestC = 0;
        let bestD = Infinity;
        for (let c = 0; c < k; c++) {
          const cen = centroids[c];
          const dr = pt[0] - cen[0];
          const dg = pt[1] - cen[1];
          const db = pt[2] - cen[2];
          const d = dr * dr + dg * dg + db * db;
          if (d < bestD) {
            bestD = d;
            bestC = c;
          }
        }
        sums[bestC][0] += pt[0];
        sums[bestC][1] += pt[1];
        sums[bestC][2] += pt[2];
        sums[bestC][3] += 1;
      }
      for (let c = 0; c < k; c++) {
        if (sums[c][3] > 0) {
          centroids[c][0] = sums[c][0] / sums[c][3];
          centroids[c][1] = sums[c][1] / sums[c][3];
          centroids[c][2] = sums[c][2] / sums[c][3];
        }
      }
    }

    // Sort extracted colors by luminance dark -> light
    centroids.sort((a, b) => getLuma(a[0], a[1], a[2]) - getLuma(b[0], b[1], b[2]));
    const uniqueHex = [];
    for (const c of centroids) {
      const h = rgbToHex(c[0], c[1], c[2]);
      if (!uniqueHex.includes(h)) uniqueHex.push(h);
    }
    return uniqueHex.length >= 2 ? uniqueHex : ['#000000', '#FFFFFF'];
  }

  // 18 Curated Complete Studio Pipeline Presets
  const STUDIO_PRESETS = [
    {
      id: 'preset-obra-dinn',
      name: 'Return of the Obra Dinn (1-Bit Edge + Bayer)',
      desc: 'Crisp 1-bit Macintosh/IBM insurance ledger aesthetic with edge ink outlines.',
      algoId: 'bayer-8x8',
      scale: 2,
      colorMode: 'palette',
      paletteId: 'obra-ibm-8503',
      ditherParams: { bleed: 100, thresholdBias: -4, contrast: 1.35, serpentine: true, spread: 42 },
      pipelineOverride: {
        preGrade: { enabled: true, contrast: 28, sharpen: 45, brightness: 4 },
        edgeInk: { enabled: true, threshold: 34, opacity: 85, mode: 'dark' },
        crt: { enabled: false }
      }
    },
    {
      id: 'preset-atkinson-mac',
      name: '1984 MacPaint HyperCard (Atkinson)',
      desc: 'Authentic Bill Atkinson 75% error retention dither with high midtone snap.',
      algoId: 'atkinson',
      scale: 2,
      colorMode: 'monochrome',
      fgColor: '#FAF8F2',
      bgColor: '#141413',
      ditherParams: { bleed: 100, thresholdBias: 0, contrast: 1.2, serpentine: true },
      pipelineOverride: {
        preGrade: { enabled: true, contrast: 20, sharpen: 30 },
        edgeInk: { enabled: false }
      }
    },
    {
      id: 'preset-gb-camera',
      name: '1998 Game Boy Camera & Thermal Printer',
      desc: '4-tone olive DMG matrix dither at 3x pixel crush with subtle paper texture.',
      algoId: 'gb-camera',
      scale: 3,
      colorMode: 'palette',
      paletteId: 'dmg-01',
      ditherParams: { bleed: 100, thresholdBias: 5, contrast: 1.25, spread: 48 },
      pipelineOverride: {
        preGrade: { enabled: true, contrast: 25, sharpen: 40 },
        grain: { enabled: true, intensity: 14 }
      }
    },
    {
      id: 'preset-riso-zine',
      name: 'Risograph Dual-Drum Punk Zine',
      desc: 'Fluorescent pink & teal stochastic mezzotint with stacked halftone highlights.',
      algoId: 'mezzotint',
      scale: 2,
      colorMode: 'palette',
      paletteId: 'riso-pink-teal',
      ditherParams: { bleed: 95, thresholdBias: -5, contrast: 1.15, jitter: 25 },
      pipelineOverride: {
        secondaryDither: { enabled: true, algoId: 'halftone-dot', scale: 4, opacity: 45, blendMode: 'multiply', lumaMask: 'highlights' },
        chromatic: { enabled: true, shiftX: 2, shiftY: 1, opacity: 60 },
        grain: { enabled: true, intensity: 22 }
      }
    },
    {
      id: 'preset-crt-cyber',
      name: 'PC-98 Neon CRT Broadcast',
      desc: 'Floyd-Steinberg color dither with phosphor halation bloom and aperture grille scanlines.',
      algoId: 'floyd-steinberg',
      scale: 2,
      colorMode: 'palette',
      paletteId: 'pc98-cyber',
      ditherParams: { bleed: 105, thresholdBias: 0, contrast: 1.15, serpentine: true },
      pipelineOverride: {
        halation: { enabled: true, intensity: 55, radius: 6 },
        crt: { enabled: true, scanlines: 45, maskType: 'aperture', curvature: 12, vignette: 28 },
        chromatic: { enabled: true, shiftX: 1, shiftY: 0, opacity: 50 }
      }
    },
    {
      id: 'preset-fm-wave',
      name: 'FM Synth Wave Modulation',
      desc: 'Continuous frequency-modulated horizontal carrier lines sculpted by luminance.',
      algoId: 'fm-wave',
      scale: 1,
      colorMode: 'palette',
      paletteId: 'acid-brutalist',
      ditherParams: { frequency: 36, angle: 12, contrast: 1.3, spread: 60 },
      pipelineOverride: {
        preGrade: { enabled: true, contrast: 20, sharpen: 20 }
      }
    },
    {
      id: 'preset-cmyk-comic',
      name: 'Golden Age Four-Color Comic Halftone',
      desc: 'Angled rotary halftone screen over newsprint offset inks.',
      algoId: 'cmyk-rosette',
      scale: 2,
      colorMode: 'palette',
      paletteId: 'cmyk-print',
      ditherParams: { frequency: 24, angle: 15, contrast: 1.2, spread: 65 },
      pipelineOverride: {
        edgeInk: { enabled: true, threshold: 38, opacity: 90, mode: 'dark' },
        grain: { enabled: true, intensity: 18 }
      }
    },
    {
      id: 'preset-riemersma',
      name: 'Riemersma Hilbert Curve Organic',
      desc: 'Space-filling fractal Hilbert curve traversal eliminates directional seams.',
      algoId: 'riemersma-hilbert',
      scale: 2,
      colorMode: 'palette',
      paletteId: 'woodcut-sepia',
      ditherParams: { bleed: 100, contrast: 1.2 },
      pipelineOverride: {}
    },
    {
      id: 'preset-ascii-bbs',
      name: '1993 Telnet ANSI BBS Art',
      desc: 'Sub-pixel bitmap character glyph density rendering in PICO-8 / EGA colors.',
      algoId: 'ascii-glyph',
      scale: 1,
      colorMode: 'palette',
      paletteId: 'pico-8',
      ditherParams: { contrast: 1.25, spread: 45 },
      pipelineOverride: {
        halation: { enabled: true, intensity: 40, radius: 4 }
      }
    },
    {
      id: 'preset-glitch-overdrive',
      name: 'Runaway Error Overdrive (165% Bleed)',
      desc: 'Pushes Sierra error diffusion past 100% stability for crystalline glitch cascades.',
      algoId: 'sierra-3',
      scale: 2,
      colorMode: 'palette',
      paletteId: 'cyberpunk-2099',
      ditherParams: { bleed: 162, serpentine: false, biasX: 0.45, contrast: 1.3 },
      pipelineOverride: {
        vhsGlitch: { enabled: true, tear: 35, chromaSmear: 40 },
        chromatic: { enabled: true, shiftX: 3, shiftY: 0, opacity: 75 }
      }
    },
    {
      id: 'preset-woodcut-relief',
      name: 'Albrecht Dürer Woodcut Engraving',
      desc: 'Directional carved relief lines with copperplate ink tones.',
      algoId: 'woodcut-relief',
      scale: 1,
      colorMode: 'palette',
      paletteId: 'woodcut-sepia',
      ditherParams: { frequency: 30, angle: 32, contrast: 1.35 },
      pipelineOverride: {
        edgeInk: { enabled: true, threshold: 40, opacity: 70, mode: 'dark' }
      }
    },
    {
      id: 'preset-virtual-boy',
      name: '1995 Nintendo Virtual Boy Stereoscopic',
      desc: '32-column LED mirror scanline array in crimson red.',
      algoId: 'led-matrix',
      scale: 2,
      colorMode: 'palette',
      paletteId: 'virtual-boy',
      ditherParams: { spread: 55, contrast: 1.25 },
      pipelineOverride: {
        halation: { enabled: true, intensity: 65, radius: 5 }
      }
    }
  ];

  DB.Palettes = {
    PALETTES,
    STUDIO_PRESETS,
    hexToRgb,
    rgbToHex,
    getLuma,
    rgbToLab,
    preparePaletteCache,
    findNearestColor,
    extractPaletteFromImageData
  };
})(window.DitherBoy);
