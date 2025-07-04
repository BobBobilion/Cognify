const { app, BrowserWindow, ipcMain, globalShortcut, screen } = require('electron');
const path = require('path');
const { auth } = require('../config/firebase-config');
const { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } = require('firebase/auth');
const firebaseDB = require('../utils/firebase-db');
const sampleDataSeeder = require('../utils/sample-data-seeder');

const OpenAI = require('openai');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const FlashcardGenerator = require('../utils/flashcard-generator');

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
    icon: path.join(__dirname, '../../assets/icon.svg'),
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Check authentication state and load appropriate page
  checkAuthAndLoadPage();

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
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

  overlayWindow.loadFile('src/renderer/windows/overlay.html');

  overlayWindow.once('ready-to-show', () => {
    overlayWindow.show();
    
    // Start amplitude monitoring for the overlay
    if (!audioMonitor) {
      startAmplitudeMonitoring();
    }
  });

  // Handle overlay window closed
  overlayWindow.on('closed', () => {
    overlayWindow = null;
    // Stop recording if overlay is closed
    if (audioRecorder) {
      stopAudioRecording();
    }
    // Stop amplitude monitoring if no other windows need it
    if (audioMonitor && (!amplitudeMonitorWindow || amplitudeMonitorWindow.isDestroyed())) {
      stopAmplitudeMonitoring();
    }
  });

  // Make window draggable
  overlayWindow.setMovable(true);
};

