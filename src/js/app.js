/**
 * Photo to ASCII Art Studio // Main Controller (app.js)
 * Clean Still-Photo to ASCII Art Converter with PNG & JPEG Export.
 */
window.DitherBoy = window.DitherBoy || {};

(function (DB) {
  'use strict';

  function createInitialState() {
    const acidicPal = DB.Palettes.PALETTES.find((p) => p.id === 'acidic') || DB.Palettes.PALETTES[0];
    return {
      filename: 'No photo loaded',
      viewportMode: 'ascii', // 'ascii', 'raw', 'original'
      ascii: {
        styleId: 'edge-contour',
        customRamp: ' .:-=+*#%@',
        columns: 96,
        thresholdBias: 0,
        lineScale: 5, // 1..10 -> maps to 0.6..1.5 aspect
        ditherMode: 'floyd',
        edgeStrength: 45,
        contrast: 125,
        crtScanlines: 12,
        invert: false
      },
      color: {
        mode: 'palette', // 'palette', 'photo-rgb', 'monochrome'
        category: 'Abstract',
        paletteId: acidicPal.id,
        palette: [...acidicPal.colors],
        bgColor: '#0e0e11',
        fgColor: '#E5E4CE',
        lockedIndices: []
      }
    };
  }

  let state = createInitialState();
  const undoStack = [];
  const redoStack = [];

  function pushUndoState() {
    undoStack.push(JSON.stringify(state));
    if (undoStack.length > 30) undoStack.shift();
    redoStack.length = 0;
  }

  // =========================================================================
  // PHOTO SOURCE BUFFER
  // =========================================================================
  const sourceBufferCanvas = document.createElement('canvas');
  const sourceBufferCtx = sourceBufferCanvas.getContext('2d', { willReadFrequently: true });

  let customLoadedImage = null;
  let activeDemoPhotoId = null;

  let zoomLevel = 1.0;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;

  let renderPending = false;
  let lastAsciiResult = null;

  const emptyPhotoState = document.getElementById('emptyPhotoState');
  const outputCanvas = document.getElementById('outputCanvas');
  const sourceCompareCanvas = document.getElementById('sourceCompareCanvas');
  const sourceCompareCtx = sourceCompareCanvas.getContext('2d');
  const rawTextPreview = document.getElementById('rawTextPreview');
  const canvasMount = document.getElementById('canvasMount');
  const viewportArea = document.getElementById('viewportArea');

  let toastTimeout = null;
  function showToast(msg) {
    const el = document.getElementById('studioToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // =========================================================================
  // SOURCE PHOTO PREPARATION & ASCII RENDERING
  // =========================================================================
  function prepareSourcePhoto() {
    if (!customLoadedImage && !activeDemoPhotoId) return null;
    const targetW = 600;

    if (customLoadedImage) {
      const aspect = customLoadedImage.naturalHeight / (customLoadedImage.naturalWidth || 1);
      const targetH = Math.max(80, Math.round(targetW * aspect));
      if (sourceBufferCanvas.width !== targetW || sourceBufferCanvas.height !== targetH) {
        sourceBufferCanvas.width = targetW;
        sourceBufferCanvas.height = targetH;
      }
      sourceBufferCtx.drawImage(customLoadedImage, 0, 0, targetW, targetH);
    } else if (activeDemoPhotoId && DB.DemoPhotos) {
      const targetH = 750;
      if (sourceBufferCanvas.width !== targetW || sourceBufferCanvas.height !== targetH) {
        sourceBufferCanvas.width = targetW;
        sourceBufferCanvas.height = targetH;
      }
      DB.DemoPhotos.renderDemoPhoto(sourceBufferCtx, targetW, targetH, activeDemoPhotoId);
    }

    return sourceBufferCtx.getImageData(0, 0, sourceBufferCanvas.width, sourceBufferCanvas.height);
  }

  function loadDemoPhoto(photoId) {
    const photo = DB.DemoPhotos?.DEMO_PHOTOS.find((p) => p.id === photoId) || DB.DemoPhotos?.DEMO_PHOTOS[0];
    if (!photo) return;
    customLoadedImage = null;
    activeDemoPhotoId = photo.id;
    state.filename = photo.name;
    document.getElementById('activeFilenameLabel').textContent = photo.name;
    updateActiveDemoPhotoCards();
    requestRender();
    showToast(`Loaded Demo: ${photo.name}`);
  }

  function updateActiveDemoPhotoCards() {
    document.querySelectorAll('.demo-photo-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.id === activeDemoPhotoId);
    });
  }

  function renderDemoPhotosGrid() {
    const grid = document.getElementById('demoPhotosGrid');
    if (!grid || !DB.DemoPhotos) return;
    grid.innerHTML = '';

    DB.DemoPhotos.DEMO_PHOTOS.forEach((photo) => {
      const card = document.createElement('div');
      card.className = 'demo-photo-card' + (photo.id === activeDemoPhotoId ? ' active' : '');
      card.dataset.id = photo.id;
      card.title = `${photo.name} — ${photo.desc}`;
      card.innerHTML = `
        <canvas class="demo-photo-thumb" width="120" height="90"></canvas>
        <div class="demo-photo-meta">
          <span class="demo-photo-icon">${photo.icon}</span>
          <span class="demo-photo-name">${photo.title}</span>
        </div>
      `;
      const thumbCanvas = card.querySelector('.demo-photo-thumb');
      if (thumbCanvas) {
        const thumbCtx = thumbCanvas.getContext('2d');
        DB.DemoPhotos.renderDemoPhoto(thumbCtx, thumbCanvas.width, thumbCanvas.height, photo.id);
      }
      card.addEventListener('click', () => {
        loadDemoPhoto(photo.id);
      });
      grid.appendChild(card);
    });
  }

  function requestRender() {
    if (renderPending) return;
    renderPending = true;
    requestAnimationFrame(performRender);
  }

  function performRender() {
    renderPending = false;
    const srcImageData = prepareSourcePhoto();

    if (!srcImageData) {
      emptyPhotoState.style.display = 'flex';
      canvasMount.style.display = 'none';
      document.getElementById('statusReadyText').textContent = 'Waiting for photo...';
      return;
    }

    emptyPhotoState.style.display = 'none';
    canvasMount.style.display = 'flex';

    const effAsciiConfig = {
      ...state.ascii,
      lineScale: 0.6 + ((state.ascii.lineScale || 5) - 1) * 0.1
    };

    const asciiRes = DB.AsciiEngine.renderPhotoToAscii(
      srcImageData,
      effAsciiConfig,
      state.color,
      outputCanvas
    );
    lastAsciiResult = asciiRes;

    if (sourceCompareCanvas.width !== outputCanvas.width || sourceCompareCanvas.height !== outputCanvas.height) {
      sourceCompareCanvas.width = outputCanvas.width;
      sourceCompareCanvas.height = outputCanvas.height;
    }
    sourceCompareCtx.drawImage(sourceBufferCanvas, 0, 0, sourceCompareCanvas.width, sourceCompareCanvas.height);

    if (state.viewportMode === 'raw') {
      rawTextPreview.textContent = asciiRes.plainText;
      rawTextPreview.style.display = 'block';
      outputCanvas.style.display = 'none';
      sourceCompareCanvas.style.display = 'none';
    } else if (state.viewportMode === 'original') {
      rawTextPreview.style.display = 'none';
      outputCanvas.style.display = 'block';
      sourceCompareCanvas.style.display = 'block';
    } else {
      rawTextPreview.style.display = 'none';
      outputCanvas.style.display = 'block';
      sourceCompareCanvas.style.display = 'none';
    }

    document.getElementById('statusReadyText').textContent =
      `Ready // ${asciiRes.cols}×${asciiRes.rows} chars`;
  }

  // =========================================================================
  // UI SYNCHRONIZATION & INSPECTOR POPULATION
  // =========================================================================
  function populateAsciiStyleDropdowns() {
    const catVal = document.getElementById('asciiCategorySelect').value;
    const styleSel = document.getElementById('asciiStyleSelect');
    const filtered = DB.AsciiEngine.ASCII_STYLES.filter(
      (s) => catVal === 'all' || s.category === catVal
    );

    styleSel.innerHTML = '';
    filtered.forEach((st) => {
      const opt = document.createElement('option');
      opt.value = st.id;
      opt.textContent = st.name;
      if (st.id === state.ascii.styleId) opt.selected = true;
      styleSel.appendChild(opt);
    });

    if (filtered.length > 0 && !filtered.some((s) => s.id === state.ascii.styleId)) {
      state.ascii.styleId = filtered[0].id;
      styleSel.value = state.ascii.styleId;
    }

    const activeStyle = DB.AsciiEngine.ASCII_STYLES.find((s) => s.id === state.ascii.styleId);
    if (activeStyle && state.ascii.styleId !== 'custom-chars') {
      state.ascii.customRamp = activeStyle.chars;
      document.getElementById('customRampInput').value = activeStyle.chars;
    }
  }

  function populatePaletteDropdowns() {
    const catVal = document.getElementById('paletteCategorySelect').value;
    const palSel = document.getElementById('paletteSelect');
    const filtered = DB.Palettes.PALETTES.filter(
      (p) => catVal === 'all' || p.category === catVal
    );

    palSel.innerHTML = '';
    filtered.forEach((pal) => {
      const opt = document.createElement('option');
      opt.value = pal.id;
      opt.textContent = pal.name;
      if (pal.id === state.color.paletteId) opt.selected = true;
      palSel.appendChild(opt);
    });

    const previewEl = document.getElementById('paletteMiniPreview');
    const previewColors = state.color.palette.slice(0, 4);
    previewEl.innerHTML = previewColors.map((c) => `<span style="background:${c}"></span>`).join('');
  }

  function renderColorRowsList() {
    const listEl = document.getElementById('colorRowsList');
    listEl.innerHTML = '';

    state.color.palette.forEach((hex, idx) => {
      const isLocked = state.color.lockedIndices.includes(idx);
      const lockIconSvg = isLocked
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`;
      const deleteIconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

      const row = document.createElement('div');
      row.className = 'color-row-item';
      row.innerHTML = `
        <div class="color-swatch-box" style="background:${hex}">
          <input type="color" value="${hex}" title="Pick Color" />
        </div>
        <input type="text" class="color-hex-input" value="${hex}" maxlength="7" spellcheck="false" />
        <button class="color-row-btn ${isLocked ? 'locked' : ''}" data-act="lock" title="Lock Color">${lockIconSvg}</button>
        <button class="color-row-btn" data-act="delete" title="Delete Color">${deleteIconSvg}</button>
      `;

      const swatchBox = row.querySelector('.color-swatch-box');
      const colorPicker = row.querySelector('input[type="color"]');
      const hexInput = row.querySelector('.color-hex-input');

      colorPicker.addEventListener('input', (e) => {
        const newHex = e.target.value.toUpperCase();
        state.color.palette[idx] = newHex;
        swatchBox.style.background = newHex;
        hexInput.value = newHex;
        populatePaletteDropdowns();
        requestRender();
      });

      hexInput.addEventListener('change', (e) => {
        let val = e.target.value.trim().toUpperCase();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-F]{6}$/.test(val)) {
          state.color.palette[idx] = val;
          swatchBox.style.background = val;
          colorPicker.value = val;
          populatePaletteDropdowns();
          requestRender();
        } else {
          hexInput.value = state.color.palette[idx];
        }
      });

      row.querySelector('[data-act="lock"]').addEventListener('click', () => {
        const pos = state.color.lockedIndices.indexOf(idx);
        if (pos >= 0) state.color.lockedIndices.splice(pos, 1);
        else state.color.lockedIndices.push(idx);
        renderColorRowsList();
      });

      row.querySelector('[data-act="delete"]').addEventListener('click', () => {
        if (state.color.palette.length <= 2) {
          showToast('Minimum 2 colors required');
          return;
        }
        pushUndoState();
        state.color.palette.splice(idx, 1);
        renderColorRowsList();
        populatePaletteDropdowns();
        requestRender();
      });

      listEl.appendChild(row);
    });
  }

  function syncUIWithState() {
    populateAsciiStyleDropdowns();
    populatePaletteDropdowns();
    renderColorRowsList();

    const bindPair = (sliderId, numId, val) => {
      const s = document.getElementById(sliderId);
      const n = document.getElementById(numId);
      if (s) s.value = val;
      if (n) n.value = val;
    };

    bindPair('sliderColumns', 'numColumns', state.ascii.columns);
    bindPair('sliderThreshold', 'numThreshold', state.ascii.thresholdBias);
    bindPair('sliderLineScale', 'numLineScale', state.ascii.lineScale);
    bindPair('sliderEdgeStrength', 'numEdgeStrength', state.ascii.edgeStrength);
    bindPair('sliderContrast', 'numContrast', state.ascii.contrast);
    bindPair('sliderScanlines', 'numScanlines', state.ascii.crtScanlines);

    document.getElementById('customRampInput').value = state.ascii.customRamp;
    document.getElementById('asciiDitherModeSelect').value = state.ascii.ditherMode || 'floyd';
    document.getElementById('chkInvertAscii').checked = !!state.ascii.invert;
    document.getElementById('asciiColorModeSelect').value = state.color.mode || 'palette';
    document.getElementById('activeFilenameLabel').textContent = state.filename || 'No photo loaded';
  }

  // =========================================================================
  // COPY & EXPORT IMAGE (PNG / JPEG) HELPERS
  // =========================================================================
  async function copyAsciiToClipboard() {
    if (!lastAsciiResult) {
      showToast('Import a photo first');
      return;
    }
    try {
      await navigator.clipboard.writeText(lastAsciiResult.plainText);
      showToast('Copied ASCII Art Text to Clipboard!');
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = lastAsciiResult.plainText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Copied ASCII Art Text to Clipboard!');
    }
  }

  function exportImageFile(format = 'png') {
    if (!customLoadedImage && !activeDemoPhotoId) {
      showToast('Import a photo first');
      return;
    }
    const isJpeg = format === 'jpeg' || format === 'jpg';
    const mime = isJpeg ? 'image/jpeg' : 'image/png';
    const ext = isJpeg ? 'jpg' : 'png';
    const baseName = (state.filename || 'photo').replace(/\.[^.]+$/, '');

    outputCanvas.toBlob(
      (blob) => {
        if (blob) {
          DB.Exporters.triggerDownload(blob, `AsciiYart-${baseName}.${ext}`);
          showToast(`Exported AsciiYart-${baseName}.${ext}!`);
        }
      },
      mime,
      0.95
    );
  }

  // =========================================================================
  // EVENT BINDINGS
  // =========================================================================
  function bindEvents() {
    const asciiCatSel = document.getElementById('asciiCategorySelect');
    const asciiStyleSel = document.getElementById('asciiStyleSelect');

    asciiCatSel.addEventListener('change', () => {
      populateAsciiStyleDropdowns();
      requestRender();
    });

    asciiStyleSel.addEventListener('change', (e) => {
      pushUndoState();
      state.ascii.styleId = e.target.value;
      const st = DB.AsciiEngine.ASCII_STYLES.find((s) => s.id === state.ascii.styleId);
      if (st) {
        state.ascii.customRamp = st.chars;
        document.getElementById('customRampInput').value = st.chars;
      }
      requestRender();
    });

    document.getElementById('customRampInput').addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.length >= 2) {
        state.ascii.customRamp = val;
        requestRender();
      }
    });

    const stepSelect = (selectEl, dir) => {
      const len = selectEl.options.length;
      if (len === 0) return;
      selectEl.selectedIndex = (selectEl.selectedIndex + dir + len) % len;
      selectEl.dispatchEvent(new Event('change'));
    };

    document.getElementById('prevAsciiCatBtn').addEventListener('click', () => stepSelect(asciiCatSel, -1));
    document.getElementById('nextAsciiCatBtn').addEventListener('click', () => stepSelect(asciiCatSel, 1));
    document.getElementById('prevAsciiStyleBtn').addEventListener('click', () => stepSelect(asciiStyleSel, -1));
    document.getElementById('nextAsciiStyleBtn').addEventListener('click', () => stepSelect(asciiStyleSel, 1));

    // Palette Category & Palette Dropdowns
    const palCatSel = document.getElementById('paletteCategorySelect');
    const palSel = document.getElementById('paletteSelect');

    palCatSel.addEventListener('change', () => {
      populatePaletteDropdowns();
      const found = DB.Palettes.PALETTES.find((p) => p.id === palSel.value);
      if (found) {
        state.color.paletteId = found.id;
        state.color.palette = [...found.colors];
        populatePaletteDropdowns();
        renderColorRowsList();
        requestRender();
      }
    });

    palSel.addEventListener('change', (e) => {
      const found = DB.Palettes.PALETTES.find((p) => p.id === e.target.value);
      if (found) {
        pushUndoState();
        state.color.paletteId = found.id;
        state.color.palette = [...found.colors];
        populatePaletteDropdowns();
        renderColorRowsList();
        requestRender();
      }
    });

    document.getElementById('prevPalCatBtn').addEventListener('click', () => stepSelect(palCatSel, -1));
    document.getElementById('nextPalCatBtn').addEventListener('click', () => stepSelect(palCatSel, 1));
    document.getElementById('prevPaletteBtn').addEventListener('click', () => stepSelect(palSel, -1));
    document.getElementById('nextPaletteBtn').addEventListener('click', () => stepSelect(palSel, 1));

    document.getElementById('asciiColorModeSelect').addEventListener('change', (e) => {
      state.color.mode = e.target.value;
      requestRender();
    });

    // Slider + Number Box Pairs
    const bindSliderNum = (sliderId, numId, onUpdate) => {
      const s = document.getElementById(sliderId);
      const n = document.getElementById(numId);
      s.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        n.value = v;
        onUpdate(v);
        requestRender();
      });
      n.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value) || 0;
        s.value = v;
        onUpdate(v);
        requestRender();
      });
    };

    bindSliderNum('sliderColumns', 'numColumns', (v) => (state.ascii.columns = v));
    bindSliderNum('sliderThreshold', 'numThreshold', (v) => (state.ascii.thresholdBias = v));
    bindSliderNum('sliderLineScale', 'numLineScale', (v) => (state.ascii.lineScale = v));
    bindSliderNum('sliderEdgeStrength', 'numEdgeStrength', (v) => (state.ascii.edgeStrength = v));
    bindSliderNum('sliderContrast', 'numContrast', (v) => (state.ascii.contrast = v));
    bindSliderNum('sliderScanlines', 'numScanlines', (v) => (state.ascii.crtScanlines = v));

    document.getElementById('asciiDitherModeSelect').addEventListener('change', (e) => {
      state.ascii.ditherMode = e.target.value;
      requestRender();
    });
    document.getElementById('chkInvertAscii').addEventListener('change', (e) => {
      state.ascii.invert = e.target.checked;
      requestRender();
    });

    // Toggle More ASCII Controls
    const moreBox = document.getElementById('moreAsciiControls');
    const moreBtn = document.getElementById('toggleMoreAsciiBtn');
    moreBtn.addEventListener('click', () => {
      const open = moreBox.style.display === 'flex';
      moreBox.style.display = open ? 'none' : 'flex';
      moreBtn.textContent = open ? '+ Advanced ASCII & Edge Controls...' : '− Hide Advanced Controls';
    });

    // Reset ASCII Settings
    document.getElementById('resetAsciiSettingsBtn').addEventListener('click', () => {
      pushUndoState();
      state.ascii.columns = 96;
      state.ascii.thresholdBias = 0;
      state.ascii.lineScale = 5;
      state.ascii.edgeStrength = 45;
      state.ascii.contrast = 125;
      syncUIWithState();
      requestRender();
      showToast('ASCII settings reset');
    });

    // Add Color Row & K-Means Extract Palette from Photo
    document.getElementById('addColorRowBtn').addEventListener('click', () => {
      if (state.color.palette.length >= 24) return;
      pushUndoState();
      const randHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
      state.color.palette.push(randHex);
      renderColorRowsList();
      populatePaletteDropdowns();
      requestRender();
    });

    const runExtractPalette = () => {
      const srcImg = prepareSourcePhoto();
      if (!srcImg) {
        showToast('Import a photo first');
        return;
      }
      pushUndoState();
      const extracted = DB.Palettes.extractPaletteFromImageData(srcImg, 8);
      state.color.palette = extracted;
      state.color.mode = 'palette';
      syncUIWithState();
      requestRender();
      showToast('Extracted 8-color palette from photo!');
    };
    document.getElementById('extractKMeansBtn').addEventListener('click', runExtractPalette);
    document.getElementById('extractPaletteQuickBtn').addEventListener('click', runExtractPalette);
    document.getElementById('menuExtractPalette').addEventListener('click', runExtractPalette);

    const updateCollapseIcon = () => {
      const sb = document.getElementById('inspectorSidebar');
      const isCollapsed = sb.classList.contains('collapsed');
      document.getElementById('collapseSidebarBtn').innerHTML = isCollapsed
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    };

    document.getElementById('collapseSidebarBtn').addEventListener('click', () => {
      const sb = document.getElementById('inspectorSidebar');
      sb.classList.toggle('collapsed');
      updateCollapseIcon();
    });

    // Rail Pane Switching (Settings Pane vs Demo Photos Selection Pane)
    document.querySelectorAll('.rail-btn[data-pane]').forEach((railBtn) => {
      railBtn.addEventListener('click', () => {
        const targetPaneId = railBtn.dataset.pane;
        document.querySelectorAll('.rail-btn[data-pane]').forEach((b) => b.classList.remove('active'));
        railBtn.classList.add('active');

        document.querySelectorAll('.inspector-pane').forEach((p) => {
          p.classList.toggle('active', p.id === targetPaneId);
        });

        const sb = document.getElementById('inspectorSidebar');
        if (sb.classList.contains('collapsed')) {
          sb.classList.remove('collapsed');
          updateCollapseIcon();
        }
      });
    });

    // Import Photo (File Dialog, Empty Dropzone Click, Drag & Drop, Ctrl+V Paste)
    const mediaInput = document.getElementById('mediaFileInput');
    document.getElementById('openMediaBtn').addEventListener('click', () => mediaInput.click());
    document.getElementById('menuOpenMedia').addEventListener('click', () => mediaInput.click());
    emptyPhotoState.addEventListener('click', () => mediaInput.click());

    mediaInput.addEventListener('change', (e) => {
      if (e.target.files?.[0]) handleLoadedPhoto(e.target.files[0]);
    });

    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files?.[0]) handleLoadedPhoto(e.dataTransfer.files[0]);
    });
    window.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) handleLoadedPhoto(file);
          break;
        }
      }
    });

    // Copy & Export PNG / JPEG Buttons
    document.getElementById('copyAsciiQuickBtn').addEventListener('click', copyAsciiToClipboard);
    document.getElementById('menuCopyAscii').addEventListener('click', copyAsciiToClipboard);

    document.getElementById('mainExportBtn').addEventListener('click', () => {
      const fmt = document.getElementById('exportFormatSelect').value;
      exportImageFile(fmt);
    });
    document.getElementById('menuExportPng').addEventListener('click', () => exportImageFile('png'));
    document.getElementById('menuExportJpg').addEventListener('click', () => exportImageFile('jpeg'));

    // Footer Zoom & Viewport Mode Pills
    const setZoom = (z) => {
      zoomLevel = Math.max(0.25, Math.min(8, z));
      document.getElementById('zoomReadout').textContent = `${Math.round(zoomLevel * 100)}%`;
      canvasMount.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    };
    document.getElementById('zoomInBtn').addEventListener('click', () => setZoom(zoomLevel * 1.2));
    document.getElementById('zoomOutBtn').addEventListener('click', () => setZoom(zoomLevel / 1.2));
    document.getElementById('zoomResetBtn').addEventListener('click', () => {
      panX = 0; panY = 0; setZoom(1.0);
    });

    viewportArea.addEventListener('wheel', (e) => {
      if (state.viewportMode === 'raw' || (!customLoadedImage && !activeDemoPhotoId)) return;
      e.preventDefault();
      setZoom(zoomLevel * (e.deltaY < 0 ? 1.1 : 0.9));
    }, { passive: false });

    viewportArea.addEventListener('mousedown', (e) => {
      if (state.viewportMode === 'raw' || (!customLoadedImage && !activeDemoPhotoId)) return;
      isPanning = true;
      panStartX = e.clientX - panX;
      panStartY = e.clientY - panY;
    });
    window.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      panX = e.clientX - panStartX;
      panY = e.clientY - panStartY;
      canvasMount.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    });
    window.addEventListener('mouseup', () => { isPanning = false; });

    document.querySelectorAll('#viewportModeGroup .footer-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#viewportModeGroup .footer-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        state.viewportMode = pill.dataset.vmode;
        requestRender();
      });
    });

    // Menu Bar Actions
    const doUndo = () => {
      if (undoStack.length === 0) return;
      redoStack.push(JSON.stringify(state));
      state = JSON.parse(undoStack.pop());
      syncUIWithState();
      requestRender();
      showToast('Undo');
    };
    const doRedo = () => {
      if (redoStack.length === 0) return;
      undoStack.push(JSON.stringify(state));
      state = JSON.parse(redoStack.pop());
      syncUIWithState();
      requestRender();
      showToast('Redo');
    };

    document.getElementById('undoFooterBtn').addEventListener('click', doUndo);
    document.getElementById('menuUndo').addEventListener('click', doUndo);
    document.getElementById('menuRedo').addEventListener('click', doRedo);

    document.getElementById('menuRandomize').addEventListener('click', () => {
      pushUndoState();
      const styles = DB.AsciiEngine.ASCII_STYLES;
      const pals = DB.Palettes.PALETTES;
      state.ascii.styleId = styles[Math.floor(Math.random() * styles.length)].id;
      const randPal = pals[Math.floor(Math.random() * pals.length)];
      state.color.paletteId = randPal.id;
      state.color.palette = [...randPal.colors];
      document.getElementById('asciiCategorySelect').value = 'all';
      document.getElementById('paletteCategorySelect').value = 'all';
      syncUIWithState();
      requestRender();
      showToast('Randomized ASCII Style & Palette');
    });

    document.getElementById('menuResetAll').addEventListener('click', () => {
      pushUndoState();
      const prevFilename = state.filename;
      state = createInitialState();
      state.filename = prevFilename;
      syncUIWithState();
      requestRender();
      showToast('Reset Settings');
    });

    document.getElementById('menuToggleRawText').addEventListener('click', () => {
      state.viewportMode = state.viewportMode === 'raw' ? 'ascii' : 'raw';
      requestRender();
    });
    document.getElementById('menuToggleOriginal').addEventListener('click', () => {
      state.viewportMode = state.viewportMode === 'original' ? 'ascii' : 'original';
      requestRender();
    });
    document.getElementById('menuZoomIn').addEventListener('click', () => setZoom(zoomLevel * 1.2));
    document.getElementById('menuZoomOut').addEventListener('click', () => setZoom(zoomLevel / 1.2));
    document.getElementById('menuZoomReset').addEventListener('click', () => { panX = 0; panY = 0; setZoom(1.0); });
    document.getElementById('menuToggleSidebar').addEventListener('click', () => {
      document.getElementById('inspectorSidebar').classList.toggle('collapsed');
    });
    document.getElementById('menuShowHelpToast').addEventListener('click', () => {
      showToast('Import any photo -> Choose ASCII Style -> Export PNG or JPEG!');
    });

    // Help Menu Demo Photo actions
    const demoMenuMap = {
      menuLoadApollo: 'apollo-bust',
      menuLoadCat: 'studio-cat',
      menuLoadNoir: 'noir-portrait',
      menuLoadCity: 'neon-city',
      menuLoadSakura: 'cherry-blossom',
      menuLoadAstro: 'astronaut'
    };
    for (const [btnId, photoId] of Object.entries(demoMenuMap)) {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('click', () => loadDemoPhoto(photoId));
      }
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        doUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        doRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        mediaInput.click();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        exportImageFile('png');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        exportImageFile('jpeg');
      } else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
        document.getElementById('menuRandomize').click();
      }
    });
  }

  function handleLoadedPhoto(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (PNG, JPEG, WebP)');
      return;
    }
    activeDemoPhotoId = null;
    updateActiveDemoPhotoCards();
    state.filename = file.name;
    document.getElementById('activeFilenameLabel').textContent = file.name;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        customLoadedImage = img;
        requestRender();
        showToast(`Loaded Photo: ${file.name}`);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function init() {
    if (window.location.search.includes('desktop=1')) {
      const tb = document.querySelector('.window-titlebar');
      if (tb) tb.style.display = 'none';
    }
    renderDemoPhotosGrid();
    bindEvents();
    syncUIWithState();
    requestRender();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window.DitherBoy);
