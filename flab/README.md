# 🎧 BlockBeats Frontend Lab (FLAB)

A lightweight, experimental frontend for visualizing and exploring the
BlockBeats music generation platform. FLAB provides an interactive timeline
interface to browse and play blockchain-generated music.

## ✨ Features

- Interactive timeline of blockchain-generated music tracks
- Stunning 3D visualizations using Three.js and WebGL shaders
- Responsive design with polished UI animations
- Direct download access to generated music, lyrics, and reports
- Real-time visualization reacts to musical elements
- Simplified deployment via Netlify
- Zero-configuration local development

## 🛠️ Tech Stack

- Vanilla JavaScript (ES Modules)
- Three.js for 3D visualizations
- WebGL shaders for advanced visual effects
- HTML5 Audio API
- CSS animations
- Deno for local development server

## 🚀 Quick Start

For local development:

```bash
# Start the Deno file server in the current directory
deno run -A jsr:@std/http/file-server .
```

Then visit `http://localhost:4507` in your browser.

## 📦 Deployment

FLAB is configured for continuous deployment through Netlify. Simply push
changes to the repository, and Netlify will automatically build and deploy the
latest version.

## 🔍 Project Structure

- `index.html` - Main entry point with HTML structure
- `scripts.js` - JavaScript logic for timeline and visualization
- `Beats.mp3` - Sample audio for testing functionality
- `output/` - Directory for generated output files

## 📋 Integration with BlockBeats

FLAB serves as the user-facing component of the BlockBeats ecosystem, providing
a simple but effective way to experience the blockchain-generated music. It
consumes the outputs from:

1. **Indexer** - Blockchain transaction data
2. **Transaction Analysis** - Music style determination
3. **News Fetcher** - Blockchain news articles
4. **Lyrics Generator** - AI-generated lyrics
5. **Music Creator** - AI-composed music tracks
6. **Thumbnail Generator** - Album cover art

## 🚀 Future Enhancements

- Add mobile-responsive design
- Implement playlist functionality
- Integrate WebAudio API for advanced audio visualization
- Add social sharing capabilities
- Implement user accounts and favorites

## 📄 License

This project is licensed under the terms specified in the LICENSE file.