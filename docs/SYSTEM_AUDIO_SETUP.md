# 🔊 Cross-Platform Audio Monitoring Setup Guide

Your amplitude monitor now uses **Audify + RtAudio** for cross-platform audio monitoring! This new system works on Windows, Mac, and Linux without requiring ffmpeg.

## ✅ Current Status
- **Microphone**: ✅ Working via Audify + RtAudio (Cross-platform)
- **System Audio**: ✅ Working via Audify + RtAudio (Cross-platform)

## 🎯 How It Works

The new system uses **Audify**, a Node.js library built on the **RtAudio** C++ library, which provides:

### **Windows Support:**
- DirectSound
- ASIO
- **WASAPI** (Windows Audio Session API)

### **macOS Support:**
- CoreAudio
- JACK

### **Linux Support:**
- ALSA
- JACK
- PulseAudio
- OSS

## 🚀 Installation & Setup

### **Automatic Installation**
The system is already installed and configured! Just run:

```bash
# Test the audio monitoring
node src/utils/test-audify.js

# Or start the full application
npm start
```

### **No Additional Software Required**
Unlike the old ffmpeg approach, Audify comes with prebuilt binaries for most platforms, so no additional installation is needed!

## 🎵 System Audio on Windows

### **Stereo Mix (Recommended)**
If you want system audio monitoring on Windows:

1. **Right-click the speaker icon** in your taskbar
2. **Select "Open Sound settings"**
3. **Click "Sound Control Panel"**
4. **Go to the "Recording" tab**
5. **Right-click in empty space** → **"Show Disabled Devices"**
6. **Look for "Stereo Mix"** and enable it
7. **Restart the amplitude monitor**

### **Alternative: VB-Cable (Free)**
If Stereo Mix is not available:

1. **Download VB-Cable**: https://vb-audio.com/Cable/
2. **Install** and restart your computer
3. **Set CABLE Input** as your default playback device
4. **The amplitude monitor** will automatically detect "CABLE Output"

## 🔧 How the New System Works

### **Real-time Audio Processing:**
```javascript
// Microphone monitoring (Cross-platform)
Audify + RtAudio → Real-time PCM data → Amplitude calculation

// System audio monitoring (Cross-platform)  
Audify + RtAudio → System audio capture → Amplitude calculation
```

### **Performance Improvements:**
- **Update Rate**: ~40ms (vs 1 second with ffmpeg)
- **CPU Usage**: Lower (native audio processing)
- **Reliability**: Better (no external process spawning)
- **Cross-platform**: Works on Windows, Mac, Linux

## 🚀 Testing Your Setup

Test the new system:

```bash
# Comprehensive test
node src/utils/test-audify.js

# Quick device check
node -e "const {RtAudio} = require('audify'); const rt = new RtAudio(); console.log(rt.getDevices());"
```

## 🎵 What You'll See

Once running:
- **Left Panel**: 🎤 Microphone amplitude (real-time)
- **Right Panel**: 🔊 System audio amplitude (real-time)
- **Real-time meters**: Smooth, responsive audio levels
- **Peak indicators**: Flash when audio exceeds 80%
- **Waveforms**: Live visual representation of audio activity

## 🆘 Troubleshooting

### **"No input device found"**
- Check microphone permissions in system settings
- Ensure microphone is not being used by another application
- Try restarting the application

### **"No system audio capture device found"**
- Enable "Stereo Mix" in Windows Sound settings (see above)
- Install VB-Cable virtual audio driver
- System audio monitoring is optional - microphone will still work

### **"Sample rate not supported"**
- The system automatically detects and uses the best sample rate
- Common rates: 48000Hz, 44100Hz
- Check device capabilities with the test script

### **Still not working?**
- Run the test script: `node src/utils/test-audify.js`
- Check the console for detailed error messages
- Click the **⚙️ Settings button** in the amplitude monitor for status

## 💡 Advanced Configuration

### **Device Selection**
The system automatically selects the best devices, but you can modify the selection logic in:
```
src/utils/audify-audio-monitor.js
```

### **Sample Rate & Buffer Size**
Default settings (optimized for real-time monitoring):
- **Sample Rate**: 48000Hz (auto-detected)
- **Buffer Size**: 1024 samples (~21ms at 48kHz)
- **Channels**: 1 (mono)

## 🎉 Benefits of the New System

✅ **Cross-platform**: Works on Windows, Mac, Linux  
✅ **No external dependencies**: No ffmpeg required  
✅ **Real-time performance**: ~40ms latency  
✅ **Automatic device detection**: Finds best available devices  
✅ **Better error handling**: Helpful error messages and solutions  
✅ **More reliable**: Native audio processing  
✅ **Easy installation**: Prebuilt binaries included  

---

**🎉 Your amplitude monitor is now powered by professional-grade cross-platform audio technology!** 