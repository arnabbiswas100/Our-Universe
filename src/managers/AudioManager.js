import { Howl, Howler } from 'howler';

/**
 * AudioManager — Controls all music and SFX with crossfading
 */
export class AudioManager {
  constructor() {
    this.tracks = {};
    this.currentTrack = null;
    this.isMuted = false;
    this.masterVolume = 0.6;
  }

  load(id, src, options = {}) {
    return new Promise((resolve) => {
      const howl = new Howl({
        src: [src],
        loop: options.loop !== false,
        volume: 0,
        preload: true,
        onload: () => resolve(howl),
        onloaderror: (_, err) => {
          console.warn(`Audio load failed for ${id}:`, err);
          resolve(null);
        },
      });
      this.tracks[id] = howl;
    });
  }

  play(id, fadeIn = 2) {
    const track = this.tracks[id];
    if (!track) return;

    if (this.currentTrack && this.currentTrack !== track) {
      this.fadeOut(this._getTrackId(this.currentTrack), fadeIn);
    }

    track.play();
    track.fade(0, this.masterVolume, fadeIn * 1000);
    this.currentTrack = track;
  }

  fadeOut(id, duration = 2) {
    const track = this.tracks[id];
    if (!track) return;
    track.fade(track.volume(), 0, duration * 1000);
    setTimeout(() => track.stop(), duration * 1000);
  }

  crossfade(fromId, toId, duration = 2) {
    this.fadeOut(fromId, duration);
    setTimeout(() => this.play(toId, duration), duration * 300);
  }

  _getTrackId(howl) {
    return Object.keys(this.tracks).find(k => this.tracks[k] === howl) || null;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    Howler.mute(this.isMuted);
    return this.isMuted;
  }

  setVolume(vol) {
    this.masterVolume = vol;
    Howler.volume(vol);
  }

  dispose() {
    Object.values(this.tracks).forEach(t => {
      if (t) { t.stop(); t.unload(); }
    });
    this.tracks = {};
  }
}
