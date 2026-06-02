import gsap from 'gsap';

export class MusicPlayerUI {
  constructor(audioManager) {
    this.audioManager = audioManager;
    
    // DOM Elements
    this.container = document.getElementById('music-player');
    this.visualizerCanvas = document.getElementById('music-visualizer');
    this.ctx = this.visualizerCanvas.getContext('2d');
    this.titleEl = document.getElementById('music-title');
    this.playBtn = document.getElementById('music-play');
    this.prevBtn = document.getElementById('music-prev');
    this.nextBtn = document.getElementById('music-next');
    this.playlistContainer = document.getElementById('music-playlist');
    this.header = this.container.querySelector('.music-player-header');
    
    this.isExpanded = false;
    this.isVisualizing = false;
    
    // Setup listeners
    this._setupListeners();
    this._setupPlaylistUI();
    
    // Listen for track changes
    this.audioManager.onTrackChange = (trackId) => this.updateTrackInfo();
  }
  
  async _setupPlaylistUI() {
    const playlist = await this.audioManager.loadPlaylist('/audio/EraMusicPlaylist/playlist.json');
    this.playlistContainer.innerHTML = '';
    
    playlist.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'playlist-item';
      el.textContent = item.title;
      el.dataset.id = item.id;
      
      el.addEventListener('click', () => {
        this.audioManager.play(item.id, 1.5);
        this.updateTrackInfo();
      });
      
      this.playlistContainer.appendChild(el);
    });
  }
  
  _setupListeners() {
    this.playBtn.addEventListener('click', () => {
      const isPlaying = this.audioManager.togglePlayPause();
      this.playBtn.textContent = isPlaying ? '⏸' : '▶';
    });
    
    this.nextBtn.addEventListener('click', () => {
      this.audioManager.playNext();
    });
    
    this.prevBtn.addEventListener('click', () => {
      this.audioManager.playPrev();
    });
    
    this.header.addEventListener('click', (e) => {
      // Don't expand if clicking play, prev, next buttons
      if (e.target === this.playBtn || e.target === this.prevBtn || e.target === this.nextBtn) {
        return;
      }
      this.toggleExpand();
    });
    
    // Close playlist if clicking outside the widget
    document.addEventListener('click', (e) => {
      if (this.isExpanded && !this.container.contains(e.target)) {
        this.toggleExpand();
      }
    });
  }
  
  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      this.playlistContainer.style.display = 'block';
      this.container.classList.remove('music-player-collapsed');
      this.container.classList.add('music-player-expanded');
      
      gsap.fromTo(this.playlistContainer, 
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
    } else {
      gsap.to(this.playlistContainer, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          this.playlistContainer.style.display = 'none';
          this.container.classList.remove('music-player-expanded');
          this.container.classList.add('music-player-collapsed');
          // Reset inline styles for next open
          this.playlistContainer.style.height = '';
          this.playlistContainer.style.opacity = '';
        }
      });
    }
  }
  
  updateTrackInfo() {
    const info = this.audioManager.getCurrentTrackInfo();
    if (info) {
      this.titleEl.textContent = info.title;
      
      // Update active state in playlist
      const items = this.playlistContainer.querySelectorAll('.playlist-item');
      items.forEach(el => {
        if (el.dataset.id === info.id) el.classList.add('active');
        else el.classList.remove('active');
      });
    }
    this.playBtn.textContent = '⏸';
    
    if (!this.isVisualizing) {
      this.isVisualizing = true;
      this._drawVisualizer();
    }
  }
  
  _drawVisualizer() {
    if (!this.isVisualizing) return;
    requestAnimationFrame(() => this._drawVisualizer());
    
    const data = this.audioManager.getFrequencyData();
    const w = this.visualizerCanvas.width;
    const h = this.visualizerCanvas.height;
    const centerY = h / 2;
    
    this.ctx.clearRect(0, 0, w, h);
    
    if (!data) return;
    
    const barWidth = 3;
    const gap = 2;
    const bars = Math.floor(w / (barWidth + gap));
    const step = Math.floor(data.length / bars);
    
    this.ctx.lineCap = 'round';
    this.ctx.lineWidth = barWidth;
    
    for (let i = 0; i < bars; i++) {
      const value = data[i * step] || 0;
      // Soften the curve and make it symmetrical
      const percent = (value / 255) * 0.8; 
      const barHeight = Math.max(2, percent * h);
      
      this.ctx.strokeStyle = `rgba(167, 139, 250, ${0.4 + percent * 0.6})`;
      this.ctx.beginPath();
      
      const x = i * (barWidth + gap) + (barWidth / 2);
      // Draw from center upwards and downwards symmetrically
      this.ctx.moveTo(x, centerY - barHeight / 2);
      this.ctx.lineTo(x, centerY + barHeight / 2);
      this.ctx.stroke();
    }
  }
}
