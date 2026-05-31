import gsap from 'gsap';

import './index.css';

import { UNIVERSE } from './data/universe.js';
import { SpaceBackground } from './canvas/SpaceBackground.js';
import { StateManager } from './managers/StateManager.js';
import { AudioManager } from './managers/AudioManager.js';
import { ProgressManager } from './managers/ProgressManager.js';
import { EraMap } from './maps/EraMap.js';
import { PlanetMap } from './maps/PlanetMap.js';
import { LoadingScreen } from './ui/LoadingScreen.js';
import { LandingScreen } from './ui/LandingScreen.js';
import { StoryOverlay } from './ui/StoryOverlay.js';
import { NavigationUI } from './ui/NavigationUI.js';
import { warpTransition } from './utils/animations.js';

// ── Custom Space Cursor ──────────────────────────────────────────
class CursorController {
  constructor() {
    this.dot  = document.getElementById('cursor-dot');
    this.ring = document.getElementById('cursor-ring');
    if (!this.dot || !this.ring) return;

    // Actual pointer position (updated on mousemove — instant)
    this.mx = -100; this.my = -100;
    // Ring lerp position (lags slightly behind)
    this.rx = -100; this.ry = -100;

    this._bindEvents();
    this._loop();
  }

  _bindEvents() {
    // Move — dot snaps, ring lerps in rAF
    document.addEventListener('mousemove', (e) => {
      this.mx = e.clientX;
      this.my = e.clientY;
      this.dot.style.left = e.clientX + 'px';
      this.dot.style.top  = e.clientY + 'px';
      document.body.classList.remove('cursor-hidden');
    }, { passive: true });

    // Hover detection — covers all interactive elements
    const HOVER_SEL = 'a, button, [role="button"], input, select, textarea, label, '
      + '.bh-era-node, .ss-planet-node, .bh-monitor, .bh-astronaut-wrap, '
      + '.landing-begin, .story-close, #nav-back, #nav-mute, .era-desc-enter, '
      + '[style*="cursor: pointer"], [style*="cursor:pointer"]';

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(HOVER_SEL)) {
        document.body.classList.add('cursor-hover');
      }
    }, { passive: true });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(HOVER_SEL)) {
        document.body.classList.remove('cursor-hover');
      }
    }, { passive: true });

    // Click compress
    document.addEventListener('mousedown', () => {
      document.body.classList.add('cursor-click');
    }, { passive: true });

    document.addEventListener('mouseup', () => {
      document.body.classList.remove('cursor-click');
    }, { passive: true });

    // Hide when leaving the window
    document.addEventListener('mouseleave', () => {
      document.body.classList.add('cursor-hidden');
    }, { passive: true });

    document.addEventListener('mouseenter', () => {
      document.body.classList.remove('cursor-hidden');
    }, { passive: true });
  }

  _loop() {
    // Lerp ring toward pointer — 12% per frame (~60fps) for silky trail
    this.rx += (this.mx - this.rx) * 0.12;
    this.ry += (this.my - this.ry) * 0.12;
    this.ring.style.left = this.rx + 'px';
    this.ring.style.top  = this.ry + 'px';
    requestAnimationFrame(() => this._loop());
  }
}

new CursorController();
// ─────────────────────────────────────────────────────────────────


/**
 * OurUniverse — 2D Cartoon Space Level-Select App
 *
 * Flow: Loading → Landing → Era Map → Planet Map → Story Overlay
 *
 * All transitions are smooth GSAP animations.
 * Background canvas runs continuously.
 */
class OurUniverse {
  constructor() {
    this.currentEra = null;

    this._initSystems();
    this._initUI();
    this._initMaps();
    this._bindNav();
    this._start();
  }

  _initSystems() {
    this.spaceBg = new SpaceBackground();
    this.stateManager = new StateManager();
    this.audioManager = new AudioManager();
    this.progressManager = new ProgressManager();
  }

  _initUI() {
    this.loadingScreen = new LoadingScreen();
    this.landingScreen = new LandingScreen();
    this.storyOverlay = new StoryOverlay();
    this.navUI = new NavigationUI();

    // Landing → Begin
    this.landingScreen.onBegin = () => this._onBegin();

    // Nav controls
    this.navUI.onBack = () => this._onNavBack();
    this.navUI.onMute = () => this.audioManager.toggleMute();
  }

  _initMaps() {
    this.eraMap = new EraMap(this.progressManager);
    this.planetMap = new PlanetMap(this.progressManager);

    // Era clicked → show description then enter planet map
    this.eraMap.onEraClick = (era, node) => this._onEraClick(era, node);

    // Planet clicked → show story
    this.planetMap.onPlanetClick = (planet, node) => this._onPlanetClick(planet, node);
  }

