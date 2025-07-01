const { app, BrowserWindow, ipcMain, globalShortcut, screen } = require('electron');
const path = require('path');
const { auth } = require('../config/firebase-config');
const { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } = require('firebase/auth');

const OpenAI = require('openai');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
try {
  if (require('electron-squirrel-startup')) {
    app.quit();
  }
} catch (e) {
  // electron-squirrel-startup is optional, continue without it
}

// Global variables
let mainWindow;
let overlayWindow;
let sessionDetailWindow;
let currentUser = null;
let audioRecorder = null;
let recordingStream = null;
let currentSessionId = null;
let transcriptionBuffer = [];

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../../assets/icon.png'), // Optional: add an icon later
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Check authentication state and load appropriate page
  checkAuthAndLoadPage();

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open the DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

// Function to check auth state and load appropriate page
const checkAuthAndLoadPage = () => {
  if (currentUser) {
    // User is authenticated, load main dashboard
    mainWindow.loadFile('src/renderer/windows/index.html');
  } else {
    // User is not authenticated, load auth/landing page
    mainWindow.loadFile('src/renderer/windows/auth.html');
  }
};

// Create overlay window for recording
const createOverlayWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 400,
    height: 350,
    x: width - 420,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },
    show: false
  });

  overlayWindow.loadFile('src/renderer/windows/overlay-widget.html');

  overlayWindow.once('ready-to-show', () => {
    overlayWindow.show();
  });

  // Handle overlay window closed
  overlayWindow.on('closed', () => {
    overlayWindow = null;
    // Stop recording if overlay is closed
    if (audioRecorder) {
      stopAudioRecording();
    }
  });

  // Make window draggable
  overlayWindow.setMovable(true);
};

// Create session detail window
const createSessionDetailWindow = (sessionId) => {
  sessionDetailWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    parent: mainWindow,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },
    show: false
  });

  // Load the session detail page with sessionId as URL parameter
  sessionDetailWindow.loadFile('src/renderer/windows/session-detail.html', { 
    query: { sessionId: sessionId.toString() } 
  });

  sessionDetailWindow.once('ready-to-show', () => {
    sessionDetailWindow.show();
  });

  sessionDetailWindow.on('closed', () => {
    sessionDetailWindow = null;
  });
};

