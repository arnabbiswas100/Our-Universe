import gsap from 'gsap';

/**
 * NavigationUI — Cartoon-themed navigation controls
 */
export class NavigationUI {
  constructor() {
    this.container = document.getElementById('nav-ui');
    this.backBtn = document.getElementById('nav-back');
    this.muteBtn = document.getElementById('nav-mute');
    this.locationLabel = document.getElementById('nav-location');
    this.onBack = null;
    this.onMute = null;

    this.backBtn.addEventListener('click', () => {
      if (this.onBack) this.onBack();
    });

    this.muteBtn.addEventListener('click', () => {
      if (this.onMute) {
        const muted = this.onMute();
        this.muteBtn.textContent = muted ? '🔇' : '🔊';
      }
    });
  }

  show(location, showBack = true) {
    this.locationLabel.textContent = location;
    this.backBtn.style.display = showBack ? 'flex' : 'none';
    this.container.style.display = 'flex';
    gsap.fromTo(this.container,
      { opacity: 0, y: -15 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );
  }

  hide() {
    gsap.to(this.container, {
      opacity: 0,
      y: -15,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => { this.container.style.display = 'none'; }
    });
  }

  updateLocation(text) {
    gsap.to(this.locationLabel, {
      opacity: 0,
      duration: 0.15,
      onComplete: () => {
        this.locationLabel.textContent = text;
        gsap.to(this.locationLabel, { opacity: 1, duration: 0.15 });
      }
    });
  }
}
