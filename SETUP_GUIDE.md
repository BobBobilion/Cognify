# Cognify Quick Setup Guide

## 🚀 Getting Transcription Working

### 1. Get Your OpenAI API Key
1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)

### 2. Configure Environment
Create a `.env` file in the project root:
```env
# Required for transcription
OPENAI_API_KEY=sk-your-actual-api-key-here

# Firebase (for authentication)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

NODE_ENV=development
```

### 3. Install Audio Recording Dependencies

**Windows:**
```bash
# Option 1: Via Chocolatey
choco install sox

# Option 2: Manual download
# Download from https://sox.sourceforge.net/
# Add to system PATH
```

**macOS:**
```bash
brew install sox
```

### 4. Test the App
```bash
npm start
```

## 🎯 Using Real-Time Transcription

1. **Launch the app** with `npm start`
2. **Sign in** with your Firebase account
3. **Press Cmd/Ctrl+Shift+C** or click "Start Recording"
4. **Click the "Start" button** in the overlay
5. **Speak** and watch the real-time transcription appear!
6. **Take screenshots** during important moments
7. **Click "Done"** to end the session and view full details

## 🤖 AI Features Available

### ✅ **Real-Time Transcription**
- Uses OpenAI Whisper for speech-to-text
- Processes audio in 5-second chunks
- Displays live in the overlay widget

### ✅ **AI Flashcard Generation**
- Go to session details → Flashcards tab
- Click "Generate Flashcards"
- Creates Q&A pairs from your transcription
- Ready for Anki/Quizlet export

### ✅ **AI Q&A Assistant**
- In session details → Transcript tab
- Ask questions about your session content
- AI responds with context from transcription

## 🔧 Troubleshooting

### "Recording failed: OpenAI API key not configured"
- Make sure your `.env` file exists
- Check that `OPENAI_API_KEY` is set correctly
- Restart the app after adding the key

### "Audio recording not available"
- Install SoX audio dependencies
- Check that your microphone permissions are enabled
- Try running as administrator (Windows)

### No transcription appearing
- Check your internet connection (Whisper API requires internet)
- Verify your OpenAI API key has credits
- Make sure you're speaking clearly into your microphone

## 💡 Tips for Best Results

- **Speak clearly** and avoid background noise
- **Use a good microphone** for better transcription accuracy
- **Take screenshots** during key moments for better flashcards
- **End sessions** properly to save transcription data
- **Ask specific questions** to the AI assistant for better responses

## 📚 Next Steps

Once transcription is working:
1. Test different session types (meetings, lectures, videos)
2. Try the flashcard generation feature
3. Use the AI Q&A assistant
4. Export flashcards to Anki or Quizlet
5. Customize the overlay position and shortcuts

Happy learning! 🎓 