// Create amplitude monitor window
let amplitudeMonitorWindow;
const createAmplitudeMonitorWindow = () => {
  if (amplitudeMonitorWindow && !amplitudeMonitorWindow.isDestroyed()) {
    amplitudeMonitorWindow.focus();
    return;
  }

  amplitudeMonitorWindow = new BrowserWindow({
    width: 900,
    height: 650,
    resizable: true,
    minimizable: true,
    maximizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  amplitudeMonitorWindow.loadFile('src/renderer/windows/amplitude-monitor.html');

  amplitudeMonitorWindow.once('ready-to-show', () => {
    amplitudeMonitorWindow.show();
    amplitudeMonitorWindow.focus();
  });

  amplitudeMonitorWindow.on('closed', () => {
    amplitudeMonitorWindow = null;
    // Stop amplitude monitoring when window is closed
    stopAmplitudeMonitoring();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    amplitudeMonitorWindow.webContents.openDevTools();
  }
};

// Cross-platform amplitude monitoring with Audify
const CrossPlatformAudioMonitor = require('../utils/audify-audio-monitor');
let audioMonitor = null;

const startAmplitudeMonitoring = async () => {
  try {
    console.log('Starting cross-platform amplitude monitoring...');
    
    // Create new audio monitor instance
    audioMonitor = new CrossPlatformAudioMonitor();
    
    // Set up callbacks to forward data to renderer
    audioMonitor.setCallbacks({
      onAmplitudeUpdate: (data) => {
        if (amplitudeMonitorWindow && !amplitudeMonitorWindow.isDestroyed()) {
          amplitudeMonitorWindow.webContents.send('amplitude-update', data);
        }
      },
      onError: (error) => {
        console.error('Audio monitoring error:', error);
        if (amplitudeMonitorWindow && !amplitudeMonitorWindow.isDestroyed()) {
          amplitudeMonitorWindow.webContents.send('amplitude-error', error);
        }
      }
    });
    
    // Start monitoring
    const result = await audioMonitor.startMonitoring();
    
    if (result.success) {
      console.log('✅ Cross-platform amplitude monitoring started successfully');
      return { success: true, message: 'Amplitude monitoring started' };
    } else {
      throw new Error(result.error || 'Failed to start monitoring');
    }
    
  } catch (error) {
    console.error('Failed to start amplitude monitoring:', error);
    return { success: false, error: error.message };
  }
};

// Old ffmpeg functions removed - now using Audify cross-platform audio monitoring

const stopAmplitudeMonitoring = async () => {
  try {
    if (audioMonitor) {
      const result = await audioMonitor.stopMonitoring();
      audioMonitor = null;
      console.log('✅ Cross-platform amplitude monitoring stopped');
      return result;
    }
    return { success: true, message: 'No monitoring to stop' };
  } catch (error) {
    console.error('Error stopping amplitude monitoring:', error);
    return { success: false, error: error.message };
  }
};

// Audio recording functions
const startAudioRecording = () => {
  return new Promise((resolve, reject) => {
    try {
      // Create a unique session ID
      currentSessionId = uuidv4();
      transcriptionBuffer = [];
      
      console.log('Starting audio recording...');
      
      // Use direct SoX spawn instead of node-record-lpcm16
      
      // SoX command configured for your specific Realtek microphone
      const soxArgs = [
        '-t', 'waveaudio',                              // Input type: Windows audio
        'Microphone Array (Realtek(R) Audio)',         // Your specific microphone device
        '-t', 'wav',                                    // Output format
        '-',                                            // Output to stdout
        'rate', '16000'                                 // Sample rate
      ];
      
      console.log('SoX command:', 'sox', soxArgs.join(' '));
      
      // Start SoX process
      audioRecorder = spawn('sox', soxArgs);
      recordingStream = audioRecorder.stdout;

      let audioChunks = [];
      let chunkCount = 0;
      let hasStarted = false;
      
      recordingStream.on('data', (chunk) => {
        // Mark as successfully started on first data
        if (!hasStarted) {
          hasStarted = true;
          console.log('Audio recording started successfully');
          resolve({ success: true, sessionId: currentSessionId });
        }
        
        // Calculate audio volume level for visualization
        const volumeLevel = calculateAudioLevel(chunk);
        
        // Send volume data to overlay for visual feedback
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          overlayWindow.webContents.send('audio-level-update', {
            level: volumeLevel,
            timestamp: Date.now()
          });
        }
        
        audioChunks.push(chunk);
        chunkCount++;
        
        // Process audio in 5-second chunks for real-time transcription
        if (chunkCount >= 80) { // Approximately 5 seconds at 16kHz
          processAudioChunk(Buffer.concat(audioChunks));
          audioChunks = [];
          chunkCount = 0;
        }
      });

      audioRecorder.stderr.on('data', (data) => {
        console.log('SoX stderr:', data.toString());
      });

      audioRecorder.on('error', (error) => {
        console.error('SoX process error:', error);
        reject(error);
      });

      audioRecorder.on('close', (code) => {
        console.log('SoX process closed with code:', code);
        if (code !== 0 && !hasStarted) {
          reject(new Error(`SoX exited with code ${code}`));
        }
      });

      // Add a timeout to catch startup failures
      const startupTimeout = setTimeout(() => {
        if (!hasStarted) {
          console.log('Recording startup timeout');
          if (audioRecorder) {
            audioRecorder.kill();
          }
          const timeoutError = new Error(`Recording failed to start within 5 seconds.

POSSIBLE CAUSES:
• Another app is using the microphone
• Microphone permissions not granted
• Default audio device not set

SOLUTIONS:
• Close other audio apps and try again
• Check microphone permissions in Windows settings
• Set a default microphone in Windows Sound settings`);
          timeoutError.code = 'STARTUP_TIMEOUT';
          reject(timeoutError);
        }
      }, 5000);

      // Clear timeout when recording starts
      recordingStream.once('data', () => {
        clearTimeout(startupTimeout);
      });
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      reject(error);
    }
  });
};

const stopAudioRecording = () => {
  return new Promise((resolve) => {
    console.log('Stopping audio recording...');
    
    if (audioRecorder) {
      audioRecorder.kill('SIGTERM'); // Gracefully stop SoX
      audioRecorder = null;
    }
    
    if (recordingStream) {
      recordingStream = null;
    }
    
    resolve({ success: true, sessionId: currentSessionId, transcription: transcriptionBuffer });
  });
};

const processAudioChunk = async (audioBuffer) => {
  try {
    // Save audio chunk to temporary file
    const tempFilePath = path.join(__dirname, '../../temp', `audio_${Date.now()}.wav`);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(tempFilePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Write audio buffer as WAV file
    const wavHeader = createWavHeader(audioBuffer.length, 16000);
    const wavBuffer = Buffer.concat([wavHeader, audioBuffer]);
    fs.writeFileSync(tempFilePath, wavBuffer);
    
    // Send to OpenAI Whisper
    const transcription = await transcribeAudio(tempFilePath);
    
    if (transcription && transcription.text && transcription.text.trim()) {
      const transcriptionEntry = {
        timestamp: new Date().toISOString(),
        text: transcription.text.trim(),
        confidence: transcription.confidence || 1.0
      };
      
      transcriptionBuffer.push(transcriptionEntry);
      
      // Send to overlay window
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('transcription-update', transcriptionEntry);
      }
      
      console.log('Transcription:', transcriptionEntry.text);
    }
    
    // Clean up temp file
    setTimeout(() => {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }, 5000);
    
  } catch (error) {
    console.error('Error processing audio chunk:', error);
  }
};

const transcribeAudio = async (audioFilePath) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured');
      return { text: 'OpenAI API key not configured', confidence: 0 };
    }
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
      language: 'en',
      response_format: 'json',
      temperature: 0.0,
    });
    
    return {
      text: transcription.text,
      confidence: 1.0
    };
    
  } catch (error) {
    console.error('Whisper transcription error:', error);
    return { text: '', confidence: 0 };
  }
};

