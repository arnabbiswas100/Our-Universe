import gsap from 'gsap';

/**
 * Shared animation utilities for the 2D cartoon space theme.
 */

/**
 * Fly nodes in from off-screen with stagger
 * @param {NodeList|Array} elements - DOM elements to animate in
 * @param {Object} options - { fromDirection, stagger, duration, ease }
 */
export function flyInNodes(elements, options = {}) {
  const {
    fromDirection = 'random',
    stagger = 0.08,
    duration = 0.7,
    ease = 'back.out(1.4)',
  } = options;

  const dirs = ['left', 'right', 'top', 'bottom'];

  return gsap.fromTo(elements,
    (i) => {
      const dir = fromDirection === 'random' ? dirs[Math.floor(Math.random() * 4)] : fromDirection;
      return {
        x: dir === 'left' ? -120 : dir === 'right' ? 120 : 0,
        y: dir === 'top' ? -120 : dir === 'bottom' ? 120 : 0,
        scale: 0.3,
        opacity: 0,
      };
    },
    {
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      duration,
      stagger,
      ease,
    }
  );
}

/**
 * Fly nodes out to off-screen
 */
export function flyOutNodes(elements, options = {}) {
  const {
    toDirection = 'random',
    stagger = 0.05,
    duration = 0.5,
    ease = 'power2.in',
  } = options;

  const dirs = ['left', 'right', 'top', 'bottom'];

  return gsap.to(elements, {
    x: (i) => {
      const dir = toDirection === 'random' ? dirs[Math.floor(Math.random() * 4)] : toDirection;
      return dir === 'left' ? -150 : dir === 'right' ? 150 : 0;
    },
    y: (i) => {
      const dir = toDirection === 'random' ? dirs[Math.floor(Math.random() * 4)] : toDirection;
      return dir === 'top' ? -150 : dir === 'bottom' ? 150 : 0;
    },
    scale: 0.3,
    opacity: 0,
    duration,
    stagger,
    ease,
  });
}

/**
 * Animate SVG path drawing
 */
export function drawPath(pathElement, duration = 1.0, delay = 0) {
  const length = pathElement.getTotalLength();
  pathElement.style.strokeDasharray = length;
  pathElement.style.strokeDashoffset = length;

  return gsap.to(pathElement, {
    strokeDashoffset: 0,
    duration,
    delay,
    ease: 'power2.inOut',
  });
}

/**
 * Create a smooth fade transition between two screens
 */
export function fadeTransition(outElement, inElement, options = {}) {
  const { duration = 0.6, ease = 'power2.inOut' } = options;

  return new Promise(resolve => {
    const tl = gsap.timeline({ onComplete: resolve });

    if (outElement) {
      tl.to(outElement, {
        opacity: 0,
        duration: duration * 0.5,
        ease,
        onComplete: () => { outElement.style.display = 'none'; }
      });
    }

    if (inElement) {
      tl.call(() => {
        inElement.style.display = 'flex';
        inElement.style.opacity = '0';
      });
      tl.to(inElement, {
        opacity: 1,
        duration: duration * 0.5,
        ease,
      });
    }
  });
}

/**
 * Warp-like zoom transition (replaces Three.js warp effect)
 */
export function warpTransition(duration = 1.2) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'transition-overlay';
    overlay.style.opacity = '0';
    document.body.appendChild(overlay);

    const tl = gsap.timeline({
      onComplete: () => {
        overlay.remove();
        resolve();
      }
    });

    tl.to(overlay, { opacity: 1, duration: duration * 0.4, ease: 'power2.in' });
    tl.to(overlay, { opacity: 0, duration: duration * 0.6, ease: 'power2.out' });
  });
}

/**
 * Generate a quadratic bezier curve path string between two points
 * with a control point offset for a nice curve
 */
export function createCurvedPath(x1, y1, x2, y2, curvature = 0.3) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  // Perpendicular offset for the control point
  const cpX = midX - dy * curvature;
  const cpY = midY + dx * curvature;

  return `M ${x1} ${y1} Q ${cpX} ${cpY} ${x2} ${y2}`;
}
