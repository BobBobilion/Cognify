const { RtAudio, RtAudioFormat, RtAudioApi } = require('audify');

class CrossPlatformAudioMonitor {
    constructor() {
        this.micRtAudio = null;
        this.systemRtAudio = null;
        this.isMonitoring = false;
        this.callbacks = {
            onAmplitudeUpdate: null,
            onError: null
        };
        
        // Audio processing state
        this.micAmplitude = 0;
        this.systemAmplitude = 0;
        this.micPeak = 0;
        this.systemPeak = 0;
        
        // Audio analysis settings
        this.sampleRate = 48000; // Use 48kHz which is more widely supported
        this.frameSize = 1024; // Smaller frame size for more responsive updates
        this.channels = 1;
        
        // Compatibility settings to avoid conflicts with other apps
        this.compatibilityMode = true; // Use shared audio APIs instead of exclusive ones
        this.enableSystemAudio = true; // Enable system audio with shared access
        this.useSharedMode = true; // Use shared mode for all audio access
        
        console.log('CrossPlatformAudioMonitor initialized (Compatibility Mode: ON)');
    }

    // Get available audio devices using compatible API
    getAudioDevices() {
        try {
            const rtAudio = this.createCompatibleRtAudio();
            const devices = rtAudio.getDevices();
            
            // Clean up
            try {
                if (rtAudio.isStreamOpen()) {
                    rtAudio.closeStream();
                }
            } catch (e) {
                // Ignore cleanup errors
            }
            
            return {
                success: true,
                devices: devices.map((device, index) => ({
                    id: index,
                    name: device.name,
                    inputChannels: device.inputChannels,
                    outputChannels: device.outputChannels,
                    isDefaultInput: device.isDefaultInput,
                    isDefaultOutput: device.isDefaultOutput,
                    sampleRates: device.sampleRates,
                    preferredSampleRate: device.preferredSampleRate
                }))
            };
        } catch (error) {
            console.error('Failed to get audio devices:', error);
            return {
                success: false,
                error: error.message,
                devices: []
            };
        }
    }

    // Create RtAudio instance with compatible API
    createCompatibleRtAudio() {
        if (!this.compatibilityMode) {
            return new RtAudio(); // Use default API
        }

        // Try compatible APIs in order of preference (shared mode)
        const compatibleApis = [];
        
        // Windows: Prefer DirectSound > WASAPI > WinMM (avoid ASIO for compatibility)
        if (process.platform === 'win32') {
            compatibleApis.push(
                1,  // DirectSound - most compatible
                2,  // WASAPI - usually shared mode
                3   // WinMM - old but very compatible
            );
        }
        // macOS: CoreAudio is usually fine
        else if (process.platform === 'darwin') {
            compatibleApis.push(4); // CoreAudio
        }
        // Linux: PulseAudio > ALSA
        else {
            compatibleApis.push(
                5,  // PulseAudio
                6   // ALSA
            );
        }

        // Try each API until one works
        for (const api of compatibleApis) {
            try {
                console.log(`Trying audio API: ${this.getApiName(api)}`);
                const rtAudio = new RtAudio(api);
                console.log(`✅ Using audio API: ${this.getApiName(api)} (Compatible mode)`);
                return rtAudio;
            } catch (error) {
                console.log(`❌ ${this.getApiName(api)} not available:`, error.message);
            }
        }

        // Fallback to default if all specific APIs fail
        console.log('Falling back to default audio API');
        return new RtAudio();
    }

    // Get API name for logging
    getApiName(api) {
        const apiNames = {
            0: 'Unspecified',
            1: 'DirectSound',
            2: 'WASAPI', 
            3: 'WinMM',
            4: 'CoreAudio',
            5: 'PulseAudio',
            6: 'ALSA',
            7: 'JACK',
            8: 'ASIO',
            9: 'OSS'
        };
        return apiNames[api] || `API_${api}`;
    }

    // Enable/disable compatibility mode
    setCompatibilityMode(enabled) {
        this.compatibilityMode = enabled;
        console.log(`Compatibility mode: ${enabled ? 'ON' : 'OFF'}`);
    }

