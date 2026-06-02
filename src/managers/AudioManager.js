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
    
    // Playlist and Web Audio API
    this.playlist = [];
    this.audioCtx = null;
    this.analyser = null;
    this.masterGain = null;
    this.freqData = null;
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

    this._initWebAudio(id); // Ensure Web Audio API is initialized

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
    
    if (this.onTrackChange) {
      this.onTrackChange(id);
    }
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

  // ── Web Audio API & Playlist Methods ──

  _initWebAudio(trackId) {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128; // gives 64 frequency bins
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    }
    
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    
    // Connect track to masterGain if not already connected
    const track = this.tracks[trackId];
    if (track && !track._connectedToWebAudio) {
      try {
        const source = this.audioCtx.createMediaElementSource(track);
        source.connect(this.masterGain);
        track._connectedToWebAudio = true;
      } catch (e) {
        console.warn('Failed to connect WebAudio for track', trackId, e);
      }
    }
  }

  getFrequencyData() {
    if (!this.analyser || !this.freqData) return null;
    this.analyser.getByteFrequencyData(this.freqData);
    return this.freqData;
  }

  async loadPlaylist(url) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      this.playlist = data; // Array of { id, title, file }
      for (const item of data) {
        await this.load(item.id, item.file);
      }
      return this.playlist;
    } catch (e) {
      console.warn('Failed to load playlist from', url, e);
      return [];
    }
  }

  playNext() {
    if (!this.playlist || this.playlist.length === 0) return;
    const currentIndex = this.playlist.findIndex(t => t.id === this.currentTrackId);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= this.playlist.length || nextIndex < 0) nextIndex = 0;
    this.crossfade(this.currentTrackId, this.playlist[nextIndex].id, 1.5);
  }

  playPrev() {
    if (!this.playlist || this.playlist.length === 0) return;
    const currentIndex = this.playlist.findIndex(t => t.id === this.currentTrackId);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = this.playlist.length - 1;
    this.crossfade(this.currentTrackId, this.playlist[prevIndex].id, 1.5);
  }

  togglePlayPause() {
    const track = this.tracks[this.currentTrackId];
    if (!track) return false;
    
    if (track.paused) {
      this.play(this.currentTrackId, 0.5); // Quick fade in
      return true;
    } else {
      this.fadeOut(this.currentTrackId, 0.5);
      // Wait for fadeout before pausing it internally handled by fadeOut
      return false;
    }
  }

  isPlaying() {
    const track = this.tracks[this.currentTrackId];
    return track ? !track.paused : false;
  }

  getCurrentTrackInfo() {
    if (!this.currentTrackId) return null;
    const track = this.playlist.find(t => t.id === this.currentTrackId);
    return track || { id: this.currentTrackId, title: this.currentTrackId };
  }

  /** Dispose all tracks */
  dispose() {
    Object.entries(this._fadeIntervals).forEach(([, interval]) => clearInterval(interval));
    this._fadeIntervals = {};
    Object.values(this.tracks).forEach((t) => {
      if (t) { t.pause(); t.src = ''; }
    });
    this.tracks = {};
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
