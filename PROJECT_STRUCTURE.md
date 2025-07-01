# Cognify Project Structure

This document outlines the organized folder structure for the Cognify AI-powered learning assistant.

## 📁 Directory Structure

```
Testing Startup application/
├── 📂 src/                          # Source code
│   ├── 📂 main/                    # Main process files
│   │   ├── main.js                 # Main Electron process
│   │   └── preload.js              # Preload script for security
│   ├── 📂 renderer/                # Renderer process files
│   │   └── 📂 windows/             # HTML windows
│   │       ├── index.html          # Main dashboard
│   │       ├── auth.html           # Authentication window
│   │       ├── session-detail.html # Session detail view
│   │       ├── overlay.html        # Recording overlay
│   │       └── overlay-widget.html # Overlay widget
│   ├── 📂 config/                  # Configuration files
│   │   └── firebase-config.js      # Firebase configuration
│   └── 📂 utils/                   # Utility files
│       └── test-sox.js             # Audio testing utility
├── 📂 assets/                       # Static assets
│   └── test.wav                    # Test audio file
├── 📂 docs/                         # Documentation
│   ├── PRD.md                      # Product Requirements Document
│   └── TASK_CHECKLIST.md           # Task checklist
├── 📂 temp/                         # Temporary files
│   └── audio_*.wav                 # Temporary audio recordings
├── 📂 node_modules/                 # Dependencies (auto-generated)
├── package.json                    # Project configuration
├── package-lock.json               # Lock file for dependencies
├── .env                            # Environment variables
├── README.md                       # Main project documentation
├── SETUP_GUIDE.md                  # Setup instructions
└── PROJECT_STRUCTURE.md            # This file
```

## 🏗️ Architecture Overview

### Main Process (`src/main/`)
- **main.js**: Core Electron application logic, window management, IPC handlers
- **preload.js**: Security bridge between main and renderer processes

### Renderer Process (`src/renderer/`)
- **windows/**: All HTML files for different application windows
  - Each window handles specific UI functionality
  - Self-contained with embedded CSS and JavaScript

### Configuration (`src/config/`)
- **firebase-config.js**: Firebase authentication and database setup

### Utilities (`src/utils/`)
- **test-sox.js**: Audio recording testing and validation utilities

### Assets (`assets/`)
- Static files like icons, images, and test files
- Future location for application icons and resources

### Documentation (`docs/`)
- Product requirements, technical specifications, and checklists

## 🔧 Key File Descriptions

### Core Files
| File | Purpose |
|------|---------|
| `src/main/main.js` | Main Electron process, manages all windows and core functionality |
| `src/main/preload.js` | Secure communication bridge between main and renderer |
| `src/config/firebase-config.js` | Firebase authentication and Firestore setup |

### UI Windows
| File | Purpose |
|------|---------|
| `src/renderer/windows/index.html` | Main dashboard with session list |
| `src/renderer/windows/auth.html` | Login/signup authentication form |
| `src/renderer/windows/session-detail.html` | Detailed session view with transcripts |
| `src/renderer/windows/overlay.html` | Recording overlay interface |
| `src/renderer/windows/overlay-widget.html` | Compact recording widget |

## 📋 Benefits of This Structure

### ✅ Separation of Concerns
- Main process logic separated from UI
- Configuration isolated from business logic
- Utilities organized for reusability

### ✅ Scalability
- Easy to add new windows in `src/renderer/windows/`
- Simple to extend utilities in `src/utils/`
- Clear place for new assets in `assets/`

### ✅ Maintainability
- Logical grouping makes debugging easier
- Clear file paths improve code readability
- Consistent structure across the project

### ✅ Development Workflow
- Faster file location with organized structure
- Clear responsibilities for each directory
- Easy onboarding for new developers

## 🚀 Development Guidelines

### Adding New Windows
1. Create HTML file in `src/renderer/windows/`
2. Update `main.js` to load the new window
3. Add IPC handlers if needed

### Adding Utilities
1. Create new utility files in `src/utils/`
2. Export functions for reuse across the application
3. Import in `main.js` or other files as needed

### Managing Assets
1. Place static files in `assets/`
2. Reference with relative paths from application root
3. Update paths in `main.js` for icons and resources

## 🔄 Migration Notes

The following paths were updated during reorganization:

- `main.js` → `src/main/main.js`
- HTML files → `src/renderer/windows/`
- `firebase-config.js` → `src/config/firebase-config.js`
- `test-sox.js` → `src/utils/test-sox.js`
- `test.wav` → `assets/test.wav`

All file references in `main.js` have been updated to reflect the new structure. 