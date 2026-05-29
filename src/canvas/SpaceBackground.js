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
}
