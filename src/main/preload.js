const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => {
    return process.versions.electron;
  },
  
  // Authentication methods
  signIn: (email, password) => ipcRenderer.invoke('sign-in', email, password),
  signUp: (email, password) => ipcRenderer.invoke('sign-up', email, password),
  signOut: () => ipcRenderer.invoke('sign-out'),
  getCurrentUser: () => ipcRenderer.invoke('get-current-user'),
  closeAuthWindow: () => ipcRenderer.invoke('close-auth-window'),
  openAuthWindow: () => ipcRenderer.invoke('open-auth-window'),
  
  // Session management
  startRecording: () => ipcRenderer.invoke('start-recording'),
  closeOverlay: () => ipcRenderer.invoke('close-overlay'),
  endSession: (sessionData) => ipcRenderer.invoke('end-session', sessionData),
  openSessionDetail: (sessionId) => ipcRenderer.invoke('open-session-detail', sessionId),
  goBack: () => ipcRenderer.invoke('go-back'),
  
  // Amplitude monitor
  openAmplitudeMonitor: () => ipcRenderer.invoke('open-amplitude-monitor'),
  startAmplitudeMonitoring: () => ipcRenderer.invoke('start-amplitude-monitoring'),
  stopAmplitudeMonitoring: () => ipcRenderer.invoke('stop-amplitude-monitoring'),
  onAmplitudeUpdate: (callback) => ipcRenderer.on('amplitude-update', (event, data) => callback(data)),
  onAmplitudeError: (callback) => ipcRenderer.on('amplitude-error', (event, data) => callback(data)),
  removeAmplitudeListeners: () => {
    ipcRenderer.removeAllListeners('amplitude-update');
    ipcRenderer.removeAllListeners('amplitude-error');
  },
  
  // Audio recording
  startAudioRecording: () => ipcRenderer.invoke('start-audio-recording'),
  stopAudioRecording: () => ipcRenderer.invoke('stop-audio-recording'),
  
  // Screenshot functionality
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
  
  // AI features
  generateFlashcards: (transcriptionText) => ipcRenderer.invoke('generate-flashcards', transcriptionText),
  generateNotes: (chunkText, chunkIndex, totalChunks) => ipcRenderer.invoke('generate-notes', chunkText, chunkIndex, totalChunks),
  generateSummary: (transcriptionText) => ipcRenderer.invoke('generate-summary', transcriptionText),
  chatWithAI: (message) => ipcRenderer.invoke('chat-with-ai', message),
  
  // Window management
  resizeWindow: (width, height) => ipcRenderer.invoke('resize-window', width, height),
  
  // Firebase Database operations
  loadUserSessions: () => ipcRenderer.invoke('load-user-sessions'),
  getSession: (sessionId) => ipcRenderer.invoke('get-session', sessionId),
  updateSession: (sessionId, updates) => ipcRenderer.invoke('update-session', sessionId, updates),
  saveFlashcards: (sessionId, flashcards) => ipcRenderer.invoke('save-flashcards', sessionId, flashcards),
  saveSummary: (sessionId, summary, keyPoints, actionItems) => ipcRenderer.invoke('save-summary', sessionId, summary, keyPoints, actionItems),
  saveNotes: (sessionId, notes) => ipcRenderer.invoke('save-notes', sessionId, notes),
  deleteSession: (sessionId) => ipcRenderer.invoke('delete-session', sessionId),
  seedSampleData: () => ipcRenderer.invoke('seed-sample-data'),
  askAIQuestion: (question, context) => ipcRenderer.invoke('ask-ai-question', question, context),
  
  // Event listeners
  onAuthStateChanged: (callback) => {
    ipcRenderer.on('auth-state-changed', (event, user) => callback(user));
  },
  
  onSessionEnded: (callback) => {
    ipcRenderer.on('session-ended', (event, sessionData) => callback(sessionData));
  },
  
  onLoadSession: (callback) => {
    ipcRenderer.on('load-session', (event, sessionId) => callback(sessionId));
  },
  
  onTranscriptionUpdate: (callback) => {
    ipcRenderer.on('transcription-update', (event, transcriptionEntry) => callback(transcriptionEntry));
  },
  
  onAudioLevelUpdate: (callback) => {
    ipcRenderer.on('audio-level-update', (event, audioLevel) => callback(audioLevel));
  },
  
  onAmplitudeUpdate: (callback) => {
    ipcRenderer.on('amplitude-update', (event, amplitudeData) => callback(amplitudeData));
  },
  
  onAmplitudeError: (callback) => {
    ipcRenderer.on('amplitude-error', (event, errorData) => callback(errorData));
  },
  
  onSessionsUpdated: (callback) => {
    ipcRenderer.on('sessions-updated', () => callback());
  },
  
  // Remove listeners
  removeAuthStateListener: () => {
    ipcRenderer.removeAllListeners('auth-state-changed');
  },
  
  removeSessionEndedListener: () => {
    ipcRenderer.removeAllListeners('session-ended');
  },
  
  removeLoadSessionListener: () => {
    ipcRenderer.removeAllListeners('load-session');
  },
  
  removeTranscriptionListener: () => {
    ipcRenderer.removeAllListeners('transcription-update');
  },
  
  removeAudioLevelListener: () => {
    ipcRenderer.removeAllListeners('audio-level-update');
  },
  
  removeAmplitudeListeners: () => {
    ipcRenderer.removeAllListeners('amplitude-update');
    ipcRenderer.removeAllListeners('amplitude-error');
  },
  
  removeSessionsUpdatedListener: () => {
    ipcRenderer.removeAllListeners('sessions-updated');
  }
}); 