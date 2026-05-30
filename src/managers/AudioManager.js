/**
 * AudioManager — Controls all music with crossfading
 * Uses native HTML Audio API (no Howler dependency)
 * for maximum compatibility across deployment environments.
 */
export class AudioManager {
  constructor() {
    this.tracks = {};
    this.currentTrackId = null;
    this.isMuted = false;
    this.masterVolume = 0.6;
    this._fadeIntervals = {};
  }

  /** Load an audio track by id and src */
  load(id, src) {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.loop = true;
      audio.volume = 0;

      audio.addEventListener('canplaythrough', () => resolve(audio), { once: true });
      audio.addEventListener('error', (e) => {
        console.warn(`Audio load failed for ${id}:`, e);
        resolve(null);
      }, { once: true });

      audio.src = src;
      this.tracks[id] = audio;
    });
  }

  /** Play a track with fade-in */
  play(id, fadeIn = 2) {
    const track = this.tracks[id];
    if (!track) return;

    // Stop current track if different
    if (this.currentTrackId && this.currentTrackId !== id) {
      this.fadeOut(this.currentTrackId, fadeIn);
    }

    track.currentTime = track.currentTime || 0;
    track.volume = 0;

    const playPromise = track.play();
    if (playPromise) {
      playPromise.catch((err) => {
        console.warn(`Audio play blocked for ${id}:`, err);
      });
    }

    this._fade(id, 0, this.masterVolume, fadeIn * 1000);
    this.currentTrackId = id;
  }

  /** Fade out a track and stop it */
  fadeOut(id, duration = 2) {
    const track = this.tracks[id];
    if (!track) return;

    this._fade(id, track.volume, 0, duration * 1000, () => {
      track.pause();
    });
  }

  /** Crossfade from one track to another */
  crossfade(fromId, toId, duration = 2) {
    this.fadeOut(fromId, duration);
    // Start the new track slightly before the old one fully fades
    setTimeout(() => this.play(toId, duration), duration * 300);
  }

  /** Smooth volume fade using intervals */
  _fade(id, from, to, duration, onComplete) {
    const track = this.tracks[id];
    if (!track) return;

    // Clear any existing fade on this track
    if (this._fadeIntervals[id]) {
      clearInterval(this._fadeIntervals[id]);
    }

    const steps = 30;
    const stepTime = duration / steps;
    const volumeStep = (to - from) / steps;
    let currentStep = 0;

    track.volume = Math.max(0, Math.min(1, from));

    this._fadeIntervals[id] = setInterval(() => {
      currentStep++;
      const newVol = from + volumeStep * currentStep;
      track.volume = Math.max(0, Math.min(1, newVol));

      if (currentStep >= steps) {
        clearInterval(this._fadeIntervals[id]);
        delete this._fadeIntervals[id];
        track.volume = Math.max(0, Math.min(1, to));
        if (onComplete) onComplete();
      }
    }, stepTime);
  }

  /** Toggle mute/unmute */
  toggleMute() {
    this.isMuted = !this.isMuted;
    Object.values(this.tracks).forEach((track) => {
      if (track) track.muted = this.isMuted;
    });
    return this.isMuted;
  }

  /** Set master volume */
  setVolume(vol) {
    this.masterVolume = vol;
    if (this.currentTrackId && this.tracks[this.currentTrackId]) {
      this.tracks[this.currentTrackId].volume = vol;
    }
  }

  /** Dispose all tracks */
  dispose() {
    Object.entries(this._fadeIntervals).forEach(([, interval]) => clearInterval(interval));
    this._fadeIntervals = {};
    Object.values(this.tracks).forEach((t) => {
      if (t) { t.pause(); t.src = ''; }
    });
    this.tracks = {};
  }
}
