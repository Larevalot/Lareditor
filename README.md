<div align="center">

# [v] LarEditor

**A lightweight, browser-based video editor built with React and FFmpeg.wasm**

[![Live Demo](https://img.shields.io/badge/Live_Demo-lareditor.vercel.app-6B8E23?style=for-the-badge&logo=vercel&logoColor=white)](https://lareditor.vercel.app/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-6B8E23?style=for-the-badge)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-6B8E23?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-6B8E23?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)

---

A fast, no-nonsense video editor for quick edits.  
No installation. No sign-up. Open and edit.

</div>

---

## Features

### Video Editing
- **Video Preview** — Real-time canvas-based preview with playback controls
- **Volume Control** — Adjust main video volume with precision
- **Multi-Track Timeline** — Set start and end times for each overlay element

### Overlays
- **Image Overlays** — Add images with full position, size, and opacity control
- **Video Overlays** — Layer videos on top of your base video
- **Text Overlays** — Customizable text with font, size, color, outline, and background options
- **Audio Overlays** — Add audio tracks with independent volume control

### Animations
- **Fade In** — Smooth opacity transition from 0% to 100%
- **Fade Out** — Smooth opacity transition from 100% to 0%
- **Configurable Duration** — Set fade duration in seconds for each overlay

### Export
- **FFmpeg.wasm Processing** — Client-side video rendering using WebAssembly
- **Progress Tracking** — Real-time export progress indicator
- **Direct Download** — Download the final video as MP4

### Interface
- **Minimalist Design** — Clean olive, black, and white color palette
- **Theme Support** — Green (default), Dark, and Light themes
- **Multi-Language** — English, Spanish, and Italian translations
- **Responsive Layout** — Optimized for desktop and mobile devices
- **Drag & Drop** — Move overlays directly on the canvas

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | CSS Variables |
| Video Processing | FFmpeg.wasm |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/lareditor.git
cd lareditor

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Build for Production

```bash
# Type check and build
pnpm build

# Preview production build
pnpm preview
```

---

## Project Structure

```
src/
├── components/
│   ├── AudioControls.tsx    # Audio file management
│   ├── ExportPanel.tsx      # Render and download controls
│   ├── MainVideo.tsx        # Volume and video settings
│   ├── OverlayManager.tsx   # Overlay creation and editing
│   ├── VideoPreview.tsx     # Canvas-based video preview
│   └── VideoUploader.tsx    # File upload with drag & drop
├── hooks/
│   └── useFFmpeg.ts         # FFmpeg.wasm integration
├── types/
│   └── index.ts             # TypeScript interfaces
├── i18n.ts                  # Multi-language translations
├── App.tsx                  # Main application component
├── App.css                  # Application styles
└── index.css                # Global styles and themes
```

---

## Usage

1. **Upload Video** — Drag and drop or click to select your base video
2. **Add Overlays** — Use the sidebar to add images, videos, text, or audio
3. **Edit Properties** — Click on any overlay to adjust position, size, timing, and animations
4. **Preview** — Use the playback controls to review your edits
5. **Export** — Click "Render Video" and wait for processing
6. **Download** — Click "Download Result" to save your edited video

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Play/Pause | Click play button |
| Seek | Drag timeline slider |
| Move Overlay | Click and drag on canvas |

---

## Browser Compatibility

LarEditor uses modern web APIs including:
- WebAssembly (FFmpeg.wasm)
- Canvas API
- File API
- Blob URLs

Supported browsers:
- Chrome 90+
- Firefox 89+
- Safari 15+
- Edge 90+

> **Note:** Mobile browsers may have limited performance due to FFmpeg.wasm resource requirements.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the GNU General Public License v3.0 — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [FFmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) — Client-side video processing
- [Vite](https://vitejs.dev/) — Fast build tooling
- [React](https://react.dev/) — UI framework

---

<div align="center">

**Built with care for people who value their time**

[Report Bug](https://github.com/your-username/lareditor/issues) · [Request Feature](https://github.com/your-username/lareditor/issues)

</div>
