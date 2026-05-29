import gsap from 'gsap';

/**
 * LandingScreen — Cartoon-themed "Our Universe" title screen
 * Vibrant animated landing with Begin button
 */
export class LandingScreen {
  constructor() {
    this.container = document.getElementById('landing-screen');
    this.onBegin = null;
  }

  async enter() {
    this.container.style.display = 'flex';
    this.container.style.opacity = '1';

    const title = this.container.querySelector('.landing-title');
    const subtitle = this.container.querySelector('.landing-subtitle');
    const dedication = this.container.querySelector('.landing-dedication');
    const btn = this.container.querySelector('.landing-begin');

    // Reset for animation
    [title, subtitle, dedication, btn].forEach(el => {
      if (el) gsap.set(el, { opacity: 0, y: 25 });
    });

    const tl = gsap.timeline();
    tl.to(title, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' });
    tl.to(subtitle, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.5');
    tl.to(dedication, { opacity: 0.7, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3');
    tl.to(btn, { opacity: 1, y: 0, duration: 0.7, ease: 'back.out(1.7)' }, '-=0.2');

    // Begin button click
    btn.onclick = () => {
      if (this.onBegin) this.onBegin();
    };
  }

  async exit() {
    return new Promise(resolve => {
      const title = this.container.querySelector('.landing-title');
      const tl = gsap.timeline({
        onComplete: () => {
          this.container.style.display = 'none';
          resolve();
        }
      });

      // Title zooms up and fades
      tl.to(title, { scale: 1.5, opacity: 0, duration: 0.6, ease: 'power2.in' });
      tl.to(this.container, { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, '-=0.3');
    });
  }
}
