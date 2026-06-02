import gsap from 'gsap';

/**
 * NavigationUI — Cartoon-themed navigation controls
 */
export class NavigationUI {
  constructor() {
    this.container = document.getElementById('nav-ui');
    this.backBtn = document.getElementById('nav-back');
    this.locationLabel = document.getElementById('nav-location');
    this.onBack = null;

    this.backBtn.addEventListener('click', () => {
      if (this.onBack) this.onBack();
    });

    this.locationLabel.addEventListener('click', (e) => {
      // Only do it for the main title, not the subtitle
      if (!this.locationLabel.classList.contains('nav-title-sub')) {
        this._triggerHearts(e);
      }
    });
  }

  show(location, showBack = true) {
    this.locationLabel.textContent = location;
    this.backBtn.style.display = showBack ? 'flex' : 'none';
    
    if (showBack) {
      this.locationLabel.classList.add('nav-title-sub');
    } else {
      this.locationLabel.classList.remove('nav-title-sub');
    }

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

  _triggerHearts(e) {
    if (this._heartAnimating) return;
    this._heartAnimating = true;

    const rect = this.locationLabel.getBoundingClientRect();
    const xCenter = rect.left + rect.width / 2;
    const yCenter = rect.top + rect.height / 2;

    const heart = document.createElement('div');
    heart.textContent = '💜';
    heart.style.position = 'fixed';
    heart.style.left = `${xCenter}px`;
    heart.style.top = `${yCenter}px`;
    heart.style.fontSize = '3.5rem';
    heart.style.pointerEvents = 'none';
    heart.style.zIndex = 20; // just behind the nav ui if it goes back up
    heart.style.transform = 'translate(-50%, -50%) scale(0)';
    document.body.appendChild(heart);

    const tl = gsap.timeline({
      onComplete: () => {
        heart.remove();
        this._heartAnimating = false;
      }
    });

    // 1. Pop out and move down below the card slowly
    tl.to(heart, {
      y: 70, // move down relative to start
      scale: 1,
      duration: 0.8,
      ease: 'power2.out'
    });

    // 2. Jiggle (rotate back and forth)
    tl.to(heart, {
      rotation: 15,
      duration: 0.1,
      yoyo: true,
      repeat: 7,
      ease: 'sine.inOut'
    });
    
    // Ensure rotation is 0 before retracting
    tl.to(heart, { rotation: 0, duration: 0.1 });

    // 3. Move back up to the card and shrink away
    tl.to(heart, {
      y: 0,
      scale: 0,
      opacity: 0,
      duration: 0.6,
      ease: 'back.in(1.5)'
    });

    // Add a little pop effect to the card itself when clicked
    gsap.fromTo(this.locationLabel, 
      { scale: 1.05 },
      { scale: 1, duration: 0.3, ease: 'back.out(2)' }
    );
  }
}
