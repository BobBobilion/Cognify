# Firebase Integration Setup Guide

## 🔥 Overview

Cognify now includes complete Firebase integration for storing user sessions, transcripts, summaries, notes, and flashcards in the cloud. When users sign in, their documents are automatically populated from their personal Firebase storage.

## 🚀 Quick Setup

### 1. Firebase Project Setup

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Enter project name (e.g., "cognify-app")
   - Enable Google Analytics (optional)

2. **Enable Authentication**:
   - In Firebase Console → Authentication → Sign-in method
   - Enable "Email/Password" provider
   - Save changes

3. **Create Firestore Database**:
   - Go to Firestore Database → Create database
   - Start in **test mode** (for development)
   - Choose a location (preferably close to your users)

4. **Get Firebase Config**:
   - Go to Project Settings → General
   - Scroll down to "Your apps"
   - Click "Web app" (</>) icon
   - Register app with nickname "cognify-web"
   - Copy the firebaseConfig object

### 2. Environment Configuration

Update your `.env` file with the Firebase configuration:

```env
# Required for transcription
OPENAI_API_KEY=sk-your-actual-api-key-here

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com  
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

NODE_ENV=development
```

### 3. Firestore Security Rules (Production)

For production, update Firestore rules to secure user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own sessions
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && 
                        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
                   request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## 📊 Data Structure

### Session Document Schema

```javascript
{
  id: "auto-generated-id",
  userId: "firebase-user-uid", 
  title: "Session Title",
  type: "lecture|meeting|zoom|youtube|yuja|recording",
  date: "2024-01-15", // YYYY-MM-DD
  duration: "01:23:45", // HH:MM:SS
  description: "Session description",
  
  // Transcript data
  transcript: [
    {
      timestamp: "00:02:30",
      text: "Transcript text content..."
    }
  ],
  
  // AI-generated content
  summary: "AI-generated summary text",
  keyPoints: ["Key point 1", "Key point 2"],
  actionItems: ["Action 1", "Action 2"],
  
  // Flashcards
  flashcards: [
    {
      question: "What is...?",
      answer: "The answer is..."
    }
  ],
  
  // Notes
  notes: [
    {
      title: "Section Title",
      content: "<html>formatted content</html>"
    }
  ],
  
  // Screenshots
  screenshots: [
    {
      id: 1,
      timestamp: "00:05:30",
      description: "Screenshot description"
    }
  ],
  
  // Metadata
  createdAt: "Firebase Timestamp",
  updatedAt: "Firebase Timestamp"
}
```

## 🔄 How It Works

### User Authentication Flow

1. **Sign Up/Sign In**: Users authenticate via Firebase Auth
2. **Session Creation**: New sessions are automatically saved to user's Firestore collection
3. **Data Loading**: When user signs in, their sessions are loaded from Firebase
4. **Real-time Sync**: AI-generated content (flashcards, summaries, notes) is saved immediately

### Data Operations

| Operation | Description | Firebase Function |
|-----------|-------------|------------------|
| **Create Session** | Save new recording session | `firebaseDB.saveSession()` |
| **Load Sessions** | Get all user sessions | `firebaseDB.getUserSessions()` |
| **Get Session** | Retrieve specific session | `firebaseDB.getSession()` |
| **Update Session** | Modify session data | `firebaseDB.updateSession()` |
| **Save Flashcards** | Store AI-generated flashcards | `firebaseDB.updateFlashcards()` |
| **Save Summary** | Store AI-generated summary | `firebaseDB.updateSummary()` |
| **Save Notes** | Store AI-generated notes | `firebaseDB.updateNotes()` |
| **Delete Session** | Remove session permanently | `firebaseDB.deleteSession()` |

### AI Content Integration

1. **Flashcard Generation**: 
   - User clicks "Generate Flashcards" → AI creates flashcards → Saved to Firebase
   
2. **Summary Generation**: 
   - User clicks "Generate Summary" → AI analyzes transcript → Summary saved to Firebase
   
3. **Notes Generation**: 
   - User clicks "Generate Notes" → AI processes transcript chunks → Notes saved to Firebase

## 🔧 Technical Implementation

### Firebase Utilities (`src/utils/firebase-db.js`)

```javascript
// Example usage
const firebaseDB = require('./utils/firebase-db');

// Save a new session
const result = await firebaseDB.saveSession(userId, sessionData);

// Load user sessions  
const sessions = await firebaseDB.getUserSessions(userId);

// Update with AI content
await firebaseDB.updateFlashcards(sessionId, flashcards);
```

### IPC Integration

```javascript
// In renderer process (HTML/JS)
const sessions = await window.electronAPI.loadUserSessions();
await window.electronAPI.saveFlashcards(sessionId, flashcards);

// In main process (main.js)
ipcMain.handle('load-user-sessions', async (event) => {
  return await firebaseDB.getUserSessions(currentUser.uid);
});
```

## ✅ Features Included

### ✅ **Complete User Data Management**
- All sessions stored per-user in Firestore
- Automatic data sync when user signs in
- Secure access with Firebase Auth

### ✅ **AI Content Persistence**  
- Flashcards saved immediately after generation
- Summaries preserved with key points and actions
- Notes stored with full formatting

### ✅ **Session Management**
- Create, read, update, delete operations
- Search and filter capabilities
- Organized by date and type

### ✅ **Offline Fallback**
- Graceful handling when Firebase is unavailable
- Demo data for testing without connection
- Error recovery and user feedback

## 🔍 Troubleshooting

### Common Issues

1. **"User not authenticated" errors**:
   - Ensure user has signed in before accessing Firebase data
   - Check Firebase Auth configuration

2. **Permission denied errors**:
   - Verify Firestore security rules allow user access
   - Check that userId matches authenticated user

3. **Empty sessions list**:
   - Confirm user has created sessions while signed in
   - Check Firebase console for data in sessions collection

4. **AI content not saving**:
   - Verify session has valid ID (not 'demo')
   - Check browser console for Firebase errors

### Debug Logging

Enable detailed logging by checking browser console for:
- `Loaded X sessions from Firebase`
- `Flashcards saved to Firebase`
- `Summary saved to Firebase`
- `Notes saved to Firebase`

## 🚀 Next Steps

1. **Test the integration**: Sign up, create sessions, generate AI content
2. **Configure security rules**: Update Firestore rules for production
3. **Monitor usage**: Check Firebase Console for data and user activity
4. **Backup strategy**: Consider Firebase exports for data backup

## 📞 Support

For issues with Firebase integration:
1. Check browser console for error messages
2. Verify Firebase project configuration
3. Test with Firebase Console directly
4. Review Firestore security rules 