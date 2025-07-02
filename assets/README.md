# Assets Directory

This directory contains static assets for the Cognify application.

## 📁 Current Files
- `test.wav` - Test audio file for audio processing validation
- `sample_educational_transcript.md` - Sample 12-minute educational transcript on data science fundamentals for testing transcription features

## 📂 Recommended Structure

```
assets/
├── icons/           # Application icons
│   ├── icon.svg     # Main app icon (SVG)
│   ├── icon.ico     # Windows icon
│   └── icon.icns    # macOS icon
├── images/          # UI images and graphics
├── audio/           # Audio assets and samples
│   └── test.wav     # Test audio file
├── transcripts/     # Sample transcript documents
│   └── sample_educational_transcript.md
└── README.md        # This file
```

## 🔧 Usage Guidelines

### Icons
- Place application icons in `icons/` subdirectory
- Update `main.js` to reference `assets/icons/icon.svg`
- Use appropriate formats for each platform

### Images
- Store UI graphics, logos, and illustrations in `images/`
- Use descriptive filenames
- Optimize images for performance

### Audio
- Move test audio files to `audio/` subdirectory
- Store sample audio files for testing transcription

## 📝 File Naming Conventions
- Use lowercase with hyphens: `app-icon.svg`
- Include size in filename if multiple sizes: `icon-256x256.png`
- Use descriptive names: `microphone-test-sample.wav` 