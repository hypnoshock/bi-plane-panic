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
    private currentBeat: number = 0;
    private lastProcessedBeat: number = -1;
    private lastUpdateTime: number = 0;
    private musicOscillator: OscillatorNode | null = null;
    private musicGain: GainNode | null = null;
    private musicFilter: BiquadFilterNode | null = null;
    private bassOscillator: OscillatorNode | null = null;
    private bassGain: GainNode | null = null;
    private bassFilter: BiquadFilterNode | null = null;
    private activeNotes: Set<number> = new Set();
    private activeBassNotes: Set<number> = new Set();

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
            console.log('play kick');
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

        this.isPlaying = true;
        this.startTime = this.audioSystem.getAudioContext().currentTime;
        this.lastUpdateTime = this.startTime;
        this.currentBeat = 0;
        this.lastProcessedBeat = -1;
        this.activeNotes.clear();
        this.activeBassNotes.clear();

        this.setupAudioNodes();

        // Start oscillators
        if (this.musicOscillator) {
            this.musicOscillator.start(this.startTime);
        }
        if (this.bassOscillator) {
            this.bassOscillator.start(this.startTime);
        }
    }

    public update(): void {
        if (!this.isPlaying || !this.currentTrack) return;

        const currentTime = this.audioSystem.getAudioContext().currentTime;
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;

        // Calculate current beat based on elapsed time
        const beatsPerSecond = this.currentTrack.bpm / 60;
        const newBeat = Math.floor((currentTime - this.startTime) * beatsPerSecond);
        
        // Handle loop
        const totalBeats = Math.max(
            Math.max(...this.currentTrack.tracks.melody.map(n => n.beat)),
            this.currentTrack.tracks.bass ? Math.max(...this.currentTrack.tracks.bass.map(n => n.beat)) : 0,
            Math.max(...this.currentTrack.tracks.drums.kick),
            Math.max(...this.currentTrack.tracks.drums.hihat)
        ) + 1;

        if (newBeat >= totalBeats) {
            this.currentBeat = 0;
            this.startTime = currentTime;
            this.lastProcessedBeat = -1;
        } else {
            this.currentBeat = newBeat;
        }

        // Only process if we've moved to a new beat
        if (this.currentBeat <= this.lastProcessedBeat) {
            return;
        }

        // Play notes that should start on this beat
        const melodyNote = this.currentTrack.tracks.melody.find(n => n.beat === this.currentBeat);
        if (melodyNote && !this.activeNotes.has(this.currentBeat)) {
            this.playNote(melodyNote, currentTime);
            this.activeNotes.add(this.currentBeat);
        }

        if (this.currentTrack.tracks.bass) {
            const bassNote = this.currentTrack.tracks.bass.find(n => n.beat === this.currentBeat);
            if (bassNote && !this.activeBassNotes.has(this.currentBeat)) {
                this.playBassNote(bassNote, currentTime);
                this.activeBassNotes.add(this.currentBeat);
            }
        }

        // Play drums
        this.playDrums(this.currentBeat, currentTime);

        // Mark this beat as processed
        this.lastProcessedBeat = this.currentBeat;

        // Clean up old notes from active sets
        const beatDuration = 60 / this.currentTrack.bpm;
        const maxNoteDuration = Math.max(
            ...this.currentTrack.tracks.melody.map(n => n.duration),
            this.currentTrack.tracks.bass ? Math.max(...this.currentTrack.tracks.bass.map(n => n.duration)) : 0
        );
        const cleanupThreshold = this.currentBeat - Math.ceil(maxNoteDuration);

        for (const beat of this.activeNotes) {
            if (beat < cleanupThreshold) {
                this.activeNotes.delete(beat);
            }
        }

        for (const beat of this.activeBassNotes) {
            if (beat < cleanupThreshold) {
                this.activeBassNotes.delete(beat);
            }
        }
    }

    public stop(): void {
        this.isPlaying = false;
        this.cleanupAudioNodes();
        this.activeNotes.clear();
        this.activeBassNotes.clear();
    }

    public cleanup(): void {
        this.stop();
    }

    public getCurrentBeat(): number {
        return this.currentBeat;
    }
} 