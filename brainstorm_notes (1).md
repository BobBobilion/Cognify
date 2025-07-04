# Project Brainstorm Notes

## Initial Concept
- The app aims to assist users in improving daily life by leveraging AI.
- Intended to be educational/productivity-focused — similar to Anki or Quizlet.
- Automatically generates flashcards from meetings or video content.

## Key Features (Chronological Brainstorm)
- A pop-up appears during a meeting or video (Zoom, Google Meet, YouTube, etc.).
- The pop-up offers note-taking and transcription.
- Users can interact with the pop-up to ask questions or see key points.
- After the session ends, the app can generate Anki/Quizlet cards from notes.
- Flashcards will adhere strictly to the required format/style of each platform.
- The app will support both real-time and post-upload processing:
  - Real-time transcription and note-taking.
  - Option to upload recorded content and generate notes/cards afterward.
- Summarization capability to provide a concise recap of key points.
- Screenshot capture of important visuals (e.g., graphs, diagrams).
- Custom templates for notes/flashcards based on user input or uploads.
- Clean, dark-themed UI for both overlay and fullscreen dashboard views.

## Additional Functional Thoughts
- Transcription occurs client-side to reduce bandwidth usage.
- Backend handles summarization, card generation, and template formatting.
- Light, real-time screenshot capture guided by AI cues in transcription.

## User Interface (UI) Considerations
- Minimal overlay: compact, semi-transparent, dark-themed UI.
- Expandable widget with interactive chat, live notes, and key moment alerts.
- Fullscreen review mode includes:
  - Notes
  - Flashcard previews
  - AI-generated summary
- No collaboration support (solo-use focus).

## AI APIs & Tools
| Tool/API         | Use Case                         | Pros                                          | Cons                                   |
|------------------|----------------------------------|-----------------------------------------------|----------------------------------------|
| OpenAI Whisper   | Transcription                    | Accurate, multi-language, client-compatible   | Small cost ($0.006/min), API rate limits |
| GPT-4o Mini      | Summarization, Q&A, Flashcards   | Fast, lightweight, consistent with OpenAI     | Slightly less powerful than full GPT-4o |
| AssemblyAI       | Transcription & summarization    | $50 free credit, full-featured suite          | Can become expensive at scale          |
| Google Cloud STT | Transcription                    | High accuracy, flexible                       | Complex setup, variable pricing        |
| Rev AI           | Transcription                    | High accuracy, optional human review          | Expensive, lacks summarization         |

## Backend Design
- Transcription and screenshot suggestion occur client-side (performance-friendly).
- Summarization, question answering, and flashcard generation handled server-side.
- Firebase used for:
  - Authentication (Google Sign-In + email/password)
  - Storage of user data and uploads
- Optional use of Cloud Functions for scalability (screenshot processing, etc.).

## Development Tools
- Flutter frontend
- Firebase backend
- Potential use of OpenAI's GPT-4o mini and Whisper APIs
- Cloud Code extension for development in VS Code

## Summary
This brainstorm outlined a productivity/learning app that leverages AI to transcribe and summarize live or recorded meetings and videos. Its standout capability is real-time flashcard generation (Anki or Quizlet format) based on live transcription and AI note analysis.

## App Overview

### UI / Functionality
- **Overlay Widget**: Small, unobtrusive UI during videos/meetings, with:
  - Live transcription display
  - Quick notes
  - Option to ask questions
- **Full Dashboard**:
  - Full summary view
  - Flashcard review and export
  - Notes and visual annotations (e.g., screenshots of key slides)
- **Dark Mode by Default**: Modern, focused design for long sessions

### Backend / Implementation
- **Transcription**:
  - Client-side using Whisper or similar (to reduce upload load)
  - Triggers screenshot capture based on keyword detection
- **AI Analysis**:
  - GPT-4o Mini summarizes content and generates flashcards post-transcription
  - Flashcards follow strict Anki/Quizlet format rules
- **Authentication**:
  - Firebase Auth for email/password + Google sign-in
- **Storage**:
  - Firebase Storage for saved recordings, notes, screenshots
- **Hosting/Scalability**:
  - Firebase Functions or GCP Cloud Run for card generation and summaries

