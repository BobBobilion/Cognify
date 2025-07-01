const CrossPlatformAudioMonitor = require('./audify-audio-monitor');

async function testAudifyAudioMonitoring() {
    console.log('🎵 Testing Audify Cross-Platform Audio Monitoring\n');
    
    const monitor = new CrossPlatformAudioMonitor();
    
    // Test 1: Get available audio devices
    console.log('📋 Step 1: Getting available audio devices...');
    const deviceInfo = await monitor.testAudioDevices();
    
    if (!deviceInfo.success) {
        console.error('❌ Failed to get audio devices:', deviceInfo.error);
        return;
    }
    
    console.log(`✅ Found ${deviceInfo.devices.length} audio devices\n`);
    
    // Test 2: Set up callbacks to monitor audio levels
    console.log('📋 Step 2: Setting up audio monitoring callbacks...');
    
    let microphoneUpdates = 0;
    let systemAudioUpdates = 0;
    let lastMicLevel = 0;
    let lastSystemLevel = 0;
    
    monitor.setCallbacks({
        onAmplitudeUpdate: (data) => {
            if (data.source === 'microphone') {
                microphoneUpdates++;
                lastMicLevel = data.rms;
                if (microphoneUpdates % 10 === 0) { // Log every 10th update
                    console.log(`🎤 Microphone: ${data.rms}% (Peak: ${data.peak}%)`);
                }
            } else if (data.source === 'system') {
                systemAudioUpdates++;
                lastSystemLevel = data.rms;
                if (systemAudioUpdates % 10 === 0) { // Log every 10th update
                    console.log(`🔊 System Audio: ${data.rms}% (Peak: ${data.peak}%)`);
                }
            }
        },
        onError: (error) => {
            console.error(`❌ ${error.source} error:`, error.error);
            if (error.solutions) {
                console.log('💡 Suggested solutions:');
                error.solutions.forEach((solution, index) => {
                    console.log(`   ${index + 1}. ${solution}`);
                });
            }
        }
    });
    
    // Test 3: Start monitoring
    console.log('📋 Step 3: Starting audio monitoring...');
    const startResult = await monitor.startMonitoring();
    
    if (!startResult.success) {
        console.error('❌ Failed to start monitoring:', startResult.error);
        return;
    }
    
    console.log('✅ Audio monitoring started successfully!');
    console.log(`   Microphone: ${startResult.microphone.success ? '✅' : '❌'} ${startResult.microphone.message}`);
    console.log(`   System Audio: ${startResult.system.success ? '✅' : '❌'} ${startResult.system.message}`);
    
    // Test 4: Monitor for 10 seconds
    console.log('\n📋 Step 4: Monitoring audio levels for 10 seconds...');
    console.log('💡 Try speaking into your microphone or playing some audio!');
    console.log('   (Audio levels will be displayed every second)\n');
    
    const monitoringDuration = 10000; // 10 seconds
    const startTime = Date.now();
    
    const statusInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.ceil((monitoringDuration - elapsed) / 1000);
        
        if (remaining > 0) {
            const levels = monitor.getCurrentLevels();
            console.log(`⏱️  ${remaining}s remaining - Mic: ${levels.microphone.rms}% | System: ${levels.system.rms}%`);
        }
    }, 1000);
    
    // Wait for monitoring duration
    await new Promise(resolve => setTimeout(resolve, monitoringDuration));
    
    clearInterval(statusInterval);
    
    // Test 5: Stop monitoring and show results
    console.log('\n📋 Step 5: Stopping audio monitoring...');
    const stopResult = await monitor.stopMonitoring();
    
    if (stopResult.success) {
        console.log('✅ Audio monitoring stopped successfully');
    } else {
        console.error('❌ Error stopping monitoring:', stopResult.error);
    }
    
    // Show final results
    console.log('\n📊 Test Results Summary:');
    console.log(`🎤 Microphone updates received: ${microphoneUpdates}`);
    console.log(`🔊 System audio updates received: ${systemAudioUpdates}`);
    console.log(`🎯 Last microphone level: ${lastMicLevel}%`);
    console.log(`🎯 Last system audio level: ${lastSystemLevel}%`);
    
    // Determine test success
    const microphoneWorking = microphoneUpdates > 0;
    const systemAudioWorking = systemAudioUpdates > 0;
    
    console.log('\n🎉 Final Status:');
    console.log(`   Microphone monitoring: ${microphoneWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
    console.log(`   System audio monitoring: ${systemAudioWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
    
    if (microphoneWorking) {
        console.log('\n🚀 Great! Your amplitude monitor should work perfectly now!');
        console.log('   Next steps:');
        console.log('   1. Run: npm start');
        console.log('   2. Click "Audio Monitor" in the sidebar');
        console.log('   3. Enjoy real-time audio monitoring!');
    } else {
        console.log('\n🔧 Microphone monitoring failed. Please check:');
        console.log('   1. Microphone permissions');
        console.log('   2. Microphone is not being used by another app');
        console.log('   3. Microphone is properly connected');
    }
    
    if (!systemAudioWorking) {
        console.log('\n💡 System audio monitoring is optional but recommended.');
        console.log('   To enable it:');
        console.log('   1. Enable "Stereo Mix" in Windows Sound settings');
        console.log('   2. Or install VB-Cable virtual audio driver');
        console.log('   3. Check the system audio setup guide in docs/');
    }
}

// Run the test
if (require.main === module) {
    testAudifyAudioMonitoring().catch(error => {
        console.error('💥 Test failed with error:', error);
        process.exit(1);
    });
}

module.exports = testAudifyAudioMonitoring; 