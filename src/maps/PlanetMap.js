import gsap from 'gsap';
import { getPlanetSizePx } from '../data/universe.js';

/**
 * PlanetMap — Solar System view for a single era.
 * Central star with planets orbiting on concentric rings.
 * Uses GSAP for buttery-smooth orbital motion (no CSS var() in keyframes issues).
 *
 * Features:
 * - Camera zoom: on planet click, zooms so planet is on left ~30% of viewport
 * - Rocket system: a detailed cartoon rocket flies in and lands on clicked planet
 * - Visited planets show a parked rocket instead of a checkmark
 */
export class PlanetMap {
  constructor(progressManager) {
    this.container = document.getElementById('planet-map');
    this.nodesContainer = document.getElementById('planet-nodes');
    this.svgContainer = document.getElementById('planet-paths');
    this.progressManager = progressManager;
    this.onPlanetClick = null;
    this.era = null;
    this.nodes = [];
    this.orbitTweens = [];
    this._paused = false;
    this._zoomed = false;
    this._zoomedNode = null;
    this._cameraTracker = null;
    this._rocketElement = null;
  }

  async enter(era) {
    this.era = era;
    this._paused = false;
    this._zoomed = false;
    this.container.style.display = 'block';
    this.container.style.opacity = '0';

    // Clear previous
    this.nodesContainer.innerHTML = '';
    this.svgContainer.innerHTML = '';
    this._killOrbits();

    // Build solar system
    this._buildSolarSystem();

    // Fade in container
    gsap.to(this.container, { opacity: 1, duration: 0.5, ease: 'power2.out' });

    // Animate entrance
    await this._animateEntrance();

    // Start orbit animations after entrance
    this._startOrbits();
  }

