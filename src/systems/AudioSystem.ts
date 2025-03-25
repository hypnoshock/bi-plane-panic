export class AudioSystem {
    private audioContext: AudioContext;
    private masterGainNode: GainNode;
    private musicGainNode: GainNode;
    private musicOscillator: OscillatorNode | null = null;
    private musicGain: GainNode | null = null;
    private musicFilter: BiquadFilterNode | null = null;
    private bassOscillator: OscillatorNode | null = null;
    private bassGain: GainNode | null = null;
    private bassFilter: BiquadFilterNode | null = null;
    private drumGainNode: GainNode;
    private isMusicPlaying: boolean = false;
    private menuOscillator: OscillatorNode | null = null;
    private menuGain: GainNode | null = null;
    private menuFilter: BiquadFilterNode | null = null;
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

    private playKick(time: number): void {
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

    private playHiHat(time: number): void {
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

    public playMusic(): void {
        if (this.isMusicPlaying) return;
        this.isMusicPlaying = true;

        // Create main oscillator for melody
        this.musicOscillator = this.audioContext.createOscillator();
        this.musicGain = this.audioContext.createGain();
        this.musicFilter = this.audioContext.createBiquadFilter();

        // Create bass oscillator
        this.bassOscillator = this.audioContext.createOscillator();
        this.bassGain = this.audioContext.createGain();
        this.bassFilter = this.audioContext.createBiquadFilter();

        // Configure filters
        this.musicFilter.type = 'lowpass';
        this.musicFilter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        this.musicFilter.Q.setValueAtTime(1, this.audioContext.currentTime);

        this.bassFilter.type = 'lowpass';
        this.bassFilter.frequency.setValueAtTime(500, this.audioContext.currentTime);
        this.bassFilter.Q.setValueAtTime(1, this.audioContext.currentTime);

        // Configure gains
        this.musicGain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        this.bassGain.gain.setValueAtTime(0.15, this.audioContext.currentTime);

        // Connect nodes
        this.musicOscillator.connect(this.musicFilter);
        this.musicFilter.connect(this.musicGain);
        this.musicGain.connect(this.musicGainNode);

        this.bassOscillator.connect(this.bassFilter);
        this.bassFilter.connect(this.bassGain);
        this.bassGain.connect(this.musicGainNode);

        // Define melody notes (in Hz)
        const melody = [
            220, 277.18, 329.63, 440,  // A3, C#4, E4, A4
            220, 277.18, 329.63, 440,  // A3, C#4, E4, A4
            246.94, 293.66, 349.23, 493.88,  // B3, D4, F4, B4
            246.94, 293.66, 349.23, 493.88,  // B3, D4, F4, B4
            220, 277.18, 329.63, 440,  // A3, C#4, E4, A4
            220, 277.18, 329.63, 440,  // A3, C#4, E4, A4
            246.94, 293.66, 349.23, 493.88,  // B3, D4, F4, B4
            246.94, 293.66, 349.23, 493.88   // B3, D4, F4, B4
        ];

        // Create bass notes (one octave lower)
        const bassNotes = melody.map(note => note / 2);

        // Create a repeating melody
        let time = this.audioContext.currentTime;
        const noteDuration = 0.25; // Duration of each note in seconds
        const bassNoteDuration = noteDuration * 2; // Bass notes are twice as long

        const playNote = (noteIndex: number) => {
            if (!this.isMusicPlaying) return;

            const frequency = melody[noteIndex];
            const bassFrequency = bassNotes[noteIndex];

            // Update melody
            this.musicOscillator!.frequency.setValueAtTime(frequency, time);
            this.musicFilter!.frequency.setValueAtTime(2000, time);
            this.musicFilter!.frequency.exponentialRampToValueAtTime(1000, time + noteDuration);

            // Update bass (only on even indices since it's half speed)
            if (noteIndex % 2 === 0) {
                this.bassOscillator!.frequency.setValueAtTime(bassFrequency, time);
                this.bassFilter!.frequency.setValueAtTime(500, time);
                this.bassFilter!.frequency.exponentialRampToValueAtTime(200, time + bassNoteDuration);
            }

            // Play drums
            if (noteIndex % 4 === 0 || noteIndex % 4 === 2) {
                this.playKick(time);
            }
            this.playHiHat(time);

            // Schedule next note
            time += noteDuration;
            if (noteIndex < melody.length - 1) {
                setTimeout(() => playNote(noteIndex + 1), noteDuration * 1000);
            } else {
                // Loop back to start
                setTimeout(() => playNote(0), noteDuration * 1000);
            }
        };

        // Start both oscillators
        this.musicOscillator.start(time);
        this.bassOscillator.start(time);
        playNote(0);
    }

    public stopMusic(): void {
        if (!this.isMusicPlaying) return;
        this.isMusicPlaying = false;

        if (this.musicOscillator) {
            this.musicOscillator.stop(this.audioContext.currentTime);
            this.musicOscillator.disconnect();
            this.musicOscillator = null;
        }
        if (this.musicGain) {
            this.musicGain.disconnect();
            this.musicGain = null;
        }
        if (this.musicFilter) {
            this.musicFilter.disconnect();
            this.musicFilter = null;
        }
        if (this.bassOscillator) {
            this.bassOscillator.stop(this.audioContext.currentTime);
            this.bassOscillator.disconnect();
            this.bassOscillator = null;
        }
        if (this.bassGain) {
            this.bassGain.disconnect();
            this.bassGain = null;
        }
        if (this.bassFilter) {
            this.bassFilter.disconnect();
            this.bassFilter = null;
        }
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

    public playMenuMusic(): void {
        if (this.isMenuMusicPlaying) return;
        this.isMenuMusicPlaying = true;

        // Create main oscillator for menu melody
        this.menuOscillator = this.audioContext.createOscillator();
        this.menuGain = this.audioContext.createGain();
        this.menuFilter = this.audioContext.createBiquadFilter();

        // Configure filter for a gentle, ambient sound
        this.menuFilter.type = 'lowpass';
        this.menuFilter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        this.menuFilter.Q.setValueAtTime(1, this.audioContext.currentTime);

        // Configure gain for a softer sound
        this.menuGain.gain.setValueAtTime(0.15, this.audioContext.currentTime);

        // Connect nodes
        this.menuOscillator.connect(this.menuFilter);
        this.menuFilter.connect(this.menuGain);
        this.menuGain.connect(this.masterGainNode);

        // Define menu melody notes (in Hz) - gentle, ambient progression, one octave lower
        const melody = [
            196, 220, 246.94, 293.66,  // G3, A3, B3, D4
            196, 220, 246.94, 293.66,  // G3, A3, B3, D4
            220, 246.94, 293.66, 349.23,  // A3, B3, D4, F4
            220, 246.94, 293.66, 349.23,  // A3, B3, D4, F4
            196, 220, 246.94, 293.66,  // G3, A3, B3, D4
            196, 220, 246.94, 293.66,  // G3, A3, B3, D4
            220, 246.94, 293.66, 349.23,  // A3, B3, D4, F4
            220, 246.94, 293.66, 349.23   // A3, B3, D4, F4
        ];

        // Create a repeating melody
        let time = this.audioContext.currentTime;
        const noteDuration = 1.0; // Slower, more ambient pace

        const playNote = (noteIndex: number) => {
            if (!this.isMenuMusicPlaying) return;

            const frequency = melody[noteIndex];
            this.menuOscillator!.frequency.setValueAtTime(frequency, time);
            
            // Add gentle filter modulation
            this.menuFilter!.frequency.setValueAtTime(2000, time);
            this.menuFilter!.frequency.exponentialRampToValueAtTime(1500, time + noteDuration);

            // Play drums - kick on every other note, hi-hat on every note
            if (noteIndex % 2 === 0) {
                this.playKick(time);
            }
            this.playHiHat(time);

            // Schedule next note
            time += noteDuration;
            if (noteIndex < melody.length - 1) {
                setTimeout(() => playNote(noteIndex + 1), noteDuration * 1000);
            } else {
                // Loop back to start
                setTimeout(() => playNote(0), noteDuration * 1000);
            }
        };

        // Start the melody
        this.menuOscillator.start(time);
        playNote(0);
    }

    public stopMenuMusic(): void {
        if (!this.isMenuMusicPlaying) return;
        this.isMenuMusicPlaying = false;

        if (this.menuOscillator) {
            this.menuOscillator.stop(this.audioContext.currentTime);
            this.menuOscillator.disconnect();
            this.menuOscillator = null;
        }
        if (this.menuGain) {
            this.menuGain.disconnect();
            this.menuGain = null;
        }
        if (this.menuFilter) {
            this.menuFilter.disconnect();
            this.menuFilter = null;
        }
    }

    public cleanup(): void {
        this.stopMusic();
        this.stopMenuMusic();
        this.audioContext.close();
    }
} 