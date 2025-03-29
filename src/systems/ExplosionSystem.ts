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
        const explosion = new Explosion(false); // false for hit explosion
        explosion.setPosition(position.x, position.y, position.z);
        this.scene.add(explosion.getGroup());
        this.explosions.push(explosion);
        
        // Play hit explosion sound effect
        this.audioSystem.playHitExplosion();
        
        console.log('Current active explosions:', this.explosions.length);
    }

    public spawnDeathExplosion(position: THREE.Vector3): void {
        const explosion = new Explosion(true); // true for death explosion
        explosion.setPosition(position.x, position.y, position.z);
        this.scene.add(explosion.getGroup());
        this.explosions.push(explosion);
        
        // Play death explosion sound effect
        this.audioSystem.playDeathExplosion();
        
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