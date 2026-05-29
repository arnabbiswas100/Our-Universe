import gsap from 'gsap';
import { UNIVERSE } from '../data/universe.js';

/**
 * EraMap — Level 1 map showing all 7 eras as stars
 * orbiting around a massive black hole at the center.
 * Uses GSAP for smooth orbital motion.
 */
export class EraMap {
  constructor(progressManager) {
    this.container = document.getElementById('era-map');
    this.nodesContainer = document.getElementById('era-nodes');
    this.svgContainer = document.getElementById('era-paths');
    this.progressManager = progressManager;
    this.onEraClick = null;
    this.nodes = [];
    this.orbitTweens = [];
    this.built = false;
  }

  async enter() {
    this.container.style.display = 'block';
    this.container.style.opacity = '0';

    // Always rebuild for a fresh state
    this.nodesContainer.innerHTML = '';
    this.svgContainer.innerHTML = '';
    this._killOrbits();
    this.nodes = [];

    this._buildBlackHoleSystem();

    // Animate in
    gsap.to(this.container, { opacity: 1, duration: 0.4, ease: 'power2.out' });

    // Entrance animation
    await this._animateEntrance();

    // Start orbits
    this._startOrbits();
  }

  _buildBlackHoleSystem() {
    const eras = UNIVERSE.eras;
    const vMin = Math.min(window.innerWidth, window.innerHeight);

    // Black hole sizing
    const bhSize = vMin * 0.07;

    // Orbit sizing — spread eras across concentric rings
    const baseOrbit = vMin * 0.1;
    const orbitStep = vMin * 0.048;

    // Wrapper
    const system = document.createElement('div');
    system.className = 'bh-system';
    system.id = 'bh-system';

    // ── Black Hole ──
    const blackHole = document.createElement('div');
    blackHole.className = 'bh-core';
    blackHole.innerHTML = `
      <!-- Outer accretion glow -->
      <div class="bh-accretion-outer" style="
        width: ${bhSize * 3}px;
        height: ${bhSize * 3}px;
      "></div>
      <!-- Accretion disk -->
      <div class="bh-accretion-disk" style="
        width: ${bhSize * 2}px;
        height: ${bhSize * 0.7}px;
      "></div>
      <!-- Event horizon -->
      <div class="bh-event-horizon" style="
        width: ${bhSize}px;
        height: ${bhSize}px;
      "></div>
      <!-- Photon ring (bright inner ring) -->
      <div class="bh-photon-ring" style="
        width: ${bhSize * 1.4}px;
        height: ${bhSize * 1.4}px;
      "></div>
      <!-- Gravitational lensing glow -->
      <div class="bh-lensing" style="
        width: ${bhSize * 1.6}px;
        height: ${bhSize * 1.6}px;
      "></div>
    `;
    system.appendChild(blackHole);

    // ── Orbit Rings & Era Stars ──
    eras.forEach((era, i) => {
      const orbitRadius = baseOrbit + i * orbitStep;
      const orbitDuration = 20 + i * 8; // inner orbits faster
      const startAngle = (i * 137.5) % 360; // golden angle spread

      // Star size based on era config (kept smaller than the black hole)
      const sizePx = era.locked ? 22 : 24 + (era.starConfig.size / 10) * 18;

      const baseColor = era.starConfig.baseColor;
      const coronaColor = era.starConfig.coronaColor;
      const glowColor = era.locked ? 'rgba(100,100,150,0.15)' : coronaColor;

      // Orbit ring
      const ring = document.createElement('div');
      ring.className = 'bh-orbit-ring';
      ring.style.width = `${orbitRadius * 2}px`;
      ring.style.height = `${orbitRadius * 2}px`;
      if (!era.locked) {
        ring.style.borderColor = `${coronaColor}18`;
      }
      system.appendChild(ring);

      // Orbit arm — rotated by GSAP
      const orbitArm = document.createElement('div');
      orbitArm.className = 'bh-orbit-arm';
      orbitArm.style.width = `${orbitRadius * 2}px`;
      orbitArm.style.height = `${orbitRadius * 2}px`;
      orbitArm.style.transform = `translate(-50%, -50%) rotate(${startAngle}deg)`;

      // Era star node — positioned at top-center of orbit arm
      const node = document.createElement('div');
      node.className = `bh-era-node ${era.locked ? 'locked' : ''}`;
      node.id = `bh-era-${i}`;
      node.style.transform = `translate(-50%, -50%) rotate(${-startAngle}deg)`;

      node.innerHTML = `
        <div class="bh-era-star" style="
          width: ${sizePx}px;
          height: ${sizePx}px;
          background: radial-gradient(circle at 38% 32%,
            ${era.locked ? '#888' : '#FFF8E0'},
            ${era.locked ? '#555' : coronaColor},
            ${era.locked ? '#333' : baseColor},
            ${this._darken(era.locked ? '#333333' : baseColor)});
          box-shadow:
            0 0 ${era.locked ? '3' : sizePx * 0.5}px ${glowColor},
            0 0 ${era.locked ? '1' : sizePx}px ${glowColor}80,
            0 0 ${era.locked ? '0' : sizePx * 2}px ${glowColor}30;
        ">
          <div class="bh-era-star-shine"></div>
        </div>
        ${era.locked ? '<div class="bh-era-lock">🔒</div>' : ''}
        <div class="bh-era-badge">${i + 1}</div>
        <div class="bh-era-label">
          <span class="bh-era-name">${era.name}</span>
          <span class="bh-era-timeline">${era.timeline}</span>
        </div>
      `;

      // Click handler
      if (!era.locked) {
        node.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.onEraClick) this.onEraClick(era, node);
        });

        // Hover
        node.addEventListener('mouseenter', () => {
          gsap.to(node.querySelector('.bh-era-star'), {
            scale: 1.2,
            duration: 0.25,
            ease: 'power2.out',
          });
          const label = node.querySelector('.bh-era-label');
          label.style.opacity = '1';
          label.style.transform = 'translateX(-50%) translateY(0)';
        });

        node.addEventListener('mouseleave', () => {
          gsap.to(node.querySelector('.bh-era-star'), {
            scale: 1,
            duration: 0.25,
            ease: 'power2.out',
          });
          const label = node.querySelector('.bh-era-label');
          label.style.opacity = '0.7';
          label.style.transform = 'translateX(-50%) translateY(4px)';
        });
      }

