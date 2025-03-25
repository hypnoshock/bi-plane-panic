import * as THREE from 'three';
import { Explosion } from '../game-objects/Explosion';
import { AudioSystem } from './AudioSystem';

export class ExplosionSystem {
    private explosions: Explosion[] = [];
    private scene: THREE.Scene;
    private audioSystem: AudioSystem;

    constructor(scene: THREE.Scene, audioSystem: AudioSystem) {
        this.scene = scene;
        this.audioSystem = audioSystem;
    }

    public spawnExplosion(position: THREE.Vector3): void {
        const explosion = new Explosion();
        explosion.setPosition(position.x, position.y, position.z);
        this.scene.add(explosion.getGroup());
        this.explosions.push(explosion);
        
        // Play explosion sound effect
        this.audioSystem.playExplosion();
        
        console.log('Current active explosions:', this.explosions.length);
    }

    public update(deltaTime: number): void {
        // Update all explosions and remove finished ones
        this.explosions = this.explosions.filter(explosion => {
            const isActive = explosion.update(deltaTime);
            if (!isActive) {
                console.log('Removing finished explosion');
                this.scene.remove(explosion.getGroup());
            }
            return isActive;
        });
    }

    public cleanup(): void {
        this.explosions.forEach(explosion => {
            this.scene.remove(explosion.getGroup());
        });
        this.explosions = [];
    }
} 