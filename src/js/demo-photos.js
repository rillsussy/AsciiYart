/**
 * AsciiYart // Demo Photos Library (demo-photos.js)
 * High-detail photographic demo scenes designed for striking ASCII art rendering.
 */
window.DitherBoy = window.DitherBoy || {};

(function (DB) {
  'use strict';

  const DEMO_PHOTOS = [
    {
      id: 'apollo-bust',
      name: 'apollo-bust.jpg',
      title: 'Marble Statue',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0V7a4 4 0 0 0-4-4z"></path><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>`,
      desc: 'Chiaroscuro studio lit classical marble sculpture with smooth tonal gradients.'
    },
    {
      id: 'studio-cat',
      name: 'studio-cat.jpg',
      title: 'Feline Portrait',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3.1-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z"></path><path d="M8 14v.5"></path><path d="M16 14v.5"></path><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"></path></svg>`,
      desc: 'Close-up studio cat portrait with piercing eyes, whiskers, and textured fur.'
    },
    {
      id: 'noir-portrait',
      name: 'noir-portrait.jpg',
      title: 'Film Noir',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="14.31" y1="8" x2="20.05" y2="17.94"></line><line x1="9.69" y1="8" x2="21.17" y2="8"></line><line x1="7.38" y1="12" x2="13.12" y2="2.06"></line><line x1="9.69" y1="16" x2="3.95" y2="6.06"></line><line x1="14.31" y1="16" x2="2.83" y2="16"></line><line x1="16.62" y1="12" x2="10.88" y2="21.94"></line></svg>`,
      desc: 'High-contrast cinematic studio portrait with dramatic key and rim lighting.'
    },
    {
      id: 'neon-city',
      name: 'neon-city.jpg',
      title: 'Cyberpunk Car',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>`,
      desc: 'Neon night cityscape with angular sports car and reflective wet tarmac.'
    },
    {
      id: 'cherry-blossom',
      name: 'cherry-blossom.jpg',
      title: 'Sakura & Fuji',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"></path><path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19"></path></svg>`,
      desc: 'Mount Fuji silhouette framed by delicate cherry blossom branches.'
    },
    {
      id: 'astronaut',
      name: 'astronaut.jpg',
      title: 'Space Explorer',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>`,
      desc: 'Detailed space helmet reflecting the blue Earth against a dark cosmic void.'
    }
  ];

  // Render photographic demo scene onto canvas context
  function renderDemoPhoto(ctx, width, height, photoId) {
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    const tau = Math.PI * 2;

    if (photoId === 'apollo-bust') {
      // 1. Classical Marble Sculpture
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, '#22201d');
      bg.addColorStop(0.55, '#121110');
      bg.addColorStop(1, '#060605');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.46;
      const S = Math.min(width, height) * 0.38;

      // Shoulder Drapery
      const drape = ctx.createLinearGradient(cx - S * 1.1, cy + S * 0.5, cx + S * 1.1, height);
      drape.addColorStop(0, '#f2ece2');
      drape.addColorStop(0.35, '#9e9587');
      drape.addColorStop(0.7, '#3b362f');
      drape.addColorStop(1, '#11100e');
      ctx.fillStyle = drape;
      ctx.beginPath();
      ctx.moveTo(cx - S * 1.05, height);
      ctx.quadraticCurveTo(cx - S * 0.9, cy + S * 0.45, cx - S * 0.35, cy + S * 0.45);
      ctx.lineTo(cx + S * 0.35, cy + S * 0.45);
      ctx.quadraticCurveTo(cx + S * 0.9, cy + S * 0.45, cx + S * 1.05, height);
      ctx.closePath();
      ctx.fill();

      // Neck Cylinder
      const neck = ctx.createLinearGradient(cx - S * 0.3, cy + S * 0.2, cx + S * 0.35, cy + S * 0.2);
      neck.addColorStop(0, '#f0eae0');
      neck.addColorStop(0.5, '#9a9082');
      neck.addColorStop(1, '#201d19');
      ctx.fillStyle = neck;
      ctx.fillRect(cx - S * 0.24, cy + S * 0.16, S * 0.48, S * 0.4);

      // Head Ovoid
      const headGrad = ctx.createRadialGradient(cx - S * 0.25, cy - S * 0.35, S * 0.08, cx, cy - S * 0.12, S * 0.82);
      headGrad.addColorStop(0, '#ffffff');
      headGrad.addColorStop(0.25, '#ede5da');
      headGrad.addColorStop(0.55, '#9c9182');
      headGrad.addColorStop(0.85, '#423b33');
      headGrad.addColorStop(1, '#141210');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy - S * 0.15, S * 0.52, S * 0.7, 0, 0, tau);
      ctx.fill();

      // Nose & Brow Planes
      const nose = ctx.createLinearGradient(cx - S * 0.12, cy - S * 0.2, cx + S * 0.15, cy - S * 0.2);
      nose.addColorStop(0, '#ffffff');
      nose.addColorStop(0.5, '#d0c6b8');
      nose.addColorStop(1, '#342f28');
      ctx.fillStyle = nose;
      ctx.beginPath();
      ctx.moveTo(cx - S * 0.03, cy - S * 0.4);
      ctx.lineTo(cx + S * 0.1, cy + S * 0.03);
      ctx.lineTo(cx - S * 0.02, cy + S * 0.06);
      ctx.lineTo(cx - S * 0.1, cy);
      ctx.closePath();
      ctx.fill();

      // Sculpted Marble Hair Curls
      const curls = [
        [-0.45, -0.52, 0.2], [-0.22, -0.72, 0.22], [0.08, -0.76, 0.24],
        [0.34, -0.68, 0.22], [0.5, -0.46, 0.19], [-0.52, -0.25, 0.18], [0.52, -0.22, 0.18]
      ];
      curls.forEach(([ox, oy, rad]) => {
        const ccx = cx + ox * S;
        const ccy = cy + oy * S;
        const cr = rad * S;
        const cg = ctx.createRadialGradient(ccx - cr * 0.35, ccy - cr * 0.35, cr * 0.08, ccx, ccy, cr);
        cg.addColorStop(0, '#fdfbf7');
        cg.addColorStop(0.5, '#a49888');
        cg.addColorStop(1, '#24201b');
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(ccx, ccy, cr, 0, tau);
        ctx.fill();
      });
    }

    else if (photoId === 'studio-cat') {
      // 2. High-Detail Studio Cat Portrait
      const bg = ctx.createRadialGradient(width * 0.5, height * 0.5, 30, width * 0.5, height * 0.5, width * 0.65);
      bg.addColorStop(0, '#1c1a24');
      bg.addColorStop(1, '#08070b');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.52;
      const S = Math.min(width, height) * 0.36;

      // Fur body / chest
      const chestGrad = ctx.createLinearGradient(cx, cy, cx, height);
      chestGrad.addColorStop(0, '#f2ece4');
      chestGrad.addColorStop(0.4, '#a29486');
      chestGrad.addColorStop(1, '#1b171f');
      ctx.fillStyle = chestGrad;
      ctx.beginPath();
      ctx.ellipse(cx, height, S * 0.95, S * 0.9, 0, 0, tau);
      ctx.fill();

      // Cat Head
      const headGrad = ctx.createRadialGradient(cx, cy - S * 0.1, S * 0.1, cx, cy, S * 0.9);
      headGrad.addColorStop(0, '#e8ded2');
      headGrad.addColorStop(0.45, '#968474');
      headGrad.addColorStop(0.85, '#2f2723');
      headGrad.addColorStop(1, '#131012');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, S * 0.82, S * 0.68, 0, 0, tau);
      ctx.fill();

      // Ears (Left and Right)
      [-1, 1].forEach((dir) => {
        const ex = cx + dir * S * 0.55;
        const ey = cy - S * 0.58;
        const earGrad = ctx.createLinearGradient(ex, ey - S * 0.5, ex - dir * S * 0.3, ey + S * 0.3);
        earGrad.addColorStop(0, '#2b231f');
        earGrad.addColorStop(0.5, '#c89d90');
        earGrad.addColorStop(1, '#171415');
        ctx.fillStyle = earGrad;
        ctx.beginPath();
        ctx.moveTo(cx + dir * S * 0.2, cy - S * 0.45);
        ctx.lineTo(ex + dir * S * 0.05, ey - S * 0.42);
        ctx.lineTo(cx + dir * S * 0.78, cy - S * 0.2);
        ctx.closePath();
        ctx.fill();

        // Inner ear pinkish fur tufts
        ctx.fillStyle = '#fcebe6';
        ctx.beginPath();
        ctx.moveTo(cx + dir * S * 0.32, cy - S * 0.38);
        ctx.lineTo(ex, ey - S * 0.22);
        ctx.lineTo(cx + dir * S * 0.65, cy - S * 0.22);
        ctx.closePath();
        ctx.fill();
      });

      // Piercing Cat Eyes with Glowing Irises
      [-1, 1].forEach((dir) => {
        const eyeX = cx + dir * S * 0.32;
        const eyeY = cy - S * 0.08;
        const eyeW = S * 0.22;
        const eyeH = S * 0.16;

        // Eye socket shadow
        ctx.fillStyle = '#110e11';
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, eyeW * 1.15, eyeH * 1.25, dir * 0.08, 0, tau);
        ctx.fill();

        // Glowing Emerald Iris
        const irisGrad = ctx.createRadialGradient(eyeX, eyeY, 3, eyeX, eyeY, eyeW * 0.9);
        irisGrad.addColorStop(0, '#f9ff85');
        irisGrad.addColorStop(0.4, '#76e053');
        irisGrad.addColorStop(0.85, '#208535');
        irisGrad.addColorStop(1, '#0e4218');
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, eyeW, eyeH, dir * 0.08, 0, tau);
        ctx.fill();

        // Vertical Slit Pupil
        ctx.fillStyle = '#050505';
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, eyeW * 0.22, eyeH * 0.88, 0, 0, tau);
        ctx.fill();

        // Specular Catchlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeX - eyeW * 0.25, eyeY - eyeH * 0.28, eyeW * 0.16, 0, tau);
        ctx.fill();
      });

      // Muzzle & Pink Nose
      const muzzleGrad = ctx.createRadialGradient(cx, cy + S * 0.22, S * 0.05, cx, cy + S * 0.25, S * 0.4);
      muzzleGrad.addColorStop(0, '#fcf7f0');
      muzzleGrad.addColorStop(0.65, '#ded1be');
      muzzleGrad.addColorStop(1, '#695a4f');
      ctx.fillStyle = muzzleGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + S * 0.22, S * 0.36, S * 0.24, 0, 0, tau);
      ctx.fill();

      // Nose leather
      ctx.fillStyle = '#d47f7d';
      ctx.beginPath();
      ctx.moveTo(cx - S * 0.08, cy + S * 0.15);
      ctx.lineTo(cx + S * 0.08, cy + S * 0.15);
      ctx.lineTo(cx, cy + S * 0.23);
      ctx.closePath();
      ctx.fill();

      // Whiskers (Crisp white strokes that create sharp ASCII lines)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.6;
      [-1, 1].forEach((dir) => {
        for (let w = -2; w <= 2; w++) {
          ctx.beginPath();
          ctx.moveTo(cx + dir * S * 0.18, cy + S * 0.24 + w * 4);
          ctx.quadraticCurveTo(
            cx + dir * S * 0.6,
            cy + S * 0.22 + w * 12,
            cx + dir * S * 1.15,
            cy + S * 0.28 + w * 22
          );
          ctx.stroke();
        }
      });
    }

    else if (photoId === 'noir-portrait') {
      // 3. Film Noir Dramatic Studio Portrait
      ctx.fillStyle = '#050507';
      ctx.fillRect(0, 0, width, height);

      const cx = width * 0.52;
      const cy = height * 0.45;
      const S = Math.min(width, height) * 0.38;

      // Deep dark silhouette coat
      ctx.fillStyle = '#0f1016';
      ctx.beginPath();
      ctx.moveTo(cx - S * 0.9, height);
      ctx.lineTo(cx - S * 0.2, cy + S * 0.4);
      ctx.lineTo(cx + S * 0.2, cy + S * 0.4);
      ctx.lineTo(cx + S * 0.9, height);
      ctx.closePath();
      ctx.fill();

      // Sharp white collar notch
      ctx.fillStyle = '#dcdde3';
      ctx.beginPath();
      ctx.moveTo(cx - S * 0.12, cy + S * 0.38);
      ctx.lineTo(cx, cy + S * 0.6);
      ctx.lineTo(cx + S * 0.12, cy + S * 0.38);
      ctx.closePath();
      ctx.fill();

      // Face Half-Lit in Hard Slit Shadow
      const faceGrad = ctx.createLinearGradient(cx - S * 0.5, cy, cx + S * 0.5, cy);
      faceGrad.addColorStop(0, '#060608');
      faceGrad.addColorStop(0.35, '#222026');
      faceGrad.addColorStop(0.65, '#b49f92');
      faceGrad.addColorStop(0.92, '#f6eade');
      faceGrad.addColorStop(1, '#ffffff');
      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy - S * 0.1, S * 0.48, S * 0.65, 0.05, 0, tau);
      ctx.fill();

      // Hard Shadow across left half of face
      ctx.fillStyle = '#0a0a0e';
      ctx.beginPath();
      ctx.moveTo(cx - S * 0.5, cy - S * 0.7);
      ctx.lineTo(cx + S * 0.04, cy - S * 0.7);
      ctx.lineTo(cx - S * 0.02, cy + S * 0.5);
      ctx.lineTo(cx - S * 0.5, cy + S * 0.5);
      ctx.closePath();
      ctx.fill();

      // Sharp Right Eye in Light
      const rex = cx + S * 0.22;
      const rey = cy - S * 0.12;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(rex, rey, S * 0.11, S * 0.06, -0.05, 0, tau);
      ctx.fill();
      ctx.fillStyle = '#100e12';
      ctx.beginPath();
      ctx.arc(rex + 1, rey, S * 0.05, 0, tau);
      ctx.fill();

      // High Cheekbone & Lip Highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx + S * 0.32, cy - S * 0.02, S * 0.06, S * 0.18, 0.2, 0, tau);
      ctx.fill();

      // Fedora / Dark Hat Rim
      const hatGrad = ctx.createLinearGradient(cx - S * 0.8, cy - S * 0.5, cx + S * 0.8, cy - S * 0.5);
      hatGrad.addColorStop(0, '#0c0d12');
      hatGrad.addColorStop(0.7, '#232530');
      hatGrad.addColorStop(0.95, '#e0e2ee');
      ctx.fillStyle = hatGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy - S * 0.45, S * 0.85, S * 0.18, -0.08, 0, tau);
      ctx.fill();
    }

    else if (photoId === 'neon-city') {
      // 4. Cyberpunk Skyline & Sports Car
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.6);
      skyGrad.addColorStop(0, '#04030a');
      skyGrad.addColorStop(0.5, '#160924');
      skyGrad.addColorStop(0.85, '#4b154a');
      skyGrad.addColorStop(1, '#8c1f60');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height * 0.6);

      // Skyscrapers
      const bldCount = 14;
      for (let i = 0; i < bldCount; i++) {
        const bx = (i / bldCount) * width;
        const bw = width / bldCount + 4;
        const bh = height * 0.25 + Math.sin(i * 1.8) * height * 0.18;
        const by = height * 0.6 - bh;
        ctx.fillStyle = i % 2 === 0 ? '#0b0817' : '#140c26';
        ctx.fillRect(bx, by, bw, bh);

        // Window glow dots
        ctx.fillStyle = (i % 3 === 0) ? '#ff4d94' : '#00e5ff';
        for (let wy = by + 12; wy < height * 0.58; wy += 14) {
          if ((i + wy) % 5 !== 0) {
            ctx.fillRect(bx + 4, wy, 3, 5);
            ctx.fillRect(bx + bw - 7, wy, 3, 5);
          }
        }
      }

      // Wet Reflective Street
      const streetGrad = ctx.createLinearGradient(0, height * 0.6, 0, height);
      streetGrad.addColorStop(0, '#100a1c');
      streetGrad.addColorStop(0.4, '#200b2e');
      streetGrad.addColorStop(1, '#08050e');
      ctx.fillStyle = streetGrad;
      ctx.fillRect(0, height * 0.6, width, height * 0.4);

      // Neon road reflections
      for (let r = 0; r < 8; r++) {
        const rx = width * (0.15 + r * 0.1);
        const col = r % 2 === 0 ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255, 77, 148, 0.25)';
        ctx.fillStyle = col;
        ctx.fillRect(rx - 8, height * 0.6, 16, height * 0.4);
      }

      // Sleek Angular Sports Car in Foreground
      const carY = height * 0.72;
      const cx = width * 0.5;
      const cw = width * 0.72;
      const ch = height * 0.18;

      // Car body silhouette & neon highlights
      const carGrad = ctx.createLinearGradient(cx - cw * 0.5, carY, cx + cw * 0.5, carY);
      carGrad.addColorStop(0, '#121320');
      carGrad.addColorStop(0.5, '#282b3d');
      carGrad.addColorStop(1, '#151724');
      ctx.fillStyle = carGrad;
      ctx.beginPath();
      ctx.moveTo(cx - cw * 0.45, carY + ch * 0.5);
      ctx.lineTo(cx - cw * 0.38, carY);
      ctx.lineTo(cx - cw * 0.18, carY - ch * 0.35);
      ctx.lineTo(cx + cw * 0.18, carY - ch * 0.35);
      ctx.lineTo(cx + cw * 0.38, carY);
      ctx.lineTo(cx + cw * 0.45, carY + ch * 0.5);
      ctx.closePath();
      ctx.fill();

      // Neon Tail-light / Headlight Bar
      ctx.fillStyle = '#ff1e56';
      ctx.fillRect(cx - cw * 0.4, carY + ch * 0.08, cw * 0.8, 6);
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(cx - cw * 0.36, carY + ch * 0.2, cw * 0.72, 3);
    }

    else if (photoId === 'cherry-blossom') {
      // 5. Mount Fuji & Sakura
      const sky = ctx.createLinearGradient(0, 0, 0, height * 0.7);
      sky.addColorStop(0, '#3a506b');
      sky.addColorStop(0.5, '#8ba4b8');
      sky.addColorStop(0.85, '#e8b4b8');
      sky.addColorStop(1, '#fad2e1');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height * 0.7);

      // Lake
      const lake = ctx.createLinearGradient(0, height * 0.7, 0, height);
      lake.addColorStop(0, '#2d3e50');
      lake.addColorStop(1, '#111923');
      ctx.fillStyle = lake;
      ctx.fillRect(0, height * 0.7, width, height * 0.3);

      // Mount Fuji
      const fx = width * 0.5;
      const fy = height * 0.36;
      const fw = width * 0.82;

      // Mountain Base
      const mtnGrad = ctx.createLinearGradient(fx, fy, fx, height * 0.7);
      mtnGrad.addColorStop(0, '#1c2541');
      mtnGrad.addColorStop(1, '#0b132b');
      ctx.fillStyle = mtnGrad;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + fw * 0.5, height * 0.7);
      ctx.lineTo(fx - fw * 0.5, height * 0.7);
      ctx.closePath();
      ctx.fill();

      // Snow Cap
      const snowGrad = ctx.createLinearGradient(fx, fy, fx, fy + height * 0.15);
      snowGrad.addColorStop(0, '#ffffff');
      snowGrad.addColorStop(0.7, '#e0eafc');
      snowGrad.addColorStop(1, '#98b0c8');
      ctx.fillStyle = snowGrad;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + fw * 0.16, fy + height * 0.14);
      ctx.quadraticCurveTo(fx, fy + height * 0.17, fx - fw * 0.16, fy + height * 0.14);
      ctx.closePath();
      ctx.fill();

      // Gnarled Sakura Branch in Foreground
      ctx.strokeStyle = '#1b120c';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.1);
      ctx.quadraticCurveTo(width * 0.35, height * 0.22, width * 0.7, height * 0.12);
      ctx.quadraticCurveTo(width * 0.85, height * 0.08, width, height * 0.18);
      ctx.stroke();

      // Delicate Pink Blossoms
      for (let p = 0; p < 70; p++) {
        const bx = (Math.sin(p * 12.3) * 0.45 + 0.5) * width;
        const by = (Math.cos(p * 7.9) * 0.18 + 0.2) * height;
        const rad = 4 + (p % 5) * 2;
        ctx.fillStyle = (p % 2 === 0) ? '#ffb7c5' : '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by, rad, 0, tau);
        ctx.fill();
      }
    }

    else {
      // 6. Deep Space Astronaut Helmet
      ctx.fillStyle = '#030306';
      ctx.fillRect(0, 0, width, height);

      // Starfield dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (let s = 0; s < 90; s++) {
        const sx = ((s * 97) % width);
        const sy = ((s * 131) % height);
        ctx.fillRect(sx, sy, (s % 3 === 0) ? 2 : 1, (s % 3 === 0) ? 2 : 1);
      }

      const cx = width * 0.5;
      const cy = height * 0.48;
      const R = Math.min(width, height) * 0.34;

      // Suit Shoulders & Collar
      const suitGrad = ctx.createLinearGradient(cx - R * 1.1, cy + R * 0.6, cx + R * 1.1, height);
      suitGrad.addColorStop(0, '#f2f4f8');
      suitGrad.addColorStop(0.5, '#8c93a0');
      suitGrad.addColorStop(1, '#1b1d22');
      ctx.fillStyle = suitGrad;
      ctx.beginPath();
      ctx.ellipse(cx, height * 0.9, R * 1.3, R * 0.7, 0, 0, tau);
      ctx.fill();

      // Helmet Shell
      const helmGrad = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R * 1.1);
      helmGrad.addColorStop(0, '#ffffff');
      helmGrad.addColorStop(0.35, '#d0d5de');
      helmGrad.addColorStop(0.75, '#5c6370');
      helmGrad.addColorStop(1, '#15171c');
      ctx.fillStyle = helmGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.05, 0, tau);
      ctx.fill();

      // Gold / Blue Earth-Reflecting Visor
      const visorGrad = ctx.createRadialGradient(cx + R * 0.15, cy - R * 0.1, R * 0.05, cx, cy, R * 0.85);
      visorGrad.addColorStop(0, '#ffe894');
      visorGrad.addColorStop(0.25, '#f5af19');
      visorGrad.addColorStop(0.65, '#2193b0');
      visorGrad.addColorStop(0.92, '#091c33');
      visorGrad.addColorStop(1, '#040b14');
      ctx.fillStyle = visorGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 0.78, R * 0.62, 0, 0, tau);
      ctx.fill();

      // Visor Rim Highlight
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.78, Math.PI * 0.9, Math.PI * 1.7);
      ctx.stroke();
    }

    ctx.restore();
  }

  DB.DemoPhotos = {
    DEMO_PHOTOS,
    renderDemoPhoto
  };
})(window.DitherBoy);
