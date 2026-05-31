const SPACE_QUOTES = [
  "Dont click selfies, you'll scare your phone.",
  "Pasta banabo, toke dekhiye dekhiye khabo.",
  "Pizza Khabi?? Kine kheye ne.",
  "To the mind that is still, the whole universe surrenders.",
  "Tor naak er futoi charger lagiye debo.",
  "Sedin tor chokh ulte gechilo",
  "Always remember, You farted in English tuition.",
  "Ektu Mathematics sekha suru kor.",
  "You are Hunu",
  "If the world ever treats you bad, come to me, I'll always be there for you",
  "I believe in You",
  "Keep Working Hard",
  "I love You",
  "Tui Chuchi"
];

/**
 * SpaceBackground — Animated canvas starfield with twinkling,
 * shooting stars, comets, drifting nebula clouds, and interactive alien ships.
 * Lightweight Canvas 2D — replaces Three.js Nebula.
 */
export class SpaceBackground {
  constructor() {
    this.canvas = document.getElementById('space-bg');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.stars = [];
    this.shootingStars = [];
    this.comets = [];
    this.alienShips = [];
    this.nebulaClouds = [];
    this.particles = [];
    this.time = 0;
    this.running = false;
    this._dpr = Math.min(window.devicePixelRatio, 2);
    this._lastTimestamp = 0;

    // Offscreen canvas for static star layer (redrawn ~2fps)
    this._starCanvas = document.createElement('canvas');
    this._starCtx = this._starCanvas.getContext('2d');
    this._starDirty = true;
    this._starRedrawTimer = 0;

    // Cached nebula gradients — recreated only on meaningful position drift
    this._nebulaGradCache = [];

    this._resize();
    this._initStars(250);
    this._initNebulaClouds(4);
    this._initParticles(20);

    window.addEventListener('resize', () => this._resize());

    // Interactive alien ships click handler
    this.canvas.addEventListener('click', (e) => this._handleCanvasClick(e));
  }