  _bindNav() {
    // Keyboard: Escape to go back
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const state = this.stateManager.getState();
        if (state === 'STORY') {
          this.storyOverlay.hide();
        } else if (state === 'PLANET_MAP' || state === 'ERA_MAP') {
          this._onNavBack();
        }
      }
    });
  }

  async _start() {
    // Show loading
    this.loadingScreen.show();
    this.loadingScreen.setProgress(0.1);

    // Start background animation
    this.spaceBg.start();

    // Load audio
    try {
      await this.audioManager.load('galaxy', UNIVERSE.globalAudio.galaxyAmbient);
      this.loadingScreen.setProgress(0.5);

      const era1 = UNIVERSE.eras[0];
      if (era1.soundtrack) {
        await this.audioManager.load('era1', era1.soundtrack);
      }
      this.loadingScreen.setProgress(0.9);
    } catch (err) {
      console.warn('Audio loading error:', err);
    }

    this.loadingScreen.setProgress(1.0);

    // Brief pause at 100%
    await new Promise(r => setTimeout(r, 500));

    // Transition to landing
    await this.loadingScreen.hide();
    this.stateManager.setState('LANDING');
    await this.landingScreen.enter();
  }

  // ── Flow Handlers ──

  async _onBegin() {
    await this.landingScreen.exit();
    await warpTransition(1.0);

    this.stateManager.setState('ERA_MAP');
    await this.eraMap.enter();
    this.navUI.show('Our Universe', false);

    // Start galaxy ambient music
    this.audioManager.play('galaxy', 2);
  }

  async _onEraClick(era, node) {
    console.log('[NAV] Era clicked:', era.name);
    this.currentEra = era;

    // Show era description popup
    await this._showEraDescription(era);
  }

  _showEraDescription(era) {
    return new Promise(resolve => {
      // Create description popup
      const popup = document.createElement('div');
      popup.className = 'era-description';
      popup.id = 'era-description-popup';
      popup.innerHTML = `
        <div class="era-desc-title">${era.fullName}</div>
        <div class="era-desc-timeline">${era.timeline}</div>
        <div class="era-desc-text">
          ${era.description.map(p => `<p style="margin-bottom: 0.5rem;">${p}</p>`).join('')}
        </div>
        <button class="era-desc-enter" id="era-desc-enter-btn">Explore ✦</button>
      `;

      // Dim background
      const dimmer = document.createElement('div');
      dimmer.className = 'transition-overlay';
      dimmer.style.opacity = '0';
      dimmer.style.background = 'rgba(11, 14, 45, 0.7)';
      dimmer.style.zIndex = '40';
      dimmer.style.pointerEvents = 'auto';
      dimmer.id = 'era-dimmer';
      document.body.appendChild(dimmer);
      document.body.appendChild(popup);

      // Animate in
      gsap.to(dimmer, { opacity: 1, duration: 0.3 });
      gsap.fromTo(popup,
        { opacity: 0, scale: 0.85, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)', delay: 0.1 }
      );

      // Enter button
      document.getElementById('era-desc-enter-btn').addEventListener('click', async () => {
        // Animate out popup
        gsap.to(popup, { opacity: 0, scale: 0.9, duration: 0.3, ease: 'power2.in' });
        gsap.to(dimmer, {
          opacity: 0, duration: 0.3, delay: 0.1,
          onComplete: () => {
            popup.remove();
            dimmer.remove();
          }
        });

        // Transition to planet map
        await this._enterPlanetMap(era);
        resolve();
      });

      // Click dimmer to close (go back)
      dimmer.addEventListener('click', () => {
        gsap.to(popup, { opacity: 0, scale: 0.9, duration: 0.25 });
        gsap.to(dimmer, {
          opacity: 0, duration: 0.25,
          onComplete: () => { popup.remove(); dimmer.remove(); resolve(); }
        });
      });
    });
  }

  async _enterPlanetMap(era) {
    // Exit era map
    await this.eraMap.exit();

    // Warp transition
    await warpTransition(0.8);

    // Enter planet map
    this.stateManager.setState('PLANET_MAP', { era });
    await this.planetMap.enter(era);
    this.navUI.show(`${era.name} — ${era.timeline}`, true);

    // Crossfade audio
    if (era.soundtrack) {
      try {
        this.audioManager.crossfade('galaxy', 'era1', 2);
      } catch (e) {
        console.warn('Audio crossfade error:', e);
      }
    }
  }

  async _onPlanetClick(planet, node) {
    console.log('[NAV] Planet clicked:', planet.name);
    this.navUI.hide();

    // Fly rocket to the planet
    await this.planetMap.flyRocketToPlanet(node);

    // Zoom camera so planet is on left side of screen
    await this.planetMap.zoomToPlanet(planet, node);

    // Small delay for visual comfort
    await new Promise(r => setTimeout(r, 200));

    this.stateManager.setState('STORY', { planet });
    this.storyOverlay.show(planet, async () => {
      // On close: mark as visited, zoom out, refresh map, restore nav
      this.progressManager.markVisited(planet.id);

      // Zoom out first
      await this.planetMap.zoomOut();

      this.stateManager.setState('PLANET_MAP', { era: this.currentEra });
      this.planetMap.refresh();
      this.navUI.show(`${this.currentEra.name} — ${this.currentEra.timeline}`, true);
    });
  }

  async _onNavBack() {
    const state = this.stateManager.getState();
    console.log('[NAV] Back pressed. State:', state);

    if (state === 'PLANET_MAP') {
      // Back to era map
      this.navUI.hide();
      await this.planetMap.exit();
      await warpTransition(0.7);

      // Crossfade audio back
      try {
        this.audioManager.crossfade('era1', 'galaxy', 2);
      } catch (e) {
        console.warn('Audio crossfade error:', e);
      }

      this.stateManager.setState('ERA_MAP');
      await this.eraMap.enter();
      this.navUI.show('Our Universe', false);

    } else if (state === 'STORY') {
      this.storyOverlay.hide();
    }
  }
}

// Boot the app
new OurUniverse();
