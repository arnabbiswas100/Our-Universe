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
    rocketEl.innerHTML = this._createRocketSVG(44);
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
    parkedRocket.innerHTML = this._createRocketSVG(22);
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
      if (parked) {
        gsap.to(parked, {
          opacity: 0,
          scale: 0.3,
          y: -15,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => parked.remove(),
        });
      }
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

    // Get planet's current screen position
    const planetBody = node.querySelector('.ss-planet-body');
    const planetRect = planetBody.getBoundingClientRect();
    const planetCenterX = planetRect.left + planetRect.width / 2;
    const planetCenterY = planetRect.top + planetRect.height / 2;

    // We want the planet at left ~30% and vertically centered
    const targetX = window.innerWidth * 0.28;
    const targetY = window.innerHeight * 0.48;

    // How far we need to shift (in pre-scale coordinates)
    const zoomScale = 2.5;
    const shiftX = (targetX - planetCenterX) / zoomScale;
    const shiftY = (targetY - planetCenterY) / zoomScale;

    // Get current system position
    const systemRect = system.getBoundingClientRect();
    const systemCenterX = systemRect.left + systemRect.width / 2;
    const systemCenterY = systemRect.top + systemRect.height / 2;

    // Set transform origin to system center
    system.style.transformOrigin = 'center center';

    // Animate zoom
    await gsap.to(system, {
      scale: zoomScale,
      x: shiftX,
      y: shiftY,
      duration: 1.0,
      ease: 'power3.inOut',
    });

    // Start a tracker that follows the planet's orbital motion
    this._startCameraTracker(system, node, zoomScale);
  }

  /** Follow the planet's orbital movement while zoomed */
  _startCameraTracker(system, node, zoomScale) {
    if (this._cameraTracker) this._cameraTracker.kill();

    const targetXPercent = 0.28;
    const targetYPercent = 0.48;

    this._cameraTracker = gsap.ticker.add(() => {
      if (!this._zoomed) return;

      const planetBody = node.querySelector('.ss-planet-body');
      if (!planetBody) return;

      const planetRect = planetBody.getBoundingClientRect();
      const planetCenterX = planetRect.left + planetRect.width / 2;
      const planetCenterY = planetRect.top + planetRect.height / 2;

      const targetX = window.innerWidth * targetXPercent;
      const targetY = window.innerHeight * targetYPercent;

      const diffX = (targetX - planetCenterX) / zoomScale;
      const diffY = (targetY - planetCenterY) / zoomScale;

      // Smooth camera follow
      const currentX = gsap.getProperty(system, 'x') || 0;
      const currentY = gsap.getProperty(system, 'y') || 0;

      gsap.set(system, {
        x: currentX + diffX * 0.08,
        y: currentY + diffY * 0.08,
      });
    });
  }

  /** Zoom back out to the full solar system view */
  async zoomOut() {
    const system = this.nodesContainer.querySelector('.solar-system');
    if (!system) return;

    // Stop camera tracking
    if (this._cameraTracker) {
      gsap.ticker.remove(this._cameraTracker);
      this._cameraTracker = null;
    }

    this._zoomed = false;
    this._zoomedNode = null;

    // Remove flight rocket
    this._removeFlightRocket();

    // Animate zoom out
    await gsap.to(system, {
      scale: 1,
      x: 0,
      y: 0,
      duration: 0.8,
      ease: 'power3.inOut',
    });
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
