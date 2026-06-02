import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function autoPlaylistPlugin() {
  const dir = path.resolve(__dirname, 'public/audio/EraMusicPlaylist');
  
  const generatePlaylist = () => {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp3'));
    const playlist = files.map(file => ({
      id: file.replace('.mp3', ''),
      title: file.replace('.mp3', '').replace(/_/g, ' '),
      file: `/audio/EraMusicPlaylist/${file}`
    }));
    playlist.unshift({ id: 'era1', title: 'Childhood Era', file: '/audio/era1.mp3' });
    playlist.unshift({ id: 'galaxy', title: 'Galaxy Ambient', file: '/audio/overall.mp3' });
    return playlist;
  };

  return {
    name: 'auto-playlist',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/audio/EraMusicPlaylist/playlist.json') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(generatePlaylist(), null, 2));
        } else {
          next();
        }
      });
    },
    buildStart() {
      if (fs.existsSync(dir)) {
        fs.writeFileSync(path.resolve(dir, 'playlist.json'), JSON.stringify(generatePlaylist(), null, 2));
      }
    }
  };
}

export default defineConfig({
  plugins: [autoPlaylistPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  assetsInclude: ['**/*.mp3'],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});

