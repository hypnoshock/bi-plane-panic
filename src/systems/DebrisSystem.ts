import * as THREE from 'three';
import { DebrisParticle } from '../game-objects/DebrisParticle';

export class DebrisSystem {
    private debris: DebrisParticle[] = [];
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    public spawnDebris(position: THREE.Vector3, numParticles: number = 12): void {
        for (let i = 0; i < numParticles; i++) {
            const particle = new DebrisParticle(0x808080);
            
            // Calculate position in a circular pattern
            const angle = (i / numParticles) * Math.PI * 2;
            const radius = 0.5; // Initial radius
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = (Math.random() - 0.5) * radius;
            
            // Calculate velocity (outward from center)
            const speed = 2 + Math.random() * 2; // Random speed between 2 and 4
            const velocity = new THREE.Vector3(x, y, z).normalize().multiplyScalar(speed);
            
            // Add some randomness to the velocity
            velocity.x += (Math.random() - 0.5) * 0.5;
            velocity.y += (Math.random() - 0.5) * 0.5;
            velocity.z += (Math.random() - 0.5) * 0.5;
            
            particle.setInitialPosition(
                new THREE.Vector3(x, y, z).add(position),
                velocity
            );
            
            this.scene.add(particle.getMesh());
            this.debris.push(particle);
        }
    }

    public update(deltaTime: number): void {
        // Update all debris particles and remove finished ones
        this.debris = this.debris.filter(particle => {
            const isActive = particle.update(deltaTime);
            if (!isActive) {
                this.scene.remove(particle.getMesh());
            }
            return isActive;
        });
    }

    public cleanup(): void {
        this.debris.forEach(particle => {
            this.scene.remove(particle.getMesh());
        });
        this.debris = [];
    }
} 