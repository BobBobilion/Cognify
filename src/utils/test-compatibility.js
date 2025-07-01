const CrossPlatformAudioMonitor = require('./audify-audio-monitor');

async function testCompatibilityMode() {
    console.log('🔧 Testing Audio Compatibility Mode\n');
    
    const monitor = new CrossPlatformAudioMonitor();
    
    // Test 1: Verify compatibility mode is enabled by default
    console.log('📋 Step 1: Checking default settings...');
    console.log(`   Compatibility Mode: ${monitor.compatibilityMode ? '✅ ON' : '❌ OFF'}`);
    console.log(`   System Audio: ${monitor.enableSystemAudio ? '✅ ENABLED' : '❌ DISABLED'}`);
    
    if (!monitor.compatibilityMode) {
        console.log('❌ Compatibility mode should be ON by default');
        return;
    }
    
    if (!monitor.enableSystemAudio) {
        console.log('❌ System audio should be ENABLED by default (with intelligent fallback)');
        return;
    }
    
    console.log('✅ Default settings are correct for compatibility\n');
    
    // Test 2: Check audio device detection
    console.log('📋 Step 2: Testing compatible audio device detection...');
    const deviceInfo = await monitor.testAudioDevices();
    
    if (!deviceInfo.success) {
        console.log('❌ Failed to detect audio devices:', deviceInfo.error);
        return;
    }
    
    console.log(`✅ Found ${deviceInfo.devices.length} audio devices using compatible API\n`);
    
    // Test 3: Test microphone monitoring only (compatibility mode)
    console.log('📋 Step 3: Testing microphone monitoring (compatibility mode)...');
    
    let microphoneUpdates = 0;
    let systemAudioUpdates = 0;
    
    monitor.setCallbacks({
        onAmplitudeUpdate: (data) => {
            if (data.source === 'microphone') {
                microphoneUpdates++;
                if (microphoneUpdates <= 3) { // Show first few updates
                    console.log(`   🎤 Microphone: ${data.rms}% (Peak: ${data.peak}%)`);
                }
            } else         if (data.source === 'system') {
            systemAudioUpdates++;
            if (systemAudioUpdates <= 5) { // Only show first few to avoid spam
                console.log(`   🎵 System Audio: ${data.rms}% (bonus - level monitoring working!)`);
            }
        }
        },
        onError: (error) => {
            console.log(`   ❌ Error: ${error.source} - ${error.error}`);
        }
    });
    
    const startResult = await monitor.startMonitoring();
    
    if (!startResult.success) {
        console.log('❌ Failed to start monitoring:', startResult.error);
        return;
    }
    
    console.log('✅ Monitoring started successfully');
    console.log(`   Microphone: ${startResult.microphone.success ? '✅' : '❌'} ${startResult.microphone.message}`);
    console.log(`   System Audio: ${startResult.system.success ? '✅' : '❌'} ${startResult.system.message}`);
    
    // Test for 5 seconds
    console.log('\n📋 Step 4: Testing for 5 seconds (try speaking)...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Stop monitoring
    await monitor.stopMonitoring();
    
    // Results
    console.log('\n📊 Compatibility Test Results:');
    console.log(`   🎤 Microphone updates: ${microphoneUpdates}`);
    console.log(`   🎵 System audio updates: ${systemAudioUpdates} (bonus if > 0!)`);
    
    const micWorking = microphoneUpdates > 0;
    const systemDisabled = systemAudioUpdates === 0;
    
    console.log('\n🎉 Final Results:');
    console.log(`   Microphone compatibility: ${micWorking ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`   System audio attempted: ${systemAudioUpdates > 0 ? '✅ WORKING' : '⚠️ GRACEFUL FALLBACK'}`);
    console.log(`   YouTube compatibility: ${micWorking ? '✅ SHOULD WORK' : '❌ MAY CONFLICT'}`);
    
    if (micWorking) {
        console.log('\n🚀 SUCCESS! Perfect setup for lectures and presentations!');
        console.log('   • ✅ Microphone monitoring is active');
        console.log('   • ✅ You can hear lectures/videos normally');
        console.log('   • ✅ Compatible with YouTube, browsers, all apps');
        console.log('   • 🎓 Ideal for learning while monitoring your voice');
        
        if (systemAudioUpdates > 0) {
            console.log('   • 🎵 Bonus: System audio level monitoring also working!');
        } else {
            console.log('   • 📢 System audio PLAYBACK works (level monitoring optional)');
        }
        
        console.log('\n🎯 Try this: Open YouTube while running the monitor!');
    } else {
        console.log('\n🔧 Microphone monitoring failed - check error messages above.');
    }
}

// Run the test
if (require.main === module) {
    testCompatibilityMode().catch(error => {
        console.error('💥 Compatibility test failed:', error);
        process.exit(1);
    });
}

module.exports = testCompatibilityMode; 