const createWavHeader = (dataLength, sampleRate) => {
  const header = Buffer.alloc(44);
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(dataLength + 36, 4);
  header.write('WAVE', 8);
  
  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // chunk size
  header.writeUInt16LE(1, 20); // audio format (PCM)
  header.writeUInt16LE(1, 22); // number of channels
  header.writeUInt32LE(sampleRate, 24); // sample rate
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  
  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  
  return header;
};

const calculateAudioLevel = (audioBuffer) => {
  if (!audioBuffer || audioBuffer.length === 0) {
    return 0;
  }
  
  // Convert 16-bit PCM buffer to amplitude values
  let sum = 0;
  let maxAmplitude = 0;
  const samples = audioBuffer.length / 2; // 16-bit = 2 bytes per sample
  
  for (let i = 0; i < audioBuffer.length; i += 2) {
    // Read 16-bit signed integer (little endian)
    const sample = audioBuffer.readInt16LE(i);
    const amplitude = Math.abs(sample);
    
    sum += amplitude * amplitude; // For RMS calculation
    maxAmplitude = Math.max(maxAmplitude, amplitude);
  }
  
  // Calculate RMS (Root Mean Square) amplitude
  const rms = Math.sqrt(sum / samples);
  
  // Convert to percentage (0-100)
  // 32767 is the maximum value for 16-bit signed audio
  const rmsPercentage = (rms / 32767) * 100;
  const peakPercentage = (maxAmplitude / 32767) * 100;
  
  // Return both RMS and peak levels
  return {
    rms: Math.min(Math.round(rmsPercentage), 100),
    peak: Math.min(Math.round(peakPercentage), 100),
    samples: samples
  };
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Wait for Firebase auth to initialize before creating window
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    currentUser = user;
    createWindow();
    unsubscribe(); // Only need this for initial load
  });

  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (overlayWindow) {
      if (overlayWindow.isVisible()) {
        overlayWindow.hide();
      } else {
        overlayWindow.show();
      }
    } else {
      createOverlayWindow();
    }
  });

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    globalShortcut.unregisterAll();
    app.quit();
  }
});

// Cleanup on app quit
app.on('before-quit', () => {
  globalShortcut.unregisterAll();
  if (audioRecorder) {
    stopAudioRecording();
  }
  // Stop amplitude monitoring
  stopAmplitudeMonitoring();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

// Firebase Authentication Handlers
ipcMain.handle('sign-in', async (event, email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    currentUser = userCredential.user;
    
    // Redirect to main dashboard after successful sign-in
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadFile('src/renderer/windows/index.html');
    }
    
    return { success: true, user: { uid: currentUser.uid, email: currentUser.email } };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: getFirebaseErrorMessage(error.code) };
  }
});

ipcMain.handle('sign-up', async (event, email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    currentUser = userCredential.user;
    
    // Redirect to main dashboard after successful sign-up
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadFile('src/renderer/windows/index.html');
    }
    
    return { success: true, user: { uid: userCredential.user.uid, email: userCredential.user.email } };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: getFirebaseErrorMessage(error.code) };
  }
});

