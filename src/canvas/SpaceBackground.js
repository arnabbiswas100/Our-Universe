/**
 * SpaceBackground — Animated canvas starfield with twinkling,
 * shooting stars, comets, and drifting nebula clouds.
 * Lightweight Canvas 2D — replaces Three.js Nebula.
 */
export class SpaceBackground {
  constructor() {
    this.canvas = document.getElementById('space-bg');
    this.ctx = this.canvas.getContext('2d');
    this.stars = [];
    this.shootingStars = [];
    this.comets = [];
    this.alienShips = [];
    this.nebulaClouds = [];
    this.particles = [];
    this.time = 0;
    this.running = false;

    this._resize();
    this._initStars(350);
    this._initNebulaClouds(4);
    this._initParticles(40);

    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w * Math.min(window.devicePixelRatio, 2);
    this.canvas.height = this.h * Math.min(window.devicePixelRatio, 2);
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.scale(Math.min(window.devicePixelRatio, 2), Math.min(window.devicePixelRatio, 2));
  }

  _initStars(count) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        radius: Math.random() * 1.8 + 0.3,
        baseAlpha: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 2 + 0.5,
        twinklePhase: Math.random() * Math.PI * 2,
        // Color variation
        r: 180 + Math.random() * 75,
        g: 180 + Math.random() * 75,
        b: 200 + Math.random() * 55,
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
    this.shootingStars.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
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
    this._animate();
  }

  stop() {
    this.running = false;
  }

  _animate() {
    if (!this.running) return;
    requestAnimationFrame(() => this._animate());

    this.time += 0.016;
    const ctx = this.ctx;

    // Clear
    ctx.clearRect(0, 0, this.w, this.h);

    // Background gradient
    const bgGrad = ctx.createRadialGradient(
      this.w * 0.5, this.h * 0.4, 0,
      this.w * 0.5, this.h * 0.4, this.w * 0.8
    );
    bgGrad.addColorStop(0, '#131852');
    bgGrad.addColorStop(0.5, '#0E1040');
    bgGrad.addColorStop(1, '#0B0E2D');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.w, this.h);

    // Nebula clouds
    this._drawNebulaClouds(ctx);

    // Stars
    this._drawStars(ctx);

    // Floating particles
    this._drawParticles(ctx);

    // Alien ships
    this._drawAlienShips(ctx);

    // Shooting stars
    this._drawShootingStars(ctx);

    // Comets
    this._drawComets(ctx);

    // Spawn shooting star periodically (more frequent)
    this._lastShootingStar += 0.016;
    if (this._lastShootingStar > 1 + Math.random() * 2) {
      this._spawnShootingStar();
      this._lastShootingStar = 0;
    }

    // Spawn comet periodically
    this._lastComet += 0.016;
    if (this._lastComet > 8 + Math.random() * 7) {
      this._spawnComet();
      this._lastComet = 0;
    }

    // Alien ships — frequent
    this._lastAlienShip += 0.016;
    if (this._lastAlienShip > 3 + Math.random() * 3) {
      this._spawnAlienShip();
      this._lastAlienShip = 0;
    }
  }

  _drawNebulaClouds(ctx) {
    for (const cloud of this.nebulaClouds) {
      cloud.x += cloud.driftX;
      cloud.y += cloud.driftY;

      // Wrap around
      if (cloud.x < -cloud.radius) cloud.x = this.w + cloud.radius;
      if (cloud.x > this.w + cloud.radius) cloud.x = -cloud.radius;
      if (cloud.y < -cloud.radius) cloud.y = this.h + cloud.radius;
      if (cloud.y > this.h + cloud.radius) cloud.y = -cloud.radius;

      const pulse = 1 + Math.sin(this.time * cloud.pulseSpeed + cloud.pulsePhase) * 0.2;
      const r = cloud.radius * pulse;
      const alpha = cloud.alpha * (0.8 + Math.sin(this.time * cloud.pulseSpeed * 0.5) * 0.2);

      const grad = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, r);
      grad.addColorStop(0, `rgba(${cloud.color.r}, ${cloud.color.g}, ${cloud.color.b}, ${alpha})`);
      grad.addColorStop(0.5, `rgba(${cloud.color.r}, ${cloud.color.g}, ${cloud.color.b}, ${alpha * 0.4})`);
      grad.addColorStop(1, `rgba(${cloud.color.r}, ${cloud.color.g}, ${cloud.color.b}, 0)`);

      ctx.fillStyle = grad;
      ctx.fillRect(cloud.x - r, cloud.y - r, r * 2, r * 2);
    }
  }

  _drawStars(ctx) {
    for (const star of this.stars) {
      const twinkle = Math.sin(this.time * star.twinkleSpeed + star.twinklePhase);
      const alpha = star.baseAlpha + twinkle * 0.25;
      if (alpha <= 0) continue;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.round(star.r)}, ${Math.round(star.g)}, ${Math.round(star.b)}, ${Math.min(1, alpha)})`;
      ctx.fill();

      // Glow for brighter stars
      if (star.radius > 1.2) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.round(star.r)}, ${Math.round(star.g)}, ${Math.round(star.b)}, ${alpha * 0.08})`;
        ctx.fill();
      }
    }
  }

  _drawParticles(ctx) {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap
      if (p.y < -10) { p.y = this.h + 10; p.x = Math.random() * this.w; }
      if (p.x < -10) p.x = this.w + 10;
      if (p.x > this.w + 10) p.x = -10;

      const pulse = Math.sin(this.time * 1.5 + p.pulsePhase) * 0.3 + 0.7;
      const alpha = p.alpha * pulse;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 190, 255, ${alpha})`;
      ctx.fill();
    }
  }

  _drawShootingStars(ctx) {
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const ss = this.shootingStars[i];
      ss.x += ss.vx;
      ss.y += ss.vy;
      ss.life -= ss.decay;

      if (ss.life <= 0) {
        this.shootingStars.splice(i, 1);
        continue;
      }

      const tailX = ss.x - (ss.vx / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy)) * ss.length;
      const tailY = ss.y - (ss.vy / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy)) * ss.length;

      const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
      grad.addColorStop(0, `rgba(255, 255, 255, 0)`);
      grad.addColorStop(0.7, `rgba(200, 200, 255, ${ss.life * 0.5})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${ss.life})`);

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(ss.x, ss.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = ss.width * ss.life;
      ctx.stroke();

      // Head glow
      ctx.beginPath();
      ctx.arc(ss.x, ss.y, 2 * ss.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${ss.life * 0.8})`;
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
      x: startX,
      y: startY,
      vx,
      vy,
      headRadius: 3 + Math.random() * 2,
      tailLength: 80 + Math.random() * 60,
      tailWidth: 4 + Math.random() * 3,
      life: 1.0,
      decay: 0.001 + Math.random() * 0.001,
      headColor: palette.head,
      tailColor: palette.tail,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 1.5 + Math.random(),
      // Trail positions for smooth curved tail
      trail: [],
    });
  }

  _drawComets(ctx) {
    for (let i = this.comets.length - 1; i >= 0; i--) {
      const c = this.comets[i];

      // Slight wobble
      const wobble = Math.sin(this.time * c.wobbleSpeed + c.wobblePhase) * 0.3;
      c.x += c.vx;
      c.y += c.vy + wobble;
      c.life -= c.decay;

      // Store trail point
      c.trail.push({ x: c.x, y: c.y });
      if (c.trail.length > 60) c.trail.shift();

      // Remove if dead or off-screen
      if (c.life <= 0 || c.x > this.w + 100 || c.x < -100 || c.y > this.h + 100) {
        this.comets.splice(i, 1);
        continue;
      }

      const alpha = Math.min(1, c.life);

      // Draw tail using trail points
      if (c.trail.length > 2) {
        for (let j = 1; j < c.trail.length; j++) {
          const t = j / c.trail.length; // 0 (oldest) to 1 (newest)
          const pt = c.trail[j];
          const prevPt = c.trail[j - 1];
          const tailAlpha = t * t * alpha * 0.6;
          const width = c.tailWidth * t;

          // Interpolate color from tail to head
          const r = Math.round(c.tailColor[0] + (c.headColor[0] - c.tailColor[0]) * t);
          const g = Math.round(c.tailColor[1] + (c.headColor[1] - c.tailColor[1]) * t);
          const b = Math.round(c.tailColor[2] + (c.headColor[2] - c.tailColor[2]) * t);

          ctx.beginPath();
          ctx.moveTo(prevPt.x, prevPt.y);
          ctx.lineTo(pt.x, pt.y);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${tailAlpha})`;
          ctx.lineWidth = width;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      // Outer glow
      const glowR = c.headRadius * 6;
      const glowGrad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, glowR);
      glowGrad.addColorStop(0, `rgba(${c.headColor[0]}, ${c.headColor[1]}, ${c.headColor[2]}, ${alpha * 0.25})`);
      glowGrad.addColorStop(0.5, `rgba(${c.headColor[0]}, ${c.headColor[1]}, ${c.headColor[2]}, ${alpha * 0.08})`);
      glowGrad.addColorStop(1, `rgba(${c.headColor[0]}, ${c.headColor[1]}, ${c.headColor[2]}, 0)`);
      ctx.fillStyle = glowGrad;
      ctx.fillRect(c.x - glowR, c.y - glowR, glowR * 2, glowR * 2);

      // Comet head (bright core)
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.headRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c.headColor[0]}, ${c.headColor[1]}, ${c.headColor[2]}, ${alpha})`;
      ctx.fill();

      // White-hot center
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.headRadius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
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

    this.alienShips.push({ x, y, vx, vy, angle: shipAngle, size, palette, variant,
      blinkPhase: Math.random() * Math.PI * 2,
      blinkSpeed: 2 + Math.random() * 3,
      engineFlicker: Math.random() * Math.PI * 2,
      opacity: 0,
    });
  }

  _drawAlienShips(ctx) {
    for (let i = this.alienShips.length - 1; i >= 0; i--) {
      const s = this.alienShips[i];
      s.x += s.vx;
      s.y += s.vy;
      s.blinkPhase += 0.05;
      s.engineFlicker += 0.1;

      // Fade in/out
      if (s.opacity < 1) s.opacity = Math.min(1, s.opacity + 0.04);

      // Remove if off screen
      const pad = 100;
      if (s.x < -pad || s.x > this.w + pad || s.y < -pad || s.y > this.h + pad) {
        this.alienShips.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle + Math.PI / 2); // orient along travel direction
      ctx.globalAlpha = s.opacity;

      const sz = s.size;
      const [hr, hg, hb] = s.palette.hull;
      const [er, eg, eb] = s.palette.engine;
      const [lr, lg, lb] = s.palette.light;

      // Engine glow (behind ship)
      const engineAlpha = 0.4 + Math.sin(s.engineFlicker) * 0.3;
      const engineGrad = ctx.createRadialGradient(0, sz * 0.8, 0, 0, sz * 0.8, sz * 1.2);
      engineGrad.addColorStop(0, `rgba(${er},${eg},${eb},${engineAlpha})`);
      engineGrad.addColorStop(0.5, `rgba(${er},${eg},${eb},${engineAlpha * 0.4})`);
      engineGrad.addColorStop(1, `rgba(${er},${eg},${eb},0)`);
      ctx.fillStyle = engineGrad;
      ctx.fillRect(-sz, 0, sz * 2, sz * 2);

      if (s.variant === 0) {
        // Saucer shape
        ctx.beginPath();
        ctx.ellipse(0, 0, sz, sz * 0.38, 0, 0, Math.PI * 2);
        const hullGrad = ctx.createLinearGradient(0, -sz * 0.38, 0, sz * 0.38);
        hullGrad.addColorStop(0, `rgba(${hr+60},${hg+60},${hb+60},0.95)`);
        hullGrad.addColorStop(0.5, `rgba(${hr},${hg},${hb},0.85)`);
        hullGrad.addColorStop(1, `rgba(${Math.max(0,hr-40)},${Math.max(0,hg-40)},${Math.max(0,hb-40)},0.9)`);
        ctx.fillStyle = hullGrad;
        ctx.fill();
        // Dome
        ctx.beginPath();
        ctx.ellipse(0, -sz * 0.1, sz * 0.35, sz * 0.3, 0, Math.PI, Math.PI * 2);
        ctx.fillStyle = `rgba(${lr},${lg},${lb},0.35)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${hr+80},${hg+80},${hb+80},0.5)`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      } else if (s.variant === 1) {
        // Angular ship
        ctx.beginPath();
        ctx.moveTo(0, -sz);
        ctx.lineTo(sz * 0.6, sz * 0.5);
        ctx.lineTo(sz * 0.25, sz * 0.2);
        ctx.lineTo(-sz * 0.25, sz * 0.2);
        ctx.lineTo(-sz * 0.6, sz * 0.5);
        ctx.closePath();
        const ag = ctx.createLinearGradient(0, -sz, 0, sz * 0.5);
        ag.addColorStop(0, `rgba(${hr+80},${hg+80},${hb+80},0.95)`);
        ag.addColorStop(1, `rgba(${hr},${hg},${hb},0.8)`);
        ctx.fillStyle = ag;
        ctx.fill();
      } else {
        // Dart shape
        ctx.beginPath();
        ctx.moveTo(0, -sz * 1.1);
        ctx.lineTo(sz * 0.45, sz * 0.6);
        ctx.lineTo(0, sz * 0.25);
        ctx.lineTo(-sz * 0.45, sz * 0.6);
        ctx.closePath();
        const dg = ctx.createLinearGradient(-sz * 0.45, 0, sz * 0.45, 0);
        dg.addColorStop(0, `rgba(${Math.max(0,hr-30)},${Math.max(0,hg-30)},${Math.max(0,hb-30)},0.9)`);
        dg.addColorStop(0.5, `rgba(${hr+60},${hg+60},${hb+60},0.95)`);
        dg.addColorStop(1, `rgba(${Math.max(0,hr-30)},${Math.max(0,hg-30)},${Math.max(0,hb-30)},0.9)`);
        ctx.fillStyle = dg;
        ctx.fill();
      }

      // Blinking lights
      const blink = Math.sin(s.blinkPhase * s.blinkSpeed) > 0 ? 1 : 0.15;
      ctx.beginPath();
      ctx.arc(-sz * 0.5, sz * 0.1, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${lr},${lg},${lb},${blink})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sz * 0.5, sz * 0.1, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${lr},${lg},${lb},${1 - blink + 0.15})`;
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
}
