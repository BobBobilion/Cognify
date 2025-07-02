const { db } = require('../config/firebase-config');
const { collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = require('firebase/firestore');

// Sessions collection operations
class FirebaseDB {
  constructor() {
    this.sessionsCollection = 'sessions';
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
}

module.exports = new FirebaseDB(); 