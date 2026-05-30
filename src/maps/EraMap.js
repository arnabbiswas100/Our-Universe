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
    const bhSize = vMin * 0.11;

    // Orbit sizing — spread eras across concentric rings
    const baseOrbit = vMin * 0.14;
    const orbitStep = vMin * 0.055;

    // Wrapper
    const system = document.createElement('div');
    system.className = 'bh-system';
    system.id = 'bh-system';

    // ── Black Hole ──
    const blackHole = document.createElement('div');
    blackHole.className = 'bh-core';
    blackHole.innerHTML = `
      <!-- Outer pulse halo 3 (largest) -->
      <div class="bh-pulse-halo bh-pulse-halo--3" style="
        width: ${bhSize * 3.6}px;
        height: ${bhSize * 3.6}px;
      "></div>
      <!-- Outer pulse halo 2 -->
      <div class="bh-pulse-halo bh-pulse-halo--2" style="
        width: ${bhSize * 2.8}px;
        height: ${bhSize * 2.8}px;
      "></div>
      <!-- Outer pulse halo 1 -->
      <div class="bh-pulse-halo bh-pulse-halo--1" style="
        width: ${bhSize * 2.1}px;
        height: ${bhSize * 2.1}px;
      "></div>
      <!-- Event horizon -->
      <div class="bh-event-horizon" style="
        width: ${bhSize}px;
        height: ${bhSize}px;
      "></div>
      <!-- Photon ring (bright inner ring) -->
      <div class="bh-photon-ring" style="
        width: ${bhSize * 1.35}px;
        height: ${bhSize * 1.35}px;
      "></div>
      <!-- Gravitational lensing glow -->
      <div class="bh-lensing" style="
        width: ${bhSize * 1.6}px;
        height: ${bhSize * 1.6}px;
      "></div>
    `;
    system.appendChild(blackHole);

    // ── Floating Astronaut (bottom-right) ──
    const astronautWrap = document.createElement('div');
    astronautWrap.className = 'bh-astronaut-wrap';
    astronautWrap.innerHTML = this._createWelcomeAstronaut();
    
    // Make astronaut interactive: click to wave and say hi
    astronautWrap.style.pointerEvents = 'auto'; // allow clicks
    astronautWrap.style.cursor = 'pointer';
    
    astronautWrap.addEventListener('click', (e) => {
      e.stopPropagation();
      const arm = astronautWrap.querySelector('.bh-right-arm');
      const bubble = astronautWrap.querySelector('.bh-speech-bubble');
      if (!arm || !bubble) return;
      
      // Prevent overlapping clicks
      if (arm.classList.contains('waving')) return;
      
      arm.classList.add('waving');
      bubble.classList.add('show');
      
      // Stop waving after 3 seconds
      setTimeout(() => {
        arm.classList.remove('waving');
        bubble.classList.remove('show');
      }, 3000);
    });
    
    this.nodesContainer.appendChild(astronautWrap);

    // ── Orbit Rings & Era Stars ──
    eras.forEach((era, i) => {
      const orbitRadius = baseOrbit + i * orbitStep;
      const orbitDuration = 20 + i * 8; // inner orbits faster
      const startAngle = (i * 137.5) % 360; // golden angle spread

      // Star size based on era config (same size for locked and unlocked)
      const sizePx = 32 + (era.starConfig.size / 10) * 22;

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
        ${era.locked ? '<div class="bh-era-lock">🔒</div><div class="bh-era-coming-soon">Coming Soon...</div>' : ''}
        <div class="bh-era-badge">${i + 1}</div>
        <div class="bh-era-label">
          <span class="bh-era-name">${era.name}</span>
          <span class="bh-era-timeline">${era.timeline}</span>
        </div>
      `;

      // Click handler
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!era.locked) {
          if (this.onEraClick) this.onEraClick(era, node);
        } else {
          // Locked star interaction
          const starBody = node.querySelector('.bh-era-star');
          const comingSoon = node.querySelector('.bh-era-coming-soon');
          
          if (starBody.classList.contains('rejecting')) return;
          starBody.classList.add('rejecting');
          
          // Shake and glow red
          gsap.timeline({ onComplete: () => starBody.classList.remove('rejecting') })
            .to(starBody, {
              boxShadow: `0 0 ${sizePx * 1.5}px rgba(255, 50, 50, 0.8)`,
              x: -4, duration: 0.05, ease: 'power1.inOut'
            })
            .to(starBody, { x: 4, duration: 0.05, yoyo: true, repeat: 3 })
            .to(starBody, { x: 0, duration: 0.05 })
            .to(starBody, {
              boxShadow: `0 0 3px ${glowColor}, 0 0 1px ${glowColor}80, 0 0 0px ${glowColor}30`,
              duration: 0.4
            }, '+=0.2');

          // Show coming soon message
          gsap.fromTo(comingSoon, 
            { opacity: 0, y: 10, scale: 0.8 },
            { opacity: 1, y: -sizePx - 10, scale: 1, duration: 0.3, ease: 'back.out(2)' }
          );
          gsap.to(comingSoon, { opacity: 0, y: -sizePx - 20, duration: 0.3, delay: 1.5 });
        }
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

  /** Detailed floating astronaut with welcome sign for the era map */
  _createWelcomeAstronaut() {
    return `
      <div class="bh-astronaut">
        <!-- Rope from corner -->
        <svg class="bh-rope" width="120" height="100" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M 118 2 Q 90 30 70 60 Q 55 80 48 92" stroke="#C8B89A" stroke-width="2.2"
            fill="none" stroke-dasharray="4 3" stroke-linecap="round" opacity="0.85"/>
        </svg>

        <!-- Astronaut SVG -->
        <svg class="bh-astronaut-svg" width="110" height="160" viewBox="0 0 110 160" xmlns="http://www.w3.org/2000/svg">
          <!-- Boots -->
          <rect x="28" y="138" width="22" height="14" rx="7" fill="#7F8C8D"/>
          <rect x="60" y="138" width="22" height="14" rx="7" fill="#7F8C8D"/>
          <!-- Boot detail -->
          <rect x="30" y="144" width="18" height="4" rx="2" fill="#5D6D7E"/>
          <rect x="62" y="144" width="18" height="4" rx="2" fill="#5D6D7E"/>

          <!-- Legs -->
          <rect x="32" y="108" width="16" height="34" rx="8" fill="#ECF0F1"/>
          <rect x="62" y="108" width="16" height="34" rx="8" fill="#ECF0F1"/>
          <!-- Leg joint rings -->
          <rect x="30" y="120" width="20" height="5" rx="2.5" fill="#BDC3C7"/>
          <rect x="60" y="120" width="20" height="5" rx="2.5" fill="#BDC3C7"/>

          <!-- Body suit -->
          <rect x="22" y="62" width="66" height="52" rx="16" fill="#ECF0F1"/>
          <!-- Chest panel -->
          <rect x="34" y="74" width="42" height="28" rx="6" fill="#D5D8DC"/>
          <!-- Control buttons -->
          <circle cx="44" cy="82" r="4" fill="#E74C3C"/>
          <circle cx="55" cy="82" r="4" fill="#F39C12"/>
          <circle cx="66" cy="82" r="4" fill="#27AE60"/>
          <!-- Screen -->
          <rect x="36" y="90" width="38" height="8" rx="3" fill="#2C3E50"/>
          <rect x="38" y="92" width="12" height="4" rx="1" fill="#27AE60" opacity="0.8"/>

          <!-- Life support backpack (drawn on back, shown as side rect) -->
          <rect x="10" y="66" width="14" height="36" rx="7" fill="#BDC3C7"/>
          <rect x="12" y="74" width="10" height="6" rx="3" fill="#95A5A6"/>
          <rect x="12" y="84" width="10" height="6" rx="3" fill="#95A5A6"/>

          <!-- Shoulder rings -->
          <rect x="18" y="62" width="16" height="8" rx="4" fill="#BDC3C7"/>
          <rect x="76" y="62" width="16" height="8" rx="4" fill="#BDC3C7"/>

          <!-- Left arm (up, holding sign) -->
          <rect x="8" y="48" width="16" height="36" rx="8" fill="#ECF0F1"/>
          <rect x="6" y="58" width="20" height="6" rx="3" fill="#BDC3C7"/>
          <!-- Left glove -->
          <ellipse cx="16" cy="46" rx="10" ry="9" fill="#7F8C8D"/>
          <!-- Glove fingers suggestion -->
          <line x1="10" y1="40" x2="8" y2="35" stroke="#5D6D7E" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="16" y1="38" x2="15" y2="33" stroke="#5D6D7E" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="22" y1="40" x2="23" y2="35" stroke="#5D6D7E" stroke-width="2.5" stroke-linecap="round"/>

          <!-- Right arm (relaxed) -->
          <g class="bh-right-arm" style="transform-origin: 94px 72px;">
            <rect x="86" y="68" width="16" height="32" rx="8" fill="#ECF0F1"/>
            <rect x="84" y="74" width="20" height="6" rx="3" fill="#BDC3C7"/>
            <!-- Right glove -->
            <ellipse cx="94" cy="102" rx="10" ry="9" fill="#7F8C8D"/>
          </g>

          <!-- Neck ring -->
          <rect x="38" y="52" width="34" height="12" rx="6" fill="#BDC3C7"/>

          <!-- Helmet -->
          <circle cx="55" cy="36" r="30" fill="#ECF0F1"/>
          <!-- Helmet visor -->
          <ellipse cx="55" cy="38" rx="19" ry="17" fill="#1A252F"/>
          <!-- Visor reflection -->
          <ellipse cx="47" cy="30" rx="6" ry="4" fill="rgba(255,255,255,0.25)" transform="rotate(-20 47 30)"/>
          <ellipse cx="60" cy="28" rx="3" ry="2" fill="rgba(255,255,255,0.15)" transform="rotate(-10 60 28)"/>
          <!-- Stars visible in visor -->
          <circle cx="52" cy="36" r="1" fill="rgba(255,255,255,0.6)"/>
          <circle cx="60" cy="32" r="0.8" fill="rgba(255,255,255,0.5)"/>
          <circle cx="57" cy="42" r="0.7" fill="rgba(255,255,255,0.4)"/>
          <!-- Helmet rim -->
          <circle cx="55" cy="36" r="30" fill="none" stroke="#BDC3C7" stroke-width="2.5"/>
          <!-- Antenna -->
          <line x1="72" y1="12" x2="80" y2="4" stroke="#BDC3C7" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="80" cy="4" r="3.5" fill="#E74C3C"/>
          <circle cx="80" cy="4" r="1.5" fill="#FF6B6B"/>
          <!-- Second antenna -->
          <line x1="38" y1="10" x2="30" y2="3" stroke="#BDC3C7" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="30" cy="3" r="2.5" fill="#F39C12"/>

          <!-- Helmet top ring -->
          <ellipse cx="55" cy="8" rx="18" ry="5" fill="none" stroke="#BDC3C7" stroke-width="1.5"/>
        </svg>

        <!-- Cardboard sign (held by left hand) -->
        <div class="bh-cardboard">
          <div class="bh-cardboard-inner">
            <span class="bh-cardboard-text">Welcome to my Universe</span>
            <span class="bh-cardboard-sub">I am Arnab</span>
            <span class="bh-cardboard-hint">Select a star to begin ✦</span>
          </div>
        </div>

        <!-- Speech bubble -->
        <div class="bh-speech-bubble">Hi! 🚀</div>
      </div>
    `;
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
