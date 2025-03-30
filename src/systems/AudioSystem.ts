export class AudioSystem {
    private audioContext!: AudioContext;
    private masterGainNode!: GainNode;
    private musicGainNode!: GainNode;
    private drumGainNode!: GainNode;
    public isReady: boolean = false;
    private readyCallback: (() => void) | null = null;
    constructor() {
        this.initializeAudioContext();
        const userInteractionHandler = () => {
            this.isReady = true;
            if (this.readyCallback) {
                this.readyCallback();
                this.readyCallback = null;
            }
            // Remove the event listeners after initialization to prevent multiple calls
            document.removeEventListener('click', userInteractionHandler);
            document.removeEventListener('keydown', userInteractionHandler);
            document.removeEventListener('touchstart', userInteractionHandler);
            document.removeEventListener('pointerdown', userInteractionHandler);
        };
    
        document.addEventListener('click', userInteractionHandler);
        document.addEventListener('keydown', userInteractionHandler);
        document.addEventListener('touchstart', userInteractionHandler);
        document.addEventListener('pointerdown', userInteractionHandler);
    }

    private initializeAudioContext(): void {
        this.audioContext = new AudioContext();
        this.masterGainNode = this.audioContext.createGain();
        this.musicGainNode = this.audioContext.createGain();
        this.drumGainNode = this.audioContext.createGain();
        this.masterGainNode.connect(this.audioContext.destination);
        this.musicGainNode.connect(this.masterGainNode);
        this.drumGainNode.connect(this.masterGainNode);
    }

    public setReadyCallback(callback: () => void): void {
        this.readyCallback = callback;
    }

    public clearReadyCallback(): void {
        this.readyCallback = null;
    }

    public getAudioContext(): AudioContext {
        return this.audioContext;
    }

    public getMusicGainNode(): GainNode {
        return this.musicGainNode;
    }

    public getDrumGainNode(): GainNode {
        return this.drumGainNode;
    }

    public getMasterGainNode(): GainNode {
        return this.masterGainNode;
    }

    public playKick(time: number): void {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        // Configure kick drum sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(150, time);
        oscillator.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, time);
        filter.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

        gainNode.gain.setValueAtTime(0.3, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

        // Connect nodes
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.drumGainNode);

        // Start and stop
        oscillator.start(time);
        oscillator.stop(time + 0.5);

        // Cleanup
        oscillator.onended = () => {
            oscillator.disconnect();
            filter.disconnect();
            gainNode.disconnect();
        };
    }

    public playHiHat(time: number): void {
        const noise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        // Generate white noise
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;

        // Configure hi-hat sound
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, time);
        filter.frequency.exponentialRampToValueAtTime(2000, time + 0.1);

        gainNode.gain.setValueAtTime(0.1, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

        // Connect nodes
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.drumGainNode);

        // Start and stop
        noise.start(time);
        noise.stop(time + 0.1);

        // Cleanup
        noise.onended = () => {
            noise.disconnect();
            filter.disconnect();
            gainNode.disconnect();
        };
    }

    public playClap(time: number): void {
        const noise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        // Generate white noise
        const bufferSize = this.audioContext.sampleRate * 0.2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;

        // Configure clap sound
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, time);
        filter.frequency.exponentialRampToValueAtTime(1000, time + 0.2);
        filter.Q.setValueAtTime(2, time);

        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.2, time + 0.01); // Quick attack
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.2); // Longer release

        // Connect nodes
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.drumGainNode);

        // Start and stop
        noise.start(time);
        noise.stop(time + 0.2);

        // Cleanup
        noise.onended = () => {
            noise.disconnect();
            filter.disconnect();
            gainNode.disconnect();
        };
    }

    public playBullet(): void {
        // Create oscillator for the bullet sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Configure the sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5 note
        oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.1); // A4 note

        // Configure the envelope
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);

        // Start and stop the sound
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);

        // Clean up nodes after they're done
        oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
        };
    }

    public playExplosion(): void {
        const now = this.audioContext.currentTime;
        const duration = 2.0; // Increased duration for more impact

        // Create noise generator
        const noise = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        const noiseFilter = this.audioContext.createBiquadFilter();
        
        // Generate white noise
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;

        // Configure noise filter - much lower frequency range
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(200, now);  // Much lower starting frequency
        noiseFilter.frequency.exponentialRampToValueAtTime(20, now + duration);  // Much lower ending frequency
        noiseFilter.Q.setValueAtTime(1, now);

        // Configure noise envelope - longer attack and higher volume
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.8, now + 0.05);  // Longer attack and higher volume
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Create low frequency oscillator for rumble - more prominent
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(30, now);  // Higher starting frequency
        lfo.frequency.exponentialRampToValueAtTime(15, now + duration);  // Higher ending frequency
        lfoGain.gain.setValueAtTime(0.8, now);  // Increased volume
        lfoGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Add a second low frequency oscillator for more bass content
        const lfo2 = this.audioContext.createOscillator();
        const lfo2Gain = this.audioContext.createGain();
        lfo2.type = 'sine';
        lfo2.frequency.setValueAtTime(30, now);
        lfo2.frequency.exponentialRampToValueAtTime(10, now + duration);
        lfo2Gain.gain.setValueAtTime(0.6, now);  // Increased volume
        lfo2Gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Add a frequency sweep oscillator for the main explosion sound
        const sweepOsc = this.audioContext.createOscillator();
        const sweepGain = this.audioContext.createGain();
        const sweepFilter = this.audioContext.createBiquadFilter();
        
        sweepOsc.type = 'sine';
        sweepOsc.frequency.setValueAtTime(100, now);  // Start at lower frequency
        sweepOsc.frequency.exponentialRampToValueAtTime(20, now + duration);  // Sweep down to very low frequency
        
        sweepFilter.type = 'lowpass';
        sweepFilter.frequency.setValueAtTime(500, now);  // Lower filter frequency
        sweepFilter.frequency.exponentialRampToValueAtTime(50, now + duration);  // Lower ending frequency
        
        sweepGain.gain.setValueAtTime(0, now);
        sweepGain.gain.linearRampToValueAtTime(0.8, now + 0.01);  // Quick attack and higher volume
        sweepGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Connect nodes
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGainNode);
        lfo.connect(lfoGain);
        lfoGain.connect(this.masterGainNode);
        lfo2.connect(lfo2Gain);
        lfo2Gain.connect(this.masterGainNode);
        sweepOsc.connect(sweepFilter);
        sweepFilter.connect(sweepGain);
        sweepGain.connect(this.masterGainNode);

        // Start and stop sounds
        noise.start(now);
        noise.stop(now + duration);
        lfo.start(now);
        lfo.stop(now + duration);
        lfo2.start(now);
        lfo2.stop(now + duration);
        sweepOsc.start(now);
        sweepOsc.stop(now + duration);

        // Clean up nodes after they're done
        noise.onended = () => {
            noise.disconnect();
            noiseFilter.disconnect();
            noiseGain.disconnect();
        };
        lfo.onended = () => {
            lfo.disconnect();
            lfoGain.disconnect();
        };
        lfo2.onended = () => {
            lfo2.disconnect();
            lfo2Gain.disconnect();
        };
        sweepOsc.onended = () => {
            sweepOsc.disconnect();
            sweepFilter.disconnect();
            sweepGain.disconnect();
        };
    }

    public playWarning(): void {
        const now = this.audioContext.currentTime;
        const duration = 0.5; // Duration of the warning sound

        // Create main oscillator for warning sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        // Configure the warning sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, now); // A4 note
        oscillator.frequency.exponentialRampToValueAtTime(880, now + duration/2); // A5 note
        oscillator.frequency.exponentialRampToValueAtTime(440, now + duration); // Back to A4

        // Configure filter
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(2000, now + duration);
        filter.Q.setValueAtTime(2, now);

        // Configure envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Connect nodes
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGainNode);

        // Start and stop
        oscillator.start(now);
        oscillator.stop(now + duration);

        // Cleanup
        oscillator.onended = () => {
            oscillator.disconnect();
            filter.disconnect();
            gainNode.disconnect();
        };
    }

    public playHitExplosion(): void {
        const now = this.audioContext.currentTime;
        const duration = 0.8; // Shorter duration for hit explosion

        // Create noise generator
        const noise = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        const noiseFilter = this.audioContext.createBiquadFilter();
        
        // Generate white noise
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;

        // Configure noise filter - higher frequency range for hit explosion
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(400, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(50, now + duration);
        noiseFilter.Q.setValueAtTime(1, now);

        // Configure noise envelope - shorter attack and lower volume
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.4, now + 0.02);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Create low frequency oscillator for rumble
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(20, now);
        lfo.frequency.exponentialRampToValueAtTime(10, now + duration);
        lfoGain.gain.setValueAtTime(0.3, now);
        lfoGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Connect nodes
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGainNode);
        lfo.connect(lfoGain);
        lfoGain.connect(this.masterGainNode);

        // Start and stop sounds
        noise.start(now);
        noise.stop(now + duration);
        lfo.start(now);
        lfo.stop(now + duration);

        // Clean up nodes after they're done
        noise.onended = () => {
            noise.disconnect();
            noiseFilter.disconnect();
            noiseGain.disconnect();
        };
        lfo.onended = () => {
            lfo.disconnect();
            lfoGain.disconnect();
        };
    }

    public playDeathExplosion(): void {
        const now = this.audioContext.currentTime;
        const duration = 2.0; // Longer duration for death explosion

        // Create noise generator
        const noise = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        const noiseFilter = this.audioContext.createBiquadFilter();
        
        // Generate white noise
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;

        // Configure noise filter - much lower frequency range
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(200, now);  // Much lower starting frequency
        noiseFilter.frequency.exponentialRampToValueAtTime(20, now + duration);  // Much lower ending frequency
        noiseFilter.Q.setValueAtTime(1, now);

        // Configure noise envelope - longer attack and higher volume
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.8, now + 0.05);  // Longer attack and higher volume
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Create low frequency oscillator for rumble - more prominent
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(30, now);  // Higher starting frequency
        lfo.frequency.exponentialRampToValueAtTime(15, now + duration);  // Higher ending frequency
        lfoGain.gain.setValueAtTime(0.8, now);  // Increased volume
        lfoGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Add a second low frequency oscillator for more bass content
        const lfo2 = this.audioContext.createOscillator();
        const lfo2Gain = this.audioContext.createGain();
        lfo2.type = 'sine';
        lfo2.frequency.setValueAtTime(30, now);
        lfo2.frequency.exponentialRampToValueAtTime(10, now + duration);
        lfo2Gain.gain.setValueAtTime(0.6, now);  // Increased volume
        lfo2Gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Add a frequency sweep oscillator for the main explosion sound
        const sweepOsc = this.audioContext.createOscillator();
        const sweepGain = this.audioContext.createGain();
        const sweepFilter = this.audioContext.createBiquadFilter();
        
        sweepOsc.type = 'sine';
        sweepOsc.frequency.setValueAtTime(100, now);  // Start at lower frequency
        sweepOsc.frequency.exponentialRampToValueAtTime(20, now + duration);  // Sweep down to very low frequency
        
        sweepFilter.type = 'lowpass';
        sweepFilter.frequency.setValueAtTime(500, now);  // Lower filter frequency
        sweepFilter.frequency.exponentialRampToValueAtTime(50, now + duration);  // Lower ending frequency
        
        sweepGain.gain.setValueAtTime(0, now);
        sweepGain.gain.linearRampToValueAtTime(0.8, now + 0.01);  // Quick attack and higher volume
        sweepGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Connect nodes
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGainNode);
        lfo.connect(lfoGain);
        lfoGain.connect(this.masterGainNode);
        lfo2.connect(lfo2Gain);
        lfo2Gain.connect(this.masterGainNode);
        sweepOsc.connect(sweepFilter);
        sweepFilter.connect(sweepGain);
        sweepGain.connect(this.masterGainNode);

        // Start and stop sounds
        noise.start(now);
        noise.stop(now + duration);
        lfo.start(now);
        lfo.stop(now + duration);
        lfo2.start(now);
        lfo2.stop(now + duration);
        sweepOsc.start(now);
        sweepOsc.stop(now + duration);

        // Clean up nodes after they're done
        noise.onended = () => {
            noise.disconnect();
            noiseFilter.disconnect();
            noiseGain.disconnect();
        };
        lfo.onended = () => {
            lfo.disconnect();
            lfoGain.disconnect();
        };
        lfo2.onended = () => {
            lfo2.disconnect();
            lfo2Gain.disconnect();
        };
        sweepOsc.onended = () => {
            sweepOsc.disconnect();
            sweepFilter.disconnect();
            sweepGain.disconnect();
        };
    }

    public cleanup(): void {
        this.audioContext.close();
    }
} 