      orbitArm.appendChild(node);
      system.appendChild(orbitArm);

      this.nodes.push({
        element: node,
        era,
        orbitArm,
        ring,
        startAngle,
        orbitDuration,
      });
    });

    this.nodesContainer.appendChild(system);
  }

  /** Start continuous orbital motion with GSAP */
  _startOrbits() {
    this.nodes.forEach(({ orbitArm, element, startAngle, orbitDuration }) => {
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
    const blackHole = this.nodesContainer.querySelector('.bh-core');
    const rings = this.nodesContainer.querySelectorAll('.bh-orbit-ring');
    const arms = this.nodesContainer.querySelectorAll('.bh-orbit-arm');
    const stars = this.nodesContainer.querySelectorAll('.bh-era-node');

    gsap.set(blackHole, { scale: 0, opacity: 0 });
    gsap.set(rings, { scale: 0, opacity: 0 });
    gsap.set(arms, { opacity: 0 });
    gsap.set(stars, { scale: 0, opacity: 0 });

    const tl = gsap.timeline();

    // Black hole appears with dramatic scaling
    tl.to(blackHole, {
      scale: 1,
      opacity: 1,
      duration: 0.9,
      ease: 'power3.out',
    });

    // Orbit rings expand outward
    tl.to(rings, {
      scale: 1,
      opacity: 1,
      duration: 0.5,
      stagger: 0.06,
      ease: 'power2.out',
    }, '-=0.4');

    tl.to(arms, { opacity: 1, duration: 0.2 }, '-=0.3');

    // Stars pop in
    tl.to(stars, {
      scale: 1,
      opacity: 1,
      duration: 0.5,
      stagger: 0.07,
      ease: 'back.out(2)',
    }, '-=0.2');

    return tl;
  }

  _darken(hex) {
    if (!hex || !hex.startsWith('#')) return 'rgb(0,0,0)';
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 60);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 60);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 60);
    return `rgb(${r}, ${g}, ${b})`;
  }

  async exit() {
    this._killOrbits();

    const system = this.nodesContainer.querySelector('.bh-system');
    if (!system) {
      this.container.style.display = 'none';
      return;
    }

    const stars = system.querySelectorAll('.bh-era-node');
    const rings = system.querySelectorAll('.bh-orbit-ring');
    const blackHole = system.querySelector('.bh-core');

    const tl = gsap.timeline();

    tl.to(stars, {
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

    tl.to(blackHole, {
      scale: 0,
      opacity: 0,
      duration: 0.3,
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
  }
}
