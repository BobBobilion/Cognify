# Product Requirements Document: "Cognify" (Working Title)

**Version:** 1.0  
**Date:** June 30, 2025  
**Author:** Gemini  
**Status:** Draft  

---

## 1. Introduction & Executive Summary

### 1.1. Project Overview
Cognify is a cross-platform desktop app (Windows/macOS) built with Electron. It's an AI-powered productivity and learning tool that enables students, professionals, and lifelong learners to better retain information from meetings, lectures, and video content. It offers real-time transcription, AI summarization, and automatic flashcard generation for Anki and Quizlet—transforming passive listening into active learning.

### 1.2. Problem Statement
In today's information-heavy environment, students and professionals often struggle to retain insights from long meetings and lectures. Manual note-taking is inefficient and re-watching content is tedious. A tool is needed that automates knowledge capture and enhances long-term retention seamlessly.

### 1.3. Vision
Cognify aims to be an essential digital learning companion that transforms spoken content into structured, reviewable knowledge—empowering users to learn faster and more effectively.

---

## 2. Goals & Objectives

| **Goal**                         | **Objective**                                                                 | **Success Metric**                                                                 |
|----------------------------------|--------------------------------------------------------------------------------|------------------------------------------------------------------------------------|
| Enhance Learning Efficiency      | Capture and summarize key information from content                            | 20% reduction in time spent on manual review                                      |
| Streamline Study Workflow        | Export flashcards to learning platforms                                       | 50% of users export flashcards weekly                                             |
| Deliver an Unobtrusive Experience| Minimal UI that doesn't distract                                              | UI/UX rating ≥ 4.0/5.0                                                             |
| Achieve Cross-Platform Adoption  | Stable release for Windows and macOS                                          | 10,000 downloads within 6 months                                                  |

---

## 3. Target Audience

### Persona 1: The University Student ("Alex")
- **Needs:** Efficiently process long lectures, generate flashcards.
- **Pain Points:** Manual note-taking is time-consuming, lacks focus.
- **Solution:** Auto-transcription, summarized content, flashcard generation.

### Persona 2: The Remote Professional ("Maria")
- **Needs:** Recall decisions from numerous virtual meetings.
- **Pain Points:** Can't focus and take notes at the same time.
- **Solution:** Real-time transcription and searchable Q&A summaries.

---

## 4. Features & Functionality

### 4.1. Overlay Widget
- **Description:** Movable, semi-transparent UI over active apps.
- **Requirements:**
  - Triggered via global shortcut (Cmd/Ctrl+Shift+C)
  - Live audio transcript display
  - Buttons: Start/Stop, Screenshot, Notes View
  - Dark theme
  - Position memory between sessions

### 4.2. Real-Time Transcription
- **Description:** Local system audio transcription.
- **Requirements:**
  - Capture system audio (not mic-only)
  - Use OpenAI Whisper client-side
  - English support at launch

### 4.3. AI Analysis & Summarization
- **Description:** Server-side post-session insights.
- **Requirements:**
  - GPT-4o Mini used for:
    - Bullet summary
    - Key concepts
    - Action items
  - Q&A interface powered by backend

### 4.4. Flashcard Generation
- **Description:** Auto-create Anki/Quizlet study cards.
- **Requirements:**
  - Q/A and Cloze card types
  - Export to .apkg (Anki) and .txt (Quizlet)
  - Format compatibility assured

### 4.5. Main Application Dashboard
- **Description:** Manage and view session data.
- **Requirements:**
  - Session list (searchable/filterable)
  - Transcript playback and highlights
  - Summary, Q&A, flashcard preview
  - Screenshot gallery
  - Export tools
  - Settings panel
  - Users can rename meeting titles, transcriptions, and notes from the detailed session view
  - AI (summary, Q&A, etc.) generation happens only once at the beginning of a session
  - Anki/Quizlet card generation is triggered manually by the user via a 'Generate' button in the detailed view

### 4.6. Screenshot Capture
- **Description:** Enhance notes with visuals.
- **Requirements:**
  - Manual screenshots
  - AI-triggered suggestions via transcript keywords

---

## 5. Technical Requirements

- **Frontend:** Electron (Windows/macOS)
- **Backend:** Firebase
- **Authentication:** Firebase Auth (Google, Email)
- **Database:** Firestore
- **Storage:** Firebase Storage (audio/screenshots)
- **Serverless:** Cloud Functions for AI processing

