import gsap from 'gsap';

/**
 * StoryOverlay — Cartoon-themed story card (no glassmorphism).
 * Solid colored panel with rounded corners and playful styling.
 */
export class StoryOverlay {
  constructor() {
    this.container = document.getElementById('story-overlay');
    this.isVisible = false;
    this.onClose = null;
  }

  show(planetData, onClose) {
    this.isVisible = true;
    this.onClose = onClose;

    // Build HTML
    this.container.innerHTML = `
      <div class="story-card">
        <button class="story-close" id="story-close-btn" aria-label="Close story">&times;</button>

        <div class="story-header">
          <div class="story-date">${planetData.date}</div>
          <h2 class="story-title">${planetData.name}</h2>
          <div class="story-tags">
            ${planetData.emotionalTags.map(t => `<span class="story-tag">${t}</span>`).join('')}
          </div>
        </div>

        <div class="story-body">
          ${planetData.story.split('\n\n').map(p =>
            p === '---'
              ? '<hr class="story-divider">'
              : `<p class="story-paragraph">${p}</p>`
          ).join('')}
        </div>

        <div class="story-quote">
          <span class="quote-mark">"</span>${planetData.quote}<span class="quote-mark">"</span>
        </div>
      </div>
    `;

    // Animate in
    this.container.style.display = 'flex';
    const card = this.container.querySelector('.story-card');
    const title = this.container.querySelector('.story-title');
    const date = this.container.querySelector('.story-date');
    const tags = this.container.querySelectorAll('.story-tag');
    const paragraphs = this.container.querySelectorAll('.story-paragraph');
    const dividers = this.container.querySelectorAll('.story-divider');
    const quote = this.container.querySelector('.story-quote');

    const tl = gsap.timeline();

    tl.fromTo(this.container, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    tl.fromTo(card,
      { x: 60, opacity: 0, scale: 0.95 },
      { x: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.2)' },
      '-=0.15'
    );
    tl.fromTo(date, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.2');
    tl.fromTo(title, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.15');
    tl.fromTo(tags, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.25, stagger: 0.04 }, '-=0.15');
    tl.fromTo(paragraphs,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.08 },
      '-=0.1'
    );
    if (dividers.length) {
      tl.fromTo(dividers, { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.3 }, '-=0.2');
    }
    tl.fromTo(quote, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.1');

    // Close button
    document.getElementById('story-close-btn').addEventListener('click', () => this.hide());
  }

  hide() {
    gsap.to(this.container.querySelector('.story-card'), {
      x: 60,
      opacity: 0,
      scale: 0.95,
      duration: 0.35,
      ease: 'power2.in',
    });
    gsap.to(this.container, {
      opacity: 0,
      duration: 0.3,
      delay: 0.15,
      onComplete: () => {
        this.container.style.display = 'none';
        this.container.innerHTML = '';
        this.isVisible = false;
        if (this.onClose) this.onClose();
      }
    });
  }
}
