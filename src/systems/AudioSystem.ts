export class AudioSystem {
    private audioContext: AudioContext;
    private masterGainNode: GainNode;
    private musicGainNode: GainNode;
    private drumGainNode: GainNode;
    private isMenuMusicPlaying: boolean = false;

    constructor() {
        this.audioContext = new AudioContext();
        this.masterGainNode = this.audioContext.createGain();
        this.musicGainNode = this.audioContext.createGain();
        this.drumGainNode = this.audioContext.createGain();
        this.masterGainNode.connect(this.audioContext.destination);
        this.musicGainNode.connect(this.masterGainNode);
        this.drumGainNode.connect(this.masterGainNode);
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
        const duration = 1.5; // Duration of the explosion sound

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

        // Configure noise filter - lower frequency range
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(400, now);  // Lower starting frequency
        noiseFilter.frequency.exponentialRampToValueAtTime(50, now + duration);  // Lower ending frequency
        noiseFilter.Q.setValueAtTime(1, now);

        // Configure noise envelope - slightly longer attack
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.4, now + 0.02);  // Slightly longer attack
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Create low frequency oscillator for rumble - more prominent
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(20, now);  // Higher starting frequency
        lfo.frequency.exponentialRampToValueAtTime(10, now + duration);  // Higher ending frequency
        lfoGain.gain.setValueAtTime(0.5, now);  // Increased volume
        lfoGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Add a second low frequency oscillator for more bass content
        const lfo2 = this.audioContext.createOscillator();
        const lfo2Gain = this.audioContext.createGain();
        lfo2.type = 'sine';
        lfo2.frequency.setValueAtTime(20, now);
        lfo2.frequency.exponentialRampToValueAtTime(5, now + duration);
        lfo2Gain.gain.setValueAtTime(0.3, now);
        lfo2Gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Add a frequency sweep oscillator for the main explosion sound
        const sweepOsc = this.audioContext.createOscillator();
        const sweepGain = this.audioContext.createGain();
        const sweepFilter = this.audioContext.createBiquadFilter();
        
        sweepOsc.type = 'sine';
        sweepOsc.frequency.setValueAtTime(200, now);  // Start at mid frequency
        sweepOsc.frequency.exponentialRampToValueAtTime(30, now + duration);  // Sweep down to low frequency
        
        sweepFilter.type = 'lowpass';
        sweepFilter.frequency.setValueAtTime(1000, now);
        sweepFilter.frequency.exponentialRampToValueAtTime(100, now + duration);
        
        sweepGain.gain.setValueAtTime(0, now);
        sweepGain.gain.linearRampToValueAtTime(0.6, now + 0.01);  // Quick attack
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