ipcMain.handle('sign-out', async () => {
  try {
    await signOut(auth);
    currentUser = null;
    
    // Redirect to auth/landing page after sign-out
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadFile('src/renderer/windows/auth.html');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-current-user', () => {
  return currentUser ? { uid: currentUser.uid, email: currentUser.email } : null;
});

// Window Management Handlers
ipcMain.handle('close-auth-window', () => {
  // No longer needed since auth happens in main window
  // Keep for backward compatibility
  return { success: true };
});

ipcMain.handle('open-auth-window', () => {
  // Redirect main window to auth page instead of opening modal
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.loadFile('src/renderer/windows/auth.html');
  }
  return { success: true };
});

// Overlay Window Handlers
ipcMain.handle('start-recording', () => {
  if (!overlayWindow) {
    createOverlayWindow();
  } else {
    overlayWindow.show();
    overlayWindow.focus();
  }
});

ipcMain.handle('close-overlay', () => {
  if (overlayWindow) {
    overlayWindow.close();
    overlayWindow = null;
  }
});

ipcMain.handle('end-session', (event, sessionData) => {
  // Stop recording if active
  if (audioRecorder) {
    stopAudioRecording();
  }
  
  // TODO: Save session data to Firebase
  console.log('Session ended:', sessionData);
  
  // Close overlay and show main window
  if (overlayWindow) {
    overlayWindow.close();
    overlayWindow = null;
  }
  
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    // Refresh sessions list
    mainWindow.webContents.send('session-ended', sessionData);
  }
});

// Session Detail Handlers
ipcMain.handle('open-session-detail', (event, sessionId) => {
  createSessionDetailWindow(sessionId);
});