    // Enable/disable system audio monitoring
    setSystemAudioEnabled(enabled) {
        this.enableSystemAudio = enabled;
        console.log(`System audio monitoring: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }

    // Set event callbacks
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    // Calculate RMS amplitude from PCM data
    calculateAmplitude(pcmData) {
        if (!pcmData || pcmData.length === 0) {
            return { rms: 0, peak: 0 };
        }

        let sum = 0;
        let peak = 0;
        const samples = pcmData.length / 2; // 16-bit = 2 bytes per sample

        // Convert buffer to 16-bit signed integers and calculate RMS
        for (let i = 0; i < pcmData.length; i += 2) {
            const sample = pcmData.readInt16LE(i);
            const amplitude = Math.abs(sample);
            
            sum += amplitude * amplitude;
            peak = Math.max(peak, amplitude);
        }

        const rms = Math.sqrt(sum / samples);
        
        // Convert to percentage (0-100)
        const rmsPercentage = Math.min(Math.round((rms / 32767) * 100), 100);
        const peakPercentage = Math.min(Math.round((peak / 32767) * 100), 100);

        return {
            rms: rmsPercentage,
            peak: peakPercentage
        };
    }

    // Start microphone monitoring
    async startMicrophoneMonitoring() {
        try {
            console.log('Starting microphone monitoring with Audify...');
            
            this.micRtAudio = this.createCompatibleRtAudio();
            const devices = this.micRtAudio.getDevices();
            let inputDevice = this.micRtAudio.getDefaultInputDevice();
            let deviceInfo = devices[inputDevice];
            
            console.log(`Available devices: ${devices.length}`);
            devices.forEach((device, index) => {
                console.log(`  ${index}: ${device.name} (In: ${device.inputChannels}, Out: ${device.outputChannels})`);
            });
            
            // Find the best input device
            if (!deviceInfo || deviceInfo.inputChannels === 0) {
                // Look for a device with input channels
                for (let i = 0; i < devices.length; i++) {
                    if (devices[i].inputChannels > 0) {
                        inputDevice = i;
                        deviceInfo = devices[i];
                        break;
                    }
                }
            }
            
            if (!deviceInfo || deviceInfo.inputChannels === 0) {
                throw new Error('No input device found with available input channels');
            }
            
            console.log(`Using microphone device: ${deviceInfo.name} (${deviceInfo.inputChannels} channels)`);
            
            // Use the device's preferred sample rate or fall back to common rates
            let sampleRate = this.sampleRate;
            if (deviceInfo.preferredSampleRate && deviceInfo.sampleRates.includes(deviceInfo.preferredSampleRate)) {
                sampleRate = deviceInfo.preferredSampleRate;
            } else if (deviceInfo.sampleRates.includes(48000)) {
                sampleRate = 48000;
            } else if (deviceInfo.sampleRates.includes(44100)) {
                sampleRate = 44100;
            } else if (deviceInfo.sampleRates.length > 0) {
                sampleRate = deviceInfo.sampleRates[0];
            }
            
            console.log(`Using sample rate: ${sampleRate}Hz`);

            // Open input stream for microphone
            this.micRtAudio.openStream(
                null, // No output needed for microphone monitoring
                {
                    deviceId: inputDevice,
                    nChannels: Math.min(this.channels, deviceInfo.inputChannels),
                    firstChannel: 0
                },
                RtAudioFormat.RTAUDIO_SINT16,
                sampleRate,
                this.frameSize,
                'CognifyMicMonitor',
                (inputBuffer) => {
                    if (!this.isMonitoring) return;
                    
                    // Calculate amplitude from input buffer
                    const amplitude = this.calculateAmplitude(inputBuffer);
                    
                    this.micAmplitude = amplitude.rms;
                    this.micPeak = Math.max(this.micPeak, amplitude.peak);
                    
                    // Send update to renderer
                    if (this.callbacks.onAmplitudeUpdate) {
                        this.callbacks.onAmplitudeUpdate({
                            source: 'microphone',
                            rms: this.micAmplitude,
                            peak: amplitude.peak,
                            timestamp: Date.now()
                        });
                    }
                }
            );

            this.micRtAudio.start();
            console.log('✅ Microphone monitoring started successfully');
            
            return { success: true, message: 'Microphone monitoring started' };
            
        } catch (error) {
            console.error('Failed to start microphone monitoring:', error);
            
            if (this.callbacks.onError) {
                this.callbacks.onError({
                    source: 'microphone',
                    error: error.message,
                    solutions: [
                        'Check microphone permissions in system settings',
                        'Ensure microphone is not being used by another application',
                        'Try restarting the application',
                        'Check if microphone is properly connected',
                        'Try using a different audio device if available'
                    ]
                });
            }
            
            return { success: false, error: error.message };
        }
    }

    // Start system audio monitoring with intelligent fallback
    async startSystemAudioMonitoring() {
        try {
            console.log('Starting system audio monitoring with shared access...');
            
            // First, try to find system audio capture devices
            const result = await this.trySystemAudioCapture();
            if (result.success) {
                return result;
            }
            
            // If direct capture fails, try WASAPI loopback approach
            console.log('Direct capture failed, trying WASAPI loopback...');
            const loopbackResult = await this.tryWASAPILoopback();
            if (loopbackResult.success) {
                return loopbackResult;
            }
            
            // If both fail, provide helpful guidance
            throw new Error('System audio monitoring not available. This won\'t affect microphone monitoring or your ability to hear lectures.');
            
        } catch (error) {
            console.error('System audio monitoring unavailable:', error.message);
            
            if (this.callbacks.onError) {
                this.callbacks.onError({
                    source: 'system',
                    error: error.message,
                    solutions: [
                        'You can still hear lectures/videos normally',
                        'Microphone monitoring works perfectly',
                        'To enable system audio monitoring:',
                        '  • Enable "Stereo Mix" in Windows Sound settings',
                        '  • Or install VB-Cable (free virtual audio driver)',
                        'System audio monitoring is optional for most users'
                    ]
                });
            }
            
            return { success: false, error: error.message };
        }
    }

    // Try traditional system audio capture (Stereo Mix, etc.)
    async trySystemAudioCapture() {
        try {
            this.systemRtAudio = this.createCompatibleRtAudio();
            const devices = this.systemRtAudio.getDevices();
            
            console.log('Looking for system audio capture devices...');
            
            // Look for stereo mix, loopback, or similar devices
            for (let i = 0; i < devices.length; i++) {
                const device = devices[i];
                const name = device.name.toLowerCase();
                
                console.log(`  Checking device ${i}: ${device.name} (In: ${device.inputChannels}, Out: ${device.outputChannels})`);
                
                if (device.inputChannels > 0 && (
                    name.includes('stereo mix') || 
                    name.includes('loopback') || 
                    name.includes('what u hear') ||
                    name.includes('wave out mix') ||
                    name.includes('speakers') && name.includes('realtek') ||
                    name.includes('monitor') ||
                    name.includes('capture')
                )) {
                    console.log(`  ✅ Found system audio device: ${device.name}`);
                    
                    // Try to open this device
                    return await this.openSystemAudioDevice(i, device);
                }
            }
            
            throw new Error('No traditional system audio capture device found');
            
        } catch (error) {
            console.log('Traditional system audio capture failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Try WASAPI loopback for system audio (Windows 10+)
    async tryWASAPILoopback() {
        try {
            console.log('Attempting WASAPI loopback capture...');
            
            // Create a WASAPI-specific instance
            this.systemRtAudio = new RtAudio(2); // WASAPI
            const devices = this.systemRtAudio.getDevices();
            
            // Look for the default output device to use as loopback input
            const defaultOutput = this.systemRtAudio.getDefaultOutputDevice();
            if (defaultOutput !== -1 && devices[defaultOutput]) {
                const device = devices[defaultOutput];
                console.log(`Trying WASAPI loopback on: ${device.name}`);
                
                // Try to open in loopback mode (this is a Windows-specific feature)
                return await this.openSystemAudioDevice(defaultOutput, device, true);
            }
            
            throw new Error('WASAPI loopback not available');
            
        } catch (error) {
            console.log('WASAPI loopback failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Open system audio device with proper error handling
    async openSystemAudioDevice(deviceId, deviceInfo, isLoopback = false) {
        try {
            // Use appropriate sample rate for this device
            let sampleRate = this.sampleRate;
            if (deviceInfo.preferredSampleRate && deviceInfo.sampleRates.includes(deviceInfo.preferredSampleRate)) {
                sampleRate = deviceInfo.preferredSampleRate;
            } else if (deviceInfo.sampleRates.includes(48000)) {
                sampleRate = 48000;
            } else if (deviceInfo.sampleRates.includes(44100)) {
                sampleRate = 44100;
            } else if (deviceInfo.sampleRates.length > 0) {
                sampleRate = deviceInfo.sampleRates[0];
            }
            
            console.log(`Using sample rate: ${sampleRate}Hz for system audio`);
            console.log(`Opening ${isLoopback ? 'loopback' : 'capture'} stream on: ${deviceInfo.name}`);

            // Open input-only stream to capture system audio
            this.systemRtAudio.openStream(
                null, // No output needed for monitoring
                {
                    deviceId: deviceId,
                    nChannels: Math.min(this.channels, deviceInfo.inputChannels || 2),
                    firstChannel: 0
                },
                RtAudioFormat.RTAUDIO_SINT16,
                sampleRate,
                this.frameSize,
                'CognifySystemMonitor',
                (inputBuffer) => {
                    if (!this.isMonitoring) return;
                    
                    // Calculate amplitude from system audio
                    const amplitude = this.calculateAmplitude(inputBuffer);
                    
                    this.systemAmplitude = amplitude.rms;
                    this.systemPeak = Math.max(this.systemPeak, amplitude.peak);
                    
                    // Send update to renderer
                    if (this.callbacks.onAmplitudeUpdate) {
                        this.callbacks.onAmplitudeUpdate({
                            source: 'system',
                            rms: this.systemAmplitude,
                            peak: amplitude.peak,
                            timestamp: Date.now()
                        });
                    }
                }
            );

            this.systemRtAudio.start();
            console.log(`✅ System audio monitoring started (${isLoopback ? 'loopback' : 'capture'} mode)`);
            
            return { 
                success: true, 
                message: `System audio monitoring started (${isLoopback ? 'loopback' : 'capture'} mode)`,
                mode: isLoopback ? 'loopback' : 'capture'
            };
            
        } catch (error) {
            console.error(`Failed to open ${isLoopback ? 'loopback' : 'capture'} stream:`, error.message);
            throw error;
        }
    }

    // Start both microphone and system audio monitoring
    async startMonitoring() {
        try {
            console.log('Starting cross-platform audio monitoring...');
            this.isMonitoring = true;
            
            // Start microphone monitoring (this usually works)
            const micResult = await this.startMicrophoneMonitoring();
            
            // Start system audio monitoring with intelligent fallback
            console.log('Attempting system audio monitoring...');
            const systemResult = await this.startSystemAudioMonitoring();
            
            // Reset peak values periodically
            this.peakResetInterval = setInterval(() => {
                this.micPeak = Math.max(0, this.micPeak - 2);
                this.systemPeak = Math.max(0, this.systemPeak - 2);
            }, 1000);
            
            return {
                success: true,
                microphone: micResult,
                system: systemResult,
                message: systemResult.success ? 'Audio monitoring started (mic + system audio)' : 'Audio monitoring started (microphone only - you can still hear lectures normally)'
            };
            
        } catch (error) {
            console.error('Failed to start audio monitoring:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Stop monitoring
    async stopMonitoring() {
        try {
            console.log('Stopping audio monitoring...');
            this.isMonitoring = false;
            
            // Clear peak reset interval
            if (this.peakResetInterval) {
                clearInterval(this.peakResetInterval);
                this.peakResetInterval = null;
            }
            
            // Stop and close microphone stream
            if (this.micRtAudio) {
                try {
                    if (this.micRtAudio.isStreamRunning()) {
                        this.micRtAudio.stop();
                    }
                    if (this.micRtAudio.isStreamOpen()) {
                        this.micRtAudio.closeStream();
                    }
                } catch (error) {
                    console.warn('Error stopping microphone:', error.message);
                }
                this.micRtAudio = null;
            }
            
            // Stop and close system audio stream
            if (this.systemRtAudio) {
                try {
                    if (this.systemRtAudio.isStreamRunning()) {
                        this.systemRtAudio.stop();
                    }
                    if (this.systemRtAudio.isStreamOpen()) {
                        this.systemRtAudio.closeStream();
                    }
                } catch (error) {
                    console.warn('Error stopping system audio:', error.message);
                }
                this.systemRtAudio = null;
            }
            
            console.log('✅ Audio monitoring stopped');
            return { success: true, message: 'Audio monitoring stopped' };
            
        } catch (error) {
            console.error('Error stopping audio monitoring:', error);
            return { success: false, error: error.message };
        }
    }

    // Get current audio levels
    getCurrentLevels() {
        return {
            microphone: {
                rms: this.micAmplitude,
                peak: this.micPeak
            },
            system: {
                rms: this.systemAmplitude,
                peak: this.systemPeak
            }
        };
    }

    // Test audio devices
    async testAudioDevices() {
        try {
            const deviceInfo = this.getAudioDevices();
            
            console.log('=== Audio Device Test ===');
            console.log(`Found ${deviceInfo.devices.length} audio devices:`);
            
            deviceInfo.devices.forEach((device, index) => {
                console.log(`${index}: ${device.name}`);
                console.log(`  Input channels: ${device.inputChannels}`);
                console.log(`  Output channels: ${device.outputChannels}`);
                console.log(`  Default input: ${device.isDefaultInput}`);
                console.log(`  Default output: ${device.isDefaultOutput}`);
                console.log(`  Sample rates: ${device.sampleRates.join(', ')}`);
                console.log('');
            });
            
            return deviceInfo;
            
        } catch (error) {
            console.error('Audio device test failed:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = CrossPlatformAudioMonitor; 