  _buildSolarSystem() {
    const planets = this.era.planets;
    const baseColor = this.era.starConfig.baseColor;
    const coronaColor = this.era.starConfig.coronaColor;
    const vMin = Math.min(window.innerWidth, window.innerHeight);
    const starSize = vMin * 0.08;

    // Orbit sizing
    const baseOrbit = vMin * 0.12;
    const orbitStep = vMin * 0.043;

    // Wrapper
    const system = document.createElement('div');
    system.className = 'solar-system';
    system.id = 'solar-system';

    // ── Central Star ──
    const star = document.createElement('div');
    star.className = 'ss-star';
    star.innerHTML = `
      <div class="ss-star-body" style="
        width: ${starSize}px;
        height: ${starSize}px;
        background: radial-gradient(circle at 40% 35%, #FFF8E0, ${coronaColor}, ${baseColor}, ${this._darken(baseColor)});
        box-shadow:
          0 0 ${starSize * 0.5}px ${coronaColor}AA,
          0 0 ${starSize}px ${coronaColor}55,
          0 0 ${starSize * 2}px ${coronaColor}22;
      "></div>
      <div class="ss-star-glow" style="
        width: ${starSize * 2.8}px;
        height: ${starSize * 2.8}px;
        background: radial-gradient(circle, ${coronaColor}30 0%, ${coronaColor}08 50%, transparent 70%);
      "></div>
    `;
    system.appendChild(star);

    // ── Orbit Rings & Planets ──
    planets.forEach((planet, i) => {
      const orbitRadius = baseOrbit + i * orbitStep;
      const orbitDuration = 25 + i * 10; // seconds
      const startAngle = (i * 137.5) % 360; // golden angle for nice spread
      const sizePx = getPlanetSizePx(planet.size, 26);
      const visited = this.progressManager.isVisited(planet.id);

      // Orbit ring
      const ring = document.createElement('div');
      ring.className = 'ss-orbit-ring';
      ring.style.width = `${orbitRadius * 2}px`;
      ring.style.height = `${orbitRadius * 2}px`;
      if (visited) {
        ring.style.borderColor = 'rgba(255, 215, 0, 0.18)';
        ring.style.boxShadow = '0 0 6px rgba(255, 215, 0, 0.05)';
      }
      system.appendChild(ring);

      // Orbit arm — a div that will be rotated by GSAP
      const orbitArm = document.createElement('div');
      orbitArm.className = 'ss-orbit-arm';
      orbitArm.style.width = `${orbitRadius * 2}px`;
      orbitArm.style.height = `${orbitRadius * 2}px`;
      // Initial rotation — set via transform (GSAP will animate this)
      orbitArm.style.transform = `translate(-50%, -50%) rotate(${startAngle}deg)`;

      // Planet node — positioned at top-center of orbit arm
      const node = document.createElement('div');
      node.className = `ss-planet-node ${visited ? 'visited' : ''}`;
      node.id = `ss-planet-${i}`;
      // Counter-rotate to stay upright (GSAP will animate)
      node.style.transform = `translate(-50%, -50%) rotate(${-startAngle}deg)`;

      const baseCol = planet.visual.baseColor;
      const accentCol = planet.visual.accentColor;
      const atmosCol = planet.visual.atmosphereColor || baseCol;

      node.innerHTML = `
        <div class="ss-planet-body" style="
          width: ${sizePx}px;
          height: ${sizePx}px;
          background: radial-gradient(circle at 35% 30%, ${accentCol}, ${baseCol}, ${this._darken(baseCol)});
          box-shadow:
            0 0 ${sizePx * 0.4}px ${atmosCol}60,
            0 0 ${sizePx * 0.8}px ${atmosCol}20,
            inset -${sizePx * 0.1}px -${sizePx * 0.08}px ${sizePx * 0.15}px rgba(0,0,0,0.4),
            inset ${sizePx * 0.04}px ${sizePx * 0.04}px ${sizePx * 0.06}px rgba(255,255,255,0.25);
        ">
          <div class="ss-planet-shine"></div>
          ${planet.visual.hasRings ? `<div class="ss-planet-ring" style="
            border-color: ${accentCol}70;
            width: ${sizePx * 1.6}px;
            height: ${sizePx * 0.45}px;
            box-shadow: 0 0 6px ${accentCol}30;
          "></div>` : ''}
        </div>
        <div class="ss-planet-badge">${i + 1}</div>
        <div class="ss-planet-label">
          <span class="ss-planet-name">${planet.name}</span>
          <span class="ss-planet-date">${planet.date}</span>
        </div>
      `;

      // Click
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onPlanetClick && !this._paused) {
          this._paused = true;
          this.onPlanetClick(planet, node);
        }
      });

      // Hover
      node.addEventListener('mouseenter', () => {
        if (this._paused) return;
        gsap.to(node.querySelector('.ss-planet-body'), {
          scale: 1.18,
          duration: 0.25,
          ease: 'power2.out',
        });
        const label = node.querySelector('.ss-planet-label');
        label.style.opacity = '1';
        label.style.transform = 'translateX(-50%) translateY(0)';
      });

      node.addEventListener('mouseleave', () => {
        gsap.to(node.querySelector('.ss-planet-body'), {
          scale: 1,
          duration: 0.25,
          ease: 'power2.out',
        });
        const label = node.querySelector('.ss-planet-label');
        label.style.opacity = '0.65';
        label.style.transform = 'translateX(-50%) translateY(4px)';
      });

      orbitArm.appendChild(node);
      system.appendChild(orbitArm);

      this.nodes.push({
        element: node,
        planet,
        orbitArm,
        ring,
        startAngle,
        orbitDuration,
        orbitRadius,
      });
    });

    this.nodesContainer.appendChild(system);
  }

  // ══════════════════════════════════════════
  // ROCKET SVG — Detailed cartoon rocket
  // ══════════════════════════════════════════

  /** Generate inline SVG for a detailed cartoon rocket */
  _createRocketSVG(size = 48) {
    const w = size;
    const h = size * 1.6;
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="ss-rocket-svg" xmlns="http://www.w3.org/2000/svg">
      <!-- Exhaust flame (animated) -->
      <g class="rocket-flame">
        <ellipse cx="${w/2}" cy="${h - 2}" rx="${w * 0.18}" ry="${h * 0.12}"
          fill="url(#flameGrad-${size})" opacity="0.9"/>
        <ellipse cx="${w/2}" cy="${h - 4}" rx="${w * 0.1}" ry="${h * 0.08}"
          fill="#FFEE88" opacity="0.95"/>
      </g>

      <!-- Left fin -->
      <path d="M ${w*0.18} ${h*0.65} L ${w*0.02} ${h*0.82} L ${w*0.22} ${h*0.78} Z"
        fill="#E84855" stroke="#C0392B" stroke-width="0.5"
        stroke-linejoin="round"/>
      <!-- Right fin -->
      <path d="M ${w*0.82} ${h*0.65} L ${w*0.98} ${h*0.82} L ${w*0.78} ${h*0.78} Z"
        fill="#E84855" stroke="#C0392B" stroke-width="0.5"
        stroke-linejoin="round"/>

      <!-- Rocket body -->
      <path d="M ${w/2} ${h*0.06}
              C ${w*0.25} ${h*0.18}, ${w*0.2} ${h*0.4}, ${w*0.22} ${h*0.75}
              L ${w*0.78} ${h*0.75}
              C ${w*0.8} ${h*0.4}, ${w*0.75} ${h*0.18}, ${w/2} ${h*0.06} Z"
        fill="url(#bodyGrad-${size})" stroke="#BDC3C7" stroke-width="0.7"/>

      <!-- Body stripes -->
      <rect x="${w*0.22}" y="${h*0.62}" width="${w*0.56}" height="${h*0.03}"
        rx="1" fill="#E84855" opacity="0.85"/>
      <rect x="${w*0.22}" y="${h*0.68}" width="${w*0.56}" height="${h*0.02}"
        rx="1" fill="#2980B9" opacity="0.6"/>

      <!-- Nosecone tip -->
      <ellipse cx="${w/2}" cy="${h*0.09}" rx="${w*0.06}" ry="${h*0.03}"
        fill="#E84855"/>

      <!-- Cockpit window -->
      <circle cx="${w/2}" cy="${h*0.38}" r="${w*0.14}"
        fill="#3498DB" stroke="#2980B9" stroke-width="1"/>
      <circle cx="${w/2}" cy="${h*0.38}" r="${w*0.1}"
        fill="#5DADE2"/>
      <!-- Window shine -->
      <ellipse cx="${w*0.44}" cy="${h*0.34}" rx="${w*0.04}" ry="${h*0.025}"
        fill="rgba(255,255,255,0.7)" transform="rotate(-25 ${w*0.44} ${h*0.34})"/>

      <!-- Exhaust nozzle -->
      <rect x="${w*0.32}" y="${h*0.74}" width="${w*0.36}" height="${h*0.06}"
        rx="2" fill="#7F8C8D" stroke="#5D6D7E" stroke-width="0.5"/>
      <rect x="${w*0.36}" y="${h*0.78}" width="${w*0.28}" height="${h*0.03}"
        rx="1" fill="#5D6D7E"/>

      <!-- Rivet details -->
      <circle cx="${w*0.3}" cy="${h*0.52}" r="1" fill="#95A5A6"/>
      <circle cx="${w*0.7}" cy="${h*0.52}" r="1" fill="#95A5A6"/>
      <circle cx="${w*0.3}" cy="${h*0.45}" r="0.8" fill="#95A5A6"/>
      <circle cx="${w*0.7}" cy="${h*0.45}" r="0.8" fill="#95A5A6"/>

      <!-- Gradient definitions -->
      <defs>
        <linearGradient id="bodyGrad-${size}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#D5D8DC"/>
          <stop offset="30%" stop-color="#F2F3F4"/>
          <stop offset="70%" stop-color="#F8F9F9"/>
          <stop offset="100%" stop-color="#BDC3C7"/>
        </linearGradient>
        <radialGradient id="flameGrad-${size}" cx="50%" cy="30%">
          <stop offset="0%" stop-color="#FFF176"/>
          <stop offset="40%" stop-color="#FFB74D"/>
          <stop offset="100%" stop-color="#FF5722" stop-opacity="0"/>
        </radialGradient>
      </defs>
    </svg>`;
  }

  /** Small parked rocket HTML for visited planets */
  _createParkedRocketHTML() {
    return `<div class="ss-rocket-parked">${this._createRocketSVG(20)}</div>`;
  }

  // ══════════════════════════════════════════
  // ROCKET LANDING ANIMATION
  // ══════════════════════════════════════════

  /** Fly a rocket into the scene and land it on the planet node */
  async flyRocketToPlanet(node) {
    // Create the flying rocket element (fixed position for flight)
    const rocketEl = document.createElement('div');
    rocketEl.className = 'ss-rocket-flying';
    rocketEl.innerHTML = this._createRocketSVG(32);
    document.body.appendChild(rocketEl);
    this._rocketElement = rocketEl;
    this._landedNode = node;

    // Get the planet position on screen
    const planetBody = node.querySelector('.ss-planet-body');
    const planetRect = planetBody.getBoundingClientRect();
    const targetX = planetRect.left + planetRect.width / 2;
    const targetY = planetRect.top - 10;

    // Start position: off-screen top-right
    const startX = window.innerWidth + 50;
    const startY = -80;

    gsap.set(rocketEl, {
      x: startX,
      y: startY,
      rotation: 200,
      scale: 0.6,
      opacity: 0,
    });

    const tl = gsap.timeline();

    // Fly in
    tl.to(rocketEl, { opacity: 1, duration: 0.2 });

    tl.to(rocketEl, {
      x: targetX - 20,
      y: targetY,
      rotation: 0,
      scale: 0.9,
      duration: 1.0,
      ease: 'power2.out',
    }, '-=0.1');

    // Landing bounce
    tl.to(rocketEl, { y: targetY + 3, scale: 0.85, duration: 0.15, ease: 'power2.in' });
    tl.to(rocketEl, { y: targetY - 2, scale: 0.9, duration: 0.2, ease: 'power2.out' });

    // Fade flame
    const flame = rocketEl.querySelector('.rocket-flame');
    if (flame) {
      tl.to(flame, { opacity: 0, duration: 0.3 }, '-=0.2');
    }

    await tl;

    // === Land the rocket ON the planet node ===
    // Remove the flying rocket from body
    rocketEl.remove();
    this._rocketElement = null;

    // Add a parked rocket as a child of the planet node (so it orbits with it)
    const parkedRocket = document.createElement('div');
    parkedRocket.className = 'ss-rocket-parked';
    parkedRocket.innerHTML = this._createRocketSVG(16);
    // Hide flame on parked rocket
    const parkedFlame = parkedRocket.querySelector('.rocket-flame');
    if (parkedFlame) parkedFlame.style.display = 'none';
    node.appendChild(parkedRocket);

    // Pop-in animation
    gsap.fromTo(parkedRocket,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' }
    );
  }

  /** Remove any rocket (flying or parked) */
  _removeFlightRocket() {
    // Remove flying rocket from body
    if (this._rocketElement) {
      this._rocketElement.remove();
      this._rocketElement = null;
    }
    // Remove parked rocket from the landed planet node
    if (this._landedNode) {
      const parked = this._landedNode.querySelector('.ss-rocket-parked');
      if (parked) parked.remove();
      this._landedNode = null;
    }
  }

  // ══════════════════════════════════════════
  // CAMERA ZOOM — Planet on left, story on right
  // ══════════════════════════════════════════

  /** Zoom the solar system so the target planet is at left ~30% of viewport */
  async zoomToPlanet(planet, node) {
    const system = this.nodesContainer.querySelector('.solar-system');
    if (!system) return;

    this._zoomed = true;
    this._zoomedNode = node;
    const zoomScale = 2.5;

    system.style.willChange = 'transform';
    system.style.transformOrigin = 'center center';

    // Step 1: Start tracking FIRST
    this._startIntervalTracker(system, node, zoomScale);

    // Brief wait so tracker pans camera before zoom
    await new Promise(r => setTimeout(r, 200));

    // Step 2: Scale zoom — tracker handles x/y, this handles scale only
    await gsap.to(system, {
      scale: zoomScale,
      duration: 1.0,
      ease: 'power3.inOut',
      force3D: true,
    });

    // Spawn astronaut
    this._spawnAstronaut(node);
  }

  /**
   * rAF-based camera tracker with lerp (0.05/frame).
   * Mathematically cannot oscillate: error × 0.95^n → 0.
   * At 60fps, corrections are sub-pixel and completely invisible.
   */
  _startIntervalTracker(system, node, zoomScale) {
    if (this._cameraTracker) {
      cancelAnimationFrame(this._cameraTracker);
      this._cameraTracker = null;
    }

    const TARGET_X = window.innerWidth * 0.28;
    const TARGET_Y = window.innerHeight * 0.48;
    const LERP = 0.05; // 5% of remaining gap per frame — smooth, never overshoots

    const tick = () => {
      if (!this._zoomed) return;

      const pb = node.querySelector('.ss-planet-body');
      if (pb) {
        const r = pb.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        const currentScale = gsap.getProperty(system, 'scaleX') || 1;
        const diffX = (TARGET_X - cx) / currentScale;
        const diffY = (TARGET_Y - cy) / currentScale;

        // Only nudge if there's meaningful drift
        if (Math.abs(diffX) > 0.3 || Math.abs(diffY) > 0.3) {
          gsap.set(system, {
            x: `+=${diffX * LERP}`,
            y: `+=${diffY * LERP}`,
            force3D: true,
          });
        }
      }

      this._cameraTracker = requestAnimationFrame(tick);
    };

    this._cameraTracker = requestAnimationFrame(tick);
  }


  /** Zoom back out to the full solar system view */
  async zoomOut() {
    const system = this.nodesContainer.querySelector('.solar-system');
    if (!system) return;

    // Astronaut boards rocket, rocket lifts off
    await this._recallAstronaut();

    // Stop rAF tracker
    if (this._cameraTracker) {
      cancelAnimationFrame(this._cameraTracker);
      this._cameraTracker = null;
    }

    this._zoomed = false;
    this._zoomedNode = null;
    this._removeFlightRocket();

    await gsap.to(system, {
      scale: 1,
      x: 0,
      y: 0,
      duration: 0.8,
      ease: 'power3.inOut',
      force3D: true,
      onComplete: () => { system.style.willChange = 'auto'; },
    });
  }

  // ══════════════════════════════════════════
  // ASTRONAUT — Exits rocket, plants flag, re-boards on close
  // ══════════════════════════════════════════

  /** Spawn astronaut that walks out of rocket onto planet */
  _spawnAstronaut(node) {
    // Remove any existing astronaut
    node.querySelectorAll('.ss-astronaut, .ss-flag').forEach(e => e.remove());

    const planetBody = node.querySelector('.ss-planet-body');
    const parkedRocket = node.querySelector('.ss-rocket-parked');
    if (!planetBody || !parkedRocket) return;

    const pSize = planetBody.offsetWidth || 50;

    // Create astronaut
    const astronaut = document.createElement('div');
    astronaut.className = 'ss-astronaut';
    astronaut.innerHTML = this._createAstronautSVG(12);

    // Start position: at the rocket (bottom-left of planet)
    astronaut.style.position = 'absolute';
    astronaut.style.left = `calc(50% - ${pSize * 0.35}px)`;
    astronaut.style.top = `calc(50% + ${pSize * 0.1}px)`;
    astronaut.style.zIndex = '20';
    astronaut.style.pointerEvents = 'none';
    astronaut.style.transformOrigin = 'bottom center';
    node.appendChild(astronaut);

    // Create flag (spawns where astronaut walks to)
    const flag = document.createElement('div');
    flag.className = 'ss-flag';
    flag.innerHTML = this._createFlagSVG();
    flag.style.position = 'absolute';
    flag.style.left = `calc(50% + ${pSize * 0.08}px)`;
    flag.style.top = `calc(50% - ${pSize * 0.12}px)`;
    flag.style.zIndex = '19';
    flag.style.pointerEvents = 'none';
    flag.style.opacity = '0';
    node.appendChild(flag);

    // Animate: pop in from rocket, walk right, plant flag
    const tl = gsap.timeline();

    // Emerge from rocket
    tl.fromTo(astronaut,
      { scale: 0, opacity: 0, x: 0, y: 0 },
      { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' }
    );

    // Walk across planet surface (move right)
    tl.to(astronaut, {
      x: pSize * 0.45,
      y: -pSize * 0.22,
      duration: 1.2,
      ease: 'power1.inOut',
    });

    // Plant flag
    tl.to(flag, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' }, '-=0.1');
    tl.fromTo(flag, { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: 'back.out(2)', transformOrigin: 'bottom' }, '<');

    // Astronaut idle bounce
    tl.to(astronaut, {
      y: `-=${pSize * 0.04}`,
      repeat: -1,
      yoyo: true,
      duration: 0.6,
      ease: 'sine.inOut',
    });

    this._astronautEl = astronaut;
    this._flagEl = flag;
    this._astronautNode = node;
  }

  /** Astronaut re-boards rocket and rocket lifts off */
  async _recallAstronaut() {
    const astronaut = this._astronautEl;
    const flag = this._flagEl;
    const node = this._astronautNode;

    if (!astronaut || !node) return;

    // Kill idle animation
    gsap.killTweensOf(astronaut);

    const tl = gsap.timeline();

    // Flag droops
    if (flag) {
      tl.to(flag, { opacity: 0, scaleY: 0.2, duration: 0.3, transformOrigin: 'bottom', ease: 'power2.in' }, 0);
    }

    // Walk back to rocket
    tl.to(astronaut, {
      x: 0,
      y: 0,
      duration: 0.9,
      ease: 'power1.inOut',
    }, 0.1);

    // Board and disappear
    tl.to(astronaut, {
      scale: 0,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
    });

    // Rocket lifts off
    const parkedRocket = node.querySelector('.ss-rocket-parked');
    if (parkedRocket) {
      tl.to(parkedRocket, {
        y: -60,
        x: 20,
        opacity: 0,
        scale: 0.5,
        rotation: 15,
        duration: 0.7,
        ease: 'power3.in',
      });
    }

    await tl;

    astronaut.remove();
    flag?.remove();
    this._astronautEl = null;
    this._flagEl = null;
    this._astronautNode = null;
  }

  /** Detailed astronaut SVG */
  _createAstronautSVG(size) {
    const s = size;
    return `<svg width="${s}" height="${s * 1.6}" viewBox="0 0 20 32" xmlns="http://www.w3.org/2000/svg" class="ss-astronaut-svg">
      <!-- Boots -->
      <rect x="5" y="27" width="4" height="3" rx="1.5" fill="#BDC3C7"/>
      <rect x="11" y="27" width="4" height="3" rx="1.5" fill="#BDC3C7"/>
      <!-- Legs -->
      <rect x="6" y="20" width="3" height="8" rx="1.5" fill="#ECF0F1"/>
      <rect x="11" y="20" width="3" height="8" rx="1.5" fill="#ECF0F1"/>
      <!-- Body suit -->
      <rect x="4" y="12" width="12" height="10" rx="3" fill="#ECF0F1"/>
      <!-- Backpack (life support) -->
      <rect x="2" y="13" width="3" height="7" rx="1.5" fill="#BDC3C7"/>
      <!-- Chest badge -->
      <rect x="7.5" y="15" width="5" height="3" rx="1" fill="#3498DB" opacity="0.8"/>
      <!-- Arms -->
      <rect x="1" y="13" width="3" height="6" rx="1.5" fill="#ECF0F1"/>
      <rect x="16" y="13" width="3" height="6" rx="1.5" fill="#ECF0F1"/>
      <!-- Gloves -->
      <circle cx="2.5" cy="19.5" r="1.8" fill="#BDC3C7"/>
      <circle cx="17.5" cy="19.5" r="1.8" fill="#BDC3C7"/>
      <!-- Neck ring -->
      <rect x="7" y="10" width="6" height="2.5" rx="1.2" fill="#BDC3C7"/>
      <!-- Helmet -->
      <circle cx="10" cy="7" r="6" fill="#ECF0F1"/>
      <!-- Visor -->
      <ellipse cx="10" cy="7.5" rx="3.8" ry="3.2" fill="#2C3E50"/>
      <!-- Visor shine -->
      <ellipse cx="8.5" cy="6" rx="1.2" ry="0.8" fill="rgba(255,255,255,0.4)" transform="rotate(-20 8.5 6)"/>
      <!-- Helmet rim -->
      <circle cx="10" cy="7" r="6" fill="none" stroke="#BDC3C7" stroke-width="0.8"/>
      <!-- Antenna -->
      <line x1="13" y1="2" x2="15" y2="0" stroke="#BDC3C7" stroke-width="0.8"/>
      <circle cx="15" cy="0" r="0.8" fill="#E74C3C"/>
    </svg>`;
  }

  /** Flag SVG with waving flag */
  _createFlagSVG() {
    return `<svg width="16" height="20" viewBox="0 0 16 20" xmlns="http://www.w3.org/2000/svg">
      <!-- Pole -->
      <line x1="3" y1="1" x2="3" y2="19" stroke="#BDC3C7" stroke-width="1.2" stroke-linecap="round"/>
      <!-- Flag -->
      <path d="M3 2 Q9 4 15 3 Q9 7 3 8 Z" fill="#E74C3C"/>
      <!-- Heart on flag -->
      <path d="M7.5 4 C7.5 3.5 8 3 8.5 3.5 C9 3 9.5 3.5 9.5 4 C9.5 4.8 8.5 5.5 8.5 5.5 C8.5 5.5 7.5 4.8 7.5 4 Z"
        fill="white" opacity="0.9"/>
      <!-- Base -->
      <ellipse cx="3" cy="19" rx="2.5" ry="0.8" fill="#95A5A6"/>
    </svg>`;
  }

  /** Start continuous orbital motion with GSAP */
  _startOrbits() {
    this.nodes.forEach(({ orbitArm, element, startAngle, orbitDuration }) => {
      // Orbit arm: rotate 360 degrees continuously
      const armTween = gsap.to({ angle: startAngle }, {
        angle: startAngle + 360,
        duration: orbitDuration,
        ease: 'none',
        repeat: -1,
        onUpdate: function () {
          const a = this.targets()[0].angle;
          orbitArm.style.transform = `translate(-50%, -50%) rotate(${a}deg)`;
          element.style.transform = `translate(-50%, -50%) rotate(${-a}deg)`;
        },
      });

      this.orbitTweens.push(armTween);
    });
  }

  /** Kill all orbit animations */
  _killOrbits() {
    this.orbitTweens.forEach(t => t.kill());
    this.orbitTweens = [];
  }

  async _animateEntrance() {
    const star = this.nodesContainer.querySelector('.ss-star');
    const rings = this.nodesContainer.querySelectorAll('.ss-orbit-ring');
    const arms = this.nodesContainer.querySelectorAll('.ss-orbit-arm');
    const planets = this.nodesContainer.querySelectorAll('.ss-planet-node');

    gsap.set(star, { scale: 0, opacity: 0 });
    gsap.set(rings, { scale: 0, opacity: 0 });
    gsap.set(arms, { opacity: 0 });
    gsap.set(planets, { scale: 0, opacity: 0 });

    const tl = gsap.timeline();

    tl.to(star, {
      scale: 1,
      opacity: 1,
      duration: 0.7,
      ease: 'back.out(1.8)',
    });

    tl.to(rings, {
      scale: 1,
      opacity: 1,
      duration: 0.5,
      stagger: 0.05,
      ease: 'power2.out',
    }, '-=0.3');

    tl.to(arms, { opacity: 1, duration: 0.2 }, '-=0.3');

    tl.to(planets, {
      scale: 1,
      opacity: 1,
      duration: 0.45,
      stagger: 0.06,
      ease: 'back.out(2)',
    }, '-=0.2');

    return tl;
  }

  /** Refresh after story close */
  refresh() {
    this._paused = false;

    this.nodes.forEach(({ element, planet, ring }) => {
      const visited = this.progressManager.isVisited(planet.id);
      if (visited && !element.classList.contains('visited')) {
        element.classList.add('visited');
        ring.style.borderColor = 'rgba(255, 215, 0, 0.18)';
        ring.style.boxShadow = '0 0 6px rgba(255, 215, 0, 0.05)';
      }
    });
  }

  _darken(hex) {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 70);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 70);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 70);
    return `rgb(${r}, ${g}, ${b})`;
  }

  async exit() {
    // Kill orbits first
    this._killOrbits();

    // Stop camera tracking
    if (this._cameraTracker) {
      gsap.ticker.remove(this._cameraTracker);
      this._cameraTracker = null;
    }
    this._zoomed = false;
    this._removeFlightRocket();

    const system = this.nodesContainer.querySelector('.solar-system');
    if (!system) {
      this.container.style.display = 'none';
      return;
    }

    const planets = system.querySelectorAll('.ss-planet-node');
    const rings = system.querySelectorAll('.ss-orbit-ring');
    const star = system.querySelector('.ss-star');

    const tl = gsap.timeline();

    tl.to(planets, {
      scale: 0,
      opacity: 0,
      duration: 0.3,
      stagger: 0.03,
      ease: 'power2.in',
    });

    tl.to(rings, {
      scale: 0,
      opacity: 0,
      duration: 0.25,
      stagger: 0.03,
      ease: 'power2.in',
    }, '-=0.2');

    tl.to(star, {
      scale: 0,
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
    }, '-=0.15');

    tl.to(this.container, {
      opacity: 0,
      duration: 0.2,
    }, '-=0.1');

    await tl;

    this.container.style.display = 'none';
    this.nodesContainer.innerHTML = '';
    this.svgContainer.innerHTML = '';
    this.nodes = [];
    this.era = null;
  }
}
