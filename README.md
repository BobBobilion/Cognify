# Cognify - AI-Powered Learning Assistant

Cognify is an innovative Electron-based desktop application that transforms your learning experience by automatically capturing, transcribing, and enhancing educational content with AI-powered insights.

## 🚀 Features

### Core Functionality
- **Real-time Audio Transcription**: Automatically transcribe audio from meetings, lectures, and videos using OpenAI Whisper
- **AI-Generated Content**: Create flashcards, summaries, and comprehensive notes from transcriptions
- **Cross-Platform Audio Monitoring**: Advanced audio monitoring with visual amplitude feedback
- **Session Management**: Organize and manage all your learning sessions in one place

### Smart Authentication
- **Landing Page Experience**: Beautiful welcome page for new users
- **Firebase Authentication**: Secure user authentication and session management
- **Automatic Navigation**: Seamless transitions between auth and main application

### User Interface
- **Modern Design**: Clean, professional interface with dark/light theme support
- **Responsive Layout**: Optimized for various screen sizes
- **Intuitive Navigation**: Easy-to-use sidebar navigation and session organization

## 🛠️ Technology Stack

- **Frontend**: HTML, CSS, JavaScript (Electron Renderer)
- **Backend**: Node.js (Electron Main Process)
- **Audio Processing**: SoX, Audify cross-platform audio monitoring
- **AI Services**: OpenAI GPT-4 and Whisper APIs
- **Authentication**: Firebase Auth
- **Desktop Framework**: Electron

## 📋 Prerequisites

Before running Cognify, ensure you have:

1. **Node.js** (v16 or higher)
2. **npm** or **yarn** package manager
3. **SoX** audio processing toolkit
4. **OpenAI API Key**
5. **Firebase Configuration**

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/cognify.git
   cd cognify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   FIREBASE_APP_ID=your_firebase_app_id
   ```

4. **Install SoX** (for audio processing)
   - **Windows**: Download from [SoX official site](http://sox.sourceforge.net/)
   - **macOS**: `brew install sox`
   - **Linux**: `sudo apt-get install sox` or equivalent

## 🚀 Usage

### Development Mode
```bash
npm start
```

### Build for Production
```bash
npm run build
```

### Package for Distribution
```bash
npm run package
```

## 📁 Project Structure

```
cognify/
├── src/
│   ├── main/
│   │   ├── main.js          # Main Electron process
│   │   └── preload.js       # IPC bridge
│   ├── renderer/
│   │   └── windows/
│   │       ├── auth.html    # Authentication landing page
│   │       ├── index.html   # Main dashboard
│   │       └── *.html       # Other application windows
│   ├── config/
│   │   └── firebase-config.js  # Firebase configuration
│   └── utils/
│       └── *.js             # Utility modules
├── docs/                    # Documentation files
├── assets/                  # Static assets
└── package.json
```

## 🔑 Key Features in Detail

### Authentication Flow
- **Landing Page**: New users see a beautiful welcome page with feature highlights
- **Secure Sign-in**: Firebase-powered authentication with email/password
- **Automatic Redirects**: Seamless navigation between auth and main app

### Audio Processing
- **Real-time Monitoring**: Visual amplitude monitoring with Audify
- **High-Quality Recording**: Professional audio capture with SoX
- **Smart Transcription**: Chunked processing for real-time feedback

### AI Integration
- **Smart Summaries**: Comprehensive session summaries with key points and action items
- **Auto-Generated Flashcards**: Educational flashcards from transcribed content
- **Structured Notes**: Well-formatted notes with HTML structure

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

If you encounter any issues or have questions:

1. Check the [documentation](./docs/)
2. Search existing [issues](https://github.com/your-username/cognify/issues)
3. Create a new issue if needed

## 🎯 Roadmap

- [ ] Mobile companion app
- [ ] Integration with popular video platforms
- [ ] Advanced AI tutoring features
- [ ] Collaborative learning sessions
- [ ] Plugin system for extensions

---

**Made with ❤️ for learners everywhere** 