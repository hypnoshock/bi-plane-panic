import { AudioSystem } from './AudioSystem';

interface Note {
    beat: number;
    frequency: number;
    duration: number;
}

interface Drums {
    kick: number[];
    hihat: number[];
    clap?: number[];
}

interface MusicTrack {
    title: string;
    bpm: number;
    tracks: {
        melody: Note[];
        bass?: Note[];
        drums: Drums;
    };
}

export class MusicSystem {
    private audioSystem: AudioSystem;
    private currentTrack: MusicTrack | null = null;
    private isPlaying: boolean = false;
    private startTime: number = 0;
    private musicOscillator: OscillatorNode | null = null;
    private musicGain: GainNode | null = null;
    private musicFilter: BiquadFilterNode | null = null;
    private bassOscillator: OscillatorNode | null = null;
    private bassGain: GainNode | null = null;
    private bassFilter: BiquadFilterNode | null = null;

    constructor(audioSystem: AudioSystem) {
        this.audioSystem = audioSystem;
    }

    public async loadTrack(filename: string): Promise<void> {
        try {
            const response = await fetch(`assets/music/${filename}`);
            this.currentTrack = await response.json();
        } catch (error) {
            console.error('Error loading music track:', error);
        }
    }

    private setupAudioNodes(): void {
        if (!this.currentTrack) return;

        // Create main oscillator for melody
        this.musicOscillator = this.audioSystem.getAudioContext().createOscillator();
        this.musicGain = this.audioSystem.getAudioContext().createGain();
        this.musicFilter = this.audioSystem.getAudioContext().createBiquadFilter();

        // Configure filter for melody
        this.musicFilter.type = 'lowpass';
        this.musicFilter.frequency.setValueAtTime(2000, this.audioSystem.getAudioContext().currentTime);
        this.musicFilter.Q.setValueAtTime(1, this.audioSystem.getAudioContext().currentTime);

        // Configure gain for melody
        this.musicGain.gain.setValueAtTime(0.2, this.audioSystem.getAudioContext().currentTime);

        // Connect melody nodes
        this.musicOscillator.connect(this.musicFilter);
        this.musicFilter.connect(this.musicGain);
        this.musicGain.connect(this.audioSystem.getMusicGainNode());

        // Create bass oscillator if track has bass
        if (this.currentTrack.tracks.bass) {
            this.bassOscillator = this.audioSystem.getAudioContext().createOscillator();
            this.bassGain = this.audioSystem.getAudioContext().createGain();
            this.bassFilter = this.audioSystem.getAudioContext().createBiquadFilter();

            // Configure filter for bass
            this.bassFilter.type = 'lowpass';
            this.bassFilter.frequency.setValueAtTime(500, this.audioSystem.getAudioContext().currentTime);
            this.bassFilter.Q.setValueAtTime(1, this.audioSystem.getAudioContext().currentTime);

            // Configure gain for bass
            this.bassGain.gain.setValueAtTime(0.15, this.audioSystem.getAudioContext().currentTime);

            // Connect bass nodes
            this.bassOscillator.connect(this.bassFilter);
            this.bassFilter.connect(this.bassGain);
            this.bassGain.connect(this.audioSystem.getMusicGainNode());
        }
    }