  _handleCanvasClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const ship of this.alienShips) {
      if (!ship.hasQuote) continue; // skip non-interactive ships
      const dx = mx - ship.x;
      const dy = my - ship.y;
      const hitR = ship.size + 20;
      // Squared distance — skip sqrt
      if (dx * dx + dy * dy < hitR * hitR) {
        if (!ship.quoteLife || ship.quoteLife <= 0) {
          ship.quote = SPACE_QUOTES[Math.floor(Math.random() * SPACE_QUOTES.length)];
          ship.quoteLife = 4.0;
          ship.quoteScale = 0;
          ship._cachedLayout = null; // force layout calc once
        }
        break;
      }
    }
  }

  _resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this._dpr = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = this.w * this._dpr;
    this.canvas.height = this.h * this._dpr;
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.scale(this._dpr, this._dpr);
    // Resize offscreen star canvas
    this._starCanvas.width = this.canvas.width;
    this._starCanvas.height = this.canvas.height;
    this._starCtx.scale(this._dpr, this._dpr);
    this._starDirty = true;
  }

  _initStars(count) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      const r = Math.round(180 + Math.random() * 75);
      const g = Math.round(180 + Math.random() * 75);
      const b = Math.round(200 + Math.random() * 55);
      this.stars.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        radius: Math.random() * 1.8 + 0.3,
        baseAlpha: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 2 + 0.5,
        twinklePhase: Math.random() * Math.PI * 2,
        colorBase: `${r},${g},${b}`, // pre-baked color string
      });
    }
  }

  _initNebulaClouds(count) {
    const colors = [
      { r: 123, g: 94, b: 255 },   // Purple
      { r: 79, g: 195, b: 247 },   // Blue
      { r: 255, g: 110, b: 199 },  // Pink
      { r: 100, g: 80, b: 200 },   // Indigo
    ];
    this.nebulaClouds = [];
    for (let i = 0; i < count; i++) {
      const c = colors[i % colors.length];
      this.nebulaClouds.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        radius: 150 + Math.random() * 250,
        color: c,
        alpha: 0.03 + Math.random() * 0.04,
        driftX: (Math.random() - 0.5) * 0.15,
        driftY: (Math.random() - 0.5) * 0.1,
        pulseSpeed: 0.3 + Math.random() * 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  _initParticles(count) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vy: -(Math.random() * 0.3 + 0.1),
        vx: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  _spawnShootingStar() {
    const startX = Math.random() * this.w;
    const startY = Math.random() * this.h * 0.5;
    const angle = Math.PI * 0.15 + Math.random() * Math.PI * 0.2;
    const speed = 8 + Math.random() * 6;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const mag = Math.sqrt(vx * vx + vy * vy);
    this.shootingStars.push({
      x: startX, y: startY, vx, vy,
      dirX: vx / mag, dirY: vy / mag, // pre-computed unit vector
      life: 1.0,
      decay: 0.015 + Math.random() * 0.01,
      length: 30 + Math.random() * 40,
      width: 1.5 + Math.random() * 1.5,
    });
  }

  start() {
    this.running = true;
    this._lastShootingStar = 0;
    this._lastComet = 0;
    this._lastAlienShip = 0;
    this._lastTimestamp = 0;
    requestAnimationFrame((ts) => this._animate(ts));
  }

  stop() {
    this.running = false;
  }

  _animate(timestamp) {
    if (!this.running) return;
    requestAnimationFrame((ts) => this._animate(ts));

    // Real delta-time — prevents drift on slow frames
    const dt = this._lastTimestamp ? Math.min((timestamp - this._lastTimestamp) / 1000, 0.05) : 0.016;
    this._lastTimestamp = timestamp;
    this.time += dt;

    const ctx = this.ctx;

    // Background solid fill
    ctx.fillStyle = '#0C1035';
    ctx.fillRect(0, 0, this.w, this.h);

    // Nebula clouds
    this._drawNebulaClouds(ctx, dt);

    // Stars — rendered to offscreen canvas at ~2fps (imperceptible at this rate)
    this._starRedrawTimer += dt;
    if (this._starDirty || this._starRedrawTimer > 0.5) {
      this._renderStarsOffscreen();
      this._starRedrawTimer = 0;
      this._starDirty = false;
    }
    ctx.drawImage(this._starCanvas, 0, 0, this.w, this.h);

    // Floating particles
    this._drawParticles(ctx, dt);

    // Alien ships
    this._drawAlienShips(ctx, dt);

    // Shooting stars
    this._drawShootingStars(ctx, dt);

    // Comets
    this._drawComets(ctx, dt);

    // Spawn shooting star periodically
    this._lastShootingStar += dt;
    if (this._lastShootingStar > 1.5 + Math.random() * 2) {
      this._spawnShootingStar();
      this._lastShootingStar = 0;
    }

    // Spawn comet periodically (cap at 3)
    this._lastComet += dt;
    if (this._lastComet > 8 + Math.random() * 7 && this.comets.length < 3) {
      this._spawnComet();
      this._lastComet = 0;
    }

    // Alien ships — cap at 4 simultaneous
    this._lastAlienShip += dt;
    if (this._lastAlienShip > 3 + Math.random() * 3 && this.alienShips.length < 4) {
      this._spawnAlienShip();
      this._lastAlienShip = 0;
    }
  }

  _drawNebulaClouds(ctx, dt) {
    for (let ci = 0; ci < this.nebulaClouds.length; ci++) {
      const cloud = this.nebulaClouds[ci];
      cloud.x += cloud.driftX;
      cloud.y += cloud.driftY;

      if (cloud.x < -cloud.radius) cloud.x = this.w + cloud.radius;
      if (cloud.x > this.w + cloud.radius) cloud.x = -cloud.radius;
      if (cloud.y < -cloud.radius) cloud.y = this.h + cloud.radius;
      if (cloud.y > this.h + cloud.radius) cloud.y = -cloud.radius;

      const pulse = 1 + Math.sin(this.time * cloud.pulseSpeed + cloud.pulsePhase) * 0.2;
      const r = cloud.radius * pulse;
      const alpha = cloud.alpha * (0.8 + Math.sin(this.time * cloud.pulseSpeed * 0.5) * 0.2);

      // Re-use cached gradient if position hasn't drifted significantly
      const cache = this._nebulaGradCache[ci];
      const dx = cloud.x - (cache ? cache.cx : Infinity);
      const dy = cloud.y - (cache ? cache.cy : Infinity);
      const rDiff = Math.abs(r - (cache ? cache.r : 0));
      if (!cache || dx * dx + dy * dy > 4 || rDiff > 1) {
        const grad = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, r);
        grad.addColorStop(0, `rgba(${cloud.color.r},${cloud.color.g},${cloud.color.b},${alpha.toFixed(3)})`);
        grad.addColorStop(0.5, `rgba(${cloud.color.r},${cloud.color.g},${cloud.color.b},${(alpha * 0.4).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${cloud.color.r},${cloud.color.g},${cloud.color.b},0)`);
        this._nebulaGradCache[ci] = { grad, cx: cloud.x, cy: cloud.y, r };
      }

      ctx.fillStyle = this._nebulaGradCache[ci].grad;
      ctx.fillRect(cloud.x - r, cloud.y - r, r * 2, r * 2);
    }
  }

  /** Render stars onto the offscreen canvas (called ~4fps) */
  _renderStarsOffscreen() {
    const sctx = this._starCtx;
    sctx.clearRect(0, 0, this.w, this.h);

    for (const star of this.stars) {
      const twinkle = Math.sin(this.time * star.twinkleSpeed + star.twinklePhase);
      const alpha = star.baseAlpha + twinkle * 0.25;
      if (alpha <= 0) continue;

      sctx.beginPath();
      sctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      sctx.fillStyle = `rgba(${star.colorBase},${Math.min(1, alpha).toFixed(2)})`;
      sctx.fill();

      if (star.radius > 1.4) {
        sctx.beginPath();
        sctx.arc(star.x, star.y, star.radius * 2.5, 0, Math.PI * 2);
        sctx.fillStyle = `rgba(${star.colorBase},${(alpha * 0.06).toFixed(3)})`;
        sctx.fill();
      }
    }
  }

  _drawParticles(ctx, dt) {
    // Batch all particles into a single path / fill call
    ctx.fillStyle = 'rgba(200, 190, 255, 0.25)';
    ctx.beginPath();
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) { p.y = this.h + 10; p.x = Math.random() * this.w; }
      if (p.x < -10) p.x = this.w + 10;
      if (p.x > this.w + 10) p.x = -10;
      ctx.moveTo(p.x + p.size, p.y);
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  _drawShootingStars(ctx, dt) {
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const ss = this.shootingStars[i];
      ss.x += ss.vx;
      ss.y += ss.vy;
      ss.life -= ss.decay;

      if (ss.life <= 0) {
        this.shootingStars.splice(i, 1);
        continue;
      }

      const tailX = ss.x - ss.dirX * ss.length;
      const tailY = ss.y - ss.dirY * ss.length;

      // Reuse gradient object — only recreate when position shifts
      if (!ss._grad || Math.abs(ss.x - ss._gx) > 2 || Math.abs(ss.y - ss._gy) > 2) {
        const g = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.7, `rgba(200,200,255,${(ss.life * 0.5).toFixed(2)})`);
        g.addColorStop(1, `rgba(255,255,255,${ss.life.toFixed(2)})`);
        ss._grad = g; ss._gx = ss.x; ss._gy = ss.y;
      }

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(ss.x, ss.y);
      ctx.strokeStyle = ss._grad;
      ctx.lineWidth = ss.width * ss.life;
      ctx.stroke();

      // Head glow
      ctx.beginPath();
      ctx.arc(ss.x, ss.y, 2 * ss.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${(ss.life * 0.8).toFixed(2)})`;
      ctx.fill();
    }
  }

  _spawnComet() {
    // Comets enter from edges and drift across slowly
    const side = Math.random();
    let startX, startY, vx, vy;
    if (side < 0.5) {
      // From left
      startX = -40;
      startY = Math.random() * this.h * 0.6;
      vx = 1.2 + Math.random() * 0.8;
      vy = 0.4 + Math.random() * 0.6;
    } else {
      // From right
      startX = this.w + 40;
      startY = Math.random() * this.h * 0.4;
      vx = -(1.2 + Math.random() * 0.8);
      vy = 0.5 + Math.random() * 0.5;
    }

    // Choose a color palette for this comet
    const palettes = [
      { head: [180, 220, 255], tail: [100, 160, 255] },   // Ice blue
      { head: [255, 230, 180], tail: [255, 180, 80] },    // Golden
      { head: [220, 180, 255], tail: [160, 100, 255] },   // Purple
      { head: [180, 255, 220], tail: [80, 220, 160] },    // Green
      { head: [255, 200, 220], tail: [255, 120, 160] },   // Pink
    ];
    const palette = palettes[Math.floor(Math.random() * palettes.length)];

    this.comets.push({
      x: startX, y: startY, vx, vy,
      headRadius: 3 + Math.random() * 2,
      tailWidth: 4 + Math.random() * 3,
      life: 1.0,
      decay: 0.001 + Math.random() * 0.001,
      headColor: palette.head,
      tailColor: palette.tail,
      headStr: `${palette.head[0]},${palette.head[1]},${palette.head[2]}`,
      tailStr: `${palette.tail[0]},${palette.tail[1]},${palette.tail[2]}`,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 1.5 + Math.random(),
      trail: [],
    });
  }

  _drawComets(ctx, dt) {
    for (let i = this.comets.length - 1; i >= 0; i--) {
      const c = this.comets[i];
      const wobble = Math.sin(this.time * c.wobbleSpeed + c.wobblePhase) * 0.3;
      c.x += c.vx;
      c.y += c.vy + wobble;
      c.life -= c.decay;

      c.trail.push({ x: c.x, y: c.y });
      if (c.trail.length > 30) c.trail.shift();

      if (c.life <= 0 || c.x > this.w + 100 || c.x < -100 || c.y > this.h + 100) {
        this.comets.splice(i, 1);
        continue;
      }

      const alpha = Math.min(1, c.life);
      const tLen = c.trail.length;

      // Draw entire tail as a single gradient stroke (1 draw call vs ~15)
      if (tLen > 2) {
        const tip = c.trail[tLen - 1];
        const base = c.trail[0];
        const tailGrad = ctx.createLinearGradient(base.x, base.y, tip.x, tip.y);
        tailGrad.addColorStop(0, `rgba(${c.tailStr},0)`);
        tailGrad.addColorStop(1, `rgba(${c.tailStr},${(alpha * 0.55).toFixed(2)})`);

        ctx.beginPath();
        ctx.moveTo(c.trail[0].x, c.trail[0].y);
        for (let j = 1; j < tLen; j++) ctx.lineTo(c.trail[j].x, c.trail[j].y);
        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = c.tailWidth * 0.8;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Head glow — cached radial gradient
      const glowR = c.headRadius * 4;
      if (!c._glowGrad || Math.abs(c.x - c._glowX) > 2 || Math.abs(c.y - c._glowY) > 2) {
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, glowR);
        g.addColorStop(0, `rgba(${c.headStr},${(alpha * 0.3).toFixed(2)})`);
        g.addColorStop(1, `rgba(${c.headStr},0)`);
        c._glowGrad = g; c._glowX = c.x; c._glowY = c.y;
      }
      ctx.fillStyle = c._glowGrad;
      ctx.fillRect(c.x - glowR, c.y - glowR, glowR * 2, glowR * 2);

      // Bright core
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.headRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c.headStr},${alpha.toFixed(2)})`;
      ctx.fill();

      // White center
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.headRadius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${(alpha * 0.9).toFixed(2)})`;
      ctx.fill();
    }
  }
  _spawnAlienShip() {
    // Random entry from any edge
    const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
    let x, y, vx, vy;
    const speed = 0.8 + Math.random() * 1.4;
    const angle = Math.random() * Math.PI * 0.5 - Math.PI * 0.25; // ±45° spread

    if (edge === 0) { x = Math.random() * this.w; y = -60; vx = Math.sin(angle) * speed; vy = speed; }
    else if (edge === 1) { x = this.w + 60; y = Math.random() * this.h; vx = -speed; vy = Math.sin(angle) * speed; }
    else if (edge === 2) { x = Math.random() * this.w; y = this.h + 60; vx = Math.sin(angle) * speed; vy = -speed; }
    else { x = -60; y = Math.random() * this.h; vx = speed; vy = Math.sin(angle) * speed; }

    const shipAngle = Math.atan2(vy, vx);

    // Color palettes
    const palettes = [
      { hull: [80, 200, 180], engine: [0, 255, 200], light: [255, 100, 100] },
      { hull: [180, 100, 255], engine: [200, 100, 255], light: [100, 255, 200] },
      { hull: [100, 180, 255], engine: [50, 200, 255], light: [255, 220, 50] },
      { hull: [255, 160, 80], engine: [255, 100, 50], light: [100, 220, 255] },
      { hull: [200, 255, 100], engine: [150, 255, 50], light: [255, 80, 180] },
    ];
    const palette = palettes[Math.floor(Math.random() * palettes.length)];
    const size = 12 + Math.random() * 14;
    const variant = Math.floor(Math.random() * 3); // 0=saucer, 1=angular, 2=dart

    const [h, e, l] = [palette.hull, palette.engine, palette.light];
    this.alienShips.push({
      x, y, vx, vy, angle: shipAngle, size, variant,
      // Pre-baked color strings
      hullFill: `rgb(${h[0]},${h[1]},${h[2]})`,
      hullLight: `rgb(${Math.min(255, h[0] + 60)},${Math.min(255, h[1] + 60)},${Math.min(255, h[2] + 60)})`,
      engineStr: `${e[0]},${e[1]},${e[2]}`,
      lightStr: `${l[0]},${l[1]},${l[2]}`,
      blinkPhase: Math.random() * Math.PI * 2,
      blinkSpeed: 2 + Math.random() * 3,
      engineFlicker: Math.random() * Math.PI * 2,
      opacity: 0,
      hasQuote: Math.random() < 0.2,
      quoteLife: 0,
    });
  }

  _drawAlienShips(ctx, dt) {
    for (let i = this.alienShips.length - 1; i >= 0; i--) {
      const s = this.alienShips[i];
      s.x += s.vx;
      s.y += s.vy;
      s.blinkPhase += 0.05;
      s.engineFlicker += 0.1;

      if (s.opacity < 1) s.opacity = Math.min(1, s.opacity + 0.04);

      const pad = 100;
      if (s.x < -pad || s.x > this.w + pad || s.y < -pad || s.y > this.h + pad) {
        this.alienShips.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle + Math.PI / 2);
      ctx.globalAlpha = s.opacity;

      const sz = s.size;

      // Engine glow — simplified single-color radial
      const ea = (0.4 + Math.sin(s.engineFlicker) * 0.3).toFixed(2);
      ctx.fillStyle = `rgba(${s.engineStr},${ea})`;
      ctx.beginPath();
      ctx.arc(0, sz * 0.8, sz * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Ship hull — solid fill (no gradient = big perf win)
      if (s.variant === 0) {
        ctx.beginPath();
        ctx.ellipse(0, 0, sz, sz * 0.38, 0, 0, Math.PI * 2);
        ctx.fillStyle = s.hullFill;
        ctx.fill();
        // Dome
        ctx.beginPath();
        ctx.ellipse(0, -sz * 0.1, sz * 0.35, sz * 0.3, 0, Math.PI, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.lightStr},0.35)`;
        ctx.fill();
      } else if (s.variant === 1) {
        ctx.beginPath();
        ctx.moveTo(0, -sz);
        ctx.lineTo(sz * 0.6, sz * 0.5);
        ctx.lineTo(sz * 0.25, sz * 0.2);
        ctx.lineTo(-sz * 0.25, sz * 0.2);
        ctx.lineTo(-sz * 0.6, sz * 0.5);
        ctx.closePath();
        ctx.fillStyle = s.hullLight;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -sz * 1.1);
        ctx.lineTo(sz * 0.45, sz * 0.6);
        ctx.lineTo(0, sz * 0.25);
        ctx.lineTo(-sz * 0.45, sz * 0.6);
        ctx.closePath();
        ctx.fillStyle = s.hullFill;
        ctx.fill();
      }

      // Blinking lights
      const blink = Math.sin(s.blinkPhase * s.blinkSpeed) > 0 ? 1 : 0.15;
      ctx.fillStyle = `rgba(${s.lightStr},${blink})`;
      ctx.fillRect(-sz * 0.5 - 2, sz * 0.1 - 2, 4, 4);
      ctx.fillStyle = `rgba(${s.lightStr},${1 - blink + 0.15})`;
      ctx.fillRect(sz * 0.5 - 2, sz * 0.1 - 2, 4, 4);

      ctx.globalAlpha = 1;
      ctx.restore();

      // Render Quote Bubble (if active)
      if (s.quoteLife > 0) {
        s.quoteLife -= 0.016;
        if (s.quoteScale === undefined) s.quoteScale = 0;
        if (s.quoteLife > 0.3) s.quoteScale += (1 - s.quoteScale) * 0.15;
        else s.quoteScale *= 0.8;

        if (s.quoteScale > 0.05) {
          // Cache layout on first render (avoid measureText every frame)
          if (!s._cachedLayout) {
            ctx.font = 'bold 11px sans-serif';
            const maxW = 220;
            const words = s.quote.split(' ');
            let line = '', lines = [], mlw = 0;
            for (let n = 0; n < words.length; n++) {
              let test = line + words[n] + ' ';
              if (ctx.measureText(test).width > maxW && n > 0) {
                let lw = ctx.measureText(line).width;
                if (lw > mlw) mlw = lw;
                lines.push(line);
                line = words[n] + ' ';
              } else line = test;
            }
            lines.push(line);
            let fw = ctx.measureText(line).width;
            if (fw > mlw) mlw = fw;
            s._cachedLayout = { lines, boxW: mlw + 24, boxH: lines.length * 16 + 16 };
          }

          const { lines, boxW, boxH } = s._cachedLayout;
          const py = -sz - 15;

          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.scale(s.quoteScale, s.quoteScale);
          ctx.font = 'bold 11px sans-serif';

          ctx.fillStyle = 'rgba(11, 14, 45, 0.95)';
          ctx.strokeStyle = 'rgba(255, 110, 199, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 5;
          ctx.beginPath();
          ctx.roundRect(-boxW / 2, py - boxH, boxW, boxH, 8);
          ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(-6, py); ctx.lineTo(6, py); ctx.lineTo(0, py + 8);
          ctx.closePath();
          ctx.fillStyle = 'rgba(11, 14, 45, 0.95)';
          ctx.fill();

          ctx.fillStyle = '#FF2A93';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const startY = py - boxH / 2 - ((lines.length - 1) * 16) / 2;
          for (let k = 0; k < lines.length; k++) ctx.fillText(lines[k], 0, startY + k * 16);

          ctx.restore();
        }
      }
    }
  }
}