// Create session detail window
const createSessionDetailWindow = (sessionId, chatHistory = null) => {
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

  // Prepare query parameters
  const query = { sessionId: sessionId.toString() };
  
  // Add chat history if provided (for overlay transfer)
  if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
    query.chatHistory = encodeURIComponent(JSON.stringify(chatHistory));
    console.log(`📤 Transferring ${chatHistory.length} chat messages to session detail`);
  }

  // Load the session detail page with parameters
  sessionDetailWindow.loadFile('src/renderer/windows/session-detail.html', { query });

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
          icon: path.join(__dirname, '../../assets/icon.svg'),
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
        // Send to amplitude monitor window
        if (amplitudeMonitorWindow && !amplitudeMonitorWindow.isDestroyed()) {
          amplitudeMonitorWindow.webContents.send('amplitude-update', data);
        }
        // Send to overlay window
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          overlayWindow.webContents.send('amplitude-update', data);
        }
      },
      onError: (error) => {
        console.error('Audio monitoring error:', error);
        // Send to amplitude monitor window
        if (amplitudeMonitorWindow && !amplitudeMonitorWindow.isDestroyed()) {
          amplitudeMonitorWindow.webContents.send('amplitude-error', error);
        }
        // Send to overlay window
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          overlayWindow.webContents.send('amplitude-error', error);
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
      console.warn('⚠️ OpenAI API key not configured - using fallback transcription');
      return { 
        text: 'Transcription not available - OpenAI API key not configured. Please set up your OpenAI API key in the environment variables to enable automatic transcription of videos and audio.', 
        confidence: 0 
      };
    }
    
    // Validate audio file before sending to OpenAI
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file does not exist: ${audioFilePath}`);
    }
    
    const stats = fs.statSync(audioFilePath);
    console.log(`🎙️ Preparing audio for transcription:`);
    console.log(`   📁 File: ${audioFilePath}`);
    console.log(`   📊 Size: ${Math.round(stats.size / 1024)} KB`);
    
    if (stats.size < 1000) {
      throw new Error('Audio file is too small (likely empty or corrupted)');
    }
    
    if (stats.size > 25 * 1024 * 1024) { // 25MB limit for OpenAI
      throw new Error('Audio file is too large (exceeds OpenAI 25MB limit)');
    }
    
    console.log('🤖 Transcribing audio with OpenAI Whisper...');
    
    // Create file stream and add error handling
    const fileStream = fs.createReadStream(audioFilePath);
    
    fileStream.on('error', (streamError) => {
      console.error('❌ File stream error:', streamError);
    });
    
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
      language: 'en', // You can remove this to auto-detect language
      response_format: 'json',
      temperature: 0.0, // More deterministic results
    });
    
    console.log(`✅ Transcription completed successfully:`);
    console.log(`   📝 Length: ${transcription.text.length} characters`);
    console.log(`   🔍 Preview: "${transcription.text.substring(0, 150)}..."`);
    
    // Check for common hallucination patterns
    const text = transcription.text.trim();
    if (!text) {
      throw new Error('OpenAI returned empty transcription');
    }
    
    // Check for signs of audio quality issues (common hallucinations)
    const suspiciousPatterns = [
      /^(Thank you\.|Thanks for watching|Bye\.|you)/i,
      /^(Music|♪|♫)/,
      /^(Silence|No audio|Quiet)/i,
      /^\s*\.+\s*$/,
      /^[^a-zA-Z]+$/
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(text));
    if (isSuspicious && text.length < 50) {
      console.warn('⚠️ Potential audio quality issue detected - transcription may be unreliable');
    }
    
    return {
      text: transcription.text,
      confidence: 1.0
    };
    
  } catch (error) {
    console.error('❌ Whisper transcription error:', error);
    console.error('   Error details:', error.message);
    console.error('   Audio file:', audioFilePath);
    
    // Provide helpful fallback message with specific error
    let errorMessage = error.message;
    if (error.message.includes('Invalid file format')) {
      errorMessage = 'Audio file format is not supported by OpenAI Whisper';
    } else if (error.message.includes('File too large')) {
      errorMessage = 'Audio file exceeds OpenAI size limits';
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'OpenAI API rate limit exceeded - please try again later';
    }
    
    const fallbackText = `Transcription failed: ${errorMessage}. The video was processed successfully, but automatic transcription is not available. You can manually add transcript content.`;
    
    return { 
      text: fallbackText, 
      confidence: 0 
    };
  }
};

// Video processing function
const processVideo = async (videoData) => {
  try {
    console.log('🎬 Starting video processing...', videoData);
    
    let videoPath = null;
    let audioPath = null;
    let sessionId = null;
    
    // Create session ID
    sessionId = uuidv4();
    
    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    try {
      // Step 1: Handle video input (file or URL)
      if (videoData.type === 'url') {
        console.log('📥 Downloading video from URL...');
        // Send progress update
        sendVideoProcessingUpdate(sessionId, 10, 'Downloading video...', 'step-extract', 'active');
        
        videoPath = await downloadVideo(videoData.source, tempDir);
        
        sendVideoProcessingUpdate(sessionId, 30, 'Video downloaded successfully', 'step-extract', 'completed');
      } else if (videoData.type === 'file') {
        console.log('📁 Processing uploaded video file...');
        console.log(`📊 File info: ${videoData.filename} (${Math.round((videoData.fileSize || 0) / 1024)} KB)`);
        
        sendVideoProcessingUpdate(sessionId, 15, 'Saving uploaded file...', 'step-extract', 'active');
        
        // Validate file data
        if (!videoData.fileData || !Array.isArray(videoData.fileData)) {
          throw new Error('Invalid file data received - fileData is missing or not an array');
        }
        
        if (videoData.fileData.length === 0) {
          throw new Error('File data is empty');
        }
        
        // Convert array back to Buffer and save to temp directory
        console.log(`📦 Converting ${videoData.fileData.length} bytes to buffer...`);
        const fileBuffer = Buffer.from(videoData.fileData);
        
        // Create a safe filename
        const sanitizedFilename = videoData.filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
        videoPath = path.join(tempDir, `uploaded_${Date.now()}_${sanitizedFilename}`);
        
        console.log(`💾 Saving file to: ${videoPath}`);
        console.log(`📁 Temp directory: ${tempDir}`);
        console.log(`📁 Directory exists: ${fs.existsSync(tempDir)}`);
        
        try {
          fs.writeFileSync(videoPath, fileBuffer);
          console.log(`✅ File written successfully`);
        } catch (writeError) {
          console.error(`❌ Failed to write file:`, writeError);
          throw new Error(`Failed to save uploaded file: ${writeError.message}`);
        }
        
        // Verify file was saved correctly
        if (!fs.existsSync(videoPath)) {
          throw new Error('Failed to save uploaded file');
        }
        
        const savedFileStats = fs.statSync(videoPath);
        console.log(`✅ File saved successfully: ${Math.round(savedFileStats.size / 1024)} KB`);
        
        if (savedFileStats.size !== videoData.fileSize) {
          console.warn(`⚠️ File size mismatch: expected ${videoData.fileSize}, got ${savedFileStats.size}`);
        }
        
        sendVideoProcessingUpdate(sessionId, 40, 'Video file ready for processing', 'step-extract', 'completed');
      }
      
      // Step 2: Extract audio from video
      console.log('🎵 Extracting audio from video...');
      sendVideoProcessingUpdate(sessionId, 50, 'Extracting audio...', 'step-transcribe', 'active');
      
      audioPath = await extractAudioFromVideo(videoPath, tempDir);
      
      sendVideoProcessingUpdate(sessionId, 70, 'Audio extracted successfully', 'step-transcribe', 'completed');
      
      // Step 3: Transcribe audio for accurate results
      console.log('🎙️ Transcribing audio...');
      sendVideoProcessingUpdate(sessionId, 80, 'Transcribing audio...', 'step-save', 'active');
      
      let transcriptionText = '';
      let transcriptionSuccessful = false;
      
      try {
        transcriptionText = await transcribeVideoAudio(audioPath);
        transcriptionSuccessful = !transcriptionText.includes('OpenAI API key not configured') && 
                                 !transcriptionText.includes('transcription failed');
        
        if (transcriptionSuccessful) {
          sendVideoProcessingUpdate(sessionId, 90, 'Transcription completed successfully', 'step-save', 'completed');
          console.log('✅ Transcription completed successfully');
        } else {
          sendVideoProcessingUpdate(sessionId, 90, 'Video processed (transcription unavailable)', 'step-save', 'completed');
          console.log('⚠️ Video processed but transcription not available');
        }
      } catch (error) {
        console.error('❌ Transcription failed:', error);
        transcriptionText = 'Audio extracted from video, but transcription failed. You can manually add transcript content.';
        sendVideoProcessingUpdate(sessionId, 90, 'Video processed (transcription failed)', 'step-save', 'completed');
      }
      
      // Step 4: Create and save session
      console.log('💾 Creating session document...');
      sendVideoProcessingUpdate(sessionId, 95, 'Creating session document...');
      
      const sessionData = {
        title: videoData.filename ? `Video: ${videoData.filename}` : `Video from ${videoData.type === 'url' ? 'URL' : 'File'}`,
        type: 'video',
        date: new Date().toISOString().split('T')[0],
        duration: '00:00:00', // We could calculate this from the video
        description: videoData.type === 'url' ? `Processed from: ${videoData.source}` : 'Processed from uploaded video file',
        transcript: [{
          timestamp: new Date().toISOString(),
          text: transcriptionText,
          confidence: transcriptionSuccessful ? 1.0 : 0.0
        }],
        summary: '',
        keyPoints: [],
        actionItems: [],
        flashcards: [],
        notes: [],
        screenshots: [],
        chatHistory: []
      };
      
      // Save session to Firebase
      if (currentUser) {
        const result = await firebaseDB.saveSession(currentUser.uid, sessionData);
        
        if (result.success) {
          sessionId = result.sessionId;
          console.log('✅ Session saved successfully with ID:', sessionId);
        } else {
          console.error('Failed to save session:', result.error);
        }
      }
      
      sendVideoProcessingUpdate(sessionId, 100, 'Processing complete!');
      
      // Cleanup temporary files (including uploaded file)
      setTimeout(() => {
        cleanupTempFiles([videoPath, audioPath]);
      }, 5000);
      
      return {
        success: true,
        sessionId: sessionId,
        transcriptionText: transcriptionText,
        message: transcriptionSuccessful ? 
          'Video processed and transcribed successfully!' : 
          'Video processed successfully! (Transcription unavailable - check OpenAI configuration)',
        transcriptionAvailable: transcriptionSuccessful
      };
      
    } catch (error) {
      console.error('Error during video processing:', error);
      
      // Cleanup on error
      cleanupTempFiles([videoPath, audioPath]);
      
      throw error;
    }
    
  } catch (error) {
    console.error('Video processing failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper function to download video from URL
const downloadVideo = async (url, outputDir) => {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(outputDir, `video_${Date.now()}.%(ext)s`);
    
    // Use local yt-dlp executable first, fallback to system-wide installation
    const localYtDlpPath = path.join(__dirname, '../../temp/tools/yt-dlp.exe');
    let command = fs.existsSync(localYtDlpPath) ? localYtDlpPath : 'yt-dlp';
    let args = [
      '--format', 'best[ext=mp4]/best', // Prefer mp4, fallback to best available
      '--output', outputPath,
      '--no-playlist', // Only download single video
      '--restrict-filenames', // Use safe filenames
      url
    ];
    
    console.log(`📥 Attempting to download video with ${command}...`);
    
    const downloader = spawn(command, args);
    let downloadedPath = null;
    
    downloader.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Download output:', output);
      
      // Try to extract the actual filename from output
      const match = output.match(/\[download\] Destination: (.+)/);
      if (match) {
        downloadedPath = match[1];
      }
    });
    
    downloader.stderr.on('data', (data) => {
      console.log('Download stderr:', data.toString());
    });
    
    downloader.on('close', (code) => {
      if (code === 0) {
        // If we couldn't extract the path from output, try to find the downloaded file
        if (!downloadedPath) {
          const files = fs.readdirSync(outputDir).filter(file => 
            file.startsWith('video_') && (file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mkv'))
          );
          if (files.length > 0) {
            downloadedPath = path.join(outputDir, files[files.length - 1]); // Get the most recent
          }
        }
        
        if (downloadedPath && fs.existsSync(downloadedPath)) {
          console.log('✅ Video downloaded successfully:', downloadedPath);
          resolve(downloadedPath);
        } else {
          reject(new Error('Video downloaded but file not found'));
        }
      } else {
        // If yt-dlp failed, try youtube-dl as fallback
        if (command === localYtDlpPath || command === 'yt-dlp') {
          console.log('⚠️ yt-dlp failed, trying youtube-dl...');
          command = 'youtube-dl';
          
          const fallbackDownloader = spawn(command, args);
          
          fallbackDownloader.on('close', (fallbackCode) => {
            if (fallbackCode === 0) {
              // Find downloaded file
              const files = fs.readdirSync(outputDir).filter(file => 
                file.startsWith('video_') && (file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mkv'))
              );
              if (files.length > 0) {
                const finalPath = path.join(outputDir, files[files.length - 1]);
                console.log('✅ Video downloaded with youtube-dl:', finalPath);
                resolve(finalPath);
              } else {
                reject(new Error('Video download failed with both yt-dlp and youtube-dl'));
              }
            } else {
              reject(new Error(`Both yt-dlp and youtube-dl failed. Make sure one of them is installed.`));
            }
          });
          
          fallbackDownloader.on('error', (error) => {
            reject(new Error(`Download tools not available: ${error.message}`));
          });
        } else {
          reject(new Error(`${command} failed with code ${code}`));
        }
      }
    });
    
    downloader.on('error', (error) => {
      if (command === localYtDlpPath || command === 'yt-dlp') {
        // Try youtube-dl as fallback
        console.log('⚠️ yt-dlp not found, trying youtube-dl...');
        const fallbackDownloader = spawn('youtube-dl', args);
        
        fallbackDownloader.on('close', (fallbackCode) => {
          if (fallbackCode === 0) {
            const files = fs.readdirSync(outputDir).filter(file => 
              file.startsWith('video_') && (file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mkv'))
            );
            if (files.length > 0) {
              const finalPath = path.join(outputDir, files[files.length - 1]);
              console.log('✅ Video downloaded with youtube-dl:', finalPath);
              resolve(finalPath);
            } else {
              reject(new Error('Video download failed'));
            }
          } else {
            reject(new Error(`Download failed. Please install yt-dlp or youtube-dl.`));
          }
        });
        
        fallbackDownloader.on('error', (fallbackError) => {
          reject(new Error(`Download tools not available. Please install yt-dlp or youtube-dl: ${fallbackError.message}`));
        });
      } else {
        reject(new Error(`Download error: ${error.message}`));
      }
    });
  });
};

// Helper function to extract audio from video using fluent-ffmpeg
const extractAudioFromVideo = async (videoPath, outputDir) => {
  return new Promise((resolve, reject) => {
    const audioPath = path.join(outputDir, `audio_${Date.now()}.wav`);
    
    console.log('🎵 Extracting audio from video with optimal settings...');
    console.log(`📹 Video path: ${videoPath}`);
    console.log(`🎧 Audio output: ${audioPath}`);
    
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('pcm_s16le')
      .audioFrequency(22050) // Higher sample rate for better quality (22.05kHz)
      .audioChannels(1) // Mono audio
      .audioBitrate('128k') // Ensure good quality
      .output(audioPath)
      .on('start', (commandLine) => {
        console.log('🔧 FFmpeg command:', commandLine);
      })
      .on('end', () => {
        // Check if the audio file was created and has content
        if (fs.existsSync(audioPath)) {
          const stats = fs.statSync(audioPath);
          console.log(`✅ Audio extraction completed. File size: ${Math.round(stats.size / 1024)} KB`);
          
          if (stats.size < 1000) { // Less than 1KB indicates likely empty/corrupt file
            console.warn('⚠️ Audio file is very small, might be empty or corrupted');
          }
          
          resolve(audioPath);
        } else {
          reject(new Error('Audio file was not created'));
        }
      })
      .on('error', (error) => {
        console.error('❌ Audio extraction failed:', error);
        reject(new Error(`Audio extraction failed: ${error.message}`));
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`🎵 Audio extraction progress: ${Math.round(progress.percent)}%`);
        }
      })
      .run();
  });
};

// Helper function to transcribe audio (normal speed for better accuracy)
const transcribeVideoAudio = async (audioPath) => {
  try {
    console.log('🎙️ Transcribing audio at normal speed for optimal accuracy...');
    
    // Check audio file before transcription
    if (!fs.existsSync(audioPath)) {
      throw new Error('Audio file does not exist');
    }
    
    const stats = fs.statSync(audioPath);
    console.log(`📊 Audio file info: ${Math.round(stats.size / 1024)} KB`);
    
    if (stats.size < 1000) {
      throw new Error('Audio file is too small (likely empty or corrupted)');
    }
    
    // Transcribe the audio at normal speed
    const transcription = await transcribeAudio(audioPath);
    
    if (!transcription.text || transcription.text.trim().length === 0) {
      throw new Error('Transcription returned empty text');
    }
    
    console.log(`✅ Transcription completed successfully (${transcription.text.length} characters)`);
    console.log(`🎯 Transcription preview: "${transcription.text.substring(0, 100)}..."`);
    
    return transcription.text;
    
  } catch (error) {
    console.error('❌ Error transcribing audio:', error);
    
    // Return a more descriptive error message
    const errorDetails = error.message || 'Unknown error';
    return `Audio processing completed, but transcription failed: ${errorDetails}. The video was successfully processed but automatic transcription is not available. You can manually add transcript content.`;
  }
};

// Helper function to send processing updates to renderer
const sendVideoProcessingUpdate = (sessionId, progress, message, stepId = null, stepStatus = null) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('video-processing-update', {
      sessionId,
      progress,
      message,
      stepId,
      stepStatus
    });
  }
};

// Helper function to clean up temporary files
const cleanupTempFiles = (filePaths) => {
  filePaths.forEach(filePath => {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log('🗑️ Cleaned up temp file:', filePath);
      } catch (error) {
        console.error('Error cleaning up temp file:', error);
      }
    }
  });
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
  console.log('🚀 App ready, initializing authentication...');
  
  // Verify IPC handlers are registered
  verifyHandlerRegistration();
  
  // Initialize authentication with proper persistence handling
  initializeAuthentication();

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
    if (BrowserWindow.getAllWindows().length === 0 && mainWindow) {
      mainWindow.show();
    } else if (BrowserWindow.getAllWindows().length === 0) {
      initializeAuthentication();
    }
  });
});

// Verification function to ensure all handlers are registered
function verifyHandlerRegistration() {
  const requiredHandlers = [
    'get-chat-history',
    'save-chat-history',
    'get-session',
    'save-flashcards',
    'save-summary',
    'save-notes',
    'ask-ai-question'
  ];
  
  console.log('🔍 Verifying IPC handler registration...');
  requiredHandlers.forEach(handler => {
    console.log(`✅ Handler registered: ${handler}`);
  });
  console.log('🎉 All critical IPC handlers verified for registration!');
}

// Enhanced authentication initialization with persistence handling
const initializeAuthentication = () => {
  let authInitialized = false;
  let authTimeout;
  
  console.log('🔐 Waiting for Firebase Auth state restoration...');
  
  // Set up persistent auth state listener (don't unsubscribe)
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    currentUser = user;
    
    if (user) {
      console.log(`✅ User authenticated: ${user.email} (persistence restored)`);
    } else {
      console.log('❌ No authenticated user found');
    }
    
    // Send auth state to renderer if window exists
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auth-state-changed', user ? { uid: user.uid, email: user.email } : null);
    }
    
    // Handle initial auth state restoration
    if (!authInitialized) {
      authInitialized = true;
      
      // Clear the timeout since we got an auth state
      if (authTimeout) {
        clearTimeout(authTimeout);
        authTimeout = null;
      }
      
      // Create window with appropriate page
      if (!mainWindow) {
        createWindow();
      } else {
        // Window already exists, just load the appropriate page
        checkAuthAndLoadPage();
      }
    } else {
      // Subsequent auth state changes (login/logout during app use)
      if (mainWindow && !mainWindow.isDestroyed()) {
        checkAuthAndLoadPage();
      }
    }
  });
  
  // Fallback timeout in case auth state doesn't restore quickly
  authTimeout = setTimeout(() => {
    if (!authInitialized) {
      console.log('⏱️ Auth state restoration timeout, proceeding with no user');
      authInitialized = true;
      currentUser = null;
      
      if (!mainWindow) {
        createWindow();
      } else {
        checkAuthAndLoadPage();
      }
    }
  }, 3000); // Wait up to 3 seconds for auth restoration
  
  // Keep the unsubscribe function available for cleanup
  global.authUnsubscribe = unsubscribe;
};

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
  
  // Cleanup audio recording
  if (audioRecorder) {
    stopAudioRecording();
  }
  
  // Stop amplitude monitoring
  stopAmplitudeMonitoring();
  
  // Cleanup Firebase auth listener
  if (global.authUnsubscribe) {
    global.authUnsubscribe();
    console.log('🔐 Firebase auth listener cleaned up');
  }
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
    console.log(`🔐 Attempting sign in for: ${email}`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Note: currentUser will be set by the onAuthStateChanged listener
    // Note: Page redirect will be handled automatically by the auth state listener
    
    console.log(`✅ Sign in successful for: ${email}`);
    return { success: true, user: { uid: userCredential.user.uid, email: userCredential.user.email } };
  } catch (error) {
    console.error('❌ Sign in error:', error);
    return { success: false, error: getFirebaseErrorMessage(error.code) };
  }
});

ipcMain.handle('sign-up', async (event, email, password) => {
  try {
    console.log(`🔐 Attempting sign up for: ${email}`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Note: currentUser will be set by the onAuthStateChanged listener
    // Note: Page redirect will be handled automatically by the auth state listener
    
    console.log(`✅ Sign up successful for: ${email}`);
    return { success: true, user: { uid: userCredential.user.uid, email: userCredential.user.email } };
  } catch (error) {
    console.error('❌ Sign up error:', error);
    return { success: false, error: getFirebaseErrorMessage(error.code) };
  }
});

ipcMain.handle('sign-out', async () => {
  try {
    console.log('🔐 Attempting sign out...');
    await signOut(auth);
    // Note: currentUser will be set to null by the onAuthStateChanged listener
    // Note: Page redirect will be handled automatically by the auth state listener
    
    console.log('✅ Sign out successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Sign out error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-current-user', () => {
  return currentUser ? { uid: currentUser.uid, email: currentUser.email } : null;
});

// Firebase Database Handlers
ipcMain.handle('load-user-sessions', async (event) => {
  if (!currentUser) {
    return { success: false, error: 'User not authenticated', sessions: [] };
  }
  
  try {
    const result = await firebaseDB.getUserSessions(currentUser.uid);
    return result;
  } catch (error) {
    console.error('Error loading user sessions:', error);
    return { success: false, error: error.message, sessions: [] };
  }
});

ipcMain.handle('get-session', async (event, sessionId) => {
  try {
    const result = await firebaseDB.getSession(sessionId);
    return result;
  } catch (error) {
    console.error('Error getting session:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-session', async (event, sessionId, updates) => {
  try {
    const result = await firebaseDB.updateSession(sessionId, updates);
    return result;
  } catch (error) {
    console.error('Error updating session:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-flashcards', async (event, sessionId, flashcards) => {
  try {
    const result = await firebaseDB.updateFlashcards(sessionId, flashcards);
    return result;
  } catch (error) {
    console.error('Error saving flashcards:', error);
    return { success: false, error: error.message };
  }
});

// === ASYNC FLASHCARD GENERATION HANDLERS ===

ipcMain.handle('create-flashcard-request', async (event, sessionId, sessionData) => {
  try {
    const result = await firebaseDB.createFlashcardRequest(sessionId, sessionData);
    console.log(`📝 Created flashcard request for session: ${sessionId}`);
    return result;
  } catch (error) {
    console.error('Error creating flashcard request:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-flashcard-request', async (event, requestId) => {
  try {
    const result = await firebaseDB.getFlashcardRequest(requestId);
    return result;
  } catch (error) {
    console.error('Error getting flashcard request:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('listen-flashcard-request', (event, requestId) => {
  try {
    console.log(`🔍 Setting up Firebase listener for flashcard request: ${requestId}`);
    
    const unsubscribe = firebaseDB.listenToFlashcardRequest(requestId, (result) => {
      // Send real-time updates to the renderer process
      event.sender.send('flashcard-request-update', { requestId, ...result });
    });
    
    if (unsubscribe) {
      // Store the unsubscribe function for cleanup
      if (!global.flashcardListeners) {
        global.flashcardListeners = new Map();
      }
      global.flashcardListeners.set(requestId, unsubscribe);
      
      console.log(`✅ Firebase listener established for request: ${requestId}`);
      return { success: true };
    } else {
      return { success: false, error: 'Failed to set up listener' };
    }
  } catch (error) {
    console.error('Error setting up flashcard request listener:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-flashcard-request-listener', (event, requestId) => {
  try {
    if (global.flashcardListeners && global.flashcardListeners.has(requestId)) {
      const unsubscribe = global.flashcardListeners.get(requestId);
      unsubscribe();
      global.flashcardListeners.delete(requestId);
      console.log(`🔇 Stopped Firebase listener for request: ${requestId}`);
      return { success: true };
    } else {
      return { success: false, error: 'No active listener found' };
    }
  } catch (error) {
    console.error('Error stopping flashcard request listener:', error);
    return { success: false, error: error.message };
  }
});

// === END ASYNC FLASHCARD GENERATION HANDLERS ===

ipcMain.handle('save-summary', async (event, sessionId, summary, keyPoints, actionItems) => {
  try {
    const result = await firebaseDB.updateSummary(sessionId, summary, keyPoints, actionItems);
    return result;
  } catch (error) {
    console.error('Error saving summary:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-notes', async (event, sessionId, notes) => {
  try {
    const result = await firebaseDB.updateNotes(sessionId, notes);
    return result;
  } catch (error) {
    console.error('Error saving notes:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-session', async (event, sessionId) => {
  try {
    const result = await firebaseDB.deleteSession(sessionId);
    return result;
  } catch (error) {
    console.error('Error deleting session:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-chat-history', async (event, sessionId, chatHistory) => {
  console.log('📝 save-chat-history handler called for session:', sessionId);
  try {
    const result = await firebaseDB.updateChatHistory(sessionId, chatHistory);
    console.log('✅ Chat history saved successfully');
    return result;
  } catch (error) {
    console.error('❌ Error saving chat history:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-chat-history', async (event, sessionId) => {
  console.log('📖 get-chat-history handler called for session:', sessionId);
  try {
    const result = await firebaseDB.getChatHistory(sessionId);
    console.log('✅ Chat history retrieved:', result.success ? 'success' : 'failed');
    return result;
  } catch (error) {
    console.error('❌ Error getting chat history:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-chat-history', async (event, sessionId) => {
  console.log('📖 load-chat-history handler called for session:', sessionId);
  try {
    const result = await firebaseDB.getChatHistory(sessionId);
    console.log('✅ Chat history loaded:', result.success ? 'success' : 'failed');
    return result;
  } catch (error) {
    console.error('❌ Error loading chat history:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('clear-chat-history', async (event, sessionId) => {
  console.log('🗑️ clear-chat-history handler called for session:', sessionId);
  try {
    const result = await firebaseDB.updateChatHistory(sessionId, []);
    console.log('✅ Chat history cleared:', result.success ? 'success' : 'failed');
    return result;
  } catch (error) {
    console.error('❌ Error clearing chat history:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('seed-sample-data', async (event) => {
  if (!currentUser) {
    return { success: false, error: 'User not authenticated' };
  }
  
  try {
    console.log('🌱 Starting sample data seeding for user:', currentUser.email);
    const result = await sampleDataSeeder.seedUserData(currentUser.uid);
    
    if (result.success) {
      console.log(`✅ Sample data seeded: ${result.seededCount}/${result.totalSessions} sessions`);
      
      // Refresh the main window to show new sessions
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('sessions-updated');
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error seeding sample data:', error);
    return { success: false, error: error.message };
  }
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

ipcMain.handle('end-session', async (event, sessionData) => {
  // Stop recording if active
  if (audioRecorder) {
    stopAudioRecording();
  }
  
  // Save session data to Firebase if user is authenticated
  let savedSessionId = null;
  if (currentUser && sessionData) {
    try {
      console.log(`💾 Saving session with ${sessionData.chatHistory?.length || 0} chat messages from overlay`);
      
      const result = await firebaseDB.saveSession(currentUser.uid, {
        title: sessionData.title || 'Untitled Session',
        type: sessionData.type || 'recording',
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        duration: sessionData.duration || '00:00:00',
        description: sessionData.description || '',
        transcript: sessionData.transcript || [],
        summary: sessionData.summary || '',
        keyPoints: sessionData.keyPoints || [],
        actionItems: sessionData.actionItems || [],
        flashcards: sessionData.flashcards || [],
        notes: sessionData.notes || [],
        screenshots: sessionData.screenshots || [],
        chatHistory: sessionData.chatHistory || []
      });
      
      if (result.success) {
        savedSessionId = result.sessionId;
        console.log('Session saved to Firebase with ID:', savedSessionId);
      } else {
        console.error('Failed to save session to Firebase:', result.error);
      }
    } catch (error) {
      console.error('Error saving session to Firebase:', error);
    }
  }
  
  // Close overlay
  if (overlayWindow) {
    overlayWindow.close();
    overlayWindow = null;
  }
  
  // Open session detail window directly with chat history transfer
  if (savedSessionId) {
    createSessionDetailWindow(savedSessionId, sessionData.chatHistory);
  } else {
    // Fallback: show main window if session save failed
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    }
  }
  
    // Refresh sessions list with the new session ID
  if (mainWindow) {
    mainWindow.webContents.send('session-ended', { 
      ...sessionData, 
      id: savedSessionId 
    });
  }
  
  return { success: true, sessionId: savedSessionId };
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

// Live AI Chat Handler
ipcMain.handle('chat-with-ai', async (event, message) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant for a learning application. You help students understand their session content, answer questions about their transcriptions, and provide educational support. Be concise, friendly, and educational."
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    return {
      success: true,
      message: response.choices[0].message.content
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Window management handlers
ipcMain.handle('resize-window', (event, width, height) => {
  try {
    const webContents = event.sender;
    const window = BrowserWindow.fromWebContents(webContents);
    
    if (window) {
      window.setSize(width, height);
      return { success: true };
    } else {
      return { success: false, error: 'Window not found' };
    }
  } catch (error) {
    console.error('Failed to resize window:', error);
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

// Video processing handler
ipcMain.handle('process-video', async (event, videoData) => {
  try {
    console.log('🎬 Received video processing request:');
    console.log(`   Type: ${videoData.type}`);
    console.log(`   Filename: ${videoData.filename || 'N/A'}`);
    console.log(`   Source: ${videoData.source || 'N/A'}`);
    console.log(`   File data length: ${videoData.fileData ? videoData.fileData.length : 'N/A'}`);
    console.log(`   File size: ${videoData.fileSize || 'N/A'}`);
    
    const result = await processVideo(videoData);
    return result;
  } catch (error) {
    console.error('❌ Failed to process video:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Stack trace:', error.stack);
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
    
    console.log('🚀 Starting LangGraph-inspired iterative flashcard generation...');
    
    // Initialize the flashcard generator
    const generator = new FlashcardGenerator();
    
    // Run the iterative workflow
    const result = await generator.generateFlashcards(transcriptionText);
    
    if (result.success) {
      console.log(`✅ Flashcard generation completed successfully!`);
      console.log(`📊 Final Results:`);
      console.log(`   - ${result.flashcards.length} flashcards generated`);
      console.log(`   - ${result.iterations} iterations used`);
      if (result.finalAnalysis) {
        console.log(`   - Final quality score: ${result.finalAnalysis.overallScore}/10`);
      }
      
      return {
        success: true,
        flashcards: result.flashcards,
        metadata: {
          iterations: result.iterations,
          analysis: result.finalAnalysis
        }
      };
    } else {
      throw new Error('Iterative generation failed');
    }
    
  } catch (error) {
    console.error('❌ Error in iterative flashcard generation:', error);
    
    // Fallback to simple generation
    console.log('🔄 Falling back to simple flashcard generation...');
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate educational flashcards from the transcript. Return only a JSON array of objects with "question" and "answer" fields.'
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
        flashcards = parseFlashcardsFromText(flashcardsText);
      }
      
      return { 
        success: true, 
        flashcards,
        metadata: {
          iterations: 1,
          fallback: true
        }
      };
      
    } catch (fallbackError) {
      console.error('❌ Fallback generation also failed:', fallbackError);
      return { 
        success: false, 
        error: error.message,
        flashcards: [
          { question: 'What were the main topics in this session?', answer: 'Review the session transcript for key concepts and ideas.' },
          { question: 'What should be studied from this material?', answer: 'Focus on the core concepts and principles discussed.' }
        ]
      };
    }
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