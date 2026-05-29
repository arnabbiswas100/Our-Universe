import gsap from 'gsap';

/**
 * LoadingScreen — Cartoon-themed loading with spinning planet
 */
export class LoadingScreen {
  constructor() {
    this.container = document.getElementById('loading-screen');
    this.progressBar = document.getElementById('loading-progress');
    this.messageEl = document.getElementById('loading-message');

    this.messages = [
      'Gathering stardust...',
      'Painting planets...',
      'Igniting stars...',
      'Mapping constellations...',
      'Building your universe...',
    ];
    this.msgIndex = 0;
  }

  show() {
    this.container.style.display = 'flex';
    this.container.style.opacity = '1';
    this._cycleMessages();
  }

  setProgress(value) {
    if (this.progressBar) {
      this.progressBar.style.width = `${Math.min(100, value * 100)}%`;
    }
  }

  _cycleMessages() {
    this._msgInterval = setInterval(() => {
      this.msgIndex = (this.msgIndex + 1) % this.messages.length;
      gsap.to(this.messageEl, {
        opacity: 0,
        y: -5,
        duration: 0.2,
        onComplete: () => {
          this.messageEl.textContent = this.messages[this.msgIndex];
          gsap.fromTo(this.messageEl,
            { opacity: 0, y: 5 },
            { opacity: 1, y: 0, duration: 0.3 }
          );
        }
      });
    }, 2000);
  }

  hide() {
    if (this._msgInterval) clearInterval(this._msgInterval);
    return new Promise(resolve => {
      gsap.to(this.container, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.inOut',
        onComplete: () => {
          this.container.style.display = 'none';
          resolve();
        }
      });
    });
  }
}
