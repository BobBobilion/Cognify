// Quick test to verify SoX installation
const { exec } = require('child_process');

console.log('🔍 Testing SoX installation...\n');

exec('sox --version', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ SoX NOT FOUND');
    console.log('Error:', error.message);
    console.log('\n📥 TO FIX:');
    console.log('1. Download: https://sourceforge.net/projects/sox/files/sox/14.4.2/sox-14.4.2-win32.exe/download');
    console.log('2. Install as Administrator');
    console.log('3. CHECK "Add to PATH" during installation');
    console.log('4. Restart terminal and try again');
  } else {
    console.log('✅ SoX FOUND!');
    console.log('Version:', stdout.trim());
    console.log('\n🎉 Audio recording should work now!');
    console.log('Try: npm start');
  }
});

// Also test node-record-lpcm16
try {
  const recorder = require('node-record-lpcm16');
  console.log('✅ node-record-lpcm16 package installed');
} catch (error) {
  console.log('❌ node-record-lpcm16 package missing');
  console.log('Run: npm install');
} 