### AI Services
- **Transcription:** OpenAI Whisper (local/API)
- **Summarization/QA/Flashcards:** GPT-4o Mini

### Security
- HTTPS communication
- Firestore Security Rules for data access
- API keys stored securely on backend only

---

## 6. Non-Functional Requirements

### Performance
- Overlay must use minimal memory/CPU
- Transcription must run smoothly without lag

### Usability
- Easy to use; minimal onboarding
- Logical steps from recording to flashcard export

### Reliability
- Stable under failure (e.g., offline, API error handling)

### Design
- Clean, modern dark-themed UI
- Emphasize focus and readability

---

## 7. V1.0 Release Plan

### Included
- Cross-platform overlay widget
- Client-side English transcription
- Post-session summary and flashcard generation
- Dashboard with session management and export
- Firebase backend + Google/Email login
- Manual screenshot capture

### Excluded (Future Potential)
- Real-time Q&A
- AI-driven screenshot prompts
- Multi-language support
- Custom flashcard templates
- Team collaboration
- Pre-recorded file processing

---

## 8. Success Metrics

- Weekly Active Users (WAU)
- Flashcards exported per user per week
- In-app user satisfaction score
- Free-to-paid conversion (if applicable)
- App crash/error rates

## 9. UI Requirements

### 9.1 Dashboard & Session List
- The main dashboard displays a list of session cards, each showing:
  - Session title, date, duration, and a short summary/description
  - Badges for session type (e.g., meeting, lecture, zoom, google meets, youtube, yuja)
  - Quick stats: number of screenshots and flashcards
- Session cards are clickable and open a detailed session view
- The session list supports real-time search and filtering by session type as the user types

### 9.2 Sidebar Navigation
- Sidebar includes navigation for Dashboard, Start Recording, and Settings
- Sidebar is collapsible
- User info (email, plan) is displayed at the bottom of the sidebar

### 9.3 Session Detail View
- Tabs for Transcript, Summary, Flashcards, and Screenshots
- Live transcript display with speaker names, timestamps, and scrollable history
- Q&A Assistant panel for asking questions about the session
- Export buttons for Anki and Quizlet
- Users can rename meeting titles, transcriptions, and notes directly from this page
- Anki/Quizlet card generation is triggered manually by a 'Generate' button
- AI (summary, Q&A, etc.) generation occurs only once at the beginning of the session

### 9.4 Overlay Recording UI
- Start Recording launches an overlay (not a new page or modal)
- Overlay design and behavior to be specified in detail later

### 9.5 General UI/UX
- Clean, modern, dark-themed UI
- Switchable light and dark mode (user can toggle between themes)
- Responsive layout for different screen sizes
- Emphasis on readability and minimal distraction
- Fixed set of session types (meeting, lecture, zoom, google meets, youtube, yuja)

---

## 10. Background Flow & Automation

### 10.1 Meeting Detection & Overlay Launch
- The background app automatically detects when a user joins a meeting or plays a video (Zoom, Google Meets, YouTube, Yuja, etc.).
- Upon detection, the overlay is launched without user intervention.

### 10.2 Live Session Experience
- The overlay displays live transcriptions and notes in real time.
- Users can expand the overlay to reveal a side panel with a built-in chatbot (OpenAI GPT-4o Mini).
- The chatbot's context is the current meeting's transcriptions, allowing users to ask questions about the ongoing session.

### 10.3 AI-Driven Screenshot Cues
- As the AI transcribes, it sends cues to take screenshots at key moments.
- Screenshots are taken automatically and saved for use in notes and flashcards.

### 10.4 Session Completion & Analysis
- When the meeting ends (or the user clicks "done"), the overlay closes and the full application opens.
- Transcriptions are cleaned and parsed.
- A secondary AI analyzes the session to produce detailed notes and an overall summary.

### 10.5 Flashcard Generation Loop
- In the "Flashcards" tab, users can generate Anki/Quizlet cards.
- Meeting notes are sent to OpenAI via a LangGraph workflow.
- The AI generates a file with multiple cards, which is then re-analyzed for completeness.
- If important information is missing, the process repeats until the flashcards are comprehensive.
- The cards are further checked for correctness, value, difficulty, and complexity.
- Once validated, the cards are returned to the user as a downloadable file.

---
