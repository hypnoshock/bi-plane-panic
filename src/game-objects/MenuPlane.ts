import { PlaneModel } from '../assets/game-models/PlaneModel';
import * as THREE from 'three';
import { MusicSystem } from '../systems/MusicSystem';

export class MenuPlane {
    private model: PlaneModel;
    private group: THREE.Group;
    private basePosition: THREE.Vector3;
    private baseRotation: THREE.Euler;
    private color: number;
    private beatOffset: number;
    private dancePattern: number;

    constructor(color: number, position: THREE.Vector3, rotation: THREE.Euler, beatOffset: number, dancePattern: number) {
        this.color = color;
        this.basePosition = position;
        this.baseRotation = rotation;
        this.beatOffset = beatOffset;
        this.dancePattern = dancePattern;
        
        this.model = new PlaneModel(color);
        this.group = new THREE.Group();
        this.group.add(this.model.getGroup());
        this.group.position.copy(position);
        this.group.rotation.copy(rotation);
    }

    public getGroup(): THREE.Group {
        return this.group;
    }

    public update(musicSystem: MusicSystem): void {
        const currentBeat = musicSystem.getCurrentBeat();
        
        // Different dance patterns based on the pattern number
        switch (this.dancePattern) {
            case 0: // Circular motion
                const radius = 2;
                const angle = currentBeat * Math.PI / 2 + this.beatOffset;
                this.group.position.x = this.basePosition.x + Math.cos(angle) * radius;
                this.group.position.z = this.basePosition.z + Math.sin(angle) * radius;
                this.group.rotation.y = angle + Math.PI / 2;
                break;
            
            case 1: // Figure 8 motion
                const figure8Radius = 1.5;
                const figure8Angle = currentBeat * Math.PI + this.beatOffset;
                this.group.position.x = this.basePosition.x + Math.sin(figure8Angle) * figure8Radius;
                this.group.position.z = this.basePosition.z + Math.sin(figure8Angle / 2) * figure8Radius;
                this.group.rotation.y = figure8Angle + Math.PI / 2;
                break;
            
            case 2: // Wave motion
                const waveHeight = 1;
                const waveSpeed = 2;
                this.group.position.y = this.basePosition.y + Math.sin(currentBeat * waveSpeed + this.beatOffset) * waveHeight;
                this.group.rotation.x = Math.sin(currentBeat * waveSpeed + this.beatOffset) * 0.3;
                break;
            
            case 3: // Spiral motion
                const spiralRadius = 1 + currentBeat * 0.1;
                const spiralAngle = currentBeat * Math.PI + this.beatOffset;
                this.group.position.x = this.basePosition.x + Math.cos(spiralAngle) * spiralRadius;
                this.group.position.z = this.basePosition.z + Math.sin(spiralAngle) * spiralRadius;
                this.group.position.y = this.basePosition.y + currentBeat * 0.5;
                this.group.rotation.y = spiralAngle + Math.PI / 2;
                break;
        }

        // Add some gentle bobbing motion
        this.group.position.y += Math.sin(Date.now() * 0.001 + this.beatOffset) * 0.1;

        // Pulse the color with the beat
        const pulseIntensity = 0.3;
        const pulseColor = new THREE.Color(this.color);
        const brightness = 1 + Math.sin(currentBeat * Math.PI / 2) * pulseIntensity;
        pulseColor.r *= brightness;
        pulseColor.g *= brightness;
        pulseColor.b *= brightness;
        this.model.setColor(pulseColor.getHex());
    }
} 