    private cleanupAudioNodes(): void {
        if (this.musicOscillator) {
            this.musicOscillator.stop(this.audioSystem.getAudioContext().currentTime);
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
            this.bassOscillator.stop(this.audioSystem.getAudioContext().currentTime);
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

    private playNote(note: Note, time: number): void {
        if (!this.musicOscillator || !this.musicFilter || !this.musicGain || !this.currentTrack) return;

        const beatDuration = 60 / this.currentTrack.bpm;
        const noteDuration = beatDuration * note.duration;
        const frequency = note.frequency;
        
        // Set up note envelope
        this.musicGain.gain.setValueAtTime(0, time);
        this.musicGain.gain.linearRampToValueAtTime(0.2, time + 0.01); // Quick attack
        this.musicGain.gain.linearRampToValueAtTime(0, time + noteDuration); // Release at note end
        
        this.musicOscillator.frequency.setValueAtTime(frequency, time);
        this.musicFilter.frequency.setValueAtTime(2000, time);
        this.musicFilter.frequency.exponentialRampToValueAtTime(1000, time + noteDuration);
    }

    private playBassNote(note: Note, time: number): void {
        if (!this.bassOscillator || !this.bassFilter || !this.bassGain || !this.currentTrack) return;

        const beatDuration = 60 / this.currentTrack.bpm;
        const noteDuration = beatDuration * note.duration;
        const frequency = note.frequency;
        
        // Set up note envelope
        this.bassGain.gain.setValueAtTime(0, time);
        this.bassGain.gain.linearRampToValueAtTime(0.15, time + 0.01); // Quick attack
        this.bassGain.gain.linearRampToValueAtTime(0, time + noteDuration); // Release at note end
        
        this.bassOscillator.frequency.setValueAtTime(frequency, time);
        this.bassFilter.frequency.setValueAtTime(500, time);
        this.bassFilter.frequency.exponentialRampToValueAtTime(200, time + noteDuration);
    }

    private playDrums(beat: number, time: number): void {
        if (!this.currentTrack) return;

        const { kick, hihat, clap } = this.currentTrack.tracks.drums;
        if (kick.includes(beat)) {
            this.audioSystem.playKick(time);
        }
        if (hihat.includes(beat)) {
            this.audioSystem.playHiHat(time);
        }
        if (clap?.includes(beat)) {
            this.audioSystem.playClap(time);
        }
    }

    public play(): void {
        if (!this.currentTrack || this.isPlaying) return;

        if (!this.audioSystem.isReady) {
            this.audioSystem.setReadyCallback(() => {
                this.play();
            });
            return;
        }

        this.isPlaying = true;
        this.startTime = this.audioSystem.getAudioContext().currentTime;
        this.lastBeat = 0;

        this.setupAudioNodes();

        // Start oscillators
        if (this.musicOscillator) {
            this.musicOscillator.start(this.startTime);
        }
        if (this.bassOscillator) {
            this.bassOscillator.start(this.startTime);
        }

        // Schedule all notes
        const beatDuration = 60 / this.currentTrack.bpm;
        const totalBeats = Math.max(
            Math.max(...this.currentTrack.tracks.melody.map(n => n.beat)),
            this.currentTrack.tracks.bass ? Math.max(...this.currentTrack.tracks.bass.map(n => n.beat)) : 0,
            Math.max(...this.currentTrack.tracks.drums.kick),
            Math.max(...this.currentTrack.tracks.drums.hihat)
        ) + 1;

        for (let beat = 0; beat < totalBeats; beat++) {
            const time = this.startTime + beat * beatDuration;

            // Play melody notes
            const melodyNote = this.currentTrack.tracks.melody.find(n => n.beat === beat);
            if (melodyNote) {
                this.playNote(melodyNote, time);
            }

            // Play bass notes
            if (this.currentTrack.tracks.bass) {
                const bassNote = this.currentTrack.tracks.bass.find(n => n.beat === beat);
                if (bassNote) {
                    this.playBassNote(bassNote, time);
                }
            }

            // Play drums
            this.playDrums(beat, time);
        }

        // Schedule loop
        const loopDuration = totalBeats * beatDuration;
        setTimeout(() => {
            if (this.isPlaying) {
                console.log('looping');
                this.stop();
                this.play();
            }
        }, loopDuration * 1000);
    }

    public stop(): void {
        this.isPlaying = false;
        this.cleanupAudioNodes();
    }

    public cleanup(): void {
        this.stop();
        if (!this.audioSystem.isReady) {
            this.audioSystem.clearReadyCallback();
        }
    }

    public getCurrentBeat(): number {
        if (!this.isPlaying || !this.currentTrack) return 0;
        
        const currentTime = this.audioSystem.getAudioContext().currentTime;
        const elapsedTime = currentTime - this.startTime;
        const beatsPerSecond = this.currentTrack.bpm / 60;
        return Math.floor(elapsedTime * beatsPerSecond);
    }
} 