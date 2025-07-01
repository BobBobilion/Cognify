// Quick test to verify ffmpeg installation and audio devices
const { exec, spawn } = require('child_process');

console.log('🔍 Testing ffmpeg installation and audio devices...\n');

// Test 1: Check ffmpeg version
console.log('1️⃣ Testing ffmpeg installation...');
exec('ffmpeg -version', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ ffmpeg NOT FOUND');
    console.log('Error:', error.message);
    console.log('\n📥 TO FIX:');
    console.log('1. Download: https://ffmpeg.org/download.html#build-windows');
    console.log('2. Extract to C:\\ffmpeg');
    console.log('3. Add C:\\ffmpeg\\bin to your PATH');
    console.log('4. Restart terminal and try again');
    return;
  }
  
  console.log('✅ ffmpeg FOUND!');
  const versionMatch = stdout.match(/ffmpeg version ([^\s]+)/);
  if (versionMatch) {
    console.log('Version:', versionMatch[1]);
  }
  
  // Test 2: List DirectShow audio devices
  console.log('\n2️⃣ Testing DirectShow audio devices...');
  exec('ffmpeg -list_devices true -f dshow -i dummy', (error, stdout, stderr) => {
    const output = stderr; // ffmpeg sends device list to stderr
    
    console.log('📱 Available Audio Input Devices:');
    const audioInputs = output.match(/\[dshow.*?\] "([^"]+)" \(audio\)/g);
    
    if (audioInputs) {
      audioInputs.forEach((device, index) => {
        const name = device.match(/"([^"]+)"/)[1];
        console.log(`   ${index + 1}. ${name}`);
      });
    } else {
      console.log('   ❌ No DirectShow audio devices found');
    }
    
    // Test 3: Check WASAPI devices for system audio
    console.log('\n3️⃣ Testing WASAPI system audio...');
    exec('ffmpeg -list_devices true -f wasapi -i dummy', (error, stdout, stderr) => {
      const wasapiOutput = stderr;
      
      console.log('🔊 Available WASAPI Devices:');
      const wasapiDevices = wasapiOutput.match(/\[wasapi.*?\] "([^"]+)"/g);
      
      if (wasapiDevices) {
        wasapiDevices.forEach((device, index) => {
          const name = device.match(/"([^"]+)"/)[1];
          console.log(`   ${index + 1}. ${name}`);
        });
      } else {
        console.log('   ❌ No WASAPI devices found');
      }
      
      // Test 4: Quick microphone test
      console.log('\n4️⃣ Testing microphone capture (5 seconds)...');
      testMicrophoneCapture();
    });
  });
});

function testMicrophoneCapture() {
  const testArgs = [
    '-f', 'dshow',
    '-i', 'audio=Microphone Array (Realtek(R) Audio)',
    '-af', 'volumedetect',
    '-f', 'null',
    '-t', '5',
    '-'
  ];
  
  console.log('Command: ffmpeg', testArgs.join(' '));
  
  const testProcess = spawn('ffmpeg', testArgs);
  let hasVolume = false;
  
  testProcess.stderr.on('data', (data) => {
    const output = data.toString();
    
    // Look for volume detection
    if (output.includes('mean_volume:')) {
      hasVolume = true;
      const volumeMatch = output.match(/mean_volume: ([-\d.]+) dB/);
      const maxVolumeMatch = output.match(/max_volume: ([-\d.]+) dB/);
      
      if (volumeMatch) {
        console.log(`📊 Detected volume: ${volumeMatch[1]} dB`);
      }
      if (maxVolumeMatch) {
        console.log(`📊 Peak volume: ${maxVolumeMatch[1]} dB`);
      }
    }
    
    // Show progress
    if (output.includes('time=')) {
      const timeMatch = output.match(/time=(\d+:\d+:\d+)/);
      if (timeMatch) {
        process.stdout.write(`\r   Recording... ${timeMatch[1]}`);
      }
    }
  });
  
  testProcess.on('close', (code) => {
    console.log('\n');
    
    if (code === 0 && hasVolume) {
      console.log('✅ Microphone test PASSED!');
      console.log('🎉 Amplitude monitoring should work!');
      console.log('\nNext steps:');
      console.log('1. Run: npm start');
      console.log('2. Click "Audio Monitor" in the sidebar');
      console.log('3. Speak into your microphone to see amplitude levels');
    } else if (code === 0) {
      console.log('⚠️ Microphone test completed but no volume detected');
      console.log('💡 Try speaking into your microphone during the test');
    } else {
      console.log('❌ Microphone test FAILED');
      console.log('🔧 Check your microphone permissions and device name');
    }
  });
  
  testProcess.on('error', (error) => {
    console.log('\n❌ Microphone test error:', error.message);
  });
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test interrupted by user');
  process.exit(0);
}); 