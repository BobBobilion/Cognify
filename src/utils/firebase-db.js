const { db } = require('../config/firebase-config');
const { collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, onSnapshot } = require('firebase/firestore');

// Sessions collection operations
class FirebaseDB {
  constructor() {
    this.sessionsCollection = 'sessions';
    this.flashcardRequestsCollection = 'flashcard-requests';
  }

  // Create a new session
  async saveSession(userId, sessionData) {
    try {
      const sessionRef = doc(collection(db, this.sessionsCollection));
      const sessionWithMetadata = {
        ...sessionData,
        userId: userId,
        id: sessionRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(sessionRef, sessionWithMetadata);
      return { success: true, sessionId: sessionRef.id };
    } catch (error) {
      console.error('Error saving session:', error);
      return { success: false, error: error.message };
    }
  }

  // Update an existing session
  async updateSession(sessionId, updates) {
    try {
      const sessionRef = doc(db, this.sessionsCollection, sessionId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(sessionRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating session:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all sessions for a user
  async getUserSessions(userId) {
    try {
      const q = query(
        collection(db, this.sessionsCollection),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const sessions = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Firestore timestamps to JavaScript dates
        sessions.push({
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString(),
          updatedAt: data.updatedAt?.toDate()?.toISOString()
        });
      });
      
      return { success: true, sessions };
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return { success: false, error: error.message, sessions: [] };
    }
  }

  // Get a specific session
  async getSession(sessionId) {
    try {
      const sessionRef = doc(db, this.sessionsCollection, sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        const data = sessionSnap.data();
        return {
          success: true,
          session: {
            ...data,
            createdAt: data.createdAt?.toDate()?.toISOString(),
            updatedAt: data.updatedAt?.toDate()?.toISOString()
          }
        };
      } else {
        return { success: false, error: 'Session not found' };
      }
    } catch (error) {
      console.error('Error getting session:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete a session
  async deleteSession(sessionId) {
    try {
      await deleteDoc(doc(db, this.sessionsCollection, sessionId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting session:', error);
      return { success: false, error: error.message };
    }
  }

  // Update session transcript
  async updateTranscript(sessionId, transcript) {
    return this.updateSession(sessionId, { transcript });
  }

  // Update session summary
  async updateSummary(sessionId, summary, keyPoints, actionItems) {
    return this.updateSession(sessionId, { 
      summary, 
      keyPoints, 
      actionItems 
    });
  }

  // Update session notes
  async updateNotes(sessionId, notes) {
    return this.updateSession(sessionId, { notes });
  }

  // Update session flashcards
  async updateFlashcards(sessionId, flashcards) {
    return this.updateSession(sessionId, { flashcards });
  }

  // Add screenshot to session
  async addScreenshot(sessionId, screenshot) {
    try {
      const sessionResult = await this.getSession(sessionId);
      if (!sessionResult.success) {
        return sessionResult;
      }

      const currentScreenshots = sessionResult.session.screenshots || [];
      const updatedScreenshots = [...currentScreenshots, screenshot];
      
      return this.updateSession(sessionId, { screenshots: updatedScreenshots });
    } catch (error) {
      console.error('Error adding screenshot:', error);
      return { success: false, error: error.message };
    }
  }

  // Update session chat history
  async updateChatHistory(sessionId, chatHistory) {
    try {
      const chatHistoryWithTimestamps = chatHistory.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
      }));
      
      return this.updateSession(sessionId, { chatHistory: chatHistoryWithTimestamps });
    } catch (error) {
      console.error('Error updating chat history:', error);
      return { success: false, error: error.message };
    }
  }

  // Get chat history for a session
  async getChatHistory(sessionId) {
    try {
      const sessionResult = await this.getSession(sessionId);
      if (!sessionResult.success) {
        return { success: false, error: sessionResult.error };
      }

      const chatHistory = sessionResult.session.chatHistory || [];
      
      // Convert timestamp strings back to Date objects for consistency
      const chatHistoryWithDates = chatHistory.map(msg => ({
        ...msg,
        timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
      }));

      return { success: true, chatHistory: chatHistoryWithDates };
    } catch (error) {
      console.error('Error getting chat history:', error);
      return { success: false, error: error.message };
    }
  }

  // === ASYNC FLASHCARD GENERATION METHODS ===

  // Create a new flashcard generation request
  async createFlashcardRequest(sessionId, sessionData) {
    try {
      const requestRef = doc(collection(db, this.flashcardRequestsCollection));
      const requestData = {
        id: requestRef.id,
        sessionId: sessionId,
        sessionTitle: sessionData.title || 'Untitled Session',
        transcript: sessionData.transcript || [],
        status: 'processing', // processing, completed, failed
        progress: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        results: null,
        error: null,
        metadata: {
          transcriptLength: sessionData.transcript ? sessionData.transcript.length : 0,
          processingStarted: new Date().toISOString()
        }
      };
      
      await setDoc(requestRef, requestData);
      console.log(`✅ Created flashcard request: ${requestRef.id} for session: ${sessionId}`);
      
      return { success: true, requestId: requestRef.id };
    } catch (error) {
      console.error('Error creating flashcard request:', error);
      return { success: false, error: error.message };
    }
  }

  // Update flashcard request status and progress
  async updateFlashcardRequest(requestId, updates) {
    try {
      const requestRef = doc(db, this.flashcardRequestsCollection, requestId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(requestRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating flashcard request:', error);
      return { success: false, error: error.message };
    }
  }

  // Complete flashcard request with results
  async completeFlashcardRequest(requestId, flashcards, metadata = {}) {
    try {
      const updates = {
        status: 'completed',
        progress: 100,
        results: {
          flashcards: flashcards,
          count: flashcards.length,
          completedAt: new Date().toISOString(),
          ...metadata
        },
        error: null
      };
      
      const result = await this.updateFlashcardRequest(requestId, updates);
      console.log(`✅ Completed flashcard request: ${requestId} with ${flashcards.length} flashcards`);
      
      return result;
    } catch (error) {
      console.error('Error completing flashcard request:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark flashcard request as failed
  async failFlashcardRequest(requestId, errorMessage) {
    try {
      const updates = {
        status: 'failed',
        error: errorMessage,
        completedAt: new Date().toISOString()
      };
      
      const result = await this.updateFlashcardRequest(requestId, updates);
      console.log(`❌ Failed flashcard request: ${requestId} - ${errorMessage}`);
      
      return result;
    } catch (error) {
      console.error('Error failing flashcard request:', error);
      return { success: false, error: error.message };
    }
  }

  // Get flashcard request by ID
  async getFlashcardRequest(requestId) {
    try {
      const requestRef = doc(db, this.flashcardRequestsCollection, requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (requestSnap.exists()) {
        const data = requestSnap.data();
        return {
          success: true,
          request: {
            ...data,
            createdAt: data.createdAt?.toDate()?.toISOString(),
            updatedAt: data.updatedAt?.toDate()?.toISOString()
          }
        };
      } else {
        return { success: false, error: 'Flashcard request not found' };
      }
    } catch (error) {
      console.error('Error getting flashcard request:', error);
      return { success: false, error: error.message };
    }
  }

  // Listen to flashcard request updates (for real-time monitoring)
  listenToFlashcardRequest(requestId, callback) {
    try {
      const requestRef = doc(db, this.flashcardRequestsCollection, requestId);
      
      const unsubscribe = onSnapshot(requestRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const request = {
            ...data,
            createdAt: data.createdAt?.toDate()?.toISOString(),
            updatedAt: data.updatedAt?.toDate()?.toISOString()
          };
          callback({ success: true, request });
        } else {
          callback({ success: false, error: 'Flashcard request not found' });
        }
      }, (error) => {
        console.error('Error listening to flashcard request:', error);
        callback({ success: false, error: error.message });
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up flashcard request listener:', error);
      return null;
    }
  }

  // Clean up old flashcard requests (optional maintenance)
  async cleanupOldFlashcardRequests(olderThanDays = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const q = query(
        collection(db, this.flashcardRequestsCollection),
        where('createdAt', '<', cutoffDate)
      );
      
      const querySnapshot = await getDocs(q);
      const deletePromises = [];
      
      querySnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      
      await Promise.all(deletePromises);
      
      console.log(`🧹 Cleaned up ${deletePromises.length} old flashcard requests`);
      return { success: true, deletedCount: deletePromises.length };
    } catch (error) {
      console.error('Error cleaning up old flashcard requests:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new FirebaseDB(); 