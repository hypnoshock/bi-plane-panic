import * as THREE from 'three';
import { SmokeParticle } from '../game-objects/SmokeParticle';

export class SmokeSystem {
    private particles: SmokeParticle[] = [];
    private scene: THREE.Scene;
    private spawnTimer: number = 0;
    private spawnInterval: number = 0.1; // Spawn a particle every 0.1 seconds

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    public spawnSmoke(position: THREE.Vector3, color: number = 0x808080): void {
        const particle = new SmokeParticle(color);
        
        // Random velocity for natural smoke movement
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5, // Random X velocity
            (Math.random() - 0.5) * 0.5, // Random Y velocity
            (Math.random() - 0.5) * 0.5  // Random Z velocity
        );

        particle.setInitialPosition(position, velocity);
        this.scene.add(particle.getMesh());
        this.particles.push(particle);
    }

    public update(deltaTime: number): void {
        // Update all particles and remove finished ones
        this.particles = this.particles.filter(particle => {
            const isActive = particle.update(deltaTime);
            if (!isActive) {
                this.scene.remove(particle.getMesh());
            }
            return isActive;
        });
    }

    public cleanup(): void {
        this.particles.forEach(particle => {
            this.scene.remove(particle.getMesh());
        });
        this.particles = [];
    }
} 