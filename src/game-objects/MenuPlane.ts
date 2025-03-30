import { GLBModel } from '../assets/game-models/GLBModel';
import * as THREE from 'three';
import { MusicSystem } from '../systems/MusicSystem';

export class MenuPlane {
    private model: GLBModel;
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
        
        this.model = new GLBModel('assets/bi-plane2.glb');
        this.model.setColor(color);
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
                this.group.rotation.z = Math.sin(currentBeat * 2) * 0.3;
                this.group.rotation.x = Math.cos(currentBeat * 2) * 0.2;
                break;
            
            case 1: // Figure 8 motion
                const figure8Radius = 1.5;
                const figure8Angle = currentBeat * Math.PI + this.beatOffset;
                this.group.position.x = this.basePosition.x + Math.sin(figure8Angle) * figure8Radius;
                this.group.position.z = this.basePosition.z + Math.sin(figure8Angle / 2) * figure8Radius;
                this.group.rotation.y = figure8Angle + Math.PI / 2;
                this.group.rotation.z = Math.sin(figure8Angle) * 0.4;
                this.group.rotation.x = Math.cos(figure8Angle) * 0.3;
                break;
            
            case 2: // Wave motion
                const waveHeight = 1;
                const waveSpeed = 2;
                this.group.position.y = this.basePosition.y + Math.sin(currentBeat * waveSpeed + this.beatOffset) * waveHeight;
                this.group.rotation.x = Math.sin(currentBeat * waveSpeed + this.beatOffset) * 0.3;
                this.group.rotation.z = Math.cos(currentBeat * waveSpeed + this.beatOffset) * 0.4;
                this.group.rotation.y = Math.sin(currentBeat * waveSpeed * 0.5 + this.beatOffset) * 0.5;
                break;
            
            case 3: // Spiral motion
                const spiralRadius = 1 + currentBeat * 0.1;
                const spiralAngle = currentBeat * Math.PI + this.beatOffset;
                this.group.position.x = this.basePosition.x + Math.cos(spiralAngle) * spiralRadius;
                this.group.position.z = this.basePosition.z + Math.sin(spiralAngle) * spiralRadius;
                this.group.position.y = this.basePosition.y + currentBeat * 0.5;
                this.group.rotation.y = spiralAngle + Math.PI / 2;
                this.group.rotation.z = Math.sin(spiralAngle) * 0.4;
                this.group.rotation.x = Math.cos(spiralAngle) * 0.3;
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