ipcMain.handle('go-back', () => {
  if (sessionDetailWindow) {
    sessionDetailWindow.close();
    sessionDetailWindow = null;
  }
  
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// Amplitude Monitor Handlers
ipcMain.handle('open-amplitude-monitor', () => {
  createAmplitudeMonitorWindow();
});

ipcMain.handle('start-amplitude-monitoring', async () => {
  try {
    const result = await startAmplitudeMonitoring();
    return result;
  } catch (error) {
    console.error('Failed to start amplitude monitoring:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-amplitude-monitoring', () => {
  try {
    const result = stopAmplitudeMonitoring();
    return result;
  } catch (error) {
    console.error('Failed to stop amplitude monitoring:', error);
    return { success: false, error: error.message };
  }
});

// Audio Recording Handlers
ipcMain.handle('start-audio-recording', async () => {
  try {
    const result = await startAudioRecording();
    return result;
  } catch (error) {
    console.error('Failed to start audio recording:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-audio-recording', async () => {
  try {
    const result = await stopAudioRecording();
    return result;
  } catch (error) {
    console.error('Failed to stop audio recording:', error);
    return { success: false, error: error.message };
  }
});

// Screenshot Handlers (placeholder for future implementation)
ipcMain.handle('take-screenshot', async () => {
  // TODO: Implement screenshot capture
  console.log('Taking screenshot...');
  return { success: true, path: 'screenshot-path.png' };
});

// AI Processing Handlers
ipcMain.handle('generate-flashcards', async (event, transcriptionText) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating educational flashcards. Generate high-quality question-answer pairs from the provided transcription text. Focus on key concepts, definitions, and important facts. Return the flashcards in JSON format with "question" and "answer" fields.'
        },
        {
          role: 'user',
          content: `Create flashcards from this transcription: ${transcriptionText}`
        }
      ],
      temperature: 0.3,
    });
    
    const flashcardsText = completion.choices[0].message.content;
    let flashcards;
    
    try {
      flashcards = JSON.parse(flashcardsText);
    } catch (parseError) {
      // Fallback: extract flashcards from text format
      console.warn('Failed to parse JSON, using fallback parsing');
      flashcards = parseFlashcardsFromText(flashcardsText);
    }
    
    return { success: true, flashcards };
    
  } catch (error) {
    console.error('Error generating flashcards:', error);
    return { 
      success: false, 
      error: error.message,
      flashcards: [
        { question: 'What is machine learning?', answer: 'A subset of AI that enables systems to learn from data.' },
        { question: 'Name a supervised learning algorithm.', answer: 'Linear regression is a common supervised learning algorithm.' }
      ]
    };
  }
});

ipcMain.handle('ask-ai-question', async (event, question, context) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that answers questions based on transcribed session content. Be concise and accurate in your responses.'
        },
        {
          role: 'user',
          content: `Context from current session: ${context}\n\nQuestion: ${question}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    return {
      success: true,
      answer: completion.choices[0].message.content
    };
    
  } catch (error) {
    console.error('Error asking AI question:', error);
    return {
      success: false,
      answer: 'Sorry, I encountered an error processing your question. Please try again.',
      error: error.message
    };
  }
});

// Generate AI summary from full transcript
ipcMain.handle('generate-summary', async (event, transcriptionText) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    console.log(`🔄 Generating AI summary for ${transcriptionText.length} character transcript...`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert summarization assistant. Analyze the provided transcript and create a comprehensive summary.

          Format your response as a JSON object with this EXACT structure:
          {
            "overview": "2-3 sentence high-level summary of the entire session",
            "keyPoints": ["Point 1", "Point 2", "Point 3", ...],
            "actionItems": ["Action 1", "Action 2", "Action 3", ...],
            "topics": ["Topic 1", "Topic 2", "Topic 3", ...]
          }

          Guidelines:
          - Overview: Concise 2-3 sentence summary capturing the main theme and scope
          - Key Points: 5-8 most important insights organized by topic (format: "Topic: Key insight about this topic")
          - Action Items: 3-6 specific actionable steps for the audience (each 1 sentence)
          - Topics: 6-12 main topics/themes covered (each 2-4 words)
          - Organize key points by topic for better structure
          - Focus on educational value and practical insights
          - Extract only the most important information`
        },
        {
          role: 'user',
          content: `Please create a comprehensive summary of this transcript:\n\n${transcriptionText}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });
    
    let summaryResult;
    const rawResponse = completion.choices[0].message.content.trim();
    
    try {
      summaryResult = JSON.parse(rawResponse);
      console.log(`✅ Generated AI summary successfully`);
    } catch (parseError) {
      console.warn('⚠️ Failed to parse summary JSON, attempting to extract...');
      console.log('Raw response:', rawResponse.substring(0, 200) + '...');
      
      // Try to extract JSON from response if it's wrapped in other text
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          summaryResult = JSON.parse(jsonMatch[0]);
          console.log(`✅ Extracted summary JSON successfully`);
        } catch (secondError) {
          summaryResult = createFallbackSummary(rawResponse);
        }
      } else {
        summaryResult = createFallbackSummary(rawResponse);
      }
    }
    
    return {
      success: true,
      summary: summaryResult
    };
    
  } catch (error) {
    console.error('Error generating summary:', error);
    
    return {
      success: false,
      error: error.message,
      summary: createFallbackSummary(`Error: ${error.message}`)
    };
  }
});

// Helper function for creating fallback summary
function createFallbackSummary(content) {
  console.log(`🔄 Creating fallback summary`);
  return {
    overview: "Summary generation encountered an issue. Please try again or check your API configuration.",
    keyPoints: [
      "AI summary generation failed",
      "This is a fallback response",
      "Check console for detailed error information"
    ],
    actionItems: [
      "Verify OpenAI API key is configured",
      "Check internet connection",
      "Try regenerating the summary"
    ],
    topics: [
      "Error Handling",
      "Troubleshooting",
      "System Status"
    ]
  };
}

// Helper function for creating fallback notes
function createFallbackNotes(index, content) {
  console.log(`🔄 Creating fallback notes for chunk ${index}`);
  return {
    title: `Section ${index} Notes`,
    content: `<div><p>${content.replace(/\n/g, '<br>').substring(0, 500)}...</p></div>`
  };
}

// Generate notes from transcript chunks
ipcMain.handle('generate-notes', async (event, chunkText, chunkIndex, totalChunks) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    console.log(`Generating notes for chunk ${chunkIndex}/${totalChunks}...`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert note-taking assistant. Convert the provided transcript chunk into well-structured, comprehensive notes. 

          CRITICAL: Format your response as a JSON object with this EXACT structure:
          {
            "title": "Section Title (descriptive, max 50 chars)",
            "content": "<h4>Key Concepts</h4><ul><li>Point 1</li><li>Point 2</li></ul><h4>Important Details</h4><p>Content here</p>"
          }

          FORMATTING REQUIREMENTS:
          - Use ONLY proper HTML tags: <h4>, <p>, <ul>, <li>, <strong>, <em>
          - NO literal \\n characters - use proper HTML line breaks and structure
          - NO line breaks in JSON - keep content as single HTML string
          - Extract key concepts, important points, and actionable insights
          - Organize with clear HTML headers and lists
          - Be comprehensive but concise for a ${Math.floor(500)} character chunk
          - This is chunk ${chunkIndex} of ${totalChunks} total chunks
          
          EXAMPLE GOOD OUTPUT:
          {"title": "Data Science Basics", "content": "<h4>Definition</h4><p>Data science combines statistics and computing.</p><h4>Key Points</h4><ul><li>Uses scientific methods</li><li>Extracts insights from data</li></ul>"}`
        },
        {
          role: 'user',
          content: `Please convert this transcript chunk into structured notes:\n\n${chunkText}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });
    
    let notesResult;
    const rawResponse = completion.choices[0].message.content.trim();
    
    try {
      notesResult = JSON.parse(rawResponse);
      
      // Clean up any literal \n characters in the content
      if (notesResult.content) {
        notesResult.content = notesResult.content
          .replace(/\\n/g, '') // Remove literal \n
          .replace(/\n/g, '') // Remove actual line breaks
          .trim();
      }
      
      console.log(`✅ Parsed JSON successfully for chunk ${chunkIndex}`);
      
    } catch (parseError) {
      console.warn(`⚠️ Failed to parse JSON for chunk ${chunkIndex}, attempting to extract content...`);
      console.log('Raw response:', rawResponse.substring(0, 200) + '...');
      
      // Try to extract JSON from response if it's wrapped in other text
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          notesResult = JSON.parse(jsonMatch[0]);
          notesResult.content = notesResult.content?.replace(/\\n/g, '').replace(/\n/g, '').trim();
          console.log(`✅ Extracted JSON successfully for chunk ${chunkIndex}`);
        } catch (secondError) {
          notesResult = createFallbackNotes(chunkIndex, rawResponse);
        }
      } else {
        notesResult = createFallbackNotes(chunkIndex, rawResponse);
      }
    }
    
    console.log(`✅ Generated notes for chunk ${chunkIndex}/${totalChunks}`);
    
    return {
      success: true,
      notes: notesResult,
      chunkIndex: chunkIndex,
      totalChunks: totalChunks
    };
    
  } catch (error) {
    console.error(`Error generating notes for chunk ${chunkIndex}:`, error);
    
    // Return fallback notes structure
    return {
      success: false,
      error: error.message,
      notes: {
        title: `Section ${chunkIndex} Notes`,
        content: `<p>Failed to generate notes for this section. Error: ${error.message}</p>`
      },
      chunkIndex: chunkIndex,
      totalChunks: totalChunks
    };
  }
});

// Helper function to parse flashcards from text
const parseFlashcardsFromText = (text) => {
  const flashcards = [];
  const lines = text.split('\n');
  let currentCard = {};
  
  for (const line of lines) {
    if (line.includes('Q:') || line.includes('Question:')) {
      if (currentCard.question && currentCard.answer) {
        flashcards.push(currentCard);
      }
      currentCard = { question: line.replace(/Q:|Question:/, '').trim() };
    } else if (line.includes('A:') || line.includes('Answer:')) {
      currentCard.answer = line.replace(/A:|Answer:/, '').trim();
    }
  }
  
  if (currentCard.question && currentCard.answer) {
    flashcards.push(currentCard);
  }
  
  return flashcards;
};

// Helper function to convert Firebase error codes to user-friendly messages
function getFirebaseErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    default:
      return 'Authentication failed. Please try again.';
  }
}

// Monitor authentication state
onAuthStateChanged(auth, (user) => {
  const previousUser = currentUser;
  currentUser = user;
  
  // Handle page transitions based on auth state changes
  if (mainWindow && !mainWindow.isDestroyed()) {
    // If user just signed in (was null, now has user)
    if (!previousUser && user) {
      mainWindow.loadFile('src/renderer/windows/index.html');
    }
    // If user just signed out (had user, now null)
    else if (previousUser && !user) {
      mainWindow.loadFile('src/renderer/windows/auth.html');
    }
    
    // Send auth state to renderer if it's the main dashboard
    mainWindow.webContents.executeJavaScript(`
      if (window.location.pathname.includes('index.html')) {
        if (window.electronAPI && window.electronAPI.onAuthStateChanged) {
          // This will be handled by the existing listener in index.html
        }
      }
    `).catch(() => {
      // Ignore errors if page isn't ready yet
    });
  }
}); 